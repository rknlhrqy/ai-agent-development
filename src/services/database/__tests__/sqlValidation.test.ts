import { describe, expect, test } from 'bun:test'
import { validateReadOnlySql } from '../sqlValidation'

describe('validateReadOnlySql', () => {
  test('allows a simple select', () => {
    const result = validateReadOnlySql('SELECT TOP 100 * FROM dbo.customers')
    expect(result.valid).toBe(true)
  })

  test('allows a read-only CTE', () => {
    const result = validateReadOnlySql(`
      WITH revenue AS (
        SELECT order_id, SUM(quantity * unit_price - discount_amount) AS total
        FROM dbo.order_items
        GROUP BY order_id
      )
      SELECT TOP 100 * FROM revenue
    `)
    expect(result.valid).toBe(true)
  })

  test('rejects write statements', () => {
    const result = validateReadOnlySql(
      "UPDATE dbo.customers SET customer_name = 'Acme'",
    )
    expect(result.valid).toBe(false)
  })

  test('rejects stored procedure calls', () => {
    const result = validateReadOnlySql('EXEC sp_who')
    expect(result.valid).toBe(false)
  })

  test('rejects multiple statements', () => {
    const result = validateReadOnlySql(
      'SELECT TOP 1 * FROM dbo.customers; SELECT TOP 1 * FROM dbo.orders',
    )
    expect(result.valid).toBe(false)
  })

  test('does not reject forbidden words inside string literals', () => {
    const result = validateReadOnlySql(
      "SELECT TOP 100 * FROM dbo.customers WHERE customer_name = 'Drop Table Inc'",
    )
    expect(result.valid).toBe(true)
  })
})

