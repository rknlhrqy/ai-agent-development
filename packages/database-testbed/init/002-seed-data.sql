USE SalesAnalyticsDemo;
GO

SET IDENTITY_INSERT dbo.regions ON;
INSERT INTO dbo.regions (region_id, region_name, country) VALUES
    (1, N'Northeast', N'United States'),
    (2, N'West', N'United States'),
    (3, N'Central', N'United States'),
    (4, N'Canada', N'Canada');
SET IDENTITY_INSERT dbo.regions OFF;

SET IDENTITY_INSERT dbo.sales_reps ON;
INSERT INTO dbo.sales_reps (sales_rep_id, sales_rep_name, email, region_id, hire_date) VALUES
    (1, N'Avery Stone', N'avery.stone@example.com', 1, '2022-03-14'),
    (2, N'Maya Chen', N'maya.chen@example.com', 2, '2021-08-02'),
    (3, N'Jordan Lee', N'jordan.lee@example.com', 3, '2023-01-09'),
    (4, N'Sofia Martin', N'sofia.martin@example.com', 4, '2020-11-18');
SET IDENTITY_INSERT dbo.sales_reps OFF;

SET IDENTITY_INSERT dbo.customers ON;
INSERT INTO dbo.customers (customer_id, customer_name, customer_segment, email, city, state_province, country, region_id, created_at, is_active) VALUES
    (1, N'Acme Manufacturing', N'Enterprise', N'ap@acme.example.com', N'Boston', N'MA', N'United States', 1, '2023-01-15T09:00:00', 1),
    (2, N'Northwind Traders', N'Mid-Market', N'billing@northwind.example.com', N'Seattle', N'WA', N'United States', 2, '2023-02-20T10:30:00', 1),
    (3, N'Contoso Retail', N'Enterprise', N'finance@contoso.example.com', N'Chicago', N'IL', N'United States', 3, '2023-04-10T14:00:00', 1),
    (4, N'Fabrikam Labs', N'SMB', N'ops@fabrikam.example.com', N'Toronto', N'ON', N'Canada', 4, '2023-07-05T11:45:00', 1),
    (5, N'Blue Yonder Supply', N'Mid-Market', N'payables@blueyonder.example.com', N'Portland', N'OR', N'United States', 2, '2024-03-12T08:20:00', 1),
    (6, N'Litware Health', N'Enterprise', N'admin@litware.example.com', N'New York', N'NY', N'United States', 1, '2024-05-01T16:10:00', 1);
SET IDENTITY_INSERT dbo.customers OFF;

SET IDENTITY_INSERT dbo.product_categories ON;
INSERT INTO dbo.product_categories (category_id, category_name, description) VALUES
    (1, N'Analytics Software', N'Subscription and licensed analytics products'),
    (2, N'Implementation Services', N'Professional services for deployment and integration'),
    (3, N'Support Plans', N'Annual support and success packages'),
    (4, N'Training', N'Instructor-led and self-paced training products');
SET IDENTITY_INSERT dbo.product_categories OFF;

SET IDENTITY_INSERT dbo.products ON;
INSERT INTO dbo.products (product_id, sku, product_name, category_id, list_price, standard_cost, is_discontinued) VALUES
    (1, N'ANL-PRO', N'Analytics Pro Annual License', 1, 12000.00, 2800.00, 0),
    (2, N'ANL-ENT', N'Analytics Enterprise Annual License', 1, 42000.00, 9000.00, 0),
    (3, N'IMP-STD', N'Standard Implementation Package', 2, 8500.00, 5100.00, 0),
    (4, N'IMP-ADV', N'Advanced Implementation Package', 2, 18000.00, 11200.00, 0),
    (5, N'SUP-GOLD', N'Gold Support Plan', 3, 6500.00, 1800.00, 0),
    (6, N'TRN-TEAM', N'Team Training Workshop', 4, 3000.00, 1200.00, 0);
SET IDENTITY_INSERT dbo.products OFF;

