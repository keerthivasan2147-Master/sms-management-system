using SMS.API.Models;

namespace SMS.API.Data
{
    public static class DbSeeder
    {
        public static void Seed(SMSDbContext context)
        {
            // Seed Admin User
            if (!context.Users.Any())
            {
                context.Users.Add(new User
                {
                    Name = "System Administrator",
                    Username = "admin",
                    Mobile = "+1-555-0199",
                    Password = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                });
                context.SaveChanges();
            }

            // Seed Customers
            if (!context.Customers.Any())
            {
                context.Customers.AddRange(
                    new Customer
                    {
                        Code = "CUST-001",
                        Name = "Apex Global Enterprises",
                        Address = "100 Financial Center, New York, NY",
                        Mobile = "+1-555-1200",
                        Email = "purchasing@apexglobal.com",
                        Category = "Corporate"
                    },
                    new Customer
                    {
                        Code = "CUST-002",
                        Name = "Metro Wholesale Distributors",
                        Address = "45 Industrial Parkway, Chicago, IL",
                        Mobile = "+1-555-3400",
                        Email = "orders@metrowholesale.com",
                        Category = "Wholesale"
                    },
                    new Customer
                    {
                        Code = "CUST-003",
                        Name = "Horizon Retail Stores",
                        Address = "789 Market Street, San Francisco, CA",
                        Mobile = "+1-555-5600",
                        Email = "info@horizonretail.com",
                        Category = "Retail"
                    },
                    new Customer
                    {
                        Code = "CUST-004",
                        Name = "Quantum Logistics LLC",
                        Address = "12 Logistics Way, Dallas, TX",
                        Mobile = "+1-555-7800",
                        Email = "contact@quantumlogistics.com",
                        Category = "Corporate"
                    }
                );
                context.SaveChanges();
            }

            // Seed Items
            if (!context.Items.Any())
            {
                context.Items.AddRange(
                    new Item
                    {
                        Code = "ITM-001",
                        Description = "ThinkPad Ultra 16 Laptop (i7, 32GB RAM)",
                        Cost = 950.00m,
                        SalesPrice = 1450.00m,
                        Unit = "PCS",
                        Brand = "Lenovo",
                        Supplier = "Lenovo Global Direct"
                    },
                    new Item
                    {
                        Code = "ITM-002",
                        Description = "Dell 32-inch 4K UHD Curved Monitor",
                        Cost = 310.00m,
                        SalesPrice = 499.00m,
                        Unit = "PCS",
                        Brand = "Dell",
                        Supplier = "Dell Commercial"
                    },
                    new Item
                    {
                        Code = "ITM-003",
                        Description = "Logitech MX Master 3S Wireless Mouse",
                        Cost = 60.00m,
                        SalesPrice = 99.00m,
                        Unit = "PCS",
                        Brand = "Logitech",
                        Supplier = "LogiTech Distribution"
                    },
                    new Item
                    {
                        Code = "ITM-004",
                        Description = "Keychron Q1 Pro Mechanical Keyboard",
                        Cost = 110.00m,
                        SalesPrice = 199.00m,
                        Unit = "PCS",
                        Brand = "Keychron",
                        Supplier = "Keychron APAC"
                    },
                    new Item
                    {
                        Code = "ITM-005",
                        Description = "Sony WH-1000XM5 ANC Headphones",
                        Cost = 240.00m,
                        SalesPrice = 399.00m,
                        Unit = "PCS",
                        Brand = "Sony",
                        Supplier = "Sony Electronics"
                    }
                );
                context.SaveChanges();
            }

            // Seed Initial Sales Invoices if none exist
            if (!context.SalesHeaders.Any())
            {
                var invoice = new SalesHeader
                {
                    InvoiceNumber = "INV-2026-001",
                    InvoiceType = "TAX",
                    Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)),
                    Customer = "CUST-001",
                    TotalAmount = 2448.00m,
                    InvoiceDescription = "Quarterly IT equipment order"
                };

                invoice.SalesDetails.Add(new SalesDetail
                {
                    InvoiceNumber = "INV-2026-001",
                    InvoiceType = "TAX",
                    ItemCode = "ITM-001",
                    Qty = 1,
                    Price = 1450.00m,
                    Amount = 1450.00m
                });

                invoice.SalesDetails.Add(new SalesDetail
                {
                    InvoiceNumber = "INV-2026-001",
                    InvoiceType = "TAX",
                    ItemCode = "ITM-002",
                    Qty = 2,
                    Price = 499.00m,
                    Amount = 998.00m
                });

                context.SalesHeaders.Add(invoice);
                context.SaveChanges();
            }
        }
    }
}
