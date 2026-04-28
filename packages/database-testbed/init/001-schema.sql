IF DB_ID(N'SalesAnalyticsDemo') IS NULL
BEGIN
    CREATE DATABASE SalesAnalyticsDemo;
END;
GO

USE SalesAnalyticsDemo;
GO

DROP TABLE IF EXISTS dbo.shipments;
DROP TABLE IF EXISTS dbo.payments;
DROP TABLE IF EXISTS dbo.order_items;
DROP TABLE IF EXISTS dbo.orders;
DROP TABLE IF EXISTS dbo.products;
DROP TABLE IF EXISTS dbo.product_categories;
DROP TABLE IF EXISTS dbo.customers;
DROP TABLE IF EXISTS dbo.sales_reps;
DROP TABLE IF EXISTS dbo.regions;
GO

CREATE TABLE dbo.regions (
    region_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_regions PRIMARY KEY,
    region_name NVARCHAR(100) NOT NULL,
    country NVARCHAR(100) NOT NULL
);

CREATE TABLE dbo.sales_reps (
    sales_rep_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_sales_reps PRIMARY KEY,
    sales_rep_name NVARCHAR(150) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    region_id INT NOT NULL,
    hire_date DATE NOT NULL,
    CONSTRAINT FK_sales_reps_regions FOREIGN KEY (region_id) REFERENCES dbo.regions(region_id)
);

CREATE TABLE dbo.customers (
    customer_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_customers PRIMARY KEY,
    customer_name NVARCHAR(200) NOT NULL,
    customer_segment NVARCHAR(50) NOT NULL,
    email NVARCHAR(255) NULL,
    city NVARCHAR(100) NOT NULL,
    state_province NVARCHAR(100) NULL,
    country NVARCHAR(100) NOT NULL,
    region_id INT NOT NULL,
    created_at DATETIME2(0) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT DF_customers_is_active DEFAULT (1),
    CONSTRAINT FK_customers_regions FOREIGN KEY (region_id) REFERENCES dbo.regions(region_id)
);

CREATE TABLE dbo.product_categories (
    category_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_product_categories PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500) NULL
);

CREATE TABLE dbo.products (
    product_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_products PRIMARY KEY,
    sku NVARCHAR(50) NOT NULL CONSTRAINT UQ_products_sku UNIQUE,
    product_name NVARCHAR(200) NOT NULL,
    category_id INT NOT NULL,
    list_price DECIMAL(12,2) NOT NULL,
    standard_cost DECIMAL(12,2) NOT NULL,
    is_discontinued BIT NOT NULL CONSTRAINT DF_products_is_discontinued DEFAULT (0),
    CONSTRAINT FK_products_categories FOREIGN KEY (category_id) REFERENCES dbo.product_categories(category_id)
);

CREATE TABLE dbo.orders (
    order_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_orders PRIMARY KEY,
    order_number NVARCHAR(30) NOT NULL CONSTRAINT UQ_orders_order_number UNIQUE,
    customer_id INT NOT NULL,
    sales_rep_id INT NOT NULL,
    order_date DATE NOT NULL,
    status NVARCHAR(30) NOT NULL,
    currency_code CHAR(3) NOT NULL CONSTRAINT DF_orders_currency_code DEFAULT ('USD'),
    CONSTRAINT FK_orders_customers FOREIGN KEY (customer_id) REFERENCES dbo.customers(customer_id),
    CONSTRAINT FK_orders_sales_reps FOREIGN KEY (sales_rep_id) REFERENCES dbo.sales_reps(sales_rep_id)
);

CREATE TABLE dbo.order_items (
    order_item_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_order_items PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL CONSTRAINT DF_order_items_discount DEFAULT (0),
    CONSTRAINT FK_order_items_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(order_id),
    CONSTRAINT FK_order_items_products FOREIGN KEY (product_id) REFERENCES dbo.products(product_id),
    CONSTRAINT CK_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT CK_order_items_discount CHECK (discount_amount >= 0)
);

CREATE TABLE dbo.payments (
    payment_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_payments PRIMARY KEY,
    order_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method NVARCHAR(50) NOT NULL,
    payment_status NVARCHAR(30) NOT NULL,
    CONSTRAINT FK_payments_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(order_id),
    CONSTRAINT CK_payments_amount CHECK (amount >= 0)
);

CREATE TABLE dbo.shipments (
    shipment_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_shipments PRIMARY KEY,
    order_id INT NOT NULL,
    shipped_date DATE NULL,
    delivered_date DATE NULL,
    carrier NVARCHAR(100) NULL,
    tracking_number NVARCHAR(100) NULL,
    shipment_status NVARCHAR(30) NOT NULL,
    CONSTRAINT FK_shipments_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(order_id)
);

CREATE INDEX IX_customers_region_id ON dbo.customers(region_id);
CREATE INDEX IX_sales_reps_region_id ON dbo.sales_reps(region_id);
CREATE INDEX IX_products_category_id ON dbo.products(category_id);
CREATE INDEX IX_orders_customer_id ON dbo.orders(customer_id);
CREATE INDEX IX_orders_sales_rep_id ON dbo.orders(sales_rep_id);
CREATE INDEX IX_orders_order_date ON dbo.orders(order_date);
CREATE INDEX IX_order_items_order_id ON dbo.order_items(order_id);
CREATE INDEX IX_order_items_product_id ON dbo.order_items(product_id);
CREATE INDEX IX_payments_order_id ON dbo.payments(order_id);
CREATE INDEX IX_shipments_order_id ON dbo.shipments(order_id);
GO

