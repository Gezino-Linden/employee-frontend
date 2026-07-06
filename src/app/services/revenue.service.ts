import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RevenueService {
  private base = `${environment.apiUrl}/revenue`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getRevenue(filters?: { from?: string; to?: string; property_id?: number }): Observable<any> {
    let params = new HttpParams();
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    if (filters?.property_id) params = params.set('property_id', String(filters.property_id));
    return this.http.get<any>(this.base, { headers: this.headers(), params });
  }

  getSummary(filters?: { from?: string; to?: string }): Observable<any> {
    let params = new HttpParams();
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    return this.http.get<any>(`${this.base}/summary`, { headers: this.headers(), params });
  }

  upsertRevenue(data: {
    revenue_date: string;
    rooms_revenue?: number;
    fb_revenue?: number;
    spa_revenue?: number;
    events_revenue?: number;
    other_revenue?: number;
    rooms_available?: number;
    rooms_occupied?: number;
    notes?: string;
    status?: string;
  }): Observable<any> {
    return this.http.post<any>(this.base, data, { headers: this.headers() });
  }
}
