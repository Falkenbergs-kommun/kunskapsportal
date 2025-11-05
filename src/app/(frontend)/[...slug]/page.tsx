import { notFound } from 'next/navigation'
import ArticleDisplay from '../../../components/ArticleDisplay' // Use the new unified component
import DepartmentView from '../../../components/department-view'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Article, Department } from '../../../payload-types'

import { getDepartmentFullPath } from '../../../lib/utils'

function buildDepartmentTree(departments: any[]): any[] {
  const map = new Map()
  const roots: any[] = []

  // First pass: create all department objects
  departments.forEach((dept) => {
    map.set(dept.id, {
      id: dept.id,
      name: dept.name,
      slug: dept.slug,
      children: [],
    })
  })

  // Second pass: build the tree
  departments.forEach((dept) => {
    const node = map.get(dept.id)
    if (dept.parent && typeof dept.parent === 'string') {
      const parent = map.get(dept.parent)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    } else if (dept.parent && typeof dept.parent === 'object' && dept.parent.id) {
      const parent = map.get(dept.parent.id)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

export default async function SlugPage({ 
  params 
}: { 
  params: Promise<{ slug: string[] }> 
}) {
  const { slug } = await params

  if (!slug || slug.length === 0) {
    return notFound()
  }

  const payload = await getPayload({ config })
  const fullPath = slug.join('/')

  // --- Strategy 1: Check if the path resolves to an Article ---
  const potentialArticleSlug = slug[slug.length - 1]
  const potentialDepartmentPath = slug.slice(0, -1).join('/')

  const articleQuery = await payload.find({
    collection: 'articles',
    where: {
      slug: {
        equals: potentialArticleSlug,
      },
      _status: {
        equals: 'published', // Only show published articles on the frontend
      },
    },
    depth: 3, // IMPORTANT: Use depth=3 to populate coverPhoto, media in content, and departments
    limit: 1,
  })

  if (articleQuery.docs.length > 0) {
    const article = articleQuery.docs[0] as Article

    // We found an article, now verify its department's path matches the URL
    if (article.department && typeof article.department !== 'number') {
      const articleDepartmentPath = getDepartmentFullPath(article.department)

      if (articleDepartmentPath === potentialDepartmentPath) {
        // The path matches! Render the ArticleView.
        // NOTE: Your ArticleView currently uses mock data. You will need to
        // modify it to accept the fetched 'article' object as a prop.
        // Path matches! Render the ArticleDisplay component.
        return <ArticleDisplay article={article} />
      }
    }
  }

  // --- Strategy 2: If not an article, check if it's a Department ---
  const departmentQuery = await payload.find({
    collection: 'departments',
    where: {
      slug: {
        equals: potentialArticleSlug, // The last segment must be the department's own slug
      },
    },
    depth: 5, // High depth is needed to build and verify the full path
  })

  // We might get multiple departments with the same slug but different parents.
  // Find the one whose full, reconstructed path matches the URL's full path.
  const department = departmentQuery.docs.find((d) => getDepartmentFullPath(d) === fullPath) as
    | Department
    | undefined

  if (department) {
    // It's a department. Render the DepartmentView.
    // Query articles for this department
    const articlesQuery = await payload.find({
      collection: 'articles',
      where: {
        department: {
          equals: department.id,
        },
        _status: {
          equals: 'published',
        },
      },
      depth: 3,
      limit: 50, // Initial load - users can load more
      sort: '-updatedAt', // Newest first by default
    })

    // Fetch ALL departments and build a hierarchical tree (to get all descendants, not just direct children)
    const allDepartmentsQuery = await payload.find({
      collection: 'departments',
      limit: 100,
      depth: 1,
    })

    // Build complete department tree
    const departmentTree = buildDepartmentTree(allDepartmentsQuery.docs)

    // Find the current department in the tree
    const findDepartmentInTree = (tree: any[], targetId: string | number): any => {
      for (const node of tree) {
        if (String(node.id) === String(targetId)) {
          return node
        }
        if (node.children && node.children.length > 0) {
          const found = findDepartmentInTree(node.children, targetId)
          if (found) return found
        }
      }
      return null
    }

    const departmentNode = findDepartmentInTree(departmentTree, department.id)
    const subdepartmentsWithChildren = departmentNode?.children || []

    // For each subdepartment (including nested children), count the published articles
    const subdepartmentsWithCounts = await Promise.all(
      subdepartmentsWithChildren.map(async (subdept: any) => {
        const count = await payload.count({
          collection: 'articles',
          where: {
            department: {
              equals: subdept.id,
            },
            _status: {
              equals: 'published',
            },
          },
        })
        return {
          ...subdept,
          articleCount: count.totalDocs,
        }
      }),
    )

    return (
      <DepartmentView
        departmentName={department.name}
        departmentSlug={`/${fullPath}`}
        departmentId={String(department.id)}
        articles={articlesQuery.docs}
        totalArticles={articlesQuery.totalDocs}
        subdepartments={subdepartmentsWithCounts}
      />
    )
  }

  // --- If nothing is found, return a 404 page ---
  return notFound()
}
