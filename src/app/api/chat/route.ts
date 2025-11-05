import { NextRequest, NextResponse } from 'next/server'
import { chatWithKnowledge, type ChatMessage } from '@/services/geminiChat'
import { getExternalSources } from '@/config/externalSources'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  let body: any = null

  try {
    body = await request.json()
    const {
      message,
      departmentIds = [],
      externalSourceIds = [],
      useGoogleGrounding = false,
      history = [],
      articleContext,
    } = body

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (process.env.QDRANT_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Knowledge base search is not enabled' },
        { status: 503 }
      )
    }

    // Validate external source IDs against configuration (supports dot notation like "svensk-lag.pbl")
    const availableSources = getExternalSources()

    // Build set of valid IDs including parent.child patterns
    const validIds = new Set<string>()
    for (const source of availableSources) {
      validIds.add(source.id)
      if ('subSources' in source && source.subSources) {
        for (const subSource of source.subSources) {
          validIds.add(`${source.id}.${subSource.id}`)
        }
      }
    }

    const validExternalSourceIds = externalSourceIds.filter((id: string) => validIds.has(id))

    if (validExternalSourceIds.length !== externalSourceIds.length) {
      const invalidIds = externalSourceIds.filter((id: string) => !validExternalSourceIds.includes(id))
      console.warn('Some external source IDs not found in configuration:', {
        requested: externalSourceIds,
        invalid: invalidIds,
        available: Array.from(validIds),
      })
    }

    // Use department IDs directly - no hierarchical expansion
    // Users explicitly select which departments to include via checkboxes

    // Validate history format
    const validatedHistory: ChatMessage[] = []
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (
          msg &&
          typeof msg === 'object' &&
          typeof msg.content === 'string' &&
          (msg.role === 'user' || msg.role === 'assistant')
        ) {
          validatedHistory.push({
            role: msg.role,
            content: msg.content,
          })
        }
      }
    }

    // Call the chat service
    const response = await chatWithKnowledge({
      message,
      departmentIds,
      externalSourceIds: validExternalSourceIds,
      useGoogleGrounding,
      history: validatedHistory,
      articleContext: articleContext || null,
    })

    return NextResponse.json({
      response,
      departmentIds, // Return expanded IDs for transparency
      externalSourceIds: validExternalSourceIds, // Return validated IDs
    })
  } catch (error) {
    console.error('[Chat API Error]', error)

    // Check for specific error types
    if (error instanceof Error) {
      // Rate limit errors
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          {
            error: 'API rate limit nådd. Vänligen försök igen om en stund.',
            debugInfo: {
              errorType: 'rate_limit',
              timestamp: new Date().toISOString(),
            }
          },
          { status: 429 }
        )
      }

      // API key errors
      if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json(
          {
            error: 'API-konfigurationsfel. Kontakta utvecklaren.',
            debugInfo: {
              errorType: 'api_config',
              timestamp: new Date().toISOString(),
            }
          },
          { status: 500 }
        )
      }

      // Qdrant connection errors
      if (error.message.includes('Qdrant') || error.message.includes('vector')) {
        return NextResponse.json(
          {
            error: 'Fel vid anslutning till kunskapsdatabasen. Vänligen försök igen.',
            debugInfo: {
              errorType: 'qdrant_connection',
              errorMessage: error.message,
              timestamp: new Date().toISOString(),
            }
          },
          { status: 500 }
        )
      }

      // OpenAI embedding errors
      if (error.message.includes('embedding') || error.message.includes('OpenAI')) {
        return NextResponse.json(
          {
            error: 'Fel vid generering av sökning. Vänligen försök igen.',
            debugInfo: {
              errorType: 'embedding_error',
              errorMessage: error.message,
              timestamp: new Date().toISOString(),
            }
          },
          { status: 500 }
        )
      }

      // Return detailed error for developers in test phase
      return NextResponse.json(
        {
          error: `Ett fel uppstod: ${error.message}`,
          debugInfo: {
            errorType: 'unknown',
            errorMessage: error.message,
            errorStack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
            timestamp: new Date().toISOString(),
            requestInfo: body ? {
              messageLength: body.message?.length || 0,
              historyLength: body.history?.length || 0,
              departmentFilters: body.departmentIds?.length || 0,
              externalSourceFilters: body.externalSourceIds?.length || 0,
            } : null
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'Ett okänt fel uppstod när meddelandet bearbetades.',
        debugInfo: {
          errorType: 'unknown_non_error',
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch available departments and external sources
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Fetch all departments
    const departments = await payload.find({
      collection: 'departments',
      limit: 100,
      depth: 1,
    })

    // Structure departments in a hierarchical format
    const departmentTree = buildDepartmentTree(departments.docs)

    // Fetch external sources from configuration (generic - no hardcoded IDs)
    const externalSources = getExternalSources().map((source) => ({
      id: source.id,
      label: source.label,
      icon: source.icon,
      color: source.color,
      type: source.type,
      subSources: 'subSources' in source ? source.subSources : undefined,
    }))

    return NextResponse.json({
      departments: departmentTree,
      externalSources, // Dynamically from config
      geminiGroundingEnabled: process.env.GEMINI_GROUNDING_ENABLED === 'true',
      total: departments.totalDocs,
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
  }
}

function buildDepartmentTree(departments: any[]): any[] {
  const map = new Map()
  const roots: any[] = []

  // First pass: create all department objects
  departments.forEach((dept) => {
    map.set(dept.id, {
      id: dept.id,
      name: dept.name,
      slug: dept.slug,
      children: [],
    })
  })

  // Second pass: build the tree
  departments.forEach((dept) => {
    const node = map.get(dept.id)
    if (dept.parent && typeof dept.parent === 'string') {
      const parent = map.get(dept.parent)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    } else if (dept.parent && typeof dept.parent === 'object' && dept.parent.id) {
      const parent = map.get(dept.parent.id)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}