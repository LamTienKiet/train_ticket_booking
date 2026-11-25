import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingCode: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  // Khách vãng lai chứng minh quyền với đơn bằng SĐT đã dùng khi đặt
  @IsOptional()
  @IsString()
  phone?: string;
}
