// File: src/app/services/attendance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AttendanceRecord {
  id: number;
  company_id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_break_minutes: number;
  total_hours: number;
  overtime_hours: number;
  late_minutes: number;
  early_departure_minutes: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'not_clocked_in';
  expected_start: string;
  expected_end: string;
  expected_hours: number;
  hourly_rate: number;
  daily_pay: number;
  overtime_pay: number;
  notes: string;
}

export interface AttendanceSummary {
  total_records: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  currently_clocked_in: number;
  total_hours_worked: number;
  total_overtime_hours: number;
  total_daily_cost: number;
  total_overtime_cost: number;
}

export interface MonthlyReport {
  employee_id: number;
  first_name: string;
  last_name: string;
  department: string;
  days_recorded: number;
  days_present: number;
  days_absent: number;
  days_late: number;
  days_half: number;
  total_hours: number;
  total_overtime: number;
  total_break_minutes: number;
  total_pay: number;
  total_overtime_pay: number;
  avg_late_minutes: number;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private baseUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  getTodayStatus(employeeId?: number): Observable<AttendanceRecord> {
    let params = new HttpParams();
    if (employeeId) params = params.set('employee_id', employeeId.toString());
    return this.http.get<AttendanceRecord>(`${this.baseUrl}/today`, { params });
  }

  clockIn(employeeId?: number): Observable<AttendanceRecord> {
    const body: any = {};
    if (employeeId) body.employee_id = employeeId;
    return this.http.post<AttendanceRecord>(`${this.baseUrl}/clock-in`, body);
  }

  startBreak(employeeId?: number): Observable<AttendanceRecord> {
    const body: any = {};
    if (employeeId) body.employee_id = employeeId;
    return this.http.post<AttendanceRecord>(`${this.baseUrl}/break-start`, body);
  }

  endBreak(employeeId?: number): Observable<AttendanceRecord> {
    const body: any = {};
    if (employeeId) body.employee_id = employeeId;
    return this.http.post<AttendanceRecord>(`${this.baseUrl}/break-end`, body);
  }

  clockOut(employeeId?: number): Observable<AttendanceRecord> {
    const body: any = {};
    if (employeeId) body.employee_id = employeeId;
    return this.http.post<AttendanceRecord>(`${this.baseUrl}/clock-out`, body);
  }

  getRecords(filters: {
    date?: string;
    start_date?: string;
    end_date?: string;
    employee_id?: number;
    status?: string;
    page?: number;
    per_page?: number;
  }): Observable<AttendanceRecord[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null) params = params.set(key, val.toString());
    });
    return this.http.get<AttendanceRecord[]>(`${this.baseUrl}/records`, { params });
  }

  getSummary(date?: string): Observable<AttendanceSummary> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<AttendanceSummary>(`${this.baseUrl}/summary`, { params });
  }

  getMonthlyReport(month: number, year: number, employeeId?: number): Observable<MonthlyReport[]> {
    let params = new HttpParams().set('month', month.toString()).set('year', year.toString());
    if (employeeId) params = params.set('employee_id', employeeId.toString());
    return this.http.get<MonthlyReport[]>(`${this.baseUrl}/monthly-report`, { params });
  }

  adminOverride(data: {
    employee_id: number;
    date: string;
    clock_in?: string;
    clock_out?: string;
    status?: string;
    notes?: string;
  }): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.baseUrl}/override`, data);
  }
}
