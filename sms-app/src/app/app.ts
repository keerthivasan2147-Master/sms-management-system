import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  isAuthenticated = this.authService.isAuthenticated;
  toasts = this.notificationService.toasts;

  removeToast(id: number): void {
    this.notificationService.remove(id);
  }
}
