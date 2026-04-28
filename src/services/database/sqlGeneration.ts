import { z } from 'zod/v4'
import { queryWithModel } from 'src/services/api/claude.js'
import { safeParseJSON } from 'src/utils/json.js'
import { lazySchema } from 'src/utils/lazySchema.js'
import { extractTextContent } from 'src/utils/messages.js'
import { asSystemPrompt } from 'src/utils/systemPromptType.js'
import type { ToolUseContext } from 'src/Tool.js'
import {
  loadSchemaCatalog,
  renderSchemaCatalogForPrompt,
} from './schemaCatalog.js'
import type { GeneratedSql, SchemaCatalog } from './types.js'

const generatedSqlSchema = lazySchema(() =>
  z.object({
    sql: z.string().min(1),
    explanation: z.string().default(''),
    assumptions: z.array(z.string()).default([]),
    confidence: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
)

const SQL_GENERATION_SYSTEM_PROMPT = `You convert user questions into safe SQL Server T-SQL SELECT queries.

Rules:
- Return JSON only with keys: sql, explanation, assumptions, confidence.
- Generate exactly one read-only query.
- Use SQL Server T-SQL syntax.
- Use only tables and columns in the provided schema catalog.
- Always schema-qualify tables with dbo.
- Use explicit JOIN syntax.
- Include SELECT TOP 100 for detail/list queries unless the query is aggregate-only.
- Exclude cancelled orders from revenue metrics unless the user explicitly asks to include them.
- Never generate INSERT, UPDATE, DELETE, MERGE, DROP, ALTER, CREATE, TRUNCATE, EXEC, stored procedures, dynamic SQL, linked server calls, OPENROWSET, or OPENQUERY.
- If the question cannot be answered from the schema, return a conservative SELECT that explains the limitation in assumptions.`

function extractJsonObject(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
  return trimmed
}

function parseGeneratedSql(text: string): GeneratedSql {
  const parsed = generatedSqlSchema().safeParse(
    safeParseJSON(extractJsonObject(text), false),
  )
  if (!parsed.success) {
    throw new Error(`Model did not return valid SQL JSON: ${text.slice(0, 500)}`)
  }
  return parsed.data
}

export function buildSqlGenerationPrompt(params: {
  question: string
  catalog: SchemaCatalog
}): string {
  return [
    'Schema catalog:',
    renderSchemaCatalogForPrompt(params.catalog),
    '',
    'User question:',
    params.question,
  ].join('\n')
}

export async function generateSqlFromQuestion(
  question: string,
  context: ToolUseContext,
): Promise<GeneratedSql> {
  const catalog = await loadSchemaCatalog()
  const result = await queryWithModel({
    systemPrompt: asSystemPrompt([SQL_GENERATION_SYSTEM_PROMPT]),
    userPrompt: buildSqlGenerationPrompt({ question, catalog }),
    outputFormat: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          sql: { type: 'string' },
          explanation: { type: 'string' },
          assumptions: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['sql', 'explanation', 'assumptions', 'confidence'],
        additionalProperties: false,
      },
    },
    signal: context.abortController.signal,
    options: {
      model: context.options.mainLoopModel,
      querySource: 'database_query_tool',
      agents: context.options.agentDefinitions.activeAgents,
      allowedAgentTypes: context.options.agentDefinitions.allowedAgentTypes,
      isNonInteractiveSession: context.options.isNonInteractiveSession,
      hasAppendSystemPrompt: !!context.options.appendSystemPrompt,
      mcpTools: context.getAppState().mcp.tools,
      maxOutputTokensOverride: 2048,
      temperatureOverride: 0,
      langfuseTrace: context.langfuseTrace,
    },
  })

  const content = result.message.content
  const text =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? extractTextContent(content, '\n')
        : ''
  return parseGeneratedSql(text)
}
