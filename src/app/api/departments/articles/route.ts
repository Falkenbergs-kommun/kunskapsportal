import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { hybridSearch, type SearchMode } from '@/services/hybridSearch'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const departmentId = searchParams.get('departmentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortParam = searchParams.get('sort') || '-updatedAt'
    const searchTerm = searchParams.get('search') || ''
    const mode = (searchParams.get('mode') || 'hybrid') as SearchMode

    if (!departmentId) {
      return NextResponse.json({ error: 'departmentId is required' }, { status: 400 })
    }

    // If searching, use hybrid search
    if (searchTerm.trim()) {
      const result = await hybridSearch({
        query: searchTerm,
        mode,
        departmentId,
        limit: 200,
      })

      return NextResponse.json({
        docs: result.results.map((r) => r.article),
        totalDocs: result.total,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        mode: result.mode,
        timings: result.timings,
      })
    }

    // No search - use regular pagination
    const payload = await getPayload({ config })
    const articlesQuery = await payload.find({
      collection: 'articles',
      where: {
        department: {
          equals: departmentId,
        },
        _status: {
          equals: 'published',
        },
      },
      depth: 3,
      limit,
      page,
      sort: sortParam,
    })

    return NextResponse.json({
      docs: articlesQuery.docs,
      totalDocs: articlesQuery.totalDocs,
      page: articlesQuery.page,
      totalPages: articlesQuery.totalPages,
      hasNextPage: articlesQuery.hasNextPage,
      hasPrevPage: articlesQuery.hasPrevPage,
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
