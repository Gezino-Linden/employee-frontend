// File: src/app/services/analytics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardOverview {
  employees: {
    total_employees: number;
    active_employees: number;
    inactive_employees: number;
  };
  payroll: {
    total_gross: string;
    total_net: string;
    total_deductions: string;
    total_tax: string;
    processed_count: number;
  };
  leave: {
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    total_days_taken: string;
  };
  attendance: {
    unique_employees: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    avg_hours_worked: string;
  };
  compliance: {
    total_declarations: number;
    pending_payments: number;
    pending_submissions: number;
    outstanding_amount: string;
  };
}

export interface PayrollAnalytics {
  monthlyTrend: Array<{
    month: number;
    employee_count: number;
    total_gross: string;
    total_net: string;
    total_tax: string;
    total_deductions: string;
  }>;
  departmentBreakdown: Array<{
    department: string;
    employee_count: number;
    total_gross: string;
    total_net: string;
    avg_salary: string;
  }>;
  positionBreakdown: Array<{
    position: string;
    employee_count: number;
    avg_salary: string;
    min_salary: string;
    max_salary: string;
  }>;
  costBreakdown: {
    basic_salary: string;
    allowances: string;
    bonuses: string;
    overtime: string;
    tax: string;
    uif: string;
    pension: string;
    medical_aid: string;
  };
}

export interface LeaveAnalytics {
  leaveTypes: Array<{
    leave_type: string;
    request_count: number;
    total_days: string;
    approved_count: number;
    rejected_count: number;
  }>;
  monthlyLeave: Array<{
    month: number;
    request_count: number;
    total_days: string;
    approved_count: number;
  }>;
  departmentLeave: Array<{
    department: string;
    request_count: number;
    total_days: string;
    unique_employees: number;
  }>;
  approvalStats: {
    total_requests: number;
    approved: number;
    rejected: number;
    pending: number;
    approval_rate: string;
  };
}

export interface AttendanceAnalytics {
  dailyAttendance: Array<{
    date: string;
    total_records: number;
    present: number;
    late: number;
    absent: number;
    avg_hours: string;
  }>;
  departmentAttendance: Array<{
    department: string;
    total_records: number;
    present_count: number;
    late_count: number;
    attendance_rate: string;
  }>;
  overtimeStats: {
    total_overtime_hours: string;
    total_overtime_pay: string;
    avg_overtime_per_employee: string;
    employees_with_overtime: number;
  };
  lateArrivals: Array<{
    date: string;
    late_count: number;
    avg_late_minutes: string;
  }>;
}

export interface ComplianceAnalytics {
  emp201Stats: Array<{
    month: string;
    total_liability: string;
    payment_status: string;
    submission_status: string;
    period_end_date: string;
    payment_date: string;
  }>;
  outstanding: {
    total_outstanding: string;
    overdue_count: number;
    pending_count: number;
  };
  submissionTimeline: Array<{
    month: string;
    submission_status: string;
    submission_date: string;
    payment_status: string;
    payment_date: string;
    total_liability: string;
  }>;
}

export interface HRInsights {
  headcount: Array<{
    department: string;
    count: number;
    active_count: number;
  }>;
  genderDistribution: Array<{
    gender: string;
    count: number;
  }>;
  ageDistribution: Array<{
    age_group: string;
    count: number;
  }>;
  salaryStats: {
    avg_salary: string;
    min_salary: string;
    max_salary: string;
    median_salary: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private baseUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  // Get main dashboard overview
  getDashboardOverview(year: number, month: number): Observable<DashboardOverview> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get<DashboardOverview>(`${this.baseUrl}/dashboard`, { params });
  }

  // Get payroll analytics
  getPayrollAnalytics(year: number): Observable<PayrollAnalytics> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<PayrollAnalytics>(`${this.baseUrl}/payroll`, { params });
  }

  // Get leave analytics
  getLeaveAnalytics(year: number): Observable<LeaveAnalytics> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<LeaveAnalytics>(`${this.baseUrl}/leave`, { params });
  }

  // Get attendance analytics
  getAttendanceAnalytics(year: number, month: number): Observable<AttendanceAnalytics> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get<AttendanceAnalytics>(`${this.baseUrl}/attendance`, { params });
  }

  // Get compliance analytics
  getComplianceAnalytics(year: number): Observable<ComplianceAnalytics> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<ComplianceAnalytics>(`${this.baseUrl}/compliance`, { params });
  }

  // Get HR insights
  getHRInsights(): Observable<HRInsights> {
    return this.http.get<HRInsights>(`${this.baseUrl}/hr-insights`);
  }

  // Export report (placeholder)
  exportReport(
    reportType: string,
    year: number,
    month?: number,
    format: string = 'json'
  ): Observable<any> {
    let params = new HttpParams()
      .set('reportType', reportType)
      .set('year', year.toString())
      .set('format', format);

    if (month) {
      params = params.set('month', month.toString());
    }

    return this.http.get(`${this.baseUrl}/export`, { params });
  }
}
