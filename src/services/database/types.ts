export type SchemaCatalog = {
  catalogVersion: number
  database: string
  dialect: 'tsql' | string
  purpose?: string
  defaultRowLimit?: number
  businessRules?: string[]
  tables: SchemaCatalogTable[]
  relationships?: SchemaCatalogRelationship[]
  queryGuidance?: string[]
}

export type SchemaCatalogTable = {
  name: string
  description?: string
  primaryKey?: string[]
  foreignKeys?: Array<{
    columns: string[]
    references: string
  }>
  columns: SchemaCatalogColumn[]
  derivedMetrics?: Array<{
    name: string
    expression: string
    description?: string
  }>
}

export type SchemaCatalogColumn = {
  name: string
  type: string
  description?: string
}

export type SchemaCatalogRelationship = {
  from: string
  to: string
  cardinality?: string
}

export type GeneratedSql = {
  sql: string
  explanation: string
  assumptions: string[]
  confidence: 'low' | 'medium' | 'high'
}

export type SqlValidationResult =
  | { valid: true; normalizedSql: string }
  | { valid: false; reason: string }

export type SqlExecutionConfig = {
  server: string
  port: number
  database: string
  user: string
  password: string
  encrypt: boolean
  trustServerCertificate: boolean
  connectionTimeoutMs: number
  requestTimeoutMs: number
  rowLimit: number
}

export type SqlResultRow = Record<string, unknown>

export type SqlExecutionResult = {
  columns: string[]
  rows: SqlResultRow[]
  rowsAffected: number[]
  rowCount: number
}
