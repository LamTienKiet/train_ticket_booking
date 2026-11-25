import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('seat-types')
  seatTypes() {
    return this.adminService.listSeatTypes();
  }

  @Get('stats')
  stats(@Query('days') days?: string) {
    // 7..90 ngày, mặc định 30
    const n = Math.min(90, Math.max(7, Number(days) || 30));
    return this.adminService.getStats(n);
  }
}
