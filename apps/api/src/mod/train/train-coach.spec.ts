import { ConflictException, NotFoundException } from '@nestjs/common';
import { CoachType } from '@prisma/client';
import { TrainService } from './train.service';

const makeTx = (opts: { train?: object | null; maxCoach?: number | null; coach?: object | null; booked?: number } = {}) => ({
  train: { findUnique: jest.fn().mockResolvedValue(opts.train === undefined ? { id: 't1' } : opts.train) },
  coach: {
    aggregate: jest.fn().mockResolvedValue({ _max: { coachNumber: opts.maxCoach ?? null } }),
    create: jest.fn().mockImplementation(({ data }) => ({ id: 'c-new', ...data })),
    findFirst: jest.fn().mockResolvedValue(opts.coach === undefined ? { id: 'c1', trainId: 't1' } : opts.coach),
    findUnique: jest.fn().mockResolvedValue({ id: 'c-new', seats: [] }),
    delete: jest.fn(),
  },
  seatType: { findUnique: jest.fn().mockResolvedValue({ id: 'st-k4' }) },
  seat: { createMany: jest.fn() },
  bookingSeat: { count: jest.fn().mockResolvedValue(opts.booked ?? 0) },
});

const serviceWith = (tx: ReturnType<typeof makeTx>) =>
  new TrainService({ ...tx, $transaction: (fn: (t: unknown) => unknown) => fn(tx) } as never);

describe('TrainService coaches', () => {
  it('thêm toa K4 vào tàu đã có 2 toa → toa số 3, 8 giường loại SLEEPER_4', async () => {
    const tx = makeTx({ maxCoach: 2 });
    await serviceWith(tx).addCoach('t1', 'K4');

    expect(tx.coach.create.mock.calls[0][0].data).toMatchObject({
      trainId: 't1',
      coachNumber: 3,
      coachType: CoachType.SLEEPER,
      capacity: 8,
    });
    expect(tx.seatType.findUnique).toHaveBeenCalledWith({ where: { code: 'SLEEPER_4' } });
    const seats = tx.seat.createMany.mock.calls[0][0].data;
    expect(seats).toHaveLength(8);
    expect(seats.every((s: { seatTypeId: string; coachId: string }) => s.seatTypeId === 'st-k4' && s.coachId === 'c-new')).toBe(true);
  });

  it('thêm toa cho tàu không tồn tại → NotFound', async () => {
    await expect(serviceWith(makeTx({ train: null })).addCoach('x', 'SOFT')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('xóa toa đã có ghế được đặt → Conflict, không xóa', async () => {
    const tx = makeTx({ booked: 2 });
    await expect(serviceWith(tx).removeCoach('t1', 'c1')).rejects.toBeInstanceOf(ConflictException);
    expect(tx.coach.delete).not.toHaveBeenCalled();
  });

  it('xóa toa chưa dùng → xóa', async () => {
    const tx = makeTx();
    await expect(serviceWith(tx).removeCoach('t1', 'c1')).resolves.toEqual({ deleted: true });
    expect(tx.coach.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });

  it('toa không thuộc tàu → NotFound', async () => {
    await expect(serviceWith(makeTx({ coach: null })).removeCoach('t1', 'c9')).rejects.toBeInstanceOf(NotFoundException);
  });
});
