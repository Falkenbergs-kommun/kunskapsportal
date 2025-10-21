import { GoogleGenAI, FunctionCallingConfigMode, FunctionDeclaration } from '@google/genai'
import { searchKnowledgeBase, type SearchResult } from './qdrantSearch'

// Initialize the GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
})

// Define the knowledge retrieval tool
const searchKnowledgeDeclaration: FunctionDeclaration = {
  name: 'searchKnowledge',
  description: 'Search the knowledge base for relevant information to answer user questions',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find relevant information',
      },
    },
    required: ['query'],
  },
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ArticleContext {
  id: string
  title: string
  slug: string
  content?: any
  summary?: string
}

export interface ChatOptions {
  message: string
  departmentIds?: string[]
  externalSourceIds?: string[]
  history?: ChatMessage[]
  articleContext?: ArticleContext | null
}

// Tool executor function
async function executeSearchKnowledge(
  args: any,
  departmentIds: string[],
  externalSourceIds: string[],
): Promise<string> {
  const searchResults = await searchKnowledgeBase({
    query: args.query,
    departmentIds,
    externalSourceIds,
    limit: 5,
  })

  return formatSearchResults(searchResults)
}

export async function chatWithKnowledge({
  message,
  departmentIds = [],
  externalSourceIds = [],
  history = [],
  articleContext = null,
}: ChatOptions): Promise<string> {
  try {
    // Build source context message for system prompt
    const sourceContext =
      externalSourceIds.length > 0
        ? '\n\nYou have access to both internal documents and external sources. Always cite the source of information in your answers.'
        : ''

    // Adjust system instruction based on whether we have article context
    const systemInstruction = articleContext
      ? `You are a helpful AI assistant discussing a specific article from the Swedish municipal knowledge base.

      You are currently discussing the article titled: "${articleContext.title}"
      ${articleContext.summary ? `Article summary: ${articleContext.summary}` : ''}

      Focus your responses primarily on this specific article's content. When the user asks questions, first answer based on the information in this article.

      IMPORTANT: You have access to the searchKnowledge function to find related information from the broader knowledge base. Use it when:
      1. The user asks about something not fully covered in the current article
      2. The user wants to find similar or related articles
      3. You need additional context or information to provide a complete answer

      BE PERSISTENT: If your first search doesn't yield good results, try again with a modified query:
      - Rephrase the search using synonyms or different keywords
      - Break down complex queries into simpler parts
      - Try broader or narrower search terms
      - Use Swedish terms if you tried English, or vice versa

      When you find relevant articles through search:
      1. Provide direct links using markdown format: [Article Title](Article URL)
      2. Explain how the found articles relate to the current discussion
      3. Guide the user to specific articles that complement the current one
      ${sourceContext}

      Answer in the same language as the user's question (Swedish or English).
      Be helpful and provide clear, structured responses using markdown.`
      : `You are a helpful AI assistant with access to a knowledge base of Swedish municipal documents.

      You are AGENTIC and PERSISTENT. When you need information from the knowledge base:
      1. Use the searchKnowledge function to find relevant information
      2. If the first search doesn't yield good results, DON'T GIVE UP - try again with:
         - Different keywords or synonyms (e.g., "policy" → "riktlinjer", "guidelines" → "riktlinjer")
         - Broader search terms (e.g., "IT-säkerhet" → "säkerhet")
         - Narrower search terms (e.g., "dokument" → "rutiner")
         - Swedish terms if you tried English, or vice versa
         - Breaking down complex queries into simpler parts
      3. You can call searchKnowledge multiple times in a single conversation turn
      4. Try at least 2-3 different search strategies before concluding no information exists

      IMPORTANT: When you find relevant articles:
      1. Provide direct links to the articles using markdown format: [Article Title](Article URL)
      2. Guide the user to the specific article that best answers their question
      3. Explain what they will find in each linked article
      4. Use the complete Article URL from the search results to create working links
      ${sourceContext}

      Answer in the same language as the user's question (Swedish or English).
      Be helpful, persistent, and guide users to find the exact information they need.
      Format your responses with clear structure using markdown.`

    // Build conversation history
    let conversationHistory = ''
    for (const msg of history) {
      if (msg.role === 'user') {
        conversationHistory += `User: ${msg.content}\n`
      } else {
        conversationHistory += `Assistant: ${msg.content}\n`
      }
    }

    // If we have article context, include the article content in the message
    let articleContentText = ''
    if (articleContext && articleContext.content) {
      // Convert rich text content to plain text if needed
      const contentText =
        typeof articleContext.content === 'string'
          ? articleContext.content
          : JSON.stringify(articleContext.content, null, 2)

      articleContentText = `\n\n--- ARTICLE CONTENT ---\nTitle: ${articleContext.title}\n${articleContext.summary ? `Summary: ${articleContext.summary}\n` : ''}Content:\n${contentText.substring(0, 10000)}\n--- END ARTICLE CONTENT ---\n\n`
    }

    const fullMessage = conversationHistory
      ? `${articleContentText}${conversationHistory}\nUser: ${message}`
      : `${articleContentText}User: ${message}`

    // Multi-turn agentic loop: Allow Gemini to call functions multiple times
    let currentContents = fullMessage
    let turnCount = 0
    const maxTurns = 5 // Prevent infinite loops
    const allSearchQueries: string[] = []

    while (turnCount < maxTurns) {
      turnCount++

      console.log(`[Chat Turn ${turnCount}] Generating response...`)

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_FLASH_MODEL || 'gemini-flash-latest',
        contents: currentContents,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 2048,
          tools: [{ functionDeclarations: [searchKnowledgeDeclaration] }],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
        },
      })

      const functionCalls = response.functionCalls

      // If no function call, we have a final response
      if (!functionCalls || functionCalls.length === 0) {
        const finalText = response.text

        if (!finalText || finalText.trim() === '') {
          console.error('[Chat Error] Empty response from Gemini')
          console.error('[Debug Info]', {
            turnCount,
            searchQueries: allSearchQueries,
            messageLength: message.length,
            historyLength: history.length,
            hasArticleContext: !!articleContext,
            departmentFilters: departmentIds.length,
            externalSourceFilters: externalSourceIds.length,
          })

          return `Tyvärr kunde jag inte generera ett svar.

**Debug-information för utvecklare:**
- Antal sök-försök: ${allSearchQueries.length}
- Sökfrågor: ${allSearchQueries.join(', ') || 'Inga sökningar gjordes'}
- Antal chatturneringar: ${turnCount}
- Meddelande-längd: ${message.length} tecken
- Historik: ${history.length} meddelanden
- Artikel-kontext: ${articleContext ? 'Ja' : 'Nej'}
- Avdelningsfilter: ${departmentIds.length}
- Externa källor: ${externalSourceIds.length}

Vänligen rapportera detta fel till utvecklaren.`
        }

        console.log(`[Chat Success] Final response generated after ${turnCount} turns`)
        return finalText
      }

      // Execute function calls
      const functionCall = functionCalls[0]

      if (functionCall.name === 'searchKnowledge' && functionCall.args) {
        const searchQuery = functionCall.args.query as string
        allSearchQueries.push(searchQuery)

        console.log(`[Search ${allSearchQueries.length}] Query: "${searchQuery}"`)

        try {
          const searchResult = await executeSearchKnowledge(
            functionCall.args,
            departmentIds,
            externalSourceIds,
          )

          console.log(`[Search ${allSearchQueries.length}] Results length: ${searchResult.length} chars`)

          // Append search results to conversation and continue
          currentContents = `${currentContents}\n\n[Search ${allSearchQueries.length}] I searched with query "${searchQuery}" and found:\n\n${searchResult}\n\nNow I will use this information to continue...`
        } catch (searchError) {
          console.error(`[Search ${allSearchQueries.length}] Error:`, searchError)

          // Inform Gemini about the search error so it can try a different approach
          currentContents = `${currentContents}\n\n[Search Error] The search with query "${searchQuery}" failed with error: ${searchError instanceof Error ? searchError.message : 'Unknown error'}. Please try a different search query or approach.`
        }
      }
    }

    // If we exhausted max turns
    console.warn('[Chat Warning] Reached maximum turns without final response')
    return `Jag har försökt hitta svar på din fråga men nådde gränsen för antal försök.

**Debug-information för utvecklare:**
- Antal sök-försök: ${allSearchQueries.length}
- Sökfrågor: ${allSearchQueries.join(', ')}
- Max antal turneringar nådda: ${maxTurns}

Detta kan bero på att frågan kräver mer komplex bearbetning. Vänligen rapportera detta till utvecklaren.`
  } catch (error) {
    console.error('[Chat Fatal Error]', error)

    // Provide detailed error info for developers
    const errorDetails = {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      messageLength: message.length,
      historyLength: history.length,
      hasArticleContext: !!articleContext,
      departmentFilters: departmentIds.length,
      externalSourceFilters: externalSourceIds.length,
    }

    console.error('[Error Details]', errorDetails)

    throw new Error(`Chat processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant information found in the knowledge base.'
  }

  return results
    .map((result, index) => {
      const sourceLabel = result.isExternal
        ? `[External Source: ${result.source}]`
        : '[Internal Knowledge Base]'

      return `**Result ${index + 1}:** ${sourceLabel}
Title: ${result.title}
Article URL: ${result.url || 'URL not available'}
${!result.isExternal ? `Article Slug: ${result.slug || 'Slug not available'}` : ''}
${!result.isExternal ? `Department: ${result.department || 'N/A'}` : ''}
Document Type: ${result.documentType || 'N/A'}
Relevance Score: ${result.score.toFixed(2)}

Content excerpt:
${result.text.substring(0, 500)}${result.text.length > 500 ? '...' : ''}
---`
    })
    .join('\n\n')
}
