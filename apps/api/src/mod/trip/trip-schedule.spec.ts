import { buildTripStations } from './trip-schedule';

describe('buildTripStations', () => {
  const dep = new Date('2026-12-01T00:00:00Z');
  // cố ý đưa vào lộn xộn thứ tự
  const stops = [
    { stationId: 'SGN', stopOrder: 3, arrivalOffsetMinutes: 1800, departureOffsetMinutes: 1800 },
    { stationId: 'HAN', stopOrder: 1, arrivalOffsetMinutes: 0, departureOffsetMinutes: 0 },
    { stationId: 'HUE', stopOrder: 2, arrivalOffsetMinutes: 600, departureOffsetMinutes: 610 },
  ];

  it('tính giờ từng ga từ offset, sắp theo thứ tự dừng', () => {
    const { stops: out } = buildTripStations(dep, stops);
    expect(out.map((s) => s.stationId)).toEqual(['HAN', 'HUE', 'SGN']);
    expect(out[1].arrivalTime).toEqual(new Date('2026-12-01T10:00:00Z'));
    expect(out[1].departureTime).toEqual(new Date('2026-12-01T10:10:00Z'));
  });

  it('ga đầu không có giờ đến, ga cuối không có giờ đi', () => {
    const { stops: out } = buildTripStations(dep, stops);
    expect(out[0]).toMatchObject({ arrivalTime: null, departureTime: dep });
    expect(out[2].departureTime).toBeNull();
  });

  it('giờ đến của chuyến là giờ đến ga cuối', () => {
    expect(buildTripStations(dep, stops).arrivalTime).toEqual(new Date('2026-12-02T06:00:00Z'));
  });
});
