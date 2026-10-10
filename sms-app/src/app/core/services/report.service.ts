import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SalesReportItem, DashboardSummary } from '../models/models';

const DEMO_DASHBOARD: DashboardSummary = {
  kpis: {
    totalSales: 15480.00,
    totalGrossProfit: 5210.00,
    overallProfitMargin: 33.65,
    topSellingItem: 'ThinkPad Ultra 16 Laptop',
    topSellingItemQty: 6,
    topSellingItemSales: 8700.00,
    totalInvoices: 14,
    totalCustomers: 4
  },
  salesTrends: [
    { period: 'May 2026', salesAmount: 1850, grossProfit: 650, invoiceCount: 2 },
    { period: 'Jun 2026', salesAmount: 2400, grossProfit: 800, invoiceCount: 3 },
    { period: 'Jul 2026', salesAmount: 3100, grossProfit: 1050, invoiceCount: 4 },
    { period: 'Aug 2026', salesAmount: 2950, grossProfit: 1000, invoiceCount: 3 },
    { period: 'Sep 2026', salesAmount: 4200, grossProfit: 1400, invoiceCount: 5 },
    { period: 'Oct 2026', salesAmount: 4980, grossProfit: 1710, invoiceCount: 6 }
  ],
  categoryBreakdown: [
    { category: 'Corporate', salesAmount: 8200, grossProfit: 2750, percentage: 52.9 },
    { category: 'Wholesale', salesAmount: 4800, grossProfit: 1610, percentage: 31.0 },
    { category: 'Retail', salesAmount: 2480, grossProfit: 850, percentage: 16.1 }
  ],
  recentInvoices: [
    { invoiceNumber: 'INV-2026-001', date: '2026-10-08', invoiceType: 'TAX', customer: 'CUST-001', customerName: 'Apex Global Enterprises', totalAmount: 2448.00, totalItems: 2 },
    { invoiceNumber: 'INV-2026-002', date: '2026-10-09', invoiceType: 'TAX', customer: 'CUST-002', customerName: 'Metro Wholesale Distributors', totalAmount: 3499.00, totalItems: 3 },
    { invoiceNumber: 'INV-2026-003', date: '2026-10-10', invoiceType: 'TAX', customer: 'CUST-003', customerName: 'Horizon Retail Stores', totalAmount: 1850.00, totalItems: 2 }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private reportUrl = `${environment.apiUrl}/report`;
  private dashboardUrl = `${environment.apiUrl}/dashboard`;

  getSalesReport(fromDate?: string, toDate?: string): Observable<SalesReportItem[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<SalesReportItem[]>(`${this.reportUrl}/sales`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.dashboardUrl}/summary`).pipe(
      catchError(() => of(DEMO_DASHBOARD))
    );
  }
}
