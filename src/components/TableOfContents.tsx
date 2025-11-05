'use client'

import { useState, useMemo } from 'react'
import { Button } from './ui/button'
import { ChevronDown, ChevronRight, List } from 'lucide-react'
import GithubSlugger from 'github-slugger'

interface Heading {
  level: number
  text: string
  id: string
}

interface TableOfContentsProps {
  content: string
}

// Extract headings from markdown content
function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = []
  const slugger = new GithubSlugger()

  // Match markdown headings (# Heading)
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  let match

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()

    // Use github-slugger to match rehype-slug exactly
    const id = slugger.slug(text)

    headings.push({ level, text, id })
  }

  return headings
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const headings = useMemo(() => extractHeadings(content), [content])

  // Don't render if there are no headings
  if (headings.length === 0) {
    return null
  }

  const handleLinkClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      // Get the header height to offset scroll position
      const headerOffset = 80 // Adjust this value based on your header height
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="mb-8">
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between p-4 h-auto bg-slate-50 hover:bg-slate-100"
        data-testid="button-toggle-toc"
      >
        <span className="font-medium text-slate-900 flex items-center">
          <List className="mr-2" size={16} />
          Innehållsförteckning
        </span>
        {isExpanded ? (
          <ChevronDown className="text-slate-400" size={16} />
        ) : (
          <ChevronRight className="text-slate-400" size={16} />
        )}
      </Button>

      {isExpanded && (
        <div
          className="mt-4 p-4 bg-white border border-slate-200 rounded-lg"
          data-testid="toc-content"
        >
          <nav>
            <ol className="space-y-2">
              {headings.map((heading, index) => (
                <li
                  key={`${heading.id}-${index}`}
                  style={{
                    marginLeft: `${(heading.level - 1) * 1.5}rem`
                  }}
                >
                  <button
                    onClick={() => handleLinkClick(heading.id)}
                    className="text-left text-blue-600 hover:text-blue-800 hover:underline text-sm leading-relaxed"
                  >
                    {heading.text}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}
    </div>
  )
}
