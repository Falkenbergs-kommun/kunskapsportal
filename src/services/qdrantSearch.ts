import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'
import {
  getExternalSources,
  createQdrantClientForSource,
  getNestedValue,
  type ExternalSourceConfig,
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
  source: ExternalSourceConfig,
  queryEmbedding: number[],
  limit: number,
): Promise<SearchResult[]> {
  const client = createQdrantClientForSource(source)

  const searchResult = await client.search(source.collection, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
  })

  return searchResult.map((result) => {
    // Extract values using field mappings
    const urlField = getNestedValue(result.payload, source.mapping.url)
    const titleField = getNestedValue(result.payload, source.mapping.title)
    const contentField = getNestedValue(result.payload, source.mapping.content)

    // Construct full URL
    let fullUrl = urlField || ''
    if (fullUrl && !fullUrl.startsWith('http') && source.urlBase) {
      fullUrl = `${source.urlBase}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`
    }

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
      url: fullUrl,
      source: source.id,
      isExternal: true,
    }
  })
}

export async function searchKnowledgeBase({
  query,
  departmentIds = [],
  externalSourceIds = [],
  limit = 5,
}: SearchOptions): Promise<SearchResult[]> {
  try {
    // Generate query embedding once (reuse for all collections)
    const queryEmbedding = await getEmbedding(query)

    const results: SearchResult[] = []

    // Search internal collection (unless only external sources requested)
    const searchInternal =
      externalSourceIds.length === 0 || externalSourceIds.includes('internal')

    if (searchInternal) {
      try {
        // Check if internal collection exists
        const collections = await qdrant.getCollections()
        const collectionExists = collections.collections.some(
          (col) => col.name === COLLECTION_NAME,
        )

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
          const searchResult = await qdrant.search(COLLECTION_NAME, {
            vector: queryEmbedding,
            limit,
            with_payload: true,
            filter: Object.keys(filter).length > 0 ? filter : undefined,
          })

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
      const externalSearches = sourcesToSearch.map((source) =>
        searchExternalCollection(source, queryEmbedding, limit),
      )

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

// Function to get all departments and their children recursively
export async function getDepartmentHierarchy(
  departmentId: string,
  payload: any
): Promise<string[]> {
  const departmentIds = [departmentId]
  
  try {
    // Find all departments that have this department as parent
    const childDepartments = await payload.find({
      collection: 'departments',
      where: {
        parent: {
          equals: departmentId,
        },
      },
      limit: 100,
    })

    // Recursively get children of children
    for (const child of childDepartments.docs) {
      const childIds = await getDepartmentHierarchy(child.id, payload)
      departmentIds.push(...childIds)
    }
  } catch (error) {
    console.error('Error getting department hierarchy:', error)
  }

  return departmentIds
}