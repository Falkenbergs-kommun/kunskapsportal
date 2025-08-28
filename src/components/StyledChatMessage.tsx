'use client'

import React from 'react'
import { Avatar, AvatarFallback } from './ui/avatar'

// Simplified Message interface for this component
interface Message {
  sender: 'user' | 'agent'
  text: string
}

interface StyledChatMessageProps {
  message: Message
}

export const StyledChatMessage: React.FC<StyledChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user'

  if (isUser) {
    return (
      <div className="flex mb-4 items-start">
        <Avatar className="mr-3 h-7 w-7 mt-0.5 flex-shrink-0">
          {/* Using a plain black/white style as requested */}
          <AvatarFallback className="bg-black text-white text-xs font-semibold">DU</AvatarFallback>
        </Avatar>
        <div className="bg-gray-100 py-2 px-3 rounded-lg max-w-[85%]">
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        </div>
      </div>
    )
  }

  // This is the agent message style from your reference
  return (
    <div className="flex flex-col mb-5 items-start w-full">
      <div className="py-2 px-3 max-w-[95%]">
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
      </div>
    </div>
  )
}
