import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService, MeResponse } from '../../services/auth.service';
import { EmployeesService } from '../../services/employees.service';

type EmployeesApiResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: any[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  // ===== PROFILE =====
  me: MeResponse | null = null;
  loadingProfile = true;
  profileError = '';

  // ===== EMPLOYEES =====
  employees: any[] = [];
  filteredEmployees: any[] = [];
  loadingEmployees = true;
  employeesError = '';

  // pagination
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;

  searchTerm = '';

  constructor(
    private auth: AuthService,
    private employeesService: EmployeesService,
    private router: Router,
    private cdr: ChangeDetectorRef // ✅ ADD THIS
  ) {}

  ngOnInit(): void {
    console.log('🚀 Dashboard ngOnInit called');
    this.loadProfile();
    this.loadEmployees();
  }

  // =========================
  // PROFILE
  // =========================
  loadProfile() {
    console.log('📋 Starting loadProfile...');
    this.loadingProfile = true;
    this.profileError = '';

    this.auth.getMe().subscribe({
      next: (res: MeResponse) => {
        console.log('✅ Profile loaded successfully:', res);
        this.me = res;
        this.loadingProfile = false;
        this.cdr.detectChanges(); // ✅ ADD THIS
      },
      error: (err: any) => {
        console.error('❌ Profile error:', err);
        this.profileError = err?.error?.error || err?.error?.message || 'Failed to load profile';
        this.loadingProfile = false;
        this.cdr.detectChanges(); // ✅ ADD THIS
      },
    });
  }

  // =========================
  // EMPLOYEES
  // =========================
  loadEmployees() {
    console.log('👥 Starting loadEmployees...');
    console.log('Page:', this.page, 'Limit:', this.limit);

    this.loadingEmployees = true;
    this.employeesError = '';

    this.employeesService.list(this.page, this.limit).subscribe({
      next: (res: EmployeesApiResponse) => {
        console.log('✅ Employees loaded successfully:', res);
        console.log('Total employees:', res?.total);
        console.log('Data array length:', res?.data?.length);

        this.page = res?.page ?? this.page;
        this.limit = res?.limit ?? this.limit;
        this.total = res?.total ?? 0;
        this.totalPages = res?.totalPages ?? 1;

        this.employees = res?.data ?? [];
        this.applyFilter();
        this.loadingEmployees = false;
        this.cdr.detectChanges(); // ✅ ADD THIS
      },
      error: (err: any) => {
        console.error('❌ Employees error:', err);
        this.employeesError =
          err?.error?.error || err?.error?.message || 'Failed to load employees';
        this.loadingEmployees = false;
        this.cdr.detectChanges(); // ✅ ADD THIS
      },
    });
  }

  applyFilter() {
    const term = (this.searchTerm || '').trim().toLowerCase();
    if (!term) {
      this.filteredEmployees = [...this.employees];
      return;
    }

    this.filteredEmployees = this.employees.filter((e) => {
      const fullName = `${e.first_name ?? ''} ${e.last_name ?? ''}`.toLowerCase();
      return (
        String(e.id ?? '').includes(term) ||
        fullName.includes(term) ||
        String(e.email ?? '')
          .toLowerCase()
          .includes(term) ||
        String(e.department ?? '')
          .toLowerCase()
          .includes(term) ||
        String(e.position ?? '')
          .toLowerCase()
          .includes(term)
      );
    });
  }

  refresh() {
    console.log('🔄 Refresh clicked');
    this.loadEmployees();
  }

  prevPage() {
    if (this.page <= 1) return;
    this.page--;
    this.loadEmployees();
  }

  nextPage() {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.loadEmployees();
  }

  trackById = (_: number, item: any) => item?.id;

  logout() {
    console.log('👋 Logout clicked');
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
