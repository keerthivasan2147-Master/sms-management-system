export interface User {
  userId: number;
  name: string;
  username: string;
  mobile: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  username: string;
  role: string;
  expiresAt: string;
}

export interface Customer {
  code: string;
  name: string;
  address: string;
  mobile: string;
  email: string;
  category: string;
  createdAt?: string;
}

export interface Item {
  code: string;
  description: string;
  itemPhoto?: string | null;
  cost: number;
  salesPrice: number;
  unit: string;
  brand: string;
  supplier: string;
  profitMargin?: number;
  createdAt?: string;
}

export interface SalesDetail {
  detailId?: number;
  invoiceType: string;
  invoiceNumber: string;
  itemCode: string;
  description: string;
  unit: string;
  itemPhoto?: string | null;
  cost?: number;
  qty: number;
  price: number;
  amount: number;
}

export interface SalesInvoice {
  invoiceNumber: string;
  invoiceType: string;
  date: string;
  customer: string; // Customer Code
  customerName?: string;
  customerCategory?: string;
  invoiceDescription?: string;
  totalAmount: number;
  createdAt?: string;
  details: SalesDetail[];
}

export interface SaveSalesDetail {
  itemCode: string;
  qty: number;
  price: number;
}

export interface SaveSalesInvoice {
  invoiceNumber: string;
  invoiceType: string;
  date: string;
  customer: string;
  invoiceDescription?: string;
  details: SaveSalesDetail[];
}

export interface InvoiceSummary {
  invoiceNumber: string;
  invoiceType: string;
  date: string;
  customer: string;
  customerName: string;
  totalAmount: number;
  totalItems: number;
}

export interface NavigationResult {
  invoice: SalesInvoice | null;
  hasPrior: boolean;
  hasNext: boolean;
  currentIndex: number;
  totalCount: number;
}

export interface SalesReportItem {
  detailId: number;
  invoiceNumber: string;
  invoiceType: string;
  invoiceDate: string;
  customerCode: string;
  customerName: string;
  customerCategory: string;
  itemCode: string;
  description: string;
  photo?: string | null;
  unit: string;
  brand: string;
  supplier: string;
  qty: number;
  price: number;
  saleAmount: number;
  cost: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
}

export interface DashboardKpis {
  totalSales: number;
  totalGrossProfit: number;
  overallProfitMargin: number;
  topSellingItem: string;
  topSellingItemQty: number;
  topSellingItemSales: number;
  totalInvoices: number;
  totalCustomers: number;
}

export interface SalesTrend {
  period: string;
  salesAmount: number;
  grossProfit: number;
  invoiceCount: number;
}

export interface CategorySales {
  category: string;
  salesAmount: number;
  grossProfit: number;
  percentage: number;
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  salesTrends: SalesTrend[];
  categoryBreakdown: CategorySales[];
  recentInvoices: InvoiceSummary[];
}
