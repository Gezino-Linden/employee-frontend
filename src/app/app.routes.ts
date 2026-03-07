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
    path: 'employees',
    loadComponent: () => import('./pages/employees/employees').then((m) => m.Employees),
    canActivate: [authGuard],
  },
  {
    path: 'attendance',
    loadComponent: () => import('./pages/attendance/attendance').then((m) => m.Attendance),
    canActivate: [authGuard],
  },
  {
    path: 'shifts',
    loadComponent: () => import('./pages/shifts/shifts').then((m) => m.Shifts),
    canActivate: [authGuard],
  },
  {
    path: 'payroll',
    loadComponent: () => import('./pages/payroll/payroll').then((m) => m.Payroll),
    canActivate: [authGuard],
  },
  {
    path: 'leave',
    loadComponent: () => import('./pages/leave/leave').then((m) => m.Leave),
    canActivate: [authGuard],
  },
  {
    path: 'accounting',
    loadComponent: () => import('./pages/accounting/accounting').then((m) => m.Accounting),
    canActivate: [authGuard],
  },
  {
    path: 'sars',
    loadComponent: () => import('./pages/sars/sars').then((m) => m.Sars),
    canActivate: [authGuard],
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
    canActivate: [authGuard],
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/analytics/analytics.component').then((m) => m.AnalyticsComponent),
    canActivate: [authGuard],
  },
  // Legacy redirects — old routes now point to /sars
  { path: 'emp201', redirectTo: 'sars', pathMatch: 'full' },
  { path: 'ui19', redirectTo: 'sars', pathMatch: 'full' },
  { path: 'irp5', redirectTo: 'sars', pathMatch: 'full' },
  {
    path: 'audit-log',
    loadComponent: () => import('./pages/audit-log/audit-log').then((m) => m.AuditLogComponent),
    canActivate: [authGuard],
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users').then((m) => m.UsersComponent),
    canActivate: [authGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
  },
  { path: '**', redirectTo: 'login' },
];
