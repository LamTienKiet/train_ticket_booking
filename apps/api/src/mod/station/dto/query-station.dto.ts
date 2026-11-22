import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatusActiveInactive } from '@prisma/client';

export class QueryStationDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @IsEnum(StatusActiveInactive)
  @IsOptional()
  status?: StatusActiveInactive;
}

