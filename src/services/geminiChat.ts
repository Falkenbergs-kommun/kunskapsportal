import { GoogleGenAI, FunctionCallingConfigMode, FunctionDeclaration } from '@google/genai'
import { searchKnowledgeBase, type SearchResult } from './qdrantSearch'
import { getExternalSources, type ExternalSourceConfig } from '@/config/externalSources'
import type { ChatMessage, ArticleContext, ChatResponse, SourceMetadata } from '@/types/chat'

// Initialize the GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
})

// Define the knowledge retrieval tool
const searchKnowledgeDeclaration: FunctionDeclaration = {
  name: 'searchKnowledge',
  description: 'Search all available knowledge sources (internal documents and external sources based on user filters) and get top results from each source',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find relevant information across all sources',
      },
    },
    required: ['query'],
  },
}

export interface ChatOptions {
  message: string
  departmentIds?: string[]
  externalSourceIds?: string[]
  useGoogleGrounding?: boolean
  history?: ChatMessage[]
  articleContext?: ArticleContext | null
}

// Tool executor function - searches all filtered sources
async function executeSearchKnowledge(
  args: any,
  departmentIds: string[],
  externalSourceIds: string[],
): Promise<{ formattedResults: string; sources: SearchResult[] }> {
  const searchResults = await searchKnowledgeBase({
    query: args.query,
    departmentIds,
    externalSourceIds,
    limit: 10, // Get more results per source, let AI choose best ones
  })

  return {
    formattedResults: formatSearchResults(searchResults),
    sources: searchResults,
  }
}

/**
 * Convert SearchResult[] to SourceMetadata[] for frontend display
 */
function convertSearchResultsToMetadata(
  searchResults: SearchResult[],
  externalSourceConfigs: ExternalSourceConfig[]
): SourceMetadata[] {
  const uniqueUrls = new Set<string>()
  const metadata: SourceMetadata[] = []

  for (const result of searchResults) {
    // Deduplicate by URL
    if (uniqueUrls.has(result.url)) continue
    uniqueUrls.add(result.url)

    if (result.isExternal) {
      // Find source config for label/icon/color
      const sourceConfig = externalSourceConfigs.find(s => s.id === result.source)

      // Check if this is a hierarchical sub-source (source contains ".")
      const isSubSource = result.source.includes('.')

      metadata.push({
        type: 'external',
        title: result.title,
        url: result.url,
        source: result.source,
        sourceLabel: sourceConfig?.label || result.source,
        sourceIcon: sourceConfig?.icon,
        sourceColor: sourceConfig?.color,
        documentType: result.documentType,
        isSubSource
      })
    } else {
      metadata.push({
        type: 'internal',
        title: result.title,
        url: result.url,
        department: result.department,
        documentType: result.documentType
      })
    }
  }

  return metadata
}

