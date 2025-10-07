import type { Endpoint, PayloadRequest } from 'payload'
import { processDocumentWithGemini } from '@/services/gemini'
import { processDocumentWithMistral } from '@/services/mistralSimple'
import type { Media } from '@/payload-types'

// Simple markdown to Lexical conversion - for production, consider using a proper converter
function convertMarkdownToLexical(markdown: string) {
  const lines = markdown.split('\n')
  const children: any[] = []

  for (const line of lines) {
    if (line.trim() === '') {
      // Skip empty lines
      continue
    }

    if (line.startsWith('![') && line.includes('](/api/media/file/')) {
      // Handle image references
      const match = line.match(/!\[(.*?)\]\(\/api\/media\/file\/(.+?)\)/)
      if (match) {
        const [, alt, mediaId] = match
        children.push({
          type: 'upload',
          value: {
            id: mediaId,
          },
          relationTo: 'media',
        })
      }
    } else if (line.startsWith('# ')) {
      // Handle h1
      children.push({
        type: 'h1',
        children: [
          {
            text: line.substring(2),
          },
        ],
      })
    } else if (line.startsWith('## ')) {
      // Handle h2
      children.push({
        type: 'h2',
        children: [
          {
            text: line.substring(3),
          },
        ],
      })
    } else if (line.startsWith('### ')) {
      // Handle h3
      children.push({
        type: 'h3',
        children: [
          {
            text: line.substring(4),
          },
        ],
      })
    } else if (line.trim() === '---') {
      // Handle horizontal rules
      children.push({
        type: 'hr',
      })
    } else {
      // Handle regular paragraphs
      children.push({
        type: 'p',
        children: [
          {
            text: line,
          },
        ],
      })
    }
  }

  return {
    root: {
      children,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

export const generateContentEndpoint: Endpoint = {
  path: '/generate-content/:id',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    try {
      const id = req.routeParams?.id as string
      if (!id) {
        return Response.json({ message: 'Article ID is required' }, { status: 400 })
      }
      const payload = req.payload

      // Similar logic as the server function
      const article = await payload.findByID({
        collection: 'articles',
        id,
        depth: 2,
      })

      if (!article.source_documents || article.source_documents.length === 0) {
        throw new Error('No source documents found')
      }

      let combinedContent = ''

      for (const docRef of article.source_documents) {
        let doc: Media | null = null
        if (typeof docRef === 'string') {
          doc = await payload.findByID({ collection: 'media', id: docRef })
        } else if (typeof docRef === 'object' && docRef !== null) {
          doc = docRef as Media
        }

        if (!doc?.url) {
          console.warn(`Skipping document ${doc?.id} - no URL found`)
          continue
        }

        // Download the file
        const response = await fetch(doc.url)
        if (!response.ok) {
          console.warn(`Failed to download document ${doc.id}`)
          continue
        }

        const buffer = Buffer.from(await response.arrayBuffer())

        // Choose extractor based on environment variable
        const extractor = process.env.PDF_EXTRACTOR || 'gemini'
        let documentContent: string

        if (extractor === 'mistral') {
          // Process with Mistral (includes Payload image integration)
          documentContent = await processDocumentWithMistral(
            buffer,
            doc.mimeType || 'application/pdf',
            `Extract and structure the content from this document titled "${
              doc.filename || 'Untitled'
            }". Format as markdown with clear headings and organization.`,
            payload, // Pass payload instance for image uploads
          )
        } else {
          // Process with Gemini (default)
          documentContent = await processDocumentWithGemini(
            buffer,
            doc.mimeType || 'application/pdf',
          )
        }

        // Add to combined content with a separator
        combinedContent += `\n\n# ${doc.filename || 'Document'}\n\n${documentContent}\n\n---\n`
      }

      // Convert markdown to Lexical format
      const lexicalContent = convertMarkdownToLexical(combinedContent)

      // Update the article with the generated content
      await payload.update({
        collection: 'articles',
        id,
        data: {
          content: lexicalContent,
        },
      })

      return Response.json({
        success: true,
        message: 'Content generated successfully',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      return Response.json({
        success: false,
        message,
      }, { status: 500 })
    }
  },
}
