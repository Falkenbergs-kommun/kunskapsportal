'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { mistralOcr } from '../../../../services/mistralOcr'
import { processDocumentWithGemini } from '../../../../services/gemini'
import type { Media } from '../../../../payload-types'
import { GoogleGenAI } from '@google/genai'
import { promises as fs } from 'fs'
import path from 'path'

export async function generateContentFromDocuments(articleId: string) {
  try {
    console.log(`[AI] Starting content generation for articleId: ${articleId}`)
    const payload = await getPayload({ config })

    // Fetch the article with populated source documents
    // Use draft: true to get the latest draft version if it exists
    const article = await payload.findByID({
      collection: 'articles',
      id: articleId,
      depth: 2, // Populate the media relations
      draft: true, // Get the draft version if it exists
    })
    console.log('[AI] Fetched article:', article ? 'OK' : 'Not Found')
    console.log('[AI] Article source_documents field:', article?.source_documents)
    console.log('[AI] Article keys:', article ? Object.keys(article) : 'No article')

    if (!article.source_documents || article.source_documents.length === 0) {
      console.log('[AI] No source documents found on the article.')
      return {
        success: false,
        error:
          'No source documents found. Please upload at least one source document before generating AI content.',
      }
    }
    console.log(`[AI] Found ${article.source_documents.length} source document(s).`)

    let combinedContent = ''

    // Process each document
    for (const docRef of article.source_documents) {
      console.log('[AI] Processing document reference:', docRef)
      let doc: Media | null = null
      if (typeof docRef === 'string') {
        doc = await payload.findByID({ collection: 'media', id: docRef })
      } else if (typeof docRef === 'object' && docRef !== null) {
        doc = docRef as Media
      }

      if (!doc?.filename) {
        console.warn(`[AI] Skipping document ${doc?.id} - no filename found`)
        continue
      }

      // Read the file directly from the filesystem instead of fetching via HTTP
      // This avoids authentication issues in production where nginx requires cookies
      const filePath = path.join(process.cwd(), 'media', doc.filename)
      let buffer: Buffer

      try {
        buffer = await fs.readFile(filePath)
        console.log(`[AI] Read document from ${filePath}, size: ${buffer.length} bytes`)
      } catch (error) {
        console.warn(`[AI] Failed to read document ${doc.id} from ${filePath}:`, error)
        continue
      }

      let currentMimeType = doc.mimeType || 'application/octet-stream'
      console.log(
        `[AI] Document loaded into buffer, size: ${buffer.length} bytes. Type: ${currentMimeType}`,
      )

      // Check if document needs conversion to PDF (prefer Mistral OCR)
      const { documentConverter } = await import('../../../../services/documentConverter')
      const shouldConvertToPdf = documentConverter.needsConversion(currentMimeType, true)
      if (shouldConvertToPdf) {
        console.log(
          `[AI] Converting ${documentConverter.getDocumentTypeName(currentMimeType)} to PDF...`,
        )

        const conversionResult = await documentConverter.convertToPdf(
          buffer,
          currentMimeType,
          doc.filename || '',
        )

        if (conversionResult.success && conversionResult.pdfBuffer) {
          buffer = conversionResult.pdfBuffer
          currentMimeType = 'application/pdf'
          console.log(`[AI] Conversion successful. New PDF size: ${buffer.length} bytes`)

          // Update media document with conversion status
          try {
            await payload.update({
              collection: 'media',
              id: doc.id,
              data: {
                conversionStatus: 'success',
              },
            })
          } catch (updateError) {
            console.warn(`[AI] Could not update conversion status:`, updateError)
          }
        } else {
          console.error(`[AI] Conversion failed: ${conversionResult.error}`)

          // Update media document with error status
          try {
            await payload.update({
              collection: 'media',
              id: doc.id,
              data: {
                conversionStatus: 'failed',
                conversionError: conversionResult.error,
              },
            })
          } catch (updateError) {
            console.warn(`[AI] Could not update conversion status:`, updateError)
          }

          continue // Skip this document and try the next one
        }
      }

      const pdfExtractor = process.env.PDF_EXTRACTOR || 'mistral'
      let documentContent = ''

      if (pdfExtractor === 'mistral') {
        // Mistral OCR only works with PDFs, so conversion above ensures this
        if (currentMimeType !== 'application/pdf') {
          console.warn(`[AI] Mistral OCR requires PDF format, but got: ${currentMimeType}`)
          continue
        }
        console.log(`[AI] Processing PDF document with Mistral OCR...`)
        const result = await mistralOcr.pdfToMarkdown(buffer, {
          saveImages: true,
          uploadToPayload: true,
          payload,
          debug: false,
        })
        documentContent = result.markdown
        console.log(`[AI] Extracted ${documentContent.length} characters`)
        console.log(`[AI] Found ${result.metadata.imageCount} images`)
      } else {
        // Gemini fallback - can handle some formats directly
        const supportedTypes = [
          'application/pdf',
          'text/plain',
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        ]
        if (!currentMimeType || !supportedTypes.includes(currentMimeType)) {
          console.warn(
            `[AI] Skipping document ${doc.id} - unsupported file type: ${currentMimeType}`,
          )
          continue
        }

        // Process with Gemini
        console.log(`[AI] Sending document to Gemini for processing...`)
        documentContent = await processDocumentWithGemini(buffer, currentMimeType)
      }

      // Add to combined content without showing filename
      combinedContent += `\n\n${documentContent}\n\n---\n`
      console.log(`[AI] Received content from document ${doc.filename || doc.id}.`)
    }

    // Update the article with the generated markdown content
    console.log('[AI] All documents processed. Updating article with markdown content...')

    // Clean up PAYLOAD_MEDIA references and convert to standard markdown images
    let processedMarkdown = combinedContent.replace(
      /\[PAYLOAD_MEDIA:([^:]+):([^\]]+)\]/g,
      (match, id, filename) => {
        // Convert to standard markdown image syntax
        // The Mistral OCR already includes these as proper markdown images
        return ''
      },
    )

    console.log(`[AI] Generated ${processedMarkdown.length} characters of markdown content`)

    // Update the article with plain markdown
    await payload.update({
      collection: 'articles',
      id: articleId,
      data: {
        content: processedMarkdown,
      },
      overrideAccess: true,
      draft: true,
    })

    console.log('[AI] Successfully updated article with markdown content')

    return {
      success: true,
      content: combinedContent,
      message: 'Content generated successfully from documents',
    }
  } catch (error) {
    console.error('[AI] An error occurred during content generation:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function generateCoverPhoto(articleId: string) {
  try {
    console.log(`[AI Image] Starting cover photo generation for articleId: ${articleId}`)
    const payload = await getPayload({ config })

    const article = await payload.findByID({
      collection: 'articles',
      id: articleId,
      depth: 0,
    })

    if (!article) {
      throw new Error('Article not found.')
    }

    // Use the summary for context
    const contentSnippet = article.summary

    const prompt = `Create a visually appealing, abstract, and professional wallpaper background for a knowledge base article.

      - Core-Concept: Glowing particles, interconnected light trails, geometric patterns, futuristic technology.
      - Visual-Style: Modern, clean, minimalist, professional, abstract.
      - Color-Palette: Soft and gentle color scheme with blues and purples.
      - Desired-Feeling: Evokes a sense of knowledge, clarity, and organization.
      - Negative-Prompt: Exclude all text, words, letters, and numbers.

      The final image should be a high-quality, text-free background banner.

    - Article Title: "${article.title}"
    - Artiucle summary: "${contentSnippet}..."`

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

    const response = await ai.models.generateImages({
      model: process.env.GEMINI_IMAGEN_MODEL || 'imagen-4.0-fast-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    })

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('Image generation failed. No images were returned.')
    }

    const generatedImage = response.generatedImages[0]
    if (!generatedImage.image?.imageBytes) {
      throw new Error('Image generation failed. No image bytes were returned.')
    }
    const imgBytes = generatedImage.image.imageBytes
    const buffer = Buffer.from(imgBytes, 'base64')

    const readableName = (article.title || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50)
    const filename = `cover-${readableName}-${Date.now()}.png`

    // Upload the image buffer to the 'media' collection
    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: `Cover photo for: ${article.title}`,
      },
      file: {
        data: buffer,
        mimetype: 'image/png',
        name: filename,
        size: buffer.length,
      },
      overrideAccess: true,
    })

    // Update the article with the new cover photo ID
    await payload.update({
      collection: 'articles',
      id: articleId,
      data: {
        coverPhoto: mediaDoc.id,
      },
      overrideAccess: true,
    })

    console.log(
      `[AI Image] Successfully generated and attached cover photo ${mediaDoc.id} to article ${articleId}`,
    )
    return { success: true, message: 'Cover photo generated and attached successfully.' }
  } catch (error) {
    console.error('[AI Image] An error occurred during cover photo generation:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
