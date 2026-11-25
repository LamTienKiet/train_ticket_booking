type RouteStop = {
  stationId: string;
  stopOrder: number;
  arrivalOffsetMinutes: number;
  departureOffsetMinutes: number;
};

const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

/** Giờ đến/đi tại từng ga của một chuyến, tính từ giờ khởi hành và offset của tuyến */
export function buildTripStations(departure: Date, routeStops: RouteStop[]) {
  const sorted = [...routeStops].sort((a, b) => a.stopOrder - b.stopOrder);
  const last = sorted.length - 1;
  const stops = sorted.map((s, i) => ({
    stationId: s.stationId,
    stopOrder: s.stopOrder,
    arrivalTime: i === 0 ? null : addMinutes(departure, s.arrivalOffsetMinutes),
    departureTime: i === last ? null : addMinutes(departure, s.departureOffsetMinutes),
  }));
  return { stops, arrivalTime: addMinutes(departure, sorted[last].arrivalOffsetMinutes) };
}
