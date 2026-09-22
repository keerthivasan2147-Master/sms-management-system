import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private counter = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  remove(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private show(type: 'success' | 'error' | 'info', message: string): void {
    const id = ++this.counter;
    this.toasts.update(list => [...list, { id, type, message }]);

    setTimeout(() => {
      this.remove(id);
    }, 4500);
  }
}
