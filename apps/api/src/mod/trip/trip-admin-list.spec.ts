import { TripController } from './trip.controller';
import { TripService } from './trip.service';

const makeDb = () => ({
  trip: {
    findMany: jest.fn().mockResolvedValue([
      {
        id: 't1',
        tripCode: 'SE1-1',
        status: 'SCHEDULED',
        departureTime: new Date('2026-12-01T00:00:00Z'),
        arrivalTime: new Date('2026-12-02T00:00:00Z'),
        route: { id: 'r1', code: 'HAN-SGN', name: 'Hà Nội - Sài Gòn' },
        train: { id: 'tr1', code: 'SE1', coaches: [{ capacity: 10 }, { capacity: 8 }] },
      },
    ]),
    count: jest.fn().mockResolvedValue(1),
  },
  // BookingSeat không có tripId nên đếm qua booking của chuyến
  booking: {
    findMany: jest.fn().mockResolvedValue([
      { tripId: 't1', _count: { bookingSeats: 2 } },
      { tripId: 't1', _count: { bookingSeats: 1 } },
    ]),
  },
});

describe('TripService.findAllAdmin', () => {
  it('lọc trạng thái và khoảng ngày theo giờ VN', async () => {
    const db = makeDb();
    await new TripService(db as never).findAllAdmin({
      status: 'SCHEDULED',
      from: '2026-12-01',
      to: '2026-12-03',
    });
    const where = db.trip.findMany.mock.calls[0][0].where;
    expect(where.status).toBe('SCHEDULED');
    expect(where.departureTime.gte).toEqual(new Date('2026-12-01T00:00:00+07:00'));
    expect(where.departureTime.lte).toEqual(new Date('2026-12-03T23:59:59.999+07:00'));
  });

  it('trả số ghế đã bán và tổng ghế, kèm phân trang', async () => {
    const res = await new TripService(makeDb() as never).findAllAdmin({ page: 1, limit: 20 });
    expect(res).toMatchObject({ total: 1, page: 1, limit: 20 });
    expect(res.items[0]).toMatchObject({ id: 't1', soldSeats: 3, totalSeats: 18, train: { id: 'tr1', code: 'SE1' } });
  });

  it('route tĩnh /trips/admin khai báo trước /trips/:id', () => {
    const names = Object.getOwnPropertyNames(TripController.prototype);
    expect(Reflect.getMetadata('path', TripController.prototype.findAllAdmin)).toBe('admin');
    expect(names.indexOf('findAllAdmin')).toBeLessThan(names.indexOf('findOne'));
  });
});
