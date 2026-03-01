// File: src/app/pages/reports/reports.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';

export interface ReportPreview {
  employee_count: number;
  active_employees: number;
  payroll_records: number;
  total_gross: number;
  total_net: number;
  total_paye: number;
  total_uif: number;
  leave_requests: number;
  approved_leave: number;
  attendance_records: number;
  emp201_count: number;
  ui19_count: number;
  irp5_count: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css'],
})
export class Reports implements OnInit {
  me: MeResponse | null = null;

  filterYear = new Date().getFullYear();
  filterMonth = 0; // 0 = full year
  preview: ReportPreview | null = null;
  loadingPreview = false;

  excelLoading = false;
  pdfLoading = false;
  errorMsg = '';

  months = [
    { value: 0, label: 'Full Year' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  private apiBase = 'https://employee-api-xpno.onrender.com/api/reports';

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.auth.getMe().subscribe({
      next: (res) => {
        this.me = res;
        this.cdr.detectChanges();
      },
      error: () => this.router.navigateByUrl('/login'),
    });
    this.loadPreview();
  }

  loadPreview() {
    this.loadingPreview = true;
    this.errorMsg = '';
    const params = this.buildParams();
    this.http.get<ReportPreview>(`${this.apiBase}/preview${params}`).subscribe({
      next: (data) => {
        this.preview = data;
        this.loadingPreview = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPreview = false;
        this.cdr.detectChanges();
      },
    });
  }

  buildParams(): string {
    let p = `?year=${this.filterYear}`;
    if (this.filterMonth > 0) p += `&month=${this.filterMonth}`;
    return p;
  }

  exportExcel() {
    this.excelLoading = true;
    this.errorMsg = '';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const params = this.buildParams();
    fetch(`${this.apiBase}/export/excel${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Export failed');
        return r.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const period = this.filterMonth > 0 ? `-${this.filterMonth}` : '';
        a.href = url;
        a.setAttribute('download', `HR-Report-${this.filterYear}${period}.xlsx`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.excelLoading = false;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.errorMsg = 'Failed to export Excel. Please try again.';
        this.excelLoading = false;
        this.cdr.detectChanges();
      });
  }

  exportPDF() {
    this.pdfLoading = true;
    this.errorMsg = '';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const params = this.buildParams();
    fetch(`${this.apiBase}/export/pdf${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Export failed');
        return r.text();
      })
      .then((html) => {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          setTimeout(() => {
            win.print();
          }, 600);
        }
        this.pdfLoading = false;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.errorMsg = 'Failed to generate PDF. Please try again.';
        this.pdfLoading = false;
        this.cdr.detectChanges();
      });
  }

  getPeriodLabel(): string {
    if (this.filterMonth === 0) return `Full Year ${this.filterYear}`;
    return `${this.months[this.filterMonth].label} ${this.filterYear}`;
  }

  formatMoney(val: any): string {
    return Number(val || 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' });
  }

  isManager(): boolean {
    return this.me?.role === 'admin' || this.me?.role === 'manager';
  }
  goToDashboard() {
    this.router.navigateByUrl('/dashboard');
  }
  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
