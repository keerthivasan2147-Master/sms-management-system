import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DxChartModule, DxPieChartModule } from 'devextreme-angular';
import { ReportService } from '../../core/services/report.service';
import { DashboardSummary } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, DxChartModule, DxPieChartModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="dashboard-page">
      <!-- Header Banner -->
      <div class="dashboard-header">
        <div>
          <h1 class="page-title">Sales Analytics & Dashboard</h1>
          <p class="page-subtitle">Real-time enterprise metrics, transactions overview, and gross margin analysis</p>
        </div>
        <div class="header-actions">
          <a routerLink="/sales/invoice" class="sms-btn sms-btn-primary">
            <span class="material-symbols-outlined">add_circle</span>
            <span>New Invoice Entry</span>
          </a>
          <a routerLink="/reports/sales" class="sms-btn sms-btn-secondary">
            <span class="material-symbols-outlined">table_view</span>
            <span>View Detailed Report</span>
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      } @else if (data(); as summary) {
        <!-- KPI Cards Grid -->
        <div class="kpi-grid">
          <!-- Total Sales -->
          <div class="sms-card kpi-card kpi-sales">
            <div class="kpi-icon-wrap">
              <span class="material-symbols-outlined">payments</span>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Total Revenue</span>
              <h2 class="kpi-value">{{ summary.kpis.totalSales | currency:'USD':'symbol':'1.2-2' }}</h2>
              <div class="kpi-badge-wrap">
                <span class="sms-badge sms-badge-primary">
                  <span class="material-symbols-outlined">receipt</span>
                  {{ summary.kpis.totalInvoices }} Invoices
                </span>
              </div>
            </div>
          </div>

          <!-- Total Gross Profit -->
          <div class="sms-card kpi-card kpi-profit">
            <div class="kpi-icon-wrap">
              <span class="material-symbols-outlined">trending_up</span>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Total Gross Profit</span>
              <h2 class="kpi-value profit-text">{{ summary.kpis.totalGrossProfit | currency:'USD':'symbol':'1.2-2' }}</h2>
              <div class="kpi-badge-wrap">
                <span class="sms-badge sms-badge-success">
                  <span class="material-symbols-outlined">percent</span>
                  {{ summary.kpis.overallProfitMargin | number:'1.1-1' }}% Margin
                </span>
              </div>
            </div>
          </div>

          <!-- Top Selling Item -->
          <div class="sms-card kpi-card kpi-top-item">
            <div class="kpi-icon-wrap">
              <span class="material-symbols-outlined">military_tech</span>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Top Selling Item</span>
              <h3 class="kpi-title-item" title="{{ summary.kpis.topSellingItem }}">
                {{ summary.kpis.topSellingItem }}
              </h3>
              <div class="kpi-badge-wrap">
                <span class="sms-badge sms-badge-warning">
                  <span class="material-symbols-outlined">inventory</span>
                  {{ summary.kpis.topSellingItemQty }} Units Sold
                </span>
                <span class="kpi-sub-text">
                  ({{ summary.kpis.topSellingItemSales | currency:'USD':'symbol':'1.0-0' }})
                </span>
              </div>
            </div>
          </div>

          <!-- Active Customers -->
          <div class="sms-card kpi-card kpi-customers">
            <div class="kpi-icon-wrap">
              <span class="material-symbols-outlined">group</span>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Client Network</span>
              <h2 class="kpi-value">{{ summary.kpis.totalCustomers }}</h2>
              <div class="kpi-badge-wrap">
                <span class="sms-badge sms-badge-neutral">Registered Accounts</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
          <!-- Chart 1: Sales Trends (DevExtreme DxChart) -->
          <div class="sms-card chart-card">
            <div class="sms-card-header">
              <div class="sms-card-title">
                <span class="material-symbols-outlined" style="color: #60a5fa;">show_chart</span>
                <span>Sales & Profit Trends</span>
              </div>
              <span class="sms-badge sms-badge-primary">Chronological</span>
            </div>

            <div class="chart-container">
              <dx-chart
                [dataSource]="summary.salesTrends"
                [rotated]="false"
                palette="Material"
              >
                <dxi-series
                  valueField="salesAmount"
                  name="Sales Amount ($)"
                  type="bar"
                  color="#3b82f6"
                ></dxi-series>
                <dxi-series
                  valueField="grossProfit"
                  name="Gross Profit ($)"
                  type="spline"
                  color="#10b981"
                ></dxi-series>
                <dxo-argument-axis argumentType="string">
                  <dxo-label [overlappingBehavior]="'rotate'" [rotationAngle]="-30">
                    <dxo-font color="#94a3b8"></dxo-font>
                  </dxo-label>
                </dxo-argument-axis>
                <dxi-value-axis>
                  <dxo-grid [visible]="true" color="rgba(255, 255, 255, 0.06)"></dxo-grid>
                  <dxo-label>
                    <dxo-font color="#94a3b8"></dxo-font>
                  </dxo-label>
                </dxi-value-axis>
                <dxo-legend
                  verticalAlignment="bottom"
                  horizontalAlignment="center"
                  itemTextPosition="right"
                >
                  <dxo-font color="#cbd5e1"></dxo-font>
                </dxo-legend>
                <dxo-tooltip
                  [enabled]="true"
                  [shared]="true"
                ></dxo-tooltip>
              </dx-chart>
            </div>
          </div>

          <!-- Chart 2: Sales by Customer Category (DevExtreme DxPieChart) -->
          <div class="sms-card chart-card">
            <div class="sms-card-header">
              <div class="sms-card-title">
                <span class="material-symbols-outlined" style="color: #a78bfa;">pie_chart</span>
                <span>Sales by Customer Category</span>
              </div>
              <span class="sms-badge sms-badge-warning">Category Share</span>
            </div>

            <div class="chart-container">
              <dx-pie-chart
                [dataSource]="summary.categoryBreakdown"
                type="doughnut"
                palette="Soft Pastel"
              >
                <dxi-series
                  argumentField="category"
                  valueField="salesAmount"
                >
                  <dxo-label
                    [visible]="true"
                    format="percent"
                    [connector]="{ visible: true }"
                  >
                    <dxo-font color="#ffffff" [size]="12"></dxo-font>
                  </dxo-label>
                </dxi-series>
                <dxo-legend
                  verticalAlignment="bottom"
                  horizontalAlignment="center"
                  itemTextPosition="right"
                >
                  <dxo-font color="#cbd5e1"></dxo-font>
                </dxo-legend>
                <dxo-tooltip
                  [enabled]="true"
                ></dxo-tooltip>
              </dx-pie-chart>
            </div>
          </div>
        </div>

        <!-- Recent Invoices Table -->
        <div class="sms-card recent-invoices-card">
          <div class="sms-card-header">
            <div class="sms-card-title">
              <span class="material-symbols-outlined" style="color: #38bdf8;">history</span>
              <span>Recent Invoices</span>
            </div>
            <a routerLink="/sales/invoice" class="view-all-link">Open Invoicing &rarr;</a>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th class="text-right">Total Amount</th>
                  <th class="text-right">Items</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (inv of summary.recentInvoices; track inv.invoiceNumber) {
                  <tr>
                    <td>
                      <strong class="inv-link">{{ inv.invoiceNumber }}</strong>
                    </td>
                    <td>{{ inv.date }}</td>
                    <td>
                      <span class="sms-badge sms-badge-neutral">{{ inv.invoiceType }}</span>
                    </td>
                    <td>{{ inv.customerName }}</td>
                    <td class="text-right font-mono font-bold">{{ inv.totalAmount | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td class="text-right">{{ inv.totalItems }} lines</td>
                    <td class="text-center">
                      <a [routerLink]="['/sales/invoice']" [queryParams]="{ invoice: inv.invoiceNumber }" class="sms-btn sms-btn-outline btn-xs">
                        <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
                        <span>Open</span>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      max-width: 1440px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-family: var(--font-display);
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-main);
    }

    .page-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 0.25rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .kpi-card {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 1.5rem;
      border-radius: var(--radius-xl);
      transition: transform var(--transition-normal), box-shadow var(--transition-normal);
    }

    .kpi-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
    }

    .kpi-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon-wrap .material-symbols-outlined {
      font-size: 28px;
    }

    .kpi-sales .kpi-icon-wrap {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .kpi-profit .kpi-icon-wrap {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .kpi-top-item .kpi-icon-wrap {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .kpi-customers .kpi-icon-wrap {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      min-width: 0;
    }

    .kpi-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .kpi-value {
      font-family: var(--font-display);
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.1;
    }

    .profit-text {
      color: #34d399;
    }

    .kpi-title-item {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 220px;
    }

    .kpi-badge-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.35rem;
    }

    .kpi-sub-text {
      font-size: 0.82rem;
      color: var(--text-dim);
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 1.5rem;
    }

    .chart-card {
      min-height: 420px;
    }

    .chart-container {
      height: 340px;
      width: 100%;
    }

    .view-all-link {
      font-size: 0.88rem;
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
    }

    .view-all-link:hover {
      text-decoration: underline;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th {
      padding: 0.85rem 1rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-subtle);
    }

    .data-table td {
      padding: 0.95rem 1rem;
      font-size: 0.9rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: var(--text-main);
    }

    .data-table tr:hover td {
      background: rgba(59, 130, 246, 0.05);
    }

    .inv-link {
      color: #60a5fa;
    }

    .font-mono {
      font-family: monospace;
    }

    .font-bold {
      font-weight: 700;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .btn-xs {
      padding: 0.35rem 0.65rem;
      font-size: 0.78rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 1rem;
      color: var(--text-muted);
      gap: 1rem;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private reportService = inject(ReportService);

  data = signal<DashboardSummary | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.reportService.getDashboardSummary().subscribe({
      next: res => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
