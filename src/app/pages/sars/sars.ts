// File: src/app/pages/sars/sars.ts
import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

// ── EMP201 TYPES ──────────────────────────────────────────────
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

// ── UI19 TYPES ────────────────────────────────────────────────
export interface UI19Declaration {
  id: number;
  company_id: number;
  month: number;
  year: number;
  period_start_date: string;
  period_end_date: string;
  employee_count: number;
  total_remuneration: string;
  total_uif_employee: string;
  total_uif_employer: string;
  total_uif: string;
  submission_status: string;
  submission_date: string | null;
  submission_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface UI19LineItem {
  id: number;
  declaration_id: number;
  employee_id: number;
  employee_name: string;
  id_number: string;
  uif_number: string;
  gross_remuneration: string;
  uif_employee: string;
  uif_employer: string;
  total_uif: string;
  days_worked: number;
  reason_code: string;
}

// ── IRP5 TYPES ────────────────────────────────────────────────
export interface IRP5Certificate {
  id: number;
  company_id: number;
  employee_id: number;
  tax_year: string;
  tax_year_start: string;
  tax_year_end: string;
  employee_name: string;
  employee_id_number: string;
  employee_tax_number: string;
  employee_uif_number: string;
  department: string;
  position: string;
  code_3601: string;
  code_4101: string;
  code_4141: string;
  code_4142: string;
  code_4149: string;
  total_remuneration: string;
  total_deductions: string;
  net_pay: string;
  months_employed: number;
  certificate_number: string;
  generation_status: string;
  issued_date: string | null;
  created_at: string;
}
export interface IRP5Reconciliation {
  id: number;
  company_id: number;
  tax_year: string;
  tax_year_start: string;
  tax_year_end: string;
  employee_count: number;
  total_remuneration: string;
  total_paye: string;
  total_uif_employee: string;
  total_uif_employer: string;
  total_sdl: string;
  total_deductions: string;
  recon_status: string;
  submission_date: string | null;
  submission_reference: string | null;
}

type SarsTab = 'emp201' | 'ui19' | 'irp5';

@Component({
  selector: 'app-sars',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sars.html',
  styleUrls: ['./sars.css'],
})
export class Sars implements OnInit {
  private destroyRef = inject(DestroyRef);

  me: MeResponse | null = null;
  activeTab: SarsTab = 'emp201';

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

  // ── EMP201 STATE ──────────────────────────────────────────
  emp201Tab: 'dashboard' | 'declarations' | 'detail' | 'generate' = 'dashboard';
  emp201Summary: EMP201Summary | null = null;
  emp201Declarations: EMP201Declaration[] = [];
  emp201Loading = true;
  emp201DeclarationsLoading = true;
  emp201Error = '';
  emp201FilterYear = new Date().getFullYear();
  emp201FilterStatus = '';
  emp201Selected: EMP201Declaration | null = null;
  emp201LineItems: EMP201LineItem[] = [];
  emp201DetailLoading = false;
  emp201GenMonth = new Date().getMonth() + 1;
  emp201GenYear = new Date().getFullYear();
  emp201GenLoading = false;
  emp201GenMessage = '';
  emp201GenError = '';
  showSubmitModal = false;
  submitReference = '';
  submitAcknowledgement = '';
  submitLoading = false;
  submitError = '';
  showPaymentModal = false;
  paymentDate = new Date().toISOString().split('T')[0];
  paymentReference = '';
  paymentAmount = '';
  paymentLoading = false;
  paymentError = '';

  // ── UI19 STATE ────────────────────────────────────────────
  ui19Tab: 'list' | 'detail' | 'generate' = 'list';
  ui19Declarations: UI19Declaration[] = [];
  ui19Loading = true;
  ui19FilterYear = new Date().getFullYear();
  ui19Selected: UI19Declaration | null = null;
  ui19LineItems: UI19LineItem[] = [];
  ui19DetailLoading = false;
  ui19EditingId: number | null = null;
  ui19EditUifNumber = '';
  ui19EditDaysWorked = 22;
  ui19GenMonth = new Date().getMonth() + 1;
  ui19GenYear = new Date().getFullYear();
  ui19GenLoading = false;
  ui19GenMessage = '';
  ui19GenError = '';
  showUi19SubmitModal = false;
  ui19SubmitReference = '';
  ui19SubmitNotes = '';
  ui19SubmitLoading = false;
  ui19SubmitError = '';

