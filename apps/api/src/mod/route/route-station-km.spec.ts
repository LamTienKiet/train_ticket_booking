import { RouteService } from './route.service';

describe('RouteService.addStation lưu km từ ga đầu', () => {
  it('ghi distanceFromOriginKm khi thêm/cập nhật ga dừng (dùng để tính giá theo chặng)', async () => {
    const db = {
      route: { findUnique: jest.fn().mockResolvedValue({ id: 'r1' }) },
      station: { findUnique: jest.fn().mockResolvedValue({ id: 's1' }) },
      routeStation: { upsert: jest.fn().mockResolvedValue({}) },
    };
    await new RouteService(db as never).addStation('r1', {
      stationId: 's1',
      stopOrder: 2,
      arrivalOffsetMinutes: 300,
      departureOffsetMinutes: 310,
      distanceFromOriginKm: 250,
    });
    const arg = db.routeStation.upsert.mock.calls[0][0];
    expect(arg.create.distanceFromOriginKm).toBe(250);
    expect(arg.update.distanceFromOriginKm).toBe(250);
  });
});
