import { NextRequest, NextResponse } from 'next/server'
import { chatWithKnowledge, type ChatMessage } from '@/services/geminiChat'
import { getDepartmentHierarchy } from '@/services/qdrantSearch'
import { getExternalSources } from '@/config/externalSources'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, departmentIds = [], externalSourceIds = [], history = [], articleContext } = body

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

    // Validate external source IDs against configuration
    const availableSources = getExternalSources()
    const validExternalSourceIds = externalSourceIds.filter((id: string) =>
      availableSources.some((source) => source.id === id),
    )

    if (validExternalSourceIds.length !== externalSourceIds.length) {
      console.warn('Some external source IDs not found in configuration')
    }

    // If department IDs are provided, expand them to include all child departments
    let expandedDepartmentIds: string[] = []
    if (departmentIds.length > 0) {
      const payload = await getPayload({ config })

      for (const deptId of departmentIds) {
        const hierarchyIds = await getDepartmentHierarchy(deptId, payload)
        expandedDepartmentIds.push(...hierarchyIds)
      }

      // Remove duplicates
      expandedDepartmentIds = [...new Set(expandedDepartmentIds)]
    }

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
      departmentIds: expandedDepartmentIds,
      externalSourceIds: validExternalSourceIds,
      history: validatedHistory,
      articleContext: articleContext || null,
    })

    return NextResponse.json({
      response,
      departmentIds: expandedDepartmentIds, // Return expanded IDs for transparency
      externalSourceIds: validExternalSourceIds, // Return validated IDs
    })
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'API configuration error' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your message' },
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
    }))

    return NextResponse.json({
      departments: departmentTree,
      externalSources, // Dynamically from config
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