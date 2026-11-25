import { CoachType } from '@prisma/client';

// Sơ đồ ghế theo loại toa, dùng chung cho seed và API thêm toa
export type CoachKind = 'SOFT' | 'K4' | 'K6';
export const COACH_KINDS: CoachKind[] = ['SOFT', 'K4', 'K6'];

export const SEAT_TYPE_CODE = {
  SOFT: 'SOFT_SEAT',
  K4: 'SLEEPER_4',
  K6: 'SLEEPER_6',
} as const satisfies Record<CoachKind, string>;

export const coachTypeOf = (kind: CoachKind) =>
  kind === 'SOFT' ? CoachType.SEATING : CoachType.SLEEPER;

export function seatLayout(
  kind: CoachKind,
): { seatNumber: string; floorNumber: number; position: string }[] {
  if (kind === 'SOFT') {
    return [
      ...['A1', 'A2', 'A3', 'A4', 'A5'].map((n) => ({ seatNumber: n, floorNumber: 1, position: 'WINDOW' })),
      ...['B1', 'B2', 'B3', 'B4', 'B5'].map((n) => ({ seatNumber: n, floorNumber: 1, position: 'AISLE' })),
    ];
  }
  if (kind === 'K4') {
    return Array.from({ length: 8 }, (_, idx) => {
      const i = idx + 1;
      return {
        seatNumber: `T${Math.ceil(i / 4)}-0${i}`,
        floorNumber: i % 2 === 0 ? 2 : 1,
        position: i <= 4 ? 'LOWER' : 'UPPER',
      };
    });
  }
  return Array.from({ length: 12 }, (_, idx) => {
    const i = idx + 1;
    const numInComp = ((i - 1) % 6) + 1;
    return {
      seatNumber: `C${Math.ceil(i / 6)}-${String(numInComp).padStart(2, '0')}`,
      floorNumber: numInComp <= 2 ? 1 : numInComp <= 4 ? 2 : 3,
      position: numInComp % 2 === 0 ? 'UPPER' : 'LOWER',
    };
  });
}
