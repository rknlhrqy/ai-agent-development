# Text-To-SQL Digital Assistant

This application is configured to work as a Text-To-SQL digital assistant using
Gemma4 through the OpenAI-compatible provider path. A user asks a plain-text
question, the assistant asks the model to generate a safe SQL Server `SELECT`
query, runs that query against MS SQL Server, and displays both the generated
SQL script and the returned data.

## What It Does

- Accepts a natural-language database question from the user.
- Uses Gemma4 to convert the question into SQL.
- Queries one fixed MS SQL Server database.
- Displays the generated SQL to the user.
- Displays the query result rows as plain text.
- Uses a schema catalog file as runtime training/context data for the model.
- Restricts generated SQL to read-only `SELECT`/CTE-style queries.

## Requirements

- Bun
- Docker Desktop or another Docker runtime
- Ollama or another OpenAI-compatible server running Gemma4
- The project dependencies installed with `bun install`

## Install Dependencies

Run these commands from the repository root:

```bash
cd /Users/keningren/Documents/my_work/code/claude-code-ai-agent-development
bun install
```

## Start the Local MS SQL Server Testbed

The test database runs as a local Docker Compose service. It creates a sample
sales database, seed data, and a read-only login.

```bash
cd packages/database-testbed
docker compose up -d
```

The default local database connection is:

```text
server: 127.0.0.1
port: 1433
database: SalesAnalyticsDemo
user: claude_reader
password: ReadOnly!Passw0rd
encrypt: true
trustServerCertificate: true
```

The schema and seed files are:

```text
packages/database-testbed/init/001-schema.sql
packages/database-testbed/init/002-seed-data.sql
packages/database-testbed/init/003-readonly-user.sql
```

The model-facing schema catalog is:

```text
packages/database-testbed/schema-catalog/sample-sales.json
```

There is also a human-readable version:

```text
packages/database-testbed/schema-catalog/sample-sales.md
```

## Run Gemma4

If using Ollama, make sure the model is available and the Ollama server is
running:

```bash
ollama pull gemma4:26b
ollama serve
```

If your local model name is different, use that value for `OPENAI_MODEL`.

## Run the Application

From the repository root:

```bash
USER_TYPE=ant \
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_BASE_URL=http://127.0.0.1:11434/v1 \
OPENAI_API_KEY=ollama \
OPENAI_MODEL=gemma4:26b \
bun run dev
```

Use this longer form when you want to override the database connection and
schema catalog path explicitly:

```bash
USER_TYPE=ant \
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_API_KEY=ollama \
OPENAI_BASE_URL=http://localhost:11434/v1 \
OPENAI_MODEL=gemma4:26b \
CLAUDE_CODE_DB_SERVER=127.0.0.1 \
CLAUDE_CODE_DB_PORT=1433 \
CLAUDE_CODE_DB_NAME=SalesAnalyticsDemo \
CLAUDE_CODE_DB_USER=claude_reader \
CLAUDE_CODE_DB_PASSWORD='ReadOnly!Passw0rd' \
CLAUDE_CODE_DB_SCHEMA_CATALOG_PATH=/Users/keningren/Documents/my_work/code/claude-code-ai-agent-development/packages/database-testbed/schema-catalog/sample-sales.json \
bun run dev
```

Several database environment variables have defaults, so for the included
testbed the minimum database configuration can usually be omitted. The explicit
form above is useful because it makes the runtime behavior obvious.

## Build the Application

From the repository root:

```bash
bun run build
```

The build output is written under `dist/`.

## Verify the Application

Run type checking:

```bash
bun run typecheck
```

Run tests:

```bash
bun test
```

Run the full check:

```bash
bun run test:all
```

## Example Questions

After the app is running, ask questions such as:

- Show total revenue by month for 2025.
- Which customers have the highest lifetime revenue?
- Show unpaid orders older than 30 days.
- Which products are frequently ordered together?
- Show revenue by sales rep last quarter.
- Which shipped orders were delivered late?

## Implementation Plan

The feature is implemented as a Claude tool, not as a standalone CLI command.
The main assistant receives the user's plain-text database request, decides when
to call the database query tool, and the tool performs the Text-To-SQL flow.

Planned flow:

1. Add a built-in `DatabaseQueryTool` that the model can call when the user asks
   a database question.
2. Load a schema catalog that describes the database tables, columns,
   relationships, and query rules.
3. Send the user's question plus the schema catalog to Gemma4 to generate SQL.
4. Validate the generated SQL so only read-only queries are allowed.
5. Execute the SQL against the configured MS SQL Server database using a
   read-only user.
6. Format the generated SQL and result rows as plain text.
7. Provide a local Docker testbed with sample tables, seed data, a read-only
   login, and matching schema catalog files.
8. Add focused tests for SQL validation and result formatting.

The schema catalog acts as runtime training/context data. It is not fine-tuning
the model. For a real database, replace the sample catalog with one that
accurately describes the production database schema and business rules.

## Added Modules and Folders

```text
packages/builtin-tools/src/tools/DatabaseQueryTool/
packages/database-testbed/
src/services/database/
```

## Added Files

