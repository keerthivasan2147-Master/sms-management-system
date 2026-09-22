using System.ComponentModel.DataAnnotations;

namespace SMS.API.DTOs
{
    public class SalesDetailDto
    {
        public int DetailId { get; set; }
        public string InvoiceType { get; set; } = string.Empty;
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public string ItemCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public string? ItemPhoto { get; set; }
        public decimal Cost { get; set; }

        [Required]
        [Range(0.01, 1000000.00)]
        public decimal Qty { get; set; }

        [Required]
        [Range(0.01, 10000000.00)]
        public decimal Price { get; set; }

        public decimal Amount { get; set; }
    }

    public class SalesInvoiceDto
    {
        public string InvoiceNumber { get; set; } = string.Empty;
        public string InvoiceType { get; set; } = string.Empty;
        public DateOnly Date { get; set; }
        public string Customer { get; set; } = string.Empty; // Customer Code
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerCategory { get; set; } = string.Empty;
        public string? InvoiceDescription { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<SalesDetailDto> Details { get; set; } = new List<SalesDetailDto>();
    }

    public class SaveSalesDetailDto
    {
        [Required]
        public string ItemCode { get; set; } = string.Empty;

        [Required]
        [Range(0.0001, 1000000.00)]
        public decimal Qty { get; set; }

        [Required]
        [Range(0.0001, 10000000.00)]
        public decimal Price { get; set; }
    }

    public class SaveSalesInvoiceDto
    {
        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string InvoiceType { get; set; } = string.Empty;

        [Required]
        public DateOnly Date { get; set; }

        [Required]
        [MaxLength(30)]
        public string Customer { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? InvoiceDescription { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Invoice must contain at least one line item.")]
        public List<SaveSalesDetailDto> Details { get; set; } = new List<SaveSalesDetailDto>();
    }

    public class InvoiceSummaryDto
    {
        public string InvoiceNumber { get; set; } = string.Empty;
        public string InvoiceType { get; set; } = string.Empty;
        public DateOnly Date { get; set; }
        public string Customer { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public int TotalItems { get; set; }
    }

    public class NavigationResultDto
    {
        public SalesInvoiceDto? Invoice { get; set; }
        public bool HasPrior { get; set; }
        public bool HasNext { get; set; }
        public int CurrentIndex { get; set; }
        public int TotalCount { get; set; }
    }
}
