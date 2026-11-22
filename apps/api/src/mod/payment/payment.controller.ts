import { Throttle } from '@nestjs/throttler';
import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Xác nhận thanh toán (Mock VietQR / Thẻ / Nhà ga)
   */
  @Post('confirm')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  confirm(@Body() dto: ConfirmPaymentDto) {
    return this.paymentService.confirmPayment(dto);
  }
}
