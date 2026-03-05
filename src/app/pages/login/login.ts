import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit, OnDestroy {
  email = '';
  password = '';
  error = '';
  loading = false;
  showPassword = false;
  loginAttempts = 0;
  capsLock = false;

  // Animated background particles
  particles: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];

  private capsLockListener = (e: KeyboardEvent) => {
    this.capsLock = e.getModifierState?.('CapsLock') ?? false;
  };

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Redirect if already logged in
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    // Generate particles for background
    this.particles = Array.from({ length: 18 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 20 + 15,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    document.addEventListener('keydown', this.capsLockListener);
    document.addEventListener('keyup', this.capsLockListener);
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.capsLockListener);
    document.removeEventListener('keyup', this.capsLockListener);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.error = '';

    if (!this.email.trim()) {
      this.error = 'Please enter your email address';
      return;
    }
    if (!this.password) {
      this.error = 'Please enter your password';
      return;
    }

    this.loading = true;

    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: any) => {
        this.loading = false;
        this.loginAttempts++;
        const msg = err?.error?.error || err?.error?.message || 'Login failed';
        this.error = msg;
      },
    });
  }

  get attemptsWarning(): string {
    if (this.loginAttempts >= 3) {
      return `${5 - this.loginAttempts} attempt${
        5 - this.loginAttempts === 1 ? '' : 's'
      } remaining before lockout`;
    }
    return '';
  }
}
