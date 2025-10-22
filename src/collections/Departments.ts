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
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
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
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
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
        description: 'Leave this empty if this is a top-level department.',
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
  ],
}
