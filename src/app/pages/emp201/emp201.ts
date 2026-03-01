// File: src/app/pages/emp201/emp201.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';

export interface EMP201Declaration {
  id: number;
  company_id: number;
  tax_year: string;
  tax_period: string;
  period_start_date: string;
  period_end_date: string;
  paye_amount: string;
  sdl_amount: string;
  uif_employee_amount: string;
  uif_employer_amount: string;
  uif_total_amount: string;
  eti_amount: string;
  total_liability: string;
  payment_status: string;
  payment_date: string | null;
  payment_reference: string | null;
  payment_amount: string | null;
  submission_status: string;
  submission_date: string | null;
  submission_reference: string | null;
  sars_acknowledgement: string | null;
  employee_count: number;
  total_remuneration: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  period_name?: string;
  due_date?: string;
  computed_payment_status?: string;
}

export interface EMP201LineItem {
  id: number;
  declaration_id: number;
  employee_id: number;
  employee_name: string;
  gross_remuneration: string;
  paye_deducted: string;
  uif_employee: string;
  uif_employer: string;
  sdl_contribution: string;
}

export interface EMP201Summary {
  total_declarations: number;
  submitted_count: number;
  paid_count: number;
  overdue_count: number;
  total_liability_ytd: string;
  total_paid_ytd: string;
  total_outstanding: string;
}

type ActiveTab = 'dashboard' | 'declarations' | 'detail' | 'generate';

@Component({
  selector: 'app-emp201',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emp201.html',
  styleUrls: ['./emp201.css'],
})
export class EMP201 implements OnInit {
  me: MeResponse | null = null;
  activeTab: ActiveTab = 'dashboard';

  // Dashboard
  summary: EMP201Summary | null = null;
  loadingSummary = true;

  // Declarations list
  declarations: EMP201Declaration[] = [];
  loadingDeclarations = true;
  declarationsError = '';
  filterYear = new Date().getFullYear();
  filterStatus = '';

  // Detail view
  selectedDeclaration: EMP201Declaration | null = null;
  lineItems: EMP201LineItem[] = [];
  loadingDetail = false;

  // Generate
  generateMonth = new Date().getMonth() + 1;
  generateYear = new Date().getFullYear();
  generateLoading = false;
  generateMessage = '';
  generateError = '';

  // Submit modal
  showSubmitModal = false;
  submitReference = '';
  submitAcknowledgement = '';
  submitLoading = false;
  submitError = '';

  // Payment modal
  showPaymentModal = false;
  paymentDate = new Date().toISOString().split('T')[0];
  paymentReference = '';
  paymentAmount = '';
  paymentLoading = false;
  paymentError = '';

  // ETI modal
  showEtiModal = false;
  etiAmount = 0;
  etiNotes = '';
  etiLoading = false;

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

