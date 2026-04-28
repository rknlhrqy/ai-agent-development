# Text-To-SQL Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `CLAUDE_CODE_TEXT_TO_SQL_MODE=1` so the app behaves as a focused Text-To-SQL database assistant.

**Architecture:** Add a small database mode helper, use it to filter available tools to `DatabaseQueryTool`, and append a Text-To-SQL policy to the effective system prompt. The existing `DatabaseQueryTool` keeps owning SQL generation, validation, execution, and result formatting.

**Tech Stack:** Bun, TypeScript, bun:test, existing Claude Code tool registry, existing database service modules.

---

## File Structure

- Create: `src/services/database/textToSqlMode.ts`
  - Owns env-var detection, standard refusal message, and Text-To-SQL system policy text.
- Create: `src/services/database/__tests__/textToSqlMode.test.ts`
  - Tests env-var parsing and policy text.
- Modify: `src/tools.ts`
  - Filters built-in tools to `DatabaseQueryTool` when Text-To-SQL mode is enabled.
  - Prevents MCP tools from being exposed in Text-To-SQL mode.
- Modify: `tests/integration/tool-chain.test.ts`
  - Tests normal mode remains unchanged enough to include normal tools.
  - Tests Text-To-SQL mode exposes `DatabaseQueryTool` and excludes file/shell/web tools.
- Modify: `src/screens/REPL.tsx`
  - Appends Text-To-SQL policy to the effective system prompt in foreground and background query paths.
- Modify: `text-to-sql-readme.md`
  - Documents `CLAUDE_CODE_TEXT_TO_SQL_MODE=1` in launch examples and behavior notes.

## Task 1: Add Text-To-SQL Mode Helper

**Files:**
- Create: `src/services/database/textToSqlMode.ts`
- Create: `src/services/database/__tests__/textToSqlMode.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Create `src/services/database/__tests__/textToSqlMode.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import {
  TEXT_TO_SQL_REFUSAL_MESSAGE,
  getTextToSqlSystemPrompt,
  isTextToSqlModeEnabled,
} from '../textToSqlMode'

describe('isTextToSqlModeEnabled', () => {
  test('returns true for truthy env values', () => {
    expect(isTextToSqlModeEnabled({ CLAUDE_CODE_TEXT_TO_SQL_MODE: '1' })).toBe(
      true,
    )
    expect(
      isTextToSqlModeEnabled({ CLAUDE_CODE_TEXT_TO_SQL_MODE: 'true' }),
    ).toBe(true)
    expect(
      isTextToSqlModeEnabled({ CLAUDE_CODE_TEXT_TO_SQL_MODE: 'yes' }),
    ).toBe(true)
  })

  test('returns false for falsy or missing env values', () => {
    expect(isTextToSqlModeEnabled({})).toBe(false)
    expect(isTextToSqlModeEnabled({ CLAUDE_CODE_TEXT_TO_SQL_MODE: '0' })).toBe(
      false,
    )
    expect(
      isTextToSqlModeEnabled({ CLAUDE_CODE_TEXT_TO_SQL_MODE: 'false' }),
    ).toBe(false)
  })
})

describe('getTextToSqlSystemPrompt', () => {
  test('contains the database assistant policy and refusal message', () => {
    const prompt = getTextToSqlSystemPrompt()
    expect(prompt).toContain('Text-To-SQL database assistant')
    expect(prompt).toContain('DatabaseQueryTool')
    expect(prompt).toContain(TEXT_TO_SQL_REFUSAL_MESSAGE)
    expect(prompt).toContain('Do not edit files')
    expect(prompt).toContain('run shell commands')
    expect(prompt).toContain('browse the web')
  })
})
```

- [ ] **Step 2: Run the failing helper tests**

Run:

```bash
bun test src/services/database/__tests__/textToSqlMode.test.ts
```

Expected: FAIL because `src/services/database/textToSqlMode.ts` does not exist.

- [ ] **Step 3: Implement the mode helper**

Create `src/services/database/textToSqlMode.ts`:

```ts
import { isEnvTruthy } from 'src/utils/envUtils.js'

