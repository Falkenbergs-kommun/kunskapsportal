'use client'

import * as React from 'react'
import {
  Home,
  MessageCircleQuestion,
  Sparkles,
  UserCheck,
  BookOpen,
} from 'lucide-react'

import { NavFavorites } from '@/components/nav-favorites'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavWorkspaces } from '@/components/nav-workspaces'
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'

const navMain = [
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
]

const navSecondary = [
  {
    title: 'Användarguide',
    url: '/docs',
    icon: BookOpen,
  },
  {
    title: 'Administratör',
    url: '/admin',
    icon: UserCheck,
    target: '_blank',
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [workspaces, setWorkspaces] = React.useState<any[]>([])

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
                  pages:
                    child.pages.map((grandChild: any) => ({
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
                url:
                  level === 1
                    ? `/${item.parent.slug}/${item.slug}`
                    : `/${item.parent.parent.slug}/${item.parent.slug}/${item.slug}`,
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
        <NavMain items={navMain} />
      </SidebarHeader>
      <SidebarContent className="mt-4">
        <NavFavorites />
        <NavWorkspaces workspaces={workspaces} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
