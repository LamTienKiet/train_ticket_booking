import { TripService } from './trip.service';

// Tàu T1: toa C1 có 3 ghế SOFT + 2 ghế BED, toa C2 có 2 ghế SOFT. Thứ tự ga: A(1) B(2) C(3)
const stopOrders = new Map([['A', 1], ['B', 2], ['C', 3]]);
const booked = (tripId: string, seatId: string, type: string, from: string, to: string) => ({
  seatId,
  originStationId: from,
  destinationStationId: to,
  seat: { seatTypeId: type },
  booking: { tripId },
});

const prisma = {
  coach: { findMany: jest.fn().mockResolvedValue([{ id: 'C1', trainId: 'T1' }, { id: 'C2', trainId: 'T1' }]) },
  seat: {
    groupBy: jest.fn().mockResolvedValue([
      { coachId: 'C1', seatTypeId: 'SOFT', _count: { id: 3 } },
      { coachId: 'C1', seatTypeId: 'BED', _count: { id: 2 } },
      { coachId: 'C2', seatTypeId: 'SOFT', _count: { id: 2 } },
    ]),
  },
  bookingSeat: {
    findMany: jest.fn().mockResolvedValue([
      booked('t1', 's1', 'SOFT', 'A', 'B'), // trùng chặng A→C
      booked('t1', 's1', 'SOFT', 'B', 'C'), // cùng ghế, chỉ đếm một lần
      booked('t1', 's2', 'BED', 'A', 'C'),
      booked('t2', 's3', 'SOFT', 'A', 'B'), // chuyến t2 xem B→C: không trùng
    ]),
  },
} as any;

describe('TripService.availableSeatsByTrip', () => {
  it('đếm ghế trống riêng từng chuyến, theo chặng, không đếm trùng ghế', async () => {
    const service = new TripService(prisma);
    const res: Map<string, Map<string, number>> = await (service as any).availableSeatsByTrip([
      { id: 't1', trainId: 'T1', seg: { stopOrders, fromOrder: 1, toOrder: 3, priceRatio: 1 } },
      { id: 't2', trainId: 'T1', seg: { stopOrders, fromOrder: 2, toOrder: 3, priceRatio: 1 } },
    ]);

    expect(Object.fromEntries(res.get('t1')!)).toEqual({ SOFT: 4, BED: 1 });
    expect(Object.fromEntries(res.get('t2')!)).toEqual({ SOFT: 5, BED: 2 });
  });
});
