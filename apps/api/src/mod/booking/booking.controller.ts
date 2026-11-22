import { Throttle } from '@nestjs/throttler';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingService, JwtUser } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * Tạo đơn đặt vé mới (Hỗ trợ cả khách vãng lai và user đăng nhập)
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // chống spam giữ ghế
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: any) {
    const userId = user?.id || user?.sub || null;
    return this.bookingService.create(dto, userId);
  }

  /**
   * Lấy danh sách vé của người dùng đang đăng nhập
   */
  @Get('user/my')
  @UseGuards(JwtAuthGuard)
  findMyBookings(@CurrentUser() user: any) {
    const userId = user?.id || user?.sub;
    return this.bookingService.findMyBookings(userId);
  }

  /**
   * Tra cứu vé công khai qua Mã PNR và Số điện thoại
   */
  @Get('public/lookup')
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // chống dò mã đặt chỗ + SĐT
  lookupTicket(
    @Query('bookingCode') bookingCode: string,
    @Query('phone') phone: string,
  ) {
    return this.bookingService.lookupTicket(bookingCode, phone);
  }

  /**
   * Lấy chi tiết đơn đặt vé qua Mã đặt chỗ (PNR)
   */
  @Get(':bookingCode')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  findByBookingCode(
    @Param('bookingCode') bookingCode: string,
    @CurrentUser() user: JwtUser | null,
    @Query('phone') phone?: string,
  ) {
    return this.bookingService.findByBookingCode(bookingCode, user, phone);
  }

  /**
   * Hủy đơn đặt chỗ / Trả vé
   */
  @Post(':bookingCode/cancel')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  cancel(
    @Param('bookingCode') bookingCode: string,
    @CurrentUser() user: JwtUser | null,
    @Body('reason') reason?: string,
    @Body('phone') phone?: string,
  ) {
    return this.bookingService.cancel(bookingCode, user, reason, phone);
  }
}
