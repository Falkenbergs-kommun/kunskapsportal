import type { CollectionConfig } from 'payload'

export const Departments: CollectionConfig = {
  slug: 'departments',
  access: {
    read: () => true, // Allow public read access
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
        description: 'Leave this empty if this is a top-level department. Maximum 3 levels allowed.',
      },
      // Prevent a department from being its own parent
      filterOptions: (({ id }: any) => {
        if (id) {
          return {
            id: {
              not_equals: id,
            },
          }
        }
        return undefined
      }) as any,
      // Validate that we don't exceed 3 levels of hierarchy
      validate: async (value: any, { req }: any) => {
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
}
