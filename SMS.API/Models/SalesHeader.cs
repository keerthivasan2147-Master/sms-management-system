using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.API.Models
{
    [Table("SalesHeader")]
    public class SalesHeader
    {
        [Key]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string InvoiceType { get; set; } = string.Empty;

        [Required]
        public DateOnly Date { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

        [Required]
        [MaxLength(30)]
        [ForeignKey(nameof(CustomerNavigation))]
        public string Customer { get; set; } = string.Empty; // Customer Code

        [MaxLength(255)]
        public string? InvoiceDescription { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Customer? CustomerNavigation { get; set; }
        public ICollection<SalesDetail> SalesDetails { get; set; } = new List<SalesDetail>();
    }
}
