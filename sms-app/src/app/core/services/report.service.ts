import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SalesReportItem, DashboardSummary } from '../models/models';

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

    return this.http.get<SalesReportItem[]>(`${this.reportUrl}/sales`, { params });
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.dashboardUrl}/summary`);
  }
}
