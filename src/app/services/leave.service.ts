// File: src/app/services/leave.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type LeaveType = {
  id: number;
  name: string;
  description: string;
  default_days_per_year: number;
  is_paid: boolean;
  requires_approval: boolean;
  is_active: boolean;
};

export type LeaveBalance = {
  id: number;
  employee_id: number;
  leave_type_id: number;
  leave_type: string;
  is_paid: boolean;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
};

export type LeaveRequest = {
  id: number;
  employee_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  leave_type_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by?: number;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
};

export type CreateLeaveRequestDto = {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
};

export type LeaveRequestsResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: LeaveRequest[];
};

@Injectable({ providedIn: 'root' })
export class LeaveService {
  // FIXED: Removed space at the end
  private baseUrl = 'https://employee-api-xpno.onrender.com/api/leave';

  constructor(private http: HttpClient) {}

  // ===== LEAVE TYPES =====
  getLeaveTypes(): Observable<LeaveType[]> {
    return this.http.get<LeaveType[]>(`${this.baseUrl}/types`);
  }

  // ===== LEAVE BALANCES =====
  getMyBalances(year?: number): Observable<LeaveBalance[]> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    return this.http.get<LeaveBalance[]>(`${this.baseUrl}/balances`, { params });
  }

  getEmployeeBalances(employeeId: number, year?: number): Observable<LeaveBalance[]> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    return this.http.get<LeaveBalance[]>(`${this.baseUrl}/balances/${employeeId}`, { params });
  }

  // ===== LEAVE REQUESTS =====
  getMyRequests(status?: string): Observable<LeaveRequest[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<LeaveRequest[]>(`${this.baseUrl}/requests/my`, { params });
  }

  getAllRequests(page = 1, limit = 20, status?: string): Observable<LeaveRequestsResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<LeaveRequestsResponse>(`${this.baseUrl}/requests`, { params });
  }

  getRequestById(id: number): Observable<LeaveRequest> {
    return this.http.get<LeaveRequest>(`${this.baseUrl}/requests/${id}`);
  }

  createRequest(data: CreateLeaveRequestDto): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(`${this.baseUrl}/requests`, data);
  }

  cancelRequest(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/requests/${id}/cancel`, {});
  }

  approveRequest(id: number, notes?: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/requests/${id}/approve`, { notes });
  }

  rejectRequest(id: number, notes?: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/requests/${id}/reject`, { notes });
  }

  // ===== CALENDAR & TEAM =====
  getLeaveCalendar(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<any[]>(`${this.baseUrl}/calendar`, { params });
  }

  getTeamLeaves(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/team`);
  }

  // ===== ANALYTICS =====
  // FIXED: Use baseUrl instead of hardcoded path
  getAnalytics(year: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics?year=${year}`);
  }
}

// Move this to a separate file: src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://employee-api-xpno.onrender.com/api',
};
