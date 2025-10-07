import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const articlesQuery = await payload.find({
      collection: 'articles',
      where: {
        slug: {
          equals: slug,
        },
        _status: {
          equals: 'published',
        },
      },
      depth: 5, // Ensure department hierarchy is fully populated
      limit: 1,
    })

    if (articlesQuery.docs.length === 0) {
      return NextResponse.json({ article: null })
    }

    return NextResponse.json({ article: articlesQuery.docs[0] })
  } catch (error) {
    console.error('Article fetch error:', error)
    return NextResponse.json({ error: 'An error occurred fetching the article.' }, { status: 500 })
  }
}