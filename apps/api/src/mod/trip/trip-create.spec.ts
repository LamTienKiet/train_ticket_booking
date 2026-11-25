import { BadRequestException, ConflictException } from '@nestjs/common';
import { TripService } from './trip.service';

const routeStops = [
  { stationId: 'HAN', stopOrder: 1, arrivalOffsetMinutes: 0, departureOffsetMinutes: 0 },
  { stationId: 'HUE', stopOrder: 2, arrivalOffsetMinutes: 600, departureOffsetMinutes: 610 },
  { stationId: 'SGN', stopOrder: 3, arrivalOffsetMinutes: 1800, departureOffsetMinutes: 1800 },
];

const makeDb = (opts: { stops?: object[]; coaches?: number; activeBookings?: number } = {}) => {
  const db = {
    routeStation: { findMany: jest.fn().mockResolvedValue(opts.stops ?? routeStops) },
    coach: { count: jest.fn().mockResolvedValue(opts.coaches ?? 2) },
    trip: {
      create: jest.fn().mockImplementation(({ data }) => data),
      findUnique: jest.fn().mockResolvedValue({ id: 't1', routeId: 'r1', trainId: 'tr1' }),
      update: jest.fn().mockImplementation(({ data }) => data),
    },
    tripStation: { update: jest.fn() },
    booking: { count: jest.fn().mockResolvedValue(opts.activeBookings ?? 0) },
    $transaction: (fn: (t: unknown) => unknown) => fn(db),
  };
  return db;
};

const dto = {
  tripCode: 'T-1',
  routeId: 'r1',
  trainId: 'tr1',
  departureTime: '2026-12-01T00:00:00Z',
};

describe('TripService.create', () => {
  it('tuyến chưa có ga dừng → 400', async () => {
    const svc = new TripService(makeDb({ stops: [] }) as never);
    await expect(svc.create(dto)).rejects.toThrow(new BadRequestException('Tuyến chưa có ga dừng'));
  });

  it('tàu chưa có toa → 400', async () => {
    const svc = new TripService(makeDb({ coaches: 0 }) as never);
    await expect(svc.create(dto)).rejects.toThrow(new BadRequestException('Tàu chưa có toa'));
  });

  it('hợp lệ → tạo chuyến kèm 3 ga dừng, giờ đến tính từ tuyến', async () => {
    const db = makeDb();
    await new TripService(db as never).create(dto);
    const data = db.trip.create.mock.calls[0][0].data;
    expect(data.arrivalTime).toEqual(new Date('2026-12-02T06:00:00Z'));
    expect(data.tripStations.create).toHaveLength(3);
  });
});

describe('TripService.update', () => {
  it('đổi giờ đi khi đã có đơn → 409, không cập nhật', async () => {
    const db = makeDb({ activeBookings: 1 });
    await expect(
      new TripService(db as never).update('t1', { departureTime: '2026-12-01T02:00:00Z' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.trip.update).not.toHaveBeenCalled();
  });

  it('đổi giờ đi khi chưa có đơn → dời giờ chuyến và từng ga dừng', async () => {
    const db = makeDb();
    await new TripService(db as never).update('t1', { departureTime: '2026-12-01T02:00:00Z' });
    expect(db.trip.update.mock.calls[0][0].data.arrivalTime).toEqual(new Date('2026-12-02T08:00:00Z'));
    expect(db.tripStation.update).toHaveBeenCalledTimes(3);
    expect(db.tripStation.update.mock.calls[1][0]).toMatchObject({
      where: { tripId_stationId: { tripId: 't1', stationId: 'HUE' } },
      data: { arrivalTime: new Date('2026-12-01T12:00:00Z') },
    });
  });

  it('chỉ đổi trạng thái → không đụng ga dừng', async () => {
    const db = makeDb({ activeBookings: 5 });
    await new TripService(db as never).update('t1', { status: 'CANCELLED' });
    expect(db.tripStation.update).not.toHaveBeenCalled();
    expect(db.trip.update).toHaveBeenCalled();
  });
});
