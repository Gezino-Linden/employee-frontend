// File: src/app/pages/ui19/ui19.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';

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

type ActiveTab = 'list' | 'detail' | 'generate';

@Component({
  selector: 'app-ui19',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ui19.html',
  styleUrls: ['./ui19.css'],
})
export class UI19 implements OnInit {
  me: MeResponse | null = null;
  activeTab: ActiveTab = 'list';

  declarations: UI19Declaration[] = [];
  loadingDeclarations = true;
  filterYear = new Date().getFullYear();

  selectedDeclaration: UI19Declaration | null = null;
  lineItems: UI19LineItem[] = [];
  loadingDetail = false;
  editingLineItemId: number | null = null;
  editUifNumber = '';
  editDaysWorked = 22;

  generateMonth = new Date().getMonth() + 1;
  generateYear = new Date().getFullYear();
  generateLoading = false;
  generateMessage = '';
  generateError = '';

  showSubmitModal = false;
  submitReference = '';
  submitNotes = '';
  submitLoading = false;
  submitError = '';

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

  private apiBase = 'https://employee-api-xpno.onrender.com/api/ui19';

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
    this.loadDeclarations();
  }

  loadDeclarations() {
    this.loadingDeclarations = true;
    this.http
      .get<UI19Declaration[]>(`${this.apiBase}/declarations?year=${this.filterYear}`)
      .subscribe({
        next: (data) => {
          this.declarations = data;
          this.loadingDeclarations = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingDeclarations = false;
          this.cdr.detectChanges();
        },
      });
  }

  viewDeclaration(decl: UI19Declaration) {
    this.selectedDeclaration = decl;
    this.loadingDetail = true;
    this.activeTab = 'detail';
    this.editingLineItemId = null;
    this.http
      .get<{ declaration: UI19Declaration; lineItems: UI19LineItem[] }>(
        `${this.apiBase}/declarations/${decl.id}`
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

  generate() {
    this.generateLoading = true;
    this.generateMessage = '';
    this.generateError = '';
    this.http
      .post<any>(`${this.apiBase}/generate`, { month: this.generateMonth, year: this.generateYear })
      .subscribe({
        next: (res) => {
          this.generateLoading = false;
          this.generateMessage = `✅ UI-19 generated for ${
            this.months[this.generateMonth - 1].label
          } ${this.generateYear} — Total UIF: ${this.formatMoney(res.declaration.total_uif)}`;
          this.loadDeclarations();
          setTimeout(() => {
            this.activeTab = 'list';
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

  startEditLineItem(item: UI19LineItem) {
    this.editingLineItemId = item.id;
    this.editUifNumber = item.uif_number || '';
    this.editDaysWorked = item.days_worked || 22;
  }

  saveLineItem(item: UI19LineItem) {
    this.http
      .patch<UI19LineItem>(`${this.apiBase}/line-items/${item.id}`, {
        uif_number: this.editUifNumber,
        days_worked: this.editDaysWorked,
      })
      .subscribe({
        next: (updated) => {
          const idx = this.lineItems.findIndex((i) => i.id === item.id);
          if (idx !== -1) this.lineItems[idx] = updated;
          this.editingLineItemId = null;
          this.cdr.detectChanges();
        },
        error: () => this.cdr.detectChanges(),
      });
  }

  openSubmitModal() {
    this.submitReference = '';
    this.submitNotes = '';
    this.submitError = '';
    this.showSubmitModal = true;
  }

  submitDeclaration() {
    if (!this.selectedDeclaration || !this.submitReference) return;
    this.submitLoading = true;
    this.http
      .post<any>(`${this.apiBase}/declarations/${this.selectedDeclaration.id}/submit`, {
        submission_reference: this.submitReference,
        notes: this.submitNotes,
      })
      .subscribe({
        next: (res) => {
          this.submitLoading = false;
          this.showSubmitModal = false;
          this.selectedDeclaration = res.declaration;
          this.loadDeclarations();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.submitLoading = false;
          this.submitError = err?.error?.error || 'Failed to submit';
          this.cdr.detectChanges();
        },
      });
  }

  exportCSV(id: number) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    fetch(`${this.apiBase}/declarations/${id}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', `UI19-${id}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  }

  getPeriodName(month: number, year: number): string {
    return `${this.months[month - 1]?.label} ${year}`;
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
    const map: any = {
      draft: 'badge-draft',
      submitted: 'badge-submitted',
      acknowledged: 'badge-acknowledged',
    };
    return map[status] || 'badge-draft';
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
