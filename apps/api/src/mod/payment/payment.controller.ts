import { Throttle } from '@nestjs/throttler';
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../booking/booking.service';
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
  @UseGuards(OptionalJwtAuthGuard)
  confirm(@Body() dto: ConfirmPaymentDto, @CurrentUser() user: JwtUser | null) {
    return this.paymentService.confirmPayment(dto, user);
  }
}
