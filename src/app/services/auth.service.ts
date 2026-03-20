import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

type LoginRequest = { email: string; password: string };
type LoginResponse = { user: { id: number; name: string; email: string; role: string; company_id: number | null; plan?: string; } };

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
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, data, { withCredentials: true })
      .pipe(tap(() => localStorage.setItem('loggedIn', '1')));
  }

  refresh() {
    return this.http.post<{ expiresIn: string }>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true });
  }

  getMe() {
    return this.http.get<MeResponse>(`${this.baseUrl}/me`, { withCredentials: true });
  }

  logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return this.http.post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true });
  }

  isLoggedIn() {
    return !!localStorage.getItem('loggedIn') || !!localStorage.getItem('token');
  }
}
