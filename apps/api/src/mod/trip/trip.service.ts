import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchTripDto } from './dto/search-trip.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripService {
  constructor(private readonly prisma: PrismaService) { }

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
        departureTime: { gte: startUTC, lte: endUTC },
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

    const results = await Promise.all(
      trips.map((trip) =>
        this.enrichTripResult(trip, originStationId, destinationStationId),
      ),
    );

    return results;
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

  private async enrichTripResult(
    trip: any,
    originStationId: string,
    destinationStationId: string,
  ) {
    const [fareRules, availableSeatsByType] = await Promise.all([
      this.prisma.fareRule.findMany({
        where: { routeId: trip.routeId },
        include: {
          seatType: { select: { id: true, code: true, name: true } },
          passengerFares: true,
        },
      }),
      this.getAvailableSeatsByType(trip.id, trip.trainId),
    ]);

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
          scheduledTime: originTripStation.arrivalTime ?? trip.departureTime,
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

  private async getAvailableSeatsByType(
    tripId: string,
    trainId: string,
  ): Promise<Map<string, number>> {
    const totalSeats = await this.prisma.seat.groupBy({
      by: ['seatTypeId'],
      where: { coach: { trainId } },
      _count: { id: true },
    });

    const now = new Date();
    const bookedSeats = await this.prisma.bookingSeat.groupBy({
      by: ['seatId'],
      where: {
        booking: {
          tripId,
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
      _count: { id: true },
    });

    const bookedSeatIds = bookedSeats.map((b) => b.seatId);
    const bookedSeatDetails =
      bookedSeatIds.length > 0
        ? await this.prisma.seat.findMany({
          where: { id: { in: bookedSeatIds } },
          select: { id: true, seatTypeId: true },
        })
        : [];

    const bookedPerType = new Map<string, number>();
    for (const seat of bookedSeatDetails) {
      bookedPerType.set(
        seat.seatTypeId,
        (bookedPerType.get(seat.seatTypeId) ?? 0) + 1,
      );
    }

    const availableMap = new Map<string, number>();
    for (const total of totalSeats) {
      const booked = bookedPerType.get(total.seatTypeId) ?? 0;
      availableMap.set(total.seatTypeId, total._count.id - booked);
    }

    return availableMap;
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
      this.getAvailableSeatsByType(trip.id, trip.trainId),
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

  async findSeats(tripId: string) {
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
        },
      });

      if(!trip) {
        throw new NotFoundException(`Không tìm thấy chuyến tàu với mã: ${tripId}`);
      }

    const fareRules = await this.prisma.fareRule.findMany({
        where: { routeId: trip.routeId },
        include: { seatType: { select: { id: true, code: true, name: true } } },
      });
      const fareMap = new Map(
        fareRules.map((fr) => [fr.seatTypeId, Number(fr.basePrice)]),
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
        select: { seatId: true },
      });
      const bookedSeatIds = new Set(bookedSeats.map((b) => b.seatId));

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

      const dep = trip.departureTime ? new Date(trip.departureTime) : null;
      const arr = trip.arrivalTime ? new Date(trip.arrivalTime) : null;

      return {
        tripId: trip.id,
        tripCode: trip.tripCode,
        trainCode: trip.train.code,
        trainName: trip.train.name,
        originStation: trip.route.originStation.name,
        destinationStation: trip.route.destinationStation.name,
        departureTime: dep
          ? dep.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : '06:00',
        departureDate: dep ? dep.toLocaleDateString('vi-VN') : '15/01/2026',
        duration: '31h 15m',
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
      return this.prisma.trip.create({
        data: {
          tripCode: dto.tripCode,
          routeId: dto.routeId,
          trainId: dto.trainId,
          departureTime: new Date(dto.departureTime),
          arrivalTime: new Date(dto.arrivalTime),
          ...(dto.status && { status: dto.status }),
        },
      });
    }

  async findAll() {
        const trips = await this.prisma.trip.findMany({
          include: {
            route: {
              include: {
                originStation: true,
                destinationStation: true,
              },
            },
            train: {
              include: {
                coaches: {
                  include: {
                    _count: { select: { seats: true } },
                  },
                },
              },
            },
            tripStations: {
              include: { station: true },
              orderBy: { stopOrder: 'asc' },
            },
          },
          orderBy: { departureTime: 'asc' },
        });

        const now = new Date();
        return Promise.all(
          trips.map(async (trip) => {
            // Biểu giá vé
            const fareRules = await this.prisma.fareRule.findMany({
              where: { routeId: trip.routeId },
            });
            const minPrice =
              fareRules.length > 0
                ? Math.min(...fareRules.map((f) => Number(f.basePrice)))
                : 680000;

            // Số ghế đã đặt
            const bookedCount = await this.prisma.bookingSeat.count({
              where: {
                booking: {
                  tripId: trip.id,
                  OR: [
                    { status: 'CONFIRMED' },
                    { status: 'PENDING', expiresAt: { gt: now } },
                  ],
                },
                status: { in: ['HELD', 'CONFIRMED'] },
              },
            });

            const totalSeats = trip.train.coaches.reduce(
              (sum, c) => sum + c._count.seats,
              0,
            );
            const availableSeats = Math.max(0, totalSeats - bookedCount);

            const durationMs =
              new Date(trip.arrivalTime).getTime() -
              new Date(trip.departureTime).getTime();
            const durationHours = Math.floor(durationMs / 3600000);
            const durationMins = Math.round((durationMs % 3600000) / 60000);

            const dep = trip.departureTime ? new Date(trip.departureTime) : null;
            const arr = trip.arrivalTime ? new Date(trip.arrivalTime) : null;

            return {
              id: trip.id,
              tripCode: trip.tripCode,
              departureTime: dep
                ? dep.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : '06:00',
              departureDate: dep ? dep.toLocaleDateString('vi-VN') : '15/01/2026',
              arrivalTime: arr
                ? arr.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : '19:30',
              arrivalDate: arr ? arr.toLocaleDateString('vi-VN') : '16/01/2026',
              duration: `${durationHours}h ${durationMins}m`,
              status: trip.status,
              train: {
                id: trip.train.id,
                code: trip.train.code,
                name: trip.train.name,
              },
              route: {
                id: trip.route.id,
                code: trip.route.code,
                name: trip.route.name,
                distanceKm: trip.route.distanceKm
                  ? Number(trip.route.distanceKm)
                  : 1726,
                originStation: trip.route.originStation,
                destinationStation: trip.route.destinationStation,
              },
              stops: trip.tripStations.map((ts) => ({
                stationName: ts.station.name,
                stationCode: ts.station.code,
                arrivalTime: ts.arrivalTime
                  ? new Date(ts.arrivalTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : '--:--',
                departureTime: ts.departureTime
                  ? new Date(ts.departureTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : '--:--',
                stopDuration: '15p',
              })),
              minPrice,
              totalSeats,
              availableSeats,
            };
          }),
        );
      }

  async update(id: string, dto: UpdateTripDto) {
        await this.findOne(id);
        return this.prisma.trip.update({
          where: { id },
          data: {
            ...(dto.tripCode && { tripCode: dto.tripCode }),
            ...(dto.routeId && { routeId: dto.routeId }),
            ...(dto.trainId && { trainId: dto.trainId }),
            ...(dto.departureTime && { departureTime: new Date(dto.departureTime) }),
            ...(dto.arrivalTime && { arrivalTime: new Date(dto.arrivalTime) }),
            ...(dto.status && { status: dto.status }),
          },
        });
      }

  async remove(id: string) {
        await this.findOne(id);
        return this.prisma.trip.delete({ where: { id } });
      }
}
