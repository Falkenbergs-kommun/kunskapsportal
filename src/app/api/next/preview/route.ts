// File: /Users/frej/Code/payload/knowledge-base/src/app/api/next/preview/route.ts

import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(req.url)
  const collection = searchParams.get('collection')
  const slug = searchParams.get('slug')
  const path = searchParams.get('path')

  if (!collection || !path) {
    return new Response('Missing collection or path in query params', { status: 400 })
  }

  // This authenticates the user making the preview request
  const { user } = await payload.auth({ headers: req.headers })

  if (!user) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  // Enable Draft Mode by setting a cookie
  const draft = await draftMode()
  draft.enable()

  // Redirect to the path from the original URL
  redirect(path)
}
