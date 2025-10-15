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
  history?: ChatMessage[]
  articleContext?: ArticleContext | null
}

// Tool executor function
async function executeSearchKnowledge(args: any, departmentIds: string[]): Promise<string> {
  const searchResults = await searchKnowledgeBase({
    query: args.query,
    departmentIds,
    limit: 5,
  })

  return formatSearchResults(searchResults)
}

export async function chatWithKnowledge({
  message,
  departmentIds = [],
  history = [],
  articleContext = null,
}: ChatOptions): Promise<string> {
  try {
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
      
      When you find relevant articles through search:
      1. Provide direct links using markdown format: [Article Title](Article URL)
      2. Explain how the found articles relate to the current discussion
      3. Guide the user to specific articles that complement the current one
      
      Answer in the same language as the user's question (Swedish or English).
      Be helpful and provide clear, structured responses using markdown.`
      : `You are a helpful AI assistant with access to a knowledge base of Swedish municipal documents. 
      When answering questions, use the searchKnowledge function to find relevant information from the knowledge base.
      Always search for relevant information before providing an answer.
      
      IMPORTANT: When you find relevant articles:
      1. Provide direct links to the articles using markdown format: [Article Title](Article URL)
      2. Guide the user to the specific article that best answers their question
      3. Explain what they will find in each linked article
      4. Use the complete Article URL from the search results to create working links
      
      Answer in the same language as the user's question (Swedish or English).
      Be helpful and guide users to find the exact information they need.
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

    // First, try to generate with tool calling (always provide the search tool)
    const initialResponse = await ai.models.generateContent({
      model: process.env.GEMINI_FLASH_MODEL || 'gemini-flash-latest',
      contents: fullMessage,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 2048,
        // Always provide the search tool, even in article context mode
        tools: [{ functionDeclarations: [searchKnowledgeDeclaration] }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    })

    // Check if the response contains a function call
    const functionCalls = initialResponse.functionCalls

    if (functionCalls && functionCalls.length > 0) {
      // Execute the function call
      const functionCall = functionCalls[0]

      if (functionCall.name === 'searchKnowledge' && functionCall.args) {
        // Execute the search
        const searchResult = await executeSearchKnowledge(functionCall.args, departmentIds)

        // Generate final response with the search results
        const finalResponse = await ai.models.generateContent({
          model: process.env.GEMINI_FLASH_MODEL || 'gemini-flash-latest',
          contents: `${fullMessage}\n\nI searched the knowledge base with query "${functionCall.args.query}" and found:\n\n${searchResult}\n\nBased on this information, here is my answer:`,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        })

        return finalResponse.text || 'I apologize, but I was unable to generate a response.'
      }
    }

    // Return the direct response if no function was called
    return initialResponse.text || 'I apologize, but I was unable to generate a response.'
  } catch (error) {
    console.error('Error in chat with knowledge:', error)
    throw new Error('Failed to process chat message')
  }
}

function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant information found in the knowledge base.'
  }

  return results
    .map((result, index) => {
      return `**Result ${index + 1}:**
Title: ${result.title}
Article URL: ${result.url || 'URL not available'}
Article Slug: ${result.slug || 'Slug not available'}
Department: ${result.department || 'N/A'}
Document Type: ${result.documentType || 'N/A'}
Relevance Score: ${result.score.toFixed(2)}

Content excerpt:
${result.text.substring(0, 500)}${result.text.length > 500 ? '...' : ''}
---`
    })
    .join('\n\n')
}
