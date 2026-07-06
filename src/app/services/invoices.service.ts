import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private base = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getInvoices(filters?: { status?: string; from?: string; to?: string }): Observable<any> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    return this.http.get<any>(this.base, { headers: this.headers(), params });
  }

  getInvoice(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`, { headers: this.headers() });
  }

  createInvoice(data: any): Observable<any> {
    return this.http.post<any>(this.base, data, { headers: this.headers() });
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.patch<any>(
      `${this.base}/${id}/status`,
      { status },
      { headers: this.headers() }
    );
  }

  recordPayment(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/payments`, data, { headers: this.headers() });
  }

  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.base}/summary`, { headers: this.headers() });
  }

  getCategories(): Observable<any> {
    return this.http.get<any>(`${this.base}/categories`, { headers: this.headers() });
  }
}
