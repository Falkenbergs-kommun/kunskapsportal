export interface SourceMetadata {
  type: 'internal' | 'external' | 'google'
  title: string
  url: string
  // Optional metadata
  source?: string              // External source ID (e.g., "svensk-lag")
  sourceLabel?: string         // External source display name
  sourceIcon?: string
  sourceColor?: string
  department?: string | null   // Internal only
  documentType?: string | null
  isSubSource?: boolean        // True if external hierarchical sub-source
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

export interface ChatResponse {
  response: string
  sources: SourceMetadata[]
}
