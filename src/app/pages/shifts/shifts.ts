// File: src/app/pages/shifts/shifts.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';

export interface ShiftTemplate {
  id: number;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  duration_hours: string;
  color: string;
  department: string;
  department_id: number | null;
  base_rate_multiplier: string;
  is_night_shift: boolean;
  notes: string | null;
  min_staff: number;
  max_staff: number;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  department: string;
  position: string;
}

export interface EmployeeShift {
  id: number;
  employee_id: number;
  employee_name: string;
  shift_template_id: number;
  shift_name: string;
  shift_date: string;
  status: string;
  color: string;
  start_time: string;
  end_time: string;
  notes: string | null;
}

export interface SwapRequest {
  id: number;
  requester_name: string;
  target_name: string;
  requester_shift_date: string;
  target_shift_date: string;
  status: string;
  reason: string;
  created_at: string;
}

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shifts.html',
  styleUrls: ['./shifts.css'],
})
export class Shifts implements OnInit {
  me: MeResponse | null = null;
  activeTab: 'templates' | 'assign' | 'calendar' | 'swaps' = 'templates';

  // Templates
  templates: ShiftTemplate[] = [];
  loadingTemplates = false;
  showCreateTemplate = false;
  newTemplate = {
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
  templateLoading = false;

  // Assign
  employees: Employee[] = [];
  shifts: EmployeeShift[] = [];
  loadingShifts = false;
  assignForm = {
    employee_id: '',
    shift_template_id: '',
    shift_date: '',
    notes: '',
    repeat: 'none',
    repeat_weeks: 1,
  };
  assignLoading = false;
  filterDate = new Date().toISOString().split('T')[0];

  // Calendar
  calendarWeekStart: Date = this.getMonday(new Date());
  calendarShifts: EmployeeShift[] = [];
  calendarDays: Date[] = [];
  loadingCalendar = false;

  // Swaps
  swapRequests: SwapRequest[] = [];
  loadingSwaps = false;

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
    this.buildCalendarDays();
    this.loadTemplates();
    this.loadEmployees();
  }

  // ── TAB SWITCH ──────────────────────────────────────
  setTab(tab: 'templates' | 'assign' | 'calendar' | 'swaps') {
    this.activeTab = tab;
    this.errorMsg = '';
    this.successMsg = '';
    if (tab === 'assign') this.loadShifts();
    if (tab === 'calendar') this.loadCalendarShifts();
    if (tab === 'swaps') this.loadSwapRequests();
  }

  // ── TEMPLATES ────────────────────────────────────────
  loadTemplates() {
    this.loadingTemplates = true;
    this.http.get<any>(`${this.api}/shifts/templates`).subscribe({
      next: (res) => {
        this.templates = res.templates || res.data || res || [];
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
    this.templateLoading = true;
    this.errorMsg = '';
    this.http.post<any>(`${this.api}/shifts/templates`, this.newTemplate).subscribe({
      next: (res) => {
        this.templates.unshift(res.template || res);
        this.showCreateTemplate = false;
        this.templateLoading = false;
        this.successMsg = 'Shift template created!';
        this.resetNewTemplate();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMsg = '';
          this.cdr.detectChanges();
        }, 3000);
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
    this.http.delete<any>(`${this.api}/shifts/templates/${id}`).subscribe({
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

  // ── ASSIGN SHIFTS ────────────────────────────────────
  loadEmployees() {
    this.http.get<any>(`${this.api}/employees`).subscribe({
      next: (res) => {
        this.employees = res.data || res || [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadShifts() {
    this.loadingShifts = true;
    this.http.get<any>(`${this.api}/shifts?date=${this.filterDate}`).subscribe({
      next: (res) => {
        this.shifts = res.shifts || res.data || res || [];
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
    this.assignLoading = true;
    this.errorMsg = '';
    this.http.post<any>(`${this.api}/shifts/assign`, this.assignForm).subscribe({
      next: () => {
        this.assignLoading = false;
        this.successMsg = 'Shift assigned successfully!';
        this.assignForm = {
          employee_id: '',
          shift_template_id: '',
          shift_date: '',
          notes: '',
          repeat: 'none',
          repeat_weeks: 1,
        };
        this.loadShifts();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMsg = '';
          this.cdr.detectChanges();
        }, 3000);
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
    this.http.delete<any>(`${this.api}/shifts/${id}`).subscribe({
      next: () => {
        this.shifts = this.shifts.filter((s) => s.id !== id);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  // ── CALENDAR ─────────────────────────────────────────
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
    const end = this.calendarDays[6].toISOString().split('T')[0];
    this.http.get<any>(`${this.api}/shifts?start=${start}&end=${end}`).subscribe({
      next: (res) => {
        this.calendarShifts = res.shifts || res.data || res || [];
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
    return `${this.calendarWeekStart.toLocaleDateString('en-ZA', opts)} – ${end.toLocaleDateString(
      'en-ZA',
      opts
    )}`;
  }

  isToday(day: Date): boolean {
    const today = new Date();
    return day.toDateString() === today.toDateString();
  }

  // ── SWAP REQUESTS ─────────────────────────────────────
  loadSwapRequests() {
    this.loadingSwaps = true;
    this.http.get<any>(`${this.api}/shifts/swaps`).subscribe({
      next: (res) => {
        this.swapRequests = res.swaps || res.data || res || [];
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
    this.http.put<any>(`${this.api}/shifts/swaps/${id}/approve`, {}).subscribe({
      next: () => {
        const swap = this.swapRequests.find((s) => s.id === id);
        if (swap) swap.status = 'approved';
        this.successMsg = 'Swap approved!';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMsg = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: () => {},
    });
  }

  rejectSwap(id: number) {
    this.http.put<any>(`${this.api}/shifts/swaps/${id}/reject`, {}).subscribe({
      next: () => {
        const swap = this.swapRequests.find((s) => s.id === id);
        if (swap) swap.status = 'rejected';
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  // ── HELPERS ───────────────────────────────────────────
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

  dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
