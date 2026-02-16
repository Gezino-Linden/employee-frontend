import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private baseUrl = 'https://employee-api-xpno.onrender.com/api'; // ✅ Added /api

  constructor(private http: HttpClient) {}

  list(page: number = 1, limit: number = 10) {
    const params = new HttpParams().set('page', page).set('limit', limit);

    return this.http.get<any>(`${this.baseUrl}/employees`, { params });
  }
}
