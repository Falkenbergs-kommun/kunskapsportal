import type { Endpoint, PayloadRequest } from 'payload'
import { processDocumentWithGemini } from '@/services/gemini'
import { mistralOcr } from '@/services/mistralOcr'
import type { Media } from '@/payload-types'
import { promises as fs } from 'fs'
import path from 'path'

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
        draft: true, // Get the draft version if it exists
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

        if (!doc?.filename) {
          console.warn(`Skipping document ${doc?.id} - no filename found`)
          continue
        }

        // Read the file directly from the filesystem instead of fetching via HTTP
        // This avoids authentication issues in production where nginx requires cookies
        const filePath = path.join(process.cwd(), 'media', doc.filename)
        let buffer: Buffer

        try {
          buffer = await fs.readFile(filePath)
        } catch (error) {
          console.warn(`Failed to read document ${doc.id} from ${filePath}:`, error)
          continue
        }

        // Choose extractor based on environment variable
        const extractor = process.env.PDF_EXTRACTOR || 'gemini'
        let documentContent: string

        if (extractor === 'mistral') {
          // Process with Mistral (includes Payload image integration)
          const result = await mistralOcr.pdfToMarkdown(buffer, {
            saveImages: true,
            uploadToPayload: true,
            payload,
            debug: false,
          })
          documentContent = result.markdown
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

      // Update the article with the generated markdown content
      await payload.update({
        collection: 'articles',
        id,
        data: {
          content: combinedContent,
        },
        draft: true, // Update the draft version
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
