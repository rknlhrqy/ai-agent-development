import { getAPIProvider } from './providers.js'

const OLLAMA_LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

export function isLocalOllamaBaseUrl(baseUrl?: string): boolean {
  if (!baseUrl) return false

  try {
    const url = new URL(baseUrl)
    return OLLAMA_LOCAL_HOSTS.has(url.hostname) && url.port === '11434'
  } catch {
    return false
  }
}

export function getPromptModelIdentity(modelId: string): string {
  if (getAPIProvider() !== 'openai') return modelId
  if (!isLocalOllamaBaseUrl(process.env.OPENAI_BASE_URL)) return modelId

  return process.env.OPENAI_MODEL || modelId
}
