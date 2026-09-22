import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../../core/services/item.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Item } from '../../../core/models/models';

@Component({
  selector: 'app-item-list',
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="master-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Item Master</h1>
          <p class="page-subtitle">Manage products, pricing tiers, unit specifications, and photo assets</p>
        </div>
        <button type="button" class="sms-btn sms-btn-primary" (click)="openAddModal()">
          <span class="material-symbols-outlined">add_box</span>
          <span>Add New Item</span>
        </button>
      </div>

      <!-- Search & Brand Filter Toolbar -->
      <div class="toolbar-card">
        <div class="search-wrap">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            class="sms-input search-input"
            placeholder="Search by code, description, brand, or supplier..."
            [(ngModel)]="searchQuery"
          />
        </div>

        <div class="brand-filters">
          <button
            type="button"
            class="sms-btn"
            [class.sms-btn-primary]="selectedBrand() === 'ALL'"
            [class.sms-btn-outline]="selectedBrand() !== 'ALL'"
            (click)="selectedBrand.set('ALL')"
          >
            All Brands ({{ items().length }})
          </button>
          @for (brand of uniqueBrands(); track brand) {
            <button
              type="button"
              class="sms-btn"
              [class.sms-btn-primary]="selectedBrand() === brand"
              [class.sms-btn-outline]="selectedBrand() !== brand"
              (click)="selectedBrand.set(brand)"
            >
              {{ brand }}
            </button>
          }
        </div>
      </div>

      <!-- Items Grid / Table -->
      <div class="sms-card table-card">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading items catalog...</p>
          </div>
        } @else if (filteredItems().length === 0) {
          <div class="empty-state">
            <span class="material-symbols-outlined empty-icon">inventory_2</span>
            <h3>No Items Found</h3>
            <p>Try clearing filters or add your first inventory item.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th>Brand</th>
                  <th>Unit</th>
                  <th class="text-right">Unit Cost</th>
                  <th class="text-right">Sales Price</th>
                  <th class="text-right">Margin %</th>
                  <th>Supplier</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filteredItems(); track item.code) {
                  <tr>
                    <!-- Photo Thumbnail -->
                    <td class="photo-cell">
                      <div class="thumbnail-wrapper" (click)="previewPhoto(item)">
                        @if (item.itemPhoto) {
                          <img [src]="item.itemPhoto" [alt]="item.description" class="item-thumb" />
                        } @else {
                          <div class="thumb-placeholder">
                            <span class="material-symbols-outlined">image</span>
                          </div>
                        }
                      </div>
                    </td>

                    <!-- Code -->
                    <td>
                      <span class="item-code-badge">{{ item.code }}</span>
                    </td>

                    <!-- Description -->
                    <td>
                      <strong class="item-desc-text">{{ item.description }}</strong>
                    </td>

                    <!-- Brand -->
                    <td>
                      <span class="sms-badge sms-badge-primary">{{ item.brand }}</span>
                    </td>

                    <!-- Unit -->
                    <td>
                      <span class="unit-tag">{{ item.unit }}</span>
                    </td>

                    <!-- Cost -->
                    <td class="text-right font-mono text-muted">
                      {{ item.cost | currency:'USD':'symbol':'1.2-2' }}
                    </td>

                    <!-- Sales Price -->
                    <td class="text-right font-mono font-bold text-accent">
                      {{ item.salesPrice | currency:'USD':'symbol':'1.2-2' }}
                    </td>

                    <!-- Margin % -->
                    <td class="text-right">
                      <span class="sms-badge sms-badge-success">
                        {{ getMargin(item) | number:'1.1-1' }}%
                      </span>
                    </td>

                    <!-- Supplier -->
                    <td class="supplier-cell" title="{{ item.supplier }}">{{ item.supplier }}</td>

                    <!-- Actions -->
                    <td class="text-center actions-cell">
                      <button
                        type="button"
                        class="action-btn edit-btn"
                        (click)="openEditModal(item)"
                        title="Edit Item"
                      >
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        class="action-btn delete-btn"
                        (click)="confirmDelete(item)"
                        title="Delete Item"
                      >
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Modal: Add / Edit Item with Photo Upload Preview -->
      @if (showModal()) {
        <div class="sms-modal-backdrop" (click)="closeModal()">
          <div class="sms-modal-card item-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <span class="material-symbols-outlined modal-icon">
                  {{ isEditing() ? 'edit_note' : 'add_photo_alternate' }}
                </span>
                <h2>{{ isEditing() ? 'Edit Product Item' : 'Create New Product Item' }}</h2>
              </div>
              <button type="button" class="close-modal-btn" (click)="closeModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form (ngSubmit)="saveItem()" class="modal-form">
              <div class="form-grid">
                <!-- Item Code -->
                <div class="form-group">
                  <label for="itemCode">Item Code *</label>
                  <input
                    type="text"
                    id="itemCode"
                    class="sms-input"
                    [(ngModel)]="formData.code"
                    name="code"
                    required
                    [disabled]="isEditing()"
                    placeholder="e.g. ITEM-113"
                  />
                </div>

                <!-- Unit -->
                <div class="form-group">
                  <label for="itemUnit">Unit of Measure *</label>
                  <select
                    id="itemUnit"
                    class="sms-select"
                    [(ngModel)]="formData.unit"
                    name="unit"
                    required
                  >
                    @for (u of units; track u) {
                      <option [value]="u">{{ u }}</option>
                    }
                  </select>
                </div>

                <!-- Description -->
                <div class="form-group full-width">
                  <label for="itemDesc">Item Description *</label>
                  <input
                    type="text"
                    id="itemDesc"
                    class="sms-input"
                    [(ngModel)]="formData.description"
                    name="description"
                    required
                    placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  />
                </div>

                <!-- Brand -->
                <div class="form-group">
                  <label for="itemBrand">Brand *</label>
                  <input
                    type="text"
                    id="itemBrand"
                    class="sms-input"
                    [(ngModel)]="formData.brand"
                    name="brand"
                    required
                    placeholder="e.g. Sony, Dell, Apple"
                  />
                </div>

                <!-- Supplier -->
                <div class="form-group">
                  <label for="itemSupplier">Supplier *</label>
                  <input
                    type="text"
                    id="itemSupplier"
                    class="sms-input"
                    [(ngModel)]="formData.supplier"
                    name="supplier"
                    required
                    placeholder="e.g. Prime Electronics Trade"
                  />
                </div>

                <!-- Cost -->
                <div class="form-group">
                  <label for="itemCost">Cost Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    id="itemCost"
                    class="sms-input"
                    [(ngModel)]="formData.cost"
                    name="cost"
                    required
                  />
                </div>

                <!-- Sales Price -->
                <div class="form-group">
                  <label for="itemPrice">Sales Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    id="itemPrice"
                    class="sms-input"
                    [(ngModel)]="formData.salesPrice"
                    name="salesPrice"
                    required
                  />
                </div>

                <!-- Live Margin Preview Banner -->
                <div class="form-group full-width">
                  <div class="margin-preview-banner">
                    <div class="margin-calc-info">
                      <span>Gross Profit per Unit: <strong>{{ (formData.salesPrice - formData.cost) | currency:'USD':'symbol':'1.2-2' }}</strong></span>
                      <span>Estimated Profit Margin: <strong>{{ getFormMargin() | number:'1.1-1' }}%</strong></span>
                    </div>
                  </div>
                </div>

                <!-- Photo Upload Section (Image Upload with Preview) -->
                <div class="form-group full-width">
                  <label>Product Photo (Upload with Live Preview)</label>
                  <div class="photo-upload-zone">
                    <!-- Photo Preview Box -->
                    <div class="photo-preview-box">
                      @if (formData.itemPhoto) {
                        <img [src]="formData.itemPhoto" alt="Preview" class="preview-img" />
                        <button
                          type="button"
                          class="remove-photo-btn"
                          (click)="removePhoto()"
                          title="Remove Photo"
                        >
                          <span class="material-symbols-outlined">delete</span>
                        </button>
                      } @else {
                        <div class="no-photo-box">
                          <span class="material-symbols-outlined">add_a_photo</span>
                          <span>No Photo Selected</span>
                        </div>
                      }
                    </div>

                    <!-- Upload Controls -->
                    <div class="upload-controls">
                      <label class="sms-btn sms-btn-secondary upload-file-btn">
                        <span class="material-symbols-outlined">upload_file</span>
                        <span>Upload Image File (Base64)</span>
                        <input
                          type="file"
                          accept="image/*"
                          (change)="onFileSelected($event)"
                          style="display: none;"
                        />
                      </label>
                      <p class="upload-hint">Supported formats: JPG, PNG, WEBP, GIF (Max 2MB)</p>
                      
                      <!-- Or Image URL input -->
                      <div class="url-input-wrap">
                        <span class="url-label">Or Image URL:</span>
                        <input
                          type="url"
                          class="sms-input url-input"
                          placeholder="https://images.unsplash.com/..."
                          [(ngModel)]="formData.itemPhoto"
                          name="itemPhoto"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="sms-btn sms-btn-outline" (click)="closeModal()">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="sms-btn sms-btn-primary"
                  [disabled]="isSaving() || !formData.code || !formData.description || formData.cost <= 0 || formData.salesPrice <= 0"
                >
                  @if (isSaving()) {
                    <span>Saving...</span>
                  } @else {
                    <span class="material-symbols-outlined">save</span>
                    <span>{{ isEditing() ? 'Update Item' : 'Save Item' }}</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Zoom Photo Lightbox -->
      @if (zoomedPhoto()) {
        <div class="sms-modal-backdrop" (click)="zoomedPhoto.set(null)">
          <div class="lightbox-card" (click)="$event.stopPropagation()">
            <img [src]="zoomedPhoto()!" alt="Zoomed Photo" class="lightbox-img" />
            <button type="button" class="close-lightbox-btn" (click)="zoomedPhoto.set(null)">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .master-page {
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

    .toolbar-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
    }

    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 280px;
      max-width: 480px;
    }

    .search-icon {
      position: absolute;
      left: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
      font-size: 20px;
      pointer-events: none;
    }

    .search-input {
      padding-left: 2.5rem;
    }

    .brand-filters {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .table-card {
      padding: 0;
      overflow: hidden;
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
      padding: 1rem 1.25rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(30, 41, 59, 0.5);
    }

    .data-table td {
      padding: 0.85rem 1.25rem;
      font-size: 0.9rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      vertical-align: middle;
    }

    .data-table tr:hover td {
      background: rgba(59, 130, 246, 0.05);
    }

    .photo-cell {
      width: 60px;
    }

    .thumbnail-wrapper {
      width: 46px;
      height: 46px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: #17223b;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: transform var(--transition-fast);
    }

    .thumbnail-wrapper:hover {
      transform: scale(1.1);
      border-color: #3b82f6;
    }

    .item-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-placeholder {
      color: var(--text-dim);
    }

    .item-code-badge {
      font-family: monospace;
      font-weight: 700;
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.12);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      border: 1px solid rgba(59, 130, 246, 0.25);
    }

    .item-desc-text {
      color: #f1f5f9;
      display: block;
      max-width: 260px;
      white-space: normal;
    }

    .unit-tag {
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.82rem;
    }

    .font-mono {
      font-family: monospace;
    }

    .font-bold {
      font-weight: 700;
    }

    .text-accent {
      color: #38bdf8;
    }

    .text-muted {
      color: var(--text-muted);
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .supplier-cell {
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-muted);
    }

    .actions-cell {
      white-space: nowrap;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;
      cursor: pointer;
      margin: 0 0.2rem;
      transition: all var(--transition-fast);
      background: transparent;
    }

    .edit-btn {
      color: #60a5fa;
    }

    .edit-btn:hover {
      background: rgba(59, 130, 246, 0.18);
      border-color: rgba(59, 130, 246, 0.4);
    }

    .delete-btn {
      color: #f87171;
    }

    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.18);
      border-color: rgba(239, 68, 68, 0.4);
    }

    /* Modal Styling */
    .item-modal {
      max-width: 720px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .modal-icon {
      color: #60a5fa;
      font-size: 26px;
    }

    .modal-header h2 {
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .close-modal-btn {
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.35rem;
      border-radius: var(--radius-sm);
    }

    .close-modal-btn:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.1);
    }

    .modal-form {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .margin-preview-banner {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
    }

    .margin-calc-info {
      display: flex;
      justify-content: space-between;
      color: #34d399;
      font-size: 0.88rem;
    }

    /* Photo Upload Area */
    .photo-upload-zone {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.25rem;
      background: rgba(30, 41, 59, 0.5);
      border: 1px dashed var(--border-medium);
      border-radius: var(--radius-lg);
    }

    .photo-preview-box {
      width: 110px;
      height: 110px;
      border-radius: var(--radius-md);
      overflow: hidden;
      background: #0f172a;
      border: 1px solid var(--border-subtle);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-photo-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      color: var(--text-dim);
      font-size: 0.72rem;
      text-align: center;
      padding: 0.5rem;
    }

    .remove-photo-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(239, 68, 68, 0.85);
      border: none;
      color: #ffffff;
      border-radius: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .remove-photo-btn .material-symbols-outlined {
      font-size: 16px;
    }

    .upload-controls {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .upload-file-btn {
      align-self: flex-start;
      cursor: pointer;
    }

    .upload-hint {
      font-size: 0.78rem;
      color: var(--text-dim);
    }

    .url-input-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.35rem;
    }

    .url-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .url-input {
      font-size: 0.82rem;
      padding: 0.45rem 0.75rem;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-subtle);
    }

    /* Lightbox */
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

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: var(--text-muted);
      gap: 0.75rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      color: var(--text-dim);
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
export class ItemListComponent implements OnInit {
  private itemService = inject(ItemService);
  private notification = inject(NotificationService);

  items = signal<Item[]>([]);
  loading = signal(true);
  searchQuery = '';
  selectedBrand = signal<string>('ALL');

  units = ['PCS', 'SET', 'BOX', 'KG', 'PKT', 'MTR'];

  showModal = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  zoomedPhoto = signal<string | null>(null);

  formData: Item = this.getEmptyItem();

  uniqueBrands = computed(() => {
    const set = new Set<string>();
    for (const item of this.items()) {
      if (item.brand) set.add(item.brand);
    }
    return Array.from(set).sort();
  });

  filteredItems = computed(() => {
    let list = this.items();
    const brand = this.selectedBrand();
    if (brand !== 'ALL') {
      list = list.filter(i => i.brand.toLowerCase() === brand.toLowerCase());
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(i =>
        i.code.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.supplier.toLowerCase().includes(q)
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);
    this.itemService.getAll().subscribe({
      next: data => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load item master data.');
      }
    });
  }

  openAddModal(): void {
    this.formData = this.getEmptyItem();
    const count = this.items().length + 101;
    this.formData.code = `ITEM-${count}`;
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  openEditModal(item: Item): void {
    this.formData = { ...item };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  previewPhoto(item: Item): void {
    if (item.itemPhoto) {
      this.zoomedPhoto.set(item.itemPhoto);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      this.notification.error('Image file size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.formData.itemPhoto = reader.result as string;
      this.notification.info('Photo uploaded and preview generated.');
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.formData.itemPhoto = null;
  }

  getMargin(item: Item): number {
    if (item.salesPrice <= 0) return 0;
    return ((item.salesPrice - item.cost) / item.salesPrice) * 100;
  }

  getFormMargin(): number {
    if (this.formData.salesPrice <= 0) return 0;
    return ((this.formData.salesPrice - this.formData.cost) / this.formData.salesPrice) * 100;
  }

  saveItem(): void {
    if (!this.formData.code || !this.formData.description) return;

    this.isSaving.set(true);
    if (this.isEditing()) {
      this.itemService.update(this.formData.code, this.formData).subscribe({
        next: updated => {
          this.isSaving.set(false);
          this.items.update(list => list.map(i => i.code === updated.code ? updated : i));
          this.notification.success(`Item '${updated.description}' updated successfully.`);
          this.closeModal();
        },
        error: err => {
          this.isSaving.set(false);
          this.notification.error(err.error?.message || 'Failed to update item.');
        }
      });
    } else {
      this.itemService.create(this.formData).subscribe({
        next: created => {
          this.isSaving.set(false);
          this.items.update(list => [created, ...list]);
          this.notification.success(`Item '${created.description}' created successfully.`);
          this.closeModal();
        },
        error: err => {
          this.isSaving.set(false);
          this.notification.error(err.error?.message || 'Failed to create item.');
        }
      });
    }
  }

  confirmDelete(item: Item): void {
    if (!confirm(`Are you sure you want to delete item "${item.description}" (${item.code})?`)) {
      return;
    }

    this.itemService.delete(item.code).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.code !== item.code));
        this.notification.success(`Item '${item.description}' deleted.`);
      },
      error: err => {
        this.notification.error(err.error?.message || 'Failed to delete item.');
      }
    });
  }

  private getEmptyItem(): Item {
    return {
      code: '',
      description: '',
      itemPhoto: null,
      cost: 100,
      salesPrice: 150,
      unit: 'PCS',
      brand: 'General',
      supplier: 'Standard Supplies'
    };
  }
}
