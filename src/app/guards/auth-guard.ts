import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('accessToken='));
  if (token || hasCookie) return true;
  router.navigateByUrl('/login');
  return false;
};
