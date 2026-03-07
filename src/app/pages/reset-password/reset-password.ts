// File: src/app/pages/reset-password/reset-password.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

const API = 'https://employee-api-xpno.onrender.com/api';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  loading = false;
  checking = true;
  tokenValid = false;
  done = false;
  error = '';

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.checking = false;
      this.tokenValid = false;
      return;
    }
    // Token exists — trust it until server validates on submit
    this.checking = false;
    this.tokenValid = true;
  }

  submit(): void {
    this.error = '';
    if (!this.password) {
      this.error = 'Password is required';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.http
      .post(`${API}/auth/reset-password`, { token: this.token, password: this.password })
      .subscribe({
        next: () => {
          this.loading = false;
          this.done = true;
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to reset password. The link may have expired.';
          this.loading = false;
          if (err.status === 400) this.tokenValid = false;
        },
      });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
  goToForgot(): void {
    this.router.navigateByUrl('/forgot-password');
  }
}
