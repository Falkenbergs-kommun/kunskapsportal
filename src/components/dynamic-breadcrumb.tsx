'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface Breadcrumb {
  name: string
  url: string
}

// Helper function to recursively build the full path of a department from nested objects
const getDepartmentFullPath = (department: any): string => {
  if (!department || typeof department === 'number') {
    return ''
  }
  const parentPath = getDepartmentFullPath(department.parent)
  return parentPath ? `${parentPath}/${department.slug}` : department.slug || ''
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])
  const [currentPage, setCurrentPage] = useState<string>('')

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      if (pathname === '/') {
        setBreadcrumbs([])
        setCurrentPage('')
        return
      }

      const segments = pathname.split('/').filter(Boolean)
      if (segments.length === 0) return

      // --- Article Breadcrumb Logic ---
      // Assume the last segment is a potential article slug
      const potentialArticleSlug = segments[segments.length - 1]
      const potentialDepartmentPath = segments.slice(0, -1).join('/')

      try {
        const articleResponse = await fetch(
          `/api/articles?where[slug][equals]=${potentialArticleSlug}&depth=5&limit=1`,
        )
        const articleResult = await articleResponse.json()

        if (articleResult.docs.length > 0) {
          const article = articleResult.docs[0]

          // Verify the article's department path matches the URL
          if (article.department && typeof article.department === 'object') {
            const articleDepartmentPath = getDepartmentFullPath(article.department)

            if (articleDepartmentPath === potentialDepartmentPath) {
              // It's a valid article page. Build breadcrumbs from its department hierarchy.
              const newBreadcrumbs: Breadcrumb[] = []
              let currentDept = article.department

              while (currentDept) {
                newBreadcrumbs.unshift({
                  name: currentDept.name,
                  url: `/${getDepartmentFullPath(currentDept)}`,
                })
                currentDept = currentDept.parent
              }

              setBreadcrumbs(newBreadcrumbs)
              setCurrentPage(article.title)
              return // Exit after successfully handling the article path
            }
          }
        }
      } catch (error) {
        console.error('Error fetching article for breadcrumbs:', error)
      }

      // --- Fallback to Department Breadcrumb Logic (Existing Logic) ---
      // This runs if the URL is not a valid article path
      try {
        const response = await fetch('/api/departments?limit=1000&depth=5')
        const result = await response.json()
        const departments = result.docs

        const currentDepartment = departments.find(
          (d: any) => getDepartmentFullPath(d) === segments.join('/'),
        )

        if (currentDepartment) {
          const newBreadcrumbs: Breadcrumb[] = []
          let parent = currentDepartment.parent
          while (parent) {
            newBreadcrumbs.unshift({
              name: parent.name,
              url: `/${getDepartmentFullPath(parent)}`,
            })
            parent = parent.parent
          }
          setBreadcrumbs(newBreadcrumbs)
          setCurrentPage(currentDepartment.name)
        }
      } catch (error) {
        console.error('Error generating department breadcrumbs:', error)
      }
    }

    generateBreadcrumbs()
  }, [pathname])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.url}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={crumb.url}>{crumb.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
        {currentPage && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
