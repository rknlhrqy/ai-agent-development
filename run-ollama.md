# Run With Ollama

This application can use a local Ollama model through its OpenAI-compatible
provider.

## Option 1: Run Directly With Environment Variables

Replace `your-ollama-model-name` with the exact model name from `ollama list`.

```bash
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_BASE_URL=http://127.0.0.1:11434/v1 \
OPENAI_API_KEY=ollama \
OPENAI_MODEL=your-ollama-model-name \
bun run dev
```

Example:

```bash
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_BASE_URL=http://127.0.0.1:11434/v1 \
OPENAI_API_KEY=ollama \
OPENAI_MODEL=gemma4:26b \
bun run dev
```

`OPENAI_API_KEY` is required by the OpenAI SDK even though Ollama does not use
it, so any dummy value such as `ollama` is fine.

## Option 2: Persistent Settings File

If `~/.claude/settings.json` does not exist, create it:

```bash
mkdir -p ~/.claude
touch ~/.claude/settings.json
```

Then put this in `~/.claude/settings.json`:

```json
{
  "modelType": "openai",
  "env": {
    "OPENAI_BASE_URL": "http://127.0.0.1:11434/v1",
    "OPENAI_API_KEY": "ollama",
    "OPENAI_MODEL": "your-ollama-model-name",
    "OPENAI_MAX_TOKENS": "4096"
  }
}
```

Example:

```json
{
  "modelType": "openai",
  "env": {
    "OPENAI_BASE_URL": "http://127.0.0.1:11434/v1",
    "OPENAI_API_KEY": "ollama",
    "OPENAI_MODEL": "qwen2.5-coder:7b",
    "OPENAI_MAX_TOKENS": "4096"
  }
}
```

After that, start the app normally:

```bash
bun run dev
```

## Useful Commands

List installed Ollama models:

```bash
ollama list
 need```

Switch provider inside the app:

```text
/provider openai
```

## Implementation Notes

The app selects the OpenAI-compatible provider when either:

- `modelType` is set to `"openai"` in settings, or
- `CLAUDE_CODE_USE_OPENAI=1` is present in the environment.

The OpenAI-compatible client reads:

- `OPENAI_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- optional `OPENAI_MAX_TOKENS`

`OPENAI_MODEL` controls the actual model sent to Ollama. When
`OPENAI_BASE_URL` points to a local Ollama server, the system prompt also uses
`OPENAI_MODEL` for the model identity text that answers questions such as
"which model are you using?".

For Ollama, use:

```text
OPENAI_BASE_URL=http://127.0.0.1:11434/v1
```
