-- ==========================================================
-- Sales Management System (SMS) - Database Schema & Seed Data
-- Database Engine: Microsoft SQL Server
-- ==========================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SMSDb')
BEGIN
    CREATE DATABASE SMSDb;
END
GO

USE SMSDb;
GO

-- 1. Drop existing tables in reverse dependency order if needed
IF OBJECT_ID(N'dbo.SalesDetails', N'U') IS NOT NULL DROP TABLE dbo.SalesDetails;
IF OBJECT_ID(N'dbo.SalesHeader', N'U') IS NOT NULL DROP TABLE dbo.SalesHeader;
IF OBJECT_ID(N'dbo.ItemMaster', N'U') IS NOT NULL DROP TABLE dbo.ItemMaster;
IF OBJECT_ID(N'dbo.CustomerMaster', N'U') IS NOT NULL DROP TABLE dbo.CustomerMaster;
IF OBJECT_ID(N'dbo.UserMaster', N'U') IS NOT NULL DROP TABLE dbo.UserMaster;
GO

-- ==========================================================
-- 2. User Master Table
-- Fields: Name, Username, Mobile, Password (Encrypted)
-- ==========================================================
CREATE TABLE dbo.UserMaster (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Mobile NVARCHAR(20) NOT NULL,
    Password NVARCHAR(255) NOT NULL, -- Stored as BCrypt hash
    Role NVARCHAR(50) NOT NULL DEFAULT N'Admin',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ==========================================================
-- 3. Customer Master Table
-- Fields: Code, Name, Address, Mobile, Email, Category
-- ==========================================================
CREATE TABLE dbo.CustomerMaster (
    Code NVARCHAR(30) PRIMARY KEY,
    Name NVARCHAR(150) NOT NULL,
    Address NVARCHAR(255) NOT NULL,
    Mobile NVARCHAR(25) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    Category NVARCHAR(50) NOT NULL, -- e.g., Wholesale, Retail, Corporate, Distributor
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ==========================================================
-- 4. Item Master Table
-- Fields: Code, Description, Item Photo (Base64/URL), Cost, Sales Price, Unit, Brand, Supplier
-- ==========================================================
CREATE TABLE dbo.ItemMaster (
    Code NVARCHAR(30) PRIMARY KEY,
    Description NVARCHAR(200) NOT NULL,
    ItemPhoto NVARCHAR(MAX) NULL, -- Base64 string or image URL
    Cost DECIMAL(18,2) NOT NULL,
    SalesPrice DECIMAL(18,2) NOT NULL,
    Unit NVARCHAR(20) NOT NULL, -- e.g., PCS, BOX, SET, KG, PKT
    Brand NVARCHAR(60) NOT NULL,
    Supplier NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ==========================================================
-- 5. Sales Header Table
-- Fields: Invoice Type, Invoice Number (PK), Date, Customer, Invoice Description
-- ==========================================================
CREATE TABLE dbo.SalesHeader (
    InvoiceNumber NVARCHAR(50) PRIMARY KEY,
    InvoiceType NVARCHAR(30) NOT NULL, -- e.g., Tax Invoice, Cash Invoice, Proforma
    Date DATE NOT NULL,
    Customer NVARCHAR(30) NOT NULL, -- Stores Customer Code (FK)
    InvoiceDescription NVARCHAR(255) NULL,
    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_SalesHeader_Customer FOREIGN KEY (Customer) REFERENCES dbo.CustomerMaster(Code)
);
GO

-- ==========================================================
-- 6. Sales Details Table
-- Fields: Invoice Type, Invoice Number (FK), Item Code, Qty, Price, Amount
-- ==========================================================
CREATE TABLE dbo.SalesDetails (
    DetailId INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceType NVARCHAR(30) NOT NULL,
    InvoiceNumber NVARCHAR(50) NOT NULL,
    ItemCode NVARCHAR(30) NOT NULL,
    Qty DECIMAL(18,2) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_SalesDetails_Header FOREIGN KEY (InvoiceNumber) REFERENCES dbo.SalesHeader(InvoiceNumber) ON DELETE CASCADE,
    CONSTRAINT FK_SalesDetails_Item FOREIGN KEY (ItemCode) REFERENCES dbo.ItemMaster(Code)
);
GO

-- Create Indexes for fast querying & reporting
CREATE NONCLUSTERED INDEX IX_SalesHeader_Date ON dbo.SalesHeader(Date);
CREATE NONCLUSTERED INDEX IX_SalesHeader_Customer ON dbo.SalesHeader(Customer);
CREATE NONCLUSTERED INDEX IX_SalesDetails_InvoiceNumber ON dbo.SalesDetails(InvoiceNumber);
CREATE NONCLUSTERED INDEX IX_SalesDetails_ItemCode ON dbo.SalesDetails(ItemCode);
CREATE NONCLUSTERED INDEX IX_CustomerMaster_Category ON dbo.CustomerMaster(Category);
CREATE NONCLUSTERED INDEX IX_ItemMaster_Brand ON dbo.ItemMaster(Brand);
GO

-- ==========================================================
-- 7. SEED DATA
-- ==========================================================

-- Seed Admin User (Password is 'Admin@123' hashed with BCrypt)
-- Hash: $2a$11$qR0qZ3v9iQ54321oGkU0eO8wXjCshjY9H7m5Yw5ZcWkOqR0qZ3v9i
-- We will also handle verification in backend via BCrypt.Net-Next
INSERT INTO dbo.UserMaster (Name, Username, Mobile, Password, Role)
VALUES 
(N'System Administrator', N'admin', N'+971-50-1234567', N'$2a$11$b6l8b7/N4pQjWvYjB9oRau7q5Jj9Q9x7E8z1T3m5U7v9W1x3Y5z7a', N'Admin'),
(N'Sales Executive', N'sales', N'+971-50-9876543', N'$2a$11$b6l8b7/N4pQjWvYjB9oRau7q5Jj9Q9x7E8z1T3m5U7v9W1x3Y5z7a', N'User');
GO

-- Seed Customer Master
INSERT INTO dbo.CustomerMaster (Code, Name, Address, Mobile, Email, Category)
VALUES
(N'CUST-001', N'Apex Global Technologies LLC', N'Suite 402, Business Bay, Dubai', N'+971-4-8899111', N'procurement@apextech.ae', N'Corporate'),
(N'CUST-002', N'Horizon Retail Ventures', N'Al Fahidi Street, Bur Dubai', N'+971-4-3522441', N'orders@horizonretail.com', N'Retail'),
(N'CUST-003', N'Gulf Wholesale Distributors', N'Warehouse 14, Al Quoz Industrial 3', N'+971-4-3401122', N'info@gulfdistributors.com', N'Wholesale'),
(N'CUST-004', N'Metro Star Supermarket Chain', N'Deira City Centre Area, Dubai', N'+971-4-2955500', N'inventory@metrostar.com', N'Retail'),
(N'CUST-005', N'Oasis Media & Telecom FZCO', N'Dubai Media City, Bldg 8', N'+971-4-3914444', N'accounts@oasismedia.ae', N'Corporate'),
(N'CUST-006', N'Prime Electronics & Trading', N'Sabkha Road, Deira, Dubai', N'+971-4-2268899', N'contact@primeelectronics.com', N'Wholesale'),
(N'CUST-007', N'Future Systems IT Solutions', N'Sharjah Media City, Sharjah', N'+971-6-5570011', N'billing@futuresystems.ae', N'Corporate'),
(N'CUST-008', N'Speedy Mart Mini Supermarkets', N'Barsha Heights (TECOM), Dubai', N'+971-4-4567890', N'store@speedymart.ae', N'Retail'),
(N'CUST-009', N'Emirates Logistics & Distribution', N'JAFZA South Zone, Jebel Ali', N'+971-4-8812345', N'supplies@emirateslogistics.ae', N'Distributor'),
(N'CUST-010', N'Skyline General Trading Co.', N'Al Nahda 2, Dubai', N'+971-4-2678901', N'sales@skylinetrading.com', N'Distributor');
GO

-- Seed Item Master
INSERT INTO dbo.ItemMaster (Code, Description, ItemPhoto, Cost, SalesPrice, Unit, Brand, Supplier)
VALUES
(N'ITEM-101', N'Dell UltraSharp 27" 4K USB-C Monitor', N'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80', 380.00, 520.00, N'PCS', N'Dell', N'Apex Tech Supplies'),
(N'ITEM-102', N'Logitech MX Master 3S Wireless Mouse', N'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80', 65.00, 99.00, N'PCS', N'Logitech', N'Global Peripherals FZ'),
(N'ITEM-103', N'Apple MacBook Pro 14" M3 Pro 18GB/512GB', N'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80', 1650.00, 1999.00, N'PCS', N'Apple', N'iStyle Distribution'),
(N'ITEM-104', N'Samsung 34" Odyssey Curved Gaming Monitor', N'https://images.unsplash.com/photo-1545665277-5937489579f2?w=400&auto=format&fit=crop&q=80', 490.00, 680.00, N'PCS', N'Samsung', N'Apex Tech Supplies'),
(N'ITEM-105', N'Keychron K2 Pro Mechanical Keyboard RGB', N'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80', 75.00, 115.00, N'PCS', N'Keychron', N'Global Peripherals FZ'),
(N'ITEM-106', N'Sony WH-1000XM5 Noise Cancelling Headphones', N'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80', 260.00, 349.00, N'PCS', N'Sony', N'Prime Electronics Trade'),
(N'ITEM-107', N'Anker 737 Power Bank (PowerCore 24K 140W)', N'https://images.unsplash.com/photo-1609592426508-cc02720d2036?w=400&auto=format&fit=crop&q=80', 85.00, 130.00, N'PCS', N'Anker', N'Skyline General Trading'),
(N'ITEM-108', N'HP LaserJet Pro Multifunction Duplex Printer', N'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&auto=format&fit=crop&q=80', 290.00, 395.00, N'PCS', N'HP', N'Apex Tech Supplies'),
(N'ITEM-109', N'SanDisk Extreme PRO 1TB Portable SSD 2000MB/s', N'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&auto=format&fit=crop&q=80', 95.00, 145.00, N'PCS', N'SanDisk', N'Global Peripherals FZ'),
(N'ITEM-110', N'Cisco Business 110 Series 24-Port Gigabit Switch', N'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&auto=format&fit=crop&q=80', 140.00, 210.00, N'PCS', N'Cisco', N'Gulf Network Systems'),
(N'ITEM-111', N'Ergotron LX Desk Mount Single Monitor Arm', N'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&auto=format&fit=crop&q=80', 120.00, 185.00, N'PCS', N'Ergotron', N'Skyline General Trading'),
(N'ITEM-112', N'APC Smart-UPS 1500VA LCD 230V Backup Battery', N'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80', 410.00, 560.00, N'PCS', N'APC', N'Gulf Network Systems');
GO

-- Seed Sales Headers & Details
-- Invoice 1
INSERT INTO dbo.SalesHeader (InvoiceNumber, InvoiceType, Date, Customer, InvoiceDescription, TotalAmount)
VALUES (N'INV-2026-0001', N'Tax Invoice', '2026-08-05', N'CUST-001', N'Corporate IT hardware refresh for design wing', 4578.00);

INSERT INTO dbo.SalesDetails (InvoiceType, InvoiceNumber, ItemCode, Qty, Price, Amount)
VALUES
(N'Tax Invoice', N'INV-2026-0001', N'ITEM-101', 4.00, 520.00, 2080.00),
(N'Tax Invoice', N'INV-2026-0001', N'ITEM-102', 4.00, 99.00, 396.00),
(N'Tax Invoice', N'INV-2026-0001', N'ITEM-105', 4.00, 115.00, 460.00),
(N'Tax Invoice', N'INV-2026-0001', N'ITEM-109', 4.00, 145.00, 580.00),
(N'Tax Invoice', N'INV-2026-0001', N'ITEM-106', 3.00, 349.00, 1047.00),
(N'Tax Invoice', N'INV-2026-0001', N'ITEM-107', 1.00, 130.00, 130.00);

-- Invoice 2
INSERT INTO dbo.SalesHeader (InvoiceNumber, InvoiceType, Date, Customer, InvoiceDescription, TotalAmount)
VALUES (N'INV-2026-0002', N'Tax Invoice', '2026-08-12', N'CUST-003', N'Wholesale batch order for retail redistribution', 8550.00);

INSERT INTO dbo.SalesDetails (InvoiceType, InvoiceNumber, ItemCode, Qty, Price, Amount)
VALUES
(N'Tax Invoice', N'INV-2026-0002', N'ITEM-102', 20.00, 95.00, 1900.00),
(N'Tax Invoice', N'INV-2026-0002', N'ITEM-105', 20.00, 110.00, 2200.00),
(N'Tax Invoice', N'INV-2026-0002', N'ITEM-107', 25.00, 120.00, 3000.00),
(N'Tax Invoice', N'INV-2026-0002', N'ITEM-109', 10.00, 145.00, 1450.00);

-- Invoice 3
INSERT INTO dbo.SalesHeader (InvoiceNumber, InvoiceType, Date, Customer, InvoiceDescription, TotalAmount)
VALUES (N'INV-2026-0003', N'Cash Invoice', '2026-08-19', N'CUST-002', N'Retail walk-in order with immediate settlement', 2878.00);

INSERT INTO dbo.SalesDetails (InvoiceType, InvoiceNumber, ItemCode, Qty, Price, Amount)
VALUES
(N'Cash Invoice', N'INV-2026-0003', N'ITEM-103', 1.00, 1999.00, 1999.00),
(N'Cash Invoice', N'INV-2026-0003', N'ITEM-106', 1.00, 349.00, 349.00),
(N'Cash Invoice', N'INV-2026-0003', N'ITEM-101', 1.00, 520.00, 520.00);

-- Invoice 4
INSERT INTO dbo.SalesHeader (InvoiceNumber, InvoiceType, Date, Customer, InvoiceDescription, TotalAmount)
VALUES (N'INV-2026-0004', N'Tax Invoice', '2026-08-28', N'CUST-005', N'Media lab equipment and high-res editing station', 6377.00);

INSERT INTO dbo.SalesDetails (InvoiceType, InvoiceNumber, ItemCode, Qty, Price, Amount)
VALUES
(N'Tax Invoice', N'INV-2026-0004', N'ITEM-103', 2.00, 1999.00, 3998.00),
(N'Tax Invoice', N'INV-2026-0004', N'ITEM-104', 2.00, 680.00, 1360.00),
(N'Tax Invoice', N'INV-2026-0004', N'ITEM-106', 2.00, 349.00, 698.00),
(N'Tax Invoice', N'INV-2026-0004', N'ITEM-111', 2.00, 185.00, 370.00);

-- Invoice 5
INSERT INTO dbo.SalesHeader (InvoiceNumber, InvoiceType, Date, Customer, InvoiceDescription, TotalAmount)
VALUES (N'INV-2026-0005', N'Tax Invoice', '2026-09-04', N'CUST-007', N'Office infrastructure and network setup expansion', 4285.00);

INSERT INTO dbo.SalesDetails (InvoiceType, InvoiceNumber, ItemCode, Qty, Price, Amount)
VALUES
(N'Tax Invoice', N'INV-2026-0005', N'ITEM-110', 4.00, 210.00, 840.00),
(N'Tax Invoice', N'INV-2026-0005', N'ITEM-112', 3.00, 560.00, 1680.00),
(N'Tax Invoice', N'INV-2026-0005', N'ITEM-108', 2.00, 395.00, 790.00),
(N'Tax Invoice', N'INV-2026-0005', N'ITEM-101', 1.00, 520.00, 520.00),
(N'Tax Invoice', N'INV-2026-0005', N'ITEM-102', 3.00, 99.00, 297.00),
(N'Tax Invoice', N'INV-2026-0005', N'ITEM-105', 2.00, 115.00, 230.00);

-- Invoice 6
INSERT INTO dbo.SalesHeader (InvoiceNumber, InvoiceType, Date, Customer, InvoiceDescription, TotalAmount)
VALUES (N'INV-2026-0006', N'Cash Invoice', '2026-09-12', N'CUST-006', N'Display monitor consignment and storage stock', 5485.00);

INSERT INTO dbo.SalesDetails (InvoiceType, InvoiceNumber, ItemCode, Qty, Price, Amount)
VALUES
(N'Cash Invoice', N'INV-2026-0006', N'ITEM-104', 5.00, 680.00, 3400.00),
(N'Cash Invoice', N'INV-2026-0006', N'ITEM-109', 10.00, 140.00, 1400.00),
(N'Cash Invoice', N'INV-2026-0006', N'ITEM-104', 1.00, 685.00, 685.00);

-- Invoice 7
INSERT INTO dbo.SalesHeader (InvoiceNumber, InvoiceType, Date, Customer, InvoiceDescription, TotalAmount)
VALUES (N'INV-2026-0007', N'Tax Invoice', '2026-09-18', N'CUST-009', N'Warehouse terminal peripherals and mobile power', 2740.00);

INSERT INTO dbo.SalesDetails (InvoiceType, InvoiceNumber, ItemCode, Qty, Price, Amount)
VALUES
(N'Tax Invoice', N'INV-2026-0007', N'ITEM-107', 15.00, 125.00, 1875.00),
(N'Tax Invoice', N'INV-2026-0007', N'ITEM-102', 5.00, 99.00, 495.00),
(N'Tax Invoice', N'INV-2026-0007', N'ITEM-111', 2.00, 185.00, 370.00);

-- Invoice 8
INSERT INTO dbo.SalesHeader (InvoiceNumber, InvoiceType, Date, Customer, InvoiceDescription, TotalAmount)
VALUES (N'INV-2026-0008', N'Tax Invoice', '2026-09-21', N'CUST-010', N'Executive workstation bundle and accessories', 3824.00);

INSERT INTO dbo.SalesDetails (InvoiceType, InvoiceNumber, ItemCode, Qty, Price, Amount)
VALUES
(N'Tax Invoice', N'INV-2026-0008', N'ITEM-103', 1.00, 1999.00, 1999.00),
(N'Tax Invoice', N'INV-2026-0008', N'ITEM-101', 2.00, 520.00, 1040.00),
(N'Tax Invoice', N'INV-2026-0008', N'ITEM-108', 1.00, 395.00, 395.00),
(N'Tax Invoice', N'INV-2026-0008', N'ITEM-108', 1.00, 390.00, 390.00);
GO

-- Verification query
SELECT 'Customers Count' AS Metric, COUNT(*) AS Total FROM dbo.CustomerMaster
UNION ALL
SELECT 'Items Count', COUNT(*) FROM dbo.ItemMaster
UNION ALL
SELECT 'Invoices Count', COUNT(*) FROM dbo.SalesHeader
UNION ALL
SELECT 'Invoice Details Count', COUNT(*) FROM dbo.SalesDetails
UNION ALL
SELECT 'Users Count', COUNT(*) FROM dbo.UserMaster;
GO
