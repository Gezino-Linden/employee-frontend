import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError, timer, retry } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const isRetryable = (err: HttpErrorResponse) =>
    (err.status === 0 || err.status === 503) &&
    req.method === 'GET' &&
    !req.url.includes('/auth/');

  return next(req).pipe(
    retry({
      count: 3,
      delay: (err, attempt) => {
        if (err instanceof HttpErrorResponse && isRetryable(err)) {
          return timer(attempt * 1000);
        }
        throw err;
      }
    }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        return authService.refresh().pipe(
          switchMap((res) => {
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${res.token}` } }));
          }),
          catchError(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            router.navigateByUrl('/login');
            return throwError(() => ({ ...err, userMessage: 'Your session has expired. Please log in again.' }));
          })
        );
      }

      let message = 'Something went wrong. Please try again.';
      switch (err.status) {
        case 0: message = 'Cannot reach the server. Check your internet connection.'; break;
        case 400:
          message = err.error?.details?.length
            ? err.error.details.map((d: any) => `${d.field}: ${d.message}`).join(' | ')
            : err.error?.error || 'Invalid request. Please check your input.';
          break;
        case 401: message = 'Your session has expired. Please log in again.';
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          router.navigateByUrl('/login');
          break;
        case 403: message = 'You do not have permission to do that.'; break;
        case 404: message = err.error?.error || 'The requested resource was not found.'; break;
        case 409: message = err.error?.error || 'This record already exists.'; break;
        case 422: message = err.error?.error || 'Unprocessable data. Please check your input.'; break;
        case 429: message = 'Too many requests. Please wait a few minutes and try again.'; break;
        case 500: message = 'A server error occurred. Please try again later.'; break;
        case 503: message = 'Service is temporarily unavailable. Please try again shortly.'; break;
        default: message = err.error?.error || err.message || message;
      }

      console.error(`[HTTP ${err.status}] ${req.method} ${req.url}`, { status: err.status, message, body: err.error });
      return throwError(() => ({ ...err, userMessage: message }));
    })
  );
};
