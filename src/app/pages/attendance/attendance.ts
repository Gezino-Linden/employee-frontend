// File: src/app/pages/attendance/attendance.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AttendanceService,
  AttendanceRecord,
  AttendanceSummary,
  MonthlyReport,
} from '../../services/attendance.service';
import { AuthService, MeResponse } from '../../services/auth.service';

type AttendanceTab = 'clock' | 'today' | 'monthly' | 'override';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Attendance implements OnInit, OnDestroy {
  me: MeResponse | null = null;
  activeTab: AttendanceTab = 'clock';

  // Live clock
  currentTime = new Date();
  clockInterval: any;

  // Today's status
  todayRecord: AttendanceRecord | null = null;
  todayLoading = false;

  // Summary
  summary: AttendanceSummary | null = null;

  // Records
  records: AttendanceRecord[] = [];
  recordsLoading = false;
  selectedDate = new Date().toISOString().split('T')[0];

  // Monthly report
  monthlyReport: MonthlyReport[] = [];
  reportMonth = new Date().getMonth() + 1;
  reportYear = new Date().getFullYear();
  reportLoading = false;

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

  // Action states
  actionLoading = false;
  actionMessage = '';
  actionError = '';

  // Override form
  overrideForm = {
    employee_id: 0,
    date: new Date().toISOString().split('T')[0],
    clock_in: '08:00',
    clock_out: '17:00',
    status: 'present',
    notes: '',
  };
  overrideLoading = false;
  overrideMessage = '';

  // Employees list for override
  employees: any[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.startClock();
    this.loadTodayStatus();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  startClock() {
    this.clockInterval = setInterval(() => {
      this.currentTime = new Date();
      this.cdr.detectChanges();
    }, 1000);
  }

  loadProfile() {
    this.auth.getMe().subscribe({
      next: (user: MeResponse) => {
        this.me = user;
        this.cdr.detectChanges();
        if (this.isAdmin()) {
          this.loadSummary();
          this.loadRecords();
          this.loadEmployees();
        }
      },
      error: () => {},
    });
  }

  loadTodayStatus() {
    this.todayLoading = true;
    this.attendanceService.getTodayStatus().subscribe({
      next: (record: any) => {
        this.todayRecord = record;
        this.todayLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.todayRecord = null;
        this.todayLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadSummary() {
    this.attendanceService.getSummary(this.selectedDate).subscribe({
      next: (s: AttendanceSummary) => {
        this.summary = s;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadRecords() {
    this.recordsLoading = true;
    this.attendanceService.getRecords({ date: this.selectedDate }).subscribe({
      next: (records: AttendanceRecord[]) => {
        this.records = records;
        this.recordsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.recordsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadMonthlyReport() {
    this.reportLoading = true;
    this.attendanceService.getMonthlyReport(this.reportMonth, this.reportYear).subscribe({
      next: (report: MonthlyReport[]) => {
        this.monthlyReport = report;
        this.reportLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.reportLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadEmployees() {
    // Reuse existing employees endpoint
    fetch(`${(window as any).env?.apiUrl || ''}/api/employees?page=1&limit=100`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
    })
      .then((r) => r.json())
      .then((d) => {
        this.employees = d.data || d || [];
        this.cdr.detectChanges();
      })
      .catch(() => {});
  }

  onDateChange() {
    if (this.isAdmin()) {
      this.loadSummary();
      this.loadRecords();
    }
  }

  switchTab(tab: AttendanceTab) {
    this.activeTab = tab;
    if (tab === 'monthly') this.loadMonthlyReport();
    this.cdr.detectChanges();
  }

  // =====================
  // CLOCK ACTIONS
  // =====================
  clockIn() {
    this.actionLoading = true;
    this.actionMessage = '';
    this.actionError = '';

    this.attendanceService.clockIn().subscribe({
      next: (record: AttendanceRecord) => {
        this.todayRecord = record;
        this.actionLoading = false;
        this.actionMessage = '✅ Clocked in successfully!';
        if (this.isAdmin()) {
          this.loadSummary();
          this.loadRecords();
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          this.actionMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err: any) => {
        this.actionLoading = false;
        this.actionError = err.error?.error || 'Failed to clock in';
        this.cdr.detectChanges();
      },
    });
  }

  startBreak() {
    this.actionLoading = true;
    this.attendanceService.startBreak().subscribe({
      next: (record: AttendanceRecord) => {
        this.todayRecord = record;
        this.actionLoading = false;
        this.actionMessage = '☕ Break started';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.actionMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err: any) => {
        this.actionLoading = false;
        this.actionError = err.error?.error || 'Failed to start break';
        this.cdr.detectChanges();
      },
    });
  }

  endBreak() {
    this.actionLoading = true;
    this.attendanceService.endBreak().subscribe({
      next: (record: AttendanceRecord) => {
        this.todayRecord = record;
        this.actionLoading = false;
        this.actionMessage = '💪 Break ended, back to work!';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.actionMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err: any) => {
        this.actionLoading = false;
        this.actionError = err.error?.error || 'Failed to end break';
        this.cdr.detectChanges();
      },
    });
  }

  clockOut() {
    this.actionLoading = true;
    this.attendanceService.clockOut().subscribe({
      next: (record: AttendanceRecord) => {
        this.todayRecord = record;
        this.actionLoading = false;
        this.actionMessage = '👋 Clocked out. Great work today!';
        if (this.isAdmin()) {
          this.loadSummary();
          this.loadRecords();
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          this.actionMessage = '';
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (err: any) => {
        this.actionLoading = false;
        this.actionError = err.error?.error || 'Failed to clock out';
        this.cdr.detectChanges();
      },
    });
  }

  submitOverride() {
    if (!this.overrideForm.employee_id) {
      this.overrideMessage = '❌ Please select an employee';
      return;
    }
    this.overrideLoading = true;
    const payload = {
      employee_id: this.overrideForm.employee_id,
      date: this.overrideForm.date,
      clock_in: `${this.overrideForm.date}T${this.overrideForm.clock_in}:00`,
      clock_out: `${this.overrideForm.date}T${this.overrideForm.clock_out}:00`,
      status: this.overrideForm.status,
      notes: this.overrideForm.notes,
    };

    this.attendanceService.adminOverride(payload).subscribe({
      next: () => {
        this.overrideLoading = false;
        this.overrideMessage = '✅ Attendance updated successfully';
        this.loadRecords();
        this.loadSummary();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.overrideMessage = '';
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (err: any) => {
        this.overrideLoading = false;
        this.overrideMessage = '❌ ' + (err.error?.error || 'Failed to override');
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

  isClockedIn(): boolean {
    return !!this.todayRecord?.clock_in && !this.todayRecord?.clock_out;
  }

  isOnBreak(): boolean {
    return (
      !!this.todayRecord?.break_start &&
      !this.todayRecord?.break_end &&
      !this.todayRecord?.clock_out
    );
  }

  isClockedOut(): boolean {
    return !!this.todayRecord?.clock_out;
  }

  formatTime(timestamp: string | null): string {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatHours(hours: number): string {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  formatMoney(amount: number): string {
    return (amount || 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' });
  }

  getStatusClass(status: string): string {
    const map: any = {
      present: 'status-present',
      absent: 'status-absent',
      late: 'status-late',
      half_day: 'status-half',
      on_leave: 'status-leave',
      not_clocked_in: 'status-absent',
    };
    return map[status] || '';
  }

  getStatusIcon(status: string): string {
    const map: any = {
      present: '✅',
      absent: '❌',
      late: '⏰',
      half_day: '🌓',
      on_leave: '🏖️',
      not_clocked_in: '⭕',
    };
    return map[status] || '•';
  }

  goToDashboard() {
    this.router.navigateByUrl('/dashboard');
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  getTotalPresent(): number {
    return this.monthlyReport.reduce((s, r) => s + r.days_present, 0);
  }
  getTotalAbsent(): number {
    return this.monthlyReport.reduce((s, r) => s + r.days_absent, 0);
  }
  getTotalLate(): number {
    return this.monthlyReport.reduce((s, r) => s + r.days_late, 0);
  }
  getTotalHours(): number {
    return this.monthlyReport.reduce((s, r) => s + Number(r.total_hours), 0);
  }
  getTotalOvertime(): number {
    return this.monthlyReport.reduce((s, r) => s + Number(r.total_overtime), 0);
  }
  getTotalPay(): number {
    return this.monthlyReport.reduce((s, r) => s + Number(r.total_pay), 0);
  }
  getTotalOTPay(): number {
    return this.monthlyReport.reduce((s, r) => s + Number(r.total_overtime_pay), 0);
  }
}
