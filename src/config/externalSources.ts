import { QdrantClient } from '@qdrant/js-client-rest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export type SourceType = 'qdrant' | 'hierarchical-qdrant'

export interface SubSource {
  id: string
  label: string
}

// Base configuration for all source types
interface BaseSourceConfig {
  id: string
  label: string
  icon?: string
  color?: string
  enabled?: boolean
}

// Standard Qdrant source (current implementation)
export interface QdrantSourceConfig extends BaseSourceConfig {
  type?: 'qdrant' | 'hierarchical-qdrant' // Support both types
  collection: string
  qdrantUrl: string
  qdrantApiKey: string
  mapping: {
    url: string
    title: string
    content: string
    description?: string
    updatedAt?: string
  }
}

// Hierarchical Qdrant source (e.g., Swedish law with filterable sub-sources)
export interface HierarchicalQdrantSourceConfig extends QdrantSourceConfig {
  type: 'hierarchical-qdrant'
  mapping: QdrantSourceConfig['mapping'] & {
    filterField: string // Field to filter by (e.g., "metadata.law_id")
  }
  subSources: SubSource[] // Available sub-filters (e.g., individual laws)
}

export type ExternalSourceConfig = QdrantSourceConfig | HierarchicalQdrantSourceConfig

/**
 * Parse and validate external Qdrant sources from configuration
 * Priority: 1) external-sources.config.json file, 2) EXTERNAL_QDRANT_SOURCES env var
 * Returns empty array if not configured (graceful degradation)
 */
export function getExternalSources(): ExternalSourceConfig[] {
  let sources: ExternalSourceConfig[] = []

  // Try reading from JSON config file first (easier to edit)
  try {
    const configPath = join(process.cwd(), 'external-sources.config.json')
    if (existsSync(configPath)) {
      const fileContent = readFileSync(configPath, 'utf-8')
      sources = JSON.parse(fileContent) as ExternalSourceConfig[]
      console.log('[External Sources] Loaded from external-sources.config.json')
    }
  } catch (error) {
    console.error('[External Sources] Failed to read external-sources.config.json:', error)
  }

  // Fallback to environment variable (backwards compatibility)
  if (sources.length === 0) {
    const sourcesEnv = process.env.EXTERNAL_QDRANT_SOURCES
    if (sourcesEnv) {
      try {
        sources = JSON.parse(sourcesEnv) as ExternalSourceConfig[]
        console.log('[External Sources] Loaded from EXTERNAL_QDRANT_SOURCES env var')
      } catch (error) {
        console.error('[External Sources] Failed to parse EXTERNAL_QDRANT_SOURCES:', error)
        return []
      }
    }
  }

  if (sources.length === 0) {
    console.log('[External Sources] No external sources configured')
    return []
  }

  // Validate and apply defaults
  return sources
    .filter((s) => s.enabled !== false)
    .map((source) => {
      // Apply defaults for Qdrant-based sources
      const mapping = (source as QdrantSourceConfig).mapping || {}

      // For hierarchical sources, ensure filterField is present
      if (source.type === 'hierarchical-qdrant') {
        const hierarchicalSource = source as HierarchicalQdrantSourceConfig
        return {
          ...hierarchicalSource,
          mapping: {
            url: mapping.url || 'metadata.url',
            title: mapping.title || 'metadata.title',
            content: mapping.content || 'content',
            description: mapping.description,
            updatedAt: mapping.updatedAt,
            filterField: hierarchicalSource.mapping.filterField || 'metadata.filter_id',
          },
        }
      }

      // Standard Qdrant source
      return {
        ...source,
        mapping: {
          url: mapping.url || 'metadata.url',
          title: mapping.title || 'metadata.title',
          content: mapping.content || 'content',
          description: mapping.description,
          updatedAt: mapping.updatedAt,
        },
      } as QdrantSourceConfig
    })
}

/**
 * Create a Qdrant client for a specific external source
 * Only works for Qdrant-based sources (not Google Grounding)
 */
export function createQdrantClientForSource(
  source: QdrantSourceConfig | HierarchicalQdrantSourceConfig,
): QdrantClient {
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
 * Type guard to check if source is hierarchical
 */
export function isHierarchicalSource(
  source: ExternalSourceConfig,
): source is HierarchicalQdrantSourceConfig {
  return source.type === 'hierarchical-qdrant'
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
