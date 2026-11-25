import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusActiveInactive } from '@prisma/client';
import { PassengerFareItemDto } from './passenger-fare.dto';

export class CreateFareDto {
  @IsUUID('all', { message: 'Mã tuyến đường (routeId) phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'Mã tuyến đường không được để trống' })
  routeId: string;

  @IsUUID('all', { message: 'Mã loại ghế (seatTypeId) phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'Mã loại ghế không được để trống' })
  seatTypeId: string;

  @IsNumber({}, { message: 'Giá vé cơ bản (basePrice) phải là số' })
  @Min(0, { message: 'Giá vé cơ bản không được âm' })
  basePrice: number;

  @IsOptional()
  @IsNumber({}, { message: 'Khoảng cách tối thiểu phải là số' })
  @Min(0, { message: 'Khoảng cách tối thiểu không được âm' })
  minDistanceKm?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Khoảng cách tối đa phải là số' })
  @Min(0, { message: 'Khoảng cách tối đa không được âm' })
  maxDistanceKm?: number;

  @IsDateString({}, { message: 'Ngày bắt đầu hiệu lực phải là ISO Date String' })
  @IsNotEmpty({ message: 'Ngày bắt đầu hiệu lực không được để trống' })
  effectiveFrom: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc hiệu lực phải là ISO Date String' })
  effectiveTo?: string;

  @IsOptional()
  @IsEnum(StatusActiveInactive, {
    message: 'Trạng thái không hợp lệ (ACTIVE | INACTIVE)',
  })
  status?: StatusActiveInactive;

  @IsOptional()
  @IsArray({ message: 'Danh sách quy tắc đối tượng phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => PassengerFareItemDto)
  passengerFares?: PassengerFareItemDto[];
}
