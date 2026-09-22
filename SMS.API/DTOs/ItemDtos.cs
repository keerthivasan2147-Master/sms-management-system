using System.ComponentModel.DataAnnotations;

namespace SMS.API.DTOs
{
    public class ItemDto
    {
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ItemPhoto { get; set; }
        public decimal Cost { get; set; }
        public decimal SalesPrice { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Supplier { get; set; } = string.Empty;
        public decimal ProfitMargin => SalesPrice > 0 ? ((SalesPrice - Cost) / SalesPrice) * 100 : 0;
        public DateTime CreatedAt { get; set; }
    }

    public class CreateItemDto
    {
        [Required]
        [MaxLength(30)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        public string? ItemPhoto { get; set; } // Base64 data URI or image URL

        [Required]
        [Range(0.01, 10000000.00)]
        public decimal Cost { get; set; }

        [Required]
        [Range(0.01, 10000000.00)]
        public decimal SalesPrice { get; set; }

        [Required]
        [MaxLength(20)]
        public string Unit { get; set; } = string.Empty;

        [Required]
        [MaxLength(60)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Supplier { get; set; } = string.Empty;
    }

    public class UpdateItemDto
    {
        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        public string? ItemPhoto { get; set; }

        [Required]
        [Range(0.01, 10000000.00)]
        public decimal Cost { get; set; }

        [Required]
        [Range(0.01, 10000000.00)]
        public decimal SalesPrice { get; set; }

        [Required]
        [MaxLength(20)]
        public string Unit { get; set; } = string.Empty;

        [Required]
        [MaxLength(60)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Supplier { get; set; } = string.Empty;
    }
}
