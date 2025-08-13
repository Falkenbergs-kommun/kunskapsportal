'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

// Add CSS keyframes for spinner
const spinKeyframes = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

interface Article {
  id: string
  title: string
  content: any
  createdAt: string
  updatedAt: string
}

interface MediaRecord {
  id: number
  url: string
  filename: string
  alt: string
  width?: number
  height?: number
}

// Component to fetch and display media images
function MediaImage({ mediaId }: { mediaId: string | number }) {
  const [mediaData, setMediaData] = useState<MediaRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/media/${mediaId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${response.statusText}`)
        }
        const data = await response.json()
        setMediaData(data)
      } catch (err) {
        console.error('Error fetching media:', err)
        setError(err instanceof Error ? err.message : 'Failed to load media')
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
  }, [mediaId])

  if (loading) {
    return (
      <div style={{ 
        margin: '1.5rem 0', 
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem',
        color: '#6b7280'
      }}>
        Loading image...
      </div>
    )
  }

  if (error || !mediaData) {
    return (
      <div style={{ 
        margin: '1.5rem 0', 
        textAlign: 'center',
        padding: '1rem',
        backgroundColor: '#fef2f2',
        borderRadius: '0.5rem',
        color: '#dc2626'
      }}>
        ❌ Failed to load image (ID: {mediaId}): {error}
      </div>
    )
  }

  return (
    <div style={{ 
      margin: '1.5rem 0', 
      textAlign: 'center' 
    }}>
      <img 
        src={mediaData.url}
        alt={mediaData.alt || 'Content image'}
        style={{ 
          maxWidth: '100%', 
          height: 'auto', 
          borderRadius: '0.5rem', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          margin: '0 auto',
          display: 'block'
        }}
        onLoad={() => {
          console.log(`✅ Image loaded successfully: ${mediaData.url}`)
        }}
        onError={(e) => {
          console.error(`❌ Failed to load image file: ${mediaData.url}`)
          const target = e.target as HTMLImageElement
          target.alt = `Failed to load image file: ${mediaData.filename}`
          target.style.border = '2px solid #fca5a5'
          target.style.padding = '1rem'
          target.style.borderRadius = '0.25rem'
          target.style.backgroundColor = '#fef2f2'
          target.style.color = '#dc2626'
          target.style.fontSize = '0.875rem'
          target.textContent = `Failed to load: ${mediaData.filename}`
        }}
      />
      {mediaData.alt && (
        <p style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.875rem', 
          color: '#6b7280', 
          fontStyle: 'italic' 
        }}>
          {mediaData.alt}
        </p>
      )}
    </div>
  )
}

export default function ArticlePreview() {
  const params = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchArticle(params.id as string)
    }
  }, [params.id])

  const fetchArticle = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/articles/${id}?depth=0`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.statusText}`)
      }
      
      const data = await response.json()
      setArticle(data)
    } catch (err) {
      console.error('Error fetching article:', err)
      setError(err instanceof Error ? err.message : 'Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const renderTextContent = (children: any[]): React.ReactNode => {
    if (!children) return ''
    
    return children.map((child, index) => {
      if (typeof child === 'string') return child
      if (child.text) {
        // Handle formatting
        let text = child.text
        if (child.bold) {
          return <strong key={index}>{text}</strong>
        }
        if (child.italic) {
          return <em key={index}>{text}</em>
        }
        if (child.underline) {
          return <u key={index}>{text}</u>
        }
        return text
      }
      if (child.children) return renderTextContent(child.children)
      return ''
    })
  }

  const parseMarkdownTable = (text: string) => {
    const lines = text.split('\n')
    const tableLines = []
    let inTable = false
    
    for (const line of lines) {
      if (line.includes('|') && (line.includes('---') || inTable || lines[lines.indexOf(line) + 1]?.includes('---'))) {
        tableLines.push(line)
        inTable = true
      } else if (inTable && line.trim() === '') {
        break
      } else if (inTable) {
        break
      }
    }
    
    if (tableLines.length < 2) return null
    
    const [headerLine, separatorLine, ...dataLines] = tableLines
    if (!separatorLine.includes('---')) return null
    
    const headers = headerLine.split('|').map(cell => cell.trim()).filter(cell => cell)
    const rows = dataLines.map(line => 
      line.split('|').map(cell => cell.trim()).filter(cell => cell)
    )
    
    return { headers, rows }
  }

  const renderLexicalContent = (content: any) => {
    if (!content || !content.root || !content.root.children) {
      return <p>No content available</p>
    }

    // Debug: log content structure
    console.log('Root children types:', content.root.children.map((child: any) => child.type))

    return content.root.children.map((child: any, index: number) => {
      switch (child.type) {
        case 'customTable':
          // Handle custom table blocks created by our conversion process
          console.log('Custom table block:', child)
          
          if (!child.fields || !child.fields.headers || !child.fields.rows) {
            return (
              <div key={index} style={{ 
                margin: '1.5rem 0', 
                padding: '1rem',
                backgroundColor: '#fef2f2',
                borderRadius: '0.5rem',
                textAlign: 'center',
                color: '#dc2626'
              }}>
                ⚠️ Invalid table structure
              </div>
            )
          }
          
          const { headers, rows } = child.fields
          
          return (
            <div key={index} style={{ margin: '1.5rem 0', overflowX: 'auto' }}>
              <table style={{ 
                minWidth: '100%', 
                borderCollapse: 'collapse', 
                border: '1px solid #d1d5db' 
              }}>
                <thead>
                  <tr>
                    {headers.map((header: string, headerIndex: number) => (
                      <th key={headerIndex} style={{
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        padding: '0.5rem 1rem',
                        textAlign: 'left',
                        fontWeight: '600'
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} style={{
                          border: '1px solid #d1d5db',
                          padding: '0.5rem 1rem'
                        }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        
        case 'table':
          // Handle Lexical table nodes created by EXPERIMENTAL_TableFeature
          console.log('Lexical table node:', child)
          
          if (!child.children || child.children.length === 0) {
            return (
              <div key={index} style={{ 
                margin: '1.5rem 0', 
                padding: '1rem',
                backgroundColor: '#fef2f2',
                borderRadius: '0.5rem',
                textAlign: 'center',
                color: '#dc2626'
              }}>
                ⚠️ Empty table found
              </div>
            )
          }
          
          return (
            <div key={index} style={{ margin: '1.5rem 0', overflowX: 'auto' }}>
              <table style={{ 
                minWidth: '100%', 
                borderCollapse: 'collapse', 
                border: '1px solid #d1d5db' 
              }}>
                <tbody>
                  {child.children.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.children?.map((cell: any, cellIndex: number) => {
                        // Check if this cell is a header cell based on headerState or type
                        const isHeaderCell = cell.headerState === 3 || cell.type === 'tableHeaderCell' || cell.type === 'tablecell' && cell.headerState > 0
                        const CellTag = isHeaderCell ? 'th' : 'td'
                        const cellText = renderTextContent(cell.children || [])
                        
                        return (
                          <CellTag 
                            key={cellIndex} 
                            style={{
                              backgroundColor: isHeaderCell ? '#f3f4f6' : 'transparent',
                              border: '1px solid #d1d5db',
                              padding: '0.5rem 1rem',
                              textAlign: 'left',
                              fontWeight: isHeaderCell ? '600' : 'normal'
                            }}
                          >
                            {cellText}
                          </CellTag>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        
        case 'image':
          // Handle image nodes that might be created from ![alt](url) markdown
          console.log('Image node:', child)
          const imageSrc = child.src || child.url
          if (imageSrc && imageSrc.startsWith('/api/media/file/')) {
            const urlParts = imageSrc.split('/')
            const lastPart = urlParts[urlParts.length - 1]
            const mediaId = lastPart.match(/^\d+$/) ? parseInt(lastPart) : lastPart
            
            console.log(`🖼️ Rendering image node: ${imageSrc} (ID: ${mediaId})`)
            
            return (
              <div key={index} style={{ 
                margin: '1.5rem 0', 
                textAlign: 'center' 
              }}>
                <MediaImage mediaId={mediaId} />
              </div>
            )
          }
          return (
            <div key={index} style={{ 
              margin: '1.5rem 0', 
              textAlign: 'center' 
            }}>
              <img 
                src={imageSrc}
                alt={child.alt || child.altText || 'Image'}
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto', 
                  borderRadius: '0.5rem', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  margin: '0 auto',
                  display: 'block'
                }}
              />
            </div>
          )
        
        case 'heading':
          const HeadingTag = child.tag || 'h1'
          const headingText = renderTextContent(child.children || [])
          return React.createElement(HeadingTag, { 
            key: index, 
            style: {
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#111827',
              fontSize: child.tag === 'h1' ? '1.875rem' : 
                       child.tag === 'h2' ? '1.5rem' : 
                       '1.25rem',
              lineHeight: child.tag === 'h1' ? '2.25rem' : 
                         child.tag === 'h2' ? '2rem' : 
                         '1.75rem'
            }
          }, headingText)
        
        case 'paragraph':
          // Get the text content to check for tables
          const paragraphTextContent = child.children?.map((c: any) => c.text || '').join('')
          
          // Check if this paragraph contains structured table data
          if (paragraphTextContent?.startsWith('[TABLE_DATA:') && paragraphTextContent?.endsWith(']')) {
            try {
              const jsonStr = paragraphTextContent.slice(12, -1) // Remove [TABLE_DATA: and ]
              const tableData = JSON.parse(jsonStr)
              console.log('Found structured table data:', tableData)
              
              return (
                <div key={index} style={{ margin: '1.5rem 0', overflowX: 'auto' }}>
                  <table style={{ 
                    minWidth: '100%', 
                    borderCollapse: 'collapse', 
                    border: '1px solid #d1d5db' 
                  }}>
                    <thead>
                      <tr>
                        {tableData.headers.map((header: string, headerIndex: number) => (
                          <th key={headerIndex} style={{
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            padding: '0.5rem 1rem',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row: string[], rowIndex: number) => (
                        <tr key={rowIndex}>
                          {row.map((cell: string, cellIndex: number) => (
                            <td key={cellIndex} style={{
                              border: '1px solid #d1d5db',
                              padding: '0.5rem 1rem'
                            }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            } catch (error) {
              console.error('Error parsing table data:', error)
              // Fallback to showing the raw text
              return (
                <p key={index} style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem',
                  backgroundColor: '#fef2f2',
                  borderRadius: '0.5rem',
                  color: '#dc2626'
                }}>
                  ⚠️ Error parsing table data: {paragraphTextContent}
                </p>
              )
            }
          }
          
          // Check if this paragraph contains a markdown table (fallback)
          if (paragraphTextContent?.includes('|') && paragraphTextContent?.includes('---')) {
            const table = parseMarkdownTable(paragraphTextContent)
            if (table) {
              return (
                <div key={index} style={{ margin: '1.5rem 0', overflowX: 'auto' }}>
                  <table style={{ 
                    minWidth: '100%', 
                    borderCollapse: 'collapse', 
                    border: '1px solid #d1d5db' 
                  }}>
                    <thead>
                      <tr>
                        {table.headers.map((header, headerIndex) => (
                          <th key={headerIndex} style={{
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            padding: '0.5rem 1rem',
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} style={{
                              border: '1px solid #d1d5db',
                              padding: '0.5rem 1rem'
                            }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          }
          
          // Regular paragraph with link handling and text formatting
          return (
            <p key={index} style={{ 
              marginBottom: '1rem', 
              lineHeight: '1.625', 
              color: '#374151' 
            }}>
              {child.children?.map((textChild: any, textIndex: number) => {
                if (textChild.type === 'link') {
                  // Check if this is an image link (starts with /api/media/file/)
                  if (textChild.url && textChild.url.startsWith('/api/media/file/')) {
                    const linkText = textChild.children?.[0]?.text || ''
                    // If the link text looks like an image filename, render as image
                    if (linkText.match(/\.(jpe?g|png|gif|webp)$/i)) {
                      // Extract media ID from URL - could be /api/media/file/123 or /api/media/file/filename.jpg
                      const urlParts = textChild.url.split('/')
                      const lastPart = urlParts[urlParts.length - 1]
                      const mediaId = lastPart.match(/^\d+$/) ? parseInt(lastPart) : lastPart
                      
                      console.log(`🖼️ Rendering inline image: ${linkText} -> ${textChild.url} (ID: ${mediaId})`)
                      
                      return (
                        <div key={textIndex} style={{ 
                          margin: '1.5rem 0', 
                          textAlign: 'center' 
                        }}>
                          <MediaImage mediaId={mediaId} />
                        </div>
                      )
                    }
                  }
                  
                  // Regular link handling
                  return (
                    <a 
                      key={textIndex} 
                      href={textChild.url} 
                      style={{ 
                        color: '#2563eb', 
                        textDecoration: 'underline' 
                      }}
                      target="_blank" 
                      rel="noopener noreferrer"
                      onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
                    >
                      {renderTextContent(textChild.children || [])}
                    </a>
                  )
                }
                // Handle regular text with formatting
                let text = textChild.text || ''
                if (textChild.bold) {
                  return <strong key={textIndex}>{text}</strong>
                }
                if (textChild.italic) {
                  return <em key={textIndex}>{text}</em>
                }
                if (textChild.underline) {
                  return <u key={textIndex}>{text}</u>
                }
                return <span key={textIndex}>{text}</span>
              })}
            </p>
          )
        
        case 'upload':
          console.log('Upload node:', child)
          // Handle both old structure (value.id) and new structure (value as number)
          const mediaId = typeof child.value === 'number' ? child.value : child.value?.id || child.value || child.relationTo
          console.log('Media ID:', mediaId)
          
          if (!mediaId) {
            return (
              <div key={index} style={{ 
                margin: '1.5rem 0', 
                padding: '1rem',
                backgroundColor: '#fef2f2',
                borderRadius: '0.5rem',
                textAlign: 'center',
                color: '#dc2626'
              }}>
                ⚠️ Image upload block found but no media ID available
                <br />
                <small style={{ fontSize: '0.75rem' }}>
                  Debug: {JSON.stringify(child, null, 2)}
                </small>
              </div>
            )
          }
          
          return (
            <MediaImage key={index} mediaId={mediaId} />
          )
        
        case 'list':
          const ListTag = child.listType === 'number' ? 'ol' : 'ul'
          const listItems = child.children || []
          
          return (
            <ListTag key={index} style={{ 
              marginBottom: '1rem', 
              marginLeft: '1.5rem',
              listStyleType: child.listType === 'number' ? 'decimal' : 'disc'
            }}>
              {listItems.map((listItem: any, listIndex: number) => {
                const itemText = renderTextContent(listItem.children || [])
                return (
                  <li key={listIndex} style={{ 
                    marginBottom: '0.5rem', 
                    color: '#374151' 
                  }}>
                    {itemText}
                  </li>
                )
              })}
            </ListTag>
          )
        
        case 'horizontalRule':
          return <hr key={index} style={{ 
            margin: '2rem 0', 
            borderColor: '#d1d5db' 
          }} />
        
        default:
          // Handle text content or unknown types
          const defaultText = renderTextContent(child.children || [])
          // Check if we have any content (could be React nodes or string)
          const hasContent = defaultText && (
            (typeof defaultText === 'string' && defaultText.trim()) ||
            (Array.isArray(defaultText) && defaultText.length > 0) ||
            (typeof defaultText === 'object' && defaultText !== null)
          )
          
          if (hasContent) {
            return (
              <div key={index} style={{ 
                marginBottom: '1rem', 
                color: '#374151' 
              }}>
                {defaultText}
              </div>
            )
          }
          return null
      }
    }).filter(Boolean)
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            height: '2rem',
            width: '2rem',
            borderBottom: '2px solid #2563eb',
            margin: '0 auto 1rem auto'
          }}></div>
          <p style={{ color: '#4b5563' }}>Loading article...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>Error: {error}</p>
          <button 
            onClick={() => params.id && fetchArticle(params.id as string)}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              borderRadius: '0.25rem', 
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <p style={{ color: '#4b5563' }}>Article not found</p>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: spinKeyframes }} />
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '64rem', 
          margin: '0 auto', 
          padding: '3rem 1.5rem' 
        }}>
        <article style={{ 
          backgroundColor: 'white', 
          borderRadius: '0.5rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '2rem' 
        }}>
          <header style={{ 
            marginBottom: '2rem', 
            borderBottom: '1px solid #e5e7eb', 
            paddingBottom: '1.5rem' 
          }}>
            <h1 style={{ 
              fontSize: '1.875rem', 
              fontWeight: 'bold', 
              color: '#111827', 
              marginBottom: '1rem',
              lineHeight: '2.25rem'
            }}>
              {article.title || 'Untitled Article'}
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              <p style={{ margin: '0.25rem 0' }}>Created: {new Date(article.createdAt).toLocaleDateString('sv-SE')}</p>
              <p style={{ margin: '0.25rem 0' }}>Updated: {new Date(article.updatedAt).toLocaleDateString('sv-SE')}</p>
            </div>
          </header>
          
          <div style={{
            maxWidth: 'none',
            color: '#374151',
            lineHeight: '1.75'
          }}>
            {renderLexicalContent(article.content)}
          </div>
        </article>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Live Preview - Updates automatically when you edit the article
          </p>
        </div>
        </div>
      </div>
    </>
  )
}