import { notFound } from 'next/navigation'
import ArticleView from '@/components/article-view'
import DepartmentView from '@/components/department-view'

interface ArticlePageProps {
  params: {
    department: string
    article: string
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  // Check if this is actually a department (level 2) by fetching department data
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/departments?limit=1000`)
    const result = await response.json()
    
    // Check if the "article" parameter is actually a department slug
    const isDepartment = result.docs.find((dept: any) => 
      dept.slug === params.article && 
      dept.parent && 
      dept.parent.slug === params.department
    )
    
    if (isDepartment) {
      // This is a level 2 department, render department view
      return (
        <DepartmentView 
          departmentName={isDepartment.name}
          departmentSlug={`/${params.department}/${params.article}`}
        />
      )
    }
    
    // If not a department, render article view
    return <ArticleView />
    
  } catch (error) {
    console.error('Error fetching departments:', error)
    return <ArticleView />
  }
}
