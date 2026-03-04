// File: src/app/pages/shifts/shifts.ts
import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, MeResponse } from '../../services/auth.service';
import {
  ShiftsService,
  ShiftTemplate,
  EmployeeShift,
  SwapRequest,
  CreateTemplateDto,
} from '../../services/shifts.service';
import { EmployeesService, Employee } from '../../services/employees.service';

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shifts.html',
  styleUrls: ['./shifts.css'],
})
export class Shifts implements OnInit {
  private destroyRef = inject(DestroyRef);

  me: MeResponse | null = null;
  activeTab: 'templates' | 'assign' | 'calendar' | 'swaps' = 'templates';

  // ── Templates ─────────────────────────────────────────────
  templates: ShiftTemplate[] = [];
  loadingTemplates = false;
  showCreateTemplate = false;
  templateLoading = false;
  newTemplate: CreateTemplateDto = {
    name: '',
    code: '',
    start_time: '08:00',
    end_time: '16:00',
    color: '#8b5cf6',
    department: '',
    is_night_shift: false,
    base_rate_multiplier: 1.0,
    min_staff: 1,
    max_staff: 10,
    notes: '',
  };

  // ── Assign ────────────────────────────────────────────────
  employees: Employee[] = [];
  shifts: EmployeeShift[] = [];
  loadingShifts = false;
  assignLoading = false;
  filterDate = new Date().toISOString().split('T')[0];
  assignForm = {
    employee_id: '',
    shift_template_id: '',
    shift_date: '',
    notes: '',
    repeat: 'none',
    repeat_weeks: 1,
  };

  // ── Calendar ──────────────────────────────────────────────
  calendarWeekStart: Date = this.getMonday(new Date());
  calendarShifts: EmployeeShift[] = [];
  calendarDays: Date[] = [];
  loadingCalendar = false;
  dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // ── Swaps ─────────────────────────────────────────────────
  swapRequests: SwapRequest[] = [];
  loadingSwaps = false;

