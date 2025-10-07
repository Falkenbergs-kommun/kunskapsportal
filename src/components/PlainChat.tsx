'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ArrowUpIcon, MessageSquarePlusIcon, SettingsIcon, XIcon, FileTextIcon } from 'lucide-react'
import { useSidebar } from './ui/sidebar-chat'
import { Avatar, AvatarFallback } from './ui/avatar'
import { DepartmentSelector } from './DepartmentSelector'
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
  const [articleContext, setArticleContext] = usePersistedState<ArticleContext | null>(
    'chat_article_context',
    null
  )
  const [showSettings, setShowSettings] = useState(false)
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

      // Call the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          departmentIds: selectedDepartments,
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
        throw new Error(errorData.error || 'Failed to get response')
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
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'agent',
        text: error instanceof Error 
          ? `Tyvärr uppstod ett fel: ${error.message}` 
          : 'Tyvärr uppstod ett fel när jag försökte svara på din fråga. Vänligen försök igen.',
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
        <div className="p-4 border-b border-gray-200">
          <DepartmentSelector
            selectedDepartments={selectedDepartments}
            onSelectionChange={setSelectedDepartments}
          />
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
            {selectedDepartments.length > 0 
              ? `${selectedDepartments.length} avdelningar valda`
              : 'Filtrera avdelningar'
            }
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
            placeholder={articleContext 
              ? `Ställ en fråga om "${articleContext.title}"...`
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