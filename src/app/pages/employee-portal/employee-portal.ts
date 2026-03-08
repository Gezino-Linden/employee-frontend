// File: src/app/pages/employee-portal/employee-portal.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

const API = 'https://employee-api-xpno.onrender.com/api';

@Component({
  selector: 'app-employee-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employee-portal.html',
  styleUrls: ['./employee-portal.css'],
})
export class EmployeePortalComponent implements OnInit, OnDestroy {
  me: any = null;
  activeTab = 'clock';
  todayDate = '';
  timeOfDay = '';

  // Clock
  clockedIn = false;
  onBreak = false;
  clockLoading = false;
  clockAction = '';
  clockMessage = '';
  clockError = '';
  todayStatus: any = null;
  todayLoading = true;

  // QR
  qrDataUrl = '';
  qrCountdown = 30;
  private countdownInterval: any;

  // Leave
  leaveLoading = false;
  leaveBalances: any[] = [];
  leaveRequests: any[] = [];
  leaveTypes: any[] = [];
  leaveSaving = false;
  leaveError = '';
  leaveSuccess = '';
  leaveForm = { leave_type_id: '', start_date: '', end_date: '', reason: '' };

  // Shifts
  shiftsLoading = false;
  myShifts: any[] = [];

  // Payslips
  payslipsLoading = false;
  myPayslips: any[] = [];

