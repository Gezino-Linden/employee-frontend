import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.error = 'Trying to login...';

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: any) => {
        this.error = err?.error?.error || err?.error?.message || 'Login failed';
      },
    });
  }
}
