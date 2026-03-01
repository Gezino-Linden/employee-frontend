import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

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
  {
    path: 'payroll',
    loadComponent: () => import('./pages/payroll/payroll').then((m) => m.Payroll),
    canActivate: [authGuard],
  },
  {
    path: 'attendance',
    loadComponent: () => import('./pages/attendance/attendance').then((m) => m.Attendance),
    canActivate: [authGuard],
  },
  {
    path: 'employees',
    loadComponent: () => import('./pages/employees/employees').then((m) => m.Employees),
    canActivate: [authGuard],
  },
  {
    path: 'emp201',
    loadComponent: () => import('./pages/emp201/emp201').then((m) => m.EMP201),
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: 'login' },
];
