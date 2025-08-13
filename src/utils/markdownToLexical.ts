// Helper function to parse markdown tables
function parseMarkdownTable(lines: string[], startIndex: number) {
  const headerLine = lines[startIndex]
  const separatorLine = lines[startIndex + 1]
  
  if (!headerLine.includes('|') || !separatorLine.includes('---')) {
    return { table: null, nextIndex: startIndex }
  }
  
  // Parse header
  const headerCells = headerLine.split('|').map(cell => cell.trim()).filter(cell => cell)
  
  // Find table rows
  let currentIndex = startIndex + 2
  const tableRows: string[][] = []
  
  while (currentIndex < lines.length && lines[currentIndex].includes('|')) {
    const rowCells = lines[currentIndex].split('|').map(cell => cell.trim()).filter(cell => cell)
    if (rowCells.length > 0) {
      tableRows.push(rowCells)
    }
    currentIndex++
  }
  
  // Create Lexical table structure
  const tableChildren: any[] = []
  
  // Add header row
  if (headerCells.length > 0) {
    const headerRowChildren = headerCells.map(cell => ({
      type: 'tablecell',
      headerState: 1, // Mark as header
      children: [
        {
          type: 'paragraph',
          children: [{ text: cell }]
        }
      ]
    }))
    
    tableChildren.push({
      type: 'tablerow',
      children: headerRowChildren
    })
  }
  
  // Add data rows
  tableRows.forEach(row => {
    const rowChildren = row.map(cell => ({
      type: 'tablecell',
      headerState: 0, // Mark as data cell
      children: [
        {
          type: 'paragraph',
          children: [{ text: cell }]
        }
      ]
    }))
    
    tableChildren.push({
      type: 'tablerow',
      children: rowChildren
    })
  })
  
  const table = {
    type: 'table',
    children: tableChildren
  }
  
  return { table, nextIndex: currentIndex }
}

// Custom markdown to Lexical conversion that handles Payload media uploads
export function convertMarkdownToLexicalWithMedia(markdown: string) {
  const lines = markdown.split('\n')
  const children: any[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') {
      // Skip empty lines
      i++
      continue
    }

    // Check if this line starts a markdown table
    if (line.includes('|') && lines[i + 1] && lines[i + 1].includes('---')) {
      const tableResult = parseMarkdownTable(lines, i)
      if (tableResult.table) {
        children.push(tableResult.table)
        i = tableResult.nextIndex
        continue
      }
    }

    // Handle Payload media references (could be standalone or inline)
    if (line.includes('[PAYLOAD_MEDIA:')) {
      const mediaMatches = line.match(/\[PAYLOAD_MEDIA:([^:]+):([^\]]+)\]/g)
      if (mediaMatches) {
        for (const mediaMatch of mediaMatches) {
          const match = mediaMatch.match(/\[PAYLOAD_MEDIA:([^:]+):([^\]]+)\]/)
          if (match) {
            const [, mediaId, filename] = match
            children.push({
              type: 'upload',
              relationTo: 'media',
              value: {
                id: mediaId,
              },
              children: [{ text: '' }],
            })
          }
        }
        
        // Handle any remaining text on the line after removing media references
        const textWithoutMedia = line.replace(/\[PAYLOAD_MEDIA:[^\]]+\]/g, '').trim()
        if (textWithoutMedia) {
          children.push({
            type: 'paragraph',
            children: [
              {
                text: textWithoutMedia,
              },
            ],
          })
        }
        i++
        continue
      }
    } 
    // Handle standard headings
    else if (line.startsWith('### ')) {
      children.push({
        type: 'heading',
        tag: 'h3',
        children: [
          {
            text: line.substring(4).trim(),
          },
        ],
      })
    } else if (line.startsWith('## ')) {
      children.push({
        type: 'heading',
        tag: 'h2',
        children: [
          {
            text: line.substring(3).trim(),
          },
        ],
      })
    } else if (line.startsWith('# ')) {
      children.push({
        type: 'heading',
        tag: 'h1',
        children: [
          {
            text: line.substring(2).trim(),
          },
        ],
      })
    } 
    // Handle horizontal rules
    else if (line.trim() === '---') {
      children.push({
        type: 'horizontalRule',
      })
    } 
    // Handle bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      children.push({
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listItem',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: line.substring(2),
                  },
                ],
              },
            ],
          },
        ],
      })
    }
    // Handle numbered lists
    else if (line.match(/^\d+\.\s/)) {
      const text = line.replace(/^\d+\.\s/, '')
      children.push({
        type: 'list',
        listType: 'number',
        children: [
          {
            type: 'listItem',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: text,
                  },
                ],
              },
            ],
          },
        ],
      })
    }
    // Handle regular paragraphs
    else {
      children.push({
        type: 'paragraph',
        children: [
          {
            text: line,
          },
        ],
      })
    }
    
    i++ // Increment for all cases
  }

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}