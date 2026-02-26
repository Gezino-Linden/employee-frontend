import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  // Payment modal
  showPaymentModal = false;
  selectedPayroll: PayrollRecord | null = null;
  paymentMethod = 'bank_transfer';
  paymentDate = new Date().toISOString().split('T')[0];

  // ✅ ADDED: Status filter
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

  // ✅ ADDED: Getters for filtered records
  get filteredRecords() {
    if (this.statusFilter === 'all') return this.payrollRecords;
    return this.payrollRecords.filter((r) => r.status === this.statusFilter);
  }

  get draftRecords() {
    return this.payrollRecords.filter((r) => r.status === 'draft');
  }

  get paidRecords() {
    return this.payrollRecords.filter((r) => r.status === 'paid');
  }

  // ✅ ADDED: Status filter method
  setStatusFilter(status: string) {
    this.statusFilter = status;
  }

  loadProfile() {
    this.auth.getMe().subscribe({
      next: (user) => {
        this.me = user;
        this.cdr.detectChanges();
      },
      error: (err) => {
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
      next: (summary) => {
        this.summary = summary;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load summary';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    this.payrollService.getPayrollRecords(monthStr, this.selectedYear).subscribe({
      next: (records) => {
        this.payrollRecords = records;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load records';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onPeriodChange() {
    this.loadPayrollData();
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

  // ✅ FIXED: Handle null/undefined values
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
      this.selectedEmployees = this.payrollRecords.map((r) => r.employee_id);
    } else {
      this.selectedEmployees = [];
    }
  }

  toggleEmployeeSelection(employeeId: number) {
    const index = this.selectedEmployees.indexOf(employeeId);
    if (index > -1) {
      this.selectedEmployees.splice(index, 1);
    } else {
      this.selectedEmployees.push(employeeId);
    }
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
      error: (err) => {
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
      error: (err) => {
        this.error = 'Failed to mark as paid';
      },
    });
  }

  downloadPayslip(payrollId: number) {
    this.payrollService.generatePayslip(payrollId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payslip-${payrollId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.error = 'Failed to download payslip';
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
