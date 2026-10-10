import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Item } from '../models/models';

const DEMO_ITEMS: Item[] = [
  { code: 'ITM-001', description: 'ThinkPad Ultra 16 Laptop (i7, 32GB RAM)', itemPhoto: '', cost: 950.00, salesPrice: 1450.00, unit: 'PCS', brand: 'Lenovo', supplier: 'Lenovo Global Direct', createdAt: new Date().toISOString() },
  { code: 'ITM-002', description: 'Dell 32-inch 4K UHD Curved Monitor', itemPhoto: '', cost: 310.00, salesPrice: 499.00, unit: 'PCS', brand: 'Dell', supplier: 'Dell Commercial', createdAt: new Date().toISOString() },
  { code: 'ITM-003', description: 'Logitech MX Master 3S Wireless Mouse', itemPhoto: '', cost: 60.00, salesPrice: 99.00, unit: 'PCS', brand: 'Logitech', supplier: 'LogiTech Distribution', createdAt: new Date().toISOString() },
  { code: 'ITM-004', description: 'Keychron Q1 Pro Mechanical Keyboard', itemPhoto: '', cost: 110.00, salesPrice: 199.00, unit: 'PCS', brand: 'Keychron', supplier: 'Keychron APAC', createdAt: new Date().toISOString() },
  { code: 'ITM-005', description: 'Sony WH-1000XM5 ANC Headphones', itemPhoto: '', cost: 240.00, salesPrice: 399.00, unit: 'PCS', brand: 'Sony', supplier: 'Sony Electronics', createdAt: new Date().toISOString() }
];

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/item`;

  getAll(): Observable<Item[]> {
    return this.http.get<Item[]>(this.baseUrl).pipe(
      catchError(() => of(DEMO_ITEMS))
    );
  }

  getByCode(code: string): Observable<Item> {
    return this.http.get<Item>(`${this.baseUrl}/${encodeURIComponent(code)}`).pipe(
      catchError(() => {
        const found = DEMO_ITEMS.find(i => i.code.toLowerCase() === code.toLowerCase()) || DEMO_ITEMS[0];
        return of(found);
      })
    );
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
