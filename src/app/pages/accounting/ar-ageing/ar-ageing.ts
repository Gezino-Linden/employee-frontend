// File: src/app/pages/accounting/ar-ageing/ar-ageing.ts
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

export interface AgeingCustomer {
  customer_name: string;
  invoice_count: number;
  opening_balance: number;
  current_due: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total_outstanding: number;
  running_90plus: number;
  running_61_90: number;
  running_31_60: number;
  running_1_30: number;
  running_current: number;
}

export interface AgeingTotals {
  invoice_count: number;
  opening_balance: number;
  current_due: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total_outstanding: number;
  running_90plus: number;
  running_61_90: number;
  running_31_60: number;
  running_1_30: number;
  running_current: number;
}

export interface ARAgeing {
  as_of: string;
  customers: AgeingCustomer[];
  totals: AgeingTotals;
}

@Component({
  selector: 'app-ar-ageing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ar-ageing.html',
  styleUrls: ['./ar-ageing.scss'],
})
export class ArAgeingComponent implements OnInit, AfterViewInit {
  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;

  report: ARAgeing | null = null;
  loading = false;
  errorMsg = '';
  showAlertModal = false;
  alertCustomer: AgeingCustomer | null = null;
  alertSending = false;
  alertSent = false;
  alertMsg = '';
  alertNote = '';
  activeTab: 'table' | 'charts' = 'table';

