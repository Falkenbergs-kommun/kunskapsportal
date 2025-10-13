// File: /Users/frej/Code/payload/knowledge-base/src/app/preview/articles/[id]/page.tsx

import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import React from 'react'
import ArticleDisplay from '../../../../components/ArticleDisplay'
import { LivePreviewListener } from '../../../../components/LivePreviewListener'
import type { Article } from '../../../../payload-types'

export default async function ArticlePreview({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = await paramsPromise
  const { id } = params
  const { isEnabled: isDraftMode } = await draftMode()

  const payload = await getPayload({ config })

  const article = await payload.findByID({
    collection: 'articles',
    id,
    depth: 3, // Keep depth to populate relationships like coverPhoto
    draft: true, // Always fetch draft version on preview page
  })

  if (!article) {
    return notFound()
  }

  return (
    <>
      {/* The listener will only be active when draft mode is enabled */}
      {isDraftMode && <LivePreviewListener />}
      <ArticleDisplay article={article as Article} />
    </>
  )
}
