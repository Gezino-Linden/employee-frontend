// File: src/app/pages/employee-login/employee-login.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

const API = 'https://employee-api-xpno.onrender.com/api';

@Component({
  selector: 'app-employee-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employee-login.html',
  styleUrls: ['./employee-login.css'],
})
export class EmployeeLoginComponent {
  email = '';
  password = '';
  showPass = false;
  loading = false;
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

  login(): void {
    this.error = '';
    if (!this.email || !this.password) { this.error = 'Please enter your email and password'; return; }
    this.loading = true;
    this.http.post<any>(`${API}/employee-auth/login`, { email: this.email, password: this.password }).subscribe({
      next: (res) => {
        localStorage.setItem('employee_token', res.token);
        localStorage.setItem('employee', JSON.stringify(res.employee));
        this.router.navigateByUrl('/employee-portal');
      },
      error: (e) => {
        this.error = e.error?.error || 'Login failed. Please try again.';
        this.loading = false;
      },
    });
  }
}
