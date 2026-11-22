import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ROLES_KEY, RolesGuard } from '../guards/roles.guard';

/** Bắt buộc đăng nhập và có một trong các role. VD: @Roles(Role.ADMIN) */
export const Roles = (...roles: Role[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
