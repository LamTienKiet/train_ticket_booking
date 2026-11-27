import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus } from '@prisma/client';
import { createTransport, type Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { renderBookingEmail, type BookingEmailKind } from './booking-email';

/**
 * Gửi email cho khách qua Gmail (SMTP + mật khẩu ứng dụng).
 * Không bao giờ throw: lỗi gửi mail chỉ ghi log, không được làm hỏng việc đặt/hủy vé.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly webUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const user = config.get<string>('MAIL_USER');
    const pass = config.get<string>('MAIL_PASS');
    this.transporter =
      user && pass
        ? createTransport({ service: 'gmail', auth: { user, pass } })
        : null;
    this.from = config.get<string>('MAIL_FROM') || `LionRail <${user}>`;
    this.webUrl = config.get<string>('WEB_URL') || 'http://localhost:3000';
    if (!this.transporter)
      this.logger.warn('Chưa cấu hình MAIL_USER/MAIL_PASS: không gửi email');
  }

  async sendBookingEmail(
    bookingId: string,
    kind: BookingEmailKind,
  ): Promise<void> {
    if (!this.transporter) return;
    try {
      const b = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          trip: { include: { train: true, tripStations: true } },
          bookingSeats: {
            include: {
              passenger: true,
              originStation: true,
              destinationStation: true,
              seat: { include: { coach: true } },
            },
          },
          payment: {
            include: { refunds: { orderBy: { createdAt: 'desc' }, take: 1 } },
          },
        },
      });
      if (!b?.contactEmail) return;

      const depAt = (stationId: string) =>
        b.trip.tripStations.find((s) => s.stationId === stationId)
          ?.departureTime ?? null;
      const refund = b.payment?.refunds[0];
      const { subject, html } = renderBookingEmail(
        kind,
        {
          bookingCode: b.bookingCode,
          contactName: b.contactName,
          totalAmount: Number(b.totalAmount),
          refundAmount: refund ? Number(refund.amount) : null,
          trip: {
            tripCode: b.trip.tripCode,
            trainCode: b.trip.train.code,
            departureTime: b.trip.departureTime,
          },
          tickets: b.bookingSeats.map((s) => ({
            passenger: s.passenger.fullName,
            from: s.originStation.name,
            to: s.destinationStation.name,
            coach: s.seat.coach.coachNumber,
            seat: s.seat.seatNumber,
            departure: depAt(s.originStationId),
          })),
        },
        this.webUrl,
      );
      await this.transporter.sendMail({
        from: this.from,
        to: b.contactEmail,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(
        `Gửi email ${kind} cho booking ${bookingId} thất bại`,
        err as Error,
      );
    }
  }

  /** Báo cho mọi đơn còn hiệu lực của chuyến vừa bị hủy */
  async notifyTripCancelled(tripId: string): Promise<void> {
    if (!this.transporter) return;
    try {
      const bookings = await this.prisma.booking.findMany({
        where: {
          tripId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        },
        select: { id: true },
      });
      // Gửi lần lượt: Gmail giới hạn số kết nối đồng thời
      for (const { id } of bookings)
        await this.sendBookingEmail(id, 'TRIP_CANCELLED');
    } catch (err) {
      this.logger.error(
        `Gửi email hủy chuyến ${tripId} thất bại`,
        err as Error,
      );
    }
  }
}
