// File: src/app/pages/forgot-password/forgot-password.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

const API = 'https://employee-api-xpno.onrender.com/api';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  submitted = false;
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

  submit(): void {
    this.error = '';
    if (!this.email || !this.email.includes('@')) {
      this.error = 'Please enter a valid email address';
      return;
    }
    this.loading = true;
    this.http.post(`${API}/auth/forgot-password`, { email: this.email }).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
      },
      error: (err) => {
        this.error = err.error?.error || 'Something went wrong. Please try again.';
        this.loading = false;
      },
    });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
