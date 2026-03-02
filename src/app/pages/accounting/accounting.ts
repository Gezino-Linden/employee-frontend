// File: src/app/pages/accounting/accounting.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';

export interface Account {
  id: number;
  code: string;
  name: string;
  account_type: string;
}

export interface GLMapping {
  payroll_item_type: string;
  debit_code: string;
  debit_name: string;
  credit_code: string;
  credit_name: string;
  department: string | null;
  is_default: boolean;
}

export interface JournalLine {
  line: number;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  category: string;
}

export interface Journal {
  journal_id: string;
  date: string;
  period_start: string;
  period_end: string;
  reference: string;
  type: string;
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
  summary: any;
  department_breakdown: any;
  lines: JournalLine[];
}

export interface PayrollPeriod {
  id: number;
  period_start: string;
  period_end: string;
  status?: string;
}

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './accounting.html',
  styleUrls: ['./accounting.css'],
})
export class Accounting implements OnInit {
  me: MeResponse | null = null;
  activeTab: 'accounts' | 'journal' | 'mappings' = 'accounts';

  // Accounts
  accounts: Account[] = [];
  loadingAccounts = false;
  accountSearch = '';

  // GL Mappings
  mappings: GLMapping[] = [];
  loadingMappings = false;

  // Journal
  periods: PayrollPeriod[] = [];
  loadingPeriods = false;
  journalForm = {
    payroll_period_id: '',
    type: 'standard' as 'standard' | 'hospitality',
    property_id: '',
  };
  journal: Journal | null = null;
  generatingJournal = false;
  exportingCSV = false;

  errorMsg = '';
  successMsg = '';

  private api = 'https://employee-api-xpno.onrender.com/api';

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
    this.loadAccounts();
    this.loadPeriods();
  }

  setTab(tab: 'accounts' | 'journal' | 'mappings') {
    this.activeTab = tab;
    this.errorMsg = '';
    this.successMsg = '';
    if (tab === 'mappings' && this.mappings.length === 0) this.loadMappings();
  }

  // ── ACCOUNTS ─────────────────────────────────────────
  loadAccounts() {
    this.loadingAccounts = true;
    this.http.get<any>(`${this.api}/accounting/accounts`).subscribe({
      next: (res) => {
        this.accounts = res.data || res || [];
        this.loadingAccounts = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAccounts = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredAccounts(): Account[] {
    if (!this.accountSearch) return this.accounts;
    const q = this.accountSearch.toLowerCase();
    return this.accounts.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.account_type.toLowerCase().includes(q)
    );
  }

  getAccountTypeColor(type: string): string {
    const map: any = {
      asset: '#10b981',
      liability: '#ef4444',
      equity: '#8b5cf6',
      income: '#3b82f6',
      expense: '#f59e0b',
    };
    return map[type?.toLowerCase()] || '#64748b';
  }

  groupedAccounts(): { type: string; accounts: Account[] }[] {
    const groups: any = {};
    this.filteredAccounts.forEach((a) => {
      const t = a.account_type || 'Other';
      if (!groups[t]) groups[t] = [];
      groups[t].push(a);
    });
    return Object.keys(groups).map((type) => ({ type, accounts: groups[type] }));
  }

  // ── PAYROLL PERIODS ───────────────────────────────────
  loadPeriods() {
    this.loadingPeriods = true;
    this.http.get<any>(`${this.api}/accounting/periods`).subscribe({
      next: (res) => {
        this.periods = res.data || res || [];
        this.loadingPeriods = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: try payroll_periods endpoint
        this.http.get<any>(`${this.api}/payroll/periods`).subscribe({
          next: (res) => {
            this.periods = res.data || res || [];
            this.loadingPeriods = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.loadingPeriods = false;
            this.cdr.detectChanges();
          },
        });
      },
    });
  }

  // ── JOURNAL ───────────────────────────────────────────
  generateJournal() {
    if (!this.journalForm.payroll_period_id) {
      this.errorMsg = 'Please select a payroll period';
      return;
    }
    this.generatingJournal = true;
    this.errorMsg = '';
    this.journal = null;

    const body: any = {
      payroll_period_id: parseInt(this.journalForm.payroll_period_id),
      type: this.journalForm.type,
    };
    if (this.journalForm.property_id) body.property_id = parseInt(this.journalForm.property_id);

    this.http.post<any>(`${this.api}/accounting/journal/generate`, body).subscribe({
      next: (res) => {
        this.journal = res.data || res;
        this.generatingJournal = false;
        this.successMsg = 'Journal generated successfully!';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMsg = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Failed to generate journal';
        this.generatingJournal = false;
        this.cdr.detectChanges();
      },
    });
  }

  exportCSV() {
    if (!this.journalForm.payroll_period_id) return;
    this.exportingCSV = true;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const params = `?format=csv&payroll_period_id=${this.journalForm.payroll_period_id}&type=${this.journalForm.type}`;
    fetch(`${this.api}/accounting/export/csv${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal-${this.journalForm.payroll_period_id}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.exportingCSV = false;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.exportingCSV = false;
        this.cdr.detectChanges();
      });
  }

  // ── GL MAPPINGS ───────────────────────────────────────
  loadMappings() {
    this.loadingMappings = true;
    this.http.get<any>(`${this.api}/accounting/mappings`).subscribe({
      next: (res) => {
        this.mappings = res.data || res || [];
        this.loadingMappings = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMappings = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── HELPERS ───────────────────────────────────────────
  formatMoney(val: any): string {
    return Number(val || 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  getDeptKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  isAdmin(): boolean {
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
