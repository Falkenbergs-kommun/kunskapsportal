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

    if (!departmentId) {
      return NextResponse.json({ error: 'departmentId is required' }, { status: 400 })
    }

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
