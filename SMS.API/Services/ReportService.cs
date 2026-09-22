using Microsoft.EntityFrameworkCore;
using SMS.API.Data;
using SMS.API.DTOs;

namespace SMS.API.Services
{
    public interface IReportService
    {
        Task<List<SalesReportItemDto>> GetSalesReportAsync(DateOnly? fromDate = null, DateOnly? toDate = null);
        Task<DashboardSummaryDto> GetDashboardSummaryAsync();
    }

    public class ReportService : IReportService
    {
        private readonly SMSDbContext _context;

        public ReportService(SMSDbContext context)
        {
            _context = context;
        }

        public async Task<List<SalesReportItemDto>> GetSalesReportAsync(DateOnly? fromDate = null, DateOnly? toDate = null)
        {
            var query = _context.SalesDetails
                .Include(d => d.SalesHeader)
                    .ThenInclude(h => h!.CustomerNavigation)
                .Include(d => d.Item)
                .AsNoTracking()
                .AsQueryable();

            if (fromDate.HasValue)
            {
                query = query.Where(d => d.SalesHeader != null && d.SalesHeader.Date >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(d => d.SalesHeader != null && d.SalesHeader.Date <= toDate.Value);
            }

            var details = await query
                .OrderByDescending(d => d.SalesHeader!.Date)
                .ThenBy(d => d.InvoiceNumber)
                .ToListAsync();

            return details.Select(d => new SalesReportItemDto
            {
                DetailId = d.DetailId,
                InvoiceNumber = d.InvoiceNumber,
                InvoiceType = d.InvoiceType,
                InvoiceDate = d.SalesHeader?.Date ?? DateOnly.FromDateTime(DateTime.UtcNow),
                CustomerCode = d.SalesHeader?.Customer ?? string.Empty,
                CustomerName = d.SalesHeader?.CustomerNavigation?.Name ?? (d.SalesHeader?.Customer ?? string.Empty),
                CustomerCategory = d.SalesHeader?.CustomerNavigation?.Category ?? "General",
                ItemCode = d.ItemCode,
                Description = d.Item?.Description ?? string.Empty,
                Photo = d.Item?.ItemPhoto,
                Unit = d.Item?.Unit ?? "PCS",
                Brand = d.Item?.Brand ?? "Unknown",
                Supplier = d.Item?.Supplier ?? "Unknown",
                Qty = d.Qty,
                Price = d.Price,
                SaleAmount = d.Amount,
                Cost = d.Item?.Cost ?? 0
            }).ToList();
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
        {
            var details = await _context.SalesDetails
                .Include(d => d.SalesHeader)
                    .ThenInclude(h => h!.CustomerNavigation)
                .Include(d => d.Item)
                .AsNoTracking()
                .ToListAsync();

            var totalSales = details.Sum(d => d.Amount);
            var totalCost = details.Sum(d => d.Qty * (d.Item?.Cost ?? 0));
            var totalGrossProfit = totalSales - totalCost;
            var marginPercent = totalSales > 0 ? (totalGrossProfit / totalSales) * 100 : 0;

            // Top selling item by quantity
            var topItem = details
                .GroupBy(d => new { d.ItemCode, Description = d.Item?.Description ?? d.ItemCode })
                .Select(g => new
                {
                    g.Key.ItemCode,
                    g.Key.Description,
                    TotalQty = g.Sum(x => x.Qty),
                    TotalSales = g.Sum(x => x.Amount)
                })
                .OrderByDescending(x => x.TotalQty)
                .FirstOrDefault();

            var invoiceCount = await _context.SalesHeaders.CountAsync();
            var customerCount = await _context.Customers.CountAsync();

            var kpis = new DashboardKpisDto
            {
                TotalSales = Math.Round(totalSales, 2),
                TotalGrossProfit = Math.Round(totalGrossProfit, 2),
                OverallProfitMargin = Math.Round(marginPercent, 2),
                TopSellingItem = topItem != null ? $"{topItem.Description} ({topItem.ItemCode})" : "N/A",
                TopSellingItemQty = topItem?.TotalQty ?? 0,
                TopSellingItemSales = topItem?.TotalSales ?? 0,
                TotalInvoices = invoiceCount,
                TotalCustomers = customerCount
            };

            // Sales trends (grouped by invoice date)
            var trends = details
                .Where(d => d.SalesHeader != null)
                .GroupBy(d => d.SalesHeader!.Date)
                .OrderBy(g => g.Key)
                .Select(g => new SalesTrendDto
                {
                    Period = g.Key.ToString("yyyy-MM-dd"),
                    SalesAmount = Math.Round(g.Sum(x => x.Amount), 2),
                    GrossProfit = Math.Round(g.Sum(x => x.Amount - (x.Qty * (x.Item?.Cost ?? 0))), 2),
                    InvoiceCount = g.Select(x => x.InvoiceNumber).Distinct().Count()
                })
                .ToList();

            // Category breakdown (grouped by Customer Category)
            var categoryBreakdown = details
                .Where(d => d.SalesHeader?.CustomerNavigation != null)
                .GroupBy(d => d.SalesHeader!.CustomerNavigation!.Category)
                .Select(g =>
                {
                    var catSales = g.Sum(x => x.Amount);
                    var catCost = g.Sum(x => x.Qty * (x.Item?.Cost ?? 0));
                    return new CategorySalesDto
                    {
                        Category = g.Key,
                        SalesAmount = Math.Round(catSales, 2),
                        GrossProfit = Math.Round(catSales - catCost, 2),
                        Percentage = totalSales > 0 ? Math.Round((catSales / totalSales) * 100, 2) : 0
                    };
                })
                .OrderByDescending(c => c.SalesAmount)
                .ToList();

            // Recent invoices
            var recentHeaders = await _context.SalesHeaders
                .Include(h => h.CustomerNavigation)
                .Include(h => h.SalesDetails)
                .OrderByDescending(h => h.Date)
                .ThenByDescending(h => h.InvoiceNumber)
                .Take(5)
                .ToListAsync();

            var recentInvoices = recentHeaders.Select(h => new InvoiceSummaryDto
            {
                InvoiceNumber = h.InvoiceNumber,
                InvoiceType = h.InvoiceType,
                Date = h.Date,
                Customer = h.Customer,
                CustomerName = h.CustomerNavigation?.Name ?? h.Customer,
                TotalAmount = h.TotalAmount,
                TotalItems = h.SalesDetails?.Count ?? 0
            }).ToList();

            return new DashboardSummaryDto
            {
                Kpis = kpis,
                SalesTrends = trends,
                CategoryBreakdown = categoryBreakdown,
                RecentInvoices = recentInvoices
            };
        }
    }
}