  // ── IRP5 STATE ────────────────────────────────────────────
  irp5Tab: 'certificates' | 'reconciliation' | 'generate' = 'certificates';
  irp5Certs: IRP5Certificate[] = [];
  irp5CertsLoading = true;
  irp5Recon: IRP5Reconciliation | null = null;
  irp5ReconLoading = false;
  irp5TaxYear = '2026';
  irp5TaxYears = ['2025', '2026'];
  irp5GenYear = '2026';
  irp5GenLoading = false;
  irp5GenMessage = '';
  irp5GenError = '';
  irp5IssueLoading = false;
  irp5IssueMessage = '';
  irp5SelectedCert: IRP5Certificate | null = null;
  irp5ShowModal = false;

  private emp201Api = `${environment.apiUrl}/emp201`;
  private ui19Api = `${environment.apiUrl}/ui19`;
  private irp5Api = `${environment.apiUrl}/irp5`;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
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
    this.loadEmp201Summary();
    this.loadEmp201Declarations();
  }

  setTab(tab: SarsTab) {
    this.activeTab = tab;
    if (tab === 'ui19' && this.ui19Declarations.length === 0) this.loadUi19Declarations();
    if (tab === 'irp5' && this.irp5Certs.length === 0) {
      this.loadIrp5Certs();
      this.loadIrp5Recon();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ── EMP201 METHODS ────────────────────────────────────────
  loadEmp201Summary() {
    this.emp201Loading = true;
    this.http
      .get<EMP201Summary>(`${this.emp201Api}/summary?year=${this.emp201FilterYear}`, {
        headers: this.getHeaders(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.emp201Summary = d;
          this.emp201Loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.emp201Loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadEmp201Declarations() {
    this.emp201DeclarationsLoading = true;
    let url = `${this.emp201Api}/declarations?year=${this.emp201FilterYear}`;
    if (this.emp201FilterStatus) url += `&status=${this.emp201FilterStatus}`;
    this.http
      .get<EMP201Declaration[]>(url, { headers: this.getHeaders() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.emp201Declarations = d;
          this.emp201DeclarationsLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.emp201Error = err?.error?.error || 'Failed to load';
          this.emp201DeclarationsLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  viewEmp201(decl: EMP201Declaration) {
    this.emp201Selected = decl;
    this.emp201DetailLoading = true;
    this.emp201Tab = 'detail';
    this.http
      .get<{ declaration: EMP201Declaration; lineItems: EMP201LineItem[] }>(
        `${this.emp201Api}/declarations/${decl.id}`,
        { headers: this.getHeaders() }
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.emp201Selected = d.declaration;
          this.emp201LineItems = d.lineItems;
          this.emp201DetailLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.emp201DetailLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  generateEmp201() {
    this.emp201GenLoading = true;
    this.emp201GenMessage = '';
    this.emp201GenError = '';
    this.http
      .post<any>(
        `${this.emp201Api}/generate`,
        { month: this.emp201GenMonth, year: this.emp201GenYear },
        { headers: this.getHeaders() }
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.emp201GenLoading = false;
          this.emp201GenMessage = ` EMP201 generated for ${
            this.months[this.emp201GenMonth - 1].label
          } ${this.emp201GenYear} — Total: ${this.formatMoney(res.declaration.total_liability)}`;
          this.loadEmp201Declarations();
          this.loadEmp201Summary();
          setTimeout(() => {
            this.emp201Tab = 'declarations';
            this.cdr.detectChanges();
          }, 2000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.emp201GenLoading = false;
          this.emp201GenError = err?.error?.error || 'Failed to generate';
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
    if (!this.emp201Selected || !this.submitReference) return;
    this.submitLoading = true;
    this.http
      .post<any>(
        `${this.emp201Api}/declarations/${this.emp201Selected.id}/submit`,
        {
          submission_reference: this.submitReference,
          sars_acknowledgement: this.submitAcknowledgement,
        },
        { headers: this.getHeaders() }
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.submitLoading = false;
          this.showSubmitModal = false;
          this.emp201Selected = res.declaration;
          this.loadEmp201Declarations();
          this.loadEmp201Summary();
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
    this.paymentAmount = this.emp201Selected?.total_liability || '';
    this.paymentError = '';
    this.showPaymentModal = true;
    this.cdr.detectChanges();
  }

  recordEmp201Payment() {
    if (!this.emp201Selected || !this.paymentDate || !this.paymentReference) return;
    this.paymentLoading = true;
    this.http
      .post<any>(
        `${this.emp201Api}/declarations/${this.emp201Selected.id}/pay`,
        {
          payment_date: this.paymentDate,
          payment_reference: this.paymentReference,
          payment_amount: this.paymentAmount,
        },
        { headers: this.getHeaders() }
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.paymentLoading = false;
          this.showPaymentModal = false;
          this.emp201Selected = res.declaration;
          this.loadEmp201Declarations();
          this.loadEmp201Summary();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.paymentLoading = false;
          this.paymentError = err?.error?.error || 'Failed';
          this.cdr.detectChanges();
        },
      });
  }

  exportEmp201CSV(id: number) {
    const token = localStorage.getItem('token') || '';
    fetch(`${this.emp201Api}/declarations/${id}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => this.downloadBlob(blob, `EMP201-${id}.csv`));
  }

  // ── UI19 METHODS ──────────────────────────────────────────
  loadUi19Declarations() {
    this.ui19Loading = true;
    this.http
      .get<UI19Declaration[]>(`${this.ui19Api}/declarations?year=${this.ui19FilterYear}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.ui19Declarations = d;
          this.ui19Loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.ui19Loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  viewUi19(decl: UI19Declaration) {
    this.ui19Selected = decl;
    this.ui19DetailLoading = true;
    this.ui19Tab = 'detail';
    this.ui19EditingId = null;
    this.http
      .get<{ declaration: UI19Declaration; lineItems: UI19LineItem[] }>(
        `${this.ui19Api}/declarations/${decl.id}`
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.ui19Selected = d.declaration;
          this.ui19LineItems = d.lineItems;
          this.ui19DetailLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.ui19DetailLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  generateUi19() {
    this.ui19GenLoading = true;
    this.ui19GenMessage = '';
    this.ui19GenError = '';
    this.http
      .post<any>(`${this.ui19Api}/generate`, { month: this.ui19GenMonth, year: this.ui19GenYear })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.ui19GenLoading = false;
          this.ui19GenMessage = ` UI-19 generated for ${
            this.months[this.ui19GenMonth - 1].label
          } ${this.ui19GenYear} — Total UIF: ${this.formatMoney(res.declaration.total_uif)}`;
          this.loadUi19Declarations();
          setTimeout(() => {
            this.ui19Tab = 'list';
            this.cdr.detectChanges();
          }, 2000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.ui19GenLoading = false;
          this.ui19GenError = err?.error?.error || 'Failed';
          this.cdr.detectChanges();
        },
      });
  }

  startEditUi19LineItem(item: UI19LineItem) {
    this.ui19EditingId = item.id;
    this.ui19EditUifNumber = item.uif_number || '';
    this.ui19EditDaysWorked = item.days_worked || 22;
  }

  saveUi19LineItem(item: UI19LineItem) {
    this.http
      .patch<UI19LineItem>(`${this.ui19Api}/line-items/${item.id}`, {
        uif_number: this.ui19EditUifNumber,
        days_worked: this.ui19EditDaysWorked,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          const idx = this.ui19LineItems.findIndex((i) => i.id === item.id);
          if (idx !== -1) this.ui19LineItems[idx] = updated;
          this.ui19EditingId = null;
          this.cdr.detectChanges();
        },
        error: () => this.cdr.detectChanges(),
      });
  }

  openUi19SubmitModal() {
    this.ui19SubmitReference = '';
    this.ui19SubmitNotes = '';
    this.ui19SubmitError = '';
    this.showUi19SubmitModal = true;
  }

  submitUi19() {
    if (!this.ui19Selected || !this.ui19SubmitReference) return;
    this.ui19SubmitLoading = true;
    this.http
      .post<any>(`${this.ui19Api}/declarations/${this.ui19Selected.id}/submit`, {
        submission_reference: this.ui19SubmitReference,
        notes: this.ui19SubmitNotes,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.ui19SubmitLoading = false;
          this.showUi19SubmitModal = false;
          this.ui19Selected = res.declaration;
          this.loadUi19Declarations();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.ui19SubmitLoading = false;
          this.ui19SubmitError = err?.error?.error || 'Failed';
          this.cdr.detectChanges();
        },
      });
  }

  exportUi19CSV(id: number) {
    const token = localStorage.getItem('token') || '';
    fetch(`${this.ui19Api}/declarations/${id}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => this.downloadBlob(blob, `UI19-${id}.csv`));
  }

  // ── IRP5 METHODS ──────────────────────────────────────────
  loadIrp5Certs() {
    this.irp5CertsLoading = true;
    this.http
      .get<IRP5Certificate[]>(`${this.irp5Api}/certificates?tax_year=${this.irp5TaxYear}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.irp5Certs = d;
          this.irp5CertsLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.irp5CertsLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadIrp5Recon() {
    this.irp5ReconLoading = true;
    this.http
      .get<IRP5Reconciliation>(`${this.irp5Api}/reconciliation?tax_year=${this.irp5TaxYear}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.irp5Recon = d;
          this.irp5ReconLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.irp5ReconLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onIrp5YearChange() {
    this.loadIrp5Certs();
    this.loadIrp5Recon();
  }

  generateIrp5() {
    this.irp5GenLoading = true;
    this.irp5GenMessage = '';
    this.irp5GenError = '';
    this.http
      .post<any>(`${this.irp5Api}/generate`, { tax_year: parseInt(this.irp5GenYear) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.irp5GenLoading = false;
          this.irp5GenMessage = ` ${res.message}`;
          this.irp5TaxYear = this.irp5GenYear;
          this.loadIrp5Certs();
          this.loadIrp5Recon();
          setTimeout(() => {
            this.irp5Tab = 'certificates';
            this.cdr.detectChanges();
          }, 2000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.irp5GenLoading = false;
          this.irp5GenError = err?.error?.error || 'Failed';
          this.cdr.detectChanges();
        },
      });
  }

  issueAllIrp5() {
    if (!confirm(`Issue all IRP5 certificates for ${this.irp5TaxYear}? This marks them as final.`))
      return;
    this.irp5IssueLoading = true;
    this.http
      .post<any>(`${this.irp5Api}/issue`, { tax_year: parseInt(this.irp5TaxYear) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.irp5IssueLoading = false;
          this.irp5IssueMessage = res.message;
          this.loadIrp5Certs();
          this.cdr.detectChanges();
        },
        error: () => {
          this.irp5IssueLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  viewIrp5Cert(cert: IRP5Certificate) {
    this.irp5SelectedCert = cert;
    this.irp5ShowModal = true;
    this.cdr.detectChanges();
  }

  printIrp5Certificate(cert: IRP5Certificate) {
    const token = localStorage.getItem('token') || '';
    fetch(`${this.irp5Api}/certificates/${cert.id}/html`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.text())
      .then((html) => {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          setTimeout(() => win.print(), 500);
        }
      });
  }

  exportIrp5CSV() {
    const token = localStorage.getItem('token') || '';
    fetch(`${this.irp5Api}/export?tax_year=${this.irp5TaxYear}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => this.downloadBlob(blob, `IRP5-${this.irp5TaxYear}.csv`));
  }

  getTaxYearLabel(year: string): string {
    const y = parseInt(year);
    return `1 Mar ${y - 1} – 28 Feb ${y}`;
  }

  // ── SHARED HELPERS ────────────────────────────────────────
  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  getPeriodName(period: string, year: string): string {
    return `${this.months[parseInt(period) - 1]?.label} ${year}`;
  }

  getDueStatus(dueDate: string | undefined): string {
    if (!dueDate) return '';
    const diff = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    if (diff <= 7) return `Due in ${diff} days`;
    return `Due ${this.formatDate(dueDate)}`;
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

  getStatusClass(status: string): string {
    const map: any = {
      draft: 'badge-draft',
      submitted: 'badge-submitted',
      acknowledged: 'badge-acknowledged',
      final: 'badge-final',
      issued: 'badge-issued',
    };
    return map[status] || 'badge-draft';
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
