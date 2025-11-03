import { getPayload } from 'payload'
import config from '@payload-config'
import { searchKnowledgeBase, type SearchResult } from './qdrantSearch'
import type { Article } from '@/payload-types'

export type SearchMode = 'hybrid' | 'semantic' | 'exact'

export interface HybridSearchOptions {
  query: string
  mode?: SearchMode
  departmentId?: string
  limit?: number
  offset?: number
}

export interface HybridSearchResult {
  article: Article
  score: number
  matchType: 'exact-title' | 'exact-content' | 'semantic'
  highlightText?: string
}

export interface HybridSearchResponse {
  results: HybridSearchResult[]
  total: number
  mode: SearchMode
  timings: {
    postgres?: number
    qdrant?: number
    total: number
  }
}

/**
 * Performs PostgreSQL exact/keyword search
 */
async function exactSearch(
  query: string,
  departmentId?: string,
  limit: number = 50,
): Promise<{ articles: Article[]; total: number; time: number }> {
  const startTime = Date.now()
  const payload = await getPayload({ config })

  const whereClause: any = {
    _status: { equals: 'published' },
  }

  if (departmentId) {
    whereClause.department = { equals: departmentId }
  }

  // Add search conditions
  if (query.trim()) {
    whereClause.or = [
      { title: { contains: query } },
      { content: { contains: query } },
      { summary: { contains: query } },
      { author: { contains: query } },
    ]
  }

  const result = await payload.find({
    collection: 'articles',
    where: whereClause,
    depth: 3,
    limit,
  })

  return {
    articles: result.docs,
    total: result.totalDocs,
    time: Date.now() - startTime,
  }
}

/**
 * Performs Qdrant semantic vector search
 */
async function semanticSearch(
  query: string,
  departmentId?: string,
  limit: number = 50,
): Promise<{ results: SearchResult[]; time: number }> {
  const startTime = Date.now()

  // For semantic search, keep it focused with max 10 results
  const results = await searchKnowledgeBase({
    query,
    departmentIds: departmentId ? [departmentId] : [],
    limit: 10, // Cap at 10 for quality semantic results
  })

  return {
    results,
    time: Date.now() - startTime,
  }
}

/**
 * Merges and ranks results from both search methods
 */
function mergeResults(
  exactResults: Article[],
  semanticResults: SearchResult[],
  query: string,
): HybridSearchResult[] {
  const mergedMap = new Map<number | string, HybridSearchResult>()
  const queryLower = query.toLowerCase()

  // Process exact matches first (highest priority)
  exactResults.forEach((article) => {
    const titleMatch = article.title?.toLowerCase().includes(queryLower)
    const contentMatch = article.content?.toLowerCase().includes(queryLower)

    // Calculate exact match score
    let score = 0.5 // Base score
    let matchType: 'exact-title' | 'exact-content' = 'exact-content'

    if (titleMatch) {
      score = 1.0 // Perfect score for title matches
      matchType = 'exact-title'
    } else if (contentMatch) {
      score = 0.85 // High score for content matches
    }

    mergedMap.set(article.id, {
      article,
      score,
      matchType,
    })
  })

  // Add semantic results (boost if already in exact matches)
  semanticResults.forEach((result) => {
    const existing = mergedMap.get(result.articleId)

    if (existing) {
      // Article found in both searches - boost score
      existing.score = Math.min(existing.score + result.score * 0.2, 1.0)
    } else {
      // Only in semantic results - we'll need to fetch full article later
      // For now, skip articles that aren't in exact results
      // They will be fetched separately in the main function
    }
  })

  // Sort by score (descending)
  return Array.from(mergedMap.values()).sort((a, b) => b.score - a.score)
}

/**
 * Hybrid search combining exact PostgreSQL search with semantic Qdrant search
 */
