// File: src/app/pages/accounting/accounting.ts
import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

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
export interface InvoiceCategory {
  id: number;
  code: string;
  name: string;
  gl_account: string;
  vat_rate: string;
  is_active: boolean;
}
export interface Invoice {
  id: string;
  invoice_number: string;
  guest_name: string;
  guest_email: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: string;
  vat_amount: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  notes: string;
}
export interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price: number;
  category_id: string;
}
export interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  payment_terms: number;
  is_active: boolean;
}
export interface APBill {
  id: string;
  bill_number: string;
  supplier_name: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: string;
  vat_amount: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  category: string;
}
export interface DailyRevenue {
  id: string;
  revenue_date: string;
  department: string;
  room_revenue: string;
  fb_revenue: string;
  other_revenue: string;
  total_revenue: string;
  occupancy_rate: string;
  rooms_occupied: number;
  rooms_available: number;
}
export interface PLReport {
  period: any;
  revenue: any[];
  total_revenue: number;
  costs: any[];
  total_costs: number;
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
  avg_occupancy: number;
}
export interface VATReturn {
  period: any;
  output_vat: number;
  input_vat: number;
  vat_payable: number;
  output_transactions: number;
  input_transactions: number;
}

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounting.html',
  styleUrls: ['./accounting.css'],
})
export class Accounting implements OnInit {
  private destroyRef = inject(DestroyRef);

  me: MeResponse | null = null;
  activeTab:
    | 'accounts'
    | 'journal'
    | 'mappings'
    | 'invoices'
    | 'suppliers'
    | 'revenue'
    | 'financials'
    | 'apageing'
    | 'arageing' = 'accounts';

  accounts: Account[] = [];
  loadingAccounts = false;
  accountSearch = '';
  mappings: GLMapping[] = [];
  loadingMappings = false;
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

  invoices: Invoice[] = [];
  loadingInvoices = false;
  invoiceCategories: InvoiceCategory[] = [];
  showInvoiceForm = false;
  invoiceStatusFilter = '';
  newInvoice = {
    guest_name: '',
    guest_email: '',
    due_date: '',
    notes: '',
    lines: [{ description: '', quantity: 1, unit_price: 0, category_id: '' }] as InvoiceLine[],
  };
  savingInvoice = false;
  recordingPayment: string | null = null;
  paymentAmount = 0;
  paymentMethod = 'bank_transfer';

  suppliers: Supplier[] = [];
  loadingSuppliers = false;
  apBills: APBill[] = [];
  loadingBills = false;
  apView: 'suppliers' | 'bills' = 'suppliers';
  showSupplierForm = false;
  showBillForm = false;
  newSupplier = {
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    vat_number: '',
    payment_terms: 30,
  };
  newBill = {
    supplier_id: '',
    bill_number: '',
    issue_date: '',
    due_date: '',
    subtotal: 0,
    vat_amount: 0,
    category: 'food_beverage',
    description: '',
  };
  savingSupplier = false;
  savingBill = false;

  payBillModal: APBill | null = null;
  billPaymentAmount = 0;
  billPaymentMethod = 'bank_transfer';
  billPaymentDate = new Date().toISOString().split('T')[0];
  billPaymentRef = '';
  savingBillPayment = false;
  payingBill: string | null = null;

  closingPeriod = false;
  periodClosed: any = null;

