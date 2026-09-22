using SMS.API.DTOs;
using SMS.API.Models;
using SMS.API.Repositories;

namespace SMS.API.Services
{
    public interface ISalesInvoiceService
    {
        Task<SalesInvoiceDto?> GetByInvoiceNumberAsync(string invoiceNumber);
        Task<NavigationResultDto> GetTopAsync();
        Task<NavigationResultDto> GetBottomAsync();
        Task<NavigationResultDto> GetPriorAsync(string currentInvoiceNumber);
        Task<NavigationResultDto> GetNextAsync(string currentInvoiceNumber);
        Task<List<InvoiceSummaryDto>> GetAllSummariesAsync();
        Task<List<InvoiceSummaryDto>> SearchInvoicesAsync(string? query, DateOnly? fromDate, DateOnly? toDate);
        Task<SalesInvoiceDto> CreateInvoiceAsync(SaveSalesInvoiceDto dto);
        Task<SalesInvoiceDto> UpdateInvoiceAsync(string invoiceNumber, SaveSalesInvoiceDto dto);
        Task<bool> DeleteInvoiceAsync(string invoiceNumber);
        Task<string> GetNextInvoiceNumberAsync(string prefix = "INV");
    }

    public class SalesInvoiceService : ISalesInvoiceService
    {
        private readonly ISalesInvoiceRepository _invoiceRepo;
        private readonly ICustomerRepository _customerRepo;
        private readonly IItemRepository _itemRepo;

        public SalesInvoiceService(
            ISalesInvoiceRepository invoiceRepo,
            ICustomerRepository customerRepo,
            IItemRepository itemRepo)
        {
            _invoiceRepo = invoiceRepo;
            _customerRepo = customerRepo;
            _itemRepo = itemRepo;
        }

        public async Task<SalesInvoiceDto?> GetByInvoiceNumberAsync(string invoiceNumber)
        {
            var header = await _invoiceRepo.GetInvoiceWithDetailsAsync(invoiceNumber);
            if (header == null) return null;
            return MapToDto(header);
        }

        public async Task<NavigationResultDto> GetTopAsync()
        {
            var header = await _invoiceRepo.GetTopInvoiceAsync();
            return await BuildNavigationResultAsync(header);
        }

        public async Task<NavigationResultDto> GetBottomAsync()
        {
            var header = await _invoiceRepo.GetBottomInvoiceAsync();
            return await BuildNavigationResultAsync(header);
        }

        public async Task<NavigationResultDto> GetPriorAsync(string currentInvoiceNumber)
        {
            var header = await _invoiceRepo.GetPriorInvoiceAsync(currentInvoiceNumber);
            if (header == null)
            {
                // Already at top, return current or top
                header = await _invoiceRepo.GetInvoiceWithDetailsAsync(currentInvoiceNumber) ?? await _invoiceRepo.GetTopInvoiceAsync();
            }
            return await BuildNavigationResultAsync(header);
        }

        public async Task<NavigationResultDto> GetNextAsync(string currentInvoiceNumber)
        {
            var header = await _invoiceRepo.GetNextInvoiceAsync(currentInvoiceNumber);
            if (header == null)
            {
                // Already at bottom, return current or bottom
                header = await _invoiceRepo.GetInvoiceWithDetailsAsync(currentInvoiceNumber) ?? await _invoiceRepo.GetBottomInvoiceAsync();
            }
            return await BuildNavigationResultAsync(header);
        }

        public async Task<List<InvoiceSummaryDto>> GetAllSummariesAsync()
        {
            var list = await _invoiceRepo.GetAllSummariesAsync();
            return list.Select(h => new InvoiceSummaryDto
            {
                InvoiceNumber = h.InvoiceNumber,
                InvoiceType = h.InvoiceType,
                Date = h.Date,
                Customer = h.Customer,
                CustomerName = h.CustomerNavigation?.Name ?? h.Customer,
                TotalAmount = h.TotalAmount,
                TotalItems = h.SalesDetails?.Count ?? 0
            }).ToList();
        }

        public async Task<List<InvoiceSummaryDto>> SearchInvoicesAsync(string? query, DateOnly? fromDate, DateOnly? toDate)
        {
            var list = await _invoiceRepo.SearchInvoicesAsync(query, fromDate, toDate);
            return list.Select(h => new InvoiceSummaryDto
            {
                InvoiceNumber = h.InvoiceNumber,
                InvoiceType = h.InvoiceType,
                Date = h.Date,
                Customer = h.Customer,
                CustomerName = h.CustomerNavigation?.Name ?? h.Customer,
                TotalAmount = h.TotalAmount,
                TotalItems = h.SalesDetails?.Count ?? 0
            }).ToList();
        }

