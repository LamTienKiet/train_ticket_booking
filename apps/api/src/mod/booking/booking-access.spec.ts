import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { assertBookingAccess } from './booking.service';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('assertBookingAccess', () => {
  const booking = {
    userId: 'u1',
    contactPhone: '0901 234 567',
    passengers: [{ phone: '0911111111' }],
  };

  it('cho phép chủ booking, STAFF/ADMIN, hoặc đúng SĐT', () => {
    expect(() =>
      assertBookingAccess(booking, { sub: 'u1', role: Role.CUSTOMER }),
    ).not.toThrow();
    expect(() =>
      assertBookingAccess(booking, { sub: 'x', role: Role.STAFF }),
    ).not.toThrow();
    expect(() =>
      assertBookingAccess(booking, null, '0901234567'),
    ).not.toThrow();
    expect(() =>
      assertBookingAccess(booking, null, '0911111111'),
    ).not.toThrow();
  });

  it('chặn người lạ, user khác, SĐT sai hoặc rỗng', () => {
    expect(() => assertBookingAccess(booking, null)).toThrow(
      ForbiddenException,
    );
    expect(() =>
      assertBookingAccess(booking, { sub: 'u2', role: Role.CUSTOMER }),
    ).toThrow(ForbiddenException);
    expect(() => assertBookingAccess(booking, null, '0999999999')).toThrow(
      ForbiddenException,
    );
    expect(() => assertBookingAccess(booking, null, 'abc')).toThrow(
      ForbiddenException,
    );
  });

  it('booking khách vãng lai (userId null) không mở cho mọi user đăng nhập', () => {
    expect(() =>
      assertBookingAccess(
        { ...booking, userId: null },
        { sub: 'u2', role: Role.CUSTOMER },
      ),
    ).toThrow(ForbiddenException);
  });
});

describe('RolesGuard', () => {
  const ctx = (role?: Role) =>
    ({
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : null }),
      }),
    }) as unknown as ExecutionContext;
  const guard = new RolesGuard({
    getAllAndOverride: () => [Role.ADMIN],
  } as unknown as Reflector);

  it('chỉ ADMIN qua được @Roles(ADMIN)', () => {
    expect(guard.canActivate(ctx(Role.ADMIN))).toBe(true);
    expect(() => guard.canActivate(ctx(Role.CUSTOMER))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(ctx())).toThrow(ForbiddenException);
  });
});
