import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Item } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/item`;

  getAll(): Observable<Item[]> {
    return this.http.get<Item[]>(this.baseUrl);
  }

  getByCode(code: string): Observable<Item> {
    return this.http.get<Item>(`${this.baseUrl}/${encodeURIComponent(code)}`);
  }

  create(item: Item): Observable<Item> {
    return this.http.post<Item>(this.baseUrl, item);
  }

  update(code: string, item: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.baseUrl}/${encodeURIComponent(code)}`, item);
  }

  delete(code: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(code)}`);
  }
}
