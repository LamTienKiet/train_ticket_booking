import { Prisma } from '@prisma/client';
import { AdminService } from './admin.service';

const pay = (routeName: string, amount: string, seats: number) => ({
  amount: new Prisma.Decimal(amount),
  paidAt: new Date('2026-11-25T03:00:00Z'),
  booking: { trip: { route: { name: routeName } }, _count: { bookingSeats: seats } },
});

const makeDb = () => ({
  payment: {
    findMany: jest.fn().mockResolvedValue([
      pay('HN - SG', '1000', 2),
      pay('ĐN - HN', '300', 1),
      pay('HN - SG', '500', 1),
    ]),
  },
  booking: {
    groupBy: jest.fn().mockResolvedValue([
      { status: 'CONFIRMED', _count: { _all: 3 } },
      { status: 'PENDING', _count: { _all: 2 } },
    ]),
  },
  trip: {
    count: jest.fn().mockResolvedValue(4),
    findMany: jest.fn().mockResolvedValue([]),
  },
});

describe('AdminService.getStats', () => {
  it('tổng doanh thu, vé bán, top tuyến và đơn theo trạng thái', async () => {
    const res = await new AdminService(makeDb() as never).getStats(30, new Date('2026-11-25T05:00:00Z'));
    expect(res.revenue).toBe(1800);
    expect(res.ticketsSold).toBe(4);
    expect(res.pendingBookings).toBe(2);
    expect(res.tripsToday).toBe(4);
    expect(res.bookingsByStatus).toMatchObject({ CONFIRMED: 3, PENDING: 2, CANCELLED: 0 });
    expect(res.topRoutes[0]).toEqual({ routeName: 'HN - SG', revenue: 1500, tickets: 3 });
    expect(res.dailyRevenue).toHaveLength(30);
    expect(res.dailyRevenue[29]).toEqual({ date: '2026-11-25', amount: 1800 });
  });
});

describe('AdminService.listSeatTypes', () => {
  it('trả loại ghế sắp theo mã', async () => {
    const db = { seatType: { findMany: jest.fn().mockResolvedValue([{ id: 's1', code: 'SOFT_SEAT', name: 'Ghế mềm' }]) } };
    await expect(new AdminService(db as never).listSeatTypes()).resolves.toEqual([{ id: 's1', code: 'SOFT_SEAT', name: 'Ghế mềm' }]);
    expect(db.seatType.findMany).toHaveBeenCalledWith({ select: { id: true, code: true, name: true }, orderBy: { code: 'asc' } });
  });
});
