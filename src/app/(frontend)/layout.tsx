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

// Helper function to read cookies
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [openCommandMenu, setOpenCommandMenu] = useState(false)
  
  // Initialize sidebar states from cookies
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true) // default to true
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true) // default to true
  const [focusMode, setFocusMode] = useState(false)
  
  // Read cookie values on client mount
  useEffect(() => {
    const leftSaved = getCookie('sidebar_state')
    if (leftSaved !== null) {
      setLeftSidebarOpen(leftSaved === 'true')
    }
    
    const chatSaved = getCookie('sidebar_chat_state')
    if (chatSaved !== null) {
      setChatSidebarOpen(chatSaved === 'true')
    }
  }, [])

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

  // Listen for focus mode toggle event
  useEffect(() => {
    const handleFocusMode = () => {
      setFocusMode((prev) => {
        const newFocusMode = !prev
        // When entering focus mode, close both sidebars
        // When exiting, restore to open state
        setLeftSidebarOpen(!newFocusMode)
        setChatSidebarOpen(!newFocusMode)
        return newFocusMode
      })
    }
    window.addEventListener('toggle-focus-mode', handleFocusMode)
    return () => window.removeEventListener('toggle-focus-mode', handleFocusMode)
  }, [])

  return (
    <html lang="sv">
      <head>
        <title>Kunskapsportal - Falkenbergs kommun</title>
        <meta name="description" content="AI-driven kunskapsdatabas för Falkenbergs kommun" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;800&family=Lato:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div>
          <FavoritesProvider>
            <TooltipProvider>
              {/* Pass setOpen function to the CommandMenu */}
              <CommandMenu open={openCommandMenu} setOpen={setOpenCommandMenu} />
              <SidebarProvider 
                open={leftSidebarOpen} 
                onOpenChange={setLeftSidebarOpen}
              >
                <AppSidebar id="left" />
                <SidebarProviderChat 
                  open={chatSidebarOpen} 
                  onOpenChange={setChatSidebarOpen}
                >
                  <SidebarInset>
                    <header className="bg-background sticky top-0 flex h-12 shrink-0 items-center gap-2 px-4 z-40">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarTrigger className="-ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Expand/collapse sidebar (⌘B)</p>
                        </TooltipContent>
                      </Tooltip>
                      <DynamicBreadcrumb />
                      <div className="flex-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarTriggerChat />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Toggle AI chat sidebar</p>
                        </TooltipContent>
                      </Tooltip>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 px-4 pb-4">{children}</div>
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
