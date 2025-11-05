'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { SourceMetadata } from '@/types/chat'

interface SourcesSectionProps {
  sources: SourceMetadata[]
}

export function SourcesSection({ sources }: SourcesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!sources || sources.length === 0) {
    return null
  }

  // Group sources by type
  const internalSources = sources.filter(s => s.type === 'internal')
  const externalSources = sources.filter(s => s.type === 'external')
  const googleSources = sources.filter(s => s.type === 'google')

  return (
    <div className="mt-4 border-t pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>Källor ({sources.length})</span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-4 text-sm">
          {/* Internal Knowledge Base */}
          {internalSources.length > 0 && (
            <div>
              <h4 className="text-xs uppercase text-gray-500 mb-2">
                Intern kunskapsbas ({internalSources.length})
              </h4>
              <ul className="space-y-2">
                {internalSources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.url}
                      className="text-blue-600 hover:underline"
                    >
                      {source.title}
                    </a>
                    {(source.department || source.documentType) && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {[source.department, source.documentType].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* External Sources */}
          {externalSources.length > 0 && (
            <div>
              <h4 className="text-xs uppercase text-gray-500 mb-2">
                Externa källor ({externalSources.length})
              </h4>
              <ul className="space-y-2">
                {externalSources.map((source, index) => {
                  // Extract domain from URL for display
                  let displaySource = source.sourceLabel || source.source
                  try {
                    const url = new URL(source.url)
                    displaySource = url.hostname.replace('www.', '')
                  } catch {
                    // Keep original if URL parsing fails
                  }

                  return (
                    <li key={index}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {source.title}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {displaySource}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Google Search */}
          {googleSources.length > 0 && (
            <div>
              <h4 className="text-xs uppercase text-gray-500 mb-2">
                Google Search ({googleSources.length})
              </h4>
              <ul className="space-y-2">
                {googleSources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {source.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
