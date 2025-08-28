'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ArrowUpIcon } from 'lucide-react'
import { useSidebar } from './ui/sidebar-chat' // Import the useSidebar hook
import { StyledChatMessage } from './StyledChatMessage'

// Simplified Message interface
interface Message {
  id: number
  sender: 'user' | 'agent'
  text: string
}

export function PlainChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'agent',
      text: 'Hello! How can I assist you today?',
    },
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null) // Ref for the textarea
  const { open } = useSidebar() // Get sidebar state

  // Focus the input when the sidebar opens
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = input.trim()
    if (!trimmedInput) return

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: trimmedInput,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    // Simulate a dummy agent response
    setTimeout(() => {
      const agentMessage: Message = {
        id: Date.now() + 1,
        sender: 'agent',
        text: 'This is a dummy response, acknowledging your message.',
      }
      setMessages((prev) => [...prev, agentMessage])
    }, 800)
  }

  return (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Message Display Area */}
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg) => (
          <StyledChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Area */}
      <div className="p-4 border-t border-gray-200">
        <form
          onSubmit={handleSendMessage}
          className="bg-white p-1.5 rounded-xl border border-gray-300 flex items-end space-x-1.5"
        >
          <Textarea
            ref={inputRef} // Assign the ref to the textarea
            placeholder="Send a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
            className="flex-grow text-sm resize-none border-none focus:ring-0 p-2 min-h-[38px] max-h-[120px] bg-transparent"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
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