export const TEXT_TO_SQL_REFUSAL_MESSAGE =
  'I can only help with questions that retrieve or explain data from the configured database.'

type EnvLike = Record<string, string | undefined>

export function isTextToSqlModeEnabled(
  env: EnvLike = process.env,
): boolean {
  return isEnvTruthy(env.CLAUDE_CODE_TEXT_TO_SQL_MODE)
}

export function getTextToSqlSystemPrompt(): string {
  return `You are a Text-To-SQL database assistant.

Treat user requests as requests to retrieve, analyze, summarize, or explain data from the configured SQL Server database by default.

Use DatabaseQueryTool for database data questions.

You may answer brief help or clarification questions about your database-assistant role, including what you can do, what kinds of questions the user can ask, what tables are available, and why a request was rejected.

If the request is not about retrieving, analyzing, summarizing, or explaining configured database data, refuse with this exact message:
${TEXT_TO_SQL_REFUSAL_MESSAGE}

Do not edit files, run shell commands, browse the web, use agents, or answer general coding/general knowledge questions in this mode.`
}
```

- [ ] **Step 4: Run the helper tests**

Run:

```bash
bun test src/services/database/__tests__/textToSqlMode.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/database/textToSqlMode.ts src/services/database/__tests__/textToSqlMode.test.ts
git commit -m "feat: add text-to-sql mode helper"
```

## Task 2: Filter Tools in Text-To-SQL Mode

**Files:**
- Modify: `src/tools.ts`
- Modify: `tests/integration/tool-chain.test.ts`

- [ ] **Step 1: Write failing tool filtering tests**

Append these tests inside the existing `describe("Tool chain: getTools with context", () => { ... })` block in `tests/integration/tool-chain.test.ts`:

```ts
  test("normal mode keeps core coding tools available", () => {
    const previous = process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE;
    delete process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE;
    try {
      const ctx = getEmptyToolPermissionContext();
      const toolNames = getTools(ctx).map(tool => tool.name);
      expect(toolNames).toContain("Bash");
      expect(toolNames).toContain("Read");
      expect(toolNames).toContain("Edit");
      expect(toolNames).toContain("DatabaseQuery");
    } finally {
      if (previous === undefined) {
        delete process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE;
      } else {
        process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE = previous;
      }
    }
  });

  test("text-to-sql mode exposes only the database query tool", () => {
    const previous = process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE;
    process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE = "1";
    try {
      const ctx = getEmptyToolPermissionContext();
      const toolNames = getTools(ctx).map(tool => tool.name);
      expect(toolNames).toEqual(["DatabaseQuery"]);
      expect(toolNames).not.toContain("Bash");
      expect(toolNames).not.toContain("Read");
      expect(toolNames).not.toContain("Edit");
      expect(toolNames).not.toContain("Write");
      expect(toolNames).not.toContain("WebFetch");
      expect(toolNames).not.toContain("WebSearch");
      expect(toolNames).not.toContain("Agent");
    } finally {
      if (previous === undefined) {
        delete process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE;
      } else {
        process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE = previous;
      }
    }
  });
```

Update the import at the top of `tests/integration/tool-chain.test.ts`:

```ts
import {
  getAllBaseTools,
  parseToolPreset,
  getTools,
  assembleToolPool,
} from "../../src/tools.ts";
```

Append this test after the `getTools` tests:

```ts
  test("text-to-sql mode does not expose MCP tools through assembled tool pool", () => {
    const previous = process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE;
    process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE = "1";
    try {
      const ctx = getEmptyToolPermissionContext();
      const mcpTool = buildTool({
        name: "mcp__demo__unsafe",
        description: "Should not be exposed in Text-To-SQL mode",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
        call: async () => ({}),
      });
      const toolNames = assembleToolPool(ctx, [mcpTool]).map(tool => tool.name);
      expect(toolNames).toEqual(["DatabaseQuery"]);
    } finally {
      if (previous === undefined) {
        delete process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE;
      } else {
        process.env.CLAUDE_CODE_TEXT_TO_SQL_MODE = previous;
      }
    }
  });
