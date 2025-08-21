import { notFound } from 'next/navigation'
import DepartmentView from '@/components/department-view'

interface DepartmentPageProps {
  params: Promise<{
    department: string
  }>
}

export default async function DepartmentPage({ params }: DepartmentPageProps) {
  const { department: departmentSlug } = await params
  // Fetch department data to find the exact department
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/departments?limit=1000`,
    )
    const result = await response.json()

    // Find top-level department by slug
    const department = result.docs.find((dept: any) => dept.slug === departmentSlug && !dept.parent)

    if (!department) {
      notFound()
    }

    return <DepartmentView departmentName={department.name} departmentSlug={`/${departmentSlug}`} />
  } catch (error) {
    console.error('Error fetching department:', error)
    notFound()
  }
}
