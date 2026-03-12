// File: src/app/pages/reports/reports.ts
import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

export interface ReportPreview {
  employee_count: number;
  active_employees: number;
  inactive_employees: number;
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

export interface ReportType {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: string;
  requiresMonth: boolean;
  requiresDateRange: boolean;
  excelEndpoint: string;
  pdfEndpoint: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css'],
})
export class Reports implements OnInit {
  private destroyRef = inject(DestroyRef);

  me: MeResponse | null = null;

  // Filters
  filterYear = new Date().getFullYear();
  filterMonth = new Date().getMonth() + 1;
  filterStartDate = '';
  filterEndDate = '';

  // State
  preview: ReportPreview | null = null;
  loadingPreview = false;
  selectedReportId = 'full_hr';
  loadingStates: Record<string, boolean> = {};
  errorMsg = '';
  successMsg = '';

  months = [
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

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  reportTypes: ReportType[] = [
    // ── FULL REPORT ─────────────────────────────────────────────
    {
      id: 'full_hr',
      label: 'Full HR Report',
      icon: '',
      description: 'Complete export — employees, payroll, leave, attendance & SARS in one file',
      category: 'Full Reports',
      requiresMonth: false,
      requiresDateRange: false,
      excelEndpoint: '/reports/export/excel',
      pdfEndpoint: '/reports/export/pdf',
    },

    // ── EMPLOYEE REPORTS ─────────────────────────────────────────
    {
      id: 'employee_register',
      label: 'Employee Register',
      icon: '',
      description: 'Full employee list with salaries, departments, positions & tax numbers',
      category: 'Employees',
      requiresMonth: false,
      requiresDateRange: false,
      excelEndpoint: '/reports/employees/export/excel',
      pdfEndpoint: '/reports/employees/export/pdf',
    },
    {
      id: 'employee_headcount',
      label: 'Headcount by Department',
      icon: '',
      description: 'Employee counts per department with active/inactive breakdown',
      category: 'Employees',
      requiresMonth: false,
      requiresDateRange: false,
      excelEndpoint: '/reports/employees/headcount/export/excel',
      pdfEndpoint: '/reports/employees/headcount/export/pdf',
    },

    // ── PAYROLL REPORTS ──────────────────────────────────────────
    {
      id: 'payroll_summary',
      label: 'Payroll Summary',
      icon: '',
      description: 'Monthly payroll totals — gross, PAYE, UIF, net pay per employee',
      category: 'Payroll',
      requiresMonth: true,
      requiresDateRange: false,
      excelEndpoint: '/reports/payroll/export/excel',
      pdfEndpoint: '/reports/payroll/export/pdf',
    },
    {
      id: 'payroll_detailed',
      label: 'Payroll Detailed Breakdown',
      icon: '',
      description: 'Full payroll detail with all earnings, deductions, and payment status',
      category: 'Payroll',
      requiresMonth: true,
      requiresDateRange: false,
      excelEndpoint: '/reports/payroll/detailed/export/excel',
      pdfEndpoint: '/reports/payroll/detailed/export/pdf',
    },
    {
      id: 'payroll_ytd',
      label: 'Payroll Year-to-Date',
      icon: '',
      description: 'Cumulative payroll totals from January to selected month',
      category: 'Payroll',
      requiresMonth: true,
      requiresDateRange: false,
      excelEndpoint: '/reports/payroll/ytd/export/excel',
      pdfEndpoint: '/reports/payroll/ytd/export/pdf',
    },

    // ── ATTENDANCE REPORTS ───────────────────────────────────────
    {
      id: 'attendance_monthly',
      label: 'Monthly Attendance Report',
      icon: '',
      description: 'Hours worked, overtime, late arrivals and absences per employee',
      category: 'Attendance',
      requiresMonth: true,
      requiresDateRange: false,
      excelEndpoint: '/reports/attendance/export/excel',
      pdfEndpoint: '/reports/attendance/export/pdf',
    },
    {
      id: 'attendance_range',
      label: 'Attendance by Date Range',
      icon: '',
      description: 'Detailed daily clock-in/out records for a custom date range',
      category: 'Attendance',
      requiresMonth: false,
      requiresDateRange: true,
      excelEndpoint: '/reports/attendance/range/export/excel',
      pdfEndpoint: '/reports/attendance/range/export/pdf',
    },
    {
      id: 'overtime_report',
      label: 'Overtime Report',
      icon: '⏰',
      description: 'Overtime hours and costs per employee for the selected month',
      category: 'Attendance',
      requiresMonth: true,
      requiresDateRange: false,
      excelEndpoint: '/reports/attendance/overtime/export/excel',
      pdfEndpoint: '/reports/attendance/overtime/export/pdf',
    },

    // ── LEAVE REPORTS ────────────────────────────────────────────
    {
      id: 'leave_balances',
      label: 'Leave Balances',
      icon: '️',
      description: 'Current leave balances per employee and leave type',
      category: 'Leave',
      requiresMonth: false,
      requiresDateRange: false,
      excelEndpoint: '/reports/leave/balances/export/excel',
      pdfEndpoint: '/reports/leave/balances/export/pdf',
    },
    {
      id: 'leave_taken',
      label: 'Leave Taken Report',
      icon: '️',
      description: 'All approved leave requests with dates and leave types for the year',
      category: 'Leave',
      requiresMonth: false,
      requiresDateRange: false,
      excelEndpoint: '/reports/leave/taken/export/excel',
      pdfEndpoint: '/reports/leave/taken/export/pdf',
    },

    // ── SARS / TAX REPORTS ───────────────────────────────────────
    {
      id: 'sars_emp201',
      label: 'EMP201 PAYE Report',
      icon: '️',
      description: 'Monthly PAYE, SDL and UIF liability for SARS submission',
      category: 'SARS & Tax',
      requiresMonth: true,
      requiresDateRange: false,
      excelEndpoint: '/reports/sars/emp201/export/excel',
      pdfEndpoint: '/reports/sars/emp201/export/pdf',
    },
    {
      id: 'sars_tax_liability',
      label: 'Tax Liability Summary',
      icon: '',
      description: 'Outstanding PAYE, UIF and SDL liabilities for the year',
      category: 'SARS & Tax',
      requiresMonth: false,
      requiresDateRange: false,
      excelEndpoint: '/reports/sars/liability/export/excel',
      pdfEndpoint: '/reports/sars/liability/export/pdf',
    },
  ];

  get reportCategories(): string[] {
    return [...new Set(this.reportTypes.map((r) => r.category))];
  }

  get selectedReport(): ReportType {
    return this.reportTypes.find((r) => r.id === this.selectedReportId) ?? this.reportTypes[0];
  }

  private apiBase = `${environment.apiUrl}`;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Set default date range to current month
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    this.filterStartDate = `${y}-${m}-01`;
    this.filterEndDate = now.toISOString().split('T')[0];

    this.auth
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.http
      .get<ReportPreview>(`${this.apiBase}/reports/preview${this.buildParams()}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    const report = this.selectedReport;
    let p = `?year=${this.filterYear}`;
    if (report.requiresMonth) {
      p += `&month=${this.filterMonth}`;
    }
    if (report.requiresDateRange) {
      if (this.filterStartDate) p += `&start_date=${this.filterStartDate}`;
      if (this.filterEndDate) p += `&end_date=${this.filterEndDate}`;
    }
    return p;
  }

  selectReport(id: string) {
    this.selectedReportId = id;
    this.errorMsg = '';
    this.successMsg = '';
    this.cdr.detectChanges();
  }

  exportExcel() {
    const report = this.selectedReport;
    const key = `${report.id}_excel`;
    this.loadingStates[key] = true;
    this.errorMsg = '';
    this.successMsg = '';

    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const url = `${this.apiBase}${report.excelEndpoint}${this.buildParams()}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        this.downloadBlob(
          blob,
          `${report.id}-${this.filterYear}${
            report.requiresMonth ? '-' + this.filterMonth : ''
          }.xlsx`
        );
        this.successMsg = `${report.label} exported successfully.`;
        this.loadingStates[key] = false;
        this.cdr.detectChanges();
      })
      .catch((e) => {
        this.errorMsg =
          e.message === '404'
            ? `This report is not yet available on the backend.`
            : `Failed to export. Please try again.`;
        this.loadingStates[key] = false;
        this.cdr.detectChanges();
      });
  }

  exportPDF() {
    const report = this.selectedReport;
    const key = `${report.id}_pdf`;
    this.loadingStates[key] = true;
    this.errorMsg = '';
    this.successMsg = '';

    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const url = `${this.apiBase}${report.pdfEndpoint}${this.buildParams()}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        // If blob is PDF, download it directly
        if (blob.type === 'application/pdf') {
          this.downloadBlob(
            blob,
            `${report.id}-${this.filterYear}${
              report.requiresMonth ? '-' + this.filterMonth : ''
            }.pdf`
          );
        } else {
          // Legacy HTML print approach
          blob.text().then((html) => {
            const win = window.open('', '_blank');
            if (win) {
              win.document.write(html);
              win.document.close();
              setTimeout(() => win.print(), 600);
            }
          });
        }
        this.successMsg = `${report.label} PDF generated successfully.`;
        this.loadingStates[key] = false;
        this.cdr.detectChanges();
      })
      .catch((e) => {
        this.errorMsg =
          e.message === '404'
            ? `This report is not yet available on the backend.`
            : `Failed to generate PDF. Please try again.`;
        this.loadingStates[key] = false;
        this.cdr.detectChanges();
      });
  }

  isLoading(type: 'excel' | 'pdf'): boolean {
    return !!this.loadingStates[`${this.selectedReportId}_${type}`];
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getPeriodLabel(): string {
    const report = this.selectedReport;
    if (report.requiresDateRange) {
      return `${this.filterStartDate} to ${this.filterEndDate}`;
    }
    if (report.requiresMonth) {
      const m = this.months.find((x) => x.value === this.filterMonth);
      return `${m?.label ?? ''} ${this.filterYear}`;
    }
    return `Year ${this.filterYear}`;
  }

  formatMoney(val: any): string {
    return Number(val || 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' });
  }

  getReportsByCategory(category: string): ReportType[] {
    return this.reportTypes.filter((r) => r.category === category);
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
