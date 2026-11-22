import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingCode: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