  private apiBase = 'https://employee-api-xpno.onrender.com/api/emp201';

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
    this.loadSummary();
    this.loadDeclarations();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadSummary() {
    this.loadingSummary = true;
    this.http
      .get<EMP201Summary>(`${this.apiBase}/summary?year=${this.filterYear}`, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (data) => {
          this.summary = data;
          this.loadingSummary = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingSummary = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadDeclarations() {
    this.loadingDeclarations = true;
    let url = `${this.apiBase}/declarations?year=${this.filterYear}`;
    if (this.filterStatus) url += `&status=${this.filterStatus}`;
    this.http.get<EMP201Declaration[]>(url, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.declarations = data;
        this.loadingDeclarations = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.declarationsError = err?.error?.error || 'Failed to load';
        this.loadingDeclarations = false;
        this.cdr.detectChanges();
      },
    });
  }

  viewDeclaration(decl: EMP201Declaration) {
    this.selectedDeclaration = decl;
    this.loadingDetail = true;
    this.activeTab = 'detail';
    this.http
      .get<{ declaration: EMP201Declaration; lineItems: EMP201LineItem[] }>(
        `${this.apiBase}/declarations/${decl.id}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (data) => {
          this.selectedDeclaration = data.declaration;
          this.lineItems = data.lineItems;
          this.loadingDetail = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingDetail = false;
          this.cdr.detectChanges();
        },
      });
  }

  generateEMP201() {
    this.generateLoading = true;
    this.generateMessage = '';
    this.generateError = '';
    this.http
      .post<any>(
        `${this.apiBase}/generate`,
        { month: this.generateMonth, year: this.generateYear },
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (res) => {
          this.generateLoading = false;
          this.generateMessage = `✅ EMP201 generated for ${
            this.months[this.generateMonth - 1].label
          } ${this.generateYear} — Total liability: ${this.formatMoney(
            res.declaration.total_liability
          )}`;
          this.loadDeclarations();
          this.loadSummary();
          setTimeout(() => {
            this.activeTab = 'declarations';
            this.cdr.detectChanges();
          }, 2000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.generateLoading = false;
          this.generateError = err?.error?.error || err?.error?.details || 'Failed to generate';
          this.cdr.detectChanges();
        },
      });
  }

  openSubmitModal() {
    this.submitReference = '';
    this.submitAcknowledgement = '';
    this.submitError = '';
    this.showSubmitModal = true;
    this.cdr.detectChanges();
  }

  submitToSARS() {
    if (!this.selectedDeclaration || !this.submitReference) return;
    this.submitLoading = true;
    this.http
      .post<any>(
        `${this.apiBase}/declarations/${this.selectedDeclaration.id}/submit`,
        {
          submission_reference: this.submitReference,
          sars_acknowledgement: this.submitAcknowledgement,
        },
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (res) => {
          this.submitLoading = false;
          this.showSubmitModal = false;
          this.selectedDeclaration = res.declaration;
          this.loadDeclarations();
          this.loadSummary();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.submitLoading = false;
          this.submitError = err?.error?.error || 'Failed to submit';
          this.cdr.detectChanges();
        },
      });
  }

  openPaymentModal() {
    this.paymentDate = new Date().toISOString().split('T')[0];
    this.paymentReference = '';
    this.paymentAmount = this.selectedDeclaration?.total_liability || '';
    this.paymentError = '';
    this.showPaymentModal = true;
    this.cdr.detectChanges();
  }

  recordPayment() {
    if (!this.selectedDeclaration || !this.paymentDate || !this.paymentReference) return;
    this.paymentLoading = true;
    this.http
      .post<any>(
        `${this.apiBase}/declarations/${this.selectedDeclaration.id}/pay`,
        {
          payment_date: this.paymentDate,
          payment_reference: this.paymentReference,
          payment_amount: this.paymentAmount,
        },
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (res) => {
          this.paymentLoading = false;
          this.showPaymentModal = false;
          this.selectedDeclaration = res.declaration;
          this.loadDeclarations();
          this.loadSummary();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.paymentLoading = false;
          this.paymentError = err?.error?.error || 'Failed to record payment';
          this.cdr.detectChanges();
        },
      });
  }

  exportCSV(id: number) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const link = document.createElement('a');
    link.href = `${this.apiBase}/declarations/${id}/export`;
    link.setAttribute('download', `EMP201-${id}.csv`);
    fetch(link.href, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
  }

  getPeriodName(period: string, year: string): string {
    const m = parseInt(period, 10);
    return `${this.months[m - 1]?.label} ${year}`;
  }

  formatMoney(val: any): string {
    return Number(val || 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' });
  }

  formatDate(val: string | null): string {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getSubmissionClass(status: string): string {
    const map: any = {
      draft: 'badge-draft',
      submitted: 'badge-submitted',
      acknowledged: 'badge-acknowledged',
      rejected: 'badge-rejected',
    };
    return map[status] || 'badge-draft';
  }

  getPaymentClass(status: string): string {
    const map: any = {
      pending: 'badge-pending',
      paid: 'badge-paid',
      overdue: 'badge-overdue',
      partial: 'badge-partial',
    };
    return map[status] || 'badge-pending';
  }

  getDueStatus(dueDate: string | undefined): string {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    if (diff <= 7) return `Due in ${diff} days`;
    return `Due ${this.formatDate(dueDate)}`;
  }

  isAdmin(): boolean {
    return this.me?.role === 'admin';
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
