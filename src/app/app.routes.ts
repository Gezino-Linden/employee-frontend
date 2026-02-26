import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Lazy loaded routes (better performance)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup').then((m) => m.Signup),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
  },
  {
    path: 'leave',
    loadComponent: () => import('./pages/leave/leave').then((m) => m.Leave),
    canActivate: [authGuard],
  },
  // ADD PAYROLL ROUTE:
  {
    path: 'payroll',
    loadComponent: () => import('./pages/payroll/payroll').then((m) => m.Payroll),
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: 'login' },
];