  errorMsg = '';
  successMsg = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private shiftsService: ShiftsService,
    private employeesService: EmployeesService,
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
    this.buildCalendarDays();
    this.loadTemplates();
    this.loadEmployees();
  }

  // ── TAB ───────────────────────────────────────────────────
  setTab(tab: 'templates' | 'assign' | 'calendar' | 'swaps') {
    this.activeTab = tab;
    this.errorMsg = '';
    this.successMsg = '';
    if (tab === 'assign') this.loadShifts();
    if (tab === 'calendar') this.loadCalendarShifts();
    if (tab === 'swaps') this.loadSwapRequests();
  }

  // ── TEMPLATES ─────────────────────────────────────────────
  loadTemplates() {
    this.loadingTemplates = true;
    this.shiftsService
      .getTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.templates = res.templates || res.data || [];
          this.loadingTemplates = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingTemplates = false;
          this.cdr.detectChanges();
        },
      });
  }

  createTemplate() {
    if (!this.newTemplate.name || !this.newTemplate.code) {
      this.errorMsg = 'Name and code are required';
      return;
    }
    this.templateLoading = true;
    this.errorMsg = '';
    this.shiftsService
      .createTemplate(this.newTemplate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.templates.unshift(res.template || (res as any));
          this.showCreateTemplate = false;
          this.templateLoading = false;
          this.showSuccess('Shift template created!');
          this.resetNewTemplate();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err.error?.details || 'Failed to create template';
          this.templateLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  deleteTemplate(id: number) {
    if (!confirm('Delete this shift template?')) return;
    this.shiftsService
      .deleteTemplate(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.templates = this.templates.filter((t) => t.id !== id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'Delete failed';
          this.cdr.detectChanges();
        },
      });
  }

  resetNewTemplate() {
    this.newTemplate = {
      name: '',
      code: '',
      start_time: '08:00',
      end_time: '16:00',
      color: '#8b5cf6',
      department: '',
      is_night_shift: false,
      base_rate_multiplier: 1.0,
      min_staff: 1,
      max_staff: 10,
      notes: '',
    };
  }

  // ── EMPLOYEES ─────────────────────────────────────────────
  loadEmployees() {
    this.employeesService
      .list(1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.employees = res.data || [];
          this.cdr.detectChanges();
        },
        error: () => {},
      });
  }

  // ── ASSIGN SHIFTS ─────────────────────────────────────────
  loadShifts() {
    this.loadingShifts = true;
    this.shiftsService
      .getShifts({ date: this.filterDate })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.shifts = res.shifts || res.data || [];
          this.loadingShifts = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingShifts = false;
          this.cdr.detectChanges();
        },
      });
  }

  assignShift() {
    if (
      !this.assignForm.employee_id ||
      !this.assignForm.shift_template_id ||
      !this.assignForm.shift_date
    ) {
      this.errorMsg = 'Employee, shift template and date are required';
      return;
    }
    this.assignLoading = true;
    this.errorMsg = '';
    this.shiftsService
      .assignShift(this.assignForm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assignLoading = false;
          this.showSuccess('Shift assigned successfully!');
          this.assignForm = {
            employee_id: '',
            shift_template_id: '',
            shift_date: '',
            notes: '',
            repeat: 'none',
            repeat_weeks: 1,
          };
          this.loadShifts();
        },
        error: (err) => {
          this.errorMsg = err.error?.details || 'Failed to assign shift';
          this.assignLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  deleteShift(id: number) {
    if (!confirm('Remove this shift assignment?')) return;
    this.shiftsService
      .deleteShift(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.shifts = this.shifts.filter((s) => s.id !== id);
          this.cdr.detectChanges();
        },
        error: () => {},
      });
  }

  // ── CALENDAR ──────────────────────────────────────────────
  getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  buildCalendarDays() {
    this.calendarDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.calendarWeekStart);
      d.setDate(d.getDate() + i);
      this.calendarDays.push(d);
    }
  }

  prevWeek() {
    this.calendarWeekStart.setDate(this.calendarWeekStart.getDate() - 7);
    this.calendarWeekStart = new Date(this.calendarWeekStart);
    this.buildCalendarDays();
    this.loadCalendarShifts();
  }

  nextWeek() {
    this.calendarWeekStart.setDate(this.calendarWeekStart.getDate() + 7);
    this.calendarWeekStart = new Date(this.calendarWeekStart);
    this.buildCalendarDays();
    this.loadCalendarShifts();
  }

  loadCalendarShifts() {
    this.loadingCalendar = true;
    const start = this.calendarWeekStart.toISOString().split('T')[0];
    const end = this.calendarDays[6]?.toISOString().split('T')[0];
    this.shiftsService
      .getShifts({ start, end })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.calendarShifts = res.shifts || res.data || [];
          this.loadingCalendar = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingCalendar = false;
          this.cdr.detectChanges();
        },
      });
  }

  getShiftsForDay(day: Date): EmployeeShift[] {
    const dateStr = day.toISOString().split('T')[0];
    return this.calendarShifts.filter((s) => s.shift_date?.startsWith(dateStr));
  }

  getWeekLabel(): string {
    const end = this.calendarDays[6];
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${this.calendarWeekStart.toLocaleDateString('en-ZA', opts)} – ${end?.toLocaleDateString(
      'en-ZA',
      opts
    )}`;
  }

  isToday(day: Date): boolean {
    return day.toDateString() === new Date().toDateString();
  }

  // ── SWAPS ─────────────────────────────────────────────────
  loadSwapRequests() {
    this.loadingSwaps = true;
    this.shiftsService
      .getSwapRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.swapRequests = res.swaps || res.data || [];
          this.loadingSwaps = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingSwaps = false;
          this.cdr.detectChanges();
        },
      });
  }

  approveSwap(id: number) {
    this.shiftsService
      .approveSwap(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const swap = this.swapRequests.find((s) => s.id === id);
          if (swap) swap.status = 'approved';
          this.showSuccess('Swap approved!');
        },
        error: () => {},
      });
  }

  rejectSwap(id: number) {
    this.shiftsService
      .rejectSwap(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const swap = this.swapRequests.find((s) => s.id === id);
          if (swap) swap.status = 'rejected';
          this.cdr.detectChanges();
        },
        error: () => {},
      });
  }

  // ── HELPERS ───────────────────────────────────────────────
  showSuccess(msg: string) {
    this.successMsg = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMsg = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  formatTime(t: string): string {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  getStatusClass(status: string): string {
    const map: any = {
      scheduled: 'badge-blue',
      completed: 'badge-green',
      cancelled: 'badge-red',
      pending: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red',
    };
    return map[status] || 'badge-gray';
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