```

- [ ] **Step 2: Run the failing tool tests**

Run:

```bash
bun test tests/integration/tool-chain.test.ts
```

Expected: FAIL because Text-To-SQL mode does not filter tools yet.

- [ ] **Step 3: Implement tool filtering**

Modify `src/tools.ts`.

Add this import near the other local imports:

```ts
import { isTextToSqlModeEnabled } from './services/database/textToSqlMode.js'
```

Update `getToolsForDefaultPreset()`:

```ts
export function getToolsForDefaultPreset(): string[] {
  if (isTextToSqlModeEnabled()) {
    return [DatabaseQueryTool.name]
  }
  const tools = getAllBaseTools()
  const isEnabled = tools.map(tool => tool.isEnabled())
  return tools.filter((_, i) => isEnabled[i]).map(tool => tool.name)
}
```

Add this block at the top of `getTools()`, before the `CLAUDE_CODE_SIMPLE` branch:

```ts
  if (isTextToSqlModeEnabled()) {
    const textToSqlTools = filterToolsByDenyRules(
      [DatabaseQueryTool],
      permissionContext,
    )
    const isEnabled = textToSqlTools.map(tool => tool.isEnabled())
    return textToSqlTools.filter((_, i) => isEnabled[i])
  }
```

Update `assembleToolPool()` immediately after `const builtInTools = getTools(permissionContext)`:

```ts
  if (isTextToSqlModeEnabled()) {
    return builtInTools
  }
```

- [ ] **Step 4: Run the tool tests**

Run:

```bash
bun test tests/integration/tool-chain.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools.ts tests/integration/tool-chain.test.ts
git commit -m "feat: restrict tools in text-to-sql mode"
```

## Task 3: Append Text-To-SQL Prompt Policy in REPL

**Files:**
- Modify: `src/screens/REPL.tsx`

- [ ] **Step 1: Add the imports**

Modify `src/screens/REPL.tsx` near the existing imports:

```ts
import {
  getTextToSqlSystemPrompt,
  isTextToSqlModeEnabled,
} from 'src/services/database/textToSqlMode.js';
```

- [ ] **Step 2: Add a local append helper**

Add this helper near other top-level helpers in `src/screens/REPL.tsx`:

```ts
function appendTextToSqlSystemPrompt(
  appendSystemPrompt: string | undefined,
): string | undefined {
  if (!isTextToSqlModeEnabled()) return appendSystemPrompt;
  const textToSqlPrompt = getTextToSqlSystemPrompt();
  return appendSystemPrompt
    ? `${appendSystemPrompt}\n\n${textToSqlPrompt}`
    : textToSqlPrompt;
}
```

- [ ] **Step 3: Use the helper in the foreground query path**

Find the foreground `buildEffectiveSystemPrompt({ ... })` call around `src/screens/REPL.tsx:2971`.

Change:

```ts
        appendSystemPrompt,
```

to:

```ts
        appendSystemPrompt: appendTextToSqlSystemPrompt(appendSystemPrompt),
```

- [ ] **Step 4: Use the helper in the background query path**

Find the background `buildEffectiveSystemPrompt({ ... })` call around `src/screens/REPL.tsx:3336`.

Change:

```ts
        appendSystemPrompt,
```

to:

```ts
        appendSystemPrompt: appendTextToSqlSystemPrompt(appendSystemPrompt),
```

- [ ] **Step 5: Use the helper in the resumed/rendered prompt path**

Find the `buildEffectiveSystemPrompt({ ... })` call around `src/screens/REPL.tsx:6296`.

Change:

```ts
                        appendSystemPrompt: context.options.appendSystemPrompt,
