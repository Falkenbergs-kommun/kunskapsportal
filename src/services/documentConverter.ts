import { exec } from 'child_process'
import { promisify } from 'util'
import { createWriteStream, createReadStream, promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const execAsync = promisify(exec)

interface ConversionResult {
  success: boolean
  pdfBuffer?: Buffer
  originalMimeType: string
  convertedMimeType?: string
  error?: string
}

// Supported Office document types that can be converted to PDF
const CONVERTIBLE_MIME_TYPES = new Set([
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/msword', // .doc (can also be processed directly by Gemini, but conversion gives better results)
  'application/x-cfb', // .doc (alternative MIME type detection for Compound File Binary format)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
])

// MIME types that Gemini can process directly (no conversion needed)
const GEMINI_NATIVE_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
])

export class DocumentConverter {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'conversions')
  }

  async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      console.warn('Could not create temp directory:', error)
    }
  }

  /**
   * Check if LibreOffice is available and find the correct command
   */
  async checkLibreOfficeAvailable(): Promise<string | null> {
    const possibleCommands = [
      '/opt/homebrew/bin/soffice', // Most common on macOS with Homebrew
      'soffice',
      'libreoffice',
      '/opt/homebrew/bin/libreoffice',
      '/usr/local/bin/libreoffice',
      '/Applications/LibreOffice.app/Contents/MacOS/soffice',
      '/usr/bin/libreoffice'
    ]

    for (const cmd of possibleCommands) {
      try {
        await execAsync(`${cmd} --version`)
        console.log(`[Converter] Found LibreOffice at: ${cmd}`)
        return cmd
      } catch {
        // Try next command
      }
    }
    return null
  }

  /**
   * Determine if a document needs conversion or can be processed directly
   * For Mistral OCR workflow: convert all Office docs to PDF for consistent processing
   */
  needsConversion(mimeType: string, preferMistral: boolean = true): boolean {
    // If we prefer Mistral OCR, convert everything except PDF to PDF
    if (preferMistral) {
      return mimeType !== 'application/pdf' && CONVERTIBLE_MIME_TYPES.has(mimeType)
    }
    
    // Legacy logic: If Gemini can handle it natively, no conversion needed
    if (GEMINI_NATIVE_TYPES.has(mimeType)) {
      return false
    }
    
    // If it's convertible, convert it to PDF for better processing
    return CONVERTIBLE_MIME_TYPES.has(mimeType)
  }

  /**
   * Convert an Office document to PDF using LibreOffice
   */
  async convertToPdf(
    inputBuffer: Buffer,
    originalMimeType: string,
    originalFilename?: string
  ): Promise<ConversionResult> {
    if (!this.needsConversion(originalMimeType)) {
      return {
        success: false,
        originalMimeType,
        error: 'Document type does not need conversion'
      }
    }

    // Check if LibreOffice is available and get the correct command
    const libreOfficeCmd = await this.checkLibreOfficeAvailable()
    if (!libreOfficeCmd) {
      return {
        success: false,
        originalMimeType,
        error: 'LibreOffice not available for conversion. Please install LibreOffice or convert document to PDF manually.'
      }
    }

    await this.ensureTempDir()

    const sessionId = uuidv4()
    const inputFile = path.join(this.tempDir, `${sessionId}_input${this.getExtensionFromMimeType(originalMimeType)}`)
    const outputDir = path.join(this.tempDir, sessionId)
    
    try {
      // Write input buffer to temporary file
      await fs.writeFile(inputFile, inputBuffer)
      await fs.mkdir(outputDir, { recursive: true })

      console.log(`[Converter] Converting ${originalMimeType} file to PDF...`)
      console.log(`[Converter] Input: ${inputFile}`)
      console.log(`[Converter] Output dir: ${outputDir}`)

      // Run LibreOffice conversion
      // --headless: run without UI
      // --convert-to pdf: convert to PDF format
      // --outdir: output directory
      const cmd = `"${libreOfficeCmd}" --headless --convert-to pdf --outdir "${outputDir}" "${inputFile}"`
      console.log(`[Converter] Running command: ${cmd}`)
      const { stdout, stderr } = await execAsync(cmd, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })

      console.log(`[Converter] LibreOffice stdout:`, stdout)
      if (stderr) {
        console.warn(`[Converter] LibreOffice stderr:`, stderr)
      }

      // Find the generated PDF file
      const outputFiles = await fs.readdir(outputDir)
      const pdfFile = outputFiles.find(f => f.endsWith('.pdf'))
      
      if (!pdfFile) {
        throw new Error('No PDF file was generated by LibreOffice')
      }

      const pdfPath = path.join(outputDir, pdfFile)
      const pdfBuffer = await fs.readFile(pdfPath)

      console.log(`[Converter] Successfully converted to PDF. Size: ${pdfBuffer.length} bytes`)

      return {
        success: true,
        pdfBuffer,
        originalMimeType,
        convertedMimeType: 'application/pdf'
      }

    } catch (error) {
      console.error(`[Converter] Conversion failed:`, error)
      return {
        success: false,
        originalMimeType,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      }
    } finally {
      // Cleanup temporary files
      try {
        await fs.unlink(inputFile)
        await fs.rm(outputDir, { recursive: true, force: true })
      } catch (cleanupError) {
        console.warn(`[Converter] Cleanup failed:`, cleanupError)
      }
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'application/vnd.ms-powerpoint': '.ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'application/msword': '.doc',
      'application/x-cfb': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/pdf': '.pdf',
      'text/plain': '.txt'
    }
    return extensions[mimeType] || '.bin'
  }

  /**
   * Get human-readable name for document type
   */
  getDocumentTypeName(mimeType: string): string {
    const names: Record<string, string> = {
      'application/pdf': 'PDF Document',
      'application/vnd.ms-powerpoint': 'PowerPoint Presentation (.ppt)',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation (.pptx)',
      'application/msword': 'Word Document (.doc)',
      'application/x-cfb': 'Word Document (.doc)',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document (.docx)',
      'application/vnd.ms-excel': 'Excel Spreadsheet (.xls)',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet (.xlsx)',
      'text/plain': 'Text File'
    }
    return names[mimeType] || 'Unknown Document'
  }

  /**
   * Get all supported MIME types (both native and convertible)
   */
  getSupportedMimeTypes(): string[] {
    return Array.from(new Set([...GEMINI_NATIVE_TYPES, ...CONVERTIBLE_MIME_TYPES]))
  }
}

export const documentConverter = new DocumentConverter()