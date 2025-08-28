'use client'
import Link from 'next/link'
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
    const event = new KeyboardEvent('keydown', {
      key: 'j',
      metaKey: true, // Use metaKey for Command on Mac
      bubbles: true,
    })
    document.dispatchEvent(event)
  }
  const triggerCommandMenu = () => {
    // We simulate the ⌘K event that the layout is listening for
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/">
            <Home />
            <span>Home</span>
          </Link>
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
              <kbd className="text-xs">⌘J</kbd>
            </SidebarMenuAction>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ask AI (⌘J)</p>
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={triggerCommandMenu} className="cursor-pointer">
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
