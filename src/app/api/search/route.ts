import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ articles: [] })
  }

  try {
    const payload = await getPayload({ config })
    const articlesQuery = await payload.find({
      collection: 'articles',
      where: {
        _status: {
          equals: 'published',
        },
        or: [
          {
            title: {
              contains: query,
            },
          },
          {
            content: {
              contains: query,
            },
          },
          {
            summary: {
              contains: query,
            },
          },
          {
            author: {
              contains: query,
            },
          },
          {
            'keywords.keyword': {
              contains: query,
            },
          },
        ],
      },
      depth: 2, // Ensure department and its parents are populated for URL generation
      limit: 100, // Increased from 10 to show more results
    })

    return NextResponse.json({
      articles: articlesQuery.docs,
      total: articlesQuery.totalDocs
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'An error occurred during search.' }, { status: 500 })
  }
}
