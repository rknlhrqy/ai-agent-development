import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { z } from 'zod/v4'
import { getOriginalCwd } from 'src/bootstrap/state.js'
import { safeParseJSON } from 'src/utils/json.js'
import { lazySchema } from 'src/utils/lazySchema.js'
import { jsonStringify } from 'src/utils/slowOperations.js'
import type { SchemaCatalog } from './types.js'

const columnSchema = lazySchema(() =>
  z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
  }),
)

const catalogSchema = lazySchema(() =>
  z.object({
    catalogVersion: z.number(),
    database: z.string(),
    dialect: z.string(),
    purpose: z.string().optional(),
    defaultRowLimit: z.number().optional(),
    businessRules: z.array(z.string()).optional(),
    tables: z.array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        primaryKey: z.array(z.string()).optional(),
        foreignKeys: z
          .array(
            z.object({
              columns: z.array(z.string()),
              references: z.string(),
            }),
          )
          .optional(),
        columns: z.array(columnSchema()),
        derivedMetrics: z
          .array(
            z.object({
              name: z.string(),
              expression: z.string(),
              description: z.string().optional(),
            }),
          )
          .optional(),
      }),
    ),
    relationships: z
      .array(
        z.object({
          from: z.string(),
          to: z.string(),
          cardinality: z.string().optional(),
        }),
      )
      .optional(),
    queryGuidance: z.array(z.string()).optional(),
  }),
)

export function getDefaultSchemaCatalogPath(): string {
  return resolve(
    getOriginalCwd(),
    'packages/database-testbed/schema-catalog/sample-sales.json',
  )
}

export function getSchemaCatalogPath(): string {
  return process.env.CLAUDE_CODE_DB_SCHEMA_CATALOG_PATH
    ? resolve(process.env.CLAUDE_CODE_DB_SCHEMA_CATALOG_PATH)
    : getDefaultSchemaCatalogPath()
}

export async function loadSchemaCatalog(): Promise<SchemaCatalog> {
  const filePath = getSchemaCatalogPath()
  if (!existsSync(filePath)) {
    throw new Error(
      `Database schema catalog not found at ${filePath}. Set CLAUDE_CODE_DB_SCHEMA_CATALOG_PATH to a catalog JSON file.`,
    )
  }

  const raw = await readFile(filePath, 'utf8')
  const parsed = catalogSchema().safeParse(safeParseJSON(raw))
  if (!parsed.success) {
    throw new Error(`Invalid database schema catalog at ${filePath}`)
  }

  return parsed.data as SchemaCatalog
}

export function renderSchemaCatalogForPrompt(catalog: SchemaCatalog): string {
  return jsonStringify(catalog, null, 2)
}

