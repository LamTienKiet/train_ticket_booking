import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TrainStatus } from '@prisma/client';

export class QueryTrainDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(TrainStatus)
  @IsOptional()
  status?: TrainStatus;
}

