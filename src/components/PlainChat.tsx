'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ArrowUpIcon, MessageSquarePlusIcon, SettingsIcon, XIcon, FileTextIcon } from 'lucide-react'
import { useSidebar } from './ui/sidebar-chat'
import { Avatar, AvatarFallback } from './ui/avatar'
import { KnowledgeSourceFilter, getFilterButtonText } from './KnowledgeSourceFilter'
import { MarkdownMessage } from './MarkdownMessage'
import { usePersistedState } from '@/hooks/usePersistedState'
import type { SourceMetadata } from '@/types/chat'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from './ui/dropdown-menu'

interface Message {
  id: number
  sender: 'user' | 'agent'
  text: string
  sources?: SourceMetadata[]
}

interface ArticleContext {
  id: string
  title: string
  slug: string
  content?: any
  summary?: string
}

export function PlainChat({ isExpanded, setIsExpanded }: { isExpanded: boolean; setIsExpanded: (value: boolean) => void }) {
  const initialMessage: Message = {
    id: 1,
    sender: 'agent',
    text: 'Hej! Jag är din AI-assistent med tillgång till kommunens kunskapsdatabas. Hur kan jag hjälpa dig idag?',
  }

  const [messages, setMessages, messagesLoading] = usePersistedState<Message[]>(
    'chat_messages',
    [initialMessage]
  )
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDepartments, setSelectedDepartments] = usePersistedState<string[]>(
    'chat_selected_departments',
    []
  )
  const [selectedExternalSources, setSelectedExternalSources] = usePersistedState<string[]>(
    'chat_selected_external_sources',
    []
  )
  const [useGoogleGrounding, setUseGoogleGrounding] = usePersistedState<boolean>(
    'chat_use_google_grounding',
    false
  )
  const [articleContext, setArticleContext] = usePersistedState<ArticleContext | null>(
    'chat_article_context',
    null
  )
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([])
  const [availableExternalSources, setAvailableExternalSources] = useState<any[]>([])
  const [geminiGroundingEnabled, setGeminiGroundingEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const { open, setOpen } = useSidebar()

  // Focus the input when the sidebar opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure the sidebar has rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Focus the input when the dialog expands
  useEffect(() => {
    if (isExpanded) {
      // Small delay to ensure the dialog has rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isExpanded])

  // Auto-focus input after receiving a response
  useEffect(() => {
    if (!isLoading && messages.length > 1) {
      // Small delay to ensure the UI has updated
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isLoading, messages.length])

  // Fetch available departments, external sources, and check Google Grounding availability
  useEffect(() => {
    const fetchAvailableSources = async () => {
      try {
        const response = await fetch('/api/chat')
        if (response.ok) {
          const data = await response.json()
          setAvailableDepartments(data.departments || [])
          setAvailableExternalSources(data.externalSources || [])
          setGeminiGroundingEnabled(data.geminiGroundingEnabled || false)

          // Validate and clean up selected departments
          const validDeptIds = getAllDepartmentIds(data.departments || [])
          const validSelectedDepts = selectedDepartments.filter((id) => validDeptIds.includes(id))
          if (validSelectedDepts.length !== selectedDepartments.length) {
            setSelectedDepartments(validSelectedDepts)
          }

          // Validate and clean up selected external sources (including sub-sources with dot notation)
          // IMPORTANT: Filter out "google" - it's not an external source, it's handled by useGoogleGrounding
          const validSourceIds = (data.externalSources || []).map((s: any) => s.id)

          // Build list of valid IDs including parent.child patterns
          const validIds = new Set(validSourceIds)
          for (const source of (data.externalSources || [])) {
            if (source.subSources) {
              for (const subSource of source.subSources) {
                validIds.add(`${source.id}.${subSource.id}`)
              }
            }
          }

          const validSelectedSources = selectedExternalSources
            .filter((id) => id !== 'google') // Remove legacy "google" entries
            .filter((id) => validIds.has(id))
          if (validSelectedSources.length !== selectedExternalSources.length) {
            setSelectedExternalSources(validSelectedSources)
          }
        }
      } catch (error) {
        console.error('Failed to fetch available sources:', error)
      }
    }

    fetchAvailableSources()
  }, [])

  // Helper to get all department IDs from tree
  const getAllDepartmentIds = (departments: any[]): string[] => {
    const ids: string[] = []
    const traverse = (dept: any) => {
      ids.push(dept.id.toString())
      if (dept.children) {
        dept.children.forEach(traverse)
      }
    }
    departments.forEach(traverse)
    return ids
  }

  // Listen for article context events
  useEffect(() => {
    const handleArticleContext = (event: CustomEvent) => {
      const article = event.detail
      setArticleContext({
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        summary: article.summary,
      })
      // Open the chat sidebar
      setOpen(true)
      // Focus input after a short delay
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }

    window.addEventListener('chat-with-article' as any, handleArticleContext)
    return () => {
      window.removeEventListener('chat-with-article' as any, handleArticleContext)
    }
  }, [setArticleContext, setOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleClearChat = () => {
    setMessages([initialMessage])
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: trimmedInput,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Prepare chat history (exclude the current message)
      const history = messages
        .filter(msg => msg.id !== 1) // Exclude the initial greeting
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant' as const,
          content: msg.text,
        }))

      // Call the chat API (external sources now include sub-sources with dot notation like "svensk-lag.pbl")
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          departmentIds: selectedDepartments,
          externalSourceIds: selectedExternalSources,
          useGoogleGrounding,
          history,
          articleContext: articleContext ? {
            id: articleContext.id,
            title: articleContext.title,
            slug: articleContext.slug,
            content: articleContext.content,
            summary: articleContext.summary,
          } : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Format error with debug info if available
        let formattedError = errorData.error || 'Ett fel uppstod'

        if (errorData.debugInfo) {
          formattedError += '\n\n**Debug-information för utvecklare:**\n'

          if (errorData.debugInfo.errorType) {
            formattedError += `- Feltyp: \`${errorData.debugInfo.errorType}\`\n`
          }
          if (errorData.debugInfo.errorMessage) {
            formattedError += `- Meddelande: ${errorData.debugInfo.errorMessage}\n`
          }
          if (errorData.debugInfo.errorStack) {
            formattedError += `- Stack:\n\`\`\`\n${errorData.debugInfo.errorStack}\n\`\`\`\n`
          }
          if (errorData.debugInfo.timestamp) {
            formattedError += `- Tidpunkt: ${errorData.debugInfo.timestamp}\n`
          }
          if (errorData.debugInfo.requestInfo) {
            formattedError += `- Request:\n\`\`\`json\n${JSON.stringify(errorData.debugInfo.requestInfo, null, 2)}\n\`\`\`\n`
          }
        }

        throw new Error(formattedError)
      }

      const data = await response.json()

      const agentMessage: Message = {
        id: Date.now() + 1,
        sender: 'agent',
        text: data.response,
        sources: data.sources || []
      }
      setMessages((prev) => [...prev, agentMessage])
    } catch (error) {
      console.error('Chat error:', error)

      const errorText = error instanceof Error
        ? error.message
        : 'Tyvärr uppstod ett fel när jag försökte svara på din fråga. Vänligen försök igen.'

      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'agent',
        text: errorText,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Render message using the original layout style
  const renderMessage = (msg: Message) => {
    const isUser = msg.sender === 'user'

    if (isUser) {
      return (
        <div key={msg.id} className="flex mb-4 items-start">
          <Avatar className="mr-3 h-7 w-7 mt-0.5 flex-shrink-0">
            <AvatarFallback className="bg-black text-white text-xs font-semibold">DU</AvatarFallback>
          </Avatar>
          <div className="bg-gray-100 py-2 px-3 rounded-lg max-w-[85%]">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
          </div>
        </div>
      )
    }

    // Agent message with markdown support
    return (
      <div key={msg.id} className="flex flex-col mb-5 items-start w-full">
        <div className="py-2 px-3 max-w-[95%]">
          <MarkdownMessage
            content={msg.text}
            sources={msg.sources}
          />
        </div>
      </div>
    )
  }

  const clearArticleContext = () => {
    setArticleContext(null)
    // Optionally reset messages when clearing context
    // setMessages([initialMessage])
  }

  // Render chat content (reusable for both sidebar and dialog)
  const renderChatContent = () => (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Article Context Indicator */}
      {articleContext && (
        <div className="p-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileTextIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-blue-900 truncate">
              Chattar om: <strong>{articleContext.title}</strong>
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearArticleContext}
            className="text-blue-600 hover:text-blue-800 flex-shrink-0"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message Display Area */}
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="flex flex-col mb-5 items-start w-full">
            <div className="py-2 px-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <SettingsIcon className="h-4 w-4 mr-1" />
                {getFilterButtonText(selectedDepartments, selectedExternalSources, useGoogleGrounding)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="min-w-80 max-w-lg max-h-[600px] overflow-y-auto p-3">
              <KnowledgeSourceFilter
                selectedDepartments={selectedDepartments}
                onDepartmentChange={setSelectedDepartments}
                selectedExternalSources={selectedExternalSources}
                onExternalSourceChange={setSelectedExternalSources}
                useGoogleGrounding={useGoogleGrounding}
                onGoogleGroundingChange={setUseGoogleGrounding}
                geminiGroundingEnabled={geminiGroundingEnabled}
              />
            </DropdownMenuContent>
          </DropdownMenu>
          {messages.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-gray-500 hover:text-gray-700"
              title="Ny chatt"
            >
              <MessageSquarePlusIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        <form
          onSubmit={handleSendMessage}
          className="bg-white p-1.5 rounded-xl border border-gray-300 flex items-end space-x-1.5"
        >
          <Textarea
            ref={inputRef}
            placeholder={
              articleContext
                ? `Ställ en fråga om "${articleContext.title}"...`
                : selectedExternalSources.length > 0
                  ? "Sök i kunskapsbasen och externa källor..."
                  : "Ställ en fråga om kommunens dokument..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
            className="flex-grow text-sm resize-none border-none focus:ring-0 p-2 min-h-[38px] max-h-[120px] bg-transparent"
            rows={3}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-8 w-8 bg-black hover:bg-gray-800 text-white rounded-md disabled:bg-gray-200"
            aria-label="Send message"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Sidebar chat */}
      <div className="relative h-full">
        {renderChatContent()}
      </div>

      {/* Expanded dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 rounded-none flex flex-col overflow-hidden data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full">
          <DialogTitle className="px-6 py-4 border-b flex-shrink-0">AI Assistant</DialogTitle>

          {/* Article Context in dialog */}
          {articleContext && (
            <div className="p-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileTextIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-blue-900 truncate">
                  Chattar om: <strong>{articleContext.title}</strong>
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearArticleContext}
                className="text-blue-600 hover:text-blue-800 flex-shrink-0"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {messages.map(renderMessage)}
            {isLoading && (
              <div className="flex flex-col mb-5 items-start w-full">
                <div className="py-2 px-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <SettingsIcon className="h-4 w-4 mr-1" />
                    {getFilterButtonText(selectedDepartments, selectedExternalSources, useGoogleGrounding)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="min-w-80 max-w-lg max-h-[600px] overflow-y-auto p-3">
                  <KnowledgeSourceFilter
                    selectedDepartments={selectedDepartments}
                    onDepartmentChange={setSelectedDepartments}
                    selectedExternalSources={selectedExternalSources}
                    onExternalSourceChange={setSelectedExternalSources}
                    useGoogleGrounding={useGoogleGrounding}
                    onGoogleGroundingChange={setUseGoogleGrounding}
                    geminiGroundingEnabled={geminiGroundingEnabled}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
              {messages.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  className="text-gray-500 hover:text-gray-700"
                  title="Ny chatt"
                >
                  <MessageSquarePlusIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            <form
              onSubmit={handleSendMessage}
              className="bg-white p-1.5 rounded-xl border border-gray-300 flex items-end space-x-1.5"
            >
              <Textarea
                ref={inputRef}
                placeholder={
                  articleContext
                    ? `Ställ en fråga om "${articleContext.title}"...`
                    : selectedExternalSources.length > 0
                      ? "Sök i kunskapsbasen och externa källor..."
                      : "Ställ en fråga om kommunens dokument..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                className="flex-grow text-sm resize-none border-none focus:ring-0 p-2 min-h-[38px] max-h-[120px] bg-transparent"
                rows={3}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 bg-black hover:bg-gray-800 text-white rounded-md disabled:bg-gray-200"
                aria-label="Send message"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}