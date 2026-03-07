// File: src/app/pages/users/users.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';

const API = 'https://employee-api-xpno.onrender.com/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface RoleCount {
  role: string;
  count: number;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class UsersComponent implements OnInit {
  me: MeResponse | null = null;
  allUsers: User[] = [];
  users: User[] = [];
  roleCounts: RoleCount[] = [];

  loading = true;
  error = '';
  saving = false;
  formError = '';

  searchTerm = '';
  filterRole = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  showAddModal = false;
  showRoleModal = false;
  showDeleteModal = false;
  selectedUser: User | null = null;
  selectedRole = '';

  newUser = { name: '', email: '', role: 'supervisor' };

  allRoles = [
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Admin' },
    { value: 'general_manager', label: 'General Manager' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr_manager', label: 'HR Manager' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'front_office_manager', label: 'Front Office Manager' },
    { value: 'supervisor', label: 'Supervisor' },
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (res) => {
        this.me = res;
        this.loadUsers();
      },
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${API}/users`, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.allUsers = res.data || res.users || res || [];
        this.buildRoleCounts();
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load users';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  buildRoleCounts(): void {
    const map: Record<string, number> = {};
    this.allUsers.forEach((u) => {
      map[u.role] = (map[u.role] || 0) + 1;
    });
    this.roleCounts = Object.entries(map).map(([role, count]) => ({ role, count }));
  }

  applyFilter(): void {
    let filtered = [...this.allUsers];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      );
    }
    if (this.filterRole) {
      filtered = filtered.filter((u) => u.role === this.filterRole);
    }
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.pageSize;
    this.users = filtered.slice(start, start + this.pageSize);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFilter();
  }

  roleLabel(role: string): string {
    return this.allRoles.find((r) => r.value === role)?.label || role;
  }

  roleDescription(role: string): string {
    const desc: Record<string, string> = {
      owner: 'Full access to all modules and settings',
      admin: 'Full access to all modules',
      general_manager: 'Access to all modules, manages all staff',
      manager: 'Access to all modules, manages team',
      hr_manager: 'Employees, leave, payroll and reports',
      accountant: 'Payroll, accounting, SARS and reports',
      front_office_manager: 'Attendance, shifts, leave and reports',
      supervisor: 'Attendance and shifts for their department only',
    };
    return desc[role] || '';
  }

  canChangeRole(): boolean {
    return ['owner', 'admin'].includes(this.me?.role || '');
  }

  canDelete(): boolean {
    return ['owner', 'admin'].includes(this.me?.role || '');
  }

  openAddModal(): void {
    this.newUser = { name: '', email: '', role: 'supervisor' };
    this.formError = '';
    this.showAddModal = true;
  }

  openRoleModal(user: User): void {
    this.selectedUser = user;
    this.selectedRole = user.role;
    this.formError = '';
    this.showRoleModal = true;
  }

  confirmDelete(user: User): void {
    this.selectedUser = user;
    this.formError = '';
    this.showDeleteModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showRoleModal = false;
    this.showDeleteModal = false;
    this.selectedUser = null;
    this.formError = '';
  }

  createUser(): void {
    if (!this.newUser.name.trim() || !this.newUser.email.trim()) {
      this.formError = 'Name and email are required';
      return;
    }
    this.saving = true;
    this.formError = '';
    this.http.post<any>(`${API}/users`, this.newUser, { headers: this.headers() }).subscribe({
      next: () => {
        this.saving = false;
        this.closeModals();
        this.loadUsers();
      },
      error: (err) => {
        this.formError = err.error?.error || 'Failed to create user';
        this.saving = false;
      },
    });
  }

  updateRole(): void {
    if (!this.selectedUser) return;
    this.saving = true;
    this.formError = '';
    this.http
      .patch<any>(
        `${API}/users/${this.selectedUser.id}/role`,
        { role: this.selectedRole },
        { headers: this.headers() }
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.closeModals();
          this.loadUsers();
        },
        error: (err) => {
          this.formError = err.error?.error || 'Failed to update role';
          this.saving = false;
        },
      });
  }

  deleteUser(): void {
    if (!this.selectedUser) return;
    this.saving = true;
    this.formError = '';
    this.http
      .delete<any>(`${API}/users/${this.selectedUser.id}`, { headers: this.headers() })
      .subscribe({
        next: () => {
          this.saving = false;
          this.closeModals();
          this.loadUsers();
        },
        error: (err) => {
          this.formError = err.error?.error || 'Failed to delete user';
          this.saving = false;
        },
      });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
