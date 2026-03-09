// File: src/app/pages/accounting/ar-ageing/ar-ageing.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

export interface AgeingCustomer {
  customer_name: string;
  invoice_count: number;
  current_due: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total_outstanding: number;
}

export interface AgeingTotals {
  invoice_count: number;
  current_due: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total_outstanding: number;
}

export interface ARAgeing {
  as_of: string;
  customers: AgeingCustomer[];
  totals: AgeingTotals;
}

@Component({
  selector: 'app-ar-ageing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ar-ageing.html',
  styleUrls: ['./ar-ageing.scss'],
})
export class ArAgeingComponent implements OnInit {
  report: ARAgeing | null = null;
  loading = false;
  errorMsg = '';

  private api = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadReport();
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadReport() {
    this.loading = true;
    this.errorMsg = '';
    this.http.get<ARAgeing>(`${this.api}/invoices/ageing`, { headers: this.headers() }).subscribe({
      next: (data) => {
        this.report = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Failed to load AR ageing report';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  fmt(val: number): string {
    return (
      'R ' +
      (val || 0).toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  riskClass(customer: AgeingCustomer): string {
    if (customer.days_90_plus > 0) return 'risk-critical';
    const overdue = customer.days_31_60 + customer.days_61_90 + customer.days_90_plus;
    const pct = customer.total_outstanding > 0 ? overdue / customer.total_outstanding : 0;
    if (pct > 0.5) return 'risk-high';
    if (customer.days_1_30 > 0) return 'risk-medium';
    return 'risk-ok';
  }

  goBack() {
    this.router.navigate(['/accounting']);
  }

  get hasData(): boolean {
    return !!this.report && this.report.customers.length > 0;
  }

  get totalOverdue(): number {
    if (!this.report) return 0;
    const t = this.report.totals;
    return t.days_1_30 + t.days_31_60 + t.days_61_90 + t.days_90_plus;
  }
}
