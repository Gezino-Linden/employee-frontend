// File: src/app/pages/irp5/irp5.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';

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

type ActiveTab = 'certificates' | 'reconciliation' | 'generate';

@Component({
  selector: 'app-irp5',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './irp5.html',
  styleUrls: ['./irp5.css'],
})
export class IRP5 implements OnInit {
  me: MeResponse | null = null;
  activeTab: ActiveTab = 'certificates';

  certificates: IRP5Certificate[] = [];
  loadingCerts = true;
  reconciliation: IRP5Reconciliation | null = null;
  loadingRecon = false;

  selectedTaxYear = '2026';
  taxYears = ['2025', '2026'];

  generateTaxYear = '2026';
  generateLoading = false;
  generateMessage = '';
  generateError = '';

  issueLoading = false;
  issueMessage = '';

  selectedCert: IRP5Certificate | null = null;
  showCertModal = false;

  private apiBase = 'https://employee-api-xpno.onrender.com/api/irp5';

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
    this.loadCertificates();
    this.loadReconciliation();
  }

  loadCertificates() {
    this.loadingCerts = true;
    this.http
      .get<IRP5Certificate[]>(`${this.apiBase}/certificates?tax_year=${this.selectedTaxYear}`)
      .subscribe({
        next: (data) => {
          this.certificates = data;
          this.loadingCerts = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingCerts = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadReconciliation() {
    this.loadingRecon = true;
    this.http
      .get<IRP5Reconciliation>(`${this.apiBase}/reconciliation?tax_year=${this.selectedTaxYear}`)
      .subscribe({
        next: (data) => {
          this.reconciliation = data;
          this.loadingRecon = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingRecon = false;
          this.cdr.detectChanges();
        },
      });
  }

  onYearChange() {
    this.loadCertificates();
    this.loadReconciliation();
  }

  generate() {
    this.generateLoading = true;
    this.generateMessage = '';
    this.generateError = '';
    this.http
      .post<any>(`${this.apiBase}/generate`, { tax_year: parseInt(this.generateTaxYear) })
      .subscribe({
        next: (res) => {
          this.generateLoading = false;
          this.generateMessage = `✅ ${res.message}`;
          this.selectedTaxYear = this.generateTaxYear;
          this.loadCertificates();
          this.loadReconciliation();
          setTimeout(() => {
            this.activeTab = 'certificates';
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

  issueAll() {
    if (
      !confirm(`Issue all IRP5 certificates for ${this.selectedTaxYear}? This marks them as final.`)
    )
      return;
    this.issueLoading = true;
    this.http
      .post<any>(`${this.apiBase}/issue`, { tax_year: parseInt(this.selectedTaxYear) })
      .subscribe({
        next: (res) => {
          this.issueLoading = false;
          this.issueMessage = res.message;
          this.loadCertificates();
          this.cdr.detectChanges();
        },
        error: () => {
          this.issueLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  viewCert(cert: IRP5Certificate) {
    this.selectedCert = cert;
    this.showCertModal = true;
    this.cdr.detectChanges();
  }

  printCertificate(cert: IRP5Certificate) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    fetch(`${this.apiBase}/certificates/${cert.id}/html`, {
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

  exportCSV() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    fetch(`${this.apiBase}/export?tax_year=${this.selectedTaxYear}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', `IRP5-${this.selectedTaxYear}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  }

  getTaxYearLabel(year: string): string {
    const y = parseInt(year);
    return `1 Mar ${y - 1} – 28 Feb ${y}`;
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

  getStatusClass(status: string): string {
    const map: any = { draft: 'badge-draft', final: 'badge-final', issued: 'badge-issued' };
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
