'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ArrowUpIcon, MessageSquarePlusIcon, SettingsIcon, XIcon, FileTextIcon } from 'lucide-react'
import { useSidebar } from './ui/sidebar-chat'
import { Avatar, AvatarFallback } from './ui/avatar'
import { DepartmentSelector } from './DepartmentSelector'
import { ExternalSourceSelector } from './ExternalSourceSelector'
import { MarkdownMessage } from './MarkdownMessage'
import { usePersistedState } from '@/hooks/usePersistedState'

interface Message {
  id: number
  sender: 'user' | 'agent'
  text: string
}

interface ArticleContext {
  id: string
  title: string
  slug: string
  content?: any
  summary?: string
}

export function PlainChat() {
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
  const [selectedSubSources, setSelectedSubSources] = usePersistedState<Record<string, string[]>>(
    'chat_selected_sub_sources',
    {}
  )
  const [useGoogleGrounding, setUseGoogleGrounding] = usePersistedState<boolean>(
    'chat_use_google_grounding',
    false
  )
  const [articleContext, setArticleContext] = usePersistedState<ArticleContext | null>(
    'chat_article_context',
    null
  )
  const [showSettings, setShowSettings] = useState(false)
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([])
  const [availableExternalSources, setAvailableExternalSources] = useState<any[]>([])
  const [geminiGroundingEnabled, setGeminiGroundingEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const { open, setOpen } = useSidebar()

  // Focus the input when the sidebar opens
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

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

          // Validate and clean up selected external sources
          // IMPORTANT: Filter out "google" - it's not an external source, it's handled by useGoogleGrounding
          const validSourceIds = (data.externalSources || []).map((s: any) => s.id)
          const validSelectedSources = selectedExternalSources
            .filter((id) => id !== 'google') // Remove legacy "google" entries
            .filter((id) => validSourceIds.includes(id))
          if (validSelectedSources.length !== selectedExternalSources.length) {
            setSelectedExternalSources(validSelectedSources)
          }

          // Validate and clean up selected sub-sources
          const newSelectedSubSources: Record<string, string[]> = {}
          for (const [sourceId, subIds] of Object.entries(selectedSubSources)) {
            const source = (data.externalSources || []).find((s: any) => s.id === sourceId)
            if (source && source.subSources) {
              const validSubIds = source.subSources.map((sub: any) => sub.id)
              const validSubs = subIds.filter((id) => validSubIds.includes(id))
              if (validSubs.length > 0) {
                newSelectedSubSources[sourceId] = validSubs
              }
            }
          }
          if (JSON.stringify(newSelectedSubSources) !== JSON.stringify(selectedSubSources)) {
            setSelectedSubSources(newSelectedSubSources)
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

      // Include parent source IDs if they have sub-sources selected (even if parent not explicitly checked)
      const sourcesWithSubSelections = Object.keys(selectedSubSources).filter(
        sourceId => selectedSubSources[sourceId].length > 0
      )
      const allExternalSourceIds = Array.from(new Set([
        ...selectedExternalSources,
        ...sourcesWithSubSelections
      ]))

      // Call the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          departmentIds: selectedDepartments,
          externalSourceIds: allExternalSourceIds,
          subSourceFilters: selectedSubSources,
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
            className="text-sm whitespace-pre-wrap break-words leading-relaxed"
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

  return (
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

      {/* Settings/Department Filter Section */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 space-y-2">
          <div className="mb-2">
            <span className="text-xs font-semibold text-gray-600">Kunskapskällor</span>
          </div>
          <DepartmentSelector
            selectedDepartments={selectedDepartments}
            onSelectionChange={setSelectedDepartments}
          />
          <ExternalSourceSelector
            selectedSources={selectedExternalSources}
            selectedSubSources={selectedSubSources}
            onSelectionChange={setSelectedExternalSources}
            onSubSourceSelectionChange={(sourceId, subSources) => {
              setSelectedSubSources((prev) => ({
                ...prev,
                [sourceId]: subSources,
              }))
            }}
          />

          {/* Google Grounding Toggle */}
          {geminiGroundingEnabled && (
            <div className="border rounded-lg p-2 bg-white mt-2">
              <label className="flex items-center py-1 px-2 cursor-pointer hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={useGoogleGrounding}
                  onChange={(e) => setUseGoogleGrounding(e.target.checked)}
                  className="mr-2 h-3 w-3"
                />
                <span className="mr-2">🔍</span>
                <span className="text-sm">Google Search</span>
              </label>
            </div>
          )}
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-700"
          >
            <SettingsIcon className="h-4 w-4 mr-1" />
            {(() => {
              // Count sources: departments + external sources (parent-level) + hierarchical sources with sub-selections
              const sourcesWithSubSources = Object.keys(selectedSubSources).filter(
                sourceId => {
                  // Only count if this source has sub-sources selected AND parent isn't already counted
                  return selectedSubSources[sourceId].length > 0 && !selectedExternalSources.includes(sourceId)
                }
              ).length

              const totalSources = selectedDepartments.length + selectedExternalSources.length + sourcesWithSubSources

              if (totalSources > 0 && useGoogleGrounding) {
                return `${totalSources} källor + Google valda`
              } else if (totalSources > 0) {
                return `${totalSources} källor valda`
              } else if (useGoogleGrounding) {
                return 'Google Search vald'
              } else {
                return 'Filtrera kunskap'
              }
            })()}
          </Button>
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
}