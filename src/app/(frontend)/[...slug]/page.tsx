import { notFound } from 'next/navigation'
import ArticleView from '@/components/article-view'
import DepartmentView from '@/components/department-view'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Article, Department } from '@/payload-types'

// Helper function to recursively build the full path of a department
const getDepartmentFullPath = (department: Department | number | null): string => {
  if (!department || typeof department === 'number') {
    return ''
  }

  // Recursively get the parent's path and append the current slug
  const parentPath = getDepartmentFullPath(department.parent || null)
  return parentPath ? `${parentPath}/${department.slug}` : department.slug || ''
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
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
    depth: 5, // High depth to fully populate department parents for path validation
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
        return <ArticleView article={article} />
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
    // NOTE: Your DepartmentView also uses mock data. You will need to
    // adapt it to fetch and display the actual articles for this department.
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
      depth: 0,
      limit: 100, // Adjust limit as needed
    })
    return (
      <DepartmentView
        departmentName={department.name}
        departmentSlug={`/${fullPath}`}
        articles={articlesQuery.docs}
      />
    )
  }

  // --- If nothing is found, return a 404 page ---
  return notFound()
}
