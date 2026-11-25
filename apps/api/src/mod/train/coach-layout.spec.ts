import { CoachType } from '@prisma/client';
import { coachTypeOf, seatLayout, SEAT_TYPE_CODE } from './coach-layout';

describe('coach-layout', () => {
  it('toa ghế mềm: 10 ghế A1..A5 cạnh cửa, B1..B5 cạnh lối đi', () => {
    const seats = seatLayout('SOFT');
    expect(seats).toHaveLength(10);
    expect(seats.slice(0, 5).map((s) => s.seatNumber)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
    expect(seats.slice(0, 5).every((s) => s.position === 'WINDOW')).toBe(true);
    expect(seats.slice(5).every((s) => s.position === 'AISLE')).toBe(true);
  });

  it('toa khoang 4: 8 giường T1-01..T2-08', () => {
    const seats = seatLayout('K4');
    expect(seats).toHaveLength(8);
    expect(seats[0]).toEqual({ seatNumber: 'T1-01', floorNumber: 1, position: 'LOWER' });
    expect(seats[7]).toMatchObject({ seatNumber: 'T2-08', position: 'UPPER' });
  });

  it('toa khoang 6: 12 giường C1-01..C2-06, giường 3 ở tầng 2', () => {
    const seats = seatLayout('K6');
    expect(seats).toHaveLength(12);
    expect(seats[0].seatNumber).toBe('C1-01');
    expect(seats[11].seatNumber).toBe('C2-06');
    expect(seats.find((s) => s.seatNumber === 'C1-03')?.floorNumber).toBe(2);
  });

  it('loại toa và mã loại ghế', () => {
    expect(coachTypeOf('SOFT')).toBe(CoachType.SEATING);
    expect(coachTypeOf('K6')).toBe(CoachType.SLEEPER);
    expect(SEAT_TYPE_CODE.K4).toBe('SLEEPER_4');
  });
});
