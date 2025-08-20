import { ChevronRight, MoreHorizontal, Plus } from 'lucide-react'

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
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Departments</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {workspaces.map((workspace) => (
            <Collapsible key={workspace.name}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href={workspace.url}>
                    <span>{workspace.name}</span>
                  </a>
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
                    {workspace.pages.map((page) => (
                      <SidebarMenuSubItem key={page.name}>
                        {page.pages && page.pages.length > 0 ? (
                          <Collapsible>
                            <SidebarMenuSubButton asChild>
                              <a href={page.url}>
                                <span>{page.name}</span>
                              </a>
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
                                      <a href={subPage.url || '#'}>
                                        <span>{subPage.name}</span>
                                      </a>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <SidebarMenuSubButton asChild>
                            <a href={page.url || '#'}>
                              <span>{page.name}</span>
                            </a>
                          </SidebarMenuSubButton>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontal />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
