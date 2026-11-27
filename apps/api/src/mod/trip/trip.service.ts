import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../notification/mail.service';
import { SearchTripDto } from './dto/search-trip.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { BookingSeatStatus, BookingStatus, Prisma } from '@prisma/client';
import { QueryAdminTripDto } from './dto/query-admin-trip.dto';
import { buildTripStations } from './trip-schedule';
import { buildTripSegment, loadTripSegment, overlapsSegment, segmentPrice, TripSegment } from './segment';

/** Trùng mã chuyến (unique trip_code) → 409 thay vì 500 */
async function rethrowDuplicateCode<T>(tripCode: string | undefined, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new ConflictException(`Mã chuyến ${tripCode} đã tồn tại`);
    }
    throw e;
  }
}

@Injectable()
export class TripService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly mail?: MailService,
  ) {}

  // ──────────────────────────────────────────────
  // SEARCH TRIPS
  // ──────────────────────────────────────────────

  async search(dto: SearchTripDto) {
    const { originStationId, destinationStationId, departureDate } = dto;

    if (originStationId === destinationStationId) {
      throw new BadRequestException('Ga đi và ga đến không được trùng nhau');
    }

    const [originStation, destinationStation] = await Promise.all([
      this.prisma.station.findUnique({ where: { id: originStationId } }),
      this.prisma.station.findUnique({ where: { id: destinationStationId } }),
    ]);

    if (!originStation) {
      throw new NotFoundException(`Không tìm thấy ga đi với id: ${originStationId}`);
    }
    if (!destinationStation) {
      throw new NotFoundException(`Không tìm thấy ga đến với id: ${destinationStationId}`);
    }

    const startUTC = new Date(`${departureDate}T00:00:00+07:00`);
    const endUTC = new Date(`${departureDate}T23:59:59+07:00`);

    const validRouteIds = await this.findValidRouteIds(
      originStationId,
      destinationStationId,
    );

    if (validRouteIds.length === 0) {
      return [];
    }

    const trips = await this.prisma.trip.findMany({
      where: {
        routeId: { in: validRouteIds },
        // Ngày đi tính theo giờ tàu rời ga khách lên, không phải ga đầu tuyến; bỏ chuyến đã chạy
        tripStations: {
          some: {
            stationId: originStationId,
            departureTime: {
              gte: new Date(Math.max(startUTC.getTime(), Date.now())),
              lte: endUTC,
            },
          },
        },
        status: { in: ['SCHEDULED', 'BOARDING'] },
      },
      include: {
        route: {
          select: { id: true, code: true, name: true, distanceKm: true },
        },
        train: {
          select: { id: true, code: true, name: true },
        },
        tripStations: {
          where: {
            stationId: { in: [originStationId, destinationStationId] },
          },
          include: {
            station: { select: { id: true, code: true, name: true, city: true } },
          },
          orderBy: { stopOrder: 'asc' },
        },
      },
      orderBy: { departureTime: 'asc' },
    });

    return this.enrichTrips(trips, () => [originStationId, destinationStationId]);
  }

  private async findValidRouteIds(
    originStationId: string,
    destinationStationId: string,
  ): Promise<string[]> {
    const [originStops, destinationStops] = await Promise.all([
      this.prisma.routeStation.findMany({
        where: { stationId: originStationId },
        select: { routeId: true, stopOrder: true },
      }),
      this.prisma.routeStation.findMany({
        where: { stationId: destinationStationId },
        select: { routeId: true, stopOrder: true },
      }),
    ]);

    const destStopMap = new Map(
      destinationStops.map((s) => [s.routeId, s.stopOrder]),
    );

    const validRouteIds: string[] = [];
    for (const originStop of originStops) {
      const destOrder = destStopMap.get(originStop.routeId);
      if (destOrder !== undefined && originStop.stopOrder < destOrder) {
        validRouteIds.push(originStop.routeId);
      }
    }

    return validRouteIds;
  }

  /**
   * Gắn giá + số ghế trống cho danh sách chuyến bằng một số query cố định,
   * không phụ thuộc số chuyến (tránh N+1 query khi tìm chuyến).
   */
  private async enrichTrips(
    trips: any[],
    stationsOf: (trip: any) => [string, string],
  ) {
    if (trips.length === 0) return [];
    const uniq = (xs: string[]) => [...new Set(xs)];
    const routeIds = uniq(trips.map((t) => t.routeId));

    const [stops, routeStops, fareRules] = await Promise.all([
      this.prisma.tripStation.findMany({
        where: { tripId: { in: trips.map((t) => t.id) } },
        select: { tripId: true, stationId: true, stopOrder: true },
        orderBy: { stopOrder: 'asc' },
      }),
      this.prisma.routeStation.findMany({
        where: { routeId: { in: routeIds } },
        select: { routeId: true, stationId: true, distanceFromOriginKm: true },
      }),
      this.prisma.fareRule.findMany({
        where: { routeId: { in: routeIds } },
        include: {
          seatType: { select: { id: true, code: true, name: true } },
          passengerFares: true,
        },
      }),
    ]);

    const segs = trips.map((trip) => {
      const [from, to] = stationsOf(trip);
      return buildTripSegment(
        stops.filter((s) => s.tripId === trip.id),
        routeStops.filter((r) => r.routeId === trip.routeId),
        from,
        to,
      );
    });
    const available = await this.availableSeatsByTrip(
      trips.map((t, i) => ({ id: t.id, trainId: t.trainId, seg: segs[i] })),
    );

    return trips.map((trip, i) =>
      this.toTripResult(
        trip,
        ...stationsOf(trip),
        segs[i],
        fareRules.filter((fr) => fr.routeId === trip.routeId),
        available.get(trip.id)!,
      ),
    );
  }

  private toTripResult(
    trip: any,
    originStationId: string,
    destinationStationId: string,
    seg: TripSegment,
    fareRules: Prisma.FareRuleGetPayload<{
      include: { seatType: { select: { id: true; code: true; name: true } }; passengerFares: true };
    }>[],
    availableSeatsByType: Map<string, number>,
  ) {
    const originTripStation = trip.tripStations.find(
      (ts: any) => ts.stationId === originStationId,
    );
    const destinationTripStation = trip.tripStations.find(
      (ts: any) => ts.stationId === destinationStationId,
    );

    const durationMs =
      new Date(trip.arrivalTime).getTime() -
      new Date(trip.departureTime).getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    const faresByType = fareRules.map((fr) => {
      const available = availableSeatsByType.get(fr.seatTypeId) ?? 0;
      const price = segmentPrice(Number(fr.basePrice), seg.priceRatio);
      return {
        seatTypeId: fr.seatTypeId,
        seatTypeCode: fr.seatType.code,
        seatTypeName: fr.seatType.name,
        basePrice: price,
        passengerFares: fr.passengerFares.map((pf) => ({
          passengerType: pf.passengerType,
          discountPercent: Number(pf.discountPercent),
          finalPrice: price * (1 - Number(pf.discountPercent) / 100),
        })),
        availableSeats: available,
      };
    });

    const totalAvailableSeats = faresByType.reduce(
      (sum, f) => sum + f.availableSeats,
      0,
    );

    return {
      id: trip.id,
      tripCode: trip.tripCode,
      status: trip.status,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      durationMinutes,
      train: trip.train,
      route: trip.route,
      originStation: originTripStation
        ? {
          ...originTripStation.station,
          scheduledTime: originTripStation.departureTime ?? trip.departureTime,
        }
        : null,
      destinationStation: destinationTripStation
        ? {
          ...destinationTripStation.station,
          scheduledTime:
            destinationTripStation.arrivalTime ?? trip.arrivalTime,
        }
        : null,
      faresByType,
      totalAvailableSeats,
    };
  }

  /** Số ghế trống theo loại ghế của từng chuyến: tripId → (seatTypeId → số ghế trống) */
  private async availableSeatsByTrip(
    trips: { id: string; trainId: string; seg: TripSegment }[],
  ): Promise<Map<string, Map<string, number>>> {
    const trainIds = [...new Set(trips.map((t) => t.trainId))];
    const now = new Date();
    const [coaches, seatCounts, bookedSeats] = await Promise.all([
      this.prisma.coach.findMany({
        where: { trainId: { in: trainIds } },
        select: { id: true, trainId: true },
      }),
      this.prisma.seat.groupBy({
        by: ['coachId', 'seatTypeId'],
        where: { coach: { trainId: { in: trainIds } } },
        _count: { id: true },
      }),
      this.prisma.bookingSeat.findMany({
        where: {
          booking: {
            tripId: { in: trips.map((t) => t.id) },
            OR: [
              { status: 'CONFIRMED' },
              { status: 'PENDING', expiresAt: { gt: now } },
            ],
          },
          status: { in: ['HELD', 'CONFIRMED'] },
        },
        select: {
          seatId: true,
          originStationId: true,
          destinationStationId: true,
          seat: { select: { seatTypeId: true } },
          booking: { select: { tripId: true } },
        },
      }),
    ]);

    const trainOfCoach = new Map(coaches.map((c) => [c.id, c.trainId]));
    const result = new Map<string, Map<string, number>>();
    for (const trip of trips) {
      const available = new Map<string, number>();
      for (const c of seatCounts) {
        if (trainOfCoach.get(c.coachId) !== trip.trainId) continue;
        available.set(c.seatTypeId, (available.get(c.seatTypeId) ?? 0) + c._count.id);
      }
      // Ghế chỉ bận nếu chặng đã bán chồng lên chặng đang xem; một ghế đếm một lần
      const busy = new Map<string, string>();
      for (const b of bookedSeats) {
        if (b.booking.tripId === trip.id && overlapsSegment(trip.seg, b)) {
          busy.set(b.seatId, b.seat.seatTypeId);
        }
      }
      for (const seatTypeId of busy.values()) {
        if (available.has(seatTypeId)) available.set(seatTypeId, available.get(seatTypeId)! - 1);
      }
      result.set(trip.id, available);
    }
    return result;
  }

  // ──────────────────────────────────────────────
  // FIND ONE TRIP (Chi tiết chuyến tàu đầy đủ)
  // ──────────────────────────────────────────────

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        route: {
          include: {
            originStation: {
              select: {
                id: true,
                code: true,
                name: true,
                city: true,
                address: true,
              },
            },
            destinationStation: {
              select: {
                id: true,
                code: true,
                name: true,
                city: true,
                address: true,
              },
            },
          },
        },
        train: {
          include: {
            coaches: {
              select: {
                id: true,
                coachNumber: true,
                coachType: true,
                capacity: true,
                status: true,
                _count: { select: { seats: true } },
              },
              orderBy: { coachNumber: 'asc' },
            },
          },
        },
        tripStations: {
          include: {
            station: {
              select: {
                id: true,
                code: true,
                name: true,
                city: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
          },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(`Không tìm thấy chuyến tàu với id: ${id}`);
    }

    const [fareRules, availableSeatsByType] = await Promise.all([
      this.prisma.fareRule.findMany({
        where: { routeId: trip.routeId },
        include: {
          seatType: { select: { id: true, code: true, name: true } },
          passengerFares: true,
        },
      }),
      loadTripSegment(this.prisma, trip).then(async (seg) =>
        (await this.availableSeatsByTrip([{ id: trip.id, trainId: trip.trainId, seg }])).get(trip.id)!,
      ),
    ]);

    const durationMs =
      new Date(trip.arrivalTime).getTime() -
      new Date(trip.departureTime).getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    const faresByType = fareRules.map((fr) => {
      const available = availableSeatsByType.get(fr.seatTypeId) ?? 0;
      return {
        seatTypeId: fr.seatTypeId,
        seatTypeCode: fr.seatType.code,
        seatTypeName: fr.seatType.name,
        basePrice: Number(fr.basePrice),
        passengerFares: fr.passengerFares.map((pf) => ({
          passengerType: pf.passengerType,
          discountPercent: Number(pf.discountPercent),
          finalPrice:
            Number(fr.basePrice) * (1 - Number(pf.discountPercent) / 100),
        })),
        availableSeats: available,
      };
    });

    const totalSeats = trip.train.coaches.reduce(
      (sum, c) => sum + c._count.seats,
      0,
    );
    const totalAvailableSeats = faresByType.reduce(
      (sum, f) => sum + f.availableSeats,
      0,
    );

    const stops = trip.tripStations.map((ts, index, arr) => {
      const arrTime = ts.arrivalTime ? new Date(ts.arrivalTime) : null;
      const depTime = ts.departureTime ? new Date(ts.departureTime) : null;
      const stopDurationMinutes =
        arrTime && depTime
          ? Math.max(0, Math.round((depTime.getTime() - arrTime.getTime()) / 60000))
          : null;

      return {
        stopOrder: ts.stopOrder,
        station: {
          ...ts.station,
          latitude: ts.station.latitude ? Number(ts.station.latitude) : null,
          longitude: ts.station.longitude ? Number(ts.station.longitude) : null,
        },
        arrivalTime: ts.arrivalTime,
        departureTime: ts.departureTime,
        stopDurationMinutes,
        isOrigin: index === 0,
        isDestination: index === arr.length - 1,
      };
    });

    return {
      id: trip.id,
      tripCode: trip.tripCode,
      status: trip.status,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      durationMinutes,
      train: {
        id: trip.train.id,
        code: trip.train.code,
        name: trip.train.name,
        status: trip.train.status,
        totalCoaches: trip.train.coaches.length,
        coaches: trip.train.coaches.map((c) => ({
          id: c.id,
          coachNumber: c.coachNumber,
          coachType: c.coachType,
          capacity: c.capacity,
          seatsCount: c._count.seats,
          status: c.status,
        })),
      },
      route: {
        id: trip.route.id,
        code: trip.route.code,
        name: trip.route.name,
        distanceKm: trip.route.distanceKm ? Number(trip.route.distanceKm) : null,
        originStation: trip.route.originStation,
        destinationStation: trip.route.destinationStation,
      },
      stops,
      faresByType,
      seatSummary: {
        totalSeats,
        bookedSeats: Math.max(0, totalSeats - totalAvailableSeats),
        availableSeats: totalAvailableSeats,
      },
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  }

  // ──────────────────────────────────────────────
  // FIND SEATS for a trip (seat map)
  // ──────────────────────────────────────────────

  async findSeats(tripId: string, from?: string, to?: string) {
      const trip = await this.prisma.trip.findFirst({
        where: {
          OR: [
            { id: tripId },
            { tripCode: tripId },
            { train: { code: tripId } },
          ],
        },
        include: {
          train: true,
          route: {
            include: {
              originStation: true,
              destinationStation: true,
            },
          },
          tripStations: { include: { station: true }, orderBy: { stopOrder: 'asc' } },
        },
      });

      if(!trip) {
        throw new NotFoundException(`Không tìm thấy chuyến tàu với mã: ${tripId}`);
      }

      // Chặng khách đi (mặc định cả tuyến): tên ga, giờ, ghế trống và giá đều theo chặng
      const seg = await loadTripSegment(this.prisma, trip, from, to);
      const stops = trip.tripStations;
      const origin = stops.find((s) => s.stopOrder === seg.fromOrder);
      const dest = stops.find((s) => s.stopOrder === seg.toOrder);
      const dep = origin?.departureTime ?? trip.departureTime;
      const arr = dest?.arrivalTime ?? trip.arrivalTime;

    const fareRules = await this.prisma.fareRule.findMany({
        where: { routeId: trip.routeId },
        include: { seatType: { select: { id: true, code: true, name: true } } },
      });
      const fareMap = new Map(
        fareRules.map((fr) => [fr.seatTypeId, segmentPrice(Number(fr.basePrice), seg.priceRatio)]),
      );

      const now = new Date();
      const bookedSeats = await this.prisma.bookingSeat.findMany({
        where: {
          booking: {
            tripId: trip.id,
            OR: [
              { status: 'CONFIRMED' },
              {
                status: 'PENDING',
                expiresAt: { gt: now },
              },
            ],
          },
          status: { in: ['HELD', 'CONFIRMED'] },
        },
        select: { seatId: true, originStationId: true, destinationStationId: true },
      });
      const bookedSeatIds = new Set(
        bookedSeats.filter((b) => overlapsSegment(seg, b)).map((b) => b.seatId),
      );

      const coaches = await this.prisma.coach.findMany({
        where: {
          trainId: trip.trainId,
          status: 'ACTIVE',
        },
        include: {
          seats: {
            include: {
              seatType: { select: { id: true, code: true, name: true } },
            },
            orderBy: [{ floorNumber: 'asc' }, { seatNumber: 'asc' }],
          },
        },
        orderBy: { coachNumber: 'asc' },
      });

      const vn = { timeZone: 'Asia/Ho_Chi_Minh' } as const;
      const mins = Math.round((arr.getTime() - dep.getTime()) / 60000);

      return {
        tripId: trip.id,
        tripCode: trip.tripCode,
        trainCode: trip.train.code,
        trainName: trip.train.name,
        routeName: trip.route.name,
        originStation: origin?.station.name ?? trip.route.originStation.name,
        destinationStation: dest?.station.name ?? trip.route.destinationStation.name,
        departureTime: dep.toLocaleTimeString('vi-VN', {
          ...vn,
          hour: '2-digit',
          minute: '2-digit',
        }),
        departureDate: dep.toLocaleDateString('vi-VN', vn),
        duration: `${Math.floor(mins / 60)}h ${mins % 60}m`,
        coaches: coaches.map((coach) => ({
          id: coach.id,
          coachNumber: coach.coachNumber,
          coachType: coach.coachType,
          coachName:
            coach.coachType === 'SEATING'
              ? 'Ngồi Mềm Điều Hòa'
              : coach.coachType === 'SLEEPER'
                ? 'Giường Nằm Khoang 4'
                : 'Toa Dịch Vụ',
          clustersCount: coach.coachNumber === 1 ? 8 : 4,
          price:
            coach.seats.length > 0 && fareMap.get(coach.seats[0].seatTypeId)
              ? fareMap.get(coach.seats[0].seatTypeId)
              : 680000,
          capacity: coach.capacity,
          seats: coach.seats.map((seat) => ({
            id: seat.id,
            seatNumber: seat.seatNumber,
            floorNumber: seat.floorNumber,
            position: seat.position,
            seatType: seat.seatType,
            isAvailable: !bookedSeatIds.has(seat.id),
            isBooked: bookedSeatIds.has(seat.id),
            price: fareMap.get(seat.seatTypeId) ?? 680000,
          })),
        })),
      };
    }

  // ──────────────────────────────────────────────
  // CRUD (admin)
  // ──────────────────────────────────────────────

  async create(dto: CreateTripDto) {
    const departure = new Date(dto.departureTime);
    const schedule = await this.loadSchedule(this.prisma, dto.routeId, dto.trainId, departure);
    return rethrowDuplicateCode(dto.tripCode, () => this.prisma.trip.create({
      data: {
        tripCode: dto.tripCode,
        routeId: dto.routeId,
        trainId: dto.trainId,
        departureTime: departure,
        arrivalTime: schedule.arrivalTime,
        ...(dto.status && { status: dto.status }),
        tripStations: { create: schedule.stops },
      },
      include: { tripStations: { orderBy: { stopOrder: 'asc' } } },
    }));
  }

  /** Danh sách chuyến cho admin: mọi trạng thái, kèm số ghế đã bán / tổng ghế */
  async findAllAdmin(query: QueryAdminTripDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.TripWhereInput = {
      ...(query.status && { status: query.status }),
      ...((query.from || query.to) && {
        departureTime: {
          ...(query.from && { gte: new Date(`${query.from}T00:00:00+07:00`) }),
          ...(query.to && { lte: new Date(`${query.to}T23:59:59.999+07:00`) }),
        },
      }),
    };

    const [trips, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        include: {
          route: { select: { id: true, code: true, name: true } },
          train: { select: { id: true, code: true, coaches: { select: { capacity: true } } } },
        },
        orderBy: { departureTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trip.count({ where }),
    ]);

    // Đếm ghế (không phân chặng) của các đơn còn giữ/đã xác nhận
    const bookings = await this.prisma.booking.findMany({
      where: { tripId: { in: trips.map((t) => t.id) } },
      select: {
        tripId: true,
        _count: {
          select: {
            bookingSeats: { where: { status: { in: [BookingSeatStatus.HELD, BookingSeatStatus.CONFIRMED] } } },
          },
        },
      },
    });
    const sold = new Map<string, number>();
    for (const b of bookings) sold.set(b.tripId, (sold.get(b.tripId) ?? 0) + b._count.bookingSeats);

    return {
      items: trips.map(({ train, ...t }) => ({
        id: t.id,
        tripCode: t.tripCode,
        status: t.status,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        route: t.route,
        train: { id: train.id, code: train.code },
        soldSeats: sold.get(t.id) ?? 0,
        totalSeats: train.coaches.reduce((sum, c) => sum + c.capacity, 0),
      })),
      total,
      page,
      limit,
    };
  }

  /** Danh sách chuyến sắp chạy (cả tuyến), cùng dạng dữ liệu với search để web dùng chung */
  async findAll() {
    const trips = await this.prisma.trip.findMany({
      where: {
        departureTime: { gt: new Date() },
        status: { in: ['SCHEDULED', 'BOARDING'] },
      },
      include: {
        route: {
          select: {
            id: true,
            code: true,
            name: true,
            distanceKm: true,
            originStationId: true,
            destinationStationId: true,
          },
        },
        train: { select: { id: true, code: true, name: true } },
        tripStations: {
          include: {
            station: { select: { id: true, code: true, name: true, city: true } },
          },
          orderBy: { stopOrder: 'asc' },
        },
      },
      orderBy: { departureTime: 'asc' },
      // shortcut: không phân trang, đủ cho vài chục chuyến; nhiều hơn thì thêm page/limit
      take: 50,
    });

    return this.enrichTrips(trips, (trip) => [
      trip.route.originStationId,
      trip.route.destinationStationId,
    ]);
  }

  async update(id: string, dto: UpdateTripDto) {
    const before = await this.prisma.trip.findUnique({ where: { id }, select: { status: true } });
    const updated = await rethrowDuplicateCode(dto.tripCode, () => this.updateTx(id, dto));
    // Chỉ báo khách lúc chuyến vừa chuyển sang Đã hủy, không gửi lại mỗi lần sửa chuyến đã hủy
    if (dto.status === 'CANCELLED' && before?.status !== 'CANCELLED') void this.mail?.notifyTripCancelled(id);
    return updated;
  }

  private updateTx(id: string, dto: UpdateTripDto) {
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) throw new NotFoundException(`Không tìm thấy chuyến tàu với id: ${id}`);

      const reschedule =
        dto.departureTime !== undefined ||
        (dto.routeId !== undefined && dto.routeId !== trip.routeId) ||
        (dto.trainId !== undefined && dto.trainId !== trip.trainId);

      if (!reschedule) {
        return tx.trip.update({
          where: { id },
          data: {
            ...(dto.tripCode && { tripCode: dto.tripCode }),
            ...(dto.status && { status: dto.status }),
          },
        });
      }

      const activeBookings = await tx.booking.count({
        where: { tripId: id, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
      });
      if (activeBookings > 0) {
        throw new ConflictException('Chuyến đã có vé được đặt, không thể đổi giờ, tuyến hoặc tàu');
      }

      const routeId = dto.routeId ?? trip.routeId;
      const trainId = dto.trainId ?? trip.trainId;
      const departure = new Date(dto.departureTime ?? trip.departureTime);
      const schedule = await this.loadSchedule(tx, routeId, trainId, departure);

      // Dựng lại toàn bộ ga dừng theo tuyến hiện tại (tuyến có thể đã thêm/bớt ga sau khi tạo chuyến);
      // an toàn vì chưa có đơn nào tham chiếu chặng của chuyến
      await tx.tripStation.deleteMany({ where: { tripId: id } });
      await tx.tripStation.createMany({ data: schedule.stops.map((s) => ({ ...s, tripId: id })) });

      return tx.trip.update({
        where: { id },
        data: {
          ...(dto.tripCode && { tripCode: dto.tripCode }),
          ...(dto.status && { status: dto.status }),
          routeId,
          trainId,
          departureTime: departure,
          arrivalTime: schedule.arrivalTime,
        },
      });
    });
  }

  /** Lịch ga dừng của chuyến; chặn tuyến chưa có ga dừng hoặc tàu chưa có toa (chuyến sẽ không đặt được) */
  private async loadSchedule(
    tx: Pick<PrismaService, 'routeStation' | 'coach'>,
    routeId: string,
    trainId: string,
    departure: Date,
  ) {
    const [stops, coaches] = await Promise.all([
      tx.routeStation.findMany({ where: { routeId } }),
      tx.coach.count({ where: { trainId } }),
    ]);
    if (stops.length < 2) throw new BadRequestException('Tuyến chưa có ga dừng');
    if (coaches === 0) throw new BadRequestException('Tàu chưa có toa');
    return buildTripStations(departure, stops);
  }

  /** Chuyến đã có đơn thì hủy chuyến thay vì xóa (giữ lịch sử vé); chưa có đơn thì xóa */
  async remove(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!trip) throw new NotFoundException(`Không tìm thấy chuyến tàu với id: ${id}`);

    if (trip._count.bookings > 0) {
      await this.prisma.trip.update({ where: { id }, data: { status: 'CANCELLED' } });
      if (trip.status !== 'CANCELLED') void this.mail?.notifyTripCancelled(id);
      return { cancelled: true, message: 'Chuyến đã có đơn đặt vé nên đã chuyển sang Đã hủy.' };
    }
    await this.prisma.trip.delete({ where: { id } });
    return { deleted: true };
  }
}
