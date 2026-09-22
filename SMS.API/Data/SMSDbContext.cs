using Microsoft.EntityFrameworkCore;
using SMS.API.Models;

namespace SMS.API.Data
{
    public class SMSDbContext : DbContext
    {
        public SMSDbContext(DbContextOptions<SMSDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<Item> Items => Set<Item>();
        public DbSet<SalesHeader> SalesHeaders => Set<SalesHeader>();
        public DbSet<SalesDetail> SalesDetails => Set<SalesDetail>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User mapping
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("UserMaster");
                entity.HasKey(e => e.UserId);
                entity.HasIndex(e => e.Username).IsUnique();
            });

            // Customer mapping
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.ToTable("CustomerMaster");
                entity.HasKey(e => e.Code);
            });

            // Item mapping
            modelBuilder.Entity<Item>(entity =>
            {
                entity.ToTable("ItemMaster");
                entity.HasKey(e => e.Code);
            });

            // SalesHeader mapping
            modelBuilder.Entity<SalesHeader>(entity =>
            {
                entity.ToTable("SalesHeader");
                entity.HasKey(e => e.InvoiceNumber);

                entity.HasOne(e => e.CustomerNavigation)
                      .WithMany(c => c.SalesHeaders)
                      .HasForeignKey(e => e.Customer)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // SalesDetail mapping
            modelBuilder.Entity<SalesDetail>(entity =>
            {
                entity.ToTable("SalesDetails");
                entity.HasKey(e => e.DetailId);

                entity.HasOne(e => e.SalesHeader)
                      .WithMany(h => h.SalesDetails)
                      .HasForeignKey(e => e.InvoiceNumber)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Item)
                      .WithMany(i => i.SalesDetails)
                      .HasForeignKey(e => e.ItemCode)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
