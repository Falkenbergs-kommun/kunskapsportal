import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { convertLexicalToMarkdown, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'
import config from '../../../payload.config'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Define the expected structure for metadata
const metadataSchema = {
  type: 'object',
  properties: {
    documentType: {
      type: 'string',
      enum: ['policy', 'procedure', 'regulation', 'guideline', 'decision', 'report', 'template', 'faq'],
      description: 'The type of municipal document'
    },
    department: {
      type: 'string',
      enum: ['municipal_board', 'technical_services', 'social_services', 'education', 'environment', 'building_permits', 'human_resources'],
      description: 'The municipal department responsible for this document'
    },
    documentStatus: {
      type: 'string',
      enum: ['draft', 'review', 'approved', 'active', 'archived', 'superseded'],
      description: 'Current status of the document'
    },
    targetAudience: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['citizens', 'staff', 'officials', 'businesses', 'municipalities']
      },
      description: 'Who this document is intended for'
    },
    securityLevel: {
      type: 'string',
      enum: ['public', 'internal', 'confidential', 'restricted'],
      description: 'Security classification level'
    },
    gdprRelevant: {
      type: 'boolean',
      description: 'Whether the document contains personal data'
    },
    accessibilityCompliant: {
      type: 'boolean',
      description: 'Whether the document follows WCAG 2.1 AA standards'
    },
    language: {
      type: 'string',
      enum: ['sv', 'en', 'sv-simple'],
      description: 'Primary language of the document'
    },
    keywords: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          keyword: { type: 'string' }
        }
      },
      description: 'Relevant keywords for searchability'
    },
    legalBasis: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          law: { type: 'string', description: 'Name of the law or regulation' },
          chapter: { type: 'string', description: 'Specific chapter or section' },
          url: { type: 'string', description: 'URL to legal reference' }
        }
      },
      description: 'Legal foundation for the document'
    },
    author: {
      type: 'string',
      description: 'Document author name'
    },
    reviewer: {
      type: 'string',
      description: 'Person responsible for reviewing'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, articleId } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Convert Lexical content to markdown for analysis
    let markdown = ''
    if (content && content.root) {
      try {
        const payload = await getPayload({ config })
        const editorConfig = await editorConfigFactory.default({
          config: payload.config,
        })
        markdown = await convertLexicalToMarkdown({
          data: content,
          editorConfig,
        })
      } catch (error) {
        console.warn('Failed to convert content to markdown, using title only')
        markdown = title
      }
    }

    // Create the model with structured output
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: metadataSchema,
      },
    })

    const prompt = `
Analyze this Swedish municipal document and generate appropriate metadata following Swedish municipal standards and practices.

Title: ${title}

Content:
${markdown}

Instructions:
- Classify the document type based on its content and purpose
- Determine the most appropriate municipal department based on subject matter
- Set appropriate document status (likely 'draft' for new documents)
- Identify target audience based on content complexity and subject
- Set security level (default to 'internal' unless clearly public-facing)
- Determine if document contains personal data (GDPR relevant)
- Assess if content follows accessibility standards
- Extract 5-8 relevant keywords in Swedish
- Identify any Swedish laws, regulations, or municipal bylaws referenced
- Suggest appropriate author/reviewer roles

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

    console.log('Generated metadata:', generatedMetadata)

    return NextResponse.json({
      success: true,
      metadata: generatedMetadata,
    })
  } catch (error) {
    console.error('Error generating metadata:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate metadata' },
      { status: 500 }
    )
  }
}