namespace SMS.API.DTOs
{
    public class SalesReportItemDto
    {
        public int DetailId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string InvoiceType { get; set; } = string.Empty;
        public DateOnly InvoiceDate { get; set; }
        public string CustomerCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerCategory { get; set; } = string.Empty;

        // Required Columns
        public string ItemCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Photo { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Supplier { get; set; } = string.Empty;
        public decimal Qty { get; set; }
        public decimal Price { get; set; }
        public decimal SaleAmount { get; set; }
        public decimal Cost { get; set; } // Unit cost
        public decimal TotalCost => Math.Round(Cost * Qty, 2);
        public decimal GrossProfit => Math.Round(SaleAmount - (Cost * Qty), 2);
        public decimal MarginPercent => SaleAmount > 0 ? Math.Round((GrossProfit / SaleAmount) * 100, 2) : 0;
    }

    public class DashboardKpisDto
    {
        public decimal TotalSales { get; set; }
        public decimal TotalGrossProfit { get; set; }
        public decimal OverallProfitMargin { get; set; }
        public string TopSellingItem { get; set; } = string.Empty;
        public decimal TopSellingItemQty { get; set; }
        public decimal TopSellingItemSales { get; set; }
        public int TotalInvoices { get; set; }
        public int TotalCustomers { get; set; }
    }

    public class SalesTrendDto
    {
        public string Period { get; set; } = string.Empty; // e.g. "Aug 2026", "2026-09-01"
        public decimal SalesAmount { get; set; }
        public decimal GrossProfit { get; set; }
        public int InvoiceCount { get; set; }
    }

    public class CategorySalesDto
    {
        public string Category { get; set; } = string.Empty;
        public decimal SalesAmount { get; set; }
        public decimal GrossProfit { get; set; }
        public decimal Percentage { get; set; }
    }

    public class DashboardSummaryDto
    {
        public DashboardKpisDto Kpis { get; set; } = new DashboardKpisDto();
        public List<SalesTrendDto> SalesTrends { get; set; } = new List<SalesTrendDto>();
        public List<CategorySalesDto> CategoryBreakdown { get; set; } = new List<CategorySalesDto>();
        public List<InvoiceSummaryDto> RecentInvoices { get; set; } = new List<InvoiceSummaryDto>();
    }
}
