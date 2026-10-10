import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Customer } from '../models/models';

const DEMO_CUSTOMERS: Customer[] = [
  { code: 'CUST-001', name: 'Apex Global Enterprises', address: '100 Financial Center, New York, NY', mobile: '+1-555-1200', email: 'purchasing@apexglobal.com', category: 'Corporate', createdAt: new Date().toISOString() },
  { code: 'CUST-002', name: 'Metro Wholesale Distributors', address: '45 Industrial Parkway, Chicago, IL', mobile: '+1-555-3400', email: 'orders@metrowholesale.com', category: 'Wholesale', createdAt: new Date().toISOString() },
  { code: 'CUST-003', name: 'Horizon Retail Stores', address: '789 Market Street, San Francisco, CA', mobile: '+1-555-5600', email: 'info@horizonretail.com', category: 'Retail', createdAt: new Date().toISOString() },
  { code: 'CUST-004', name: 'Quantum Logistics LLC', address: '12 Logistics Way, Dallas, TX', mobile: '+1-555-7800', email: 'contact@quantumlogistics.com', category: 'Corporate', createdAt: new Date().toISOString() }
];

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/customer`;

  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl).pipe(
      catchError(() => of(DEMO_CUSTOMERS))
    );
  }

  getByCode(code: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${encodeURIComponent(code)}`).pipe(
      catchError(() => {
        const found = DEMO_CUSTOMERS.find(c => c.code.toLowerCase() === code.toLowerCase()) || DEMO_CUSTOMERS[0];
        return of(found);
      })
    );
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
