'use client'

import * as React from 'react'
import {
  AudioWaveform,
  Blocks,
  Calendar,
  Command,
  Home,
  Inbox,
  MessageCircleQuestion,
  Search,
  Settings2,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { NavFavorites } from '@/components/nav-favorites'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavWorkspaces } from '@/components/nav-workspaces'
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'
import { SearchForm } from './search-form'

// This is sample data.
const data = {
  teams: [
    {
      name: 'Acme Inc',
      logo: Command,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Ask AI',
      url: '#',
      icon: Sparkles,
    },
    {
      title: 'Home',
      url: '#',
      icon: Home,
      isActive: true,
    },
  ],
  navSecondary: [
    {
      title: 'Calendar',
      url: '#',
      icon: Calendar,
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
    },
    {
      title: 'Templates',
      url: '#',
      icon: Blocks,
    },
    {
      title: 'Trash',
      url: '#',
      icon: Trash2,
    },
    {
      title: 'Help',
      url: '#',
      icon: MessageCircleQuestion,
    },
  ],
  favorites: [
    {
      name: 'Project Management & Task Tracking',
      url: '#',
      emoji: '📊',
    },
    {
      name: 'Family Recipe Collection & Meal Planning',
      url: '#',
      emoji: '🍳',
    },
    {
      name: 'Fitness Tracker & Workout Routines',
      url: '#',
      emoji: '💪',
    },
    {
      name: 'Book Notes & Reading List',
      url: '#',
      emoji: '📚',
    },
    {
      name: 'Sustainable Gardening Tips & Plant Care',
      url: '#',
      emoji: '🌱',
    },
    {
      name: 'Language Learning Progress & Resources',
      url: '#',
      emoji: '🗣️',
    },
    {
      name: 'Home Renovation Ideas & Budget Tracker',
      url: '#',
      emoji: '🏠',
    },
    {
      name: 'Personal Finance & Investment Portfolio',
      url: '#',
      emoji: '💰',
    },
    {
      name: 'Movie & TV Show Watchlist with Reviews',
      url: '#',
      emoji: '🎬',
    },
    {
      name: 'Daily Habit Tracker & Goal Setting',
      url: '#',
      emoji: '✅',
    },
  ],
  workspaces: [], // Will be replaced with dynamic data
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [workspaces, setWorkspaces] = React.useState(data.workspaces)

  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments?limit=1000')
        const result = await response.json()

        // Build hierarchical structure with max 3 levels
        const buildHierarchy = (
          items: any[],
          parentId: string | null = null,
          level: number = 0,
        ): any[] => {
          if (level >= 3) return [] // Max 3 levels

          const children = items.filter((item: any) => {
            if (parentId === null) {
              return item.parent === null
            }
            return item.parent && item.parent.id === parentId
          })

          return children.map((item: any) => {
            const childPages = buildHierarchy(items, item.id, level + 1)

            if (level === 0) {
              // Top level departments become workspaces
              return {
                name: item.name,
                url: `/${item.slug}`,
                pages: childPages.map((child: any) => ({
                  name: child.name,
                  url: `/${item.slug}/${child.slug || child.name.toLowerCase().replace(/ /g, '-')}`,
                  pages: child.pages.map((grandChild: any) => ({
                    name: grandChild.name,
                    url: `/${item.slug}/${child.slug}/${grandChild.slug || grandChild.name.toLowerCase().replace(/ /g, '-')}`,
                  })) || [],
                })),
              }
            } else {
              // Sub-departments become pages
              return {
                name: item.name,
                slug: item.slug,
                url: level === 1 ? `/${item.parent.slug}/${item.slug}` : `/${item.parent.parent.slug}/${item.parent.slug}/${item.slug}`,
                pages: childPages || [],
              }
            }
          })
        }

        const hierarchicalDepartments = buildHierarchy(result.docs)
        setWorkspaces(hierarchicalDepartments)
      } catch (error) {
        console.error('Error fetching departments:', error)
      }
    }

    fetchDepartments()
  }, [])

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <img src="/logo.svg" className="mx-6 mt-8 mb-2" />
        <div className="px-6 text-xl font-bold">Kunskapsportalen</div>
        {/* <SearchForm /> */}
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent className="mt-4">
        <NavFavorites />
        <NavWorkspaces workspaces={workspaces} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
