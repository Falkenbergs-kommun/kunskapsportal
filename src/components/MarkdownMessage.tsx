'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface MarkdownMessageProps {
  content: string
  className?: string
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  const router = useRouter()
  
  // Simple markdown to JSX converter
  const renderMarkdown = (text: string) => {
    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g)
    
    return parts.map((part, index) => {
      // Code blocks
      if (part.startsWith('```')) {
        const code = part.slice(3, -3).trim()
        const [language, ...codeLines] = code.split('\n')
        const codeContent = codeLines.join('\n') || language // Handle single line
        
        return (
          <pre key={index} className="bg-gray-100 rounded p-2 my-2 overflow-x-auto">
            <code className="text-sm">{codeContent}</code>
          </pre>
        )
      }
      
      // Inline code
      if (part.startsWith('`')) {
        return (
          <code key={index} className="bg-gray-100 px-1 py-0.5 rounded text-sm">
            {part.slice(1, -1)}
          </code>
        )
      }
      
      // Process other markdown in text parts
      const processedPart = part
        .split('\n')
        .map((line, lineIndex) => {
          // Headers
          if (line.startsWith('### ')) {
            return <h3 key={`${index}-${lineIndex}`} className="font-semibold mt-2 mb-1">{line.slice(4)}</h3>
          }
          if (line.startsWith('## ')) {
            return <h2 key={`${index}-${lineIndex}`} className="font-bold text-lg mt-2 mb-1">{line.slice(3)}</h2>
          }
          if (line.startsWith('# ')) {
            return <h1 key={`${index}-${lineIndex}`} className="font-bold text-xl mt-2 mb-1">{line.slice(2)}</h1>
          }
          
          // Lists
          if (line.match(/^[\*\-\+] /)) {
            return (
              <li key={`${index}-${lineIndex}`} className="ml-4 list-disc">
                {processInlineMarkdown(line.slice(2))}
              </li>
            )
          }
          
          if (line.match(/^\d+\. /)) {
            return (
              <li key={`${index}-${lineIndex}`} className="ml-4 list-decimal">
                {processInlineMarkdown(line.replace(/^\d+\. /, ''))}
              </li>
            )
          }
          
          // Horizontal rule
          if (line === '---' || line === '***') {
            return <hr key={`${index}-${lineIndex}`} className="my-2 border-gray-300" />
          }
          
          // Regular paragraph
          if (line.trim()) {
            return <p key={`${index}-${lineIndex}`}>{processInlineMarkdown(line)}</p>
          }
          
          return null
        })
        .filter(Boolean)
      
      return <React.Fragment key={index}>{processedPart}</React.Fragment>
    })
  }
  
  // Process inline markdown (bold, italic, links)
  const processInlineMarkdown = (text: string): React.ReactNode => {
    if (!text) return null
    
    const elements: React.ReactNode[] = []
    let lastIndex = 0
    
    // First process links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let linkMatch
    
    while ((linkMatch = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (linkMatch.index > lastIndex) {
        const beforeText = text.substring(lastIndex, linkMatch.index)
        elements.push(...processTextMarkdown(beforeText))
      }
      
      // Add the link
      const linkText = linkMatch[1]
      const linkUrl = linkMatch[2]
      const isInternal = linkUrl.startsWith('/') || (typeof window !== 'undefined' && linkUrl.includes(window.location.host))
      
      elements.push(
        <a
          key={`link-${linkMatch.index}`}
          href={linkUrl}
          className="text-blue-600 hover:underline cursor-pointer"
          onClick={(e) => {
            // Check if it's an internal link
            if (linkUrl.startsWith('/')) {
              e.preventDefault()
              // Use Next.js router for internal navigation
              router.push(linkUrl)
            }
            // Let external links work normally
          }}
        >
          {linkText}
        </a>
      )
      
      lastIndex = linkMatch.index + linkMatch[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex)
      elements.push(...processTextMarkdown(remainingText))
    }
    
    return elements.length > 0 ? elements : text
  }
  
  // Process bold and italic markdown
  const processTextMarkdown = (text: string): React.ReactNode[] => {
    if (!text) return []
    
    const elements: React.ReactNode[] = []
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    
    parts.forEach((part, index) => {
      if (!part) return
      
      // Bold
      if (part.startsWith('**') && part.endsWith('**')) {
        elements.push(<strong key={`bold-${index}`}>{part.slice(2, -2)}</strong>)
      }
      // Italic
      else if (part.startsWith('*') && part.endsWith('*')) {
        elements.push(<em key={`italic-${index}`}>{part.slice(1, -1)}</em>)
      }
      // Regular text
      else {
        elements.push(part)
      }
    })
    
    return elements
  }
  
  return (
    <div className={`markdown-content space-y-1 ${className}`}>
      {renderMarkdown(content)}
    </div>
  )
}