import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Customer } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/customer`;

  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl);
  }

  getByCode(code: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${encodeURIComponent(code)}`);
  }

  create(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, customer);
  }

  update(code: string, customer: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}/${encodeURIComponent(code)}`, customer);
  }

  delete(code: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(code)}`);
  }
}
