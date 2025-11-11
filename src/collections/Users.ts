import type { CollectionConfig } from 'payload'
import { getAccessibleDepartmentIds } from '@/lib/access-control'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    // Authenticated users can read user list
    read: ({ req: { user } }) => !!user,

    // Editors and superadmins can create users (invite colleagues)
    create: ({ req: { user } }) => {
      if (!user) return false
      return true
    },

    // Can update own profile, or superadmins can update anyone
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (user.role === 'superadmin') return true
      return user.id === id
    },

    // Only superadmins can delete users
    delete: ({ req: { user } }) => {
      return user?.role === 'superadmin'
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Super Admin', value: 'superadmin' },
        { label: 'Editor', value: 'editor' },
      ],
      admin: {
        description: 'Super Admins have access to all departments. Editors only assigned departments.',
      },
      access: {
        // Only superadmins can change roles
        update: ({ req: { user } }) => {
          return user?.role === 'superadmin'
        },
      },
    },
    {
      name: 'departments',
      type: 'relationship',
      relationTo: 'departments',
      hasMany: true,
      admin: {
        description: 'Departments this user can manage (includes all subdepartments automatically)',
        condition: (data) => data.role === 'editor',
      },
      // Filter to only show departments the inviting user has access to
      filterOptions: async ({ req }) => {
        const user = req.user
        if (!user) return { id: { equals: 'none' } }
        if (user.role === 'superadmin') return true

        const accessibleIds = await getAccessibleDepartmentIds(user, req.payload)
        return {
          id: { in: accessibleIds },
        }
      },
      // Validate that editor is only assigning their own departments
      validate: async (value, { req }) => {
        const user = req.user
        if (!user || user.role === 'superadmin') return true

        const assignedDeptIds = Array.isArray(value) ? value : value ? [value] : []
        const accessibleIds = await getAccessibleDepartmentIds(user, req.payload)

        const invalidDepts = assignedDeptIds.filter((deptValue) => {
          // Extract ID from either number or object
          const deptId = typeof deptValue === 'object' && deptValue !== null
            ? (deptValue as any).id || deptValue
            : deptValue
          return !accessibleIds.includes(Number(deptId))
        })

        if (invalidDepts.length > 0) {
          return 'You can only assign departments you have access to'
        }

        return true
      },
    },
  ],
}
