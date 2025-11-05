import { NextRequest, NextResponse } from 'next/server'
import { searchKnowledgeBase, type SearchMode } from '@/services/qdrantSearch'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const mode = (searchParams.get('mode') || 'hybrid') as SearchMode
  const limit = parseInt(searchParams.get('limit') || '100')
  const departmentIdsParam = searchParams.get('departmentIds')
  const externalSourceIdsParam = searchParams.get('externalSourceIds')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], total: 0 })
  }

  // Parse parameters
  const departmentIds = departmentIdsParam
    ? departmentIdsParam.split(',').filter(Boolean)
    : []

  // External source IDs can include sub-sources with dot notation (e.g., "svensk-lag.pbl")
  const externalSourceIds = externalSourceIdsParam
    ? externalSourceIdsParam.split(',').filter(Boolean)
    : []

  try {
    // Search using unified Qdrant search
    const qdrantResults = await searchKnowledgeBase({
      query,
      mode,
      departmentIds,
      externalSourceIds,
      limit,
    })

    // For internal results, fetch full article data from Payload
    const payload = await getPayload({ config })
    const internalResults = qdrantResults.filter((r) => !r.isExternal)
    const externalResults = qdrantResults.filter((r) => r.isExternal)

    // Fetch full article data for internal results
    const articleIds = internalResults.map((r) => r.articleId).filter(Boolean)
    let articles: any[] = []

    if (articleIds.length > 0) {
      const articlesQuery = await payload.find({
        collection: 'articles',
        where: {
          id: { in: articleIds },
        },
        depth: 3,
        limit: articleIds.length,
      })
      articles = articlesQuery.docs
    }

    // Map articles back with scores
    const articlesMap = new Map(articles.map((a) => [String(a.id), a]))
    const enrichedInternalResults = internalResults
      .map((r) => {
        const article = articlesMap.get(String(r.articleId))
        if (!article) return null

        return {
          ...article,
          searchScore: r.score,
          source: 'internal',
          isExternal: false,
        }
      })
      .filter(Boolean)

    // Combine internal and external results
    const allResults = [
      ...enrichedInternalResults,
      ...externalResults.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.text.substring(0, 200),
        url: r.url,
        source: r.source,
        isExternal: true,
        searchScore: r.score,
      })),
    ].sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0))

    return NextResponse.json({
      results: allResults,
      total: allResults.length,
      mode,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'An error occurred during search.' }, { status: 500 })
  }
}