```

to:

```ts
                        appendSystemPrompt: appendTextToSqlSystemPrompt(
                          context.options.appendSystemPrompt,
                        ),
```

- [ ] **Step 6: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/screens/REPL.tsx
git commit -m "feat: append text-to-sql prompt policy"
```

## Task 4: Update Documentation and Run Verification

**Files:**
- Modify: `text-to-sql-readme.md`

- [ ] **Step 1: Update the short launch script**

In `text-to-sql-readme.md`, update the short launch script to include the new mode flag:

```bash
USER_TYPE=ant \
CLAUDE_CODE_TEXT_TO_SQL_MODE=1 \
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_BASE_URL=http://127.0.0.1:11434/v1 \
OPENAI_API_KEY=ollama \
OPENAI_MODEL=gemma4:26b \
bun run dev
```

- [ ] **Step 2: Update the long launch script**

In `text-to-sql-readme.md`, update the longer launch script to include:

```bash
CLAUDE_CODE_TEXT_TO_SQL_MODE=1 \
```

Place it immediately after `USER_TYPE=ant \`.

- [ ] **Step 3: Update important environment variables**

In the `Important Environment Variables` section, add:

```text
CLAUDE_CODE_TEXT_TO_SQL_MODE=1
```

Place it before `CLAUDE_CODE_USE_OPENAI=1`.

- [ ] **Step 4: Add a mode behavior note**

Add this paragraph near the top of `text-to-sql-readme.md` after the introductory paragraph:

```md
When `CLAUDE_CODE_TEXT_TO_SQL_MODE=1` is enabled, the assistant treats user messages as database data requests by default. It can answer brief help or clarification questions about its database-assistant role, but it refuses non-database requests instead of acting like a general coding assistant.
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
bun test src/services/database/__tests__/textToSqlMode.test.ts tests/integration/tool-chain.test.ts src/services/database/__tests__/sqlValidation.test.ts src/services/database/__tests__/resultFormatting.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add text-to-sql-readme.md
git commit -m "docs: document text-to-sql mode"
```

## Task 5: Final Acceptance Check

**Files:**
- No code changes expected.

- [ ] **Step 1: Verify git status**

Run:

```bash
git status --short
```

Expected: only intentional pre-existing user changes remain. There should be no unstaged Text-To-SQL mode implementation files.

- [ ] **Step 2: Run full verification**

Run:

```bash
bun run typecheck
```

Expected: PASS.

Run:

```bash
bun test src/services/database/__tests__/textToSqlMode.test.ts tests/integration/tool-chain.test.ts
```

Expected: PASS.

- [ ] **Step 3: Manual smoke test command**

Start the app with:

```bash
USER_TYPE=ant \
CLAUDE_CODE_TEXT_TO_SQL_MODE=1 \
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_BASE_URL=http://127.0.0.1:11434/v1 \
OPENAI_API_KEY=ollama \
OPENAI_MODEL=gemma4:26b \
bun run dev
```

Ask:

```text
What can you do?
```

Expected: assistant answers with database-assistant capabilities.

Ask:

```text
Show total revenue by month for 2025.
```

Expected: assistant uses `DatabaseQueryTool` and displays generated SQL plus result data.

Ask:

```text
Edit README.md.
```

Expected: assistant refuses with:

```text
I can only help with questions that retrieve or explain data from the configured database.
```

- [ ] **Step 4: Final commit if manual smoke test led to doc/test adjustments**

Only run this if Task 5 produced additional intentional changes. First inspect
the exact changed paths:

```bash
git status --short
```

Then stage only the intentional Text-To-SQL mode files. For example:

```bash
git add src/services/database/textToSqlMode.ts src/services/database/__tests__/textToSqlMode.test.ts src/tools.ts tests/integration/tool-chain.test.ts src/screens/REPL.tsx text-to-sql-readme.md
git commit -m "fix: refine text-to-sql mode"
```
