// File: src/app/pages/accounting/ap-ageing/ap-ageing.ts
import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

export interface AgeingSupplier {
  supplier_name: string;
  invoice_count: number;
  opening_balance: number;
  current_due: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_120: number;
  days_120_150: number;
  days_150_180: number;
  days_180_210: number;
  days_210_240: number;
  days_240_270: number;
  days_270_300: number;
  days_300_330: number;
  days_330_360: number;
  days_360_plus: number;
  total_outstanding: number;
  balance_360plus: number;
  balance_330_360: number;
  balance_300_330: number;
  balance_270_300: number;
  balance_240_270: number;
  balance_210_240: number;
  balance_180_210: number;
  balance_150_180: number;
  balance_120_150: number;
  balance_90_120: number;
  balance_61_90: number;
  balance_31_60: number;
  balance_1_30: number;
  balance_current: number;
}

export interface AgeingTotals extends AgeingSupplier {}

export interface APAgeing {
  as_of: string;
  suppliers: AgeingSupplier[];
  totals: AgeingTotals;
}

@Component({
  selector: 'app-ap-ageing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ap-ageing.html',
  styleUrls: ['./ap-ageing.scss'],
})
export class ApAgeingComponent implements OnInit, AfterViewInit {
  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;

  report: APAgeing | null = null;
  loading = false;
  errorMsg = '';
  showAlertModal = false;
  alertSupplier: AgeingSupplier | null = null;
  alertSending = false;
  alertSent = false;
  alertMsg = '';
  alertNote = '';
  activeTab: 'table' | 'charts' = 'table';
  showExtended = false;

