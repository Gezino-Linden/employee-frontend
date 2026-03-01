// File: src/app/pages/dashboard/dashboard.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, MeResponse } from '../../services/auth.service';

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
      error: () => {
        this.router.navigateByUrl('/login');
      },
    });
  }

  isAdmin(): boolean {
    return this.me?.role === 'admin' || this.me?.role === 'manager';
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
  goToEmp201() {
    this.router.navigateByUrl('/emp201');
  }
  goToUI19() {
    this.router.navigateByUrl('/ui19');
  }
  goToIrp5() {
    this.router.navigateByUrl('/irp5');
  }
}
