using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.API.Models
{
    [Table("SalesDetails")]
    public class SalesDetail
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int DetailId { get; set; }

        [Required]
        [MaxLength(30)]
        public string InvoiceType { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [ForeignKey(nameof(SalesHeader))]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        [ForeignKey(nameof(Item))]
        public string ItemCode { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Qty { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        // Navigation properties
        public SalesHeader? SalesHeader { get; set; }
        public Item? Item { get; set; }
    }
}
