import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  readonly currentUser = signal<User | null>(this.getInitialUser());
  readonly token = signal<string | null>(this.getInitialToken());
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  private getInitialToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('sms_token');
  }

  private getInitialUser(): User | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem('sms_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        if (this.isBrowser) {
          localStorage.setItem('sms_token', res.token);
          const user: User = {
            userId: res.userId,
            name: res.name,
            username: res.username,
            mobile: '',
            role: res.role
          };
          localStorage.setItem('sms_user', JSON.stringify(user));
          this.token.set(res.token);
          this.currentUser.set(user);
        }
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('sms_token');
      localStorage.removeItem('sms_user');
    }
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
