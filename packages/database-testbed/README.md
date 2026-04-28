# Database Query Assistant Testbed

Local MS SQL Server testbed for the future `DatabaseQueryTool`.

It provides:

- A Docker Compose MS SQL Server instance.
- Demo sales tables.
- Seed data for realistic joins and aggregations.
- A read-only login for safe query execution.
- A schema catalog that can be passed to the model as runtime context.

## Start

```bash
cd packages/database-testbed
docker compose up -d
```

The init container waits for SQL Server, creates the demo database, applies
schema/seed scripts, and creates a read-only user.

## Connection

Use these settings from the application during local development:

```text
server: 127.0.0.1
port: 1433
database: SalesAnalyticsDemo
user: claude_reader
password: ReadOnly!Passw0rd
encrypt: true
trustServerCertificate: true
```

Admin connection for debugging:
Use it in DBeaver software

```text
user: sa
password: YourStrong!Passw0rd
```

## Files

```text
docker-compose.yml
init/001-schema.sql
init/002-seed-data.sql
init/003-readonly-user.sql
schema-catalog/sample-sales.json
schema-catalog/sample-sales.md
```

## Example Questions

- Show total revenue by month for 2025.
- Which customers have the highest lifetime revenue?
- Show unpaid orders older than 30 days.
- Which products are frequently ordered together?
- Show revenue by sales rep last quarter.
- Which shipped orders were delivered late?

