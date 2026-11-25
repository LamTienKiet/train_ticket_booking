import { IsIn } from 'class-validator';
import { COACH_KINDS, type CoachKind } from '../coach-layout';

export class AddCoachDto {
  @IsIn(COACH_KINDS, { message: 'Loại toa phải là SOFT, K4 hoặc K6' })
  kind!: CoachKind;
}
