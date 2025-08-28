'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { processDocumentWithMistral } from '../../../../services/mistralSimple'
import { processDocumentWithGemini } from '../../../../services/gemini'
import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import { editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { Media } from '../../../../payload-types'
import { GoogleGenAI } from '@google/genai'

// Helper function to parse markdown tables
function parseMarkdownTableFromText(
  tableText: string,
): { headers: string[]; rows: string[][] } | null {
  const lines = tableText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)
  if (lines.length < 3) return null

  const [headerLine, separatorLine, ...dataLines] = lines
  // Check for common separator patterns: ---, :-- or :--:
  if (
    !separatorLine.includes('---') &&
    !separatorLine.includes(':--') &&
    !separatorLine.includes(':-:')
  )
    return null

  const headers = headerLine
    .split('|')
    .map((cell) => cell.trim())
    .filter((cell) => cell)
  const rows = dataLines
    .map((line) =>
      line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell),
    )
    .filter((row) => row.length > 0)

  return { headers, rows }
}

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

      if (!doc?.url) {
        console.warn(`[AI] Skipping document ${doc?.id} - no URL found`)
        continue
      }

      // Download the file
      let fileUrl = doc.url
      if (fileUrl.startsWith('/')) {
        // For local development, assume localhost:3000
        const payloadUrl = process.env.PAYLOAD_URL || 'http://localhost:3000'
        fileUrl = `${payloadUrl}${fileUrl}`
      }

      const response = await fetch(fileUrl)
      console.log(`[AI] Fetched document from ${fileUrl} - Status: ${response.status}`)
      if (!response.ok) {
        console.warn(`[AI] Failed to download document ${doc.id}`)
        continue
      }

      let buffer = Buffer.from(await response.arrayBuffer())
      let currentMimeType = doc.mimeType || 'application/octet-stream'
      console.log(
        `[AI] Document downloaded into buffer, size: ${buffer.length} bytes. Type: ${currentMimeType}`,
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
        documentContent = await processDocumentWithMistral(
          buffer,
          currentMimeType,
          `Extrahera och strukturera innehållet från detta dokument som heter "${doc.filename || 'Untitled'}".
           Formatera som markdown med tydliga rubriker och organisation.
           Bevara originalspråket (svenska).`,
          payload, // Pass payload instance for image uploads
        )
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

    // Update the article with the generated content
    console.log('[AI] All documents processed. Updating article content...')

    // Convert markdown using the official Payload converter but fix image references first
    let processedMarkdown = combinedContent

    // Extract PAYLOAD_MEDIA references
    const mediaReferences: Array<{ id: string; filename: string }> = []
    processedMarkdown = processedMarkdown.replace(
      /\[PAYLOAD_MEDIA:([^:]+):([^\]]+)\]/g,
      (match, id, filename) => {
        mediaReferences.push({ id, filename })
        return '' // Remove from markdown for now
      },
    )

    // Remove all image references from markdown and we'll add them as upload blocks later
    const inlineImageReferences: Array<{ id: string; filename: string; position: number }> = []
    let imageIndex = 0

    // Find and remove image references, storing their info for later
    processedMarkdown = processedMarkdown.replace(
      /!\[([^\]]*)\]\(([^)]+\.(jpe?g|png|gif|webp))\)/gi,
      (match, alt, filename) => {
        const matchingMedia = mediaReferences.find(
          (media) => media.filename === filename || filename.includes(media.filename),
        )
        if (matchingMedia) {
          inlineImageReferences.push({
            id: matchingMedia.id,
            filename: matchingMedia.filename,
            position: imageIndex++,
          })
          console.log(
            `[AI] Found inline image: ${match} -> will add as upload block (ID: ${matchingMedia.id})`,
          )
          return `\n\n[IMAGE_PLACEHOLDER_${matchingMedia.id}]\n\n` // Placeholder for later replacement
        }
        return match // Keep unknown images as-is
      },
    )

    // Also handle link-style image references
    processedMarkdown = processedMarkdown.replace(
      /\[([^\]]+\.(jpe?g|png|gif|webp))\]\(([^)]+)\)/gi,
      (match, filename, url) => {
        const matchingMedia = mediaReferences.find(
          (media) => media.filename === filename || filename.includes(media.filename),
        )
        if (matchingMedia) {
          inlineImageReferences.push({
            id: matchingMedia.id,
            filename: matchingMedia.filename,
            position: imageIndex++,
          })
          console.log(
            `[AI] Found inline link image: ${match} -> will add as upload block (ID: ${matchingMedia.id})`,
          )
          return `\n\n[IMAGE_PLACEHOLDER_${matchingMedia.id}]\n\n`
        }
        return match
      },
    )

    console.log(
      `[AI] Found ${inlineImageReferences.length} inline images to convert to upload blocks`,
    )

    try {
      const editorConfig = await editorConfigFactory.default({ config: payload.config })
      let newContent = await convertMarkdownToLexical({ editorConfig, markdown: processedMarkdown })

      console.log('[AI] Successfully converted markdown to Lexical format')
      console.log('[AI] Found', mediaReferences.length, 'media references to add')

      // Convert paragraph-based tables to proper Lexical table nodes
      if (newContent.root && newContent.root.children) {
        console.log('[AI] Post-processing content to convert tables to proper table nodes')
        console.log(`[AI] Found ${newContent.root.children.length} children to check`)

        for (let i = 0; i < newContent.root.children.length; i++) {
          const child = newContent.root.children[i]
          console.log(`[AI] Checking child ${i}: type=${child.type}`)

          // Check if this paragraph contains markdown table syntax
          if (child.type === 'paragraph' && child.children) {
            console.log(`[AI] Found paragraph with ${child.children.length} children`)

            // Build text from all text nodes and linebreaks in the paragraph
            let paragraphText = ''
            for (const childNode of child.children) {
              if (childNode.type === 'text') {
                paragraphText += childNode.text || ''
              } else if (childNode.type === 'linebreak') {
                paragraphText += '\n'
              }
            }

            console.log(`[AI] Paragraph text length: ${paragraphText.length}`)
            console.log(
              `[AI] Contains |: ${paragraphText.includes('|')}, Contains ---: ${paragraphText.includes('---')}`,
            )

            // If it looks like a table (contains | and separator patterns like --- or :-- or :--)
            if (
              paragraphText.includes('|') &&
              (paragraphText.includes('---') ||
                paragraphText.includes(':--') ||
                paragraphText.includes(':-:'))
            ) {
              console.log(`[AI] Found table-like paragraph, attempting to convert to table node`)
              console.log(`[AI] Table text preview: ${paragraphText.substring(0, 300)}...`)

              const parsedTable = parseMarkdownTableFromText(paragraphText)
              if (parsedTable && parsedTable.headers.length > 0 && parsedTable.rows.length > 0) {
                console.log(
                  `[AI] Successfully parsed table: ${parsedTable.headers.length} cols, ${parsedTable.rows.length} rows`,
                )

                // Create proper Lexical table node structure
                const tableNode = {
                  type: 'table',
                  version: 1,
                  format: '',
                  indent: 0,
                  direction: 'ltr',
                  children: [
                    // Header row
                    {
                      type: 'tablerow',
                      version: 1,
                      format: '',
                      indent: 0,
                      direction: 'ltr',
                      children: parsedTable.headers.map((header) => ({
                        type: 'tablecell',
                        version: 1,
                        format: '',
                        indent: 0,
                        colSpan: 1,
                        rowSpan: 1,
                        headerState: 3, // Header cell
                        backgroundColor: null,
                        direction: 'ltr',
                        children: [
                          {
                            type: 'paragraph',
                            version: 1,
                            format: '',
                            indent: 0,
                            direction: 'ltr',
                            textFormat: 0,
                            textStyle: '',
                            children: [
                              {
                                type: 'text',
                                version: 1,
                                text: header.replace(/<br>/g, '\n').trim(),
                                format: 0,
                                style: '',
                                mode: 'normal',
                                detail: 0,
                              },
                            ],
                          },
                        ],
                      })),
                    },
                    // Data rows
                    ...parsedTable.rows.map((row) => ({
                      type: 'tablerow',
                      version: 1,
                      format: '',
                      indent: 0,
                      direction: 'ltr',
                      children: row.map((cell) => ({
                        type: 'tablecell',
                        version: 1,
                        format: '',
                        indent: 0,
                        colSpan: 1,
                        rowSpan: 1,
                        headerState: 0, // Regular cell
                        backgroundColor: null,
                        direction: 'ltr',
                        children: [
                          {
                            type: 'paragraph',
                            version: 1,
                            format: '',
                            indent: 0,
                            direction: 'ltr',
                            textFormat: 0,
                            textStyle: '',
                            children: [
                              {
                                type: 'text',
                                version: 1,
                                text: cell
                                  .replace(/<br>/g, '\n')
                                  .replace(/\$([^$]+)\$/g, '$1')
                                  .trim(),
                                format: 0,
                                style: '',
                                mode: 'normal',
                                detail: 0,
                              },
                            ],
                          },
                        ],
                      })),
                    })),
                  ],
                }

                // Replace the paragraph with the table node
                newContent.root.children[i] = tableNode as any
                console.log(`[AI] Replaced paragraph with table node`)
              } else {
                console.log(`[AI] Failed to parse table from paragraph text`)
              }
            } else if (paragraphText.includes('|')) {
              console.log(
                `[AI] Paragraph has pipes but no --- separator. Text: ${paragraphText.substring(0, 100)}`,
              )
            }
          }
        }

        // Replace inline image placeholders with upload blocks
        for (const inlineImage of inlineImageReferences) {
          const placeholderText = `[IMAGE_PLACEHOLDER_${inlineImage.id}]`

          // Find paragraphs containing the placeholder
          for (let i = 0; i < newContent.root.children.length; i++) {
            const child = newContent.root.children[i]
            if (child.type === 'paragraph' && child.children) {
              // Check if any text node contains our placeholder
              let foundPlaceholder = false
              for (const textChild of child.children) {
                if (
                  'text' in textChild &&
                  textChild.text &&
                  textChild.text.includes(placeholderText)
                ) {
                  foundPlaceholder = true
                  break
                }
              }

              if (foundPlaceholder) {
                // Replace this paragraph with an upload block
                console.log(`[AI] Replacing placeholder ${placeholderText} with upload block`)
                newContent.root.children[i] = {
                  id: `inline-upload-${inlineImage.id}-${Date.now()}`,
                  type: 'upload',
                  value: parseInt(inlineImage.id),
                  fields: {},
                  format: '',
                  version: 3,
                  relationTo: 'media',
                }
                break
              }
            }
          }
        }

        // Add remaining images that weren't inline at the end
        const usedInlineIds = new Set(inlineImageReferences.map((img) => img.id))
        const remainingImages = mediaReferences.filter((media) => !usedInlineIds.has(media.id))

        if (remainingImages.length > 0) {
          // Add a horizontal rule separator
          newContent.root.children.push({
            type: 'horizontalrule',
            version: 1,
          })

          // Add remaining images as upload blocks at the end
          for (const mediaRef of remainingImages) {
            newContent.root.children.push({
              id: `end-upload-${mediaRef.id}-${Date.now()}`,
              type: 'upload',
              value: parseInt(mediaRef.id),
              fields: {},
              format: '',
              version: 3,
              relationTo: 'media',
            })
          }
        }
      }

      // Debug: Check current article state before update
      console.log('[AI] Current article title:', article.title)
      console.log('[AI] Current article ID:', article.id)

      const updatedArticle = await payload.update({
        collection: 'articles',
        id: articleId,
        data: {
          content: newContent as any,
        },
        overrideAccess: true, // Skip access control
        draft: true, // Update the draft version to avoid validation issues
      })

      console.log('[AI] Successfully updated article')
    } catch (lexicalError) {
      console.error('[AI] Error with Lexical conversion:', lexicalError)
      throw new Error('Failed to convert content to Lexical format')
    }

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

    // Function to serialize Lexical content to a plain text string
    const lexicalToText = (nodes: any[]): string => {
      let text = ''
      for (const node of nodes) {
        if (node.type === 'text') {
          text += node.text
        } else if (node.children && Array.isArray(node.children)) {
          text += lexicalToText(node.children) + ' ' // Add space between nodes
        }
      }
      return text
    }

    // Extract the first 2000 characters of the article content to provide more context
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
      model: 'imagen-4.0-fast-generate-001',
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

    const readableName = article.title
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
