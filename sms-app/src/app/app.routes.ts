import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Login | Sales Management System'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Dashboard | Sales Management System'
  },
  {
    path: 'masters/customers',
    loadComponent: () =>
      import('./features/masters/customers/customer-list.component').then(m => m.CustomerListComponent),
    canActivate: [authGuard],
    title: 'Customer Master | Sales Management System'
  },
  {
    path: 'masters/items',
    loadComponent: () =>
      import('./features/masters/items/item-list.component').then(m => m.ItemListComponent),
    canActivate: [authGuard],
    title: 'Item Master | Sales Management System'
  },
  {
    path: 'sales/invoice',
    loadComponent: () =>
      import('./features/sales/sales-invoice/sales-invoice.component').then(m => m.SalesInvoiceComponent),
    canActivate: [authGuard],
    title: 'Sales Invoice Entry | Sales Management System'
  },
  {
    path: 'reports/sales',
    loadComponent: () =>
      import('./features/reports/sales-report/sales-report.component').then(m => m.SalesReportComponent),
    canActivate: [authGuard],
    title: 'Interactive Sales Report | Sales Management System'
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
