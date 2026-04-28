export const DESCRIPTION =
  'Ask a natural-language question against the configured SQL Server database. The tool generates safe read-only T-SQL, executes it, and returns the SQL plus plain-text results.'

export const PROMPT = `Use this tool when the user asks a question that requires data from the configured SQL Server database.

The tool:
- Converts the user's natural-language question into SQL Server T-SQL using the configured schema catalog.
- Validates that the SQL is read-only.
- Executes the query against the configured fixed SQL Server database.
- Returns the generated SQL, plain-text results, explanation, assumptions, and confidence.

Use this for database questions such as:
- "Show revenue by month."
- "Which customers have the highest lifetime value?"
- "Show unpaid orders older than 30 days."
- "Which sales reps closed the most revenue last quarter?"

Do not use this tool for editing files, running shell commands, or answering questions that do not require database data.`

