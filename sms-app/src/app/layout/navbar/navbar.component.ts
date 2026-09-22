import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sms-navbar">
      <div class="nav-container">
        <!-- Logo / Brand -->
        <div class="nav-brand">
          <div class="brand-icon">
            <span class="material-symbols-outlined">point_of_sale</span>
          </div>
          <div class="brand-text">
            <span class="brand-title">SMS Portal</span>
            <span class="brand-subtitle">Sales Management System</span>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <span class="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>

          <a routerLink="/sales/invoice" routerLinkActive="active" class="nav-link highlight-link">
            <span class="material-symbols-outlined">receipt_long</span>
            <span>Invoice Entry</span>
          </a>

          <a routerLink="/masters/customers" routerLinkActive="active" class="nav-link">
            <span class="material-symbols-outlined">groups</span>
            <span>Customers</span>
          </a>

          <a routerLink="/masters/items" routerLinkActive="active" class="nav-link">
            <span class="material-symbols-outlined">inventory_2</span>
            <span>Items</span>
          </a>

          <a routerLink="/reports/sales" routerLinkActive="active" class="nav-link">
            <span class="material-symbols-outlined">analytics</span>
            <span>Sales Report</span>
          </a>
        </nav>

        <!-- User Profile & Actions -->
        <div class="nav-user-actions">
          @if (currentUser(); as user) {
            <div class="user-badge">
              <span class="material-symbols-outlined user-avatar">account_circle</span>
              <div class="user-info">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-role">{{ user.role }}</span>
              </div>
            </div>
          }

          <button type="button" class="logout-btn" (click)="logout()" title="Sign Out">
            <span class="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .sms-navbar {
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 1000;
      width: 100%;
    }

    .nav-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      text-decoration: none;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
    }

    .brand-icon .material-symbols-outlined {
      font-size: 22px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-family: var(--font-display);
      font-size: 1.12rem;
      font-weight: 800;
      letter-spacing: -0.01em;
      color: var(--text-main);
      line-height: 1.2;
    }

    .brand-subtitle {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 0.95rem;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      transition: all var(--transition-fast);
      border: 1px solid transparent;
    }

    .nav-link:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-link.active {
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.12);
      border-color: rgba(59, 130, 246, 0.3);
      font-weight: 600;
    }

    .highlight-link.active {
      background: rgba(99, 102, 241, 0.16);
      border-color: rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
    }

    .nav-user-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.35rem 0.75rem;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
    }

    .user-avatar {
      font-size: 24px;
      color: #60a5fa;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-main);
      line-height: 1.1;
    }

    .user-role {
      font-size: 0.68rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #f87171;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      transform: scale(1.05);
    }
  `]
})
export class NavbarComponent {
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }
}
