// File: src/app/pages/dashboard/dashboard.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, MeResponse } from '../../services/auth.service';
import { EmployeesService, Employee, CreateEmployeeDto } from '../../services/employees.service';

type EmployeesApiResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: Employee[];
};

type ModalMode = 'create' | 'edit' | 'view' | null;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  // ===== PROFILE =====
  me: MeResponse | null = null;
  loadingProfile = true;
  profileError = '';

  // ===== EMPLOYEES =====
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  loadingEmployees = true;
  employeesError = '';
  searchTerm = '';

  // ===== PAGINATION =====
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;

  // ===== MODAL =====
  modalMode: ModalMode = null;
  selectedEmployee: Employee | null = null;
  modalLoading = false;
  modalError = '';
  modalSuccess = '';

  // ===== FORM =====
  employeeForm: FormGroup;

  // ===== DELETE CONFIRM =====
  showDeleteConfirm = false;
  deleteTargetId: number | null = null;
  deleteLoading = false;

  // ===== SALARY MODAL =====
  showSalaryModal = false;
  salaryTargetEmployee: Employee | null = null;
  newSalary = 0;
  salaryLoading = false;
  salaryError = '';

  constructor(
    private auth: AuthService,
    private employeesService: EmployeesService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.employeeForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      department: ['', Validators.required],
      position: ['', Validators.required],
      salary: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadEmployees();
  }

  // ========================= PROFILE =========================
  loadProfile() {
    this.loadingProfile = true;
    this.auth.getMe().subscribe({
      next: (res: MeResponse) => {
        this.me = res;
        this.loadingProfile = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.profileError = err?.error?.error || 'Failed to load profile';
        this.loadingProfile = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= EMPLOYEES =========================
  loadEmployees() {
    this.loadingEmployees = true;
    this.employeesError = '';
    this.employeesService.list(this.page, this.limit).subscribe({
      next: (res: EmployeesApiResponse) => {
        this.page = res?.page ?? this.page;
        this.limit = res?.limit ?? this.limit;
        this.total = res?.total ?? 0;
        this.totalPages = res?.totalPages ?? 1;
        this.employees = res?.data ?? [];
        this.applyFilter();
        this.loadingEmployees = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.employeesError = err?.error?.error || 'Failed to load employees';
        this.loadingEmployees = false;
        this.cdr.detectChanges();
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
  trackById = (_: number, item: Employee) => item?.id;

  // ========================= MODAL =========================
  openCreateModal() {
    this.modalMode = 'create';
    this.modalError = '';
    this.modalSuccess = '';
    this.employeeForm.reset({ salary: 0 });
    this.cdr.detectChanges();
  }

  openEditModal(employee: Employee) {
    this.modalMode = 'edit';
    this.selectedEmployee = employee;
    this.modalError = '';
    this.modalSuccess = '';
    this.employeeForm.patchValue({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      department: employee.department,
      position: employee.position,
      salary: employee.salary,
    });
    this.cdr.detectChanges();
  }

  openViewModal(employee: Employee) {
    this.modalMode = 'view';
    this.selectedEmployee = employee;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.modalMode = null;
    this.selectedEmployee = null;
    this.modalError = '';
    this.modalSuccess = '';
    this.employeeForm.reset();
    this.cdr.detectChanges();
  }

  // ========================= CREATE =========================
  submitCreate() {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }
    this.modalLoading = true;
    this.modalError = '';
    const data: CreateEmployeeDto = this.employeeForm.value;
    this.employeesService.create(data).subscribe({
      next: () => {
        this.modalLoading = false;
        this.modalSuccess = 'Employee created successfully!';
        setTimeout(() => {
          this.closeModal();
          this.loadEmployees();
        }, 1200);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.modalLoading = false;
        this.modalError = err?.error?.error || 'Failed to create employee';
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= UPDATE =========================
  submitEdit() {
    if (this.employeeForm.invalid || !this.selectedEmployee) {
      this.employeeForm.markAllAsTouched();
      return;
    }
    this.modalLoading = true;
    this.modalError = '';
    this.employeesService.update(this.selectedEmployee.id, this.employeeForm.value).subscribe({
      next: () => {
        this.modalLoading = false;
        this.modalSuccess = 'Employee updated successfully!';
        setTimeout(() => {
          this.closeModal();
          this.loadEmployees();
        }, 1200);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.modalLoading = false;
        this.modalError = err?.error?.error || 'Failed to update employee';
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= DELETE =========================
  confirmDelete(id: number) {
    this.deleteTargetId = id;
    this.showDeleteConfirm = true;
    this.cdr.detectChanges();
  }

  cancelDelete() {
    this.deleteTargetId = null;
    this.showDeleteConfirm = false;
    this.cdr.detectChanges();
  }

  executeDelete() {
    if (!this.deleteTargetId) return;
    this.deleteLoading = true;
    this.employeesService.delete(this.deleteTargetId).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.showDeleteConfirm = false;
        this.deleteTargetId = null;
        this.loadEmployees();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.deleteLoading = false;
        this.employeesError = err?.error?.error || 'Failed to delete employee';
        this.showDeleteConfirm = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= RESTORE =========================
  restoreEmployee(id: number) {
    this.employeesService.restore(id).subscribe({
      next: () => {
        this.loadEmployees();
      },
      error: (err: any) => {
        this.employeesError = err?.error?.error || 'Failed to restore employee';
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= SALARY =========================
  openSalaryModal(employee: Employee) {
    this.salaryTargetEmployee = employee;
    this.newSalary = employee.salary;
    this.salaryError = '';
    this.showSalaryModal = true;
    this.cdr.detectChanges();
  }

  closeSalaryModal() {
    this.showSalaryModal = false;
    this.salaryTargetEmployee = null;
    this.salaryError = '';
    this.cdr.detectChanges();
  }

  submitSalary() {
    if (!this.salaryTargetEmployee || this.newSalary < 0) return;
    this.salaryLoading = true;
    this.salaryError = '';
    this.employeesService.updateSalary(this.salaryTargetEmployee.id, this.newSalary).subscribe({
      next: () => {
        this.salaryLoading = false;
        this.closeSalaryModal();
        this.loadEmployees();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.salaryLoading = false;
        this.salaryError = err?.error?.error || 'Failed to update salary';
        this.cdr.detectChanges();
      },
    });
  }

  // ========================= HELPERS =========================
  formatMoney(value: any): string {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(
      Number(value ?? 0)
    );
  }

  getInitials(emp: Employee): string {
    return `${emp.first_name?.[0] ?? ''}${emp.last_name?.[0] ?? ''}`.toUpperCase();
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? '#16a34a' : '#dc2626';
  }

  isAdmin(): boolean {
    return this.me?.role === 'admin';
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  goToLeave() {
    this.router.navigateByUrl('/leave');
  }

  goToPayroll() {
    this.router.navigateByUrl('/payroll');
  }

  // ========================= FORM HELPERS =========================
  fc(name: string) {
    return this.employeeForm.get(name);
  }
  hasError(name: string, error: string) {
    const c = this.fc(name);
    return c?.hasError(error) && c?.touched;
  }
}
