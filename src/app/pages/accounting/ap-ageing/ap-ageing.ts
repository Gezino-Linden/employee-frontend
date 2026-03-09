// File: src/app/pages/accounting/ap-ageing/ap-ageing.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

export interface AgeingSupplier {
  supplier_name: string;
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

export interface AgeingReport {
  as_of: string;
  suppliers: AgeingSupplier[];
  totals: AgeingTotals;
}

@Component({
  selector: 'app-ap-ageing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ap-ageing.html',
  styleUrls: ['./ap-ageing.scss'],
})
export class ApAgeingComponent implements OnInit {
  report: AgeingReport | null = null;
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
    this.http.get<AgeingReport>(`${this.api}/ap/ageing`, { headers: this.headers() }).subscribe({
      next: (data) => {
        this.report = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Failed to load ageing report';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  fmt(val: number): string {
    return (
      'R ' +
      (val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  riskClass(supplier: AgeingSupplier): string {
    const overdue = supplier.days_31_60 + supplier.days_61_90 + supplier.days_90_plus;
    const pct = supplier.total_outstanding > 0 ? overdue / supplier.total_outstanding : 0;
    if (supplier.days_90_plus > 0) return 'risk-critical';
    if (pct > 0.5) return 'risk-high';
    if (supplier.days_1_30 > 0) return 'risk-medium';
    return 'risk-ok';
  }

  goBack() {
    this.router.navigate(['/accounting']);
  }

  get hasData(): boolean {
    return !!this.report && this.report.suppliers.length > 0;
  }

  get totalOverdue(): number {
    if (!this.report) return 0;
    const t = this.report.totals;
    return t.days_1_30 + t.days_31_60 + t.days_61_90 + t.days_90_plus;
  }
}
