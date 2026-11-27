import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../notification/mail.service';
import { TicketService } from '../ticket/ticket.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { assertBookingAccess, JwtUser } from '../booking/booking.service';
import {
  BookingStatus,
  BookingSeatStatus,
  PaymentStatus,
} from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketService: TicketService,
    private readonly config: ConfigService,
    @Optional() private readonly mail?: MailService,
  ) {}

  /**
   * Xác nhận thanh toán (Mock / Demo VietQR / Thẻ) và tự động xuất vé điện tử kèm QR
   */
  async confirmPayment(dto: ConfirmPaymentDto, user?: JwtUser | null) {
    // Endpoint này là thanh toán GIẢ (không có cổng thanh toán xác thực).
    // shortcut: chỉ dùng cho dev/demo; production cần IPN/webhook có chữ ký từ VNPay/Stripe.
    if (this.config.get<string>('PAYMENT_MOCK_ENABLED') !== 'true') {
      throw new ForbiddenException('Thanh toán giả đã bị tắt trên môi trường này.');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode: dto.bookingCode },
      include: {
        payment: true,
        bookingSeats: true,
        passengers: { select: { phone: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Không tìm thấy đơn đặt vé với mã: ${dto.bookingCode}`,
      );
    }

    assertBookingAccess(booking, user, dto.phone);

    // Nếu đã thanh toán thành công trước đó -> trả về thông tin vé luôn
    if (booking.status === BookingStatus.CONFIRMED) {
      return this.prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          trip: {
            include: {
              tripStations: { orderBy: { stopOrder: 'asc' } },
              train: true,
              route: {
                include: {
                  originStation: true,
                  destinationStation: true,
                },
              },
            },
          },
          passengers: {
            include: {
              bookingSeats: {
                include: {
                  seat: {
                    include: {
                      coach: true,
                      seatType: true,
                    },
                  },
                  ticketIssue: true,
                  originStation: true,
                  destinationStation: true,
                },
              },
            },
          },
          payment: true,
        },
      });
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Đơn đặt vé này đã bị hủy bỏ.');
    }

    // Kiểm tra TTL 10 phút
    const now = new Date();
    if (
      booking.status === BookingStatus.EXPIRED ||
      (booking.status === BookingStatus.PENDING &&
        booking.expiresAt &&
        now > new Date(booking.expiresAt))
    ) {
      await this.prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.EXPIRED },
        });
        await tx.bookingSeat.updateMany({
          where: { bookingId: booking.id },
          data: { status: BookingSeatStatus.CANCELLED },
        });
      });
      if (booking.status === BookingStatus.PENDING) void this.mail?.sendBookingEmail(booking.id, 'EXPIRED');

      throw new BadRequestException(
        'Thời gian giữ chỗ (10 phút) đã hết hạn. Ghế đã được giải phóng, vui lòng đặt lại.',
      );
    }

    // Thực hiện xác nhận thanh toán & xuất vé điện tử trong transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái Booking, chỉ khi vẫn PENDING (chặn 2 request xác nhận cùng lúc)
      const claimed = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: BookingStatus.PENDING,
          expiresAt: { gt: now }, // vừa quá hạn giữa chừng thì không xác nhận
        },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedAt: now,
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException('Đơn hàng vừa được cập nhật, vui lòng tải lại.');
      }

      // 2. Chuyển trạng thái ghế sang CONFIRMED
      await tx.bookingSeat.updateMany({
        where: { bookingId: booking.id },
        data: {
          status: BookingSeatStatus.CONFIRMED,
        },
      });

      // 3. Cập nhật Payment sang SUCCESS
      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            paymentMethod: dto.paymentMethod || 'VIETQR',
            transactionId: `TXN-${Date.now()}`,
            paidAt: now,
          },
        });
      }

      // 4. Sinh vé điện tử và mã QR
      await this.ticketService.issueTicketsForBooking(tx, booking.id);
    });
    void this.mail?.sendBookingEmail(booking.id, 'CONFIRMED');

    // Trả về đơn hàng hoàn chỉnh với các vé đã xuất
    return this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        trip: {
          include: {
            tripStations: { orderBy: { stopOrder: 'asc' } },
            train: true,
            route: {
              include: {
                originStation: true,
                destinationStation: true,
              },
            },
          },
        },
        passengers: {
          include: {
            bookingSeats: {
              include: {
                seat: {
                  include: {
                    coach: true,
                    seatType: true,
                  },
                },
                ticketIssue: true,
                originStation: true,
                destinationStation: true,
              },
            },
          },
        },
        payment: true,
      },
    });
  }
}
