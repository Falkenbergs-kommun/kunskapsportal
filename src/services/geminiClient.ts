/**
 * Unified Gemini Client Factory
 *
 * Supports both Google AI Studio and Vertex AI based on environment configuration.
 *
 * Environment Variables:
 * - GEMINI_MODE: 'aistudio' (default) or 'vertexai'
 *
 * AI Studio Mode:
 * - GEMINI_API_KEY: API key from ai.google.dev
 *
 * Vertex AI Mode:
 * - GOOGLE_CLOUD_PROJECT: GCP project ID
 * - GOOGLE_CLOUD_LOCATION: GCP region (e.g., 'europe-west4')
 * - GOOGLE_APPLICATION_CREDENTIALS: Path to service account JSON file
 */

import { GoogleGenAI } from '@google/genai'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export type GeminiMode = 'aistudio' | 'vertexai'

/**
 * Get the configured Gemini mode from environment
 */
export function getGeminiMode(): GeminiMode {
  const mode = process.env.GEMINI_MODE?.toLowerCase() || 'aistudio'
  if (mode !== 'aistudio' && mode !== 'vertexai') {
    console.warn(`Invalid GEMINI_MODE '${mode}', defaulting to 'aistudio'`)
    return 'aistudio'
  }
  return mode as GeminiMode
}

/**
 * Load service account credentials from file path
 */
function loadServiceAccountCredentials(filePath: string): object {
  // Resolve to absolute path
  const absolutePath = filePath.startsWith('/') ? filePath : resolve(process.cwd(), filePath)

  if (!existsSync(absolutePath)) {
    throw new Error(`Credentials file not found: ${absolutePath}`)
  }

  console.log(`[Gemini] Loading credentials from: ${absolutePath}`)

  try {
    const fileContent = readFileSync(absolutePath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    throw new Error(`Failed to parse credentials file: ${error instanceof Error ? error.message : 'Invalid JSON'}`)
  }
}

/**
 * Create a GoogleGenAI client configured for the current environment
 */
export function createGeminiClient(): GoogleGenAI {
  const mode = getGeminiMode()

  if (mode === 'vertexai') {
    // Vertex AI Mode - Use Google Cloud with service account
    const project = process.env.GOOGLE_CLOUD_PROJECT
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'europe-west4'
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS

    if (!project) {
      throw new Error('GOOGLE_CLOUD_PROJECT is required when GEMINI_MODE=vertexai')
    }

    if (!credentialsJson) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS (file path) is required when GEMINI_MODE=vertexai')
    }

    console.log(`[Gemini] Using Vertex AI in ${location} (project: ${project})`)

    // Pass the service account credentials explicitly. This is required because
    // @google/genai auto-reads GEMINI_API_KEY/GOOGLE_API_KEY from the env, and an
    // EMPTY string ("") is treated as a set API key (it's `!== undefined`), which
    // makes the SDK use (empty) API-key auth instead of Vertex ADC -> 401
    // CREDENTIALS_MISSING. Providing googleAuthOptions.credentials forces the SDK
    // to clear that api key and authenticate via the service account.
    const credentials = loadServiceAccountCredentials(credentialsJson)

    return new GoogleGenAI({
      vertexai: true,
      project,
      location,
      googleAuthOptions: {
        credentials: credentials as { client_email?: string; private_key?: string },
        projectId: project,
      },
    })
  } else {
    // AI Studio Mode - Use API key
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required when GEMINI_MODE=aistudio (or when GEMINI_MODE is not set)')
    }

    console.log('[Gemini] Using AI Studio (ai.google.dev)')

    return new GoogleGenAI({
      apiKey,
    })
  }
}

/**
 * Singleton instance of the Gemini client
 */
let geminiClientInstance: GoogleGenAI | null = null

/**
 * Get the shared Gemini client instance
 */
export function getGeminiClient(): GoogleGenAI {
  if (!geminiClientInstance) {
    geminiClientInstance = createGeminiClient()
  }
  return geminiClientInstance
}
