import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchTripDto {
  @IsUUID('4', { message: 'originStationId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'Ga đi không được để trống' })
  originStationId!: string;

  @IsUUID('4', { message: 'destinationStationId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'Ga đến không được để trống' })
  destinationStationId!: string;

  @IsDateString({}, { message: 'Ngày đi phải đúng định dạng YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Ngày đi không được để trống' })
  departureDate!: string;

  @IsInt({ message: 'Số hành khách phải là số nguyên' })
  @Min(1, { message: 'Phải có ít nhất 1 hành khách' })
  @Max(9, { message: 'Tối đa 9 hành khách mỗi lần đặt' })
  @Type(() => Number)
  @IsOptional()
  passengers?: number = 1;
}

