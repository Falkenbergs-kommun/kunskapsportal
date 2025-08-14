import type { Endpoint } from 'payload/config'
import type { PayloadRequest } from 'payload/types'
import type { Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { convertLexicalToMarkdown, editorConfigFactory } from '@payloadcms/richtext-lexical'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Define the expected structure for metadata
const metadataSchema = {
  type: 'object',
  properties: {
    documentType: {
      type: 'string',
      enum: [
        'policy',
        'procedure',
        'regulation',
        'guideline',
        'instruction',
        'decision',
        'report',
        'template',
        'faq',
      ],
      description: 'The type of municipal document',
    },
    department: {
      type: 'string',
      enum: [
        'municipal_board',
        'technical_services',
        'social_services',
        'education',
        'environment',
        'building_permits',
        'human_resources',
      ],
      description: 'The municipal department responsible for this document',
    },
    documentStatus: {
      type: 'string',
      enum: ['draft', 'review', 'approved', 'active', 'archived', 'superseded'],
      description: 'Current status of the document',
    },
    targetAudience: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['citizens', 'staff', 'officials', 'businesses', 'municipalities'],
      },
      description: 'Who this document is intended for',
    },
    securityLevel: {
      type: 'string',
      enum: ['public', 'internal', 'confidential', 'restricted'],
      description: 'Security classification level',
    },
    gdprRelevant: {
      type: 'boolean',
      description: 'Whether the document contains personal data',
    },
    accessibilityCompliant: {
      type: 'boolean',
      description: 'Whether the document follows WCAG 2.1 AA standards',
    },
    language: {
      type: 'string',
      enum: ['sv', 'en', 'sv-simple'],
      description: 'Primary language of the document',
    },
    keywords: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
        },
      },
      description: 'Relevant keywords for searchability',
    },
    legalBasis: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          law: { type: 'string', description: 'Name of the law or regulation' },
          chapter: { type: 'string', description: 'Specific chapter or section' },
          url: { type: 'string', description: 'URL to legal reference' },
        },
      },
      description: 'Legal foundation for the document',
    },
    version: {
      type: 'string',
      description: 'Document version number (e.g., 1.6, 2.0)',
    },
    reviewInterval: {
      type: 'string',
      enum: ['as_needed', 'annual', 'biannual', 'triannual', 'five_years'],
      description: 'How often the document should be reviewed',
    },
    appliesTo: {
      type: 'string',
      description: 'Organizations, departments, or activities this document covers',
    },
    author: {
      type: 'string',
      description: 'Document author name',
    },
    reviewer: {
      type: 'string',
      description: 'Person or department responsible for reviewing this document',
    },
  },
}

export const generateMetadataEndpoint: Endpoint = {
  path: '/generate-metadata/:id',
  method: 'post',
  handler: async (req: PayloadRequest, res?: Response) => {
    console.log('Handler called with res type:', typeof res)
    console.log('res object keys:', res ? Object.keys(res) : 'res is undefined')

    try {
      // Debug logging
      console.log('req.params:', req.params)
      console.log('req.query:', req.query)
      console.log('req.url:', req.url)
      console.log('req.route:', req.route)

      // Extract ID from URL path - the URL should be like /api/articles/generate-metadata/7
      const urlParts = req.url?.split('/') || []
      const id = urlParts[urlParts.length - 1] // Last part should be the ID
      console.log('URL parts:', urlParts)
      console.log('Extracted ID:', id)

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Article ID is required',
        })
      }

      const payload = req.payload

      // Get the article
      const article = await payload.findByID({
        collection: 'articles',
        id,
        depth: 0,
      })

      if (!article.title || !article.content) {
        return res.status(400).json({
          success: false,
          message: 'Article must have title and content',
        })
      }

      // Convert Lexical content to markdown
      let markdown = ''
      try {
        const editorConfig = await editorConfigFactory.default({
          config: payload.config,
        })
        markdown = await convertLexicalToMarkdown({
          data: article.content,
          editorConfig,
        })
      } catch (error) {
        console.warn('Failed to convert content to markdown, using title only. Error:', error)
        markdown = article.title
      }

      // Create the model with structured output
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: metadataSchema,
        },
      })

      const prompt = `
Analyze this Swedish municipal document and generate appropriate metadata following Swedish municipal standards and practices.

Title: ${article.title}

Content:
${markdown}

Instructions:
- Classify the document type based on its content and purpose (policy, procedure, regulation, guideline, instruction/anvisning, decision, report, template, faq)
- Determine the most appropriate municipal department based on subject matter
- Set appropriate document status (likely 'draft' for new documents)  
- Identify target audience based on content complexity and subject
- Set security level (default to 'internal' unless clearly public-facing)
- Determine if document contains personal data (GDPR relevant)
- Assess if content follows accessibility standards
- Extract 5-8 relevant keywords in Swedish
- Identify any Swedish laws, regulations, or municipal bylaws referenced
- Suggest appropriate author/reviewer roles
- Suggest a version number (start with 1.0 for new documents)
- Determine appropriate review interval (as_needed, annual, biannual, triannual, five_years)
- Identify what organizations, departments, or activities this document applies to (appliesTo)

Consider Swedish municipal structure:
- Kommunstyrelsen: Overall governance, strategy
- Tekniska förvaltningen: Infrastructure, utilities, maintenance
- Socialförvaltningen: Social services, elderly care, disability services  
- Utbildningsförvaltningen: Education, schools, childcare
- Miljöförvaltningen: Environmental protection, waste management
- Byggförvaltningen: Building permits, planning, construction
- HR-avdelningen: Human resources, personnel policies

Respond with structured JSON metadata only.
`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const generatedMetadata = JSON.parse(response.text())

      console.log('Generated metadata for article', id, ':', generatedMetadata)

      // Update the article with the generated metadata
      console.log('Updating article with generated metadata...')
      await payload.update({
        collection: 'articles',
        id,
        data: generatedMetadata,
      })
      console.log('Article updated successfully with metadata')

      // Try using modern Response constructor if res is undefined
      if (!res) {
        console.log('Using modern Response constructor...')
        return new Response(
          JSON.stringify({
            success: true,
            metadata: generatedMetadata,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
      }

      console.log('About to send successful response...')
      return res.json({
        success: true,
        metadata: generatedMetadata,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      console.error('Error generating metadata:', error)

      // Try using modern Response constructor for errors too
      if (!res) {
        console.log('Using modern Response constructor for error...')
        return new Response(
          JSON.stringify({
            success: false,
            message,
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
      }

      console.log('About to send error response...')
      return res.status(500).json({
        success: false,
        message,
      })
    }
  },
}
