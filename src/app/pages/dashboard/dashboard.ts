// File: src/app/pages/dashboard/dashboard.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, MeResponse } from '../../services/auth.service';

// Role-based access map — what each role can see on the dashboard
const ROLE_ACCESS: Record<string, string[]> = {
  owner: [
    'employees',
    'attendance',
    'shifts',
    'leave',
    'payroll',
    'accounting',
    'sars',
    'analytics',
    'reports',
    'audit',
    'users',
  ],
  admin: [
    'employees',
    'attendance',
    'shifts',
    'leave',
    'payroll',
    'accounting',
    'sars',
    'analytics',
    'reports',
    'audit',
    'users',
  ],
  general_manager: [
    'employees',
    'attendance',
    'shifts',
    'leave',
    'payroll',
    'accounting',
    'sars',
    'analytics',
    'reports',
    'audit',
    'users',
  ],
  manager: [
    'employees',
    'attendance',
    'shifts',
    'leave',
    'payroll',
    'accounting',
    'sars',
    'analytics',
    'reports',
    'audit',
    'users',
  ],
  hr_manager: ['employees', 'attendance', 'leave', 'shifts', 'payroll', 'reports', 'audit'],
  accountant: ['payroll', 'accounting', 'sars', 'reports'],
  front_office_manager: ['attendance', 'shifts', 'leave', 'reports'],
  supervisor: ['attendance', 'shifts', 'leave'],
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  me: MeResponse | null = null;

  constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (res: MeResponse) => {
        this.me = res;
        this.cdr.detectChanges();
      },
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  can(feature: string): boolean {
    if (!this.me?.role) return false;
    const access = ROLE_ACCESS[this.me.role];
    if (!access) return false;
    return access.includes(feature);
  }

  get roleLabel(): string {
    const labels: Record<string, string> = {
      owner: 'Owner',
      admin: 'Admin',
      general_manager: 'General Manager',
      manager: 'Manager',
      hr_manager: 'HR Manager',
      accountant: 'Accountant',
      front_office_manager: 'Front Office Manager',
      supervisor: 'Supervisor',
    };
    return labels[this.me?.role || ''] || this.me?.role || '';
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  goToEmployees() {
    this.router.navigateByUrl('/employees');
  }
  goToAttendance() {
    this.router.navigateByUrl('/attendance');
  }
  goToPayroll() {
    this.router.navigateByUrl('/payroll');
  }
  goToLeave() {
    this.router.navigateByUrl('/leave');
  }
  goToShifts() {
    this.router.navigateByUrl('/shifts');
  }
  goToAccounting() {
    this.router.navigateByUrl('/accounting');
  }
  goToSars() {
    this.router.navigateByUrl('/sars');
  }
  goToAnalytics() {
    this.router.navigateByUrl('/analytics');
  }
  goToReports() {
    this.router.navigateByUrl('/reports');
  }
  goToAuditLog() {
    this.router.navigateByUrl('/audit-log');
  }
  goToUsers() {
    this.router.navigateByUrl('/users');
  }
}
