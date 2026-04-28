import { describe, expect, test } from 'bun:test'
import {
  formatDatabaseQueryResponse,
  formatRowsAsPlainText,
} from '../resultFormatting'

describe('formatRowsAsPlainText', () => {
  test('formats rows as a fixed-width text table', () => {
    const text = formatRowsAsPlainText({
      columns: ['customer_name', 'total_revenue'],
      rows: [
        { customer_name: 'Acme Manufacturing', total_revenue: 64000 },
        { customer_name: 'Northwind Traders', total_revenue: 31500 },
      ],
      rowsAffected: [2],
      rowCount: 2,
    })

    expect(text).toContain('customer_name')
    expect(text).toContain('total_revenue')
    expect(text).toContain('Acme Manufacturing')
    expect(text).toContain('64000')
  })

  test('formats empty results clearly', () => {
    const text = formatRowsAsPlainText({
      columns: ['customer_name'],
      rows: [],
      rowsAffected: [0],
      rowCount: 0,
    })

    expect(text).toBe('(No rows returned)')
  })
})

describe('formatDatabaseQueryResponse', () => {
  test('includes SQL, results, explanation, assumptions, and confidence', () => {
    const text = formatDatabaseQueryResponse({
      question: 'Top customers',
      generated: {
        sql: 'SELECT TOP 100 customer_name FROM dbo.customers',
        explanation: 'Lists customers.',
        assumptions: ['Used active customer records.'],
        confidence: 'high',
      },
      result: {
        columns: ['customer_name'],
        rows: [{ customer_name: 'Acme Manufacturing' }],
        rowsAffected: [1],
        rowCount: 1,
      },
    })

    expect(text).toContain('Generated SQL:')
    expect(text).toContain('SELECT TOP 100')
    expect(text).toContain('Acme Manufacturing')
    expect(text).toContain('Used active customer records.')
    expect(text).toContain('Confidence: high')
  })
})

