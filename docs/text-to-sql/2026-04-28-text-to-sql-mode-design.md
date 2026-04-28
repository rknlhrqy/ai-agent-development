# Text-To-SQL Mode Design

## Purpose

Add an environment-variable controlled mode that turns the application into a
focused Text-To-SQL digital assistant. In this mode, user requests are treated
as requests to retrieve, analyze, summarize, or explain data from the configured
MS SQL Server database by default.

The mode is enabled with:

```bash
CLAUDE_CODE_TEXT_TO_SQL_MODE=1
```

Normal Claude Code behavior remains unchanged when the environment variable is
not enabled.

## User-Facing Behavior

When Text-To-SQL mode is enabled, the assistant should:

- Treat user messages as database data requests by default.
- Use `DatabaseQueryTool` for questions that require configured database data.
- Display the generated SQL and plain-text result data.
- Answer brief help and clarification questions about its database-assistant
  role.
- Ask clarifying questions when the requested database query is ambiguous.
- Refuse requests that are unrelated to retrieving, analyzing, or explaining
  configured database data.

Allowed examples:

- "Show revenue by month for 2025."
- "Which customers have the highest lifetime revenue?"
- "What can you do?"
- "What kind of database questions can I ask?"
- "What tables are available?"
- "Why was my request rejected?"

Rejected examples:

- "Edit this file."
- "Run this shell command."
- "Browse the web."
- "Explain this TypeScript error."
- "What is the capital of France?"

The standard refusal message is:

```text
I can only help with questions that retrieve or explain data from the configured database.
```

## Architecture

Add a small database mode helper:

```text
src/services/database/textToSqlMode.ts
```

Responsibilities:

- `isTextToSqlModeEnabled()`
- `getTextToSqlSystemPrompt()`
- `TEXT_TO_SQL_REFUSAL_MESSAGE`

The helper keeps mode detection and mode-specific policy text out of the large
entrypoint and REPL files.

## Tool Filtering

Update `src/tools.ts` so that, when Text-To-SQL mode is enabled, the available
tool list is restricted to the database query path.

First version target:

```text
DatabaseQueryTool
```

If the runtime requires internal non-user-facing tools for the REPL to function,
those tools may be preserved only when they are read-only and do not enable
file editing, shell execution, web browsing, or general coding workflows.

The important product rule is that Text-To-SQL mode must not expose normal
coding tools such as file edit/write, shell, web fetch/search, or agent tools.

## Prompt Policy

Append a Text-To-SQL policy to the effective system prompt when
`CLAUDE_CODE_TEXT_TO_SQL_MODE=1`.

The policy should say:

```text
You are a Text-To-SQL database assistant.
Treat user requests as requests to retrieve or analyze data from the configured SQL Server database by default.
Use DatabaseQueryTool for database data questions.
You may answer brief help or clarification questions about your database-assistant role.
If the request is not about retrieving, analyzing, or explaining configured database data, refuse with the standard refusal message.
Do not edit files, run shell commands, browse the web, or answer general coding/general knowledge questions in this mode.
```

The prompt policy handles intent and refusal behavior. Tool filtering enforces
the operational boundary.

## Request Flow

```text
User message
  -> REPL builds normal system/user/system context
  -> Text-To-SQL policy is appended when mode is enabled
  -> available tools are filtered to DatabaseQueryTool
  -> model decides whether the request is a database request, help/clarification, or unsupported
  -> database request calls DatabaseQueryTool
  -> DatabaseQueryTool generates SQL using schema catalog
  -> generated SQL is validated as read-only
  -> SQL executes against configured MS SQL Server
  -> response shows SQL plus plain-text result data
```

Unsupported requests should not trigger database execution.

## Database Schema Context

The schema catalog remains runtime context, not model fine-tuning. The main
assistant request receives the `DatabaseQueryTool` schema and prompt. The full
database schema catalog is loaded only when the database tool runs and creates
the second SQL-generation model request.

Default catalog path:

```text
packages/database-testbed/schema-catalog/sample-sales.json
```

Override:

```bash
CLAUDE_CODE_DB_SCHEMA_CATALOG_PATH=/absolute/path/to/schema-catalog.json
```

## Error Handling

If a user request is unsupported, return the standard refusal message.

If the request is a database request but the model cannot confidently generate
SQL, the assistant should ask a clarifying question or explain what schema data
is missing.

If generated SQL fails validation, the tool should not execute it. The response
should explain that the generated SQL was rejected for safety.

If database connection or execution fails, the response should make clear that
the data request could not be completed because the database call failed.

## Configuration

Relevant environment variables:

```text
CLAUDE_CODE_TEXT_TO_SQL_MODE=1
CLAUDE_CODE_USE_OPENAI=1
OPENAI_BASE_URL=http://127.0.0.1:11434/v1
OPENAI_API_KEY=ollama
OPENAI_MODEL=gemma4:26b

CLAUDE_CODE_DB_SERVER=127.0.0.1
CLAUDE_CODE_DB_PORT=1433
CLAUDE_CODE_DB_NAME=SalesAnalyticsDemo
CLAUDE_CODE_DB_USER=claude_reader
CLAUDE_CODE_DB_PASSWORD=ReadOnly!Passw0rd
CLAUDE_CODE_DB_SCHEMA_CATALOG_PATH=/absolute/path/to/packages/database-testbed/schema-catalog/sample-sales.json
```

## Testing

Add focused tests for:

- `isTextToSqlModeEnabled()` truthy and falsy values.
- Text-To-SQL system prompt includes the standard refusal policy.
- Normal mode still returns the normal tool list.
- Text-To-SQL mode includes `DatabaseQueryTool`.
- Text-To-SQL mode excludes file edit/write tools.
- Text-To-SQL mode excludes shell tools.
- Text-To-SQL mode excludes web tools.

Existing database service tests should continue to cover SQL validation and
result formatting.

## Non-Goals

- Do not add a standalone CLI command for Text-To-SQL.
- Do not fine-tune Gemma4.
- Do not support multiple databases in the first version.
- Do not allow write SQL.
- Do not preserve general Claude Code coding behavior while Text-To-SQL mode is
  enabled.

## Acceptance Criteria

- With `CLAUDE_CODE_TEXT_TO_SQL_MODE=1`, the app behaves as a database assistant
  by default.
- In Text-To-SQL mode, database questions call `DatabaseQueryTool`.
- In Text-To-SQL mode, unsupported non-database requests are refused.
- In Text-To-SQL mode, brief help and clarification questions are answered.
- In Text-To-SQL mode, normal file, shell, web, and coding tools are not exposed.
- Without `CLAUDE_CODE_TEXT_TO_SQL_MODE=1`, existing behavior is unchanged.
- Type checking passes.
- Relevant unit tests pass.

