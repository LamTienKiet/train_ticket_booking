import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const ROLES_KEY = 'roles';

/**
 * Chạy sau JwtAuthGuard. Đọc role/trạng thái hiện tại của tài khoản từ DB thay vì tin role trong token,
 * để tài khoản vừa bị hạ quyền hoặc bị khóa mất quyền ngay, không đợi token (1 ngày) hết hạn.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const user = context.switchToHttp().getRequest().user;
    const account = user?.accountId
      ? await this.prisma.account.findUnique({
          where: { id: user.accountId },
          select: { role: true, status: true },
        })
      : null;
    if (!account || account.status !== 'ACTIVE' || !roles.includes(account.role)) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện hành động này.',
      );
    }
    return true;
  }
}
