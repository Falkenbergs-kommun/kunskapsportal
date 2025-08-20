'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, MoreHorizontal } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

const WORKSPACES_STATE_KEY = 'sidebar_workspaces_open_state'

export function NavWorkspaces({
  workspaces,
}: {
  workspaces: {
    name: string
    url: string
    pages: {
      name: string
      url?: string
      pages?: {
        name: string
        url?: string
      }[]
    }[]
  }[]
}) {
  const [openStates, setOpenStates] = React.useState<Record<string, boolean>>({})
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    try {
      const savedState = localStorage.getItem(WORKSPACES_STATE_KEY)
      if (savedState) {
        setOpenStates(JSON.parse(savedState))
      }
    } catch (e) {
      console.error('Could not load workspace states from localStorage', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const handleOpenChange = (id: string, isOpen: boolean) => {
    const newStates = { ...openStates, [id]: isOpen }
    setOpenStates(newStates)
    try {
      localStorage.setItem(WORKSPACES_STATE_KEY, JSON.stringify(newStates))
    } catch (e) {
      console.error('Could not save workspace states to localStorage', e)
    }
  }

  if (!isLoaded) {
    // Render nothing or a skeleton on the server and initial client render
    // to prevent hydration mismatch and flashing.
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Departments</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {workspaces.map((workspace) => {
            const workspaceId = workspace.name
            return (
              <Collapsible
                key={workspaceId}
                open={openStates[workspaceId] || false}
                onOpenChange={(isOpen) => handleOpenChange(workspaceId, isOpen)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={workspace.url}>
                      <span>{workspace.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction
                      className="bg-sidebar-accent text-sidebar-accent-foreground -ml-2 data-[state=open]:rotate-90"
                      showOnHover
                    >
                      <ChevronRight />
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {workspace.pages.map((page) => {
                        const pageId = `${workspace.name}/${page.name}`
                        return (
                          <SidebarMenuSubItem key={pageId}>
                            {page.pages && page.pages.length > 0 ? (
                              <Collapsible
                                open={openStates[pageId] || false}
                                onOpenChange={(isOpen) => handleOpenChange(pageId, isOpen)}
                              >
                                <SidebarMenuSubButton asChild>
                                  <Link href={page.url || '#'}>
                                    <span>{page.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuAction
                                    className="bg-sidebar-accent text-sidebar-accent-foreground -ml-2 data-[state=open]:rotate-90"
                                    showOnHover
                                  >
                                    <ChevronRight />
                                  </SidebarMenuAction>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    {page.pages.map((subPage) => (
                                      <SidebarMenuSubItem key={subPage.name}>
                                        <SidebarMenuSubButton asChild>
                                          <Link href={subPage.url || '#'}>
                                            <span>{subPage.name}</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </Collapsible>
                            ) : (
                              <SidebarMenuSubButton asChild>
                                <Link href={page.url || '#'}>
                                  <span>{page.name}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            )}
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
