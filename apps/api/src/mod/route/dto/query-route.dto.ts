import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusActiveInactive } from '@prisma/client';

export class QueryRouteDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(StatusActiveInactive)
  status?: StatusActiveInactive;

  @IsOptional()
  @IsUUID()
  originStationId?: string;

  @IsOptional()
  @IsUUID()
  destinationStationId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
