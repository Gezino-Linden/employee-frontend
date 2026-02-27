import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PayrollService, PayrollRecord, PayrollSummary } from '../../services/payroll.service';
import { AuthService, MeResponse } from '../../services/auth.service';

type PayrollTab = 'overview' | 'records' | 'processing' | 'history';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payroll.html',
  styleUrls: ['./payroll.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Payroll implements OnInit {
  // User info
  me: MeResponse | null = null;

  // Tab management
  activeTab: PayrollTab = 'overview';

  // Date filters
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
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

  // Data
  payrollRecords: PayrollRecord[] = [];
  summary: PayrollSummary | null = null;
  loading = false;
  error = '';

  // Processing
  selectedEmployees: number[] = [];
  processingLoading = false;
  initializeLoading = false;
  initializeMessage = '';

  // Payment modal
  showPaymentModal = false;
  selectedPayroll: PayrollRecord | null = null;
  paymentMethod = 'bank_transfer';
  paymentDate = new Date().toISOString().split('T')[0];

  // Status filter
  statusFilter: string = 'all';

  constructor(
    private payrollService: PayrollService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadPayrollData();
  }

  get filteredRecords() {
    if (this.statusFilter === 'all') return this.payrollRecords;
    return this.payrollRecords.filter((r) => r.status === this.statusFilter);
  }

  get draftRecords() {
    return this.payrollRecords.filter((r) => r.status === 'draft');
  }

  isAllDraftSelected(): boolean {
    return (
      this.draftRecords.length > 0 && this.selectedEmployees.length === this.draftRecords.length
    );
  }

  get paidRecords() {
    return this.payrollRecords.filter((r) => r.status === 'paid');
  }

  setStatusFilter(status: string) {
    this.statusFilter = status;
    this.cdr.detectChanges();
  }

  loadProfile() {
    this.auth.getMe().subscribe({
      next: (user: MeResponse) => {
        this.me = user;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load profile:', err);
      },
    });
  }

  switchTab(tab: PayrollTab) {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  loadPayrollData() {
    this.loading = true;
    const monthStr = this.selectedMonth.toString().padStart(2, '0');

    this.payrollService.getPayrollSummary(monthStr, this.selectedYear).subscribe({
      next: (summary: PayrollSummary) => {
        this.summary = summary;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.summary = {
          total_employees: 0,
          total_gross: 0,
          total_deductions: 0,
          total_net: 0,
          tax: 0,
          paid_count: 0,
          processed_count: 0,
          draft_count: 0,
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    this.payrollService.getPayrollRecords(monthStr, this.selectedYear).subscribe({
      next: (records: PayrollRecord[]) => {
        this.payrollRecords = records;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = 'Failed to load records';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onPeriodChange() {
    this.loadPayrollData();
  }

  initializePeriod() {
    this.initializeLoading = true;
    this.initializeMessage = '';
    this.error = '';

    this.payrollService.initializePayrollPeriod(this.selectedMonth, this.selectedYear).subscribe({
      next: (res: any) => {
        this.initializeLoading = false;
        this.initializeMessage = res.message || `Initialized payroll for ${res.count} employees`;
        this.loadPayrollData();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.initializeMessage = '';
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (err: any) => {
        this.initializeLoading = false;
        this.error =
          err.error?.details || err.error?.error || 'Failed to initialize payroll period';
        this.cdr.detectChanges();
      },
    });
  }

  getStatusClass(status: string): string {
    const map: any = {
      draft: 'status-draft',
      processed: 'status-processed',
      paid: 'status-paid',
    };
    return map[status] || '';
  }

  getStatusIcon(status: string): string {
    const map: any = {
      draft: '📝',
      processed: '✓',
      paid: '💰',
    };
    return map[status] || '•';
  }

  formatMoney(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'R 0.00';
    }
    return amount.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    });
  }

  selectAllEmployees(event: any) {
    if (event.target.checked) {
      this.selectedEmployees = this.draftRecords.map((r) => r.employee_id);
    } else {
      this.selectedEmployees = [];
    }
    this.cdr.detectChanges();
  }

  toggleEmployeeSelection(employeeId: number) {
    const index = this.selectedEmployees.indexOf(employeeId);
    if (index > -1) {
      this.selectedEmployees.splice(index, 1);
    } else {
      this.selectedEmployees.push(employeeId);
    }
    this.cdr.detectChanges();
  }

  processSelectedPayroll() {
    if (this.selectedEmployees.length === 0) return;

    this.processingLoading = true;
    const period = {
      month: this.selectedMonth,
      year: this.selectedYear,
    };

    this.payrollService.processPayroll(this.selectedEmployees, period).subscribe({
      next: () => {
        this.processingLoading = false;
        this.selectedEmployees = [];
        this.loadPayrollData();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = 'Failed to process payroll';
        this.processingLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openPaymentModal(record: PayrollRecord) {
    this.selectedPayroll = record;
    this.showPaymentModal = true;
    this.cdr.detectChanges();
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedPayroll = null;
    this.cdr.detectChanges();
  }

  markAsPaid() {
    if (!this.selectedPayroll) return;

    const paymentDetails = {
      payment_method: this.paymentMethod,
      payment_date: this.paymentDate,
    };

    this.payrollService.markAsPaid(this.selectedPayroll.id, paymentDetails).subscribe({
      next: () => {
        this.closePaymentModal();
        this.loadPayrollData();
      },
      error: (err: any) => {
        this.error = 'Failed to mark as paid';
        this.cdr.detectChanges();
      },
    });
  }

  downloadPayslip(payrollId: number) {
    this.payrollService.generatePayslip(payrollId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payslip-${payrollId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        this.error = 'Failed to download payslip';
        this.cdr.detectChanges();
      },
    });
  }

  goToDashboard() {
    this.router.navigateByUrl('/dashboard');
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  isAdmin(): boolean {
    return this.me?.role === 'admin' || this.me?.role === 'manager';
  }
}
