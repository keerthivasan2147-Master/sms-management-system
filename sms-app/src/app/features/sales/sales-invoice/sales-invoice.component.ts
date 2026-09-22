import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SalesInvoiceService } from '../../../core/services/sales-invoice.service';
import { CustomerService } from '../../../core/services/customer.service';
import { ItemService } from '../../../core/services/item.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  SalesInvoice,
  SalesDetail,
  Customer,
  Item,
  SaveSalesInvoice,
  SaveSalesDetail,
  InvoiceSummary
} from '../../../core/models/models';

type ScreenMode = 'VIEW' | 'NEW' | 'EDIT';

@Component({
  selector: 'app-sales-invoice',
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="invoice-page">
      <!-- 1. TOP NAVIGATION BAR -->
      <div class="top-nav-bar-container">
        <div class="nav-bar-left">
          <div class="mode-pill" [ngClass]="mode().toLowerCase()">
            <span class="mode-dot"></span>
            <span class="mode-text">MODE: {{ mode() }}</span>
          </div>

          <div class="nav-counter">
            <span class="material-symbols-outlined">receipt</span>
            <span>Record {{ currentIndex() }} of {{ totalCount() }}</span>
          </div>
        </div>

        <div class="navigation-bar-buttons">
          <!-- Top Button -->
          <button
            type="button"
            class="nav-btn"
            [disabled]="isNavDisabled() || !hasPrior()"
            (click)="navigateTop()"
            title="First Invoice [Top]"
          >
            <span class="material-symbols-outlined">first_page</span>
            <span class="btn-label">Top</span>
          </button>

          <!-- Prior Button -->
          <button
            type="button"
            class="nav-btn"
            [disabled]="isNavDisabled() || !hasPrior()"
            (click)="navigatePrior()"
            title="Previous Invoice [Prior]"
          >
            <span class="material-symbols-outlined">chevron_left</span>
            <span class="btn-label">Prior</span>
          </button>

          <!-- Next Button -->
          <button
            type="button"
            class="nav-btn"
            [disabled]="isNavDisabled() || !hasNext()"
            (click)="navigateNext()"
            title="Next Invoice [Next]"
          >
            <span class="btn-label">Next</span>
            <span class="material-symbols-outlined">chevron_right</span>
          </button>

          <!-- Bottom Button -->
          <button
            type="button"
            class="nav-btn"
            [disabled]="isNavDisabled() || !hasNext()"
            (click)="navigateBottom()"
            title="Latest Invoice [Bottom]"
          >
            <span class="btn-label">Bottom</span>
            <span class="material-symbols-outlined">last_page</span>
          </button>

          <div class="nav-divider"></div>

          <!-- Search Button -->
          <button
            type="button"
            class="nav-btn search-btn"
            [disabled]="isNavDisabled()"
            (click)="openSearchModal()"
            title="Search Invoices"
          >
            <span class="material-symbols-outlined">search</span>
            <span class="btn-label">Search</span>
          </button>

          <!-- List Button -->
          <button
            type="button"
            class="nav-btn list-btn"
            [disabled]="isNavDisabled()"
            (click)="openListModal()"
            title="Browse All Invoices [List]"
          >
            <span class="material-symbols-outlined">format_list_bulleted</span>
            <span class="btn-label">List</span>
          </button>
        </div>
      </div>

      <!-- MAIN INVOICE FORM -->
      @if (loading() && !invoiceData) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading sales invoice...</p>
        </div>
      } @else {
        <div class="invoice-form-container">
          <!-- Header Card -->
          <div class="sms-card header-card">
            <div class="sms-card-header">
              <div class="sms-card-title">
                <span class="material-symbols-outlined" style="color: #60a5fa;">receipt_long</span>
                <span>Invoice Header Information</span>
              </div>
              <div class="header-badges">
                <span class="invoice-badge">{{ invoiceData.invoiceNumber || 'NEW INVOICE' }}</span>
              </div>
            </div>

            <div class="header-fields-grid">
              <!-- Invoice Type -->
              <div class="form-group">
                <label for="invoiceType">Invoice Type *</label>
                <select
                  id="invoiceType"
                  class="sms-select"
                  [(ngModel)]="invoiceData.invoiceType"
                  [disabled]="mode() === 'VIEW'"
                >
                  <option value="Tax Invoice">Tax Invoice</option>
                  <option value="Cash Invoice">Cash Invoice</option>
                  <option value="Proforma Invoice">Proforma Invoice</option>
                </select>
              </div>

              <!-- Invoice Number -->
              <div class="form-group">
                <label for="invoiceNo">Invoice Number (PK) *</label>
                <input
                  type="text"
                  id="invoiceNo"
                  class="sms-input font-mono font-bold"
                  [(ngModel)]="invoiceData.invoiceNumber"
                  [disabled]="mode() === 'VIEW' || mode() === 'EDIT'"
                  placeholder="e.g. INV-2026-0001"
                />
              </div>

              <!-- Invoice Date -->
              <div class="form-group">
                <label for="invoiceDate">Date *</label>
                <input
                  type="date"
                  id="invoiceDate"
                  class="sms-input"
                  [(ngModel)]="invoiceData.date"
                  [disabled]="mode() === 'VIEW'"
                />
              </div>

              <!-- Customer Searchable Dropdown -->
              <div class="form-group customer-select-group">
                <label for="customerSelect">Customer (Searchable) *</label>
                <select
                  id="customerSelect"
                  class="sms-select"
                  [(ngModel)]="invoiceData.customer"
                  (change)="onCustomerSelected()"
                  [disabled]="mode() === 'VIEW'"
                >
                  <option value="" disabled>-- Select Customer --</option>
                  @for (cust of customers(); track cust.code) {
                    <option [value]="cust.code">
                      {{ cust.code }} - {{ cust.name }} ({{ cust.category }})
                    </option>
                  }
                </select>
              </div>

              <!-- Invoice Description / Remarks -->
              <div class="form-group full-width">
                <label for="invoiceDesc">Invoice Description / Remarks</label>
                <input
                  type="text"
                  id="invoiceDesc"
                  class="sms-input"
                  [(ngModel)]="invoiceData.invoiceDescription"
                  [disabled]="mode() === 'VIEW'"
                  placeholder="e.g. Monthly batch order for regional office replenishment"
                />
              </div>
            </div>

            <!-- Customer Details Preview Banner -->
            @if (selectedCustomer(); as cust) {
              <div class="customer-preview-banner">
                <div class="preview-item">
                  <span class="preview-lbl">Customer:</span>
                  <strong>{{ cust.name }}</strong>
                </div>
                <div class="preview-item">
                  <span class="preview-lbl">Category:</span>
                  <span class="sms-badge sms-badge-primary">{{ cust.category }}</span>
                </div>
                <div class="preview-item">
                  <span class="preview-lbl">Contact:</span>
                  <span>{{ cust.mobile }} | {{ cust.email }}</span>
                </div>
                <div class="preview-item">
                  <span class="preview-lbl">Address:</span>
                  <span class="preview-addr" title="{{ cust.address }}">{{ cust.address }}</span>
                </div>
              </div>
            }
          </div>

          <!-- Line Items Grid Card -->
          <div class="sms-card line-items-card">
            <div class="sms-card-header">
              <div class="sms-card-title">
                <span class="material-symbols-outlined" style="color: #34d399;">table_rows</span>
                <span>Line Items Grid</span>
              </div>

              @if (mode() !== 'VIEW') {
                <button
                  type="button"
                  class="sms-btn sms-btn-primary add-row-btn"
                  (click)="addLineItem()"
                >
                  <span class="material-symbols-outlined">add</span>
                  <span>Add Line Item</span>
                </button>
              }
            </div>

            <div class="table-responsive">
              <table class="grid-table">
                <thead>
                  <tr>
                    <th class="col-idx">#</th>
                    <th class="col-item">Item Code *</th>
                    <th class="col-desc">Description (Read-only)</th>
                    <th class="col-unit">Unit (Read-only)</th>
                    <th class="col-qty text-right">Qty *</th>
                    <th class="col-price text-right">Price ($) *</th>
                    <th class="col-amount text-right">Amount ($)</th>
                    @if (mode() !== 'VIEW') {
                      <th class="col-action text-center">Action</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @if (invoiceData.details.length === 0) {
                    <tr>
                      <td [attr.colspan]="mode() !== 'VIEW' ? 8 : 7" class="empty-rows-cell">
                        No line items added yet. Click "Add Line Item" to begin entering transaction lines.
                      </td>
                    </tr>
                  }
                  @for (row of invoiceData.details; track $index; let idx = $index) {
                    <tr>
                      <!-- Row Index -->
                      <td class="col-idx font-mono">{{ idx + 1 }}</td>

                      <!-- Item Code Dropdown -->
                      <td class="col-item">
                        @if (mode() === 'VIEW') {
                          <span class="item-code-chip">{{ row.itemCode }}</span>
                        } @else {
                          <select
                            class="sms-select item-select"
                            [(ngModel)]="row.itemCode"
                            (change)="onItemCodeChanged(row)"
                          >
                            <option value="" disabled>-- Select Item --</option>
                            @for (item of items(); track item.code) {
                              <option [value]="item.code">
                                {{ item.code }} - {{ item.description }} ({{ item.unit }})
                              </option>
                            }
                          </select>
                        }
                      </td>

                      <!-- Description (Read-only) -->
                      <td class="col-desc">
                        <span class="readonly-text" title="{{ row.description }}">{{ row.description || '-' }}</span>
                      </td>

                      <!-- Unit (Read-only) -->
                      <td class="col-unit">
                        <span class="unit-badge">{{ row.unit || '-' }}</span>
                      </td>

                      <!-- Qty -->
                      <td class="col-qty text-right">
                        @if (mode() === 'VIEW') {
                          <span class="font-mono font-bold">{{ row.qty | number:'1.2-2' }}</span>
                        } @else {
                          <input
                            type="number"
                            class="sms-input grid-num-input text-right"
                            [(ngModel)]="row.qty"
                            (ngModelChange)="onRowQtyOrPriceChanged(row)"
                            min="0.01"
                            step="1"
                          />
                        }
                      </td>

                      <!-- Price -->
                      <td class="col-price text-right">
                        @if (mode() === 'VIEW') {
                          <span class="font-mono font-bold">{{ row.price | currency:'USD':'symbol':'1.2-2' }}</span>
                        } @else {
                          <input
                            type="number"
                            class="sms-input grid-num-input text-right"
                            [(ngModel)]="row.price"
                            (ngModelChange)="onRowQtyOrPriceChanged(row)"
                            min="0.01"
                            step="0.01"
                          />
                        }
                      </td>

                      <!-- Amount (Qty x Price Auto-Calculated) -->
                      <td class="col-amount text-right font-mono font-bold text-accent">
                        {{ row.amount | currency:'USD':'symbol':'1.2-2' }}
                      </td>

                      <!-- Row Remove Action -->
                      @if (mode() !== 'VIEW') {
                        <td class="col-action text-center">
                          <button
                            type="button"
                            class="remove-row-btn"
                            (click)="removeLineItem(idx)"
                            title="Remove Line"
                          >
                            <span class="material-symbols-outlined">close</span>
                          </button>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Invoice Totals Box -->
            <div class="invoice-summary-bar">
              <div class="summary-left">
                <span class="summary-stat">
                  Items: <strong>{{ invoiceData.details.length }}</strong>
                </span>
                <span class="summary-stat">
                  Total Quantity: <strong>{{ totalQuantity() | number:'1.2-2' }}</strong>
                </span>
              </div>

              <div class="summary-right">
                <span class="total-label">Invoice Grand Total:</span>
                <span class="grand-total-amount">
                  {{ invoiceGrandTotal() | currency:'USD':'symbol':'1.2-2' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- 2. BOTTOM UPDATION BAR -->
      <div class="bottom-updation-bar-container">
        <div class="updation-bar-left">
          <span class="updation-hint">
            @if (mode() === 'VIEW') {
              Click <strong>[Add]</strong> for new transaction or <strong>[Edit]</strong> to modify.
            } @else {
              Editing transaction. Click <strong>[Save]</strong> to commit or <strong>[Cancel]</strong> to abort.
            }
          </span>
        </div>

        <div class="updation-bar-buttons">
          <!-- Add Button -->
          <button
            type="button"
            class="update-btn add-btn"
            [disabled]="mode() !== 'VIEW'"
            (click)="onAdd()"
            title="Create New Invoice [Add]"
          >
            <span class="material-symbols-outlined">add_circle</span>
            <span class="btn-text">Add</span>
          </button>

          <!-- Edit Button -->
          <button
            type="button"
            class="update-btn edit-btn"
            [disabled]="mode() !== 'VIEW' || !invoiceData.invoiceNumber"
            (click)="onEdit()"
            title="Edit Current Invoice [Edit]"
          >
            <span class="material-symbols-outlined">edit</span>
            <span class="btn-text">Edit</span>
          </button>

          <!-- Delete Button -->
          <button
            type="button"
            class="update-btn delete-btn"
            [disabled]="mode() !== 'VIEW' || !invoiceData.invoiceNumber"
            (click)="onDelete()"
            title="Delete Current Invoice [Delete]"
          >
            <span class="material-symbols-outlined">delete</span>
            <span class="btn-text">Delete</span>
          </button>

          <div class="btn-separator"></div>

          <!-- Save Button -->
          <button
            type="button"
            class="update-btn save-btn"
            [disabled]="mode() === 'VIEW' || isSaving()"
            (click)="onSave()"
            title="Save Invoice Transaction [Save]"
          >
            <span class="material-symbols-outlined">save</span>
            <span class="btn-text">{{ isSaving() ? 'Saving...' : 'Save' }}</span>
          </button>

          <!-- Cancel Button -->
          <button
            type="button"
            class="update-btn cancel-btn"
            [disabled]="mode() === 'VIEW'"
            (click)="onCancel()"
            title="Discard Changes [Cancel]"
          >
            <span class="material-symbols-outlined">cancel</span>
            <span class="btn-text">Cancel</span>
          </button>
        </div>
      </div>

      <!-- SEARCH MODAL -->
      @if (showSearchModal()) {
        <div class="sms-modal-backdrop" (click)="showSearchModal.set(false)">
          <div class="sms-modal-card search-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <span class="material-symbols-outlined modal-icon">search</span>
                <h2>Search Sales Invoices</h2>
              </div>
              <button type="button" class="close-modal-btn" (click)="showSearchModal.set(false)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="search-modal-body">
              <div class="modal-search-bar">
                <input
                  type="text"
                  class="sms-input"
                  placeholder="Search by Invoice No, Customer, Remarks..."
                  [(ngModel)]="searchFilterQuery"
                  (keyup.enter)="executeSearch()"
                />
                <button type="button" class="sms-btn sms-btn-primary" (click)="executeSearch()">
                  Search
                </button>
              </div>

              <div class="search-results-list">
                @if (searching()) {
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Searching invoices...</p>
                  </div>
                } @else if (searchResults().length === 0) {
                  <div class="empty-state">
                    <p>No invoices matched the search criteria.</p>
                  </div>
                } @else {
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th class="text-right">Amount</th>
                        <th class="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of searchResults(); track item.invoiceNumber) {
                        <tr class="clickable-row" (click)="selectInvoiceFromModal(item.invoiceNumber)">
                          <td><strong>{{ item.invoiceNumber }}</strong></td>
                          <td>{{ item.date }}</td>
                          <td>{{ item.customerName }}</td>
                          <td class="text-right font-mono">{{ item.totalAmount | currency:'USD':'symbol':'1.2-2' }}</td>
                          <td class="text-center">
                            <button type="button" class="sms-btn sms-btn-outline btn-xs">
                              Select
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- LIST MODAL (All Invoices Browser) -->
      @if (showListModal()) {
        <div class="sms-modal-backdrop" (click)="showListModal.set(false)">
          <div class="sms-modal-card list-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <span class="material-symbols-outlined modal-icon">format_list_bulleted</span>
                <h2>Invoice Registry List</h2>
              </div>
              <button type="button" class="close-modal-btn" (click)="showListModal.set(false)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="list-modal-body">
              <div class="table-responsive modal-table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Customer Name</th>
                      <th class="text-right">Lines</th>
                      <th class="text-right">Total Amount</th>
                      <th class="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (inv of allInvoicesList(); track inv.invoiceNumber) {
                      <tr
                        class="clickable-row"
                        [class.active-row]="inv.invoiceNumber === invoiceData.invoiceNumber"
                        (click)="selectInvoiceFromModal(inv.invoiceNumber)"
                      >
                        <td><strong>{{ inv.invoiceNumber }}</strong></td>
                        <td><span class="sms-badge sms-badge-neutral">{{ inv.invoiceType }}</span></td>
                        <td>{{ inv.date }}</td>
                        <td>{{ inv.customerName }}</td>
                        <td class="text-right">{{ inv.totalItems }}</td>
                        <td class="text-right font-mono font-bold">{{ inv.totalAmount | currency:'USD':'symbol':'1.2-2' }}</td>
                        <td class="text-center">
                          <button type="button" class="sms-btn sms-btn-primary btn-xs">
                            Load
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .invoice-page {
      max-width: 1440px;
      margin: 0 auto;
      padding: 1.5rem 1.5rem 6rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      position: relative;
    }

    /* 1. TOP NAVIGATION BAR */
    .top-nav-bar-container {
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-xl);
      padding: 0.75rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }

    .nav-bar-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .mode-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-full);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .mode-pill.view {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.35);
      color: #60a5fa;
    }

    .mode-pill.new {
      background: rgba(16, 185, 129, 0.18);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      animation: pulseGlow 1.8s infinite;
    }

    .mode-pill.edit {
      background: rgba(245, 158, 11, 0.18);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      animation: pulseGlow 1.8s infinite;
    }

    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
      50% { box-shadow: 0 0 12px 2px rgba(245, 158, 11, 0.4); }
    }

    .mode-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .nav-counter {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .navigation-bar-buttons {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .nav-btn:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.35);
      color: #60a5fa;
      transform: translateY(-1px);
    }

    .nav-btn:disabled {
      opacity: 0.38;
      cursor: not-allowed;
    }

    .nav-btn .material-symbols-outlined {
      font-size: 18px;
    }

    .nav-divider {
      width: 1px;
      height: 24px;
      background: var(--border-subtle);
      margin: 0 0.3rem;
    }

    .search-btn:hover:not(:disabled) {
      background: rgba(99, 102, 241, 0.18);
      border-color: rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
    }

    .list-btn:hover:not(:disabled) {
      background: rgba(6, 182, 212, 0.18);
      border-color: rgba(6, 182, 212, 0.4);
      color: #38bdf8;
    }

    /* INVOICE FORM */
    .invoice-form-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header-card {
      padding: 1.5rem;
    }

    .invoice-badge {
      font-family: monospace;
      font-weight: 800;
      font-size: 1.05rem;
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.35);
      padding: 0.3rem 0.75rem;
      border-radius: var(--radius-sm);
    }

    .header-fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 2fr;
      gap: 1.25rem;
    }

    .customer-select-group {
      grid-column: span 1;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .customer-preview-banner {
      margin-top: 1.25rem;
      padding: 0.85rem 1.25rem;
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.85rem;
    }

    .preview-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .preview-lbl {
      color: var(--text-muted);
    }

    .preview-addr {
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* LINE ITEMS GRID */
    .line-items-card {
      padding: 1.5rem;
    }

    .add-row-btn {
      padding: 0.45rem 0.9rem;
      font-size: 0.82rem;
    }

    .grid-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .grid-table th {
      padding: 0.85rem 0.75rem;
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-medium);
      background: rgba(30, 41, 59, 0.5);
    }

    .grid-table td {
      padding: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      vertical-align: middle;
      font-size: 0.9rem;
    }

    .col-idx { width: 45px; text-align: center; color: var(--text-dim); }
    .col-item { width: 280px; }
    .col-desc { min-width: 220px; }
    .col-unit { width: 100px; text-align: center; }
    .col-qty { width: 130px; }
    .col-price { width: 140px; }
    .col-amount { width: 140px; }
    .col-action { width: 60px; }

    .item-select {
      font-size: 0.85rem;
      padding: 0.45rem 0.65rem;
    }

    .item-code-chip {
      font-family: monospace;
      font-weight: 700;
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }

    .readonly-text {
      color: #e2e8f0;
      display: block;
      max-width: 300px;
      white-space: normal;
    }

    .unit-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      background: rgba(148, 163, 184, 0.12);
      border-radius: 4px;
      font-size: 0.78rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .grid-num-input {
      padding: 0.45rem 0.65rem;
      font-family: monospace;
      font-weight: 600;
    }

    .remove-row-btn {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .remove-row-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      transform: scale(1.08);
    }

    .remove-row-btn .material-symbols-outlined {
      font-size: 16px;
    }

    .empty-rows-cell {
      text-align: center;
      padding: 2.5rem;
      color: var(--text-dim);
      font-style: italic;
    }

    .invoice-summary-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 0 0;
      margin-top: 1rem;
      border-top: 2px solid var(--border-subtle);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .summary-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .summary-stat {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .summary-stat strong {
      color: var(--text-main);
      margin-left: 0.35rem;
    }

    .summary-right {
      display: flex;
      align-items: baseline;
      gap: 0.85rem;
    }

    .total-label {
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .grand-total-amount {
      font-family: var(--font-display);
      font-size: 1.95rem;
      font-weight: 800;
      color: #38bdf8;
      text-shadow: 0 0 20px rgba(56, 189, 248, 0.35);
    }

    /* 2. BOTTOM UPDATION BAR */
    .bottom-updation-bar-container {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(11, 15, 25, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--border-medium);
      padding: 0.85rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.7);
    }

    .updation-bar-left {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .updation-bar-left strong {
      color: #60a5fa;
    }

    .updation-bar-buttons {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .update-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      font-family: var(--font-body);
      font-weight: 700;
      font-size: 0.88rem;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all var(--transition-fast);
      user-select: none;
    }

    .update-btn:disabled {
      opacity: 0.32;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    .add-btn {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.35);
      color: #60a5fa;
    }
    .add-btn:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.3);
      transform: translateY(-2px);
    }

    .edit-btn {
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.35);
      color: #fbbf24;
    }
    .edit-btn:hover:not(:disabled) {
      background: rgba(245, 158, 11, 0.3);
      transform: translateY(-2px);
    }

    .delete-btn {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.35);
      color: #f87171;
    }
    .delete-btn:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.3);
      transform: translateY(-2px);
    }

    .btn-separator {
      width: 2px;
      height: 28px;
      background: var(--border-medium);
      margin: 0 0.4rem;
    }

    .save-btn {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }
    .save-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
    }

    .cancel-btn {
      background: var(--bg-elevated);
      border-color: var(--border-subtle);
      color: var(--text-main);
    }
    .cancel-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    /* MODAL STYLES */
    .search-modal, .list-modal {
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .modal-icon {
      color: #60a5fa;
      font-size: 24px;
    }

    .close-modal-btn {
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.3rem;
      border-radius: var(--radius-sm);
    }

    .close-modal-btn:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.1);
    }

    .search-modal-body, .list-modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-height: 70vh;
      overflow-y: auto;
    }

    .modal-search-bar {
      display: flex;
      gap: 0.75rem;
    }

    .clickable-row {
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .clickable-row:hover td {
      background: rgba(59, 130, 246, 0.12) !important;
    }

    .active-row td {
      background: rgba(59, 130, 246, 0.18) !important;
    }

    .btn-xs {
      padding: 0.35rem 0.65rem;
      font-size: 0.78rem;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
      gap: 0.75rem;
      text-align: center;
    }

    .spinner {
      width: 32px;
      height: 32px;
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
export class SalesInvoiceComponent implements OnInit {
  private invoiceService = inject(SalesInvoiceService);
  private customerService = inject(CustomerService);
  private itemService = inject(ItemService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);

  mode = signal<ScreenMode>('VIEW');
  loading = signal(true);
  isSaving = signal(false);

  // Navigation state signals
  hasPrior = signal(false);
  hasNext = signal(false);
  currentIndex = signal(0);
  totalCount = signal(0);

  // Reference data
  customers = signal<Customer[]>([]);
  items = signal<Item[]>([]);

  // Search & List modal states
  showSearchModal = signal(false);
  showListModal = signal(false);
  searchFilterQuery = '';
  searching = signal(false);
  searchResults = signal<InvoiceSummary[]>([]);
  allInvoicesList = signal<InvoiceSummary[]>([]);

  // Active invoice form data
  invoiceData: SalesInvoice = this.getEmptyInvoice();
  selectedCustomer = signal<Customer | null>(null);

  isNavDisabled = computed(() => this.mode() !== 'VIEW');

  totalQuantity = computed(() => {
    return this.invoiceData.details.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
  });

  invoiceGrandTotal = computed(() => {
    return this.invoiceData.details.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  });

  ngOnInit(): void {
    this.loadReferenceData();

    // Check query params for specific invoice request
    this.route.queryParams.subscribe(params => {
      if (params['invoice']) {
        this.loadInvoiceByNumber(params['invoice']);
      } else {
        this.loadInitialInvoice();
      }
    });
  }

  loadReferenceData(): void {
    this.customerService.getAll().subscribe({
      next: data => this.customers.set(data),
      error: () => this.notification.error('Failed to load customers.')
    });

    this.itemService.getAll().subscribe({
      next: data => this.items.set(data),
      error: () => this.notification.error('Failed to load items.')
    });
  }

  loadInitialInvoice(): void {
    this.loading.set(true);
    this.invoiceService.getTop().subscribe({
      next: res => {
        this.applyNavigationResult(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadInvoiceByNumber(invoiceNumber: string): void {
    this.loading.set(true);
    this.invoiceService.getByInvoiceNumber(invoiceNumber).subscribe({
      next: inv => {
        this.setInvoice(inv);
        // Also refresh navigation state relative to this invoice
        this.invoiceService.getPrior(invoiceNumber).subscribe(priorRes => {
          this.hasPrior.set(priorRes.hasPrior);
        });
        this.invoiceService.getNext(invoiceNumber).subscribe(nextRes => {
          this.hasNext.set(nextRes.hasNext);
          this.currentIndex.set(nextRes.currentIndex - (nextRes.hasNext ? 1 : 0) || 1);
          this.totalCount.set(nextRes.totalCount);
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadInitialInvoice();
      }
    });
  }

  // Navigation Bar Actions
  navigateTop(): void {
    if (this.isNavDisabled()) return;
    this.loading.set(true);
    this.invoiceService.getTop().subscribe({
      next: res => this.applyNavigationResult(res),
      error: () => this.loading.set(false)
    });
  }

  navigatePrior(): void {
    if (this.isNavDisabled() || !this.invoiceData.invoiceNumber) return;
    this.loading.set(true);
    this.invoiceService.getPrior(this.invoiceData.invoiceNumber).subscribe({
      next: res => this.applyNavigationResult(res),
      error: () => this.loading.set(false)
    });
  }

  navigateNext(): void {
    if (this.isNavDisabled() || !this.invoiceData.invoiceNumber) return;
    this.loading.set(true);
    this.invoiceService.getNext(this.invoiceData.invoiceNumber).subscribe({
      next: res => this.applyNavigationResult(res),
      error: () => this.loading.set(false)
    });
  }

  navigateBottom(): void {
    if (this.isNavDisabled()) return;
    this.loading.set(true);
    this.invoiceService.getBottom().subscribe({
      next: res => this.applyNavigationResult(res),
      error: () => this.loading.set(false)
    });
  }

  openSearchModal(): void {
    if (this.isNavDisabled()) return;
    this.searchFilterQuery = '';
    this.searchResults.set([]);
    this.showSearchModal.set(true);
    this.executeSearch();
  }

  executeSearch(): void {
    this.searching.set(true);
    this.invoiceService.search(this.searchFilterQuery).subscribe({
      next: list => {
        this.searchResults.set(list);
        this.searching.set(false);
      },
      error: () => this.searching.set(false)
    });
  }

  openListModal(): void {
    if (this.isNavDisabled()) return;
    this.showListModal.set(true);
    this.invoiceService.getAllSummaries().subscribe({
      next: list => this.allInvoicesList.set(list),
      error: () => this.notification.error('Failed to load invoice list.')
    });
  }

  selectInvoiceFromModal(invoiceNumber: string): void {
    this.showSearchModal.set(false);
    this.showListModal.set(false);
    this.loadInvoiceByNumber(invoiceNumber);
  }

  // Updation Bar Actions
  onAdd(): void {
    this.mode.set('NEW');
    this.invoiceData = this.getEmptyInvoice();
    this.selectedCustomer.set(null);

    // Auto-generate next invoice number
    this.invoiceService.getNextNumber('INV').subscribe({
      next: res => {
        this.invoiceData.invoiceNumber = res.nextNumber;
        this.addLineItem(); // Start with 1 empty line item
      },
      error: () => {
        this.invoiceData.invoiceNumber = `INV-${new Date().getFullYear()}-9999`;
        this.addLineItem();
      }
    });

    this.notification.info('New invoice mode activated. Enter details and click Save.');
  }

  onEdit(): void {
    if (!this.invoiceData.invoiceNumber) return;
    this.mode.set('EDIT');
    this.notification.info(`Editing invoice ${this.invoiceData.invoiceNumber}.`);
  }

  onDelete(): void {
    if (!this.invoiceData.invoiceNumber) return;

    if (!confirm(`Are you sure you want to delete invoice ${this.invoiceData.invoiceNumber}? This action cannot be undone.`)) {
      return;
    }

    this.invoiceService.delete(this.invoiceData.invoiceNumber).subscribe({
      next: () => {
        this.notification.success(`Invoice ${this.invoiceData.invoiceNumber} deleted.`);
        this.navigatePrior();
      },
      error: err => {
        this.notification.error(err.error?.message || 'Failed to delete invoice.');
      }
    });
  }

  onSave(): void {
    // Validation
    if (!this.invoiceData.invoiceNumber) {
      this.notification.error('Invoice number is required.');
      return;
    }
    if (!this.invoiceData.customer) {
      this.notification.error('Please select a customer.');
      return;
    }
    if (this.invoiceData.details.length === 0) {
      this.notification.error('Invoice must contain at least one line item.');
      return;
    }

    for (let i = 0; i < this.invoiceData.details.length; i++) {
      const row = this.invoiceData.details[i];
      if (!row.itemCode) {
        this.notification.error(`Line #${i + 1}: Please select an item.`);
        return;
      }
      if (row.qty <= 0) {
        this.notification.error(`Line #${i + 1}: Quantity must be greater than 0.`);
        return;
      }
      if (row.price <= 0) {
        this.notification.error(`Line #${i + 1}: Price must be greater than 0.`);
        return;
      }
    }

    const payload: SaveSalesInvoice = {
      invoiceNumber: this.invoiceData.invoiceNumber.trim(),
      invoiceType: this.invoiceData.invoiceType,
      date: this.invoiceData.date,
      customer: this.invoiceData.customer,
      invoiceDescription: this.invoiceData.invoiceDescription,
      details: this.invoiceData.details.map(d => ({
        itemCode: d.itemCode,
        qty: Number(d.qty),
        price: Number(d.price)
      }))
    };

    this.isSaving.set(true);

    if (this.mode() === 'NEW') {
      this.invoiceService.create(payload).subscribe({
        next: saved => {
          this.isSaving.set(false);
          this.mode.set('VIEW');
          this.setInvoice(saved);
          this.notification.success(`Invoice ${saved.invoiceNumber} saved successfully.`);
          this.loadInvoiceByNumber(saved.invoiceNumber);
        },
        error: err => {
          this.isSaving.set(false);
          this.notification.error(err.error?.message || 'Failed to save new invoice.');
        }
      });
    } else if (this.mode() === 'EDIT') {
      this.invoiceService.update(this.invoiceData.invoiceNumber, payload).subscribe({
        next: saved => {
          this.isSaving.set(false);
          this.mode.set('VIEW');
          this.setInvoice(saved);
          this.notification.success(`Invoice ${saved.invoiceNumber} updated successfully.`);
          this.loadInvoiceByNumber(saved.invoiceNumber);
        },
        error: err => {
          this.isSaving.set(false);
          this.notification.error(err.error?.message || 'Failed to update invoice.');
        }
      });
    }
  }

  onCancel(): void {
    this.mode.set('VIEW');
    this.notification.info('Changes discarded.');
    if (this.invoiceData.invoiceNumber) {
      this.loadInvoiceByNumber(this.invoiceData.invoiceNumber);
    } else {
      this.loadInitialInvoice();
    }
  }

  // Line Item Grid Handlers
  addLineItem(): void {
    const newDetail: SalesDetail = {
      invoiceType: this.invoiceData.invoiceType,
      invoiceNumber: this.invoiceData.invoiceNumber,
      itemCode: '',
      description: '',
      unit: '',
      qty: 1,
      price: 0,
      amount: 0
    };
    this.invoiceData.details.push(newDetail);
  }

  removeLineItem(index: number): void {
    this.invoiceData.details.splice(index, 1);
  }

  onItemCodeChanged(row: SalesDetail): void {
    const item = this.items().find(i => i.code === row.itemCode);
    if (item) {
      row.description = item.description;
      row.unit = item.unit;
      row.price = item.salesPrice;
      row.amount = Math.round(row.qty * row.price * 100) / 100;
    }
  }

  onRowQtyOrPriceChanged(row: SalesDetail): void {
    row.amount = Math.round((Number(row.qty) || 0) * (Number(row.price) || 0) * 100) / 100;
  }

  onCustomerSelected(): void {
    const cust = this.customers().find(c => c.code === this.invoiceData.customer);
    this.selectedCustomer.set(cust || null);
  }

  private applyNavigationResult(res: { invoice: SalesInvoice | null; hasPrior: boolean; hasNext: boolean; currentIndex: number; totalCount: number }): void {
    this.loading.set(false);
    this.hasPrior.set(res.hasPrior);
    this.hasNext.set(res.hasNext);
    this.currentIndex.set(res.currentIndex);
    this.totalCount.set(res.totalCount);

    if (res.invoice) {
      this.setInvoice(res.invoice);
    }
  }

  private setInvoice(inv: SalesInvoice): void {
    this.invoiceData = {
      ...inv,
      details: inv.details.map(d => ({
        ...d,
        amount: Math.round(d.qty * d.price * 100) / 100
      }))
    };

    const cust = this.customers().find(c => c.code === inv.customer);
    this.selectedCustomer.set(cust || null);
  }

  private getEmptyInvoice(): SalesInvoice {
    const today = new Date().toISOString().split('T')[0];
    return {
      invoiceNumber: '',
      invoiceType: 'Tax Invoice',
      date: today,
      customer: '',
      invoiceDescription: '',
      totalAmount: 0,
      details: []
    };
  }
}
