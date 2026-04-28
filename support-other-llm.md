# Support Local Ollama Models: Fix Plan

## Problem

When the app is configured to use a local Ollama model through the
OpenAI-compatible provider, the actual API request can use the configured local
model, for example `gemma4:26b`, while the system prompt still tells the model:

```text
You are powered by the model named Sonnet 4.5. The exact model ID is claude-sonnet-4-5-20250929.
```

That is misleading. The model repeats this injected identity when the user asks
which model is running.

## Goal

Show the local Ollama model identity in the system prompt while preserving the
existing internal Claude-family model logic used for routing, context windows,
tool behavior, plan mode, fallback logic, and model selection.

## Constraints

- Do not change Claude/Anthropic behavior.
- Do not change Bedrock, Vertex, Foundry, Gemini, Grok, DeepSeek, vLLM, or any
  other provider behavior.
- Support only local Ollama usage through the existing OpenAI-compatible
  provider path.
- Keep the change narrowly scoped to model identity text in prompts unless a
  separate UI change is explicitly requested.

## Implementation Steps

1. Add an Ollama-aware model identity helper.

   Suggested helper:

   ```ts
   getPromptModelIdentity(model: string): string
   ```

   It should live near the existing model/provider utilities, for example under
   `src/utils/model/`.

2. Resolve only local Ollama model identity.

   The helper should check whether the active provider is the OpenAI-compatible
   provider and whether the base URL points to a local Ollama server. Only then
   should it use the configured `OPENAI_MODEL`.

   Proposed behavior:

   ```ts
   if (getAPIProvider() === "openai" && isLocalOllamaBaseUrl()) {
     return process.env.OPENAI_MODEL ?? model
   }

   return model
   ```

   Local Ollama base URLs include values such as:

   - `http://127.0.0.1:11434/v1`
   - `http://localhost:11434/v1`

3. Use the helper in system prompt identity text.

   Update the prompt generation path in `src/constants/prompts.ts`, especially
   the code that builds:

   ```text
   You are powered by the model named ...
   ```

   The model identity in that sentence should use the provider-facing model.

4. Keep internal model behavior unchanged.

   Do not replace `mainLoopModel` globally. The app still needs the internal
   Claude-family model string for:

   - context limit calculations
   - model picker behavior
   - plan mode model switching
   - tool capability checks
   - fallback model logic
   - usage/cost heuristics

   Only the identity text shown to the LLM should change in this fix.

5. Add regression tests for Claude models.

   Add a test proving that normal Claude/Anthropic behavior is unchanged.

   Example expectation:

   - input model: `claude-sonnet-4-5-20250929`
   - provider: default/Anthropic
   - prompt still says `Sonnet 4.5`
   - exact model ID remains `claude-sonnet-4-5-20250929`

6. Add Ollama tests.

   Add a test where:

   - provider is OpenAI-compatible
   - base URL is local Ollama, for example `http://127.0.0.1:11434/v1`
   - `OPENAI_MODEL=gemma4:26b`
   - input internal model is still the default Sonnet model
   - generated prompt mentions `gemma4:26b`
   - generated prompt does not claim Sonnet 4.5

7. Add a non-Ollama OpenAI-compatible regression test.

   Add a test where:

   - provider is OpenAI-compatible
   - base URL is not local Ollama
   - `OPENAI_MODEL` is set
   - generated prompt remains unchanged

   This ensures the change does not accidentally expand support to other
   OpenAI-compatible providers.

8. Update `run-ollama.md`.

   After the code fix, simplify the Ollama instructions. Users should not need
   to set all three workaround variables:

   - `OPENAI_DEFAULT_SONNET_MODEL`
   - `OPENAI_DEFAULT_HAIKU_MODEL`
   - `OPENAI_DEFAULT_OPUS_MODEL`

   The basic Ollama command should be enough:

   ```bash
   CLAUDE_CODE_USE_OPENAI=1 \
   OPENAI_BASE_URL=http://127.0.0.1:11434/v1 \
   OPENAI_API_KEY=ollama \
   OPENAI_MODEL=gemma4:26b \
   bun run dev
   ```

9. Verify.

    Run focused tests first:

    ```bash
    bun test <focused-test-file>
    ```

    Then run typecheck:

    ```bash
    bun run typecheck
    ```

## Expected Outcome

With Ollama configured as:

```bash
USER_TYPE=ant \
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_BASE_URL=http://127.0.0.1:11434/v1 \
OPENAI_API_KEY=ollama \
OPENAI_MODEL=gemma4:26b \
bun run dev
```

the app should send requests to Ollama using `gemma4:26b`, and the system prompt
should no longer tell the model it is Sonnet 4.5.

Claude-native usage should remain unchanged.
