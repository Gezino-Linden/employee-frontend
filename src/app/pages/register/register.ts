import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  token = '';
  name = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirm = false;
  loading = false;
  submitting = false;
  error = '';
  success = false;

  // Populated from token lookup
  inviteEmail = '';
  inviteRole = '';
  tokenValid = false;
  tokenExpired = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.error = 'No invite token found. Please use the link from your invitation email.';
      return;
    }

    // Validate token against the API
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/auth/invite-info?token=${this.token}`).subscribe({
      next: (res) => {
        this.loading = false;
        this.inviteEmail = res.email;
        this.inviteRole = res.role;
        this.tokenValid = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.error || '';
        if (msg.toLowerCase().includes('expired')) {
          this.tokenExpired = true;
          this.error = 'This invite link has expired. Please ask your admin to send a new one.';
        } else {
          this.error = 'This invite link is invalid or has already been used.';
        }
      },
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
  toggleConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  get passwordStrength(): { label: string; color: string; width: string } {
    const p = this.password;
    if (!p) return { label: '', color: '#334155', width: '0%' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map: Record<number, { label: string; color: string; width: string }> = {
      1: { label: 'Weak', color: '#ef4444', width: '25%' },
      2: { label: 'Fair', color: '#f59e0b', width: '50%' },
      3: { label: 'Good', color: '#3b82f6', width: '75%' },
      4: { label: 'Strong', color: '#22c55e', width: '100%' },
    };
    return map[score] || { label: 'Weak', color: '#ef4444', width: '25%' };
  }

  submit() {
    this.error = '';

    if (!this.name.trim() || this.name.trim().length < 2) {
      this.error = 'Please enter your full name (at least 2 characters)';
      return;
    }
    if (!this.password) {
      this.error = 'Please enter a password';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.submitting = true;

    this.http
      .post<any>(`${environment.apiUrl}/auth/accept-invite`, {
        token: this.token,
        name: this.name.trim(),
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.success = true;
          setTimeout(() => this.router.navigateByUrl('/login'), 3000);
        },
        error: (err) => {
          this.submitting = false;
          this.error = err?.error?.error || 'Something went wrong. Please try again.';
        },
      });
  }
}
