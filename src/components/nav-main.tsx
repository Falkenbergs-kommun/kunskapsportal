'use client'
import { Home, Search, Sparkles, type LucideIcon } from 'lucide-react'

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SidebarMenuAction } from './ui/sidebar-chat'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
  }[]
}) {
  const triggerRightSidebar = () => {
    // Simulate the keyboard shortcut for right sidebar
    // Adjust the key combination based on what your right sidebar uses
    const event = new KeyboardEvent('keydown', {
      key: 'm', // or whatever key you use
      ctrlKey: true, // or metaKey: true for Mac
      bubbles: true,
    })

    document.dispatchEvent(event)
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <a href="/">
            <Home />
            <span>Home</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={triggerRightSidebar} className="cursor-pointer">
          <Sparkles />
          <span>Fråga AI</span>
        </SidebarMenuButton>

        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuAction>
              <kbd className="text-xs">⌘M</kbd>
            </SidebarMenuAction>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ask AI (⌘M)</p>
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton className="cursor-pointer">
          <Search />
          <span>Sök</span>
        </SidebarMenuButton>

        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuAction>
              <kbd className="text-xs">⌘K</kbd>
            </SidebarMenuAction>
          </TooltipTrigger>
          <TooltipContent>
            <p>Press ⌘K to search</p>
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
