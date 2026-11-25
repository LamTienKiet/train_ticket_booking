import { IsEnum, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { PassengerType } from '@prisma/client';

export class PassengerFareItemDto {
  @IsEnum(PassengerType, {
    message: 'Loại hành khách không hợp lệ (ADULT | CHILD | STUDENT | SENIOR | INFANT)',
  })
  @IsNotEmpty({ message: 'Loại hành khách không được để trống' })
  passengerType: PassengerType;

  @IsNumber({}, { message: 'Phần trăm giảm giá phải là số' })
  @Min(0, { message: 'Phần trăm giảm giá tối thiểu là 0%' })
  @Max(100, { message: 'Phần trăm giảm giá tối đa là 100%' })
  discountPercent: number;
}
