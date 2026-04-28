# How to Enable Prompt Dumping

Yes, prompt dumping is possible in this application, with a few caveats.

## What exists today

- Local raw prompt/request dumping already exists in `src/services/api/dumpPrompts.ts`.
- It is wired from `src/query.ts`, but only when `USER_TYPE=ant`.
- The dump fetch wrapper is passed into the shared API options in `src/query.ts`.
- The OpenAI/Ollama path also receives that same `fetchOverride` in `src/services/api/openai/index.ts`, so the same dumping mechanism should cover Ollama/OpenAI-compatible requests too.
- Logs are written under:
  - `~/.claude/dump-prompts/<session-or-agent-id>.jsonl`
  - `$CLAUDE_CONFIG_DIR/dump-prompts/<session-or-agent-id>.jsonl` if `CLAUDE_CONFIG_DIR` is set.

## Claude model logging

For local testing with the Claude/Anthropic path:

```bash
USER_TYPE=ant bun run dev
```

## Ollama/OpenAI-compatible model logging

For local testing with Ollama through the OpenAI-compatible provider:

```bash
USER_TYPE=ant \
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_BASE_URL=http://127.0.0.1:11434/v1 \
OPENAI_API_KEY=ollama \
OPENAI_MODEL=gemma4:26b \
bun run dev
```

## Important caveat

This is currently an internal/Ant-gated feature, not a clean public toggle.

For a proper user-facing feature, add a dedicated environment variable such as:

```bash
CLAUDE_CODE_DUMP_PROMPTS=1
```

Then update the gates in `src/query.ts` and `src/services/api/dumpPrompts.ts` from:

```ts
process.env.USER_TYPE === 'ant'
```

to something like:

```ts
process.env.USER_TYPE === 'ant' || isEnvTruthy(process.env.CLAUDE_CODE_DUMP_PROMPTS)
```

There is also Langfuse support for both Claude and OpenAI/Ollama paths, but that is observability tracing rather than local raw request logging. The existing normal debug logs only record counts/model metadata, not the full prompt.
