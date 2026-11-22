import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PassengerType } from '@prisma/client';

export class PassengerItemDto {
  @IsString()
  @IsNotEmpty()
  seatId: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  idNumber: string;

  @IsEnum(PassengerType)
  passengerType: PassengerType;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  hasInsurance?: boolean;
}

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @IsOptional()
  @IsString()
  originStationId?: string;

  @IsOptional()
  @IsString()
  destinationStationId?: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerItemDto)
  passengers: PassengerItemDto[];
}
