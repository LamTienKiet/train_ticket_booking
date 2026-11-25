import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFareDto } from './dto/create-fare.dto';
import { UpdateFareDto } from './dto/update-fare.dto';
import { QueryFareDto } from './dto/query-fare.dto';
import { PassengerFareItemDto } from './dto/passenger-fare.dto';
import { PassengerType, Prisma, StatusActiveInactive } from '@prisma/client';

@Injectable()
export class FareService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFareDto) {
    const [route, seatType] = await Promise.all([
      this.prisma.route.findUnique({ where: { id: dto.routeId } }),
      this.prisma.seatType.findUnique({ where: { id: dto.seatTypeId } }),
    ]);

    if (!route) {
      throw new NotFoundException(`Không tìm thấy tuyến đường với ID: ${dto.routeId}`);
    }
    if (!seatType) {
      throw new NotFoundException(`Không tìm thấy loại ghế với ID: ${dto.seatTypeId}`);
    }

    const effectiveFromDate = new Date(dto.effectiveFrom);
    const effectiveToDate = dto.effectiveTo ? new Date(dto.effectiveTo) : null;

    if (effectiveToDate && effectiveToDate < effectiveFromDate) {
      throw new BadRequestException('Ngày kết thúc hiệu lực không được trước ngày bắt đầu.');
    }

    return this.prisma.$transaction(async (tx) => {
      const fareRule = await tx.fareRule.create({
        data: {
          routeId: dto.routeId,
          seatTypeId: dto.seatTypeId,
          basePrice: dto.basePrice,
          minDistanceKm: dto.minDistanceKm !== undefined ? dto.minDistanceKm : null,
          maxDistanceKm: dto.maxDistanceKm !== undefined ? dto.maxDistanceKm : null,
          effectiveFrom: effectiveFromDate,
          effectiveTo: effectiveToDate,
          status: dto.status ?? StatusActiveInactive.ACTIVE,
        },
      });

      if (dto.passengerFares && dto.passengerFares.length > 0) {
        await tx.passengerFareRule.createMany({
          data: dto.passengerFares.map((pf) => ({
            fareRuleId: fareRule.id,
            passengerType: pf.passengerType,
            discountPercent: pf.discountPercent,
          })),
        });
      }

      return tx.fareRule.findUnique({
        where: { id: fareRule.id },
        include: {
          route: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          seatType: true,
          passengerFares: true,
        },
      });
    });
  }

  async findAll(query: QueryFareDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.FareRuleWhereInput = {};

    if (query.routeId) where.routeId = query.routeId;
    if (query.seatTypeId) where.seatTypeId = query.seatTypeId;
    if (query.status) where.status = query.status;

    const [total, items] = await Promise.all([
      this.prisma.fareRule.count({ where }),
      this.prisma.fareRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ routeId: 'asc' }, { basePrice: 'asc' }],
        include: {
          route: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          seatType: true,
          passengerFares: true,
        },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const fareRule = await this.prisma.fareRule.findUnique({
      where: { id },
      include: {
        route: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        seatType: true,
        passengerFares: true,
      },
    });

    if (!fareRule) {
      throw new NotFoundException(`Không tìm thấy biểu giá với ID: ${id}`);
    }

    return fareRule;
  }

  async update(id: string, dto: UpdateFareDto) {
    const existing = await this.prisma.fareRule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy biểu giá với ID: ${id}`);
    }

    if (dto.routeId) {
      const route = await this.prisma.route.findUnique({ where: { id: dto.routeId } });
      if (!route) throw new NotFoundException(`Không tìm thấy tuyến đường ID: ${dto.routeId}`);
    }

    if (dto.seatTypeId) {
      const seatType = await this.prisma.seatType.findUnique({ where: { id: dto.seatTypeId } });
      if (!seatType) throw new NotFoundException(`Không tìm thấy loại ghế ID: ${dto.seatTypeId}`);
    }

    const effectiveFromDate = dto.effectiveFrom ? new Date(dto.effectiveFrom) : existing.effectiveFrom;
    const effectiveToDate = dto.effectiveTo !== undefined
      ? (dto.effectiveTo ? new Date(dto.effectiveTo) : null)
      : existing.effectiveTo;

    if (effectiveToDate && effectiveToDate < effectiveFromDate) {
      throw new BadRequestException('Ngày kết thúc hiệu lực không được trước ngày bắt đầu.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.FareRuleUpdateInput = {};
      if (dto.routeId) updateData.route = { connect: { id: dto.routeId } };
      if (dto.seatTypeId) updateData.seatType = { connect: { id: dto.seatTypeId } };
      if (dto.basePrice !== undefined) updateData.basePrice = dto.basePrice;
      if (dto.minDistanceKm !== undefined) updateData.minDistanceKm = dto.minDistanceKm;
      if (dto.maxDistanceKm !== undefined) updateData.maxDistanceKm = dto.maxDistanceKm;
      if (dto.effectiveFrom) updateData.effectiveFrom = effectiveFromDate;
      if (dto.effectiveTo !== undefined) updateData.effectiveTo = effectiveToDate;
      if (dto.status) updateData.status = dto.status;

      await tx.fareRule.update({
        where: { id },
        data: updateData,
      });

      if (dto.passengerFares !== undefined) {
        await tx.passengerFareRule.deleteMany({
          where: { fareRuleId: id },
        });

        if (dto.passengerFares.length > 0) {
          await tx.passengerFareRule.createMany({
            data: dto.passengerFares.map((pf) => ({
              fareRuleId: id,
              passengerType: pf.passengerType,
              discountPercent: pf.discountPercent,
            })),
          });
        }
      }

      return tx.fareRule.findUnique({
        where: { id },
        include: {
          route: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          seatType: true,
          passengerFares: true,
        },
      });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.fareRule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy biểu giá với ID: ${id}`);
    }

    await this.prisma.fareRule.delete({
      where: { id },
    });

    return {
      message: `Đã xóa biểu giá thành công.`,
      id,
    };
  }

  async upsertPassengerFare(fareRuleId: string, dto: PassengerFareItemDto) {
    const fareRule = await this.prisma.fareRule.findUnique({
      where: { id: fareRuleId },
    });

    if (!fareRule) {
      throw new NotFoundException(`Không tìm thấy biểu giá với ID: ${fareRuleId}`);
    }

    return this.prisma.passengerFareRule.upsert({
      where: {
        fareRuleId_passengerType: {
          fareRuleId,
          passengerType: dto.passengerType,
        },
      },
      update: {
        discountPercent: dto.discountPercent,
      },
      create: {
        fareRuleId,
        passengerType: dto.passengerType,
        discountPercent: dto.discountPercent,
      },
    });
  }

  async removePassengerFare(fareRuleId: string, passengerType: PassengerType) {
    const existing = await this.prisma.passengerFareRule.findUnique({
      where: {
        fareRuleId_passengerType: {
          fareRuleId,
          passengerType,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy quy tắc giảm giá này của biểu giá.');
    }

    await this.prisma.passengerFareRule.delete({
      where: { id: existing.id },
    });

    return {
      message: `Đã xóa chính sách giảm giá cho loại khách ${passengerType}.`,
    };
  }
}
