// File: src/app/pages/employee-portal/employee-portal.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

const API = 'https://employee-api-xpno.onrender.com/api';

@Component({
  selector: 'app-employee-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        this.onBreak = !!r.data?.break_start && !r.data?.clock_out;
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
    const emp = this.me;
    this.http.get<any>(`${API}/employee-portal/payslips/${id}/download?token=${token}`).subscribe({
      next: (r) => {
        const p = r.data;
        const months = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
        const fmt = (n: any) => Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payslip ${months[p.month]} ${p.year}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1a1a2e; background: #fff; }
  .header { background: linear-gradient(135deg, #6c63ff, #4a47a3); color: white; padding: 24px 32px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .header .period { font-size: 18px; opacity: 0.9; margin-top: 4px; }
  .header .badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 13px; }
  .emp-info { background: #f8f9ff; border-radius: 10px; padding: 20px 32px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .emp-info .field label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; }
  .emp-info .field p { margin: 2px 0 0; font-weight: 600; font-size: 15px; }
  .section { margin-bottom: 20px; }
  .section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6c63ff; border-bottom: 2px solid #6c63ff; padding-bottom: 6px; margin-bottom: 12px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .row.total { font-weight: 700; font-size: 16px; border-bottom: none; padding-top: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; }
  .net { background: linear-gradient(135deg, #6c63ff, #4a47a3); color: white; padding: 20px 32px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
  .net .label { font-size: 14px; opacity: 0.9; }
  .net .amount { font-size: 32px; font-weight: 700; }
  .status { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${p.status==='paid' ? '#d4edda' : '#fff3cd'}; color: ${p.status==='paid' ? '#155724' : '#856404'}; }
  .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #aaa; }
  .print-btn { display: block; margin: 20px auto; padding: 12px 32px; background: #6c63ff; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
  @media print { .print-btn { display: none; } body { padding: 0; } }
</style></head><body>
<div class="header">
  <div><h1>MaeRoll</h1><div class="period">Payslip — ${months[p.month]} ${p.year}</div></div>
  <span class="badge status">${p.status?.toUpperCase()}</span>
</div>
<div class="emp-info">
  <div class="field"><label>Employee Name</label><p>${emp?.name || '—'}</p></div>
  <div class="field"><label>Employee ID</label><p>#${emp?.id || '—'}</p></div>
  <div class="field"><label>Email</label><p>${emp?.email || '—'}</p></div>
  <div class="field"><label>Pay Period</label><p>${months[p.month]} ${p.year}</p></div>
  ${p.payment_date ? `<div class="field"><label>Payment Date</label><p>${new Date(p.payment_date).toLocaleDateString('en-ZA')}</p></div>` : ''}
  ${p.payment_method ? `<div class="field"><label>Payment Method</label><p>${p.payment_method}</p></div>` : ''}
</div>
<div class="grid">
  <div class="section">
    <h3>Earnings</h3>
    <div class="row"><span>Basic Salary</span><span>R ${fmt(p.basic_salary)}</span></div>
    ${Number(p.allowances)>0 ? `<div class="row"><span>Allowances</span><span>R ${fmt(p.allowances)}</span></div>` : ''}
    ${Number(p.bonuses)>0 ? `<div class="row"><span>Bonuses</span><span>R ${fmt(p.bonuses)}</span></div>` : ''}
    ${Number(p.overtime)>0 ? `<div class="row"><span>Overtime</span><span>R ${fmt(p.overtime)}</span></div>` : ''}
    <div class="row total"><span>Gross Pay</span><span>R ${fmt(p.gross_pay)}</span></div>
  </div>
  <div class="section">
    <h3>Deductions</h3>
    ${Number(p.tax)>0 ? `<div class="row"><span>PAYE Tax</span><span>R ${fmt(p.tax)}</span></div>` : ''}
    ${Number(p.uif)>0 ? `<div class="row"><span>UIF</span><span>R ${fmt(p.uif)}</span></div>` : ''}
    ${Number(p.pension)>0 ? `<div class="row"><span>Pension</span><span>R ${fmt(p.pension)}</span></div>` : ''}
    ${Number(p.medical_aid)>0 ? `<div class="row"><span>Medical Aid</span><span>R ${fmt(p.medical_aid)}</span></div>` : ''}
    ${Number(p.other_deductions)>0 ? `<div class="row"><span>Other</span><span>R ${fmt(p.other_deductions)}</span></div>` : ''}
    <div class="row total"><span>Total Deductions</span><span>R ${fmt(p.total_deductions)}</span></div>
  </div>
</div>
<div class="net"><div><div class="label">Net Pay</div><div style="font-size:12px;opacity:0.8">${months[p.month]} ${p.year}</div></div><div class="amount">R ${fmt(p.net_pay)}</div></div>
<div class="footer">This is a computer-generated payslip and does not require a signature. — MaeRoll HR System</div>
<button class="print-btn" onclick="window.print()"> Print / Save as PDF</button>
</body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); }
      },
      error: () => alert('Failed to load payslip')
    });
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


