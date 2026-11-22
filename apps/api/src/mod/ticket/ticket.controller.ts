import { Throttle } from '@nestjs/throttler';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtUser } from '../booking/booking.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  /** Chủ vé, STAFF/ADMIN, hoặc người nhập đúng ?phone= mới xem được */
  @Get(':ticketNumber')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  findByTicketNumber(
    @Param('ticketNumber') ticketNumber: string,
    @CurrentUser() user: JwtUser | null,
    @Query('phone') phone?: string,
  ) {
    return this.ticketService.findByTicketNumber(ticketNumber, user, phone);
  }
}
