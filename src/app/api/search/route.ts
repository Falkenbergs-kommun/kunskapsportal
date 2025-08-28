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
              like: query,
            },
          },
          {
            summary: {
              like: query,
            },
          },
          {
            'keywords.keyword': {
              like: query,
            },
          },
        ],
      },
      depth: 2, // Ensure department and its parents are populated for URL generation
      limit: 10,
    })

    return NextResponse.json({ articles: articlesQuery.docs })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'An error occurred during search.' }, { status: 500 })
  }
}
