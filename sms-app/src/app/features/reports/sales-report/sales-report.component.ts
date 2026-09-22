import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DxDataGridModule } from 'devextreme-angular';
import { ReportService } from '../../../core/services/report.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SalesReportItem } from '../../../core/models/models';

@Component({
  selector: 'app-sales-report',
  imports: [CommonModule, FormsModule, DxDataGridModule],
  template: `
    <div class="report-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Interactive Sales & Profitability Report</h1>
          <p class="page-subtitle">
            Advanced multi-level grouping (Customer, Category, Brand), column filters, and real-time Gross Profit analytics
          </p>
        </div>

        <div class="header-actions">
          <button type="button" class="sms-btn sms-btn-primary" (click)="loadReport()">
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <!-- Quick Preset Grouping Chips -->
      <div class="preset-chips-card">
        <div class="preset-label">
          <span class="material-symbols-outlined">auto_awesome</span>
          <span>One-Click Grouping Presets:</span>
        </div>
        <div class="chips-list">
          <button
            type="button"
            class="preset-chip"
            [class.active]="activePreset() === 'none'"
            (click)="setPreset('none')"
          >
            Flat List
          </button>
          <button
            type="button"
            class="preset-chip"
            [class.active]="activePreset() === 'customer'"
            (click)="setPreset('customer')"
          >
            Group by Customer
          </button>
          <button
            type="button"
            class="preset-chip"
            [class.active]="activePreset() === 'category'"
            (click)="setPreset('category')"
          >
            Group by Category & Brand
          </button>
          <button
            type="button"
            class="preset-chip"
            [class.active]="activePreset() === 'brand'"
            (click)="setPreset('brand')"
          >
            Group by Brand
          </button>
        </div>
      </div>

      <!-- DevExtreme Advanced DataGrid -->
      <div class="sms-card grid-card">
        <dx-data-grid
          #reportGrid
          [dataSource]="reportData()"
          [showBorders]="true"
          [showRowLines]="true"
          [showColumnLines]="true"
          [rowAlternationEnabled]="true"
          [allowColumnReordering]="true"
          [allowColumnResizing]="true"
          [columnAutoWidth]="true"
          [hoverStateEnabled]="true"
          keyExpr="detailId"
        >
          <!-- Multi-level Group Panel -->
          <dxo-group-panel
            [visible]="true"
            emptyPanelText="Drag and drop column headers here to create multi-level groupings (e.g. Customer, Category, Brand)"
          ></dxo-group-panel>
          <dxo-grouping [autoExpandAll]="false"></dxo-grouping>

          <!-- Search & Filter Options -->
          <dxo-search-panel
            [visible]="true"
            [highlightCaseSensitive]="false"
            placeholder="Search report..."
          ></dxo-search-panel>
          <dxo-filter-row [visible]="true"></dxo-filter-row>
          <dxo-header-filter [visible]="true"></dxo-header-filter>
          <dxo-column-chooser [enabled]="true" mode="select"></dxo-column-chooser>

          <!-- Paging & Pager -->
          <dxo-paging [pageSize]="15"></dxo-paging>
          <dxo-pager
            [visible]="true"
            [showPageSizeSelector]="true"
            [allowedPageSizes]="[10, 15, 25, 50, 100]"
            [showInfo]="true"
            [showNavigationButtons]="true"
          ></dxo-pager>

          <!-- 1. Photo (Thumbnail) -->
          <dxi-column
            dataField="photo"
            caption="Photo"
            [width]="75"
            [allowFiltering]="false"
            [allowGrouping]="false"
            [allowSorting]="false"
            cellTemplate="photoTemplate"
            alignment="center"
          ></dxi-column>

          <!-- 2. Item Code -->
          <dxi-column
            dataField="itemCode"
            caption="Item Code"
            [width]="120"
            cellTemplate="itemCodeTemplate"
          ></dxi-column>

          <!-- 3. Description -->
          <dxi-column
            dataField="description"
            caption="Description"
            [minWidth]="200"
          ></dxi-column>

          <!-- 4. Unit -->
          <dxi-column
            dataField="unit"
            caption="Unit"
            [width]="80"
            alignment="center"
          ></dxi-column>

          <!-- Grouping Reference Columns -->
          <dxi-column
            dataField="customerName"
            caption="Customer"
            [groupIndex]="customerGroupIndex()"
            [minWidth]="180"
          ></dxi-column>

          <dxi-column
            dataField="customerCategory"
            caption="Category"
            [groupIndex]="categoryGroupIndex()"
            [width]="130"
          ></dxi-column>

          <dxi-column
            dataField="brand"
            caption="Brand"
            [groupIndex]="brandGroupIndex()"
            [width]="120"
          ></dxi-column>

          <dxi-column
            dataField="invoiceNumber"
            caption="Invoice #"
            [width]="130"
          ></dxi-column>

          <dxi-column
            dataField="invoiceDate"
            caption="Date"
            dataType="date"
            format="yyyy-MM-dd"
            [width]="110"
          ></dxi-column>

          <!-- 5. Qty -->
          <dxi-column
            dataField="qty"
            caption="Qty"
            dataType="number"
            format="#,##0.00"
            [width]="95"
            alignment="right"
          ></dxi-column>

          <!-- 6. Cost (Unit) -->
          <dxi-column
            dataField="cost"
            caption="Cost"
            dataType="number"
            format="$#,##0.00"
            [width]="110"
            alignment="right"
          ></dxi-column>

          <!-- 7. Sale Amount -->
          <dxi-column
            dataField="saleAmount"
            caption="Sale Amount"
            dataType="number"
            format="$#,##0.00"
            [width]="130"
            alignment="right"
          ></dxi-column>

          <!-- 8. Gross Profit (Sale Amount - Total Cost) -->
          <dxi-column
            dataField="grossProfit"
            caption="Gross Profit"
            dataType="number"
            format="$#,##0.00"
            [width]="135"
            alignment="right"
            cellTemplate="grossProfitTemplate"
          ></dxi-column>

          <!-- Margin % -->
          <dxi-column
            dataField="marginPercent"
            caption="Margin %"
            dataType="number"
            format="##0.0'%'"
            [width]="100"
            alignment="right"
          ></dxi-column>

          <!-- Templates -->
          <div *dxTemplate="let data of 'photoTemplate'">
            <div class="report-thumb-wrapper" (click)="previewPhoto(data.value)">
              @if (data.value) {
                <img [src]="data.value" alt="Item" class="report-thumb-img" />
              } @else {
                <div class="report-thumb-empty">
                  <span class="material-symbols-outlined" style="font-size: 16px;">image</span>
                </div>
              }
            </div>
          </div>

          <div *dxTemplate="let data of 'itemCodeTemplate'">
            <span class="grid-code-badge">{{ data.value }}</span>
          </div>

          <div *dxTemplate="let data of 'grossProfitTemplate'">
            <span class="gross-profit-cell" [class.profit-positive]="data.value >= 0" [class.profit-negative]="data.value < 0">
              {{ data.text }}
            </span>
          </div>

          <!-- Total & Group Summaries -->
          <dxo-summary>
            <!-- Grand Totals -->
            <dxi-total-item
              column="itemCode"
              summaryType="count"
              displayFormat="Total Rows: {0}"
            ></dxi-total-item>
            <dxi-total-item
              column="qty"
              summaryType="sum"
              valueFormat="#,##0.00"
              displayFormat="Qty: {0}"
            ></dxi-total-item>
            <dxi-total-item
              column="saleAmount"
              summaryType="sum"
              valueFormat="$#,##0.00"
              displayFormat="Revenue: {0}"
            ></dxi-total-item>
            <dxi-total-item
              column="grossProfit"
              summaryType="sum"
              valueFormat="$#,##0.00"
              displayFormat="Total Profit: {0}"
            ></dxi-total-item>

            <!-- Group Level Totals -->
            <dxi-group-item
              column="qty"
              summaryType="sum"
              valueFormat="#,##0.00"
              [showInGroupFooter]="true"
              displayFormat="Subtotal Qty: {0}"
            ></dxi-group-item>
            <dxi-group-item
              column="saleAmount"
              summaryType="sum"
              valueFormat="$#,##0.00"
              [showInGroupFooter]="true"
              displayFormat="Subtotal Sales: {0}"
            ></dxi-group-item>
            <dxi-group-item
              column="grossProfit"
              summaryType="sum"
              valueFormat="$#,##0.00"
              [showInGroupFooter]="true"
              displayFormat="Subtotal Profit: {0}"
            ></dxi-group-item>
          </dxo-summary>
        </dx-data-grid>
      </div>

      <!-- Lightbox Photo Viewer -->
      @if (zoomedPhoto()) {
        <div class="sms-modal-backdrop" (click)="zoomedPhoto.set(null)">
          <div class="lightbox-card" (click)="$event.stopPropagation()">
            <img [src]="zoomedPhoto()!" alt="Zoom" class="lightbox-img" />
            <button type="button" class="close-lightbox-btn" (click)="zoomedPhoto.set(null)">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .report-page {
      max-width: 1440px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
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

    .preset-chips-card {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
    }

    .preset-label {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: #60a5fa;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .chips-list {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .preset-chip {
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-full);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .preset-chip:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.08);
    }

    .preset-chip.active {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.45);
      color: #93c5fd;
      font-weight: 600;
    }

    .grid-card {
      padding: 1rem;
      border-radius: var(--radius-xl);
    }

    .report-thumb-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      overflow: hidden;
      margin: 0 auto;
      background: #17223b;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: transform 0.15s ease;
    }

    .report-thumb-wrapper:hover {
      transform: scale(1.15);
      border-color: #3b82f6;
    }

    .report-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .report-thumb-empty {
      color: var(--text-dim);
    }

    .grid-code-badge {
      font-family: monospace;
      font-weight: 700;
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.12);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.82rem;
    }

    .gross-profit-cell {
      font-family: monospace;
      font-weight: 700;
    }

    .profit-positive {
      color: #34d399;
    }

    .profit-negative {
      color: #f87171;
    }

    .lightbox-card {
      position: relative;
      max-width: 80vw;
      max-height: 80vh;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.9);
      border: 1px solid var(--border-medium);
      animation: scaleUp 0.2s ease-out;
    }

    .lightbox-img {
      max-width: 100%;
      max-height: 80vh;
      display: block;
      object-fit: contain;
    }

    .close-lightbox-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  `]
})
export class SalesReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);

  reportData = signal<SalesReportItem[]>([]);
  loading = signal(true);
  zoomedPhoto = signal<string | null>(null);

  // Grouping preset state
  activePreset = signal<string>('none');
  customerGroupIndex = signal<number | undefined>(undefined);
  categoryGroupIndex = signal<number | undefined>(undefined);
  brandGroupIndex = signal<number | undefined>(undefined);

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.reportService.getSalesReport().subscribe({
      next: data => {
        this.reportData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load sales report data.');
      }
    });
  }

  setPreset(preset: string): void {
    this.activePreset.set(preset);
    if (preset === 'none') {
      this.customerGroupIndex.set(undefined);
      this.categoryGroupIndex.set(undefined);
      this.brandGroupIndex.set(undefined);
    } else if (preset === 'customer') {
      this.customerGroupIndex.set(0);
      this.categoryGroupIndex.set(undefined);
      this.brandGroupIndex.set(undefined);
    } else if (preset === 'category') {
      this.categoryGroupIndex.set(0);
      this.brandGroupIndex.set(1);
      this.customerGroupIndex.set(undefined);
    } else if (preset === 'brand') {
      this.brandGroupIndex.set(0);
      this.customerGroupIndex.set(undefined);
      this.categoryGroupIndex.set(undefined);
    }
  }

  previewPhoto(photoUrl: string | null): void {
    if (photoUrl) {
      this.zoomedPhoto.set(photoUrl);
    }
  }
}