export async function hybridSearch({
  query,
  mode = 'hybrid',
  departmentId,
  limit = 50,
  offset = 0,
}: HybridSearchOptions): Promise<HybridSearchResponse> {
  const startTime = Date.now()
  const timings: HybridSearchResponse['timings'] = { total: 0 }

  try {
    if (mode === 'exact') {
      // Exact PostgreSQL search only
      const { articles, total, time } = await exactSearch(query, departmentId, limit)
      timings.postgres = time
      timings.total = Date.now() - startTime

      return {
        results: articles.map((article) => ({
          article,
          score: 1.0,
          matchType: 'exact-content',
        })),
        total,
        mode,
        timings,
      }
    }

    if (mode === 'semantic') {
      // Semantic Qdrant search only
      const { results, time } = await semanticSearch(query, departmentId, limit)
      timings.qdrant = time

      // Fetch full articles from PostgreSQL
      const payload = await getPayload({ config })
      const articleIds = results.map((r) => r.articleId)
      const articlesQuery = await payload.find({
        collection: 'articles',
        where: {
          id: { in: articleIds },
        },
        depth: 3,
        limit: articleIds.length,
      })

      // Map articles back with scores
      const articlesMap = new Map(articlesQuery.docs.map((a) => [String(a.id), a]))
      const hybridResults: HybridSearchResult[] = results
        .map((r) => {
          const article = articlesMap.get(String(r.articleId))
          if (!article) return null

          return {
            article,
            score: r.score,
            matchType: 'semantic' as const,
            highlightText: r.text,
          }
        })
        .filter(Boolean) as HybridSearchResult[]

      timings.total = Date.now() - startTime

      return {
        results: hybridResults,
        total: hybridResults.length,
        mode,
        timings,
      }
    }

    // Hybrid mode: Run both searches in parallel
    const [exactResult, semanticResult] = await Promise.all([
      exactSearch(query, departmentId, limit),
      semanticSearch(query, departmentId, limit),
    ])

    timings.postgres = exactResult.time
    timings.qdrant = semanticResult.time

    // Fetch full articles for semantic results that aren't in exact results
    const payload = await getPayload({ config })
    const exactArticleIds = new Set(exactResult.articles.map((a) => String(a.id)))
    const semanticOnlyIds = semanticResult.results
      .map((r) => r.articleId)
      .filter((id) => !exactArticleIds.has(String(id)))

    let semanticOnlyArticles: Article[] = []
    if (semanticOnlyIds.length > 0) {
      const articlesQuery = await payload.find({
        collection: 'articles',
        where: {
          id: { in: semanticOnlyIds },
        },
        depth: 3,
        limit: semanticOnlyIds.length,
      })
      semanticOnlyArticles = articlesQuery.docs
    }

    // Combine exact results with semantic-only articles
    const allArticles = [...exactResult.articles, ...semanticOnlyArticles]

    // Build a map of article IDs to their semantic scores
    const semanticScores = new Map<string, number>()
    semanticResult.results.forEach((r) => {
      semanticScores.set(String(r.articleId), r.score)
    })

    // Create hybrid results with proper typing
    const hybridResults: HybridSearchResult[] = allArticles.map((article) => {
      const semanticScore = semanticScores.get(String(article.id)) || 0
      const queryLower = query.toLowerCase()
      const titleMatch = article.title?.toLowerCase().includes(queryLower)
      const contentMatch = article.content?.toLowerCase().includes(queryLower)

      let score = semanticScore
      let matchType: 'exact-title' | 'exact-content' | 'semantic' = 'semantic'

      if (titleMatch) {
        score = Math.max(score, 1.0)
        matchType = 'exact-title'
      } else if (contentMatch) {
        score = Math.max(score, 0.85)
        matchType = 'exact-content'
      }

      // Boost if found in both
      if (semanticScore > 0 && (titleMatch || contentMatch)) {
        score = Math.min(score + semanticScore * 0.2, 1.0)
      }

      return {
        article,
        score,
        matchType,
      }
    })

    // Sort by score and filter low-quality semantic results
    const mergedResults = hybridResults
      .filter((r) => {
        // Keep all exact matches
        if (r.matchType === 'exact-title' || r.matchType === 'exact-content') return true
        // For semantic-only matches, only keep reasonable quality (>0.3)
        return r.score >= 0.3
      })
      .sort((a, b) => b.score - a.score)

    timings.total = Date.now() - startTime

    return {
      results: mergedResults.slice(offset, offset + limit),
      total: mergedResults.length,
      mode,
      timings,
    }
  } catch (error) {
    console.error('Hybrid search error:', error)
    throw error
  }
}
