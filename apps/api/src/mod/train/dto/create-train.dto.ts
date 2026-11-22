import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TrainStatus } from '@prisma/client';

export class CreateTrainDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã tàu không được để trống' })
  @MaxLength(20)
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên đoàn tàu không được để trống' })
  @MaxLength(100)
  name!: string;

  @IsEnum(TrainStatus)
  @IsOptional()
  status?: TrainStatus;
}