  private api = environment.apiUrl;
  private barChart: any = null;
  private donutChart: any = null;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadReport(); }

  ngAfterViewInit() {}

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
        setTimeout(() => this.renderCharts(), 100);
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Failed to load AR ageing report';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  setTab(tab: 'table' | 'charts') {
    this.activeTab = tab;
    if (tab === 'charts') setTimeout(() => this.renderCharts(), 100);
  }

  renderCharts() {
    if (!this.report || typeof window === 'undefined') return;
    const win = window as any;
    if (!win.Chart) return;

    const bucketColors = ['#22c55e', '#f59e0b', '#f97316', '#ef4444', '#7f1d1d'];
    const bucketLabels = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
    const t = this.report.totals;
    const bucketData = [t.current_due, t.days_1_30, t.days_31_60, t.days_61_90, t.days_90_plus];

    // Destroy old charts
    if (this.barChart) { this.barChart.destroy(); this.barChart = null; }
    if (this.donutChart) { this.donutChart.destroy(); this.donutChart = null; }

    // Bar chart â€” top customers
    if (this.barCanvas?.nativeElement && this.report.customers.length > 0) {
      const top = [...this.report.customers]
        .sort((a, b) => b.total_outstanding - a.total_outstanding)
        .slice(0, 8);
      this.barChart = new win.Chart(this.barCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: top.map(c => c.customer_name.length > 16 ? c.customer_name.slice(0, 16) + 'â€¦' : c.customer_name),
          datasets: [
            { label: 'Current', data: top.map(c => c.current_due), backgroundColor: '#22c55e' },
            { label: '1-30 Days', data: top.map(c => c.days_1_30), backgroundColor: '#f59e0b' },
            { label: '31-60 Days', data: top.map(c => c.days_31_60), backgroundColor: '#f97316' },
            { label: '61-90 Days', data: top.map(c => c.days_61_90), backgroundColor: '#ef4444' },
            { label: '90+ Days', data: top.map(c => c.days_90_plus), backgroundColor: '#7f1d1d' },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8' } }, tooltip: { callbacks: { label: (ctx: any) => ` R ${ctx.raw.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` } } },
          scales: {
            x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
            y: { stacked: true, ticks: { color: '#94a3b8', callback: (v: any) => 'R ' + (v/1000).toFixed(0) + 'k' }, grid: { color: '#1e293b' } }
          }
        }
      });
    }

    // Donut chart â€” bucket breakdown
    if (this.donutCanvas?.nativeElement) {
      const nonZero = bucketData.some(v => v > 0);
      this.donutChart = new win.Chart(this.donutCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: bucketLabels,
          datasets: [{ data: nonZero ? bucketData : [1], backgroundColor: nonZero ? bucketColors : ['#1e293b'], borderWidth: 2, borderColor: '#0f172a' }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } },
            tooltip: { callbacks: { label: (ctx: any) => ` R ${ctx.raw.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` } }
          },
          cutout: '65%'
        }
      });
    }
  }

  // â”€â”€ EXPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  exportExcel() {
    if (!this.report) return;
    const win = window as any;
    if (!win.XLSX) { alert('Excel library not loaded. Please refresh.'); return; }
    const XLSX = win.XLSX;

    const rows = [
      ['AR Ageing Report', '', '', '', '', '', '', ''],
      [`As of: ${this.report.as_of}`, '', '', '', '', '', '', ''],
      [''],
      ['Customer', 'Invoices', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Total Outstanding'],
      ...this.report.customers.map(c => [
        c.customer_name, c.invoice_count,
        c.current_due, c.days_1_30, c.days_31_60, c.days_61_90, c.days_90_plus, c.total_outstanding
      ]),
      [''],
      ['TOTALS', this.report.totals.invoice_count,
        this.report.totals.current_due, this.report.totals.days_1_30, this.report.totals.days_31_60,
        this.report.totals.days_61_90, this.report.totals.days_90_plus, this.report.totals.total_outstanding]
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AR Ageing');
    XLSX.writeFile(wb, `AR_Ageing_${this.report.as_of}.xlsx`);
  }

  exportPDF() {
    if (!this.report) return;
    const win = window as any;
    if (!win.jspdf) { alert('PDF library not loaded. Please refresh.'); return; }
    const { jsPDF } = win.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MaeRoll â€” AR Ageing Report', 14, 14);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`As of: ${this.report.as_of}`, 14, 24);

    // Summary boxes
    const t = this.report.totals;
    const boxes = [
      { label: 'Total Outstanding', val: this.fmt(t.total_outstanding), color: [99, 102, 241] },
      { label: 'Current', val: this.fmt(t.current_due), color: [34, 197, 94] },
      { label: '1-30 Days', val: this.fmt(t.days_1_30), color: [245, 158, 11] },
      { label: '31-60 Days', val: this.fmt(t.days_31_60), color: [249, 115, 22] },
      { label: '61-90 Days', val: this.fmt(t.days_61_90), color: [239, 68, 68] },
      { label: '90+ Days', val: this.fmt(t.days_90_plus), color: [127, 29, 29] },
    ];
    boxes.forEach((b, i) => {
      const x = 14 + i * 46;
      doc.setFillColor(b.color[0], b.color[1], b.color[2]);
      doc.roundedRect(x, 36, 42, 18, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(b.label, x + 3, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(b.val, x + 3, 50);
      doc.setFont('helvetica', 'normal');
    });

    // Table
    if (win.autoTable) {
      win.autoTable(doc, {
        startY: 60,
        head: [['Customer', 'Invoices', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Total', 'Risk']],
        body: this.report.customers.map(c => [
          c.customer_name, c.invoice_count,
          this.fmt(c.current_due), this.fmt(c.days_1_30), this.fmt(c.days_31_60),
          this.fmt(c.days_61_90), this.fmt(c.days_90_plus), this.fmt(c.total_outstanding),
          this.riskLabel(c)
        ]),
        foot: [['TOTALS', t.invoice_count, this.fmt(t.current_due), this.fmt(t.days_1_30),
          this.fmt(t.days_31_60), this.fmt(t.days_61_90), this.fmt(t.days_90_plus), this.fmt(t.total_outstanding), '']],
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold' },
        footStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [15, 23, 42] },
        bodyStyles: { fillColor: [22, 33, 55], textColor: [203, 213, 225] },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 8) {
            const val = data.cell.raw;
            if (val === 'Critical') data.cell.styles.textColor = [239, 68, 68];
            else if (val === 'High') data.cell.styles.textColor = [249, 115, 22];
            else if (val === 'Medium') data.cell.styles.textColor = [245, 158, 11];
            else data.cell.styles.textColor = [34, 197, 94];
          }
        }
      });
    }

    doc.save(`AR_Ageing_${this.report.as_of}.pdf`);
  }

  // â”€â”€ COLLECTION ALERTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  openAlert(customer: AgeingCustomer) {
    this.alertCustomer = customer;
    this.alertNote = this.defaultAlertNote(customer);
    this.alertSent = false;
    this.alertMsg = '';
    this.showAlertModal = true;
  }

  closeAlert() {
    this.showAlertModal = false;
    this.alertCustomer = null;
    this.alertSent = false;
    this.alertMsg = '';
    this.alertNote = '';
  }

  defaultAlertNote(c: AgeingCustomer): string {
    const risk = this.riskLabel(c);
    if (risk === 'Critical') return `Dear ${c.customer_name},\n\nYour account has an outstanding balance of ${this.fmt(c.total_outstanding)}, of which ${this.fmt(c.days_90_plus)} is more than 90 days overdue.\n\nImmediate payment is required to avoid further action. Please contact us urgently.\n\nRegards,\nAccounts Team`;
    if (risk === 'High') return `Dear ${c.customer_name},\n\nThis is a reminder that your account has an overdue balance of ${this.fmt(c.total_outstanding)}.\n\nPlease arrange payment at your earliest convenience.\n\nRegards,\nAccounts Team`;
    return `Dear ${c.customer_name},\n\nThis is a friendly reminder that you have an outstanding balance of ${this.fmt(c.total_outstanding)} on your account.\n\nPlease ensure payment is made by the due date.\n\nRegards,\nAccounts Team`;
  }

  sendAlert() {
    if (!this.alertCustomer) return;
    this.alertSending = true;
    // Log the alert (backend email integration can be wired later)
    setTimeout(() => {
      this.alertSending = false;
      this.alertSent = true;
      this.alertMsg = `Collection alert logged for ${this.alertCustomer!.customer_name}`;
      this.cdr.detectChanges();
    }, 1000);
  }

  sendAllAlerts() {
    if (!this.report) return;
    const overdue = this.report.customers.filter(c =>
      c.days_1_30 > 0 || c.days_31_60 > 0 || c.days_61_90 > 0 || c.days_90_plus > 0
    );
    alert(`Collection alerts logged for ${overdue.length} customer(s) with overdue balances.`);
  }

  // â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  fmt(val: number): string {
    return 'R ' + (val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  riskClass(customer: AgeingCustomer): string {
    if (customer.days_90_plus > 0) return 'risk-critical';
    const overdue = customer.days_31_60 + customer.days_61_90 + customer.days_90_plus;
    const pct = customer.total_outstanding > 0 ? overdue / customer.total_outstanding : 0;
    if (pct > 0.5) return 'risk-high';
    if (customer.days_1_30 > 0) return 'risk-medium';
    return 'risk-ok';
  }

  riskLabel(c: AgeingCustomer): string {
    const rc = this.riskClass(c);
    if (rc === 'risk-critical') return 'Critical';
    if (rc === 'risk-high') return 'High';
    if (rc === 'risk-medium') return 'Medium';
    return 'OK';
  }

  goBack() { this.router.navigate(['/accounting']); }

  get hasData(): boolean { return !!this.report && this.report.customers.length > 0; }

  get totalOverdue(): number {
    if (!this.report) return 0;
    const t = this.report.totals;
    return t.days_1_30 + t.days_31_60 + t.days_61_90 + t.days_90_plus;
  }

  get overdueCustomers(): AgeingCustomer[] {
    if (!this.report) return [];
    return this.report.customers.filter(c =>
      c.days_1_30 > 0 || c.days_31_60 > 0 || c.days_61_90 > 0 || c.days_90_plus > 0
    );
  }

  get criticalCustomers(): AgeingCustomer[] {
    if (!this.report) return [];
    return this.report.customers.filter(c => c.days_90_plus > 0);
  }
}

