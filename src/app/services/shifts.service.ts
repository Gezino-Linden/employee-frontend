// File: src/app/services/shifts.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

export interface AssignShiftDto {
  employee_id: string | number;
  shift_template_id: string | number;
  shift_date: string;
  notes: string;
  repeat: string;
  repeat_weeks: number;
}

export interface CreateTemplateDto {
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  color: string;
  department: string;
  is_night_shift: boolean;
  base_rate_multiplier: number;
  min_staff: number;
  max_staff: number;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class ShiftsService {
  private base = `${environment.apiUrl}/shifts`;

  constructor(private http: HttpClient) {}

  // ── TEMPLATES ─────────────────────────────────────────────
  getTemplates(): Observable<{ templates?: ShiftTemplate[]; data?: ShiftTemplate[] }> {
    return this.http.get<any>(`${this.base}/templates`);
  }

  createTemplate(data: CreateTemplateDto): Observable<{ template: ShiftTemplate }> {
    return this.http.post<any>(`${this.base}/templates`, data);
  }

  deleteTemplate(id: number): Observable<any> {
    return this.http.delete(`${this.base}/templates/${id}`);
  }

  // ── SHIFT ASSIGNMENTS ─────────────────────────────────────
  getShifts(filters: { date?: string; start?: string; end?: string } = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.date) params = params.set('date', filters.date);
    if (filters.start) params = params.set('start', filters.start);
    if (filters.end) params = params.set('end', filters.end);
    return this.http.get<any>(`${this.base}`, { params });
  }

  assignShift(data: AssignShiftDto): Observable<any> {
    return this.http.post<any>(`${this.base}/assign`, data);
  }

  deleteShift(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }

  // ── SWAP REQUESTS ─────────────────────────────────────────
  getSwapRequests(): Observable<any> {
    return this.http.get<any>(`${this.base}/swaps`);
  }

  approveSwap(id: number): Observable<any> {
    return this.http.put<any>(`${this.base}/swaps/${id}/approve`, {});
  }

  rejectSwap(id: number): Observable<any> {
    return this.http.put<any>(`${this.base}/swaps/${id}/reject`, {});
  }
}
