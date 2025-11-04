import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'
import {
  getExternalSources,
  createQdrantClientForSource,
  getNestedValue,
  isHierarchicalSource,
  type ExternalSourceConfig,
  type HierarchicalQdrantSourceConfig,
  type QdrantSourceConfig,
} from '@/config/externalSources'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const qdrantUrl = new URL(process.env.QDRANT_URL || 'http://localhost:6333')
const qdrant = new QdrantClient({
  host: qdrantUrl.hostname,
  port: parseInt(qdrantUrl.port, 10) || 443,
  https: qdrantUrl.protocol === 'https:',
  apiKey: process.env.QDRANT_API_KEY,
  checkCompatibility: false,
})

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large'
const COLLECTION_NAME = 'articles'

export interface SearchResult {
  id: string
  title: string
  text: string
  department: string | null
  documentType: string | null
  score: number
  articleId: string
  slug: string | null
  departmentPath: string | null
  url: string
  source: 'internal' | string
  isExternal: boolean
}

export interface SearchOptions {
  query: string
  departmentIds?: string[]
  externalSourceIds?: string[]
  subSourceFilters?: Record<string, string[]> // e.g., { 'svensk-lag': ['pbl', 'miljöbalken'] }
  limit?: number
}

async function getEmbedding(text: string): Promise<number[]> {
  const {
    data: [{ embedding }],
  } = await openai.embeddings.create({
    input: text,
    model: EMBEDDING_MODEL,
  })
  return embedding
}

/**
 * Search an external Qdrant collection using field mappings
 */
async function searchExternalCollection(
  source: QdrantSourceConfig | HierarchicalQdrantSourceConfig,
  queryEmbedding: number[],
  subSourceIds: string[] | undefined,
  limit: number,
): Promise<SearchResult[]> {
  const client = createQdrantClientForSource(source)

  // Build filter for hierarchical sources (similar to department filtering)
  let filter: any = undefined

  if (isHierarchicalSource(source) && subSourceIds && subSourceIds.length > 0) {
    // Filter by selected sub-sources (e.g., specific laws)
    filter = {
      should: subSourceIds.map((subId) => ({
        key: source.mapping.filterField,
        match: { value: subId },
      })),
    }
  }

  const searchResult = await client.search(source.collection, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
    filter,
  })

  return searchResult.map((result) => {
    // Extract values using field mappings
    const urlField = getNestedValue(result.payload, source.mapping.url)
    const titleField = getNestedValue(result.payload, source.mapping.title)
    const contentField = getNestedValue(result.payload, source.mapping.content)

    return {
      id: result.id as string,
      title: titleField || 'Untitled',
      text: contentField || '',
      department: null,
      documentType: 'external',
      score: result.score || 0,
      articleId: '',
      slug: null,
      departmentPath: null,
      url: urlField || '',
      source: source.id,
      isExternal: true,
    }
  })
}

export async function searchKnowledgeBase({
  query,
  departmentIds = [],
  externalSourceIds = [],
  subSourceFilters = {},
  limit = 5,
}: SearchOptions): Promise<SearchResult[]> {
  try {
    // Generate query embedding once (reuse for all collections)
    const queryEmbedding = await getEmbedding(query)

    const results: SearchResult[] = []

    // Always search internal collection (no UI option to exclude it)
    const searchInternal = true

    if (searchInternal) {
      try {
        // Check if internal collection exists
        const collections = await qdrant.getCollections()
        const collectionExists = collections.collections.some((col) => col.name === COLLECTION_NAME)

        if (collectionExists) {
          // Build filter for departments if provided
          const filter: any = {}
          if (departmentIds.length > 0) {
            const numericDeptIds = departmentIds.map((id) => parseInt(id))

            filter.should = numericDeptIds.map((deptId) => ({
              key: 'department.id',
              match: { value: deptId },
            }))
          }

          // Search in internal Qdrant collection
          const searchParams = {
            vector: queryEmbedding,
            limit: Math.min(limit, 10), // Cap semantic search at 10 results for quality
            with_payload: true,
            filter: Object.keys(filter).length > 0 ? filter : undefined,
            score_threshold: 0.3, // Return results with >30% similarity (better balance)
          }

          const searchResult = await qdrant.search(COLLECTION_NAME, searchParams)

          // Transform internal results
          const internalResults = searchResult.map((result) => {
            const slug = result.payload?.slug as string | null
            const departmentPath = result.payload?.departmentPath as string | null

            // Construct URL with full department hierarchy
            let url = ''
            if (slug && departmentPath) {
              url = `/${departmentPath}/${slug}`
            }

            return {
              id: result.id as string,
              title: (result.payload?.title as string) || 'Untitled',
              text: (result.payload?.text as string) || '',
              department: (result.payload?.department as string) || null,
              documentType: (result.payload?.documentType as string) || null,
              score: result.score || 0,
              articleId: (result.payload?.articleId as string) || '',
              slug,
              departmentPath,
              url,
              source: 'internal' as const,
              isExternal: false,
            }
          })

          results.push(...internalResults)
        } else {
          console.log(
            `Internal collection '${COLLECTION_NAME}' does not exist yet - skipping internal search`,
          )
        }
      } catch (error) {
        console.error('Error searching internal collection:', error)
        // Continue with external sources even if internal search fails
      }
    }

    // Search external sources in parallel
    const externalSources = getExternalSources()
    const sourcesToSearch = externalSources.filter((s) => externalSourceIds.includes(s.id))

    if (sourcesToSearch.length > 0) {
      const externalSearches = sourcesToSearch.map((source) => {
        // Get sub-source filters for this source (if hierarchical)
        const subSourceIds = subSourceFilters[source.id]
        return searchExternalCollection(
          source as QdrantSourceConfig | HierarchicalQdrantSourceConfig,
          queryEmbedding,
          subSourceIds,
          limit,
        )
      })

      const externalResults = await Promise.all(externalSearches)
      results.push(...externalResults.flat())
    }

    // Sort by score and limit
    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  } catch (error) {
    console.error('Error searching knowledge base:', error)
    throw new Error('Failed to search knowledge base')
  }
}