import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Customer } from '../../../core/models/models';

@Component({
  selector: 'app-customer-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="master-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Customer Master</h1>
          <p class="page-subtitle">Manage client accounts, contact directories, and customer classifications</p>
        </div>
        <button type="button" class="sms-btn sms-btn-primary" (click)="openAddModal()">
          <span class="material-symbols-outlined">person_add</span>
          <span>Add New Customer</span>
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="toolbar-card">
        <div class="search-wrap">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            class="sms-input search-input"
            placeholder="Search by code, name, email or phone..."
            [(ngModel)]="searchQuery"
          />
        </div>

        <div class="category-filters">
          <button
            type="button"
            class="sms-btn"
            [class.sms-btn-primary]="selectedCategory() === 'ALL'"
            [class.sms-btn-outline]="selectedCategory() !== 'ALL'"
            (click)="selectedCategory.set('ALL')"
          >
            All Categories ({{ customers().length }})
          </button>
          @for (cat of categories; track cat) {
            <button
              type="button"
              class="sms-btn"
              [class.sms-btn-primary]="selectedCategory() === cat"
              [class.sms-btn-outline]="selectedCategory() !== cat"
              (click)="selectedCategory.set(cat)"
            >
              {{ cat }}
            </button>
          }
        </div>
      </div>

      <!-- Customers Table -->
      <div class="sms-card table-card">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading customer directory...</p>
          </div>
        } @else if (filteredCustomers().length === 0) {
          <div class="empty-state">
            <span class="material-symbols-outlined empty-icon">group_off</span>
            <h3>No Customers Found</h3>
            <p>Try adjusting your search query or filter criteria, or add a new customer.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Customer Name</th>
                  <th>Category</th>
                  <th>Mobile Phone</th>
                  <th>Email Address</th>
                  <th>Address</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (c of filteredCustomers(); track c.code) {
                  <tr>
                    <td>
                      <span class="customer-code-badge">{{ c.code }}</span>
                    </td>
                    <td>
                      <div class="customer-name-cell">
                        <strong>{{ c.name }}</strong>
                      </div>
                    </td>
                    <td>
                      <span class="sms-badge" [ngClass]="getCategoryBadgeClass(c.category)">
                        {{ c.category }}
                      </span>
                    </td>
                    <td>
                      <span class="contact-text">{{ c.mobile }}</span>
                    </td>
                    <td>
                      <a href="mailto:{{ c.email }}" class="email-link">{{ c.email }}</a>
                    </td>
                    <td class="address-cell" title="{{ c.address }}">{{ c.address }}</td>
                    <td class="text-center actions-cell">
                      <button
                        type="button"
                        class="action-btn edit-btn"
                        (click)="openEditModal(c)"
                        title="Edit Customer"
                      >
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        class="action-btn delete-btn"
                        (click)="confirmDelete(c)"
                        title="Delete Customer"
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

      <!-- Modal: Add / Edit Customer -->
      @if (showModal()) {
        <div class="sms-modal-backdrop" (click)="closeModal()">
          <div class="sms-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <span class="material-symbols-outlined modal-icon">
                  {{ isEditing() ? 'edit' : 'person_add' }}
                </span>
                <h2>{{ isEditing() ? 'Edit Customer' : 'Create New Customer' }}</h2>
              </div>
              <button type="button" class="close-modal-btn" (click)="closeModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form (ngSubmit)="saveCustomer()" class="modal-form">
              <div class="form-grid">
                <!-- Customer Code -->
                <div class="form-group">
                  <label for="custCode">Customer Code *</label>
                  <input
                    type="text"
                    id="custCode"
                    class="sms-input"
                    [(ngModel)]="formData.code"
                    name="code"
                    required
                    [disabled]="isEditing()"
                    placeholder="e.g. CUST-011"
                  />
                </div>

                <!-- Category -->
                <div class="form-group">
                  <label for="custCategory">Category *</label>
                  <select
                    id="custCategory"
                    class="sms-select"
                    [(ngModel)]="formData.category"
                    name="category"
                    required
                  >
                    @for (cat of categories; track cat) {
                      <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                </div>

                <!-- Name -->
                <div class="form-group full-width">
                  <label for="custName">Full Name / Organization *</label>
                  <input
                    type="text"
                    id="custName"
                    class="sms-input"
                    [(ngModel)]="formData.name"
                    name="name"
                    required
                    placeholder="e.g. Apex Global Technologies LLC"
                  />
                </div>

                <!-- Email -->
                <div class="form-group">
                  <label for="custEmail">Email Address *</label>
                  <input
                    type="email"
                    id="custEmail"
                    class="sms-input"
                    [(ngModel)]="formData.email"
                    name="email"
                    required
                    placeholder="name@domain.com"
                  />
                </div>

                <!-- Mobile -->
                <div class="form-group">
                  <label for="custMobile">Mobile Phone *</label>
                  <input
                    type="text"
                    id="custMobile"
                    class="sms-input"
                    [(ngModel)]="formData.mobile"
                    name="mobile"
                    required
                    placeholder="+971-50-1234567"
                  />
                </div>

                <!-- Address -->
                <div class="form-group full-width">
                  <label for="custAddress">Physical Address *</label>
                  <textarea
                    id="custAddress"
                    class="sms-textarea"
                    rows="3"
                    [(ngModel)]="formData.address"
                    name="address"
                    required
                    placeholder="Office/Building, Street, City"
                  ></textarea>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="sms-btn sms-btn-outline" (click)="closeModal()">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="sms-btn sms-btn-primary"
                  [disabled]="isSaving() || !formData.code || !formData.name || !formData.email || !formData.mobile"
                >
                  @if (isSaving()) {
                    <span>Saving...</span>
                  } @else {
                    <span class="material-symbols-outlined">save</span>
                    <span>{{ isEditing() ? 'Update Customer' : 'Save Customer' }}</span>
                  }
                </button>
              </div>
            </form>
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

    .category-filters {
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
      padding: 1rem 1.25rem;
      font-size: 0.9rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: var(--text-main);
    }

    .data-table tr:hover td {
      background: rgba(59, 130, 246, 0.05);
    }

    .customer-code-badge {
      font-family: monospace;
      font-weight: 700;
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.12);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      border: 1px solid rgba(59, 130, 246, 0.25);
    }

    .customer-name-cell {
      font-weight: 600;
      color: #f1f5f9;
    }

    .email-link {
      color: #38bdf8;
      text-decoration: none;
    }

    .email-link:hover {
      text-decoration: underline;
    }

    .address-cell {
      max-width: 220px;
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

    /* Modal Styles */
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

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-subtle);
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
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private notification = inject(NotificationService);

  customers = signal<Customer[]>([]);
  loading = signal(true);
  searchQuery = '';
  selectedCategory = signal<string>('ALL');

  categories = ['Corporate', 'Retail', 'Wholesale', 'Distributor'];

  showModal = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);

  formData: Customer = this.getEmptyCustomer();

  filteredCustomers = computed(() => {
    let list = this.customers();
    const cat = this.selectedCategory();
    if (cat !== 'ALL') {
      list = list.filter(c => c.category.toLowerCase() === cat.toLowerCase());
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.customerService.getAll().subscribe({
      next: data => {
        this.customers.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load customer directory.');
      }
    });
  }

  openAddModal(): void {
    this.formData = this.getEmptyCustomer();
    // Auto suggest next code
    const count = this.customers().length + 1;
    this.formData.code = `CUST-${String(count).padStart(3, '0')}`;
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  openEditModal(customer: Customer): void {
    this.formData = { ...customer };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveCustomer(): void {
    if (!this.formData.code || !this.formData.name) return;

    this.isSaving.set(true);
    if (this.isEditing()) {
      this.customerService.update(this.formData.code, this.formData).subscribe({
        next: updated => {
          this.isSaving.set(false);
          this.customers.update(list => list.map(c => c.code === updated.code ? updated : c));
          this.notification.success(`Customer '${updated.name}' updated successfully.`);
          this.closeModal();
        },
        error: err => {
          this.isSaving.set(false);
          this.notification.error(err.error?.message || 'Failed to update customer.');
        }
      });
    } else {
      this.customerService.create(this.formData).subscribe({
        next: created => {
          this.isSaving.set(false);
          this.customers.update(list => [created, ...list]);
          this.notification.success(`Customer '${created.name}' created successfully.`);
          this.closeModal();
        },
        error: err => {
          this.isSaving.set(false);
          this.notification.error(err.error?.message || 'Failed to create customer.');
        }
      });
    }
  }

  confirmDelete(customer: Customer): void {
    if (!confirm(`Are you sure you want to delete customer "${customer.name}" (${customer.code})?`)) {
      return;
    }

    this.customerService.delete(customer.code).subscribe({
      next: () => {
        this.customers.update(list => list.filter(c => c.code !== customer.code));
        this.notification.success(`Customer '${customer.name}' deleted.`);
      },
      error: err => {
        this.notification.error(err.error?.message || 'Failed to delete customer.');
      }
    });
  }

  getCategoryBadgeClass(category: string): string {
    switch (category.toLowerCase()) {
      case 'corporate': return 'sms-badge-primary';
      case 'wholesale': return 'sms-badge-success';
      case 'distributor': return 'sms-badge-warning';
      case 'retail': return 'sms-badge-neutral';
      default: return 'sms-badge-neutral';
    }
  }

  private getEmptyCustomer(): Customer {
    return {
      code: '',
      name: '',
      address: '',
      mobile: '',
      email: '',
      category: 'Corporate'
    };
  }
}
