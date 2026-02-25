import { Routes } from '@angular/router';

import { authGuard } from './guards/auth-guard';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Dashboard } from './pages/dashboard/dashboard';
import { Leave } from './pages/leave/leave';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'leave', component: Leave, canActivate: [authGuard] }, // ← ADD authGuard

  { path: '**', redirectTo: 'login' },
];
