import { Prisma } from '@prisma/client';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

const makeDb = () => ({
  booking: {
    findMany: jest.fn().mockResolvedValue([
      {
        bookingCode: 'LR123',
        status: 'CONFIRMED',
        contactName: 'A',
        contactPhone: '0912',
        contactEmail: 'a@x.vn',
        totalAmount: new Prisma.Decimal('840000.00'),
        createdAt: new Date('2026-11-20T00:00:00Z'),
        trip: { tripCode: 'SE1-1', departureTime: new Date(), route: { name: 'Hà Nội - Sài Gòn' } },
        _count: { bookingSeats: 2 },
      },
    ]),
    count: jest.fn().mockResolvedValue(1),
  },
});

describe('BookingService.findAllAdmin', () => {
  it('tìm theo mã đơn, SĐT hoặc email', async () => {
    const db = makeDb();
    await new BookingService(db as never).findAllAdmin({ search: '0912', status: 'CONFIRMED' });
    const where = db.booking.findMany.mock.calls[0][0].where;
    expect(where.status).toBe('CONFIRMED');
    expect(where.OR).toEqual([
      { bookingCode: { contains: '0912' } },
      { contactPhone: { contains: '0912' } },
      { contactEmail: { contains: '0912' } },
    ]);
  });

  it('tổng tiền là number, có số vé và phân trang', async () => {
    const res = await new BookingService(makeDb() as never).findAllAdmin({});
    expect(res).toMatchObject({ total: 1, page: 1, limit: 20 });
    expect(res.items[0]).toMatchObject({ bookingCode: 'LR123', totalAmount: 840000, seatCount: 2 });
  });

  it('route tĩnh /bookings/admin khai báo trước /bookings/:bookingCode', () => {
    const names = Object.getOwnPropertyNames(BookingController.prototype);
    expect(Reflect.getMetadata('path', BookingController.prototype.findAllAdmin)).toBe('admin');
    expect(names.indexOf('findAllAdmin')).toBeLessThan(names.indexOf('findByBookingCode'));
  });
});
