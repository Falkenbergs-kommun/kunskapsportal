'use client' // Add this at the top to make it a Client Component

import './styles.css'
import { useEffect, useState } from 'react' // Import hooks
import { AppSidebar } from '@/components/app-sidebar'
import { ChatSidebar } from '@/components/chat-sidebar'
import { CommandMenu } from '@/components/command-menu' // Import the command menu
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import {
  SidebarInset as SidebarInsetChat,
  SidebarProvider as SidebarProviderChat,
  SidebarTrigger as SidebarTriggerChat,
} from '@/components/ui/sidebar-chat'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FavoritesProvider } from '@/contexts/favorites-context'

// Note: Because we need client-side state, we can no longer fetch cookies on the server
// for this component. The sidebar state is handled client-side in the SidebarProvider now.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [openCommandMenu, setOpenCommandMenu] = useState(false)

  // Keyboard shortcut listener for Command Menu (⌘K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenCommandMenu((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <html lang="en">
      <body>
        <div>
          <FavoritesProvider>
            <TooltipProvider>
              {/* Pass setOpen function to the CommandMenu */}
              <CommandMenu open={openCommandMenu} setOpen={setOpenCommandMenu} />
              <SidebarProvider>
                <AppSidebar id="left" />
                <SidebarProviderChat>
                  <SidebarInset>
                    <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarTrigger className="-ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Expand/collapse sidebar (⌘B)</p>
                        </TooltipContent>
                      </Tooltip>
                      <Separator orientation="vertical" className="mr-2 h-4" />
                      <DynamicBreadcrumb />
                      <div className="flex-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarTriggerChat />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Expand/collapse AI chat (⌘J)</p>
                        </TooltipContent>
                      </Tooltip>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
                  </SidebarInset>
                  <ChatSidebar side="right" />
                </SidebarProviderChat>
              </SidebarProvider>
            </TooltipProvider>
          </FavoritesProvider>
        </div>
      </body>
    </html>
  )
}
