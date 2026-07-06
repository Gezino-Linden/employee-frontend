import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApService {
  private base = `${environment.apiUrl}/ap`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Suppliers
  getSuppliers(): Observable<any> {
    return this.http.get<any>(`${this.base}/suppliers`, { headers: this.headers() });
  }

  createSupplier(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/suppliers`, data, { headers: this.headers() });
  }

  updateSupplier(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/suppliers/${id}`, data, { headers: this.headers() });
  }

  // Bills
  getBills(filters?: { status?: string; supplier_id?: number }): Observable<any> {
    let url = `${this.base}/bills`;
    const q: string[] = [];
    if (filters?.status) q.push(`status=${filters.status}`);
    if (filters?.supplier_id) q.push(`supplier_id=${filters.supplier_id}`);
    if (q.length) url += '?' + q.join('&');
    return this.http.get<any>(url, { headers: this.headers() });
  }

  createBill(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/bills`, data, { headers: this.headers() });
  }

  payBill(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/bills/${id}/pay`, data, { headers: this.headers() });
  }

  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.base}/summary`, { headers: this.headers() });
  }
}