SET IDENTITY_INSERT dbo.orders ON;
INSERT INTO dbo.orders (order_id, order_number, customer_id, sales_rep_id, order_date, status, currency_code) VALUES
    (1, N'SO-2025-0001', 1, 1, '2025-01-12', N'Closed', 'USD'),
    (2, N'SO-2025-0002', 2, 2, '2025-01-25', N'Closed', 'USD'),
    (3, N'SO-2025-0003', 3, 3, '2025-02-04', N'Closed', 'USD'),
    (4, N'SO-2025-0004', 4, 4, '2025-02-21', N'Closed', 'USD'),
    (5, N'SO-2025-0005', 5, 2, '2025-03-08', N'Open', 'USD'),
    (6, N'SO-2025-0006', 6, 1, '2025-03-17', N'Closed', 'USD'),
    (7, N'SO-2025-0007', 1, 1, '2025-04-11', N'Closed', 'USD'),
    (8, N'SO-2025-0008', 3, 3, '2025-04-20', N'Open', 'USD'),
    (9, N'SO-2025-0009', 2, 2, '2025-05-05', N'Closed', 'USD'),
    (10, N'SO-2025-0010', 6, 1, '2025-05-28', N'Cancelled', 'USD'),
    (11, N'SO-2025-0011', 4, 4, '2025-06-03', N'Closed', 'USD'),
    (12, N'SO-2025-0012', 5, 2, '2025-06-18', N'Closed', 'USD');
SET IDENTITY_INSERT dbo.orders OFF;

INSERT INTO dbo.order_items (order_id, product_id, quantity, unit_price, discount_amount) VALUES
    (1, 2, 1, 42000.00, 2500.00),
    (1, 4, 1, 18000.00, 0.00),
    (1, 5, 1, 6500.00, 0.00),
    (2, 1, 2, 12000.00, 1000.00),
    (2, 3, 1, 8500.00, 0.00),
    (3, 2, 1, 42000.00, 0.00),
    (3, 6, 3, 3000.00, 0.00),
    (4, 1, 1, 12000.00, 500.00),
    (4, 5, 1, 6500.00, 0.00),
    (5, 1, 1, 12000.00, 0.00),
    (5, 3, 1, 8500.00, 0.00),
    (6, 2, 1, 42000.00, 3000.00),
    (6, 4, 1, 18000.00, 1500.00),
    (7, 5, 2, 6500.00, 0.00),
    (7, 6, 2, 3000.00, 0.00),
    (8, 2, 1, 42000.00, 0.00),
    (8, 5, 1, 6500.00, 0.00),
    (9, 1, 3, 12000.00, 1500.00),
    (9, 6, 5, 3000.00, 0.00),
    (10, 4, 1, 18000.00, 0.00),
    (11, 1, 1, 12000.00, 0.00),
    (11, 3, 1, 8500.00, 0.00),
    (11, 5, 1, 6500.00, 0.00),
    (12, 2, 1, 42000.00, 4000.00),
    (12, 6, 4, 3000.00, 0.00);

INSERT INTO dbo.payments (order_id, payment_date, amount, payment_method, payment_status) VALUES
    (1, '2025-01-20', 64000.00, N'Wire', N'Paid'),
    (2, '2025-02-05', 31500.00, N'ACH', N'Paid'),
    (3, '2025-02-20', 51000.00, N'Wire', N'Paid'),
    (4, '2025-03-10', 18000.00, N'Credit Card', N'Paid'),
    (5, '2025-03-20', 5000.00, N'ACH', N'Partial'),
    (6, '2025-03-28', 55500.00, N'Wire', N'Paid'),
    (7, '2025-04-18', 19000.00, N'ACH', N'Paid'),
    (8, '2025-05-01', 0.00, N'ACH', N'Unpaid'),
    (9, '2025-05-15', 49500.00, N'Wire', N'Paid'),
    (11, '2025-06-14', 27000.00, N'Credit Card', N'Paid'),
    (12, '2025-07-01', 50000.00, N'Wire', N'Paid');

INSERT INTO dbo.shipments (order_id, shipped_date, delivered_date, carrier, tracking_number, shipment_status) VALUES
    (1, '2025-01-15', '2025-01-18', N'FedEx', N'FDX10001', N'Delivered'),
    (2, '2025-01-27', '2025-02-02', N'UPS', N'UPS10002', N'Delivered'),
    (3, '2025-02-06', '2025-02-09', N'FedEx', N'FDX10003', N'Delivered'),
    (4, '2025-02-25', '2025-03-06', N'DHL', N'DHL10004', N'Delivered'),
    (5, '2025-03-10', NULL, N'UPS', N'UPS10005', N'In Transit'),
    (6, '2025-03-19', '2025-03-22', N'FedEx', N'FDX10006', N'Delivered'),
    (7, '2025-04-13', '2025-04-16', N'UPS', N'UPS10007', N'Delivered'),
    (8, NULL, NULL, NULL, NULL, N'Pending'),
    (9, '2025-05-07', '2025-05-11', N'FedEx', N'FDX10009', N'Delivered'),
    (11, '2025-06-05', '2025-06-15', N'DHL', N'DHL10011', N'Delivered'),
    (12, '2025-06-20', '2025-06-23', N'UPS', N'UPS10012', N'Delivered');
GO

