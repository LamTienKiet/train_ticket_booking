import { Injectable } from '@nestjs/common';
import { BookingSeatStatus, BookingStatus, PaymentStatus, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { bucketDaily, vnDate } from './stats';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(days: number, now = new Date()) {
    const since = new Date(`${vnDate(new Date(now.getTime() - (days - 1) * 86_400_000))}T00:00:00+07:00`);
    const todayStart = new Date(`${vnDate(now)}T00:00:00+07:00`);
    const todayEnd = new Date(`${vnDate(now)}T23:59:59.999+07:00`);

    const [payments, byStatus, tripsToday, upcoming] = await Promise.all([
      this.prisma.payment.findMany({
        where: { status: PaymentStatus.SUCCESS, paidAt: { gte: since } },
        select: {
          amount: true,
          paidAt: true,
          booking: {
            select: {
              trip: { select: { route: { select: { name: true } } } },
              _count: { select: { bookingSeats: { where: { status: BookingSeatStatus.CONFIRMED } } } },
            },
          },
        },
      }),
      this.prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.trip.count({
        where: { departureTime: { gte: todayStart, lte: todayEnd }, status: { not: TripStatus.CANCELLED } },
      }),
      this.prisma.trip.findMany({
        where: {
          departureTime: { gte: now, lte: new Date(now.getTime() + 86_400_000) },
          status: { in: [TripStatus.SCHEDULED, TripStatus.BOARDING] },
        },
        select: {
          id: true,
          tripCode: true,
          departureTime: true,
          route: { select: { name: true } },
          train: { select: { coaches: { select: { capacity: true } } } },
          bookings: {
            select: {
              _count: {
                select: {
                  bookingSeats: { where: { status: { in: [BookingSeatStatus.HELD, BookingSeatStatus.CONFIRMED] } } },
                },
              },
            },
          },
        },
        orderBy: { departureTime: 'asc' },
        take: 5,
      }),
    ]);

    const rows = payments.map((p) => ({
      at: p.paidAt!,
      amount: Number(p.amount),
      route: p.booking.trip.route.name,
      seats: p.booking._count.bookingSeats,
    }));

    const routes = new Map<string, { routeName: string; revenue: number; tickets: number }>();
    for (const r of rows) {
      const cur = routes.get(r.route) ?? { routeName: r.route, revenue: 0, tickets: 0 };
      cur.revenue += r.amount;
      cur.tickets += r.seats;
      routes.set(r.route, cur);
    }

    const bookingsByStatus = Object.fromEntries(
      Object.values(BookingStatus).map((s) => [s, 0]),
    ) as Record<BookingStatus, number>;
    for (const g of byStatus) bookingsByStatus[g.status] = g._count._all;

    return {
      revenue: rows.reduce((sum, r) => sum + r.amount, 0),
      ticketsSold: rows.reduce((sum, r) => sum + r.seats, 0),
      pendingBookings: bookingsByStatus.PENDING,
      tripsToday,
      bookingsByStatus,
      dailyRevenue: bucketDaily(rows, days, now),
      topRoutes: [...routes.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      upcomingTrips: upcoming.map((t) => ({
        id: t.id,
        tripCode: t.tripCode,
        departureTime: t.departureTime,
        routeName: t.route.name,
        soldSeats: t.bookings.reduce((sum, b) => sum + b._count.bookingSeats, 0),
        totalSeats: t.train.coaches.reduce((sum, c) => sum + c.capacity, 0),
      })),
    };
  }
}