  dailyRevenue: DailyRevenue[] = [];
  loadingRevenue = false;
  revenueForm = {
    revenue_date: new Date().toISOString().split('T')[0],
    department: 'rooms',
    room_revenue: 0,
    fb_revenue: 0,
    other_revenue: 0,
    occupancy_rate: 0,
    rooms_occupied: 0,
    rooms_available: 100,
    notes: '',
  };
  savingRevenue = false;
  showRevenueForm = false;
  revenueFromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];
  revenueToDate = new Date().toISOString().split('T')[0];

  plReport: PLReport | null = null;
  vatReturn: VATReturn | null = null;
  loadingPL = false;
  loadingVAT = false;
  financialsTab: 'pl' | 'vat' = 'pl';
  plFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  plTo = new Date().toISOString().split('T')[0];
  vatMonth = new Date().getMonth() + 1;
  vatYear = new Date().getFullYear();

  errorMsg = '';
  successMsg = '';

  private api = environment.apiUrl;

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
    this.loadAccounts();
    this.loadPeriods();
  }

  setTab(tab: typeof this.activeTab) {
    // AP Ageing navigates to its own dedicated page
    if (tab === 'apageing') {
      this.router.navigate(['/ap-ageing']);
      return;
    }
    if (tab === 'arageing') {
      this.router.navigate(['/ar-ageing']);
      return;
    }
    this.activeTab = tab;
    this.errorMsg = '';
    this.successMsg = '';
    if (tab === 'mappings' && this.mappings.length === 0) this.loadMappings();
    if (tab === 'invoices') {
      this.loadInvoices();
      this.loadInvoiceCategories();
    }
    if (tab === 'suppliers') {
      this.loadSuppliers();
      this.loadBills();
    }
    if (tab === 'revenue') this.loadDailyRevenue();
    if (tab === 'financials') this.loadPL();
  }

  loadAccounts() {
    this.loadingAccounts = true;
    this.http
      .get<any>(`${this.api}/accounting/accounts`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

  loadPeriods() {
    this.loadingPeriods = true;
    this.http
      .get<any>(`${this.api}/accounting/periods`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.periods = res.data || res || [];
          this.loadingPeriods = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.http
            .get<any>(`${this.api}/payroll/periods`)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
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
    this.http
      .post<any>(`${this.api}/accounting/journal/generate`, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.journal = res.data || res;
          this.generatingJournal = false;
          this.showSuccess('Journal generated!');
          this.cdr.detectChanges();
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

  loadMappings() {
    this.loadingMappings = true;
    this.http
      .get<any>(`${this.api}/accounting/mappings`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

  loadInvoiceCategories() {
    this.http
      .get<any>(`${this.api}/invoices/categories`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.invoiceCategories = res.data || res || [];
          this.cdr.detectChanges();
        },
        error: () => {},
      });
  }

  loadInvoices() {
    this.loadingInvoices = true;
    const params = this.invoiceStatusFilter ? `?status=${this.invoiceStatusFilter}` : '';
    this.http
      .get<any>(`${this.api}/invoices${params}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.invoices = res.data || res || [];
          this.loadingInvoices = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingInvoices = false;
          this.cdr.detectChanges();
        },
      });
  }

  addInvoiceLine() {
    this.newInvoice.lines.push({ description: '', quantity: 1, unit_price: 0, category_id: '' });
  }
  removeInvoiceLine(i: number) {
    if (this.newInvoice.lines.length > 1) this.newInvoice.lines.splice(i, 1);
  }
  calcInvoiceTotal(): number {
    return this.newInvoice.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  }

  saveInvoice() {
    if (!this.newInvoice.guest_name || !this.newInvoice.due_date) {
      this.errorMsg = 'Guest name and due date are required';
      return;
    }
    this.savingInvoice = true;
    this.http
      .post<any>(`${this.api}/invoices`, {
        ...this.newInvoice,
        issue_date: new Date().toISOString().split('T')[0],
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingInvoice = false;
          this.showInvoiceForm = false;
          this.newInvoice = {
            guest_name: '',
            guest_email: '',
            due_date: '',
            notes: '',
            lines: [{ description: '', quantity: 1, unit_price: 0, category_id: '' }],
          };
          this.showSuccess('Invoice created!');
          this.loadInvoices();
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Failed to create invoice';
          this.savingInvoice = false;
          this.cdr.detectChanges();
        },
      });
  }

  startRecordPayment(invoiceId: string) {
    this.recordingPayment = invoiceId;
    this.paymentAmount = 0;
    this.paymentMethod = 'bank_transfer';
  }

  submitPayment() {
    if (!this.recordingPayment || !this.paymentAmount) return;
    this.http
      .post<any>(`${this.api}/invoices/${this.recordingPayment}/payments`, {
        amount: this.paymentAmount,
        payment_method: this.paymentMethod,
        payment_date: new Date().toISOString().split('T')[0],
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.recordingPayment = null;
          this.showSuccess('Payment recorded!');
          this.loadInvoices();
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Failed to record payment';
          this.cdr.detectChanges();
        },
      });
  }

  getInvoiceStatusColor(status: string): string {
    const map: any = {
      draft: '#64748b',
      sent: '#3b82f6',
      paid: '#10b981',
      overdue: '#ef4444',
      partial: '#f59e0b',
      cancelled: '#475569',
    };
    return map[status] || '#64748b';
  }

  loadSuppliers() {
    this.loadingSuppliers = true;
    this.http
      .get<any>(`${this.api}/ap/suppliers`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.suppliers = res.data || res || [];
          this.loadingSuppliers = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingSuppliers = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadBills() {
    this.loadingBills = true;
    this.http
      .get<any>(`${this.api}/ap/bills`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.apBills = res.data || res || [];
          this.loadingBills = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingBills = false;
          this.cdr.detectChanges();
        },
      });
  }

  saveSupplier() {
    if (!this.newSupplier.name) {
      this.errorMsg = 'Supplier name is required';
      return;
    }
    this.savingSupplier = true;
    this.http
      .post<any>(`${this.api}/ap/suppliers`, this.newSupplier)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingSupplier = false;
          this.showSupplierForm = false;
          this.newSupplier = {
            name: '',
            contact_name: '',
            email: '',
            phone: '',
            vat_number: '',
            payment_terms: 30,
          };
          this.showSuccess('Supplier added!');
          this.loadSuppliers();
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Failed to add supplier';
          this.savingSupplier = false;
          this.cdr.detectChanges();
        },
      });
  }

  saveBill() {
    if (!this.newBill.supplier_id || !this.newBill.subtotal) {
      this.errorMsg = 'Supplier and amount are required';
      return;
    }
    this.savingBill = true;
    this.http
      .post<any>(`${this.api}/ap/bills`, this.newBill)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingBill = false;
          this.showBillForm = false;
          this.newBill = {
            supplier_id: '',
            bill_number: '',
            issue_date: '',
            due_date: '',
            subtotal: 0,
            vat_amount: 0,
            category: 'food_beverage',
            description: '',
          };
          this.showSuccess('Bill added!');
          this.loadBills();
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Failed to add bill';
          this.savingBill = false;
          this.cdr.detectChanges();
        },
      });
  }

  startPayBill(bill: APBill) {
    this.payBillModal = bill;
    this.billPaymentAmount = Number(bill.balance_due) || 0;
    this.billPaymentMethod = 'bank_transfer';
    this.billPaymentDate = new Date().toISOString().split('T')[0];
    this.billPaymentRef = '';
  }

  submitBillPayment() {
    if (!this.payBillModal || !this.billPaymentAmount) return;
    this.savingBillPayment = true;
    this.payingBill = this.payBillModal.id;
    this.http
      .patch<any>(`${this.api}/ap/bills/${this.payBillModal.id}/pay`, {
        amount: this.billPaymentAmount,
        payment_method: this.billPaymentMethod,
        payment_date: this.billPaymentDate,
        payment_reference: this.billPaymentRef,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingBillPayment = false;
          this.payingBill = null;
          this.payBillModal = null;
          this.showSuccess('Bill payment recorded — P&L costs updated!');
          this.loadBills();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Failed to pay bill';
          this.savingBillPayment = false;
          this.payingBill = null;
          this.cdr.detectChanges();
        },
      });
  }

  getBillStatusColor(status: string): string {
    const map: any = {
      pending: '#f59e0b',
      paid: '#10b981',
      overdue: '#ef4444',
      partial: '#3b82f6',
      cancelled: '#64748b',
    };
    return map[status] || '#64748b';
  }

  loadDailyRevenue() {
    this.loadingRevenue = true;
    this.http
      .get<any>(`${this.api}/revenue?from=${this.revenueFromDate}&to=${this.revenueToDate}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.dailyRevenue = res.data || res || [];
          this.loadingRevenue = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingRevenue = false;
          this.cdr.detectChanges();
        },
      });
  }

  saveRevenue() {
    this.savingRevenue = true;
    this.http
      .post<any>(`${this.api}/revenue`, this.revenueForm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingRevenue = false;
          this.showRevenueForm = false;
          this.showSuccess('Revenue saved!');
          this.loadDailyRevenue();
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Failed to save revenue';
          this.savingRevenue = false;
          this.cdr.detectChanges();
        },
      });
  }

  get revenueTotals() {
    return {
      room: this.dailyRevenue.reduce((s, r) => s + Number(r.room_revenue || 0), 0),
      fb: this.dailyRevenue.reduce((s, r) => s + Number(r.fb_revenue || 0), 0),
      other: this.dailyRevenue.reduce((s, r) => s + Number(r.other_revenue || 0), 0),
      total: this.dailyRevenue.reduce((s, r) => s + Number(r.total_revenue || 0), 0),
    };
  }

  loadPL() {
    this.loadingPL = true;
    this.http
      .get<any>(`${this.api}/accounting/pl?from=${this.plFrom}&to=${this.plTo}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.plReport = res.data || res;
          this.loadingPL = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingPL = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadVAT() {
    this.loadingVAT = true;
    this.http
      .get<any>(`${this.api}/accounting/vat-return?month=${this.vatMonth}&year=${this.vatYear}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.vatReturn = res.data || res;
          this.loadingVAT = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingVAT = false;
          this.cdr.detectChanges();
        },
      });
  }

  setFinancialsTab(t: 'pl' | 'vat') {
    this.financialsTab = t;
    if (t === 'pl') this.loadPL();
    if (t === 'vat') {
      this.loadVAT();
      this.checkPeriodStatus();
    }
  }

  closePeriod() {
    if (
      !confirm(
        `Close ${this.monthName(this.vatMonth)} ${this.vatYear}?\n\n` +
          `This will:\n• Lock all revenue entries for the month\n` +
          `• Snapshot P&L and VAT figures\n• Post VAT liability to GL\n\n` +
          `This cannot be undone.`
      )
    )
      return;

    this.closingPeriod = true;
    this.http
      .post<any>(`${this.api}/accounting/close-period`, {
        month: this.vatMonth,
        year: this.vatYear,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.closingPeriod = false;
          this.periodClosed = res.summary;
          this.showSuccess(
            `${this.monthName(this.vatMonth)} ${this.vatYear} closed! ` +
              `VAT payable: ${this.formatMoney(res.summary.vat_payable)}`
          );
          this.loadVAT();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.closingPeriod = false;
          this.errorMsg = err.error?.error || 'Failed to close period';
          this.cdr.detectChanges();
        },
      });
  }

  checkPeriodStatus() {
    this.periodClosed = null;
    this.http
      .get<any>(`${this.api}/accounting/period-status?month=${this.vatMonth}&year=${this.vatYear}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.status === 'closed') this.periodClosed = res;
          this.cdr.detectChanges();
        },
        error: () => {},
      });
  }

  showSuccess(msg: string) {
    this.successMsg = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMsg = '';
      this.cdr.detectChanges();
    }, 3000);
  }

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
  monthName(m: number): string {
    return (
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] ||
      ''
    );
  }
  Number = Number;
  Math = Math;
}
