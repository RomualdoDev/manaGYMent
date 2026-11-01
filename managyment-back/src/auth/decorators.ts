import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { AuthUser, Role } from './auth.types';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const ALLOW_PENDING_PASSWORD_KEY = 'allowPendingPassword';

// Route that does not require a token.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Roles allowed to call the route or controller. Without it, any logged-in user can call it.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Route a user can call while mustChangePassword is still true.
export const AllowPendingPassword = () => SetMetadata(ALLOW_PENDING_PASSWORD_KEY, true);

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => {
  return context.switchToHttp().getRequest().user;
});
