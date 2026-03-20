import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const loggedIn = localStorage.getItem('loggedIn') || localStorage.getItem('token');
  if (loggedIn) return true;
  router.navigateByUrl('/login');
  return false;
};
