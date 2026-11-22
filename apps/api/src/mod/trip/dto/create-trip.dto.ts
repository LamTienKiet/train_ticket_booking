import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TripStatus } from '@prisma/client';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã chuyến không được để trống' })
  tripCode!: string;

  @IsUUID()
  @IsNotEmpty()
  routeId!: string;

  @IsUUID()
  @IsNotEmpty()
  trainId!: string;

  @IsDateString()
  @IsNotEmpty()
  departureTime!: string;

  @IsDateString()
  @IsNotEmpty()
  arrivalTime!: string;

  @IsEnum(TripStatus)
  @IsOptional()
  status?: TripStatus;
}
