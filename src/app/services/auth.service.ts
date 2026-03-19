import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

type LoginRequest = { email: string; password: string };
type LoginResponse = { token: string; refreshToken: string };

export type MeResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id: number | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(data: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, data)
      .pipe(tap((res) => {
        localStorage.setItem('token', res.token);
        if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
      }));
  }

  refresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http
      .post<{ token: string }>(`${this.baseUrl}/auth/refresh`, { refreshToken })
      .pipe(tap((res) => localStorage.setItem('token', res.token)));
  }

  getMe() {
    return this.http.get<MeResponse>(`${this.baseUrl}/me`);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }
}
