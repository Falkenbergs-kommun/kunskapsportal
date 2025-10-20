import { QdrantClient } from '@qdrant/js-client-rest'

export interface ExternalSourceConfig {
  id: string
  collection: string
  label: string
  qdrantUrl: string
  qdrantApiKey: string
  urlBase?: string
  mapping: {
    url: string
    title: string
    content: string
    description?: string
    updatedAt?: string
  }
  icon?: string
  color?: string
  enabled?: boolean
}

/**
 * Parse and validate external Qdrant sources from environment variable
 * Returns empty array if not configured (graceful degradation)
 */
export function getExternalSources(): ExternalSourceConfig[] {
  const sourcesEnv = process.env.EXTERNAL_QDRANT_SOURCES

  if (!sourcesEnv) {
    return []
  }

  try {
    const sources = JSON.parse(sourcesEnv) as ExternalSourceConfig[]

    // Validate and apply defaults
    return sources
      .filter((s) => s.enabled !== false)
      .map((source) => {
        // Apply defaults only if not provided
        const mapping = source.mapping || {}
        return {
          ...source,
          mapping: {
            url: mapping.url || 'metadata.url',
            title: mapping.title || 'metadata.title',
            content: mapping.content || 'content',
            description: mapping.description,
            updatedAt: mapping.updatedAt,
          },
        }
      })
  } catch (error) {
    console.error('Failed to parse EXTERNAL_QDRANT_SOURCES:', error)
    return []
  }
}

/**
 * Create a Qdrant client for a specific external source
 */
export function createQdrantClientForSource(source: ExternalSourceConfig): QdrantClient {
  const url = new URL(source.qdrantUrl)

  return new QdrantClient({
    host: url.hostname,
    port: parseInt(url.port, 10) || 443,
    https: url.protocol === 'https:',
    apiKey: source.qdrantApiKey,
    checkCompatibility: false,
  })
}

/**
 * Extract nested value from object using dot notation path
 * Example: getNestedValue({metadata: {title: 'Test'}}, 'metadata.title') => 'Test'
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((curr, key) => curr?.[key], obj)
}

// Cache clients to avoid creating multiple connections
const clientCache = new Map<string, QdrantClient>()

/**
 * Get cached Qdrant clients for all configured external sources
 */
export function getQdrantClients(): Map<string, QdrantClient> {
  const sources = getExternalSources()

  for (const source of sources) {
    if (!clientCache.has(source.id)) {
      clientCache.set(source.id, createQdrantClientForSource(source))
    }
  }

  return clientCache
}
