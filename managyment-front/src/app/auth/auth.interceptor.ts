import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../api';
import { AuthService } from './auth.service';

// Adds the Bearer token to API calls. If the server rejects an existing session, the user goes back to login.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  const isApiCall = req.url.startsWith(API_URL);

  const outgoing = token && isApiCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      const isLoginAttempt = req.url.endsWith('/auth/login');
      if (error instanceof HttpErrorResponse && error.status === 401 && token && !isLoginAttempt) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
