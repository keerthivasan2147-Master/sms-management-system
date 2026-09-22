import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SalesInvoice,
  SaveSalesInvoice,
  NavigationResult,
  InvoiceSummary
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SalesInvoiceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/salesinvoice`;

  getByInvoiceNumber(invoiceNumber: string): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.baseUrl}/${encodeURIComponent(invoiceNumber)}`);
  }

  create(invoice: SaveSalesInvoice): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(this.baseUrl, invoice);
  }

  update(invoiceNumber: string, invoice: SaveSalesInvoice): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.baseUrl}/${encodeURIComponent(invoiceNumber)}`, invoice);
  }

  delete(invoiceNumber: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(invoiceNumber)}`);
  }

  // Navigation Methods
  getTop(): Observable<NavigationResult> {
    return this.http.get<NavigationResult>(`${this.baseUrl}/nav/top`);
  }

  getBottom(): Observable<NavigationResult> {
    return this.http.get<NavigationResult>(`${this.baseUrl}/nav/bottom`);
  }

  getPrior(currentInvoiceNumber: string): Observable<NavigationResult> {
    return this.http.get<NavigationResult>(`${this.baseUrl}/nav/prior/${encodeURIComponent(currentInvoiceNumber)}`);
  }

  getNext(currentInvoiceNumber: string): Observable<NavigationResult> {
    return this.http.get<NavigationResult>(`${this.baseUrl}/nav/next/${encodeURIComponent(currentInvoiceNumber)}`);
  }

  getAllSummaries(): Observable<InvoiceSummary[]> {
    return this.http.get<InvoiceSummary[]>(`${this.baseUrl}/nav/list`);
  }

  search(query?: string, fromDate?: string, toDate?: string): Observable<InvoiceSummary[]> {
    let params = new HttpParams();
    if (query) params = params.set('query', query);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<InvoiceSummary[]>(`${this.baseUrl}/search`, { params });
  }

  getNextNumber(prefix: string = 'INV'): Observable<{ nextNumber: string }> {
    return this.http.get<{ nextNumber: string }>(`${this.baseUrl}/next-number?prefix=${prefix}`);
  }
}
