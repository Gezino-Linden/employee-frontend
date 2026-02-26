// File: src/app/services/payroll.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ===== INTERFACES =====
export interface PayrollRecord {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  bonuses: number;
  overtime: number;
  gross_pay: number;
  tax: number;
  uif: number;
  pension: number;
  medical_aid: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  status: 'draft' | 'processed' | 'paid';
  payment_method?: string;
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollSummary {
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  tax: number; 
  paid_count: number;
  processed_count: number;
  draft_count: number;
}

export interface ProcessPayrollDto {
  employee_ids: number[];
  month: number;
  year: number;
}

export interface MarkAsPaidDto {
  payment_method: string;
  payment_date: string;
  payment_reference?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PayrollService {
  private baseUrl = `${environment.apiUrl}/payroll`;

  constructor(private http: HttpClient) {}

  // Get payroll summary for a period
  getPayrollSummary(month: string, year: number): Observable<PayrollSummary> {
    const params = new HttpParams().set('month', month).set('year', year.toString());
    return this.http.get<PayrollSummary>(`${this.baseUrl}/summary`, { params });
  }

  // Get all payroll records for a period
  getPayrollRecords(month: string, year: number, status?: string): Observable<PayrollRecord[]> {
    let params = new HttpParams().set('month', month).set('year', year.toString());
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<PayrollRecord[]>(`${this.baseUrl}/records`, { params });
  }

  // Initialize payroll period
  initializePayrollPeriod(month: number, year: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/initialize`, { month, year });
  }

  // Update payroll record
  updatePayrollRecord(id: number, data: Partial<PayrollRecord>): Observable<PayrollRecord> {
    return this.http.patch<PayrollRecord>(`${this.baseUrl}/records/${id}`, data);
  }

  // Process payroll for selected employees
  processPayroll(employee_ids: number[], period: { month: number; year: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/process`, {
      employee_ids,
      month: period.month,
      year: period.year,
    });
  }

  // Mark payroll as paid
  markAsPaid(id: number, paymentDetails: MarkAsPaidDto): Observable<PayrollRecord> {
    return this.http.patch<PayrollRecord>(`${this.baseUrl}/records/${id}/pay`, paymentDetails);
  }

  // Generate payslip (download)
  generatePayslip(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/payslip/${id}`, { responseType: 'blob' });
  }

  // Get payroll history
  getPayrollHistory(employeeId?: number, limit: number = 12): Observable<any[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (employeeId) {
      params = params.set('employee_id', employeeId.toString());
    }
    return this.http.get<any[]>(`${this.baseUrl}/history`, { params });
  }
}
