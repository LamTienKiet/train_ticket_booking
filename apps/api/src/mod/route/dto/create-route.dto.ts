import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusActiveInactive } from '@prisma/client';
import { RouteStationItemDto } from './route-station.dto';

export class CreateRouteDto {
  @IsString({ message: 'Mã tuyến phải là chuỗi' })
  @IsNotEmpty({ message: 'Mã tuyến không được để trống' })
  code: string;

  @IsString({ message: 'Tên tuyến phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên tuyến không được để trống' })
  name: string;

  @IsUUID('all', { message: 'Ga xuất phát (originStationId) phải là UUID' })
  @IsNotEmpty({ message: 'Ga xuất phát không được để trống' })
  originStationId: string;

  @IsUUID('all', { message: 'Ga đến (destinationStationId) phải là UUID' })
  @IsNotEmpty({ message: 'Ga đến không được để trống' })
  destinationStationId: string;

  @IsOptional()
  @IsNumber({}, { message: 'Khoảng cách km phải là số' })
  @Min(0, { message: 'Khoảng cách km không được âm' })
  distanceKm?: number;

  @IsOptional()
  @IsInt({ message: 'Thời gian dự kiến (phút) phải là số nguyên' })
  @Min(0, { message: 'Thời gian dự kiến không được âm' })
  estimatedDurationMins?: number;

  @IsOptional()
  @IsEnum(StatusActiveInactive, {
    message: 'Trạng thái không hợp lệ (ACTIVE | INACTIVE)',
  })
  status?: StatusActiveInactive;

  @IsOptional()
  @IsArray({ message: 'Danh sách ga dừng phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => RouteStationItemDto)
  stations?: RouteStationItemDto[];
}
