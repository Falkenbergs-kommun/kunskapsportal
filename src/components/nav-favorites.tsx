'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  GripVertical,
  Link as LinkIcon,
  MoreHorizontal,
  Star,
  StarOff,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

// Sortable item component
function SortableFavoriteItem({
  item,
  isMobile,
  onRemove,
  onCopyLink,
  onOpenInNewTab,
}: {
  item: { url: string; title: string; emoji: string; order: number }
  isMobile: boolean
  onRemove: (url: string) => void
  onCopyLink: (url: string) => void
  onOpenInNewTab: (url: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.url,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <SidebarMenuButton asChild>
        <Link href={item.url} title={item.title}>
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {/* Drag handle */}
      <SidebarMenuAction showOnHover {...attributes} {...listeners}>
        <GripVertical />
        <span className="sr-only">Dra för att sortera</span>
      </SidebarMenuAction>
      {/* More options menu */}
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
          <DropdownMenuItem onClick={() => onRemove(item.url)}>
            <StarOff className="text-muted-foreground" />
            <span>Ta bort från favoriter</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onCopyLink(item.url)}>
            <LinkIcon className="text-muted-foreground" />
            <span>Kopiera länk</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOpenInNewTab(item.url)}>
            <ArrowUpRight className="text-muted-foreground" />
            <span>Öppna i ny flik</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export function NavFavorites() {
  const { isMobile } = useSidebar()
  const { favorites, removeFavorite, reorderFavorites, isLoading } = useFavorites()
  const [isClient, setIsClient] = useState(false)

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex((fav) => fav.url === active.id)
      const newIndex = favorites.findIndex((fav) => fav.url === over.id)

      const newOrder = arrayMove(favorites, oldIndex, newIndex)
      reorderFavorites(newOrder)
    }
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={favorites.map((f) => f.url)} strategy={verticalListSortingStrategy}>
              {favorites.map((item) => (
                <SortableFavoriteItem
                  key={item.url}
                  item={item}
                  isMobile={isMobile}
                  onRemove={handleRemoveFavorite}
                  onCopyLink={handleCopyLink}
                  onOpenInNewTab={handleOpenInNewTab}
                />
              ))}
            </SortableContext>
          </DndContext>
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
