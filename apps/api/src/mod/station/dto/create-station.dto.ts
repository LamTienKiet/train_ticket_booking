import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { StatusActiveInactive } from '@prisma/client';

export class CreateStationDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã ga không được để trống' })
  @MaxLength(20)
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên ga không được để trống' })
  @MaxLength(150)
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Thành phố không được để trống' })
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsEnum(StatusActiveInactive)
  @IsOptional()
  status?: StatusActiveInactive;
}
