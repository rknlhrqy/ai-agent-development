import { z } from 'zod/v4'
import { buildTool, type ToolDef } from 'src/Tool.js'
import { generateSqlFromQuestion } from 'src/services/database/sqlGeneration.js'
import { validateReadOnlySql } from 'src/services/database/sqlValidation.js'
import { executeSql } from 'src/services/database/sqlExecution.js'
import { formatDatabaseQueryResponse } from 'src/services/database/resultFormatting.js'
import { lazySchema } from 'src/utils/lazySchema.js'
import { DATABASE_QUERY_TOOL_NAME } from './constants.js'
import { DESCRIPTION, PROMPT } from './prompt.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    question: z
      .string()
      .min(1)
      .describe('The user question to answer using the configured SQL Server database.'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    question: z.string(),
    sql: z.string(),
    explanation: z.string(),
    assumptions: z.array(z.string()),
    confidence: z.enum(['low', 'medium', 'high']),
    rowCount: z.number(),
    columns: z.array(z.string()),
    resultText: z.string(),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Input = z.infer<InputSchema>
export type Output = z.infer<OutputSchema>

export const DatabaseQueryTool = buildTool({
  name: DATABASE_QUERY_TOOL_NAME,
  searchHint: 'query SQL Server database data',
  maxResultSizeChars: 200_000,
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  userFacingName() {
    return 'DatabaseQuery'
  },
  shouldDefer: true,
  isConcurrencySafe() {
    return false
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input) {
    return input.question
  },
  getActivityDescription(input) {
    return input?.question ? `Querying database: ${input.question}` : 'Querying database'
  },
  renderToolUseMessage() {
    return null
  },
  async call(input, context): Promise<{ data: Output }> {
    const generated = await generateSqlFromQuestion(input.question, context)
    const validation = validateReadOnlySql(generated.sql)
    if (!validation.valid) {
      throw new Error(`Generated SQL was rejected: ${validation.reason}\n\nSQL:\n${generated.sql}`)
    }

    const result = await executeSql(validation.normalizedSql)
    const resultText = formatDatabaseQueryResponse({
      question: input.question,
      generated: {
        ...generated,
        sql: validation.normalizedSql,
      },
      result,
    })

    return {
      data: {
        question: input.question,
        sql: validation.normalizedSql,
        explanation: generated.explanation,
        assumptions: generated.assumptions,
        confidence: generated.confidence,
        rowCount: result.rowCount,
        columns: result.columns,
        resultText,
      },
    }
  },
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: content.resultText,
    }
  },
  renderToolResultMessage(content) {
    return content.resultText
  },
} satisfies ToolDef<InputSchema, Output>)

