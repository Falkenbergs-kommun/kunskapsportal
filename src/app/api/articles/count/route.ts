import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Count only published articles
    const result = await payload.count({
      collection: 'articles',
      where: {
        _status: {
          equals: 'published',
        },
      },
    })

    return NextResponse.json({ count: result.totalDocs })
  } catch (error) {
    console.error('Error counting articles:', error)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}
