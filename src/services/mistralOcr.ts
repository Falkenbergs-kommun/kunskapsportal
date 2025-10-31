import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import type { Payload } from 'payload'

const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

interface MistralOcrResult {
  markdown: string
  metadata: {
    hasText: boolean
    hasImages: boolean
    imageCount: number
    imagePaths: string[]
    payloadMediaIds: string[]
    documentSourceType: string
  }
}

interface ImageInfo {
  data: string
  page: number
  index: number
  filename: string
  payloadMediaId?: string
}

export class MistralOcrService {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MISTRAL_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('MISTRAL_API_KEY is not set.')
    }
  }

  private async convertPdfToBase64DataUrl(pdfSource: Buffer): Promise<string> {
    const base64 = pdfSource.toString('base64')
    return `data:application/pdf;base64,${base64}`
  }

  async pdfToMarkdown(
    pdfSource: Buffer,
    options: {
      saveImages?: boolean
      imageOutputDir?: string
      debug?: boolean
      payload?: Payload
      uploadToPayload?: boolean
    } = {},
  ): Promise<MistralOcrResult> {
    const { saveImages = true, imageOutputDir, debug = false, payload, uploadToPayload = false } = options

    try {
      console.log('[Mistral OCR] Starting document processing...')

      const documentUrl = await this.convertPdfToBase64DataUrl(pdfSource)

      const ocrPayload = {
        model: process.env.MISTRAL_OCR_MODEL || 'mistral-ocr-latest',
        document: {
          type: 'document_url',
          document_url: documentUrl,
        },
        include_image_base64: true,
      }

      console.log('[Mistral OCR] Sending document to Mistral OCR API...')
      const ocrResponseRaw = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(ocrPayload),
      })

      if (!ocrResponseRaw.ok) {
        const errorBody = await ocrResponseRaw.text()
        throw new Error(`Mistral OCR request failed: ${errorBody}`)
      }

      const ocrResponse = await ocrResponseRaw.json()

      console.log('[Mistral OCR] OCR processing complete. Parsing response...')

      if (debug) {
        console.log('[Mistral OCR] Response structure:', Object.keys(ocrResponse))
      }

      let textContent = ''
      const imagesData: ImageInfo[] = []

      if (ocrResponse.pages && ocrResponse.pages.length > 0) {
        for (const [pageIndex, page] of ocrResponse.pages.entries()) {
          if (page.markdown) {
            textContent += page.markdown + '\n\n'
          }
          if (saveImages && page.images && page.images.length > 0) {
            for (const img of page.images) {
              const imgData = this.extractImageData(img)
              if (imgData) {
                const imageFilename = this.generateImageFilename(
                  img,
                  pageIndex + 1,
                  imagesData.length + 1,
                )
                imagesData.push({
                  data: imgData,
                  page: pageIndex + 1,
                  index: imagesData.length + 1,
                  filename: imageFilename,
                })
              }
            }
          }
        }
      }

      const metadata: MistralOcrResult['metadata'] = {
        documentSourceType: 'buffer',
        hasText: textContent.trim().length > 0,
        hasImages: imagesData.length > 0,
        imageCount: imagesData.length,
        imagePaths: [],
        payloadMediaIds: [],
      }

      if (metadata.hasImages && saveImages) {
        // Upload to Payload if requested and payload instance is provided
        if (uploadToPayload && payload) {
          console.log('[Mistral OCR] Uploading images to Payload...')
          for (const imgInfo of imagesData) {
            try {
              const imageBuffer = this.decodeImageData(imgInfo.data)
              const payloadMediaId = await this.uploadImageToPayload(
                imageBuffer,
                imgInfo.filename,
                payload,
              )
              imgInfo.payloadMediaId = payloadMediaId
              metadata.payloadMediaIds.push(payloadMediaId)
              console.log(`[Mistral OCR] Uploaded image ${imgInfo.filename} with ID: ${payloadMediaId}`)
            } catch (error) {
              console.error(`[Mistral OCR] Failed to upload image ${imgInfo.filename}:`, error)
            }
          }
        } else {
          // Save to filesystem as before
          const imageDir =
            imageOutputDir || path.join(process.cwd(), 'temp', 'pdf_images_' + Date.now())
          await mkdir(imageDir, { recursive: true })

          for (const imgInfo of imagesData) {
            const imagePath = path.join(imageDir, imgInfo.filename)
            const imageBuffer = this.decodeImageData(imgInfo.data)
            await writeFile(imagePath, imageBuffer)
            metadata.imagePaths.push(imagePath)
          }
        }
      }

      // Clean LaTeX notation from the extracted text
      let cleanedMarkdown = this.cleanLatexNotation(textContent)

      // Process markdown to include Payload image references if images were uploaded
      let finalMarkdown = cleanedMarkdown
      if (uploadToPayload && payload && metadata.payloadMediaIds.length > 0) {
        finalMarkdown = this.processMarkdownWithPayloadImages(cleanedMarkdown, imagesData)
      }

      return {
        markdown: finalMarkdown,
        metadata,
      }
    } catch (error) {
      console.error('[Mistral OCR] Error processing document:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to process document with Mistral OCR: ${error.message}`)
      }
      throw new Error(`Failed to process document with Mistral OCR: ${String(error)}`)
    }
  }

  private extractImageData(img: any): string | null {
    const possibleAttributes = ['data', 'base64', 'content', 'image_base64', 'imageBase64']
    for (const attr of possibleAttributes) {
      if (img[attr] && typeof img[attr] === 'string') {
        return img[attr]
      }
    }
    return null
  }

  private generateImageFilename(img: any, page: number, index: number): string {
    if (img.id && typeof img.id === 'string') {
      const ext = img.id.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? '' : '.jpg'
      return `${img.id}${ext}`
    }
    return `image_p${page}_${index}.png`
  }

  private decodeImageData(imgData: string): Buffer {
    if (imgData.startsWith('data:image')) {
      const [, encoded] = imgData.split(',', 2)
      return Buffer.from(encoded, 'base64')
    }
    return Buffer.from(imgData, 'base64')
  }

  private async uploadImageToPayload(
    imageBuffer: Buffer,
    filename: string,
    payload: Payload,
  ): Promise<string> {
    try {
      const result = await payload.create({
        collection: 'media',
        data: {
          alt: `Extracted image: ${filename}`,
        },
        file: {
          data: imageBuffer,
          mimetype: this.getMimeTypeFromFilename(filename),
          name: filename,
          size: imageBuffer.length,
        },
      })

      return String(result.id)
    } catch (error) {
      console.error('[Mistral OCR] Failed to upload image to Payload:', error)
      throw new Error(`Failed to upload image to Payload: ${error}`)
    }
  }

  private getMimeTypeFromFilename(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop()
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'gif':
        return 'image/gif'
      case 'webp':
        return 'image/webp'
      default:
        return 'image/png'
    }
  }

  private cleanLatexNotation(text: string): string {
    let cleaned = text

    // Remove inline math delimiters: $...$ but preserve file paths like C:/Users
    // Only remove $ if it's followed/preceded by non-path characters
    cleaned = cleaned.replace(/\$([^\$\n]+?)\$/g, (match, content) => {
      // If content looks like a file path (contains : or multiple /\), keep the dollars
      if (content.includes(':\\') || content.includes(':/') || content.match(/[\/\\]{2,}/)) {
        return match
      }
      // Otherwise remove the dollars
      return content
    })

    // Remove display math delimiters: $$...$$
    cleaned = cleaned.replace(/\$\$([^\$]+?)\$\$/g, '$1')

    // Convert \mathrm{text} to plain text
    cleaned = cleaned.replace(/\\mathrm\{([^}]+)\}/g, '$1')

    // Convert \text{text} to plain text
    cleaned = cleaned.replace(/\\text\{([^}]+)\}/g, '$1')

    // Convert \frac{a}{b} to a/b
    cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')

    // Remove other common LaTeX commands (keep the content)
    cleaned = cleaned.replace(/\\(?:textbf|textit|emph|mathbf|mathit)\{([^}]+)\}/g, '$1')

    return cleaned
  }

  private processMarkdownWithPayloadImages(markdown: string, imageInfos: ImageInfo[]): string {
    let processedMarkdown = markdown

    // Replace image placeholders in markdown with Payload media references
    for (const imgInfo of imageInfos) {
      if (imgInfo.payloadMediaId) {
        // Look for image references and replace with Payload upload blocks
        const imageBlock = {
          type: 'upload',
          value: {
            id: imgInfo.payloadMediaId,
          },
          relationTo: 'media',
        }

        // Insert the image block reference in a custom format
        // Use a special marker for image placeholders
        const imageReference = `[PAYLOAD_MEDIA:${imgInfo.payloadMediaId}:${imgInfo.filename}]`

        // Find a good place to insert the image (after paragraphs on the same page)
        const pageMarker = `<!-- Page ${imgInfo.page} -->`
        if (processedMarkdown.includes(pageMarker)) {
          processedMarkdown = processedMarkdown.replace(
            pageMarker,
            `${pageMarker}\n\n${imageReference}\n`,
          )
        } else {
          // If no page marker, append at the end
          processedMarkdown += `\n\n${imageReference}\n`
        }
      }
    }

    return processedMarkdown
  }
}

export const mistralOcr = new MistralOcrService()
