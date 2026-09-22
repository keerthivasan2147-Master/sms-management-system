import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="brand-header">
          <div class="brand-badge">
            <span class="material-symbols-outlined icon-glow">monitoring</span>
          </div>
          <h1>Sales Management System</h1>
          <p class="brand-sub">Enterprise Portal Authentication</p>
        </div>

        @if (errorMessage()) {
          <div class="error-banner">
            <span class="material-symbols-outlined">error</span>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-container">
              <span class="material-symbols-outlined field-icon">person</span>
              <input
                type="text"
                id="username"
                name="username"
                [(ngModel)]="username"
                class="sms-input"
                placeholder="Enter username (e.g. admin)"
                required
                autocomplete="username"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-container">
              <span class="material-symbols-outlined field-icon">lock</span>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                name="password"
                [(ngModel)]="password"
                class="sms-input"
                placeholder="Enter password"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                class="toggle-pwd-btn"
                (click)="showPassword.set(!showPassword())"
                tabindex="-1"
              >
                <span class="material-symbols-outlined">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="sms-btn sms-btn-primary submit-btn"
            [disabled]="loading() || !username || !password"
          >
            @if (loading()) {
              <span class="spinner"></span>
              <span>Authenticating...</span>
            } @else {
              <span class="material-symbols-outlined">login</span>
              <span>Sign In to SMS</span>
            }
          </button>
        </form>

        <div class="demo-box">
          <div class="demo-header">
            <span class="material-symbols-outlined">info</span>
            <span>Assessment Demo Credentials</span>
          </div>
          <div class="demo-content">
            <p><strong>Username:</strong> <code>admin</code></p>
            <p><strong>Password:</strong> <code>Admin&#64;123</code></p>
          </div>
          <button
            type="button"
            class="sms-btn sms-btn-secondary demo-autofill-btn"
            (click)="autofillDemo()"
          >
            <span class="material-symbols-outlined">flash_on</span>
            <span>Auto-fill Demo Admin</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      position: relative;
      z-index: 1;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-xl);
      padding: 2.5rem 2rem;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9);
      animation: fadeIn 0.4s ease-out;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.3) 100%);
      border: 1px solid rgba(59, 130, 246, 0.4);
      margin-bottom: 1.25rem;
      box-shadow: 0 0 25px rgba(59, 130, 246, 0.3);
    }

    .brand-badge .icon-glow {
      font-size: 32px;
      color: #60a5fa;
    }

    h1 {
      font-family: var(--font-display);
      font-size: 1.55rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.35rem;
      letter-spacing: -0.02em;
    }

    .brand-sub {
      font-size: 0.88rem;
      color: var(--text-muted);
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      margin-bottom: 1.5rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.45rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .field-icon {
      position: absolute;
      left: 0.9rem;
      color: var(--text-dim);
      font-size: 20px;
      pointer-events: none;
    }

    .input-container input {
      padding-left: 2.6rem;
      padding-right: 2.6rem;
    }

    .toggle-pwd-btn {
      position: absolute;
      right: 0.75rem;
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.25rem;
      transition: color var(--transition-fast);
    }

    .toggle-pwd-btn:hover {
      color: var(--text-main);
    }

    .submit-btn {
      width: 100%;
      padding: 0.85rem;
      font-size: 0.95rem;
      margin-top: 0.5rem;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .demo-box {
      margin-top: 2rem;
      background: rgba(30, 41, 59, 0.45);
      border: 1px dashed var(--border-medium);
      border-radius: var(--radius-md);
      padding: 1.15rem;
    }

    .demo-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: #60a5fa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.6rem;
    }

    .demo-content {
      font-size: 0.84rem;
      color: var(--text-muted);
      margin-bottom: 0.85rem;
      display: flex;
      justify-content: space-between;
    }

    .demo-content code {
      background: rgba(0, 0, 0, 0.4);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      color: #e2e8f0;
      font-family: monospace;
    }

    .demo-autofill-btn {
      width: 100%;
      padding: 0.5rem;
      font-size: 0.82rem;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  autofillDemo(): void {
    this.username = 'admin';
    this.password = 'Admin@123';
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (!this.username || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success('Welcome back to Sales Management System!');
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading.set(false);
        const msg = err.error?.message || 'Login failed. Please verify credentials.';
        this.errorMessage.set(msg);
        this.notification.error(msg);
      }
    });
  }
}
