'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { SourcesSection } from './SourcesSection'
import type { SourceMetadata } from '@/types/chat'
import { cn } from '@/lib/utils'

interface MarkdownMessageProps {
  content: string
  sources?: SourceMetadata[]
  className?: string
}

export function MarkdownMessage({ content, sources, className = '' }: MarkdownMessageProps) {
  const router = useRouter()

  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom link handler
          a: ({ node, href, children, ...props }) => {
            const url = href || ''
            const isExternal = url.startsWith('http://') || url.startsWith('https://')
            const isInternal = url.startsWith('/')

            if (isExternal) {
              // External link - open in new tab with icon
              return (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  {...props}
                >
                  {children}
                  <ExternalLink className="h-3 w-3 inline" />
                </a>
              )
            } else if (isInternal) {
              // Internal link - use Next.js router
              return (
                <a
                  href={url}
                  className="text-blue-600 hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push(url)
                  }}
                  {...props}
                >
                  {children}
                </a>
              )
            }

            // Relative or other links
            return (
              <a href={url} className="text-blue-600 hover:underline" {...props}>
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {sources && <SourcesSection sources={sources} />}
    </div>
  )
}