'use client'

import { Sidebar, SidebarHeader, SidebarContent, useSidebar } from './ui/sidebar-chat'
import { PlainChat } from './PlainChat'
import { useState } from 'react'
import { Button } from './ui/button'
import { Maximize2Icon, ChevronRightIcon } from 'lucide-react'

export function ChatSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpen } = useSidebar()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold text-black">AI Assistant</h2>
          <div className="flex gap-1">
            {/* Expand button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
              title="Expandera chatt"
            >
              <Maximize2Icon className="h-4 w-4" />
            </Button>
            {/* Collapse sidebar button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
              title="Stäng AI-assistent"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <PlainChat isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </SidebarContent>
    </Sidebar>
  )
}
