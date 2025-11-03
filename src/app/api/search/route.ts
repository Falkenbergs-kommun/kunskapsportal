import { NextRequest, NextResponse } from 'next/server'
import { hybridSearch, type SearchMode } from '@/services/hybridSearch'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const mode = (searchParams.get('mode') || 'hybrid') as SearchMode
  const limit = parseInt(searchParams.get('limit') || '100')

  if (!query || query.length < 2) {
    return NextResponse.json({ articles: [], total: 0, mode: 'hybrid' })
  }

  try {
    const result = await hybridSearch({
      query,
      mode,
      limit,
    })

    return NextResponse.json({
      articles: result.results.map((r) => r.article),
      total: result.total,
      mode: result.mode,
      timings: result.timings,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'An error occurred during search.' }, { status: 500 })
  }
}
