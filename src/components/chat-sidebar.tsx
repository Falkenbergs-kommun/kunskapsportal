'use client'

import { Sidebar, SidebarHeader, SidebarContent } from './ui/sidebar-chat'
import { PlainChat } from './PlainChat' // Import our new PlainChat component

export function ChatSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b">
        {/* Simple Black and White Header */}
        <h2 className="text-lg font-semibold text-black px-2">AI Assistant</h2>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <PlainChat />
      </SidebarContent>
    </Sidebar>
  )
}
