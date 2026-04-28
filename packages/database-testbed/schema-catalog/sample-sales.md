# SalesAnalyticsDemo Schema Catalog

This file is the human-readable schema/training-data context for the sample
SQL Server database. It is not fine-tuning data. It is runtime context that the
model should receive before generating SQL.

## Business Rules

- Revenue is `order_items.quantity * order_items.unit_price - order_items.discount_amount`.
- Use `orders.order_date` as the sale date unless the user asks about payments or shipments.
- Exclude `orders.status = 'Cancelled'` from revenue metrics unless the user explicitly asks to include cancelled orders.
- An unpaid order is an order whose total payments are less than its order item revenue.
- A late shipment can be approximated as `delivered_date > DATEADD(day, 7, shipped_date)`.
- Default row limit is 100 rows.

## Tables

### dbo.regions

Sales geography lookup.

| Column | Type | Meaning |
| --- | --- | --- |
| region_id | int | Primary key. |
| region_name | nvarchar(100) | Internal region name. |
| country | nvarchar(100) | Country represented by the region. |

### dbo.sales_reps

Sales representatives credited on orders.

| Column | Type | Meaning |
| --- | --- | --- |
| sales_rep_id | int | Primary key. |
| sales_rep_name | nvarchar(150) | Full representative name. |
| email | nvarchar(255) | Work email. |
| region_id | int | FK to `dbo.regions.region_id`. |
| hire_date | date | Hire date. |

### dbo.customers

Customer master data.

| Column | Type | Meaning |
| --- | --- | --- |
| customer_id | int | Primary key. |
| customer_name | nvarchar(200) | Customer display name. |
| customer_segment | nvarchar(50) | SMB, Mid-Market, or Enterprise. |
| email | nvarchar(255) | Billing or operations email. |
| city | nvarchar(100) | Customer city. |
| state_province | nvarchar(100) | State or province. |
| country | nvarchar(100) | Customer country. |
| region_id | int | FK to `dbo.regions.region_id`. |
| created_at | datetime2(0) | Account creation timestamp. |
| is_active | bit | Whether the customer is active. |

### dbo.product_categories

Product category lookup.

| Column | Type | Meaning |
| --- | --- | --- |
| category_id | int | Primary key. |
| category_name | nvarchar(100) | Category name. |
| description | nvarchar(500) | Category description. |

### dbo.products

Products and services sold.

| Column | Type | Meaning |
| --- | --- | --- |
| product_id | int | Primary key. |
| sku | nvarchar(50) | Unique product SKU. |
| product_name | nvarchar(200) | Product display name. |
| category_id | int | FK to `dbo.product_categories.category_id`. |
| list_price | decimal(12,2) | Standard list price. |
| standard_cost | decimal(12,2) | Cost used for margin estimates. |
| is_discontinued | bit | Whether product is discontinued. |

### dbo.orders

Sales order header table.

| Column | Type | Meaning |
| --- | --- | --- |
| order_id | int | Primary key. |
| order_number | nvarchar(30) | Human-readable order number. |
| customer_id | int | FK to `dbo.customers.customer_id`. |
| sales_rep_id | int | FK to `dbo.sales_reps.sales_rep_id`. |
| order_date | date | Sale/order date. |
| status | nvarchar(30) | Open, Closed, or Cancelled. |
| currency_code | char(3) | Currency for monetary values. |

### dbo.order_items

Order line items.

| Column | Type | Meaning |
| --- | --- | --- |
| order_item_id | int | Primary key. |
| order_id | int | FK to `dbo.orders.order_id`. |
| product_id | int | FK to `dbo.products.product_id`. |
| quantity | int | Units sold. |
| unit_price | decimal(12,2) | Actual unit sale price. |
| discount_amount | decimal(12,2) | Total discount on this line. |

Derived metrics:

- `line_revenue = quantity * unit_price - discount_amount`
- `line_margin = quantity * (unit_price - products.standard_cost) - discount_amount`

### dbo.payments

Payments against orders.

| Column | Type | Meaning |
| --- | --- | --- |
| payment_id | int | Primary key. |
| order_id | int | FK to `dbo.orders.order_id`. |
| payment_date | date | Payment date. |
| amount | decimal(12,2) | Payment amount. |
| payment_method | nvarchar(50) | Wire, ACH, or Credit Card. |
| payment_status | nvarchar(30) | Paid, Partial, or Unpaid. |

### dbo.shipments

Shipment status and delivery information.

| Column | Type | Meaning |
| --- | --- | --- |
| shipment_id | int | Primary key. |
| order_id | int | FK to `dbo.orders.order_id`. |
| shipped_date | date | Date shipment left warehouse. |
| delivered_date | date | Date shipment was delivered. |
| carrier | nvarchar(100) | Shipping carrier. |
| tracking_number | nvarchar(100) | Carrier tracking number. |
| shipment_status | nvarchar(30) | Pending, In Transit, or Delivered. |

## Relationships

| From | To | Cardinality |
| --- | --- | --- |
| dbo.regions.region_id | dbo.customers.region_id | one-to-many |
| dbo.regions.region_id | dbo.sales_reps.region_id | one-to-many |
| dbo.customers.customer_id | dbo.orders.customer_id | one-to-many |
| dbo.sales_reps.sales_rep_id | dbo.orders.sales_rep_id | one-to-many |
| dbo.product_categories.category_id | dbo.products.category_id | one-to-many |
| dbo.orders.order_id | dbo.order_items.order_id | one-to-many |
| dbo.products.product_id | dbo.order_items.product_id | one-to-many |
| dbo.orders.order_id | dbo.payments.order_id | one-to-many |
| dbo.orders.order_id | dbo.shipments.order_id | one-to-zero-or-one |

## Query Guidance

- Always schema-qualify tables with `dbo`.
- Prefer explicit `JOIN` syntax.
- Use `SELECT TOP 100` unless the result is aggregate-only.
- Return SQL Server T-SQL only.
- Never generate write, DDL, dynamic SQL, linked-server, or stored procedure calls.

