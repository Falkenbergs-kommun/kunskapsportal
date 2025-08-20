'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface BreadcrumbItem {
  name: string
  url: string
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [currentPage, setCurrentPage] = useState<string>('')

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      // Skip breadcrumbs for home page
      if (pathname === '/') {
        setBreadcrumbs([])
        setCurrentPage('Home')
        return
      }

      const segments = pathname.split('/').filter(Boolean)
      
      if (segments.length === 0) return

      try {
        // Fetch department data
        const response = await fetch('/api/departments?limit=1000')
        const result = await response.json()
        const departments = result.docs

        if (segments.length === 1) {
          // Level 1: /ksf
          const dept = departments.find((d: any) => d.slug === segments[0] && !d.parent)
          if (dept) {
            setBreadcrumbs([])
            setCurrentPage(dept.name)
          }
        } else if (segments.length === 2) {
          // Level 2: /ksf/samhallsutveckling  
          const dept = departments.find((d: any) => 
            d.slug === segments[1] && 
            d.parent && 
            d.parent.slug === segments[0]
          )
          if (dept) {
            setBreadcrumbs([{
              name: dept.parent.name,
              url: `/${segments[0]}`
            }])
            setCurrentPage(dept.name)
          }
        } else if (segments.length === 3) {
          // Level 3: /ksf/samhallsutveckling/ne
          const dept = departments.find((d: any) =>
            d.slug === segments[2] &&
            d.parent &&
            d.parent.slug === segments[1] &&
            d.parent.parent &&
            d.parent.parent.slug === segments[0]
          )
          if (dept) {
            setBreadcrumbs([
              {
                name: dept.parent.parent.name,
                url: `/${segments[0]}`
              },
              {
                name: dept.parent.name,
                url: `/${segments[0]}/${segments[1]}`
              }
            ])
            setCurrentPage(dept.name)
          }
        }
      } catch (error) {
        console.error('Error generating breadcrumbs:', error)
      }
    }

    generateBreadcrumbs()
  }, [pathname])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => [
          <BreadcrumbItem key={crumb.url} className="hidden md:block">
            <BreadcrumbLink href={crumb.url}>{crumb.name}</BreadcrumbLink>
          </BreadcrumbItem>,
          <BreadcrumbSeparator key={`sep-${index}`} className="hidden md:block" />
        ]).flat()}
        {currentPage && (
          <BreadcrumbItem>
            <BreadcrumbPage>{currentPage}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}