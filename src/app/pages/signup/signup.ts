import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface KeyInfo {
  valid: boolean;
  plan: string;
  maxEmployees: number;
  pepmRate: number;
  hotelName: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup implements OnInit {
  // Form fields
  licenseKey = '';
  hotelName = '';
  adminName = '';
  email = '';
  password = '';
  confirmPassword = '';

  // State
  step = 1;
  loading = false;
  validating = false;
  error = '';
  showPassword = false;
  showConfirm = false;
  keyInfo: KeyInfo | null = null;

  // Contact modal
  showContact = false;
  contactLoading = false;
  contactSent = false;
  contactError = '';
  contact = { hotel: '', name: '', email: '', employees: '', plan: '', message: '' };

  get pwStrength(): { score: number; label: string; color: string } {
    const p = this.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
    return { score, label: p ? labels[score] : '', color: p ? colors[score] : '' };
  }

  constructor(private router: Router, private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()) this.router.navigateByUrl('/dashboard');
  }

  validateKey() {
    this.error = '';
    const key = this.licenseKey.trim().toUpperCase();
    if (key.length < 10) {
      this.error = 'Please enter a valid license key';
      return;
    }
    this.validating = true;
    this.http.post<KeyInfo>(`${environment.apiUrl}/auth/validate-key`, { key }).subscribe({
      next: (info) => {
        this.validating = false;
        this.keyInfo = info;
        this.licenseKey = key;
        if (info.hotelName) this.hotelName = info.hotelName;
        this.step = 2;
      },
      error: (err) => {
        this.validating = false;
        this.error = err?.error?.error || 'Invalid license key';
      },
    });
  }

  register() {
    this.error = '';
    if (!this.hotelName.trim()) {
      this.error = 'Hotel name is required';
      return;
    }
    if (!this.adminName.trim()) {
      this.error = 'Your name is required';
      return;
    }
    if (!this.email.trim()) {
      this.error = 'Email is required';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    if (this.pwStrength.score < 3) {
      this.error = 'Please choose a stronger password';
      return;
    }
    this.loading = true;
    this.http
      .post(`${environment.apiUrl}/auth/register`, {
        name: this.adminName.trim(),
        email: this.email.trim(),
        password: this.password,
        companyName: this.hotelName.trim(),
        licenseKey: this.licenseKey,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
            next: () => this.router.navigateByUrl('/dashboard'),
            error: () => this.router.navigateByUrl('/login'),
          });
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.error || 'Registration failed';
        },
      });
  }

  back() {
    this.step = 1;
    this.keyInfo = null;
    this.error = '';
  }

  closeContact(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showContact = false;
    }
  }

  sendContact() {
    this.contactError = '';
    if (!this.contact.hotel.trim()) {
      this.contactError = 'Hotel name is required';
      return;
    }
    if (!this.contact.name.trim()) {
      this.contactError = 'Your name is required';
      return;
    }
    if (!this.contact.email.trim()) {
      this.contactError = 'Email is required';
      return;
    }

    this.contactLoading = true;

    // Send to backend contact endpoint or fallback to mailto
    this.http.post(`${environment.apiUrl}/contact`, this.contact).subscribe({
      next: () => {
        this.contactLoading = false;
        this.contactSent = true;
      },
      error: () => {
        // Fallback — open mailto if endpoint not available
        this.contactLoading = false;
        const subject = encodeURIComponent(`License Key Request — ${this.contact.hotel}`);
        const body = encodeURIComponent(
          `Hotel: ${this.contact.hotel}\nName: ${this.contact.name}\nEmail: ${this.contact.email}\nEmployees: ${this.contact.employees}\nPlan: ${this.contact.plan}\n\n${this.contact.message}`
        );
        window.open(`mailto:sales@maeroll.co.za?subject=${subject}&body=${body}`);
        this.contactSent = true;
      },
    });
  }
}