        public async Task<SalesInvoiceDto> CreateInvoiceAsync(SaveSalesInvoiceDto dto)
        {
            var existing = await _invoiceRepo.GetInvoiceWithDetailsAsync(dto.InvoiceNumber);
            if (existing != null)
            {
                throw new InvalidOperationException($"Invoice number '{dto.InvoiceNumber}' already exists.");
            }

            var customer = await _customerRepo.GetByCodeAsync(dto.Customer);
            if (customer == null)
            {
                throw new KeyNotFoundException($"Customer with code '{dto.Customer}' was not found.");
            }

            var header = new SalesHeader
            {
                InvoiceNumber = dto.InvoiceNumber.Trim(),
                InvoiceType = dto.InvoiceType.Trim(),
                Date = dto.Date,
                Customer = dto.Customer.Trim(),
                InvoiceDescription = dto.InvoiceDescription?.Trim(),
                CreatedAt = DateTime.UtcNow,
                SalesDetails = new List<SalesDetail>()
            };

            decimal totalAmount = 0;
            foreach (var detailDto in dto.Details)
            {
                var item = await _itemRepo.GetByCodeAsync(detailDto.ItemCode);
                if (item == null)
                {
                    throw new KeyNotFoundException($"Item with code '{detailDto.ItemCode}' was not found.");
                }

                decimal rowAmount = Math.Round(detailDto.Qty * detailDto.Price, 2);
                totalAmount += rowAmount;

                header.SalesDetails.Add(new SalesDetail
                {
                    InvoiceType = dto.InvoiceType.Trim(),
                    InvoiceNumber = dto.InvoiceNumber.Trim(),
                    ItemCode = item.Code,
                    Qty = detailDto.Qty,
                    Price = detailDto.Price,
                    Amount = rowAmount
                });
            }

            header.TotalAmount = totalAmount;

            await _invoiceRepo.AddAsync(header);
            await _invoiceRepo.SaveChangesAsync();

            return (await GetByInvoiceNumberAsync(header.InvoiceNumber))!;
        }

        public async Task<SalesInvoiceDto> UpdateInvoiceAsync(string invoiceNumber, SaveSalesInvoiceDto dto)
        {
            var header = await _invoiceRepo.GetInvoiceWithDetailsAsync(invoiceNumber);
            if (header == null)
            {
                throw new KeyNotFoundException($"Invoice '{invoiceNumber}' not found.");
            }

            var customer = await _customerRepo.GetByCodeAsync(dto.Customer);
            if (customer == null)
            {
                throw new KeyNotFoundException($"Customer with code '{dto.Customer}' was not found.");
            }

            header.InvoiceType = dto.InvoiceType.Trim();
            header.Date = dto.Date;
            header.Customer = dto.Customer.Trim();
            header.InvoiceDescription = dto.InvoiceDescription?.Trim();

            // Clear old line items and add new ones
            header.SalesDetails.Clear();

            decimal totalAmount = 0;
            foreach (var detailDto in dto.Details)
            {
                var item = await _itemRepo.GetByCodeAsync(detailDto.ItemCode);
                if (item == null)
                {
                    throw new KeyNotFoundException($"Item with code '{detailDto.ItemCode}' was not found.");
                }

                decimal rowAmount = Math.Round(detailDto.Qty * detailDto.Price, 2);
                totalAmount += rowAmount;

                header.SalesDetails.Add(new SalesDetail
                {
                    InvoiceType = dto.InvoiceType.Trim(),
                    InvoiceNumber = invoiceNumber,
                    ItemCode = item.Code,
                    Qty = detailDto.Qty,
                    Price = detailDto.Price,
                    Amount = rowAmount
                });
            }

            header.TotalAmount = totalAmount;

            _invoiceRepo.Update(header);
            await _invoiceRepo.SaveChangesAsync();

            return (await GetByInvoiceNumberAsync(invoiceNumber))!;
        }

        public async Task<bool> DeleteInvoiceAsync(string invoiceNumber)
        {
            var header = await _invoiceRepo.GetInvoiceWithDetailsAsync(invoiceNumber);
            if (header == null) return false;

            _invoiceRepo.Remove(header);
            await _invoiceRepo.SaveChangesAsync();
            return true;
        }

        public async Task<string> GetNextInvoiceNumberAsync(string prefix = "INV")
        {
            return await _invoiceRepo.GenerateNextInvoiceNumberAsync(prefix);
        }

        private async Task<NavigationResultDto> BuildNavigationResultAsync(SalesHeader? header)
        {
            if (header == null)
            {
                return new NavigationResultDto
                {
                    Invoice = null,
                    HasPrior = false,
                    HasNext = false,
                    CurrentIndex = 0,
                    TotalCount = await _invoiceRepo.GetInvoiceCountAsync()
                };
            }

            var prior = await _invoiceRepo.GetPriorInvoiceAsync(header.InvoiceNumber);
            var next = await _invoiceRepo.GetNextInvoiceAsync(header.InvoiceNumber);
            int total = await _invoiceRepo.GetInvoiceCountAsync();
            int index = await _invoiceRepo.GetInvoiceIndexAsync(header.InvoiceNumber);

            return new NavigationResultDto
            {
                Invoice = MapToDto(header),
                HasPrior = prior != null,
                HasNext = next != null,
                CurrentIndex = index,
                TotalCount = total
            };
        }

        private static SalesInvoiceDto MapToDto(SalesHeader header)
        {
            return new SalesInvoiceDto
            {
                InvoiceNumber = header.InvoiceNumber,
                InvoiceType = header.InvoiceType,
                Date = header.Date,
                Customer = header.Customer,
                CustomerName = header.CustomerNavigation?.Name ?? header.Customer,
                CustomerCategory = header.CustomerNavigation?.Category ?? string.Empty,
                InvoiceDescription = header.InvoiceDescription,
                TotalAmount = header.TotalAmount,
                CreatedAt = header.CreatedAt,
                Details = header.SalesDetails?.Select(d => new SalesDetailDto
                {
                    DetailId = d.DetailId,
                    InvoiceType = d.InvoiceType,
                    InvoiceNumber = d.InvoiceNumber,
                    ItemCode = d.ItemCode,
                    Description = d.Item?.Description ?? string.Empty,
                    Unit = d.Item?.Unit ?? string.Empty,
                    ItemPhoto = d.Item?.ItemPhoto,
                    Cost = d.Item?.Cost ?? 0,
                    Qty = d.Qty,
                    Price = d.Price,
                    Amount = d.Amount
                }).ToList() ?? new List<SalesDetailDto>()
            };
        }
    }
}
