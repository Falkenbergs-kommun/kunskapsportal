// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import {
  lexicalEditor,
  UploadFeature,
  HeadingFeature,
  ParagraphFeature,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  LinkFeature,
  UnorderedListFeature,
  OrderedListFeature,
  HorizontalRuleFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Articles } from './collections/Articles'
import { Departments } from './collections/Departments'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Falkenbergs kommun',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Articles, Departments],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      // Fixed toolbar at the top (like Microsoft Word)
      FixedToolbarFeature(),
      // Include all default features (includes undo/redo via Cmd+Z/Cmd+Shift+Z)
      ...defaultFeatures,
      // Add custom features
      // Table feature (experimental)
      EXPERIMENTAL_TableFeature(),
      // Upload feature for media
      UploadFeature({
        collections: {
          media: {
            // Configure which media collection to use
            fields: [
              {
                name: 'caption',
                type: 'text',
                label: 'Caption',
              },
            ],
          },
        },
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    push: process.env.NODE_ENV !== 'production' || process.env.DB_PUSH === 'true',
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
