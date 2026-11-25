import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { QueryRouteDto } from './dto/query-route.dto';
import { RouteStationItemDto } from './dto/route-station.dto';
import { Prisma, StatusActiveInactive } from '@prisma/client';

@Injectable()
export class RouteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRouteDto) {
    if (dto.originStationId === dto.destinationStationId) {
      throw new BadRequestException('Ga xuất phát và ga đến không được trùng nhau.');
    }

    const [existingCode, origin, dest] = await Promise.all([
      this.prisma.route.findUnique({
        where: { code: dto.code.trim().toUpperCase() },
      }),
      this.prisma.station.findUnique({ where: { id: dto.originStationId } }),
      this.prisma.station.findUnique({ where: { id: dto.destinationStationId } }),
    ]);

    if (existingCode) {
      throw new ConflictException(`Mã tuyến đường '${dto.code}' đã tồn tại.`);
    }
    if (!origin) {
      throw new NotFoundException(`Không tìm thấy ga xuất phát với ID: ${dto.originStationId}`);
    }
    if (!dest) {
      throw new NotFoundException(`Không tìm thấy ga đến với ID: ${dto.destinationStationId}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const route = await tx.route.create({
        data: {
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          originStationId: dto.originStationId,
          destinationStationId: dto.destinationStationId,
          distanceKm: dto.distanceKm !== undefined ? dto.distanceKm : null,
          estimatedDurationMins: dto.estimatedDurationMins !== undefined ? dto.estimatedDurationMins : null,
          status: dto.status ?? StatusActiveInactive.ACTIVE,
        },
      });

      if (dto.stations && dto.stations.length > 0) {
        // Kiểm tra stopOrder trùng lặp trong mảng truyền vào
        const orders = dto.stations.map((s) => s.stopOrder);
        const uniqueOrders = new Set(orders);
        if (orders.length !== uniqueOrders.size) {
          throw new BadRequestException('Thứ tự dừng (stopOrder) trong danh sách ga không được trùng lặp.');
        }

        await tx.routeStation.createMany({
          data: dto.stations.map((s) => ({
            routeId: route.id,
            stationId: s.stationId,
            stopOrder: s.stopOrder,
            arrivalOffsetMinutes: s.arrivalOffsetMinutes,
            departureOffsetMinutes: s.departureOffsetMinutes,
            distanceFromOriginKm: s.distanceFromOriginKm,
          })),
        });
      }

      return tx.route.findUnique({
        where: { id: route.id },
        include: {
          originStation: true,
          destinationStation: true,
          routeStations: {
            orderBy: { stopOrder: 'asc' },
            include: { station: true },
          },
        },
      });
    });
  }

  async findAll(query: QueryRouteDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.RouteWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.originStationId) {
      where.originStationId = query.originStationId;
    }
    if (query.destinationStationId) {
      where.destinationStationId = query.destinationStationId;
    }

    if (query.keyword) {
      const kw = query.keyword.trim();
      where.OR = [
        { code: { contains: kw } },
        { name: { contains: kw } },
        { originStation: { name: { contains: kw } } },
        { destinationStation: { name: { contains: kw } } },
      ];
    }

    const [total, routes] = await Promise.all([
      this.prisma.route.count({ where }),
      this.prisma.route.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          originStation: true,
          destinationStation: true,
          _count: {
            select: {
              routeStations: true,
              trips: true,
              fareRules: true,
            },
          },
        },
      }),
    ]);

    return {
      items: routes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findFirst({
      where: {
        OR: [{ id }, { code: id.toUpperCase() }],
      },
      include: {
        originStation: true,
        destinationStation: true,
        routeStations: {
          orderBy: { stopOrder: 'asc' },
          include: { station: true },
        },
        _count: {
          select: {
            trips: true,
            fareRules: true,
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException(`Không tìm thấy tuyến đường với mã: ${id}`);
    }

    return route;
  }

  async update(id: string, dto: UpdateRouteDto) {
    const existing = await this.prisma.route.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy tuyến đường với ID: ${id}`);
    }

    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const codeDup = await this.prisma.route.findUnique({
        where: { code: dto.code.trim().toUpperCase() },
      });
      if (codeDup) {
        throw new ConflictException(`Mã tuyến đường '${dto.code}' đã tồn tại.`);
      }
    }

    if (
      dto.originStationId &&
      dto.destinationStationId &&
      dto.originStationId === dto.destinationStationId
    ) {
      throw new BadRequestException('Ga xuất phát và ga đến không được trùng nhau.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.RouteUpdateInput = {};
      if (dto.code) updateData.code = dto.code.trim().toUpperCase();
      if (dto.name) updateData.name = dto.name.trim();
      if (dto.originStationId) {
        updateData.originStation = { connect: { id: dto.originStationId } };
      }
      if (dto.destinationStationId) {
        updateData.destinationStation = { connect: { id: dto.destinationStationId } };
      }
      if (dto.distanceKm !== undefined) updateData.distanceKm = dto.distanceKm;
      if (dto.estimatedDurationMins !== undefined) {
        updateData.estimatedDurationMins = dto.estimatedDurationMins;
      }
      if (dto.status) updateData.status = dto.status;

      await tx.route.update({
        where: { id },
        data: updateData,
      });

      if (dto.stations !== undefined) {
        // Cập nhật lại toàn bộ danh sách ga dừng
        await tx.routeStation.deleteMany({
          where: { routeId: id },
        });

        if (dto.stations.length > 0) {
          await tx.routeStation.createMany({
            data: dto.stations.map((s) => ({
              routeId: id,
              stationId: s.stationId,
              stopOrder: s.stopOrder,
              arrivalOffsetMinutes: s.arrivalOffsetMinutes,
              departureOffsetMinutes: s.departureOffsetMinutes,
            distanceFromOriginKm: s.distanceFromOriginKm,
            })),
          });
        }
      }

      return tx.route.findUnique({
        where: { id },
        include: {
          originStation: true,
          destinationStation: true,
          routeStations: {
            orderBy: { stopOrder: 'asc' },
            include: { station: true },
          },
        },
      });
    });
  }

  async remove(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        _count: {
          select: { trips: true },
        },
      },
    });

    if (!route) {
      throw new NotFoundException(`Không tìm thấy tuyến đường với ID: ${id}`);
    }

    if (route._count.trips > 0) {
      // Đã có lịch trình chuyến tàu, không được xóa hẳn để bảo toàn lịch sử vé
      const updated = await this.prisma.route.update({
        where: { id },
        data: { status: StatusActiveInactive.INACTIVE },
      });
      return {
        deactivated: true,
        message: `Tuyến đường đang có ${route._count.trips} chuyến tàu liên kết. Đã chuyển trạng thái sang INACTIVE thay vì xóa vĩnh viễn.`,
        route: updated,
      };
    }

    // Bảng giá không cascade theo tuyến nên xóa trước (ga dừng cascade)
    await this.prisma.$transaction(async (tx) => {
      await tx.fareRule.deleteMany({ where: { routeId: id } });
      await tx.route.delete({ where: { id } });
    });

    return {
      deleted: true,
      message: `Đã xóa tuyến đường '${route.code} - ${route.name}' thành công.`,
      id,
    };
  }

  async addStation(routeId: string, dto: RouteStationItemDto) {
    const [route, station] = await Promise.all([
      this.prisma.route.findUnique({ where: { id: routeId } }),
      this.prisma.station.findUnique({ where: { id: dto.stationId } }),
    ]);

    if (!route) {
      throw new NotFoundException(`Không tìm thấy tuyến đường với ID: ${routeId}`);
    }
    if (!station) {
      throw new NotFoundException(`Không tìm thấy nhà ga với ID: ${dto.stationId}`);
    }

    const created = await this.prisma.routeStation.upsert({
      where: {
        routeId_stationId: {
          routeId,
          stationId: dto.stationId,
        },
      },
      update: {
        stopOrder: dto.stopOrder,
        arrivalOffsetMinutes: dto.arrivalOffsetMinutes,
        departureOffsetMinutes: dto.departureOffsetMinutes,
        distanceFromOriginKm: dto.distanceFromOriginKm,
      },
      create: {
        routeId,
        stationId: dto.stationId,
        stopOrder: dto.stopOrder,
        arrivalOffsetMinutes: dto.arrivalOffsetMinutes,
        departureOffsetMinutes: dto.departureOffsetMinutes,
        distanceFromOriginKm: dto.distanceFromOriginKm,
      },
      include: { station: true },
    });

    return created;
  }

  async removeStation(routeId: string, stationId: string) {
    const existing = await this.prisma.routeStation.findUnique({
      where: {
        routeId_stationId: {
          routeId,
          stationId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy ga dừng này trong lộ trình tuyến.');
    }

    await this.prisma.routeStation.delete({
      where: { id: existing.id },
    });

    return { message: 'Đã xóa ga dừng khỏi lộ trình tuyến thành công.' };
  }
}
