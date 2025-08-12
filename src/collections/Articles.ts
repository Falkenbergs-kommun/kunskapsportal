import type { CollectionConfig } from 'payload'
import { embed } from '../qdrant'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        await embed(doc, req.payload.config)
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'content',
              type: 'richText',
            },
            {
              name: 'source_documents',
              type: 'upload',
              relationTo: 'media',
              required: false,
              admin: {
                description: 'Upload documents to be used as a source for the content.',
              },
            },
          ],
        },
        {
          label: 'Metadata',
          fields: [
            {
              name: 'meta',
              type: 'group',
              fields: [
                {
                  name: 'author',
                  type: 'text',
                },
                {
                  name: 'publishedDate',
                  type: 'date',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
