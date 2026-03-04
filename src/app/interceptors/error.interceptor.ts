// File: src/app/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // ── Friendly message map ──────────────────────────────
      let message = 'Something went wrong. Please try again.';

      switch (err.status) {
        case 0:
          message = 'Cannot reach the server. Check your internet connection.';
          break;

        case 400:
          // Show validation details if present
          if (err.error?.details?.length) {
            message = err.error.details.map((d: any) => `${d.field}: ${d.message}`).join(' | ');
          } else {
            message = err.error?.error || 'Invalid request. Please check your input.';
          }
          break;

        case 401:
          message = 'Your session has expired. Please log in again.';
          // Clear token and redirect to login
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          router.navigateByUrl('/login');
          break;

        case 403:
          message = 'You do not have permission to do that.';
          break;

        case 404:
          message = err.error?.error || 'The requested resource was not found.';
          break;

        case 409:
          message = err.error?.error || 'This record already exists.';
          break;

        case 422:
          message = err.error?.error || 'Unprocessable data. Please check your input.';
          break;

        case 429:
          message = 'Too many requests. Please wait a few minutes and try again.';
          break;

        case 500:
          message = 'A server error occurred. Please try again later.';
          break;

        case 503:
          message = 'Service is temporarily unavailable. Please try again shortly.';
          break;

        default:
          message = err.error?.error || err.message || message;
      }

      // ── Console logging (dev-friendly) ───────────────────
      console.error(`[HTTP ${err.status}] ${req.method} ${req.url}`, {
        status: err.status,
        message,
        body: err.error,
      });

      // ── Return a clean Error with the friendly message ────
      return throwError(() => ({ ...err, userMessage: message }));
    })
  );
};
