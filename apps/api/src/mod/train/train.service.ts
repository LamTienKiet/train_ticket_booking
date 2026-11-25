import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoachKind, coachTypeOf, seatLayout, SEAT_TYPE_CODE } from './coach-layout';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainDto } from './dto/create-train.dto';
import { UpdateTrainDto } from './dto/update-train.dto';
import { QueryTrainDto } from './dto/query-train.dto';

@Injectable()
export class TrainService {
  constructor(private readonly prisma: PrismaService) {}

  /** Thêm toa theo loại, tự sinh ghế giống seed */
  async addCoach(trainId: string, kind: CoachKind) {
    return this.prisma.$transaction(async (tx) => {
      const train = await tx.train.findUnique({ where: { id: trainId } });
      if (!train) throw new NotFoundException(`Không tìm thấy đoàn tàu với id: ${trainId}`);

      const seatType = await tx.seatType.findUnique({ where: { code: SEAT_TYPE_CODE[kind] } });
      if (!seatType) throw new BadRequestException(`Chưa có loại ghế ${SEAT_TYPE_CODE[kind]} trong hệ thống`);

      const { _max } = await tx.coach.aggregate({ where: { trainId }, _max: { coachNumber: true } });
      const seats = seatLayout(kind);
      const coach = await tx.coach.create({
        data: {
          trainId,
          coachNumber: (_max.coachNumber ?? 0) + 1,
          coachType: coachTypeOf(kind),
          capacity: seats.length,
        },
      });
      await tx.seat.createMany({
        data: seats.map((s) => ({ ...s, coachId: coach.id, seatTypeId: seatType.id })),
      });
      return tx.coach.findUnique({ where: { id: coach.id }, include: { seats: true } });
    });
  }

  async removeCoach(trainId: string, coachId: string) {
    return this.prisma.$transaction(async (tx) => {
      const coach = await tx.coach.findFirst({ where: { id: coachId, trainId } });
      if (!coach) throw new NotFoundException('Không tìm thấy toa của đoàn tàu này');

      const booked = await tx.bookingSeat.count({ where: { seat: { coachId } } });
      if (booked > 0) throw new ConflictException('Toa đã có ghế được đặt, không thể xóa');

      await tx.coach.delete({ where: { id: coachId } });
      return { deleted: true };
    });
  }

  async create(dto: CreateTrainDto) {
    return this.prisma.train.create({ data: dto });
  }

  async findAll(query: QueryTrainDto) {
    const { search, status } = query;

    const trains = await this.prisma.train.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search && {
          OR: [{ code: { contains: search } }, { name: { contains: search } }],
        }),
      },
      include: {
        coaches: {
          select: {
            id: true,
            coachNumber: true,
            coachType: true,
            capacity: true,
            _count: {
              select: { seats: true },
            },
          },
          orderBy: { coachNumber: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    });

    return trains.map((t) => {
      const totalSeats = t.coaches.reduce((acc, c) => acc + c._count.seats, 0);
      const coachTypeSummary = Array.from(
        new Set(t.coaches.map((c) => c.coachType)),
      );

      return {
        id: t.id,
        code: t.code,
        name: t.name,
        status: t.status,
        totalCoaches: t.coaches.length,
        totalSeats,
        coachTypes: coachTypeSummary,
        coaches: t.coaches.map((c) => ({
          coachNumber: c.coachNumber,
          coachType: c.coachType,
          capacity: c.capacity,
          seatCount: c._count.seats,
        })),
        createdAt: t.createdAt,
      };
    });
  }

  async findOne(id: string) {
    const train = await this.prisma.train.findUnique({
      where: { id },
      include: {
        coaches: {
          include: {
            seats: {
              include: {
                seatType: {
                  select: { id: true, code: true, name: true },
                },
              },
              orderBy: [{ floorNumber: 'asc' }, { seatNumber: 'asc' }],
            },
          },
          orderBy: { coachNumber: 'asc' },
        },
      },
    });

    if (!train) {
      throw new NotFoundException(`Không tìm thấy đoàn tàu với id: ${id}`);
    }

    const totalSeats = train.coaches.reduce(
      (acc, c) => acc + c.seats.length,
      0,
    );

    return {
      id: train.id,
      code: train.code,
      name: train.name,
      status: train.status,
      totalCoaches: train.coaches.length,
      totalSeats,
      coaches: train.coaches.map((coach) => ({
        id: coach.id,
        coachNumber: coach.coachNumber,
        coachType: coach.coachType,
        capacity: coach.capacity,
        status: coach.status,
        seatsCount: coach.seats.length,
        seats: coach.seats.map((seat) => ({
          id: seat.id,
          seatNumber: seat.seatNumber,
          floorNumber: seat.floorNumber,
          position: seat.position,
          status: seat.status,
          seatType: seat.seatType,
        })),
      })),
      createdAt: train.createdAt,
      updatedAt: train.updatedAt,
    };
  }

  async update(id: string, dto: UpdateTrainDto) {
    await this.findOne(id);
    return this.prisma.train.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.train.delete({ where: { id } });
  }
}
