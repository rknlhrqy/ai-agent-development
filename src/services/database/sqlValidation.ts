import type { SqlValidationResult } from './types.js'

const FORBIDDEN_PATTERNS = [
  /\binsert\b/i,
  /\bupdate\b/i,
  /\bdelete\b/i,
  /\bdrop\b/i,
  /\balter\b/i,
  /\bcreate\b/i,
  /\btruncate\b/i,
  /\bmerge\b/i,
  /\bexec(?:ute)?\b/i,
  /\bgrant\b/i,
  /\brevoke\b/i,
  /\bdeny\b/i,
  /\bbackup\b/i,
  /\brestore\b/i,
  /\bopenrowset\b/i,
  /\bopenquery\b/i,
  /\bsp_[a-z0-9_]*\b/i,
  /\bxp_[a-z0-9_]*\b/i,
]

function stripStringLiteralsAndComments(sql: string): string {
  let result = ''
  let i = 0
  while (i < sql.length) {
    const ch = sql[i]
    const next = sql[i + 1]

    if (ch === "'" || ch === '"') {
      const quote = ch
      result += ' '
      i++
      while (i < sql.length) {
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            i += 2
            continue
          }
          i++
          break
        }
        i++
      }
      continue
    }

    if (ch === '-' && next === '-') {
      result += ' '
      i += 2
      while (i < sql.length && sql[i] !== '\n') i++
      continue
    }

    if (ch === '/' && next === '*') {
      result += ' '
      i += 2
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++
      i += 2
      continue
    }

    result += ch
    i++
  }
  return result
}

function hasMultipleStatements(sql: string): boolean {
  const stripped = stripStringLiteralsAndComments(sql).trim()
  const withoutTrailingSemicolons = stripped.replace(/;+\s*$/u, '')
  return withoutTrailingSemicolons.includes(';')
}

export function validateReadOnlySql(sql: string): SqlValidationResult {
  const normalizedSql = sql.trim()
  if (!normalizedSql) {
    return { valid: false, reason: 'SQL is empty.' }
  }

  if (hasMultipleStatements(normalizedSql)) {
    return {
      valid: false,
      reason: 'Only one SQL statement is allowed.',
    }
  }

  const inspectableSql = stripStringLiteralsAndComments(normalizedSql)
    .trim()
    .replace(/;+\s*$/u, '')

  if (!/^(select|with)\b/i.test(inspectableSql)) {
    return {
      valid: false,
      reason: 'Only SELECT queries or read-only CTE queries are allowed.',
    }
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(inspectableSql)) {
      return {
        valid: false,
        reason: `Rejected unsafe SQL pattern: ${pattern.source}`,
      }
    }
  }

  return { valid: true, normalizedSql }
}

