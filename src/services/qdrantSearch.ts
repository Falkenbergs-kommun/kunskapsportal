import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'

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

const EMBEDDING_MODEL = 'text-embedding-3-large'
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
}

export interface SearchOptions {
  query: string
  departmentIds?: string[]
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

export async function searchKnowledgeBase({
  query,
  departmentIds = [],
  limit = 5,
}: SearchOptions): Promise<SearchResult[]> {
  try {
    // Get embedding for the query
    const queryEmbedding = await getEmbedding(query)

    // Build filter for departments if provided
    const filter: any = {}
    if (departmentIds.length > 0) {
      const numericDeptIds = departmentIds.map(id => parseInt(id))
      
      filter.should = numericDeptIds.map((deptId) => ({
        key: 'department.id',
        match: { value: deptId },
      }))
    }

    // Search in Qdrant
    const searchResult = await qdrant.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    })

    // Transform results with slug and URL construction
    const results = searchResult.map((result) => {
      const slug = result.payload?.slug as string | null
      const departmentPath = result.payload?.departmentPath as string | null

      // Construct URL with full department hierarchy
      let url = ''
      if (slug && departmentPath) {
        url = `/${departmentPath}/${slug}`
      }

      return {
        id: result.id as string,
        title: result.payload?.title as string || 'Untitled',
        text: result.payload?.text as string || '',
        department: result.payload?.department as string | null,
        documentType: result.payload?.documentType as string | null,
        score: result.score || 0,
        articleId: result.payload?.articleId as string || '',
        slug,
        departmentPath,
        url,
      }
    })

    return results
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