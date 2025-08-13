import { mistralOcr } from './mistralOcr'
import type { Payload } from 'payload'

export async function processDocumentWithMistral(
  fileBuffer: Buffer,
  mimeType: string,
  customPrompt?: string,
  payload?: Payload,
): Promise<string> {
  try {
    console.log('[Mistral Simple] Processing document with Mistral OCR...')

    // Use the OCR service to extract content
    const result = await mistralOcr.pdfToMarkdown(fileBuffer, {
      saveImages: true,
      uploadToPayload: !!payload, // Upload to Payload if payload instance is provided
      payload,
      debug: false,
    })

    console.log(`[Mistral Simple] Extracted ${result.markdown.length} characters`)
    console.log(`[Mistral Simple] Found ${result.metadata.imageCount} images`)
    
    if (result.metadata.payloadMediaIds.length > 0) {
      console.log(`[Mistral Simple] Uploaded ${result.metadata.payloadMediaIds.length} images to Payload:`, result.metadata.payloadMediaIds)
    }

    // If we want to use a custom prompt to process the extracted content further
    if (customPrompt && result.markdown.trim()) {
      console.log('[Mistral Simple] Processing with custom prompt...')
      // You could use Mistral's chat completion to further process the extracted text
      // This would be similar to how you used Gemini with a custom prompt
    }

    return result.markdown
  } catch (error) {
    console.error('[Mistral Simple] Error processing document:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to process document with Mistral: ${error.message}`)
    }
    throw new Error(`Failed to process document with Mistral: ${String(error)}`)
  }
}
