// File: src/app/pages/audit-log/audit-log.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';

const API = 'https://employee-api-xpno.onrender.com/api';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log.html',
  styleUrls: ['./audit-log.css'],
})
export class AuditLogComponent implements OnInit {
  me: MeResponse | null = null;
  logs: any[] = [];
  summary: any[] = [];
  loading = false;
  error = '';
  currentPage = 1;
  totalPages = 1;
  total = 0;
  filterEntity = '';
  filterAction = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (res: MeResponse) => {
        this.me = res;
        this.loadLogs();
        this.loadSummary();
        this.cdr.detectChanges();
      },
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadLogs(): void {
    this.loading = true;
    this.error = '';
    let url = `${API}/audit?page=${this.currentPage}&limit=20`;
    if (this.filterEntity) url += `&entity_type=${this.filterEntity}`;
    if (this.filterAction) url += `&action=${this.filterAction}`;

    this.http.get<any>(url, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.logs = res.data || [];
        this.totalPages = res.totalPages || 1;
        this.total = res.total || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load audit logs';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadSummary(): void {
    this.http.get<any>(`${API}/audit/summary?days=30`, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.summary = res.summary || [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  clearFilters(): void {
    this.filterEntity = '';
    this.filterAction = '';
    this.currentPage = 1;
    this.loadLogs();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadLogs();
  }

  toggleExpand(log: any): void {
    log.expanded = !log.expanded;
    this.cdr.detectChanges();
  }

  getCount(action: string, entityType: string): number {
    const item = this.summary.find((s) => s.action === action && s.entity_type === entityType);
    return item ? item.count : 0;
  }

  countChanges(changes: any): number {
    if (!changes) return 0;
    try {
      const obj = typeof changes === 'string' ? JSON.parse(changes) : changes;
      return Object.keys(obj).length;
    } catch {
      return 0;
    }
  }

  getChanges(changes: any): { field: string; old: any; new: any }[] {
    if (!changes) return [];
    try {
      const obj = typeof changes === 'string' ? JSON.parse(changes) : changes;
      return Object.entries(obj).map(([field, val]: any) => ({
        field,
        old: val?.old ?? '—',
        new: val?.new ?? '—',
      }));
    } catch {
      return [];
    }
  }

  formatDate(dt: string): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatTime(dt: string): string {
    if (!dt) return '';
    return new Date(dt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