  // Profile
  profileSaving = false;
  profileError = '';
  profileSuccess = '';
  profileForm = { name: '', currentPassword: '', newPassword: '' };

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('employee_token');
    const emp = localStorage.getItem('employee');
    if (!token || !emp) { this.router.navigateByUrl('/employee-login'); return; }
    this.me = JSON.parse(emp);
    this.profileForm.name = this.me.name;
    this.setTimeGreeting();
    this.loadTodayStatus();
    this.generateQR();
    this.loadLeaveTypes();
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownInterval);
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('employee_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  setTimeGreeting(): void {
    const h = new Date().getHours();
    this.timeOfDay = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    this.todayDate = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  generateQR(): void {
    if (!this.me) return;
    const payload = JSON.stringify({ empId: this.me.id, company: this.me.company_id, ts: Date.now() });
    this.qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload)}`;
    this.qrCountdown = 30;
    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      this.qrCountdown--;
      if (this.qrCountdown <= 0) this.generateQR();
      this.cdr.detectChanges();
    }, 1000);
  }

  loadTodayStatus(): void {
    this.todayLoading = true;
    this.http.get<any>(`${API}/employee-portal/attendance/today`, { headers: this.headers() }).subscribe({
      next: (r) => {
        this.todayStatus = r.data;
        this.clockedIn = !!r.data?.clock_in && !r.data?.clock_out;
        this.onBreak = r.data?.status === 'on_break';
        this.todayLoading = false; this.cdr.detectChanges();
      },
      error: () => { this.todayLoading = false; this.cdr.detectChanges(); },
    });
  }

  clockIn(): void {
    this.clockLoading = true; this.clockAction = 'in'; this.clockError = ''; this.clockMessage = '';
    this.http.post<any>(`${API}/employee-portal/attendance/clock-in`, {}, { headers: this.headers() }).subscribe({
      next: () => { this.clockedIn = true; this.clockMessage = 'Clocked in!'; this.clockLoading = false; this.loadTodayStatus(); },
      error: (e) => { this.clockError = e.error?.error || 'Failed'; this.clockLoading = false; this.cdr.detectChanges(); },
    });
  }

  clockOut(): void {
    this.clockLoading = true; this.clockAction = 'out'; this.clockError = ''; this.clockMessage = '';
    this.http.post<any>(`${API}/employee-portal/attendance/clock-out`, {}, { headers: this.headers() }).subscribe({
      next: () => { this.clockedIn = false; this.clockMessage = 'Clocked out. Have a great rest!'; this.clockLoading = false; this.loadTodayStatus(); },
      error: (e) => { this.clockError = e.error?.error || 'Failed'; this.clockLoading = false; this.cdr.detectChanges(); },
    });
  }

  toggleBreak(): void {
    const ep = this.onBreak ? 'break-end' : 'break-start';
    this.clockLoading = true;
    this.http.post<any>(`${API}/employee-portal/attendance/${ep}`, {}, { headers: this.headers() }).subscribe({
      next: () => { this.onBreak = !this.onBreak; this.clockMessage = this.onBreak ? 'Break started.' : 'Welcome back!'; this.clockLoading = false; this.loadTodayStatus(); },
      error: (e) => { this.clockError = e.error?.error || 'Failed'; this.clockLoading = false; this.cdr.detectChanges(); },
    });
  }

  loadLeave(): void {
    this.leaveLoading = true;
    this.http.get<any>(`${API}/employee-portal/leave/balances`, { headers: this.headers() }).subscribe({
      next: (r) => { this.leaveBalances = r.data || []; this.leaveLoading = false; this.cdr.detectChanges(); },
      error: () => { this.leaveLoading = false; },
    });
    this.http.get<any>(`${API}/employee-portal/leave/requests/my`, { headers: this.headers() }).subscribe({
      next: (r) => { this.leaveRequests = r.data || []; this.cdr.detectChanges(); },
      error: () => {},
    });
  }

  loadLeaveTypes(): void {
    this.http.get<any>(`${API}/employee-portal/leave/types`, { headers: this.headers() }).subscribe({
      next: (r) => { this.leaveTypes = r.data || []; this.cdr.detectChanges(); },
      error: () => {},
    });
  }

  submitLeave(): void {
    this.leaveError = ''; this.leaveSuccess = '';
    if (!this.leaveForm.leave_type_id || !this.leaveForm.start_date || !this.leaveForm.end_date) { this.leaveError = 'Please fill all fields'; return; }
    this.leaveSaving = true;
    this.http.post<any>(`${API}/employee-portal/leave/requests`, this.leaveForm, { headers: this.headers() }).subscribe({
      next: () => { this.leaveSuccess = 'Leave request submitted!'; this.leaveForm = { leave_type_id: '', start_date: '', end_date: '', reason: '' }; this.leaveSaving = false; this.leaveBalances = []; this.leaveRequests = []; this.loadLeave(); },
      error: (e) => { this.leaveError = e.error?.error || 'Failed'; this.leaveSaving = false; this.cdr.detectChanges(); },
    });
  }

  cancelLeave(id: number): void {
    this.leaveSaving = true;
    this.http.patch<any>(`${API}/employee-portal/leave/requests/${id}/cancel`, {}, { headers: this.headers() }).subscribe({
      next: () => { this.leaveSaving = false; this.leaveRequests = []; this.loadLeave(); },
      error: () => { this.leaveSaving = false; },
    });
  }

  getBalancePct(b: any): number {
    const total = (b.used_days || 0) + (b.remaining_days || 0);
    return total ? Math.round((b.remaining_days / total) * 100) : 0;
  }

  loadShifts(): void {
    if (this.myShifts.length) return;
    this.shiftsLoading = true;
    this.http.get<any>(`${API}/employee-portal/shifts`, { headers: this.headers() }).subscribe({
      next: (r) => { this.myShifts = r.data || []; this.shiftsLoading = false; this.cdr.detectChanges(); },
      error: () => { this.shiftsLoading = false; },
    });
  }

  loadPayslips(): void {
    if (this.myPayslips.length) return;
    this.payslipsLoading = true;
    this.http.get<any>(`${API}/employee-portal/payslips`, { headers: this.headers() }).subscribe({
      next: (r) => { this.myPayslips = r.data || []; this.payslipsLoading = false; this.cdr.detectChanges(); },
      error: () => { this.payslipsLoading = false; },
    });
  }

  downloadPayslip(id: number): void {
    const token = localStorage.getItem('employee_token') || '';
    window.open(`https://employee-api-xpno.onrender.com/api/employee-portal/payslips/${id}/download?token=${token}`, '_blank');
  }/payroll/payslip/${id}?token=${token}`, '_blank');
  }

  saveProfile(): void {
    this.profileError = ''; this.profileSuccess = '';
    if (!this.profileForm.newPassword) { this.profileSuccess = 'No changes to save'; return; }
    if (!this.profileForm.currentPassword) { this.profileError = 'Enter your current password'; return; }
    this.profileSaving = true;
    this.http.post<any>(`${API}/employee-auth/change-password`,
      { currentPassword: this.profileForm.currentPassword, newPassword: this.profileForm.newPassword },
      { headers: this.headers() }
    ).subscribe({
      next: () => { this.profileSuccess = 'Password changed!'; this.profileForm.currentPassword = ''; this.profileForm.newPassword = ''; this.profileSaving = false; this.cdr.detectChanges(); },
      error: (e) => { this.profileError = e.error?.error || 'Failed'; this.profileSaving = false; this.cdr.detectChanges(); },
    });
  }

  formatTime(dt: string): string { return new Date(dt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }); }
  formatDate(dt: string): string { return new Date(dt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }); }
  isToday(dt: string): boolean { return new Date(dt).toDateString() === new Date().toDateString(); }

  logout(): void {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee');
    this.router.navigateByUrl('/employee-login');
  }
}

