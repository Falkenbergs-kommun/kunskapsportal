import type { CollectionConfig } from 'payload'
import { canAccessDepartment, getAccessibleDepartmentIds } from '@/lib/access-control'
import { computeFullPath, cascadeUpdateChildrenPaths } from '@/lib/department-utils'

export const Departments: CollectionConfig = {
  slug: 'departments',
  access: {
    // Public read access for viewing
    read: () => true,

    // Editors can create subdepartments under their assigned departments
    create: async ({ req, data }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'superadmin') return true

      // If creating root department, only superadmins allowed
      if (!data?.parent) return false

      // Check if user has access to parent department
      const parent = await req.payload.findByID({
        collection: 'departments',
        id: data.parent,
        depth: 0,
      })

      return canAccessDepartment(user, parent.fullPath)
    },

    // Can update if user has access to the department
    update: async ({ req, id }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'superadmin') return true
      if (!id) return false

      const dept = await req.payload.findByID({
        collection: 'departments',
        id,
        depth: 0,
      })

      return canAccessDepartment(user, dept.fullPath)
    },

    // Only superadmins can delete departments
    delete: ({ req: { user } }) => {
      return user?.role === 'superadmin'
    },
  },
  admin: {
    useAsTitle: 'name',
    description: 'Main organizational areas and their sub-departments.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Department Name',
    },
    // A 'parent' field that is a relationship to itself
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'departments',
      label: 'Parent Department',
      admin: {
        position: 'sidebar',
        description: 'Leave this empty if this is a top-level department. Maximum 3 levels allowed. Cannot be changed after creation.',
      },
      // Filter to accessible departments and prevent self-referencing
      filterOptions: async ({ id, req }: any) => {
        const user = req?.user
        const filters: any = {}

        // Prevent a department from being its own parent
        if (id) {
          filters.id = { not_equals: id }
        }

        // Filter by user's accessible departments (editors only)
        if (user && user.role === 'editor') {
          const accessibleIds = await getAccessibleDepartmentIds(user, req.payload)
          if (accessibleIds.length > 0) {
            filters.id = filters.id
              ? { ...filters.id, in: accessibleIds }
              : { in: accessibleIds }
          }
        }

        return Object.keys(filters).length > 0 ? filters : undefined
      },
      // Validate that we don't exceed 3 levels of hierarchy
      validate: async (value: any, { req, operation, data, id }: any) => {
        // Prevent changing parent after creation
        if (operation === 'update' && id) {
          const existing = await req.payload.findByID({
            collection: 'departments',
            id,
            depth: 0,
          })

          const existingParentId = existing?.parent
            ? (typeof existing.parent === 'object' ? existing.parent.id : existing.parent)
            : null
          const newParentId = value
            ? (typeof value === 'object' ? value.id : value)
            : null

          if (existingParentId !== newParentId) {
            return 'Parent department cannot be changed after creation'
          }
        }

        // If no parent selected, it's valid (top-level department)
        if (!value) {
          return true
        }

        const parentId =
          typeof value === 'string' || typeof value === 'number' ? String(value) : (value as any).id

        // Function to recursively count parent depth
        const getParentDepth = async (deptId: string, currentDepth = 0): Promise<number> => {
          if (currentDepth >= 3) {
            // Stop early if we've already found too many levels
            return currentDepth
          }

          try {
            const parent = await req.payload.findByID({
              collection: 'departments',
              id: deptId,
              depth: 1,
            })

            if (parent?.parent) {
              const nextParentId =
                typeof parent.parent === 'string' || typeof parent.parent === 'number'
                  ? String(parent.parent)
                  : (parent.parent as any).id
              return getParentDepth(nextParentId, currentDepth + 1)
            }

            return currentDepth
          } catch (error) {
            // If parent not found, allow it (will fail elsewhere)
            return currentDepth
          }
        }

        // Check the depth of the selected parent
        const parentDepth = await getParentDepth(parentId)

        // If parent already has 2 levels above it, this would be level 4
        if (parentDepth >= 2) {
          return 'Max 3 nivåer tillåtna'
        }

        return true
      },
    },
    // A slug is essential for clean URLs
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value) return value
            // Simple slug generation from name
            return data?.name
              ?.toLowerCase()
              ?.replace(/ /g, '-')
              ?.replace(/[^\w-]+/g, '') || ''
          },
        ],
      },
    },
    {
      name: 'fullPath',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Auto-computed hierarchical path (e.g., HR/Utveckling)',
      },
      hooks: {
        beforeChange: [
          async ({ data, req }) => {
            if (!data) return ''
            // Compute fullPath from parent chain
            const slug = data.slug || ''
            return await computeFullPath(data.parent, slug, req)
          },
        ],
      },
    },
    {
      name: 'createdBy',
      label: 'Skapad av',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ req, operation, value }) => {
            if (operation === 'create' && req.user) {
              return req.user.id
            }
            return value
          },
        ],
      },
    },
    {
      name: 'updatedBy',
      label: 'Senast uppdaterad av',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ req, value }) => {
            if (req.user) {
              return req.user.id
            }
            return value
          },
        ],
      },
    },
  ],
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        // Prevent deletion if department has children
        const children = await req.payload.find({
          collection: 'departments',
          where: {
            parent: { equals: id },
          },
          limit: 1,
        })

        if (children.docs.length > 0) {
          throw new Error(
            'Cannot delete department with subdepartments. Please delete all subdepartments first.',
          )
        }
      },
    ],
    afterChange: [
      async ({ doc, req, previousDoc }) => {
        // If slug changed, cascade update all children paths
        // (parent cannot change after creation)
        if (doc.slug !== previousDoc?.slug) {
          await cascadeUpdateChildrenPaths(doc.id, req)
        }
      },
    ],
  },
}
