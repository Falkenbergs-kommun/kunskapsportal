import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const departmentId = searchParams.get('departmentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortParam = searchParams.get('sort') || '-updatedAt'
    const searchTerm = searchParams.get('search') || ''

    if (!departmentId) {
      return NextResponse.json({ error: 'departmentId is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Build where clause with search conditions
    const whereClause: any = {
      department: {
        equals: departmentId,
      },
      _status: {
        equals: 'published',
      },
    }

    // If search term is provided, add OR conditions for full-text search
    if (searchTerm.trim()) {
      whereClause.or = [
        {
          title: {
            contains: searchTerm,
          },
        },
        {
          content: {
            contains: searchTerm,
          },
        },
        {
          summary: {
            contains: searchTerm,
          },
        },
        {
          author: {
            contains: searchTerm,
          },
        },
      ]
    }

    const articlesQuery = await payload.find({
      collection: 'articles',
      where: whereClause,
      depth: 3,
      limit: searchTerm.trim() ? 200 : limit, // When searching, return more results
      page: searchTerm.trim() ? 1 : page, // When searching, always start from page 1
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
