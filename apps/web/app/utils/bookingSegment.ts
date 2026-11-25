type Station = { id: string; code: string; name: string };
type BookingLike = {
  trip: {
    departureTime: string;
    arrivalTime: string;
    route: { originStation: Station; destinationStation: Station };
    tripStations?: { stationId: string; arrivalTime: string | null; departureTime: string | null }[];
  };
  passengers?: { bookingSeats?: { originStation?: Station; destinationStation?: Station }[] }[];
};

// Chặng khách đi (ga lên/xuống và giờ tại 2 ga đó); một đơn chỉ có một chặng. Đơn cũ không có chặng thì lấy cả tuyến.
export function bookingSegment(b: BookingLike) {
  const seat = b.passengers?.flatMap((p) => p.bookingSeats ?? [])[0];
  const origin = seat?.originStation ?? b.trip.route.originStation;
  const destination = seat?.destinationStation ?? b.trip.route.destinationStation;
  const stop = (id: string) => b.trip.tripStations?.find((s) => s.stationId === id);
  return {
    origin,
    destination,
    departureTime: stop(origin.id)?.departureTime ?? b.trip.departureTime,
    arrivalTime: stop(destination.id)?.arrivalTime ?? b.trip.arrivalTime,
  };
}
