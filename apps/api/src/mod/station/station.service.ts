import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { QueryStationDto } from './dto/query-station.dto';

@Injectable()
export class StationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStationDto) {
    return this.prisma.station.create({ data: dto });
  }

  async findAll(query: QueryStationDto) {
    const { search, status } = query;

    return this.prisma.station.findMany({
      where: {
        ...(status ? { status } : { status: 'ACTIVE' }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
            { city: { contains: search } },
          ],
        }),
      },
      select: {
        id: true,
        code: true,
        name: true,
        city: true,
        address: true,
        latitude: true,
        longitude: true,
        status: true,
        _count: {
          select: {
            routeStations: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: {
        routeStations: {
          include: {
            route: {
              select: {
                id: true,
                code: true,
                name: true,
                distanceKm: true,
                estimatedDurationMins: true,
                originStation: {
                  select: { id: true, code: true, name: true, city: true },
                },
                destinationStation: {
                  select: { id: true, code: true, name: true, city: true },
                },
              },
            },
          },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });

    if (!station) {
      throw new NotFoundException(`Không tìm thấy nhà ga với id: ${id}`);
    }

    return {
      id: station.id,
      code: station.code,
      name: station.name,
      city: station.city,
      address: station.address,
      latitude: station.latitude ? Number(station.latitude) : null,
      longitude: station.longitude ? Number(station.longitude) : null,
      status: station.status,
      passingRoutes: station.routeStations.map((rs) => ({
        routeId: rs.route.id,
        routeCode: rs.route.code,
        routeName: rs.route.name,
        stopOrder: rs.stopOrder,
        originStation: rs.route.originStation,
        destinationStation: rs.route.destinationStation,
        distanceKm: rs.route.distanceKm ? Number(rs.route.distanceKm) : null,
        arrivalOffsetMinutes: rs.arrivalOffsetMinutes,
        departureOffsetMinutes: rs.departureOffsetMinutes,
      })),
      createdAt: station.createdAt,
      updatedAt: station.updatedAt,
    };
  }

  async update(id: string, dto: UpdateStationDto) {
    await this.findOne(id);
    return this.prisma.station.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.station.delete({ where: { id } });
  }
}
