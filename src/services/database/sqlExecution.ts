import type { config as MssqlConfig, IRecordSet, IResult } from 'mssql'
import { isEnvTruthy } from 'src/utils/envUtils.js'
import type {
  SqlExecutionConfig,
  SqlExecutionResult,
  SqlResultRow,
} from './types.js'

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function getSqlExecutionConfig(): SqlExecutionConfig {
  return {
    server: process.env.CLAUDE_CODE_DB_SERVER ?? '127.0.0.1',
    port: numberFromEnv('CLAUDE_CODE_DB_PORT', 1433),
    database: process.env.CLAUDE_CODE_DB_NAME ?? 'SalesAnalyticsDemo',
    user: process.env.CLAUDE_CODE_DB_USER ?? 'claude_reader',
    password: process.env.CLAUDE_CODE_DB_PASSWORD ?? 'ReadOnly!Passw0rd',
    encrypt:
      process.env.CLAUDE_CODE_DB_ENCRYPT === undefined
        ? true
        : isEnvTruthy(process.env.CLAUDE_CODE_DB_ENCRYPT),
    trustServerCertificate:
      process.env.CLAUDE_CODE_DB_TRUST_SERVER_CERT === undefined
        ? true
        : isEnvTruthy(process.env.CLAUDE_CODE_DB_TRUST_SERVER_CERT),
    connectionTimeoutMs: numberFromEnv(
      'CLAUDE_CODE_DB_CONNECTION_TIMEOUT_MS',
      15000,
    ),
    requestTimeoutMs: numberFromEnv('CLAUDE_CODE_DB_QUERY_TIMEOUT_MS', 30000),
    rowLimit: numberFromEnv('CLAUDE_CODE_DB_ROW_LIMIT', 100),
  }
}

function toMssqlConfig(config: SqlExecutionConfig): MssqlConfig {
  return {
    server: config.server,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    connectionTimeout: config.connectionTimeoutMs,
    requestTimeout: config.requestTimeoutMs,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: config.trustServerCertificate,
    },
    pool: {
      min: 0,
      max: 1,
    },
  }
}

function normalizeRows(recordset: IRecordSet<Record<string, unknown>>): {
  columns: string[]
  rows: SqlResultRow[]
} {
  const columns = new Set<string>(Object.keys(recordset.columns ?? {}))
  for (const row of recordset) {
    for (const key of Object.keys(row)) {
      columns.add(key)
    }
  }
  return {
    columns: [...columns],
    rows: recordset.map(row => ({ ...row })),
  }
}

export async function executeSql(sqlText: string): Promise<SqlExecutionResult> {
  const mssql = await import('mssql')
  const config = getSqlExecutionConfig()
  const pool = new mssql.ConnectionPool(toMssqlConfig(config))
  try {
    await pool.connect()
    const limitedSql = `SET ROWCOUNT ${config.rowLimit};\n${sqlText.replace(/;+\s*$/u, '')};\nSET ROWCOUNT 0;`
    const result: IResult<Record<string, unknown>> = await pool
      .request()
      .query<Record<string, unknown>>(limitedSql)
    const { columns, rows } = normalizeRows(result.recordset)
    return {
      columns,
      rows,
      rowsAffected: result.rowsAffected,
      rowCount: rows.length,
    }
  } finally {
    await pool.close()
  }
}
