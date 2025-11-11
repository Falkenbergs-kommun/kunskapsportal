import type { User } from '@/payload-types'
import type { PayloadRequest } from 'payload'

/**
 * Check if user can access a department (for editing/managing)
 *
 * @param user - The user to check access for
 * @param targetDepartmentPath - Full path of the department to check (e.g., "HR/Utveckling")
 * @returns true if user has access, false otherwise
 */
export function canAccessDepartment(
  user: User | null,
  targetDepartmentPath: string | null | undefined,
): boolean {
  if (!user || !targetDepartmentPath) return false
  if (user.role === 'superadmin') return true

  // Check if any of user's departments match or are parent of target
  return (
    user.departments?.some((userDept) => {
      const userDeptPath = typeof userDept === 'object' ? userDept.fullPath : null
      if (!userDeptPath) return false

      // Exact match or subdepartment
      return (
        targetDepartmentPath === userDeptPath ||
        targetDepartmentPath.startsWith(userDeptPath + '/')
      )
    }) || false
  )
}

/**
 * Get all department IDs accessible to user (for query filters)
 * Returns all department IDs for superadmins, or user's assigned departments + subdepartments for editors
 *
 * @param user - The user to get accessible departments for
 * @param payload - Payload instance for database queries
 * @returns Array of department IDs the user can access
 */
export async function getAccessibleDepartmentIds(
  user: User | null,
  payload: PayloadRequest['payload'],
): Promise<number[]> {
  if (!user) return []

  if (user.role === 'superadmin') {
    // Return all department IDs
    const allDepts = await payload.find({
      collection: 'departments',
      limit: 1000,
      pagination: false,
    })
    return allDepts.docs.map((d: any) => d.id)
  }

  if (!user.departments || user.departments.length === 0) {
    return []
  }

  // Get all departments to check paths
  const allDepts = await payload.find({
    collection: 'departments',
    limit: 1000,
    pagination: false,
  })

  // Filter departments that match user's assigned departments or are subdepartments
  const accessibleIds = allDepts.docs
    .filter((dept: any) => {
      return user.departments?.some((userDept) => {
        const userDeptPath = typeof userDept === 'object' ? userDept.fullPath : null
        if (!userDeptPath) return false

        return (
          dept.fullPath === userDeptPath || dept.fullPath?.startsWith(userDeptPath + '/')
        )
      })
    })
    .map((d: any) => d.id)

  return accessibleIds
}
