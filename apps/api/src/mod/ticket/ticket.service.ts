import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '@prisma/client';
import { assertBookingAccess, JwtUser } from '../booking/booking.service';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sinh vé điện tử và mã QR cho toàn bộ ghế trong đơn đặt vé (trong transaction)
   */
  async issueTicketsForBooking(tx: any, bookingId: string) {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          include: {
            train: true,
            route: {
              include: {
                originStation: true,
                destinationStation: true,
              },
            },
          },
        },
        bookingSeats: {
          include: {
            passenger: true,
            seat: {
              include: {
                coach: true,
                seatType: true,
              },
            },
            ticketIssue: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn hàng ID: ${bookingId}`);
    }

    const issuedTickets: any[] = [];

    for (let i = 0; i < booking.bookingSeats.length; i++) {
      const bs = booking.bookingSeats[i];
      // Nếu đã có vé rồi thì không tạo lại
      if (bs.ticketIssue) {
        issuedTickets.push(bs.ticketIssue);
        continue;
      }

      const ticketNumber = `VE-${booking.bookingCode}-${bs.seat.coach.coachNumber}${bs.seat.seatNumber}`;
      
      // Mã QR chuẩn quét vé điện tử LionRail
      const qrPayload = `LR|${ticketNumber}|${booking.bookingCode}|${bs.passenger.idNumber}|${bs.seat.coach.coachNumber}-${bs.seat.seatNumber}`;

      const ticket = await tx.ticketIssue.create({
        data: {
          bookingSeatId: bs.id,
          ticketNumber,
          qrCode: qrPayload,
          status: TicketStatus.ACTIVE,
          issuedAt: new Date(),
        },
      });

      issuedTickets.push(ticket);
    }

    return issuedTickets;
  }

  /**
   * Tra cứu vé đơn lẻ qua Mã vé điện tử
   */
  async findByTicketNumber(
    ticketNumber: string,
    user?: JwtUser | null,
    phone?: string,
  ) {
    const ticket = await this.prisma.ticketIssue.findUnique({
      where: { ticketNumber },
      include: {
        bookingSeat: {
          include: {
            passenger: true,
            seat: {
              include: {
                coach: true,
                seatType: true,
              },
            },
            booking: {
              include: {
                trip: {
                  include: {
                    train: true,
                    route: {
                      include: {
                        originStation: true,
                        destinationStation: true,
                      },
                    },
                  },
                },
              },
            },
            originStation: true,
            destinationStation: true,
          },
        },
        boardingRecords: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Không tìm thấy vé với mã: ${ticketNumber}`);
    }

    const { booking, passenger } = ticket.bookingSeat;
    assertBookingAccess({ ...booking, passengers: [passenger] }, user, phone);

    return ticket;
  }
}
