import { StationService } from '../station/station.service';
import { TrainService } from '../train/train.service';
import { RouteService } from '../route/route.service';
import { TripService } from '../trip/trip.service';

// Prisma giả: mỗi model có findUnique (trả bản ghi kèm _count), update, delete, deleteMany
const model = (counts: Record<string, number>) => ({
  findUnique: jest.fn().mockResolvedValue({ id: 'x', code: 'C', name: 'N', _count: counts }),
  update: jest.fn().mockResolvedValue({ id: 'x' }),
  delete: jest.fn().mockResolvedValue({ id: 'x' }),
  deleteMany: jest.fn(),
});
const db = (name: string, counts: Record<string, number>) => {
  const d: Record<string, unknown> = { [name]: model(counts), fareRule: model({}) };
  d.$transaction = (fn: (t: unknown) => unknown) => fn(d);
  return d as Record<string, ReturnType<typeof model>>;
};

describe('Xóa an toàn', () => {
  it('ga đang nằm trong tuyến → INACTIVE, không xóa', async () => {
    const d = db('station', { routeStations: 2, tripStations: 0 });
    await expect(new StationService(d as never).remove('x')).resolves.toMatchObject({ deactivated: true });
    expect(d.station.update.mock.calls[0][0].data).toEqual({ status: 'INACTIVE' });
    expect(d.station.delete).not.toHaveBeenCalled();
  });

  it('ga là ga đầu/cuối của tuyến (dù tuyến chưa có ga dừng) → INACTIVE, không xóa', async () => {
    const d = db('station', { routeStations: 0, tripStations: 0, originRoutes: 0, destinationRoutes: 1 });
    await expect(new StationService(d as never).remove('x')).resolves.toMatchObject({ deactivated: true });
    expect(d.station.delete).not.toHaveBeenCalled();
  });

  it('ga chưa dùng → xóa', async () => {
    const d = db('station', { routeStations: 0, tripStations: 0 });
    await expect(new StationService(d as never).remove('x')).resolves.toMatchObject({ deleted: true });
    expect(d.station.delete).toHaveBeenCalled();
  });

  it('tàu đã có chuyến → INACTIVE', async () => {
    const d = db('train', { trips: 1 });
    await expect(new TrainService(d as never).remove('x')).resolves.toMatchObject({ deactivated: true });
    expect(d.train.update.mock.calls[0][0].data).toEqual({ status: 'INACTIVE' });
    expect(d.train.delete).not.toHaveBeenCalled();
  });

  it('tàu chưa có chuyến → xóa', async () => {
    const d = db('train', { trips: 0 });
    await expect(new TrainService(d as never).remove('x')).resolves.toMatchObject({ deleted: true });
    expect(d.train.delete).toHaveBeenCalled();
  });

  it('tuyến đã có chuyến → INACTIVE', async () => {
    const d = db('route', { trips: 3 });
    await expect(new RouteService(d as never).remove('x')).resolves.toMatchObject({ deactivated: true });
    expect(d.route.delete).not.toHaveBeenCalled();
  });

  it('tuyến chưa có chuyến → xóa bảng giá rồi xóa tuyến', async () => {
    const d = db('route', { trips: 0 });
    await expect(new RouteService(d as never).remove('x')).resolves.toMatchObject({ deleted: true });
    expect(d.fareRule.deleteMany).toHaveBeenCalledWith({ where: { routeId: 'x' } });
    expect(d.route.delete).toHaveBeenCalled();
  });

  it('chuyến đã có đơn → CANCELLED, không xóa', async () => {
    const d = db('trip', { bookings: 1 });
    await expect(new TripService(d as never).remove('x')).resolves.toMatchObject({ cancelled: true });
    expect(d.trip.update.mock.calls[0][0].data).toEqual({ status: 'CANCELLED' });
    expect(d.trip.delete).not.toHaveBeenCalled();
  });

  it('chuyến chưa có đơn → xóa', async () => {
    const d = db('trip', { bookings: 0 });
    await expect(new TripService(d as never).remove('x')).resolves.toMatchObject({ deleted: true });
    expect(d.trip.delete).toHaveBeenCalled();
  });
});
