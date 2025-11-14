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

export type SearchMode = 'exact' | 'semantic' | 'hybrid'

export interface SearchOptions {
  query: string
  mode?: SearchMode
  departmentIds?: string[]
  externalSourceIds?: string[] // Can include dot notation like "svensk-lag.pbl"
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
 * Search an external Qdrant collection using semantic vector search
 */
async function searchExternalCollectionSemantic(
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

/**
 * Search an external Qdrant collection using exact keyword matching
 */
async function searchExternalCollectionExact(
  source: QdrantSourceConfig | HierarchicalQdrantSourceConfig,
  query: string,
  subSourceIds: string[] | undefined,
  limit: number,
): Promise<SearchResult[]> {
  const client = createQdrantClientForSource(source)

  // Build filter combining keyword search and sub-source filtering
  const filters: any[] = []

  // Add keyword filter (search in title and content)
  const queryLower = query.toLowerCase()
  filters.push({
    should: [
      {
        key: source.mapping.title,
        match: { text: queryLower },
      },
      {
        key: source.mapping.content,
        match: { text: queryLower },
      },
    ],
  })

  // Add sub-source filter if hierarchical
  if (isHierarchicalSource(source) && subSourceIds && subSourceIds.length > 0) {
    filters.push({
      should: subSourceIds.map((subId) => ({
        key: source.mapping.filterField,
        match: { value: subId },
      })),
    })
  }

  const filter = filters.length > 0 ? { must: filters } : undefined

  // Use scroll for keyword-based filtering (no vector search)
  const scrollResult = await client.scroll(source.collection, {
    limit,
    with_payload: true,
    filter,
  })

  return scrollResult.points.map((result) => {
    const urlField = getNestedValue(result.payload, source.mapping.url)
    const titleField = getNestedValue(result.payload, source.mapping.title)
    const contentField = getNestedValue(result.payload, source.mapping.content)

    // Simple keyword scoring for exact matches
    const titleMatch = titleField?.toLowerCase().includes(queryLower)
    const score = titleMatch ? 0.9 : 0.6

    return {
      id: result.id as string,
      title: titleField || 'Untitled',
      text: contentField || '',
      department: null,
      documentType: 'external',
      score,
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
  mode = 'hybrid',
  departmentIds = [],
  externalSourceIds = [],
  limit = 5,
}: SearchOptions): Promise<SearchResult[]> {
  try {
    const results: SearchResult[] = []
    const queryLower = query.toLowerCase()

    // Generate query embedding for semantic/hybrid search
    let queryEmbedding: number[] | null = null
    if (mode === 'semantic' || mode === 'hybrid') {
      queryEmbedding = await getEmbedding(query)
    }

    // Determine if this is a broad search (no filters) or filtered search
    const isBroadSearch = departmentIds.length === 0 && externalSourceIds.length === 0

    // Search internal collection when:
    // - Broad search (no filters) → search everywhere including internal
    // - Departments selected (with or without external sources) → include internal
    // - ONLY external sources selected → skip internal
    const searchInternal = isBroadSearch || departmentIds.length > 0

    if (searchInternal) {
      try {
        // Check if internal collection exists
        const collections = await qdrant.getCollections()
        const collectionExists = collections.collections.some((col) => col.name === COLLECTION_NAME)

        if (collectionExists) {
          // Build department filter
          let departmentFilter: any = undefined
          if (departmentIds.length > 0) {
            const numericDeptIds = departmentIds.map((id) => parseInt(id))
            departmentFilter = {
              should: numericDeptIds.map((deptId) => ({
                key: 'department.id',
                match: { value: deptId },
              })),
            }
          }

          const internalResults: SearchResult[] = []

          // EXACT MODE: Use payload filtering for keyword matching
          if (mode === 'exact' || mode === 'hybrid') {
            const keywordFilter: any = {
              should: [
                { key: 'title', match: { text: queryLower } },
                { key: 'text', match: { text: queryLower } },
                { key: 'summary', match: { text: queryLower } },
              ],
            }

            const filters: any[] = [keywordFilter]
            if (departmentFilter) {
              filters.push(departmentFilter)
            }

            const finalFilter = filters.length > 0 ? { must: filters } : undefined

            const scrollResult = await qdrant.scroll(COLLECTION_NAME, {
              limit: limit * 2,
              with_payload: true,
              filter: finalFilter,
            })

            const exactResults = scrollResult.points.map((result) => {
              const slug = result.payload?.slug as string | null
              const departmentPath = result.payload?.departmentPath as string | null
              const title = (result.payload?.title as string) || ''

              let url = ''
              if (slug && departmentPath) {
                url = `/${departmentPath}/${slug}`
              }

              // Score based on where the match occurs
              const titleMatch = title.toLowerCase().includes(queryLower)
              const score = titleMatch ? 0.95 : 0.75

              return {
                id: result.id as string,
                title,
                text: (result.payload?.text as string) || '',
                department: (result.payload?.department as string) || null,
                documentType: (result.payload?.documentType as string) || null,
                score,
                articleId: (result.payload?.articleId as string) || '',
                slug,
                departmentPath,
                url,
                source: 'internal' as const,
                isExternal: false,
              }
            })

            internalResults.push(...exactResults)
          }

          // SEMANTIC MODE: Use vector search
          if ((mode === 'semantic' || mode === 'hybrid') && queryEmbedding) {
            const searchResult = await qdrant.search(COLLECTION_NAME, {
              vector: queryEmbedding,
              limit: Math.min(limit, 10),
              with_payload: true,
              filter: departmentFilter,
              score_threshold: 0.3,
            })

            const semanticResults = searchResult.map((result) => {
              const slug = result.payload?.slug as string | null
              const departmentPath = result.payload?.departmentPath as string | null

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

            internalResults.push(...semanticResults)
          }

          // For hybrid mode, deduplicate and merge scores
          if (mode === 'hybrid') {
            const merged = new Map<string, SearchResult>()
            internalResults.forEach((result) => {
              const existing = merged.get(result.id)
              if (existing) {
                // Boost score if found in both exact and semantic
                existing.score = Math.min(existing.score + result.score * 0.3, 1.0)
              } else {
                merged.set(result.id, result)
              }
            })
            results.push(...Array.from(merged.values()))
          } else {
            results.push(...internalResults)
          }
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

    // Parse dot notation from externalSourceIds to extract parent sources and sub-sources
    // e.g., ["svensk-lag", "svensk-lag.pbl", "kommun"] =>
    //   parents: ["svensk-lag", "kommun"]
    //   subSourceMap: { "svensk-lag": ["pbl"] }
    const parentSourceIds = new Set<string>()
    const subSourceMap: Record<string, string[]> = {}

    for (const id of externalSourceIds) {
      if (id.includes('.')) {
        // This is a sub-source like "svensk-lag.pbl"
        const [parentId, subId] = id.split('.')
        parentSourceIds.add(parentId)
        if (!subSourceMap[parentId]) {
          subSourceMap[parentId] = []
        }
        subSourceMap[parentId].push(subId)
      } else {
        // This is a parent source
        parentSourceIds.add(id)
      }
    }

    // Determine which sources to search:
    // - Broad search (no filters) → search ALL external sources
    // - Filtered search → only search selected external sources
    const sourcesToSearch = isBroadSearch
      ? externalSources
      : externalSources.filter((s) => parentSourceIds.has(s.id))

    if (sourcesToSearch.length > 0) {
      const externalResults: SearchResult[] = []

      // EXACT MODE: Use keyword filtering
      if (mode === 'exact' || mode === 'hybrid') {
        const exactSearches = sourcesToSearch.map((source) => {
          const subSourceIds = subSourceMap[source.id]
          return searchExternalCollectionExact(
            source as QdrantSourceConfig | HierarchicalQdrantSourceConfig,
            query,
            subSourceIds,
            limit,
          )
        })
        const exactResults = await Promise.all(exactSearches)
        externalResults.push(...exactResults.flat())
      }

      // SEMANTIC MODE: Use vector search
      if ((mode === 'semantic' || mode === 'hybrid') && queryEmbedding) {
        const semanticSearches = sourcesToSearch.map((source) => {
          const subSourceIds = subSourceMap[source.id]
          return searchExternalCollectionSemantic(
            source as QdrantSourceConfig | HierarchicalQdrantSourceConfig,
            queryEmbedding,
            subSourceIds,
            limit,
          )
        })
        const semanticResults = await Promise.all(semanticSearches)
        externalResults.push(...semanticResults.flat())
      }

      // For hybrid mode, deduplicate external results
      if (mode === 'hybrid') {
        const merged = new Map<string, SearchResult>()
        externalResults.forEach((result) => {
          const key = `${result.source}-${result.id}`
          const existing = merged.get(key)
          if (existing) {
            existing.score = Math.min(existing.score + result.score * 0.3, 1.0)
          } else {
            merged.set(key, result)
          }
        })
        results.push(...Array.from(merged.values()))
      } else {
        results.push(...externalResults)
      }
    }

    // Sort by score and limit
    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  } catch (error) {
    console.error('Error searching knowledge base:', error)
    throw new Error('Failed to search knowledge base')
  }
}