import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

type LoginRequest = { email: string; password: string };
type LoginResponse = { token: string };

export type MeResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id: number | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'https://employee-api-xpno.onrender.com/api'; // ✅ Added /api

  constructor(private http: HttpClient) {}

  login(data: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, data)
      .pipe(tap((res) => localStorage.setItem('token', res.token)));
  }

  getMe() {
    return this.http.get<MeResponse>(`${this.baseUrl}/me`);
  }

  logout() {
    localStorage.removeItem('token');
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }
}