```text
packages/builtin-tools/src/tools/DatabaseQueryTool/DatabaseQueryTool.ts
packages/builtin-tools/src/tools/DatabaseQueryTool/constants.ts
packages/builtin-tools/src/tools/DatabaseQueryTool/prompt.ts

packages/database-testbed/docker-compose.yml
packages/database-testbed/README.md
packages/database-testbed/init/001-schema.sql
packages/database-testbed/init/002-seed-data.sql
packages/database-testbed/init/003-readonly-user.sql
packages/database-testbed/schema-catalog/sample-sales.json
packages/database-testbed/schema-catalog/sample-sales.md

src/services/database/types.ts
src/services/database/schemaCatalog.ts
src/services/database/sqlGeneration.ts
src/services/database/sqlValidation.ts
src/services/database/sqlExecution.ts
src/services/database/resultFormatting.ts
src/services/database/__tests__/sqlValidation.test.ts
src/services/database/__tests__/resultFormatting.test.ts

text-to-sql-readme.md
```

## Updated Files

```text
package.json
bun.lock
src/tools.ts
```

The dependency update adds the MS SQL Server client library. The tool registry
update makes the database query tool available to the assistant.

## Prompt-Building Path

Here is the prompt-building path for a normal user question in this app.

### Main Request Flow

The REPL prepares context in `src/screens/REPL.tsx` around line 2960:

```text
getSystemPrompt(...)
getUserContext()
getSystemContext()
buildEffectiveSystemPrompt(...)
```

Then `query()` receives those pieces in `src/query.ts` around line 492:

```text
systemPrompt
systemContext
userContext
conversation messages
available tools
```

`query()` builds the final high-level request:

```text
fullSystemPrompt = appendSystemContext(systemPrompt, systemContext)
messages = prependUserContext(messagesForQuery, userContext)
```

The API layer then sends:

```text
system prompt blocks
user/assistant messages
tool schemas
model name
metadata/beta flags
```

### Where Each Piece Comes From

- System prompt: mostly from `src/constants/prompts.ts`, then adjusted by
  `buildEffectiveSystemPrompt(...)`.
- System context: built in `src/context.ts` around line 111, mainly including
  git status and optional cache breaker text.
- User context: built in `src/context.ts` around line 155, mainly including
  `CLAUDE.md` content and the current date.
- User context is prepended as a special user message using `src/utils/api.ts`
  around line 447.
- System context is appended to the system prompt using `src/utils/api.ts`
  around line 436.

### Tools

Tools are not simply pasted into the system prompt. They are converted into API
tool schemas in `src/utils/api.ts` around line 119.

For each tool, the API schema includes:

```text
tool name
input schema
tool.prompt(...) output as the tool description
```

The database tool contributes prompt text from:

```text
packages/builtin-tools/src/tools/DatabaseQueryTool/prompt.ts
```

That means the main model sees that there is a database query tool and learns
when and how to use it. It does not receive the full database schema catalog in
the main prompt.

### Database Query Tool Special Flow

When the model chooses the database tool, the tool creates a second model
request from:

```text
src/services/database/sqlGeneration.ts
```

That second request includes:

```text
SQL-generation system prompt
schema catalog JSON
user's natural language question
```

The schema catalog comes from:

```text
src/services/database/schemaCatalog.ts
```

Default path:

```text
packages/database-testbed/schema-catalog/sample-sales.json
```

### Provider Layer

For Claude/Anthropic, the final request is assembled in
`src/services/api/claude.ts` around line 1253.

There it builds:

```text
toolSchemas
final system prompt blocks
message list
request metadata
```

For OpenAI/Ollama-compatible models, the already-normalized Anthropic-style
request is converted to OpenAI chat format later in the OpenAI provider path.

So the final prompt is really a bundle:

```text
System prompt
+ appended system context
+ prepended user context message
+ conversation messages
+ tool schemas/descriptions
+ provider-specific headers/prefixes
```

For the database feature specifically:

```text
Main LLM request:
  system prompt + user context + messages + DatabaseQueryTool schema

If tool is called:
  second LLM request:
    SQL-generation system prompt
    + schema catalog/training data
    + user's database question
```

## Important Environment Variables

```text
CLAUDE_CODE_USE_OPENAI=1
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=gemma4:26b

CLAUDE_CODE_DB_SERVER=127.0.0.1
CLAUDE_CODE_DB_PORT=1433
CLAUDE_CODE_DB_NAME=SalesAnalyticsDemo
CLAUDE_CODE_DB_USER=claude_reader
CLAUDE_CODE_DB_PASSWORD=ReadOnly!Passw0rd
CLAUDE_CODE_DB_SCHEMA_CATALOG_PATH=/absolute/path/to/packages/database-testbed/schema-catalog/sample-sales.json
CLAUDE_CODE_DB_ROW_LIMIT=100
CLAUDE_CODE_DB_QUERY_TIMEOUT_MS=30000
```

## How the Schema Catalog Is Used

The schema catalog is the training/context data for Text-To-SQL. It describes
the tables, columns, relationships, and query guidance that the model needs in
order to generate correct SQL.

This is not model fine-tuning. The catalog is loaded at runtime and included in
the SQL-generation prompt when the database query tool runs.

For a real database, create a new catalog file that documents:

- table names and business meaning
- column names, types, and descriptions
- primary keys and foreign keys
- common joins
- important filters and date columns
- business rules and examples

## Safety Notes

The database user should remain read-only. The SQL validation layer is designed
to reject write operations, but the database account should still enforce least
privilege.

The assistant should display the generated SQL and returned data so the user can
inspect what was executed.
