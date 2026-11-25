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

  /** Ga đã nằm trong tuyến/chuyến thì chỉ ngừng hoạt động, không xóa cứng */
  async remove(id: string) {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: {
        _count: { select: { routeStations: true, tripStations: true, originRoutes: true, destinationRoutes: true } },
      },
    });
    if (!station) throw new NotFoundException(`Không tìm thấy nhà ga với ID: ${id}`);

    // Ga đầu/cuối của tuyến cũng là khóa ngoại (không cascade), kể cả khi tuyến chưa có ga dừng
    const { routeStations, tripStations, originRoutes, destinationRoutes } = station._count;
    if (routeStations + tripStations + (originRoutes ?? 0) + (destinationRoutes ?? 0) > 0) {
      await this.prisma.station.update({ where: { id }, data: { status: 'INACTIVE' } });
      return { deactivated: true, message: 'Ga đang được dùng trong tuyến/chuyến nên đã chuyển sang ngừng hoạt động.' };
    }
    await this.prisma.station.delete({ where: { id } });
    return { deleted: true };
  }
}
