import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService, AuthUser, Role } from './auth.service';

// Where a logged-in user should land. Users who still have to change the temporary password go there first.
export function homePath(user: AuthUser): string {
  if (user.mustChangePassword) {
    return '/change-password';
  }
  return user.role === 'ADMIN' ? '/admin' : '/clients';
}

// Needs a session. Routes with data.allowPendingPassword stay open while the password must be changed.
// Routes with data.roles are only for those roles.
export const authGuard: CanActivateFn = (route): boolean | UrlTree => {
  const router = inject(Router);
  const user = inject(AuthService).user();

  if (!user) {
    return router.createUrlTree(['/login']);
  }
  if (user.mustChangePassword && !route.data['allowPendingPassword']) {
    return router.createUrlTree(['/change-password']);
  }
  const roles = route.data['roles'] as Role[] | undefined;
  if (roles && !roles.includes(user.role)) {
    return router.createUrlTree([homePath(user)]);
  }
  return true;
};

// The empty path just sends the user to the right screen.
export const homeGuard: CanActivateFn = (): UrlTree => {
  const router = inject(Router);
  const user = inject(AuthService).user();
  return router.createUrlTree([user ? homePath(user) : '/login']);
};
