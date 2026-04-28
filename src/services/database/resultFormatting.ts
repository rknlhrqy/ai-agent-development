import type {
  GeneratedSql,
  SqlExecutionResult,
  SqlResultRow,
} from './types.js'

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function formatRowsAsPlainText(result: SqlExecutionResult): string {
  if (result.columns.length === 0) {
    return `(No columns returned; rows affected: ${result.rowsAffected.join(', ') || '0'})`
  }
  if (result.rows.length === 0) {
    return `(No rows returned)`
  }

  const widths = result.columns.map(column =>
    Math.min(
      40,
      Math.max(
        column.length,
        ...result.rows.map(row => stringifyCell(row[column]).length),
      ),
    ),
  )

  const renderCell = (value: unknown, width: number): string => {
    const text = stringifyCell(value)
    const clipped = text.length > width ? `${text.slice(0, width - 1)}…` : text
    return clipped.padEnd(width, ' ')
  }

  const header = result.columns
    .map((column, index) => renderCell(column, widths[index] ?? column.length))
    .join('  ')
    .trimEnd()
  const divider = widths.map(width => '-'.repeat(width)).join('  ')
  const body = result.rows.map((row: SqlResultRow) =>
    result.columns
      .map((column, index) => renderCell(row[column], widths[index] ?? 0))
      .join('  ')
      .trimEnd(),
  )

  return [header, divider, ...body].join('\n')
}

export function formatDatabaseQueryResponse(params: {
  question: string
  generated: GeneratedSql
  result: SqlExecutionResult
}): string {
  const assumptions =
    params.generated.assumptions.length > 0
      ? params.generated.assumptions.map(item => `- ${item}`).join('\n')
      : '- None'

  return [
    `Question:\n${params.question}`,
    `Generated SQL:\n${params.generated.sql}`,
    `Results (${params.result.rowCount} row${params.result.rowCount === 1 ? '' : 's'}):\n${formatRowsAsPlainText(params.result)}`,
    `Explanation:\n${params.generated.explanation}`,
    `Assumptions:\n${assumptions}`,
    `Confidence: ${params.generated.confidence}`,
  ].join('\n\n')
}

