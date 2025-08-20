import { notFound } from 'next/navigation'
import DepartmentView from '@/components/department-view'

interface SlugPageProps {
  params: {
    slug: string[]
  }
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = params
  
  // Fetch department data to find matching department
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/departments?limit=1000`)
    const result = await response.json()
    
    // Find department by matching the full path
    const findDepartmentByPath = (slugs: string[], departments: any[]): any => {
      if (slugs.length === 1) {
        // Single slug - find top level department
        return departments.find(dept => dept.slug === slugs[0] && !dept.parent)
      } else if (slugs.length === 2) {
        // Two slugs - find second level department  
        return departments.find(dept => 
          dept.slug === slugs[1] && 
          dept.parent && 
          dept.parent.slug === slugs[0]
        )
      } else if (slugs.length === 3) {
        // Three slugs - find third level department
        return departments.find(dept =>
          dept.slug === slugs[2] &&
          dept.parent &&
          dept.parent.slug === slugs[1] &&
          dept.parent.parent &&
          dept.parent.parent.slug === slugs[0]
        )
      }
      return null
    }
    
    const department = findDepartmentByPath(slug, result.docs)
    
    if (!department) {
      notFound()
    }
    
    // Build the full path for the URL  
    const fullPath = `/${slug.join('/')}`
    
    return (
      <DepartmentView 
        departmentName={department.name}
        departmentSlug={fullPath}
      />
    )
    
  } catch (error) {
    console.error('Error fetching department:', error)
    notFound()
  }
}
