using Microsoft.EntityFrameworkCore;
using SMS.API.Data;
using SMS.API.Models;

namespace SMS.API.Repositories
{
    public interface ISalesInvoiceRepository : IRepository<SalesHeader>
    {
        Task<SalesHeader?> GetInvoiceWithDetailsAsync(string invoiceNumber);
        Task<SalesHeader?> GetTopInvoiceAsync();
        Task<SalesHeader?> GetBottomInvoiceAsync();
        Task<SalesHeader?> GetPriorInvoiceAsync(string currentInvoiceNumber);
        Task<SalesHeader?> GetNextInvoiceAsync(string currentInvoiceNumber);
        Task<List<SalesHeader>> SearchInvoicesAsync(string? query, DateOnly? fromDate, DateOnly? toDate);
        Task<List<SalesHeader>> GetAllSummariesAsync();
        Task<string> GenerateNextInvoiceNumberAsync(string prefix = "INV");
        Task<int> GetInvoiceCountAsync();
        Task<int> GetInvoiceIndexAsync(string invoiceNumber);
    }

    public class SalesInvoiceRepository : Repository<SalesHeader>, ISalesInvoiceRepository
    {
        public SalesInvoiceRepository(SMSDbContext context) : base(context)
        {
        }

        public async Task<SalesHeader?> GetInvoiceWithDetailsAsync(string invoiceNumber)
        {
            return await _dbSet
                .Include(h => h.CustomerNavigation)
                .Include(h => h.SalesDetails)
                    .ThenInclude(d => d.Item)
                .FirstOrDefaultAsync(h => h.InvoiceNumber == invoiceNumber);
        }

        public async Task<SalesHeader?> GetTopInvoiceAsync()
        {
            return await _dbSet
                .Include(h => h.CustomerNavigation)
                .Include(h => h.SalesDetails)
                    .ThenInclude(d => d.Item)
                .OrderBy(h => h.Date)
                .ThenBy(h => h.InvoiceNumber)
                .FirstOrDefaultAsync();
        }

        public async Task<SalesHeader?> GetBottomInvoiceAsync()
        {
            return await _dbSet
                .Include(h => h.CustomerNavigation)
                .Include(h => h.SalesDetails)
                    .ThenInclude(d => d.Item)
                .OrderByDescending(h => h.Date)
                .ThenByDescending(h => h.InvoiceNumber)
                .FirstOrDefaultAsync();
        }

        public async Task<SalesHeader?> GetPriorInvoiceAsync(string currentInvoiceNumber)
        {
            var current = await _dbSet.FirstOrDefaultAsync(h => h.InvoiceNumber == currentInvoiceNumber);
            if (current == null) return await GetBottomInvoiceAsync();

            return await _dbSet
                .Include(h => h.CustomerNavigation)
                .Include(h => h.SalesDetails)
                    .ThenInclude(d => d.Item)
                .Where(h => h.Date < current.Date || (h.Date == current.Date && string.Compare(h.InvoiceNumber, current.InvoiceNumber) < 0))
                .OrderByDescending(h => h.Date)
                .ThenByDescending(h => h.InvoiceNumber)
                .FirstOrDefaultAsync();
        }

        public async Task<SalesHeader?> GetNextInvoiceAsync(string currentInvoiceNumber)
        {
            var current = await _dbSet.FirstOrDefaultAsync(h => h.InvoiceNumber == currentInvoiceNumber);
            if (current == null) return await GetTopInvoiceAsync();

            return await _dbSet
                .Include(h => h.CustomerNavigation)
                .Include(h => h.SalesDetails)
                    .ThenInclude(d => d.Item)
                .Where(h => h.Date > current.Date || (h.Date == current.Date && string.Compare(h.InvoiceNumber, current.InvoiceNumber) > 0))
                .OrderBy(h => h.Date)
                .ThenBy(h => h.InvoiceNumber)
                .FirstOrDefaultAsync();
        }

        public async Task<List<SalesHeader>> SearchInvoicesAsync(string? query, DateOnly? fromDate, DateOnly? toDate)
        {
            var q = _dbSet
                .Include(h => h.CustomerNavigation)
                .Include(h => h.SalesDetails)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(query))
            {
                var lower = query.ToLower();
                q = q.Where(h => h.InvoiceNumber.ToLower().Contains(lower) ||
                                 h.Customer.ToLower().Contains(lower) ||
                                 (h.CustomerNavigation != null && h.CustomerNavigation.Name.ToLower().Contains(lower)) ||
                                 (h.InvoiceDescription != null && h.InvoiceDescription.ToLower().Contains(lower)));
            }

            if (fromDate.HasValue)
            {
                q = q.Where(h => h.Date >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                q = q.Where(h => h.Date <= toDate.Value);
            }

            return await q.OrderByDescending(h => h.Date).ThenByDescending(h => h.InvoiceNumber).ToListAsync();
        }

        public async Task<List<SalesHeader>> GetAllSummariesAsync()
        {
            return await _dbSet
                .Include(h => h.CustomerNavigation)
                .Include(h => h.SalesDetails)
                .OrderByDescending(h => h.Date)
                .ThenByDescending(h => h.InvoiceNumber)
                .ToListAsync();
        }

        public async Task<string> GenerateNextInvoiceNumberAsync(string prefix = "INV")
        {
            int currentYear = DateTime.UtcNow.Year;
            string prefixPattern = $"{prefix}-{currentYear}-";

            var lastInvoice = await _dbSet
                .Where(h => h.InvoiceNumber.StartsWith(prefixPattern))
                .OrderByDescending(h => h.InvoiceNumber)
                .Select(h => h.InvoiceNumber)
                .FirstOrDefaultAsync();

            int nextSeq = 1;
            if (lastInvoice != null)
            {
                var parts = lastInvoice.Split('-');
                if (parts.Length >= 3 && int.TryParse(parts[2], out int seq))
                {
                    nextSeq = seq + 1;
                }
            }

            return $"{prefixPattern}{nextSeq:D4}";
        }

        public async Task<int> GetInvoiceCountAsync()
        {
            return await _dbSet.CountAsync();
        }

        public async Task<int> GetInvoiceIndexAsync(string invoiceNumber)
        {
            var invoices = await _dbSet
                .OrderBy(h => h.Date)
                .ThenBy(h => h.InvoiceNumber)
                .Select(h => h.InvoiceNumber)
                .ToListAsync();

            int index = invoices.IndexOf(invoiceNumber);
            return index >= 0 ? index + 1 : 0;
        }
    }
}