  private api = environment.apiUrl;
  private barChart: any = null;
  private donutChart: any = null;

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadReport();
  }
  ngAfterViewInit() {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadReport() {
    this.loading = true;
    this.errorMsg = '';
    this.http.get<APAgeing>(`${this.api}/ap/ageing`, { headers: this.headers() }).subscribe({
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

  toggleExtended() {
    this.showExtended = !this.showExtended;
  }

  setTab(tab: 'table' | 'charts') {
    this.activeTab = tab;
    if (tab === 'charts') setTimeout(() => this.renderCharts(), 100);
  }

  get anyExtendedData(): boolean {
    if (!this.report) return false;
    return this.report.suppliers.some(
      (c) =>
        c.days_90_120 +
          c.days_120_150 +
          c.days_150_180 +
          c.days_180_210 +
          c.days_210_240 +
          c.days_240_270 +
          c.days_270_300 +
          c.days_300_330 +
          c.days_330_360 +
          c.days_360_plus >
        0
    );
  }

  renderCharts() {
    if (!this.report || typeof window === 'undefined') return;
    const win = window as any;
    if (!win.Chart) return;
    const t = this.report.totals;
    const bucketLabels = [
      'Current',
      '1-30',
      '31-60',
      '61-90',
      '90-120',
      '120-150',
      '150-180',
      '180+',
    ];
    const bucketColors = [
      '#22c55e',
      '#84cc16',
      '#f59e0b',
      '#f97316',
      '#ef4444',
      '#dc2626',
      '#b91c1c',
      '#7f1d1d',
    ];
    const bucketData = [
      t.current_due,
      t.days_1_30,
      t.days_31_60,
      t.days_61_90,
      t.days_90_120,
      t.days_120_150,
      t.days_150_180,
      (t.days_180_210 || 0) +
        (t.days_210_240 || 0) +
        (t.days_240_270 || 0) +
        (t.days_270_300 || 0) +
        (t.days_300_330 || 0) +
        (t.days_330_360 || 0) +
        (t.days_360_plus || 0),
    ];
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }
    if (this.donutChart) {
      this.donutChart.destroy();
      this.donutChart = null;
    }
    if (this.barCanvas?.nativeElement && this.report.suppliers.length > 0) {
      const top = [...this.report.suppliers]
        .sort((a, b) => b.total_outstanding - a.total_outstanding)
        .slice(0, 8);
      this.barChart = new win.Chart(this.barCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: top.map((c) =>
            c.supplier_name.length > 16 ? c.supplier_name.slice(0, 16) + '…' : c.supplier_name
          ),
          datasets: [
            { label: 'Current', data: top.map((c) => c.current_due), backgroundColor: '#22c55e' },
            { label: '1-30', data: top.map((c) => c.days_1_30), backgroundColor: '#f59e0b' },
            { label: '31-60', data: top.map((c) => c.days_31_60), backgroundColor: '#f97316' },
            { label: '61-90', data: top.map((c) => c.days_61_90), backgroundColor: '#ef4444' },
            {
              label: '90+',
              data: top.map(
                (c) =>
                  c.days_90_120 +
                  c.days_120_150 +
                  c.days_150_180 +
                  c.days_180_210 +
                  c.days_210_240 +
                  c.days_240_270 +
                  c.days_270_300 +
                  c.days_300_330 +
                  c.days_330_360 +
                  c.days_360_plus
              ),
              backgroundColor: '#7f1d1d',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94a3b8' } },
            tooltip: {
              callbacks: {
                label: (ctx: any) =>
                  ` R ${ctx.raw.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
              },
            },
          },
          scales: {
            x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
            y: {
              stacked: true,
              ticks: { color: '#94a3b8', callback: (v: any) => 'R ' + (v / 1000).toFixed(0) + 'k' },
              grid: { color: '#1e293b' },
            },
          },
        },
      });
    }
    if (this.donutCanvas?.nativeElement) {
      const nonZero = bucketData.some((v) => v > 0);
      this.donutChart = new win.Chart(this.donutCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: bucketLabels,
          datasets: [
            {
              data: nonZero ? bucketData : [1],
              backgroundColor: nonZero ? bucketColors : ['#1e293b'],
              borderWidth: 2,
              borderColor: '#0f172a',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', padding: 10, font: { size: 10 } },
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) =>
                  ` R ${ctx.raw.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
              },
            },
          },
          cutout: '65%',
        },
      });
    }
  }

  exportExcel() {
    if (!this.report) return;
    const win = window as any;
    if (!win.XLSX) {
      alert('Excel library not loaded.');
      return;
    }
    const XLSX = win.XLSX;
    const t = this.report.totals;
    const rows = [
      ['AR Ageing Report'],
      [`As of: ${this.report.as_of}`],
      [],
      [
        'Customer',
        '#',
        'Opening Bal',
        'Current',
        '1-30',
        '31-60',
        '61-90',
        '90-120',
        '120-150',
        '150-180',
        '180-210',
        '210-240',
        '240-270',
        '270-300',
        '300-330',
        '330-360',
        '360+',
        'Total',
      ],
      ...this.report.suppliers.map((c) => [
        c.supplier_name,
        c.invoice_count,
        c.opening_balance,
        c.current_due,
        c.days_1_30,
        c.days_31_60,
        c.days_61_90,
        c.days_90_120,
        c.days_120_150,
        c.days_150_180,
        c.days_180_210,
        c.days_210_240,
        c.days_240_270,
        c.days_270_300,
        c.days_300_330,
        c.days_330_360,
        c.days_360_plus,
        c.total_outstanding,
      ]),
      [],
      [
        'TOTALS',
        t.invoice_count,
        t.opening_balance,
        t.current_due,
        t.days_1_30,
        t.days_31_60,
        t.days_61_90,
        t.days_90_120,
        t.days_120_150,
        t.days_150_180,
        t.days_180_210,
        t.days_210_240,
        t.days_240_270,
        t.days_270_300,
        t.days_300_330,
        t.days_330_360,
        t.days_360_plus,
        t.total_outstanding,
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 28 }, ...Array(17).fill({ wch: 12 })];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AR Ageing');
    XLSX.writeFile(wb, `AR_Ageing_${this.report.as_of}.xlsx`);
  }

  exportPDF() {
    if (!this.report) return;
    const win = window as any;
    if (!win.jspdf) {
      alert('PDF library not loaded.');
      return;
    }
    const { jsPDF } = win.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MaeRoll - AR Ageing Report', 14, 14);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`As of: ${this.report.as_of}`, 14, 24);
    const t = this.report.totals;
    const boxes = [
      { label: 'Total Outstanding', val: this.fmt(t.total_outstanding), color: [99, 102, 241] },
      { label: 'Current', val: this.fmt(t.current_due), color: [34, 197, 94] },
      { label: '1-30 Days', val: this.fmt(t.days_1_30), color: [245, 158, 11] },
      { label: '31-60 Days', val: this.fmt(t.days_31_60), color: [249, 115, 22] },
      { label: '61-90 Days', val: this.fmt(t.days_61_90), color: [239, 68, 68] },
      {
        label: '90+ Days',
        val: this.fmt(
          t.days_90_120 +
            t.days_120_150 +
            t.days_150_180 +
            t.days_180_210 +
            t.days_210_240 +
            t.days_240_270 +
            t.days_270_300 +
            t.days_300_330 +
            t.days_330_360 +
            t.days_360_plus
        ),
        color: [127, 29, 29],
      },
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
    if (win.autoTable) {
      win.autoTable(doc, {
        startY: 60,
        head: [
          [
            'Customer',
            '#',
            'Opening',
            'Current',
            '1-30',
            '31-60',
            '61-90',
            '90-120',
            '120-150',
            '150+',
            'Total',
            'Risk',
          ],
        ],
        body: this.report.suppliers.map((c) => [
          c.supplier_name,
          c.invoice_count,
          this.fmt(c.opening_balance),
          this.fmt(c.current_due),
          this.fmt(c.days_1_30),
          this.fmt(c.days_31_60),
          this.fmt(c.days_61_90),
          this.fmt(c.days_90_120),
          this.fmt(c.days_120_150),
          this.fmt(
            c.days_150_180 +
              c.days_180_210 +
              c.days_210_240 +
              c.days_240_270 +
              c.days_270_300 +
              c.days_300_330 +
              c.days_330_360 +
              c.days_360_plus
          ),
          this.fmt(c.total_outstanding),
          this.riskLabel(c),
        ]),
        foot: [
          [
            'TOTALS',
            t.invoice_count,
            this.fmt(t.opening_balance),
            this.fmt(t.current_due),
            this.fmt(t.days_1_30),
            this.fmt(t.days_31_60),
            this.fmt(t.days_61_90),
            this.fmt(t.days_90_120),
            this.fmt(t.days_120_150),
            '',
            this.fmt(t.total_outstanding),
            '',
          ],
        ],
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold' },
        footStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [15, 23, 42] },
        bodyStyles: { fillColor: [22, 33, 55], textColor: [203, 213, 225] },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 11) {
            const val = data.cell.raw;
            if (val === 'Critical') data.cell.styles.textColor = [239, 68, 68];
            else if (val === 'High') data.cell.styles.textColor = [249, 115, 22];
            else if (val === 'Medium') data.cell.styles.textColor = [245, 158, 11];
            else data.cell.styles.textColor = [34, 197, 94];
          }
        },
      });
    }
    doc.save(`AR_Ageing_${this.report.as_of}.pdf`);
  }

  openAlert(customer: AgeingSupplier) {
    this.alertSupplier = customer;
    this.alertNote = this.defaultAlertNote(customer);
    this.alertSent = false;
    this.alertMsg = '';
    this.showAlertModal = true;
  }

  closeAlert() {
    this.showAlertModal = false;
    this.alertSupplier = null;
    this.alertSent = false;
    this.alertMsg = '';
    this.alertNote = '';
  }

  defaultAlertNote(c: AgeingSupplier): string {
    const risk = this.riskLabel(c);
    if (risk === 'Critical')
      return `Dear ${c.supplier_name},\n\nYour account has an outstanding balance of ${this.fmt(
        c.total_outstanding
      )}, of which a significant portion is more than 90 days overdue.\n\nImmediate payment is required to avoid further action. Please contact us urgently.\n\nRegards,\nAccounts Team`;
    if (risk === 'High')
      return `Dear ${
        c.supplier_name
      },\n\nThis is a reminder that your account has an overdue balance of ${this.fmt(
        c.total_outstanding
      )}.\n\nPlease arrange payment at your earliest convenience.\n\nRegards,\nAccounts Team`;
    return `Dear ${
      c.supplier_name
    },\n\nThis is a friendly reminder that you have an outstanding balance of ${this.fmt(
      c.total_outstanding
    )} on your account.\n\nPlease ensure payment is made by the due date.\n\nRegards,\nAccounts Team`;
  }

  sendAlert() {
    if (!this.alertSupplier) return;
    this.alertSending = true;
    setTimeout(() => {
      this.alertSending = false;
      this.alertSent = true;
      this.alertMsg = `Payment reminder logged for ${this.alertSupplier!.supplier_name}`;
      this.cdr.detectChanges();
    }, 1000);
  }

  sendAllReminders() {
    if (!this.report) return;
    alert(
      `Payment reminders logged for ${this.overdueSuppliers.length} customer(s) with overdue balances.`
    );
  }

  fmt(val: number): string {
    return (
      'R ' +
      (val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  riskClass(c: AgeingSupplier): string {
    const over90 =
      c.days_90_120 +
      c.days_120_150 +
      c.days_150_180 +
      c.days_180_210 +
      c.days_210_240 +
      c.days_240_270 +
      c.days_270_300 +
      c.days_300_330 +
      c.days_330_360 +
      c.days_360_plus;
    if (over90 > 0) return 'risk-critical';
    if (
      c.days_31_60 + c.days_61_90 > 0 &&
      (c.days_31_60 + c.days_61_90) / c.total_outstanding > 0.5
    )
      return 'risk-high';
    if (c.days_1_30 > 0) return 'risk-medium';
    return 'risk-ok';
  }

  riskLabel(c: AgeingSupplier): string {
    const rc = this.riskClass(c);
    if (rc === 'risk-critical') return 'Critical';
    if (rc === 'risk-high') return 'High';
    if (rc === 'risk-medium') return 'Medium';
    return 'OK';
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
    return (
      t.days_1_30 +
      t.days_31_60 +
      t.days_61_90 +
      t.days_90_120 +
      t.days_120_150 +
      t.days_150_180 +
      t.days_180_210 +
      t.days_210_240 +
      t.days_240_270 +
      t.days_270_300 +
      t.days_300_330 +
      t.days_330_360 +
      t.days_360_plus
    );
  }

  get overdueSuppliers(): AgeingSupplier[] {
    if (!this.report) return [];
    return this.report.suppliers.filter(
      (c) =>
        c.days_1_30 +
          c.days_31_60 +
          c.days_61_90 +
          c.days_90_120 +
          c.days_120_150 +
          c.days_150_180 +
          c.days_180_210 +
          c.days_210_240 +
          c.days_240_270 +
          c.days_270_300 +
          c.days_300_330 +
          c.days_330_360 +
          c.days_360_plus >
        0
    );
  }

  get criticalSuppliers(): AgeingSupplier[] {
    if (!this.report) return [];
    return this.report.suppliers.filter(
      (c) =>
        c.days_90_120 +
          c.days_120_150 +
          c.days_150_180 +
          c.days_180_210 +
          c.days_210_240 +
          c.days_240_270 +
          c.days_270_300 +
          c.days_300_330 +
          c.days_330_360 +
          c.days_360_plus >
        0
    );
  }
}

