import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

const ctx = (user: object | null) =>
  ({
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

const guardWith = (account: object | null) =>
  new RolesGuard(
    { getAllAndOverride: () => [Role.ADMIN] } as unknown as Reflector,
    { account: { findUnique: jest.fn().mockResolvedValue(account) } } as never,
  );

describe('RolesGuard đọc quyền hiện tại từ DB', () => {
  const adminToken = { accountId: 'a1', role: Role.ADMIN };

  it('admin còn hoạt động thì qua', async () => {
    await expect(guardWith({ role: Role.ADMIN, status: 'ACTIVE' }).canActivate(ctx(adminToken))).resolves.toBe(true);
  });

  it('token còn hạn nhưng đã bị hạ quyền → 403', async () => {
    await expect(guardWith({ role: Role.CUSTOMER, status: 'ACTIVE' }).canActivate(ctx(adminToken))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('token còn hạn nhưng tài khoản đã bị khóa → 403', async () => {
    await expect(guardWith({ role: Role.ADMIN, status: 'BANNED' }).canActivate(ctx(adminToken))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('tài khoản không còn tồn tại hoặc chưa đăng nhập → 403', async () => {
    await expect(guardWith(null).canActivate(ctx(adminToken))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(guardWith({ role: Role.ADMIN, status: 'ACTIVE' }).canActivate(ctx(null))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
