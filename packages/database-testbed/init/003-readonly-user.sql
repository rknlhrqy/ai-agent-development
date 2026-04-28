USE SalesAnalyticsDemo;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'claude_reader')
BEGIN
    CREATE LOGIN claude_reader WITH PASSWORD = N'ReadOnly!Passw0rd', CHECK_POLICY = OFF;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'claude_reader')
BEGIN
    CREATE USER claude_reader FOR LOGIN claude_reader;
END;
GO

ALTER ROLE db_datareader ADD MEMBER claude_reader;
GO

DENY INSERT, UPDATE, DELETE, ALTER, CONTROL, TAKE OWNERSHIP TO claude_reader;
GO

