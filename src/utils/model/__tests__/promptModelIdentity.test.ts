import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mock } from 'bun:test'

let mockedModelType: 'openai' | undefined

mock.module('../../settings/settings.js', () => ({
  getInitialSettings: () =>
    mockedModelType ? { modelType: mockedModelType } : {},
}))

const { getPromptModelIdentity, isLocalOllamaBaseUrl } = await import(
  '../promptModelIdentity.js'
)

describe('isLocalOllamaBaseUrl', () => {
  test('recognizes localhost Ollama URLs', () => {
    expect(isLocalOllamaBaseUrl('http://127.0.0.1:11434/v1')).toBe(true)
    expect(isLocalOllamaBaseUrl('http://localhost:11434/v1')).toBe(true)
    expect(isLocalOllamaBaseUrl('http://[::1]:11434/v1')).toBe(true)
  })

  test('rejects non-Ollama and remote URLs', () => {
    expect(isLocalOllamaBaseUrl('http://127.0.0.1:8080/v1')).toBe(false)
    expect(isLocalOllamaBaseUrl('https://api.openai.com/v1')).toBe(false)
    expect(isLocalOllamaBaseUrl('not-a-url')).toBe(false)
    expect(isLocalOllamaBaseUrl()).toBe(false)
  })
})

describe('getPromptModelIdentity', () => {
  const savedEnv: Record<string, string | undefined> = {}
  const envKeys = [
    'CLAUDE_CODE_USE_OPENAI',
    'OPENAI_BASE_URL',
    'OPENAI_MODEL',
  ] as const

  beforeEach(() => {
    mockedModelType = undefined
    for (const key of envKeys) {
      savedEnv[key] = process.env[key]
      delete process.env[key]
    }
  })

  afterEach(() => {
    mockedModelType = undefined
    for (const key of envKeys) {
      if (savedEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = savedEnv[key]
      }
    }
  })

  test('keeps Claude-native model identity unchanged', () => {
    expect(getPromptModelIdentity('claude-sonnet-4-5-20250929')).toBe(
      'claude-sonnet-4-5-20250929',
    )
  })

  test('uses OPENAI_MODEL for local Ollama through the OpenAI provider', () => {
    process.env.CLAUDE_CODE_USE_OPENAI = '1'
    process.env.OPENAI_BASE_URL = 'http://127.0.0.1:11434/v1'
    process.env.OPENAI_MODEL = 'gemma4:26b'

    expect(getPromptModelIdentity('claude-sonnet-4-5-20250929')).toBe(
      'gemma4:26b',
    )
  })

  test('uses OPENAI_MODEL for local Ollama when modelType selects OpenAI', () => {
    mockedModelType = 'openai'
    process.env.OPENAI_BASE_URL = 'http://localhost:11434/v1'
    process.env.OPENAI_MODEL = 'qwen2.5-coder:7b'

    expect(getPromptModelIdentity('claude-sonnet-4-5-20250929')).toBe(
      'qwen2.5-coder:7b',
    )
  })

  test('does not apply OPENAI_MODEL for non-Ollama OpenAI-compatible URLs', () => {
    process.env.CLAUDE_CODE_USE_OPENAI = '1'
    process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1'
    process.env.OPENAI_MODEL = 'gpt-4o'

    expect(getPromptModelIdentity('claude-sonnet-4-5-20250929')).toBe(
      'claude-sonnet-4-5-20250929',
    )
  })
})
