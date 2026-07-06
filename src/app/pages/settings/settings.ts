import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService, MeResponse } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
})
export class Settings implements OnInit {
  me: MeResponse | null = null;
  company: any = null;
  loading = true;
  saving = false;
  success = false;
  error = '';

  // Form fields
  name = '';
  slug = '';

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.auth.getMe().subscribe({
      next: (me) => {
        this.me = me;
        this.loadCompany();
        this.cdr.detectChanges();
      },
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadCompany() {
    this.loading = true;
    this.http.get<any>(`${API}/companies/me`, { headers: this.headers() }).subscribe({
      next: (company) => {
        this.company = company;
        this.name = company.name;
        this.slug = company.slug;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load company details';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  save() {
    this.error = '';
    this.success = false;

    if (!this.name.trim() || this.name.trim().length < 2) {
      this.error = 'Company name must be at least 2 characters';
      return;
    }

    this.saving = true;

    this.http
      .patch<any>(
        `${API}/companies/me`,
        { name: this.name.trim(), slug: this.slug.trim() },
        { headers: this.headers() }
      )
      .subscribe({
        next: (updated) => {
          this.company = updated;
          this.name = updated.name;
          this.slug = updated.slug;
          this.saving = false;
          this.success = true;
          setTimeout(() => {
            this.success = false;
            this.cdr.detectChanges();
          }, 3000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.error || 'Failed to save changes';
          this.saving = false;
          this.cdr.detectChanges();
        },
      });
  }

  signOut() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  get initials(): string {
    return (
      this.me?.name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
    );
  }
}
