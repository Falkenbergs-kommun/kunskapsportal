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
        description: 'Leave this empty if this is a top-level department.',
      },
      // Prevent a department from being its own parent
      filterOptions: ({ id }) => {
        if (id) {
          return {
            id: {
              not_equals: id,
            },
          }
        }
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
            return data.name
              .toLowerCase()
              .replace(/ /g, '-')
              .replace(/[^\w-]+/g, '')
          },
        ],
      },
    },
  ],
}