export async function chatWithKnowledge({
  message,
  departmentIds = [],
  externalSourceIds = [],
  useGoogleGrounding = false,
  history = [],
  articleContext = null,
}: ChatOptions): Promise<ChatResponse> {
  try {
    // Check if Google Grounding is enabled (need this early for system instructions)
    const geminiGroundingEnabled = process.env.GEMINI_GROUNDING_ENABLED === 'true'
    const useGrounding = geminiGroundingEnabled && useGoogleGrounding

    // Check if we have any knowledge base sources selected (internal or external Qdrant)
    // Knowledge base sources = departments OR external sources OR article context
    const hasKnowledgeBaseSources = departmentIds.length > 0 || externalSourceIds.length > 0 || articleContext !== null

    // Build source context message for system prompt
    const sourceContext =
      externalSourceIds.length > 0
        ? '\n\nYou have access to both internal documents and external sources. Always cite the source of information in your answers.'
        : ''

    // Get custom Google Search context string (e.g., "falkenbergs kommun")
    const googleSearchContextString = process.env.GEMINI_GROUNDING_CONTEXT || ''

    // Add Google Search context if enabled
    const googleSearchContext = useGrounding
      ? `\n\nYou also have access to Google Search for real-time web information. ${googleSearchContextString ? `When searching, add the context "${googleSearchContextString}" to queries when relevant to get more localized results. ` : ''}Use it to ${hasKnowledgeBaseSources ? 'supplement knowledge base answers with' : 'find'} current information, news, or data${hasKnowledgeBaseSources ? ' not available in the internal documents' : ''}.`
      : ''

    // Adjust system instruction based on whether we have article context
    let systemInstruction: string

    if (articleContext) {
      systemInstruction = `You are a helpful AI assistant discussing a specific article from the Swedish municipal knowledge base.

      You are currently discussing the article titled: "${articleContext.title}"
      ${articleContext.summary ? `Article summary: ${articleContext.summary}` : ''}

      Focus your responses primarily on this specific article's content. When the user asks questions, first answer based on the information in this article.

      IMPORTANT: You have access to the searchKnowledge function to find related information. Use it when:
      1. The user asks about something not fully covered in the current article
      2. The user wants to find similar or related articles
      3. You need additional context or information to provide a complete answer

      The search returns results from ALL available sources. You will receive multiple results - review them all and select the most relevant ones to answer the question.

      BE PERSISTENT: If your first search doesn't yield good results, try ONE more time with:
      - Modified query with synonyms or different keywords
      - Broader or narrower search terms
      - Maximum 2 searches per conversation to keep response time reasonable

      CITATIONS - CRITICAL RULES:
      1. When you reference information from search results, you MUST use the exact URL shown in "IMPORTANT - USE THIS EXACT URL FOR CITATIONS:"
      2. Cite sources INLINE within your response text using markdown links: [Article Title](EXACT_URL)
      3. DO NOT add a "Källor:" section at the end - sources will be displayed automatically
      4. NEVER invent or guess URLs - only use URLs explicitly shown in the search results
      5. If you don't have a URL from search results, don't create a link
      6. Copy and paste the exact URL - it looks like: http://localhost:3000/article/slug or https://example.com/page
      ${sourceContext}${googleSearchContext}

      Answer in the same language as the user's question (Swedish or English).
      Be helpful and provide clear, structured responses using markdown with inline citations.`
    } else {
      systemInstruction = `You are a helpful AI assistant with access to a knowledge base of Swedish municipal documents.

      You have access to the searchKnowledge function that searches ALL available sources based on user filters:
      - Internal municipal documents (if departments are selected)
      - External sources like falkenberg.se, intranet, Swedish law (if external sources are selected)

      The search returns results from ALL filtered sources. You will receive multiple results from different sources - carefully review ALL results and select the most relevant ones to answer the question.

      IMPORTANT BALANCE RULE: When you receive results from BOTH internal documents AND external sources:
      - Always include information from BOTH types if they are relevant
      - Internal documents contain official policies and procedures that may be important even if external sources are more detailed
      - External sources provide public-facing information that may be easier to understand
      - Combine insights from both when possible to give a complete answer

      You are AGENTIC and PERSISTENT:
      1. Use searchKnowledge to find relevant information
      2. If the first search doesn't yield good results, try ONE more time with:
         - Different keywords or synonyms
         - Broader or narrower search terms
         - Swedish terms if you tried English, or vice versa
      3. Maximum 2 searches per conversation turn to keep response time reasonable
      4. After reviewing results, provide the best answer using information from ALL relevant source types

      CITATIONS - CRITICAL RULES:
      1. When you reference information from search results, you MUST use the exact URL shown in "IMPORTANT - USE THIS EXACT URL FOR CITATIONS:"
      2. Cite sources INLINE within your response text using markdown links: [Article Title](EXACT_URL)
      3. DO NOT add a "Källor:" section at the end - sources will be displayed automatically
      4. NEVER invent or guess URLs - only use URLs explicitly shown in the search results
      5. If you don't have a URL from search results, don't create a link
      6. Copy and paste the exact URL - it looks like: http://localhost:3000/article/slug or https://example.com/page
      ${sourceContext}${googleSearchContext}

      Answer in the same language as the user's question (Swedish or English).
      Be helpful, persistent, and cite your sources inline with clickable links.
      Format your responses with clear structure using markdown.`
    }

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

    // Multi-turn approach: Knowledge base search first, then optionally Google Search
    // This is needed because Gemini 2.x doesn't support both tools in same request
    const model = process.env.GEMINI_FLASH_MODEL || 'gemini-flash-latest'

    let currentContents = fullMessage
    let turnCount = 0
    const maxTurns = 2  // Limit to 2 searches to keep response time reasonable
    const allSearchQueries: string[] = []
    const allSources: SearchResult[] = []
    let knowledgeBaseResults = ''
    let usedGoogleSearch = false

    // Phase 1: Knowledge base search with function calling (only if we have knowledge base sources)
    if (hasKnowledgeBaseSources) {
      console.log('[Chat Phase 1] Searching knowledge base with function calling...')

      while (turnCount < maxTurns) {
        turnCount++
        console.log(`[Chat Turn ${turnCount}] Generating response...`)

        const response = await ai.models.generateContent({
          model,
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

        // If no function call, we have a response
        if (!functionCalls || functionCalls.length === 0) {
          let initialResponse = response.text

          // Debug empty responses
          if (!initialResponse || initialResponse.trim() === '') {
            console.error('[Chat Error] Empty response from Gemini')
            console.error('[Chat Debug] Response has text:', !!response.text)
            console.error('[Chat Debug] Turn count:', turnCount)

            // Try to continue if we're in early turns
            if (turnCount === 1) {
              console.log('[Chat] Retrying with simpler prompt...')
              currentContents = `${fullMessage}\n\nPlease search the knowledge base to answer this question.`
              continue
            }

            return {
              response: `Tyvärr kunde jag inte generera ett svar. Vänligen försök igen.`,
              sources: []
            }
          }

          console.log(`[Chat Phase 1 Complete] Knowledge base search finished after ${turnCount} turns`)
          knowledgeBaseResults = initialResponse
          break
        }

        // Execute function call
        const functionCall = functionCalls[0]

        if (functionCall.name === 'searchKnowledge' && functionCall.args) {
          const searchQuery = functionCall.args.query as string
          allSearchQueries.push(searchQuery)

          console.log(`[Knowledge Search ${allSearchQueries.length}] Query: "${searchQuery}"`)

          try {
            const { formattedResults, sources } = await executeSearchKnowledge(
              functionCall.args,
              departmentIds,
              externalSourceIds,
            )

            // Collect unique sources
            sources.forEach(source => {
              if (!allSources.some(s => s.url === source.url)) {
                allSources.push(source)
              }
            })

            console.log(`[Knowledge Search ${allSearchQueries.length}] Results: ${formattedResults.length} chars, ${sources.length} sources from all filtered sources`)

            // Count internal vs external results
            const internalCount = sources.filter(s => !s.isExternal).length
            const externalCount = sources.filter(s => s.isExternal).length

            const sourceBreakdown = `Found ${sources.length} total results: ${internalCount} from internal documents, ${externalCount} from external sources.`

            currentContents = `${currentContents}\n\n[Search ${allSearchQueries.length}] I searched all available sources with query "${searchQuery}".

${sourceBreakdown}

${formattedResults}

IMPORTANT: Review ALL results above. If you have results from BOTH internal and external sources, make sure to include relevant information from BOTH types in your answer. Don't favor external sources just because they are more detailed.`
          } catch (searchError) {
            console.error(`[Knowledge Search ${allSearchQueries.length}] Error:`, searchError)
            currentContents = `${currentContents}\n\n[Search Error] Knowledge base search failed: ${searchError instanceof Error ? searchError.message : 'Unknown error'}. Try a different approach.`
          }
        }
      }

      // If we hit max turns without getting a response, force a final answer
      if (!knowledgeBaseResults && turnCount >= maxTurns) {
        console.log('[Chat Warning] Reached maximum turns without response, forcing final answer...')

        const finalResponse = await ai.models.generateContent({
          model,
          contents: `${currentContents}\n\nBased on the search results above, please provide a comprehensive answer to the user's question. Include relevant citations.`,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        })

        knowledgeBaseResults = finalResponse.text || 'Tyvärr kunde jag inte generera ett svar. Vänligen försök igen.'
      }
    } else {
      console.log('[Chat Phase 1 Skipped] No knowledge base sources selected (only Google Search available)')
    }

    // Prepare source metadata from knowledge base sources
    const externalSourceConfigs = getExternalSources()
    let sourceMetadata: SourceMetadata[] = convertSearchResultsToMetadata(allSources, externalSourceConfigs)

    // Track Google sources separately
    let googleSources: SourceMetadata[] = []

    // Phase 2: Google Search
    if (useGrounding) {
      console.log('[Chat Phase 2] Using Google Search...')

      try {
        // Include conversation history in Google Search phase
        const googlePrompt = knowledgeBaseResults
          ? `${conversationHistory ? `${conversationHistory}\n\n` : ''}Based on this initial answer from our knowledge base:\n\n${knowledgeBaseResults}\n\nUser: ${message}\n\nEnhance this answer with current information from Google Search if relevant. Consider the conversation context. If the knowledge base answer is complete, just return it as-is.`
          : `${conversationHistory ? `${conversationHistory}\n\n` : ''}User: ${message}\n\nAnswer this question using Google Search to find current information. Consider the full conversation context.`

        const googleSystemInstruction = knowledgeBaseResults
          ? `You enhance knowledge base answers with current web information when relevant. ${googleSearchContextString ? `Add "${googleSearchContextString}" to search queries when contextually appropriate. ` : ''}Only add Google Search results if they provide valuable updates or context. Citations will be added automatically.`
          : `You answer questions using Google Search for current web information. ${googleSearchContextString ? `Add "${googleSearchContextString}" to search queries when contextually appropriate. ` : ''}Provide clear, well-structured answers. Citations will be added automatically.`

        console.log('[Google Search] Calling with model:', model)
        console.log('[Google Search] Google Search tool config:', JSON.stringify({ googleSearch: {} }))

        const groundingResponse = await ai.models.generateContent({
          model,
          contents: googlePrompt,
          config: {
            systemInstruction: googleSystemInstruction,
            temperature: 0.7,
            maxOutputTokens: 2048,
            tools: [{ googleSearch: {} }],
          },
        })

        console.log('[Google Search] Response received, has text:', !!groundingResponse.text)

        let enhancedText = groundingResponse.text

        // Extract and insert Google Search citations inline
        try {
          // Grounding metadata might be in candidates[0].groundingMetadata
          let groundingMetadata = (groundingResponse as any).groundingMetadata

          if (!groundingMetadata && groundingResponse.candidates?.[0]) {
            groundingMetadata = groundingResponse.candidates[0].groundingMetadata
            console.log('[Google Search] Found metadata in candidates[0]')
          }

          if (!groundingMetadata) {
            console.log('[Google Search] No grounding metadata in response')
            console.log('[Google Search] Response keys:', Object.keys(groundingResponse))
            console.log('[Google Search] First candidate keys:', groundingResponse.candidates?.[0] ? Object.keys(groundingResponse.candidates[0]) : 'No candidates')
          } else {
            console.log('[Google Search] Metadata keys:', Object.keys(groundingMetadata))

            const groundingChunks = groundingMetadata.groundingChunks || []
            const groundingSupports = groundingMetadata.groundingSupports || []

            console.log(`[Google Search] Found ${groundingChunks.length} chunks, ${groundingSupports.length} supports`)

            // Log chunk details
            if (groundingChunks.length > 0) {
              console.log('[Google Search] First chunk:', JSON.stringify(groundingChunks[0], null, 2))
            }
            if (groundingSupports.length > 0) {
              console.log('[Google Search] First support:', JSON.stringify(groundingSupports[0], null, 2))
            }

            if (groundingSupports.length > 0 && groundingChunks.length > 0) {
              // Collect unique sources for footer
              const uniqueSources = new Map<string, { title: string; uri: string }>()

              for (const support of groundingSupports) {
                if (support.groundingChunkIndices?.length > 0) {
                  for (const chunkIndex of support.groundingChunkIndices) {
                    const chunk = groundingChunks[chunkIndex]
                    if (chunk?.web?.uri && !uniqueSources.has(chunk.web.uri)) {
                      uniqueSources.set(chunk.web.uri, {
                        title: chunk.web.title || 'Källa',
                        uri: chunk.web.uri
                      })
                    }
                  }
                }
              }

              // Collect Google sources for metadata (no longer adding to text)
              if (uniqueSources.size > 0) {
                googleSources = Array.from(uniqueSources.values()).map(source => ({
                  type: 'google' as const,
                  title: source.title,
                  url: source.uri
                }))
                console.log('[Google Search] Collected', uniqueSources.size, 'sources for metadata')
              }
            } else {
              console.log('[Google Search] No supports or chunks to process')
            }
          }
        } catch (extractError) {
          console.error('[Google Search] Error processing citations:', extractError)
        }

        if (enhancedText && enhancedText.trim()) {
          console.log('[Chat Phase 2 Complete] Answer generated with Google Search')
          usedGoogleSearch = true
          return {
            response: enhancedText,
            sources: [...sourceMetadata, ...googleSources]
          }
        }
      } catch (groundingError) {
        console.error('[Chat Phase 2 Error]', groundingError)
        // Fall back to knowledge base results if available
      }
    }

    // Return knowledge base results (sources should be cited inline by AI)
    if (knowledgeBaseResults) {
      return {
        response: knowledgeBaseResults,
        sources: sourceMetadata
      }
    }

    // If we only tried Google Search but it failed, and no knowledge base sources
    if (!hasKnowledgeBaseSources && useGrounding) {
      console.error('[Chat Error] Google Search failed and no knowledge base sources available')
      return {
        response: `Tyvärr kunde jag inte generera ett svar med Google Search. Vänligen försök igen.`,
        sources: []
      }
    }

    // If we exhausted turns without getting results
    console.warn('[Chat Warning] Reached maximum turns without response')
    return {
      response: `Jag har försökt hitta svar på din fråga men nådde gränsen för antal försök. Vänligen försök igen med en omformulerad fråga.`,
      sources: []
    }
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

  // Get base URL for internal links
  const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL || process.env.PAYLOAD_URL || ''

  return results
    .map((result, index) => {
      const sourceLabel = result.isExternal
        ? `[External Source: ${result.source}]`
        : '[Internal Knowledge Base]'

      // For internal sources with relative URLs, prepend base URL
      let fullUrl = result.url || 'URL not available'
      if (!result.isExternal && fullUrl && fullUrl.startsWith('/') && baseUrl) {
        fullUrl = `${baseUrl}${fullUrl}`
      }

      return `**Result ${index + 1}:** ${sourceLabel}
Title: ${result.title}

IMPORTANT - USE THIS EXACT URL FOR CITATIONS: ${fullUrl}

${!result.isExternal ? `Department: ${result.department || 'N/A'}` : ''}
Document Type: ${result.documentType || 'N/A'}
Relevance Score: ${result.score.toFixed(2)}

Content excerpt:
${result.text.substring(0, 500)}${result.text.length > 500 ? '...' : ''}

REMEMBER: When citing this source, use the exact URL shown above!
---`
    })
    .join('\n\n')
}

// formatSourcesCitation removed - sources are now cited inline by the AI model
