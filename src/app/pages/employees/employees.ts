// File: src/app/pages/employees/employees.ts
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  age: number | null;
  is_active: boolean;
  created_at: string;
  company_id: number;
}

export interface SalaryAudit {
  id: number;
  employee_id: number;
  old_salary: number;
  new_salary: number;
  changed_at: string;
}

type EmployeeTab = 'list' | 'detail' | 'add' | 'edit' | 'salary';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.html',
  styleUrls: ['./employees.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Employees implements OnInit {
  me: MeResponse | null = null;
  activeTab: EmployeeTab = 'list';

  // List
  employees: Employee[] = [];
  listLoading = false;
  totalEmployees = 0;
  totalPages = 0;
  currentPage = 1;
  pageLimit = 10;

  // Filters
  searchQuery = '';
  filterDepartment = '';
  filterPosition = '';
  filterActive = true;
  departments: string[] = [];
  positions: string[] = [];

  // Selected employee (for detail/edit/salary)
  selectedEmployee: Employee | null = null;

  // Salary history
  salaryHistory: SalaryAudit[] = [];
  salaryHistoryLoading = false;

  // Add/Edit form
  form = this.emptyForm();
  formLoading = false;
  formError = '';
  formSuccess = '';

  // Salary update
  newSalary = 0;
  salaryLoading = false;
  salaryMessage = '';

  // Delete confirm
  deleteConfirm = false;
  deleteLoading = false;

  private apiUrl = `${environment.apiUrl}/employees`;
  Math = Math;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (user: MeResponse) => {
        this.me = user;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
    this.loadEmployees();
  }

  emptyForm() {
    return {
      first_name: '',
      last_name: '',
      email: '',
      department: '',
      position: '',
      salary: 0,
      age: null as number | null,
    };
  }

  // =====================
  // LOAD EMPLOYEES
  // =====================
  loadEmployees() {
    this.listLoading = true;
    let url = `${this.apiUrl}?page=${this.currentPage}&limit=${this.pageLimit}&active=${this.filterActive}`;
    if (this.searchQuery) url += `&search=${encodeURIComponent(this.searchQuery)}`;
    if (this.filterDepartment) url += `&department=${encodeURIComponent(this.filterDepartment)}`;
    if (this.filterPosition) url += `&position=${encodeURIComponent(this.filterPosition)}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.employees = res.data || res || [];
        this.totalEmployees = res.total || this.employees.length;
        this.totalPages = res.totalPages || 1;
        this.extractFilters();
        this.listLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.listLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  extractFilters() {
    const depts = [...new Set(this.employees.map((e) => e.department).filter(Boolean))];
    const positions = [...new Set(this.employees.map((e) => e.position).filter(Boolean))];
    if (depts.length > this.departments.length) this.departments = depts;
    if (positions.length > this.positions.length) this.positions = positions;
  }

  onNewDepartment(event: Event) {
    const val = (event.target as HTMLInputElement).value.trim();
    if (val) this.form.department = val;
  }

  onSearch() {
    this.currentPage = 1;
    this.loadEmployees();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadEmployees();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadEmployees();
  }

  // =====================
  // VIEW DETAIL
  // =====================
  viewEmployee(emp: Employee) {
    this.selectedEmployee = emp;
    this.activeTab = 'detail';
    this.cdr.detectChanges();
  }

  // =====================
  // ADD EMPLOYEE
  // =====================
  openAdd() {
    this.form = this.emptyForm();
    this.formError = '';
    this.formSuccess = '';
    this.activeTab = 'add';
    this.cdr.detectChanges();
  }

  submitAdd() {
    this.formLoading = true;
    this.formError = '';
    this.formSuccess = '';

    this.http.post<Employee>(this.apiUrl, this.form).subscribe({
      next: (emp) => {
        this.formLoading = false;
        this.formSuccess = `✅ ${emp.first_name} ${emp.last_name} added successfully!`;
        this.loadEmployees();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.formSuccess = '';
          this.activeTab = 'list';
          this.cdr.detectChanges();
        }, 2000);
      },
      error: (err) => {
        this.formLoading = false;
        this.formError = err.error?.error || 'Failed to create employee';
        this.cdr.detectChanges();
      },
    });
  }

  // =====================
  // EDIT EMPLOYEE
  // =====================
  openEdit(emp: Employee) {
    this.selectedEmployee = emp;
    this.form = {
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      department: emp.department,
      position: emp.position,
      salary: emp.salary,
      age: emp.age,
    };
    this.formError = '';
    this.formSuccess = '';
    this.activeTab = 'edit';
    this.cdr.detectChanges();
  }

  submitEdit() {
    if (!this.selectedEmployee) return;
    this.formLoading = true;
    this.formError = '';

    this.http.put<Employee>(`${this.apiUrl}/${this.selectedEmployee.id}`, this.form).subscribe({
      next: (emp) => {
        this.formLoading = false;
        this.formSuccess = '✅ Employee updated successfully!';
        this.selectedEmployee = emp;
        this.loadEmployees();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.formSuccess = '';
          this.activeTab = 'detail';
          this.cdr.detectChanges();
        }, 2000);
      },
      error: (err) => {
        this.formLoading = false;
        this.formError = err.error?.error || 'Failed to update employee';
        this.cdr.detectChanges();
      },
    });
  }

  // =====================
  // DELETE EMPLOYEE
  // =====================
  confirmDelete() {
    this.deleteConfirm = true;
    this.cdr.detectChanges();
  }

  cancelDelete() {
    this.deleteConfirm = false;
    this.cdr.detectChanges();
  }

  submitDelete() {
    if (!this.selectedEmployee) return;
    this.deleteLoading = true;

    this.http.delete(`${this.apiUrl}/${this.selectedEmployee.id}`).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.deleteConfirm = false;
        this.selectedEmployee = null;
        this.activeTab = 'list';
        this.loadEmployees();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deleteLoading = false;
        this.deleteConfirm = false;
        this.formError = err.error?.error || 'Failed to deactivate employee';
        this.cdr.detectChanges();
      },
    });
  }

  // =====================
  // SALARY HISTORY
  // =====================
  openSalaryHistory(emp: Employee) {
    this.selectedEmployee = emp;
    this.newSalary = emp.salary;
    this.salaryMessage = '';
    this.salaryHistoryLoading = true;
    this.activeTab = 'salary';
    this.cdr.detectChanges();

    this.http.get<any>(`${this.apiUrl}/${emp.id}/salary-history`).subscribe({
      next: (res) => {
        this.salaryHistory = res.data || res || [];
        this.salaryHistoryLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.salaryHistory = [];
        this.salaryHistoryLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  submitSalaryUpdate() {
    if (!this.selectedEmployee) return;
    this.salaryLoading = true;
    this.salaryMessage = '';

    this.http
      .patch<Employee>(`${this.apiUrl}/${this.selectedEmployee.id}/salary`, {
        salary: this.newSalary,
      })
      .subscribe({
        next: (emp) => {
          this.salaryLoading = false;
          this.salaryMessage = '✅ Salary updated successfully!';
          this.selectedEmployee = emp;
          this.loadEmployees();
          // Reload history
          this.openSalaryHistory(emp);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.salaryLoading = false;
          this.salaryMessage = '❌ ' + (err.error?.error || 'Failed to update salary');
          this.cdr.detectChanges();
        },
      });
  }

  // =====================
  // HELPERS
  // =====================
  isAdmin(): boolean {
    return this.me?.role === 'admin' || this.me?.role === 'manager';
  }

  formatMoney(amount: number): string {
    return (amount || 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' });
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getInitials(emp: Employee): string {
    return `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}`.toUpperCase();
  }

  getAgeGroup(age: number | null): string {
    if (!age) return '—';
    if (age < 65) return `${age} (Primary rebate)`;
    if (age < 75) return `${age} (Secondary rebate)`;
    return `${age} (Tertiary rebate)`;
  }

  backToList() {
    this.activeTab = 'list';
    this.selectedEmployee = null;
    this.formError = '';
    this.formSuccess = '';
    this.deleteConfirm = false;
    this.cdr.detectChanges();
  }

  goToDashboard() {
    this.router.navigateByUrl('/dashboard');
  }
  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
