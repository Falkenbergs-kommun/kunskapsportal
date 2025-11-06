'use client'

import Link from 'next/link'
import { ArrowUpRight, Link as LinkIcon, MoreHorizontal, Star, StarOff } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from '@/components/ui/sidebar'
import { useFavorites } from '@/contexts/favorites-context'

export function NavFavorites() {
  const { isMobile } = useSidebar()
  const { favorites, removeFavorite, isLoading } = useFavorites()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleRemoveFavorite = (url: string) => {
    removeFavorite(url)
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url)
  }

  const handleOpenInNewTab = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="border-b">
        <Star className="mr-2" />
        Favoriter
      </SidebarGroupLabel>
      <SidebarMenu>
        {isClient && isLoading ? (
          <>
            <SidebarMenuSkeleton />
            <SidebarMenuSkeleton />
          </>
        ) : favorites.length > 0 ? (
          favorites.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <Link href={item.url} title={item.title}>
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">Mer</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-lg"
                  side={isMobile ? 'bottom' : 'right'}
                  align={isMobile ? 'end' : 'start'}
                >
                  <DropdownMenuItem onClick={() => handleRemoveFavorite(item.url)}>
                    <StarOff className="text-muted-foreground" />
                    <span>Ta bort från favoriter</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleCopyLink(item.url)}>
                    <LinkIcon className="text-muted-foreground" />
                    <span>Kopiera länk</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenInNewTab(item.url)}>
                    <ArrowUpRight className="text-muted-foreground" />
                    <span>Öppna i ny flik</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))
        ) : (
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="text-sidebar-foreground/50">
              <span>Inga favoriter ännu</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
