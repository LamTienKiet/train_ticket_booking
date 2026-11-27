import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type Db = Pick<Prisma.TransactionClient, 'tripStation' | 'routeStation'>;

/** Chặng [ga lên, ga xuống) của một chuyến, tính theo thứ tự ga dừng */
export interface TripSegment {
  stopOrders: Map<string, number>;
  fromOrder: number;
  toOrder: number;
  /** Tỉ lệ km của chặng so với cả tuyến (1 = cả tuyến) */
  priceRatio: number;
}

/**
 * Hai chặng [a, b) và [c, d) cùng dùng một ghế khi chúng chồng nhau: a < d && c < b.
 * Ga xuống của khách trước = ga lên của khách sau thì không trùng (ghế trống từ ga đó).
 * Không biết thứ tự ga (dữ liệu lỗi) thì coi như trùng để không bán đè ghế.
 */
export function overlapsSegment(
  seg: Pick<TripSegment, 'stopOrders' | 'fromOrder' | 'toOrder'>,
  booked: { originStationId: string; destinationStationId: string },
) {
  const a = seg.stopOrders.get(booked.originStationId);
  const b = seg.stopOrders.get(booked.destinationStationId);
  if (a === undefined || b === undefined) return true;
  return a < seg.toOrder && seg.fromOrder < b;
}

/** Giá chặng = giá cả tuyến × tỉ lệ km, làm tròn tới 1.000đ */
export function segmentPrice(fullRoutePrice: number, priceRatio: number) {
  if (priceRatio >= 1) return fullRoutePrice;
  return Math.max(1000, Math.round((fullRoutePrice * priceRatio) / 1000) * 1000);
}

/**
 * Đọc chặng khách đi trên chuyến. Không truyền ga thì là cả chuyến.
 * Ga không thuộc chuyến hoặc đi ngược chiều => 400.
 */
export async function loadTripSegment(
  db: Db,
  trip: { id: string; routeId: string },
  from?: string,
  to?: string,
): Promise<TripSegment> {
  const [stops, routeStops] = await Promise.all([
    db.tripStation.findMany({
      where: { tripId: trip.id },
      select: { stationId: true, stopOrder: true },
      orderBy: { stopOrder: 'asc' },
    }),
    db.routeStation.findMany({
      where: { routeId: trip.routeId },
      select: { stationId: true, distanceFromOriginKm: true },
    }),
  ]);
  return buildTripSegment(stops, routeStops, from, to);
}

/** Như loadTripSegment nhưng từ dữ liệu đã đọc sẵn (stops sắp theo stopOrder tăng dần) */
export function buildTripSegment(
  stops: { stationId: string; stopOrder: number }[],
  routeStops: { stationId: string; distanceFromOriginKm: unknown }[],
  from?: string,
  to?: string,
): TripSegment {
  const stopOrders = new Map(stops.map((s) => [s.stationId, s.stopOrder]));

  // Chuyến chưa có lịch ga dừng: cả chuyến, mọi ghế đã đặt đều tính là trùng
  const fromOrder = from ? stopOrders.get(from) : (stops[0]?.stopOrder ?? -Infinity);
  const toOrder = to ? stopOrders.get(to) : (stops[stops.length - 1]?.stopOrder ?? Infinity);
  if (fromOrder === undefined || toOrder === undefined || fromOrder >= toOrder) {
    throw new BadRequestException('Ga đi/ga đến không thuộc chuyến này hoặc sai chiều.');
  }

  const km = new Map(
    routeStops
      .filter((r) => r.distanceFromOriginKm !== null)
      .map((r) => [r.stationId, Number(r.distanceFromOriginKm)]),
  );
  const first = stops[0]?.stationId;
  const last = stops[stops.length - 1]?.stationId;
  const kmOf = (id?: string) => (id ? km.get(id) : undefined);
  const segKm = (kmOf(to ?? last) ?? NaN) - (kmOf(from ?? first) ?? NaN);
  const totalKm = (kmOf(last) ?? NaN) - (kmOf(first) ?? NaN);
  // shortcut: thiếu km ở ga nào thì tính giá cả tuyến; khi admin nhập đủ km cho tuyến thì tự đúng
  const priceRatio = segKm > 0 && totalKm > 0 ? Math.min(1, segKm / totalKm) : 1;

  return { stopOrders, fromOrder, toOrder, priceRatio };
}
