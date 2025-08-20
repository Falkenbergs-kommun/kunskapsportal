'use client'
import { useSidebar } from '@/components/ui/sidebar-chat'
import { Home, Search, Sparkles, type LucideIcon } from 'lucide-react'

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

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
          <span>Fråga AI (ctrl+m)</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <a href="/search">
            <Search />
            <span>Sök (ctrl+k)</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
