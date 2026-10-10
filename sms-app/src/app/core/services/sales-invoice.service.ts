import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SalesInvoice,
  SaveSalesInvoice,
  NavigationResult,
  InvoiceSummary
} from '../models/models';

const INITIAL_DEMO_INVOICE: SalesInvoice = {
  invoiceNumber: 'INV-2026-001',
  invoiceType: 'Tax Invoice',
  date: new Date().toISOString().split('T')[0],
  customer: 'CUST-001',
  customerName: 'Apex Global Enterprises',
  customerCategory: 'Corporate',
  invoiceDescription: 'Quarterly IT equipment order',
  totalAmount: 2448.00,
  details: [
    {
      invoiceType: 'Tax Invoice',
      invoiceNumber: 'INV-2026-001',
      itemCode: 'ITM-001',
      description: 'ThinkPad Ultra 16 Laptop (i7, 32GB RAM)',
      unit: 'PCS',
      qty: 1,
      price: 1450.00,
      amount: 1450.00
    },
    {
      invoiceType: 'Tax Invoice',
      invoiceNumber: 'INV-2026-001',
      itemCode: 'ITM-002',
      description: 'Dell 32-inch 4K UHD Curved Monitor',
      unit: 'PCS',
      qty: 2,
      price: 499.00,
      amount: 998.00
    }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class SalesInvoiceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/salesinvoice`;

  private getLocalInvoices(): SalesInvoice[] {
    try {
      const stored = localStorage.getItem('sms_local_invoices');
      if (stored) return JSON.parse(stored);
    } catch { }
    const initial = [INITIAL_DEMO_INVOICE];
    this.saveLocalInvoices(initial);
    return initial;
  }

  private saveLocalInvoices(invoices: SalesInvoice[]): void {
    try {
      localStorage.setItem('sms_local_invoices', JSON.stringify(invoices));
    } catch { }
  }

  getByInvoiceNumber(invoiceNumber: string): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.baseUrl}/${encodeURIComponent(invoiceNumber)}`).pipe(
      catchError(() => {
        const invoices = this.getLocalInvoices();
        const found = invoices.find(i => i.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase()) || invoices[0];
        return of(found);
      })
    );
  }

  create(invoice: SaveSalesInvoice): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(this.baseUrl, invoice).pipe(
      catchError(() => {
        const invoices = this.getLocalInvoices();
        let total = 0;
        const details = (invoice.details || []).map(d => {
          const amt = (d.qty || 0) * (d.price || 0);
          total += amt;
          return {
            invoiceType: invoice.invoiceType,
            invoiceNumber: invoice.invoiceNumber,
            itemCode: d.itemCode,
            description: d.itemCode,
            unit: 'PCS',
            qty: d.qty,
            price: d.price,
            amount: amt
          };
        });

        const newInvoice: SalesInvoice = {
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: invoice.invoiceType,
          date: invoice.date,
          customer: invoice.customer,
          customerName: invoice.customer,
          invoiceDescription: invoice.invoiceDescription,
          totalAmount: total,
          details
        };

        const existingIdx = invoices.findIndex(i => i.invoiceNumber === newInvoice.invoiceNumber);
        if (existingIdx >= 0) {
          invoices[existingIdx] = newInvoice;
        } else {
          invoices.push(newInvoice);
        }
        this.saveLocalInvoices(invoices);
        return of(newInvoice);
      })
    );
  }

  update(invoiceNumber: string, invoice: SaveSalesInvoice): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.baseUrl}/${encodeURIComponent(invoiceNumber)}`, invoice).pipe(
      catchError(() => {
        return this.create(invoice);
      })
    );
  }

  delete(invoiceNumber: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(invoiceNumber)}`).pipe(
      catchError(() => {
        const invoices = this.getLocalInvoices().filter(i => i.invoiceNumber !== invoiceNumber);
        this.saveLocalInvoices(invoices);
        return of(void 0);
      })
    );
  }

  // Navigation Methods
  getTop(): Observable<NavigationResult> {
    return this.http.get<NavigationResult>(`${this.baseUrl}/nav/top`).pipe(
      catchError(() => {
        const invoices = this.getLocalInvoices();
        const first = invoices[0] || null;
        return of({
          invoice: first,
          hasPrior: false,
          hasNext: invoices.length > 1,
          currentIndex: first ? 1 : 0,
          totalCount: invoices.length
        });
      })
    );
  }

  getBottom(): Observable<NavigationResult> {
    return this.http.get<NavigationResult>(`${this.baseUrl}/nav/bottom`).pipe(
      catchError(() => {
        const invoices = this.getLocalInvoices();
        const last = invoices[invoices.length - 1] || null;
        return of({
          invoice: last,
          hasPrior: invoices.length > 1,
          hasNext: false,
          currentIndex: invoices.length,
          totalCount: invoices.length
        });
      })
    );
  }

  getPrior(currentInvoiceNumber: string): Observable<NavigationResult> {
    return this.http.get<NavigationResult>(`${this.baseUrl}/nav/prior/${encodeURIComponent(currentInvoiceNumber)}`).pipe(
      catchError(() => {
        const invoices = this.getLocalInvoices();
        const idx = invoices.findIndex(i => i.invoiceNumber === currentInvoiceNumber);
        const prevIdx = idx > 0 ? idx - 1 : 0;
        const inv = invoices[prevIdx] || null;
        return of({
          invoice: inv,
          hasPrior: prevIdx > 0,
          hasNext: true,
          currentIndex: prevIdx + 1,
          totalCount: invoices.length
        });
      })
    );
  }

  getNext(currentInvoiceNumber: string): Observable<NavigationResult> {
    return this.http.get<NavigationResult>(`${this.baseUrl}/nav/next/${encodeURIComponent(currentInvoiceNumber)}`).pipe(
      catchError(() => {
        const invoices = this.getLocalInvoices();
        const idx = invoices.findIndex(i => i.invoiceNumber === currentInvoiceNumber);
        const nextIdx = idx >= 0 && idx < invoices.length - 1 ? idx + 1 : invoices.length - 1;
        const inv = invoices[nextIdx] || null;
        return of({
          invoice: inv,
          hasPrior: true,
          hasNext: nextIdx < invoices.length - 1,
          currentIndex: nextIdx + 1,
          totalCount: invoices.length
        });
      })
    );
  }

  getAllSummaries(): Observable<InvoiceSummary[]> {
    return this.http.get<InvoiceSummary[]>(`${this.baseUrl}/nav/list`).pipe(
      catchError(() => {
        const invoices = this.getLocalInvoices();
        const summaries: InvoiceSummary[] = invoices.map(i => ({
          invoiceNumber: i.invoiceNumber,
          invoiceType: i.invoiceType,
          date: i.date,
          customer: i.customer,
          customerName: i.customerName || i.customer,
          totalAmount: i.totalAmount,
          totalItems: i.details?.length || 0
        }));
        return of(summaries);
      })
    );
  }

  search(query?: string, fromDate?: string, toDate?: string): Observable<InvoiceSummary[]> {
    let params = new HttpParams();
    if (query) params = params.set('query', query);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<InvoiceSummary[]>(`${this.baseUrl}/search`, { params }).pipe(
      catchError(() => this.getAllSummaries())
    );
  }

  getNextNumber(prefix: string = 'INV'): Observable<{ nextNumber: string }> {
    return this.http.get<{ nextNumber: string }>(`${this.baseUrl}/next-number?prefix=${prefix}`).pipe(
      catchError(() => {
        const invoices = this.getLocalInvoices();
        const nextId = (invoices.length + 1).toString().padStart(4, '0');
        const year = new Date().getFullYear();
        return of({ nextNumber: `${prefix}-${year}-${nextId}` });
      })
    );
  }
}
