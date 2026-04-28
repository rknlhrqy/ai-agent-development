import { describe, expect, test } from 'bun:test'
import {
  TEXT_TO_SQL_REFUSAL_MESSAGE,
  getTextToSqlSystemPrompt,
  isTextToSqlModeEnabled,
} from '../textToSqlMode'

describe('isTextToSqlModeEnabled', () => {
  test('returns true for truthy env values', () => {
    expect(isTextToSqlModeEnabled({ CLAUDE_CODE_TEXT_TO_SQL_MODE: '1' })).toBe(
      true,
    )
    expect(
      isTextToSqlModeEnabled({ CLAUDE_CODE_TEXT_TO_SQL_MODE: 'true' }),
    ).toBe(true)
    expect(
      isTextToSqlModeEnabled({ CLAUDE_CODE_TEXT_TO_SQL_MODE: 'yes' }),
    ).toBe(true)
  })

  test('returns false for falsy or missing env values', () => {
    expect(isTextToSqlModeEnabled({})).toBe(false)
    expect(isTextToSqlModeEnabled({ CLAUDE_CODE_TEXT_TO_SQL_MODE: '0' })).toBe(
      false,
    )
    expect(
      isTextToSqlModeEnabled({ CLAUDE_CODE_TEXT_TO_SQL_MODE: 'false' }),
    ).toBe(false)
  })
})

describe('getTextToSqlSystemPrompt', () => {
  test('contains the database assistant policy and refusal message', () => {
    const prompt = getTextToSqlSystemPrompt()
    expect(prompt).toContain('Text-To-SQL database assistant')
    expect(prompt).toContain('DatabaseQueryTool')
    expect(prompt).toContain(TEXT_TO_SQL_REFUSAL_MESSAGE)
    expect(prompt).toContain('Do not edit files')
    expect(prompt).toContain('run shell commands')
    expect(prompt).toContain('browse the web')
  })
})
