import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { ALLOW_PENDING_PASSWORD_KEY, IS_PUBLIC_KEY } from './decorators';

const activeStaff = {
  id: 2,
  username: 'dono',
  name: 'Dono',
  passwordHash: 'hash-secreto',
  role: 'STAFF',
  active: true,
  mustChangePassword: false,
  gymId: 1,
  gym: { active: true },
};

function setup(user: unknown, { isPublic = false, allowPending = false, verifyFails = false } = {}) {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      if (key === ALLOW_PENDING_PASSWORD_KEY) return allowPending;
      return undefined;
    }),
  } as unknown as Reflector;
  const jwt = {
    verifyAsync: verifyFails
      ? jest.fn(async () => {
          throw new Error('invalid signature');
        })
      : jest.fn(async () => ({ sub: 2, role: 'STAFF', gymId: 1 })),
  };
  const prisma = { user: { findUnique: jest.fn(async () => user) } };
  const guard = new AuthGuard(reflector, jwt as any, prisma as any);
  return { guard };
}

function httpContext(authorization?: string) {
  const request: any = { headers: authorization ? { authorization } : {} };
  const context: any = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  };
  return { context, request };
}

describe('AuthGuard', () => {
  it('lets public routes through without a token', async () => {
    const { guard } = setup(null, { isPublic: true });
    const { context } = httpContext();

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects a request without a token', async () => {
    const { guard } = setup(activeStaff);
    const { context } = httpContext();

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token that fails verification', async () => {
    const { guard } = setup(activeStaff, { verifyFails: true });
    const { context } = httpContext('Bearer token-invalido');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an inactive user', async () => {
    const { guard } = setup({ ...activeStaff, active: false });
    const { context } = httpContext('Bearer token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a staff member whose gym is inactive', async () => {
    const { guard } = setup({ ...activeStaff, gym: { active: false } });
    const { context } = httpContext('Bearer token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('blocks routes while the password still has to be changed', async () => {
    const { guard } = setup({ ...activeStaff, mustChangePassword: true });
    const { context } = httpContext('Bearer token');

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('allows marked routes while the password still has to be changed', async () => {
    const { guard } = setup({ ...activeStaff, mustChangePassword: true }, { allowPending: true });
    const { context, request } = httpContext('Bearer token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 2,
      username: 'dono',
      name: 'Dono',
      role: 'STAFF',
      gymId: 1,
      mustChangePassword: true,
    });
    expect(request.user).not.toHaveProperty('passwordHash');
  });
});
