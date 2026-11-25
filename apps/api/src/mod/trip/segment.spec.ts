import { BadRequestException } from '@nestjs/common';
import { loadTripSegment, overlapsSegment, segmentPrice } from './segment';

// Tuyến 4 ga: HAN(1, 0km) - HUE(2, 688km) - DAD(3, 791km) - SGN(4, 1726km)
const stops = [
  { stationId: 'HAN', stopOrder: 1, km: 0 },
  { stationId: 'HUE', stopOrder: 2, km: 688 },
  { stationId: 'DAD', stopOrder: 3, km: 791 },
  { stationId: 'SGN', stopOrder: 4, km: 1726 },
];
const db = {
  tripStation: { findMany: jest.fn().mockResolvedValue(stops) },
  routeStation: {
    findMany: jest
      .fn()
      .mockResolvedValue(stops.map((s) => ({ stationId: s.stationId, distanceFromOriginKm: s.km }))),
  },
} as any;
const trip = { id: 't1', routeId: 'r1' };
const sold = (from: string, to: string) => ({ originStationId: from, destinationStationId: to });

describe('segment', () => {
  it('ghế bán HAN→DAD được bán lại DAD→SGN, không bán được HUE→SGN', async () => {
    const dadSgn = await loadTripSegment(db, trip, 'DAD', 'SGN');
    const hueSgn = await loadTripSegment(db, trip, 'HUE', 'SGN');
    expect(overlapsSegment(dadSgn, sold('HAN', 'DAD'))).toBe(false);
    expect(overlapsSegment(hueSgn, sold('HAN', 'DAD'))).toBe(true);
  });

  it('cả chuyến trùng với mọi chặng đã bán; ga lạ coi như trùng', async () => {
    const all = await loadTripSegment(db, trip);
    expect(overlapsSegment(all, sold('DAD', 'SGN'))).toBe(true);
    expect(overlapsSegment(all, sold('XXX', 'SGN'))).toBe(true);
  });

  it('giá theo tỉ lệ km, làm tròn 1.000đ; cả tuyến giữ nguyên giá', async () => {
    const dadSgn = await loadTripSegment(db, trip, 'DAD', 'SGN');
    expect(segmentPrice(680_000, dadSgn.priceRatio)).toBe(368_000); // 935/1726
    expect(segmentPrice(680_000, (await loadTripSegment(db, trip)).priceRatio)).toBe(680_000);
  });

  it('ga sai chiều hoặc không thuộc chuyến => 400', async () => {
    await expect(loadTripSegment(db, trip, 'SGN', 'HAN')).rejects.toBeInstanceOf(BadRequestException);
    await expect(loadTripSegment(db, trip, 'XXX', 'SGN')).rejects.toBeInstanceOf(BadRequestException);
  });
});
