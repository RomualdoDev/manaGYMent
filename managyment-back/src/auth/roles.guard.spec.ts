import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function setup(requiredRoles: string[] | undefined, user: { role: string } | undefined) {
  const reflector = { getAllAndOverride: jest.fn(() => requiredRoles) } as unknown as Reflector;
  const guard = new RolesGuard(reflector);
  const context: any = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
  return { guard, context };
}

describe('RolesGuard', () => {
  it('allows routes without a role requirement', () => {
    const { guard, context } = setup(undefined, { role: 'STAFF' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a user with a required role', () => {
    const { guard, context } = setup(['ADMIN'], { role: 'ADMIN' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a user without a required role', () => {
    const { guard, context } = setup(['ADMIN'], { role: 'STAFF' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
