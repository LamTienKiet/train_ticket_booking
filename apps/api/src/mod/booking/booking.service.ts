import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  BookingStatus,
  BookingSeatStatus,
  PaymentStatus,
  PaymentProvider,
  PassengerType,
  TicketStatus,
  RefundStatus,
  Role,
  Prisma,
} from '@prisma/client';
import { randomInt } from 'crypto';
import { loadTripSegment, overlapsSegment, segmentPrice } from '../trip/segment';

// Bỏ 0/O/1/I để khách đọc mã không nhầm
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const generateCode = (len: number) =>
  Array.from({ length: len }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');

/** Payload JWT (xem AuthService.signIn): sub = users.id */
export interface JwtUser {
  sub: string;
  role: Role;
}

const digitsOnly = (v?: string | null) => (v ?? '').replace(/\D/g, '');

/** Chuẩn hóa số giấy tờ để so trùng: bỏ khoảng trắng, không phân biệt hoa thường */
export const normalizeIdNumber = (v: string) => v.replace(/\s/g, '').toUpperCase();

/** Trả về số giấy tờ bị nhập lặp trong cùng một đơn (mỗi người chỉ được một chỗ), không trùng thì undefined */
export function findDuplicateIdNumber(passengers: { idNumber: string }[]) {
  const seen = new Set<string>();
  for (const p of passengers) {
    const id = normalizeIdNumber(p.idNumber);
    if (seen.has(id)) return id;
    seen.add(id);
  }
  return undefined;
}

/**
 * Được xem/hủy booking khi: là STAFF/ADMIN, là chủ booking, hoặc nhập đúng SĐT liên hệ/hành khách.
 */
export function assertBookingAccess(
  booking: {
    userId: string | null;
    contactPhone: string | null;
    passengers?: { phone: string | null }[];
  },
  user?: JwtUser | null,
  phone?: string,
) {
  if (user && (user.role === Role.ADMIN || user.role === Role.STAFF)) return;
  if (user && booking.userId && booking.userId === user.sub) return;
  const input = digitsOnly(phone);
  const phones = [booking.contactPhone, ...(booking.passengers ?? []).map((p) => p.phone)];
  if (input && phones.some((p) => digitsOnly(p) === input)) return;
  throw new ForbiddenException(
    'Bạn không có quyền truy cập đơn đặt vé này. Hãy đăng nhập đúng tài khoản hoặc nhập số điện thoại đã dùng khi đặt.',
  );
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Cron: mỗi phút chuyển đơn PENDING quá hạn giữ chỗ sang EXPIRED và nhả ghế */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'expire-bookings' })
  async handleExpireCron() {
    try {
      const count = await this.expireStaleBookings();
      if (count > 0) this.logger.log(`Đã hết hạn ${count} booking, ghế được giải phóng`);
    } catch (err) {
      // Không để lỗi DB tạm thời làm sập tiến trình; lần chạy sau sẽ thử lại
      this.logger.error('Cron hết hạn booking thất bại', err as Error);
    }
  }

  /**
   * Hết hạn các booking PENDING đã quá expiresAt (lọc theo user nếu có).
   * Trả về số booking đã chuyển sang EXPIRED.
   */
  async expireStaleBookings(userId?: string): Promise<number> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const stale = await tx.booking.findMany({
        where: {
          ...(userId ? { userId } : {}),
          status: BookingStatus.PENDING,
          expiresAt: { lt: now },
        },
        select: { id: true },
        take: 500, // giới hạn mỗi lượt; phần còn lại xử lý ở phút sau
      });
      if (stale.length === 0) return 0;
      const ids = stale.map((b) => b.id);

      // Điều kiện status PENDING lặp lại: nếu thanh toán vừa xác nhận xong thì không đụng vào
      const { count } = await tx.booking.updateMany({
        where: { id: { in: ids }, status: BookingStatus.PENDING },
        data: { status: BookingStatus.EXPIRED },
      });
      // Chỉ nhả ghế của booking thực sự vừa EXPIRED
      await tx.bookingSeat.updateMany({
        where: {
          bookingId: { in: ids },
          booking: { status: BookingStatus.EXPIRED },
        },
        data: { status: BookingSeatStatus.CANCELLED },
      });
      await tx.payment.updateMany({
        where: {
          bookingId: { in: ids },
          status: PaymentStatus.PENDING,
          booking: { status: BookingStatus.EXPIRED },
        },
        data: { status: PaymentStatus.FAILED },
      });
      return count;
    });
  }

  /**
   * Tạo booking mới với cơ chế lock ghế và giữ chỗ TTL 10 phút
   */
  async create(dto: CreateBookingDto, userId?: string | null) {
    // 1. Kiểm tra chuyến tàu (Chấp nhận UUID hoặc tripCode hoặc trainCode)
    const trip = await this.prisma.trip.findFirst({
      where: {
        OR: [
          { id: dto.tripId },
          { tripCode: dto.tripId },
          { train: { code: dto.tripId } },
        ],
      },
      include: {
        route: {
          include: {
            originStation: true,
            destinationStation: true,
          },
        },
        train: {
          include: {
            coaches: {
              include: {
                seats: {
                  include: {
                    seatType: true,
                    coach: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(
        `Không tìm thấy chuyến tàu với mã: ${dto.tripId}`,
      );
    }

    const originStationId = dto.originStationId || trip.route.originStationId;
    const destinationStationId =
      dto.destinationStationId || trip.route.destinationStationId;

    // Chặng do client gửi phải là 2 ga của chuyến này, đúng chiều chạy (sai => 400)
    const seg = await loadTripSegment(
      this.prisma,
      trip,
      dto.originStationId,
      dto.destinationStationId,
    );

    if (!dto.passengers || dto.passengers.length === 0) {
      throw new BadRequestException(
        'Danh sách hành khách không được để trống.',
      );
    }

    const duplicateId = findDuplicateIdNumber(dto.passengers);
    if (duplicateId) {
      throw new BadRequestException(
        `CMND/CCCD ${duplicateId} bị nhập cho nhiều hành khách. Mỗi hành khách phải có giấy tờ riêng.`,
      );
    }

    // Thu thập tất cả ghế của chuyến tàu trong DB
    const allTrainSeats: any[] = [];
    for (const coach of trip.train.coaches) {
      for (const s of coach.seats) {
        allTrainSeats.push(s);
      }
    }

    // Map từng seatId từ DTO sang Seat thật trong DB
    const resolvedSeatIds: string[] = [];
    const usedSeatIds = new Set<string>();

    for (let i = 0; i < dto.passengers.length; i++) {
      const p = dto.passengers[i];
      let foundSeat = allTrainSeats.find(
        (s) => s.id === p.seatId && !usedSeatIds.has(s.id),
      );

      // Nếu không tìm thấy bằng UUID trực tiếp, tìm theo coachNumber và seatNumber
      if (!foundSeat) {
        const parts = p.seatId.split('-');
        const coachNum = parts.length > 1 ? parseInt(parts[0], 10) : 1;
        const seatNum = parts.length > 1 ? parts[1] : p.seatId;

        // 1. Tìm theo tên ghế chính xác (A1, A2, B1, T1-01...)
        foundSeat = allTrainSeats.find(
          (s) =>
            s.coach.coachNumber === coachNum &&
            s.seatNumber.toLowerCase() === seatNum.toLowerCase() &&
            !usedSeatIds.has(s.id),
        );

        // 2. Nếu seatNum là số (VD: "02", "03"), map theo số thứ tự ghế trong toa đó
        if (!foundSeat && !isNaN(parseInt(seatNum, 10))) {
          const coachSeats = allTrainSeats.filter(
            (s) => s.coach.coachNumber === coachNum && !usedSeatIds.has(s.id),
          );
          const seatIdx = parseInt(seatNum, 10) - 1;
          if (seatIdx >= 0 && seatIdx < coachSeats.length) {
            foundSeat = coachSeats[seatIdx];
          }
        }
      }

      // Không tự đổi sang ghế khác: khách phải được ghế mình đã chọn
      if (!foundSeat) {
        throw new BadRequestException(
          `Ghế "${p.seatId}" không tồn tại trên chuyến này hoặc bị chọn trùng (hành khách ${p.fullName || i + 1}).`,
        );
      }

      usedSeatIds.add(foundSeat.id);
      resolvedSeatIds.push(foundSeat.id);
    }

    const seatIds = resolvedSeatIds;

    // 2. Chạy trong transaction để đảm bảo atomic và chống race-condition
    return this.prisma.$transaction(async (tx) => {
      // 2.0 Khóa các dòng ghế: request khác đặt cùng ghế phải chờ tới khi tx này commit.
      // Phải là câu lệnh ĐẦU TIÊN của tx để lần đọc sau (REPEATABLE READ) thấy dữ liệu mới nhất.
      await tx.$queryRaw`SELECT id FROM seats WHERE id IN (${Prisma.join(
        [...seatIds].sort(),
      )}) ORDER BY id FOR UPDATE`;

      // 2.1 Kiểm tra xung đột ghế (Ghế đã CONFIRMED hoặc đang PENDING nhưng chưa hết hạn)
      const now = new Date();
      const conflictingSeats = await tx.bookingSeat.findMany({
        where: {
          seatId: { in: seatIds },
          booking: {
            tripId: trip.id,
            OR: [
              { status: BookingStatus.CONFIRMED },
              {
                status: BookingStatus.PENDING,
                expiresAt: { gt: now },
              },
            ],
          },
          status: { in: [BookingSeatStatus.HELD, BookingSeatStatus.CONFIRMED] },
        },
        include: {
          seat: true,
        },
      });

      // Ghế chỉ trùng khi chặng đã bán chồng lên chặng đang đặt (khách trước xuống ga nào thì từ ga đó ghế trống)
      const overlapping = conflictingSeats.filter((cs) => overlapsSegment(seg, cs));
      if (overlapping.length > 0) {
        const conflictNumbers = [...new Set(overlapping.map((cs) => cs.seat.seatNumber))].join(', ');
        throw new ConflictException(
          `Ghế [${conflictNumbers}] đã có người giữ chỗ hoặc đã thanh toán. Vui lòng chọn ghế khác!`,
        );
      }

      // 2.2 Lấy thông tin giá vé và tính toán tiền
      const fareRules = await tx.fareRule.findMany({
        where: { routeId: trip.routeId },
        include: { passengerFares: true },
      });

      const seatDetails = await tx.seat.findMany({
        where: { id: { in: seatIds } },
        include: { seatType: true, coach: true },
      });
      const seatMap = new Map(seatDetails.map((s) => [s.id, s]));

      let subtotal = 0;
      let totalDiscount = 0;
      let totalAmount = 0;

      const passengerPricingList = dto.passengers.map((p, idx) => {
        const realSeatId = seatIds[idx];
        const seat = seatMap.get(realSeatId);
        if (!seat) {
          throw new NotFoundException(`Không tìm thấy ghế ID: ${realSeatId}`);
        }

        const fareRule = fareRules.find(
          (fr) => fr.seatTypeId === seat.seatTypeId,
        );
        // Bảng giá là giá cả tuyến; khách trả theo km chặng mình đi
        const basePrice = segmentPrice(
          fareRule
            ? Number(fareRule.basePrice)
            : Number(seat.seatType.priceMultiplier) * 100000,
          seg.priceRatio,
        );

        // Tỷ lệ giảm giá theo đối tượng hành khách
        let discountPercent = 0;
        if (p.passengerType === PassengerType.CHILD) discountPercent = 25;
        else if (p.passengerType === PassengerType.STUDENT)
          discountPercent = 10;
        else if (p.passengerType === PassengerType.SENIOR) discountPercent = 15;
        else if (p.passengerType === PassengerType.INFANT)
          discountPercent = 100;

        const discountAmount = Math.round((basePrice * discountPercent) / 100);
        const insuranceFee = p.hasInsurance ? 5000 : 0;
        const seatFinalPrice = basePrice - discountAmount + insuranceFee;

        subtotal += basePrice;
        totalDiscount += discountAmount;
        totalAmount += seatFinalPrice;

        return {
          passengerDto: p,
          seat,
          basePrice,
          discountAmount,
          insuranceFee,
          finalPrice: seatFinalPrice,
        };
      });

      // 2.3 Tạo mã PNR (VD: LR-7KQ2M9XA): 8 ký tự ngẫu nhiên từ crypto, khó đoán và gần như không trùng
      const bookingCode = `LR-${generateCode(8)}`;

      // 2.4 TTL Giữ chỗ: 10 phút từ lúc tạo
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // 2.5 Tạo bản ghi Booking
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          userId: userId || null,
          tripId: trip.id,
          contactName: dto.contactName,
          contactPhone: dto.contactPhone,
          contactEmail: dto.contactEmail,
          subtotalAmount: subtotal,
          discountAmount: totalDiscount,
          totalAmount: totalAmount,
          status: BookingStatus.PENDING,
          expiresAt,
        },
      });

      // 2.6 Tạo hành khách và gán ghế giữ chỗ
      for (const item of passengerPricingList) {
        const passenger = await tx.passenger.create({
          data: {
            bookingId: booking.id,
            fullName: item.passengerDto.fullName,
            idNumber: item.passengerDto.idNumber,
            passengerType: item.passengerDto.passengerType,
            phone: item.passengerDto.phone || dto.contactPhone,
            email: item.passengerDto.email || dto.contactEmail,
            dateOfBirth: item.passengerDto.dateOfBirth
              ? new Date(item.passengerDto.dateOfBirth)
              : null,
          },
        });

        await tx.bookingSeat.create({
          data: {
            bookingId: booking.id,
            passengerId: passenger.id,
            seatId: item.seat.id,
            originStationId,
            destinationStationId,
            price: item.finalPrice,
            status: BookingSeatStatus.HELD,
          },
        });
      }

      // 2.7 Tạo bản ghi Payment khởi tạo (MOCK provider)
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          paymentCode: `PAY-${bookingCode}`,
          provider: PaymentProvider.MOCK,
          amount: totalAmount,
          status: PaymentStatus.PENDING,
          idempotencyKey: `IDEM-${bookingCode}-${Date.now()}`,
        },
      });

      // 2.8 Trả về dữ liệu chi tiết booking
      return this.getBookingDetailByTx(tx, booking.id);
    });
  }

  /**
   * Lấy chi tiết đơn đặt vé qua Booking Code (PNR)
   */
  async findByBookingCode(
    bookingCode: string,
    user?: JwtUser | null,
    phone?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode },
      select: { id: true, status: true, expiresAt: true },
    });

    if (!booking) {
      throw new NotFoundException(
        `Không tìm thấy đơn đặt vé với mã: ${bookingCode}`,
      );
    }

    // Nếu đơn hàng đang PENDING nhưng đã quá hạn 10 phút -> tự động chuyển sang EXPIRED
    if (
      booking.status === BookingStatus.PENDING &&
      booking.expiresAt &&
      new Date() > new Date(booking.expiresAt)
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
    }

    const detail = await this.prisma.booking.findUniqueOrThrow({
      where: { bookingCode },
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
        payment: {
          include: {
            refunds: true,
          },
        },
      },
    });

    assertBookingAccess(detail, user, phone);
    return detail;
  }

  /**
   * Lấy danh sách vé / đơn hàng của user đang đăng nhập
   */
  async findMyBookings(userId: string) {
    // Cron chạy mỗi phút; gọi thêm ở đây để user không thấy đơn quá hạn trong khoảng chờ cron
    await this.expireStaleBookings(userId);

    return this.prisma.booking.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Tra cứu vé công khai qua Mã PNR + Số điện thoại
   */
  async lookupTicket(bookingCode: string, phone: string) {
    if (!bookingCode || !phone) {
      throw new BadRequestException('Vui lòng nhập mã đặt chỗ và số điện thoại.');
    }
    return this.findByBookingCode(bookingCode, null, phone);
  }

  /**
   * Hủy đơn đặt vé / Trả vé theo nghiệp vụ thực tế
   */
  async cancel(
    bookingCode: string,
    user?: JwtUser | null,
    reason?: string,
    phone?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        payment: true,
        bookingSeats: true,
        passengers: { select: { phone: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn đặt chỗ ${bookingCode}`);
    }

    assertBookingAccess(booking, user, phone);

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Đơn hàng đã ở trạng thái hủy hoặc đã hết hạn.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // Chỉ hủy nếu trạng thái chưa bị request khác đổi: chặn hủy 2 lần => hoàn tiền 2 lần
      const claimed = await tx.booking.updateMany({
        where: { id: booking.id, status: booking.status },
        data: { status: BookingStatus.CANCELLED, cancelledAt: now },
      });
      if (claimed.count === 0) {
        throw new ConflictException('Đơn hàng vừa được cập nhật, vui lòng tải lại.');
      }

      // Nếu đơn CONFIRMED (đã thanh toán): Hoàn tiền 90% (phí hủy 10%)
      if (booking.status === BookingStatus.CONFIRMED && booking.payment) {
        const totalAmount = Number(booking.totalAmount);
        const refundAmount = Math.round(totalAmount * 0.9);

        await tx.refund.create({
          data: {
            paymentId: booking.payment.id,
            amount: refundAmount,
            reason:
              reason ||
              'Khách hàng yêu cầu hủy vé (Khấu trừ 10% theo quy định)',
            status: RefundStatus.SUCCESS,
            processedAt: now,
          },
        });

        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });

        // Đổi trạng thái vé
        await tx.ticketIssue.updateMany({
          where: {
            bookingSeatId: { in: booking.bookingSeats.map((bs) => bs.id) },
          },
          data: { status: TicketStatus.CANCELLED },
        });
      }

      // Đổi trạng thái ghế sang CANCELLED để giải phóng ghế
      await tx.bookingSeat.updateMany({
        where: { bookingId: booking.id },
        data: { status: BookingSeatStatus.CANCELLED },
      });

      // Cập nhật booking
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: now,
        },
      });

      return {
        message: 'Hủy đơn đặt vé thành công.',
        bookingCode: updatedBooking.bookingCode,
        status: updatedBooking.status,
      };
    });
  }

  /**
   * Helper lấy booking đầy đủ trong transaction
   */
  private async getBookingDetailByTx(tx: any, bookingId: string) {
    return tx.booking.findUnique({
      where: { id: bookingId },
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
