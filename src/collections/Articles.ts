import type { CollectionConfig } from 'payload'
import { embed } from '../qdrant'
import { generateContentEndpoint } from '../endpoints/generateContent'
import { generateMetadataEndpoint } from '../endpoints/generateMetadata'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    preview: (doc) => {
      return `${process.env.PAYLOAD_URL || 'http://localhost:3000'}/preview/articles/${doc.id}`
    },
    livePreview: {
      url: ({ data }) => {
        const path = `${process.env.PAYLOAD_URL || 'http://localhost:3000'}/preview/articles/${data.id}`

        // Create the full URL to the draft API route
        const url = new URL(
          `${process.env.PAYLOAD_URL || 'http://localhost:3000'}/api/next/preview`,
        )
        url.searchParams.append('path', path)
        url.searchParams.append('collection', 'articles') //

        return url.toString()
      },
    },
    defaultColumns: [
      'title',
      '_status',
      'documentStatus',
      'documentType',
      'department',
      'updatedAt',
    ],
  },
  versions: {
    maxPerDoc: 50,
    drafts: {
      autosave: {
        interval: 1000,
      },
    },
  },
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Handle publish/draft integration with document status
        if (operation === 'update' || operation === 'create') {
          const isBeingPublished = data._status === 'published'
          const isBeingDrafted = data._status === 'draft'

          // Auto-set document status based on Payload's publish status
          if (isBeingPublished && (!data.documentStatus || data.documentStatus === 'draft')) {
            data.documentStatus = 'active'
            req.payload.logger.info(
              `Auto-setting documentStatus to 'active' when publishing article`,
            )
          }

          if (isBeingDrafted && data.documentStatus === 'active') {
            data.documentStatus = 'draft'
            req.payload.logger.info(
              `Auto-setting documentStatus to 'draft' when unpublishing article`,
            )
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, previousDoc, operation }) => {
        if (process.env.QDRANT_ENABLED !== 'true') {
          return
        }

        try {
          const isPublished = doc._status === 'published'
          const wasPublished = previousDoc?._status === 'published'

          // Condition 1: If the article is now published and active, embed it in Qdrant.
          // This handles both initial publishing and updates to already published articles.
          if (isPublished && doc.documentStatus === 'active') {
            await embed(doc, req.payload.config)
            req.payload.logger.info(`Embedded published & active article ${doc.id} in Qdrant`)
          }
          // Condition 2: If the article was published but is now not, remove it from Qdrant.
          // This handles the action of unpublishing a document.
          else if (wasPublished && !isPublished) {
            const { deleteFromQdrant } = await import('../qdrant')
            await deleteFromQdrant(doc.id)
            req.payload.logger.info(`Removed unpublished article ${doc.id} from Qdrant`)
          }
          // If neither of the above conditions is met (e.g., a draft is being autosaved),
          // we do nothing, leaving the Qdrant index untouched.
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error)
          req.payload.logger.error(
            `Failed to update article ${doc.id} in Qdrant. Reason: ${message}`,
          )
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        if (process.env.QDRANT_ENABLED !== 'true') {
          return
        }

        try {
          const { deleteFromQdrant } = await import('../qdrant')
          await deleteFromQdrant(doc.id)
          req.payload.logger.info(`Removed deleted article ${doc.id} from Qdrant`)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error)
          req.payload.logger.error(
            `Failed to remove deleted article ${doc.id} from Qdrant. Reason: ${message}`,
          )
        }
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Source',
          fields: [
            {
              name: 'source_documents',
              label: 'Source Documents',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              required: false,
              admin: {
                description: 'Upload documents to be used as a source for the content.',
              },
            },
            {
              name: 'generate_with_ai',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/GenerateWithAIButton',
                },
              },
            },
          ],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'coverPhoto',
              label: 'Cover Photo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'A cover photo for the article. Can be generated by AI.',
              },
            },
            {
              name: 'generate_cover_photo',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/GenerateCoverPhotoButton',
                },
              },
            },
            {
              name: 'content',
              type: 'richText',
            },
          ],
        },
        {
          label: 'Metadata',
          fields: [
            {
              name: 'generate_metadata',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/GenerateMetadataButton',
                },
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              admin: {},
            },
            {
              name: 'summary',
              type: 'textarea',
              label: 'Sammanfattning (AI-genererad)',
              admin: {
                description: 'En kort sammanfattning av dokumentets innehåll, genererad av AI.',
              },
            },
            {
              name: 'slug',
              type: 'text',
              unique: true,
              index: true,
              admin: {},
            },
            {
              type: 'collapsible',
              label: 'Klassificering', // Renamed to Swedish
              fields: [
                {
                  name: 'documentType',
                  label: 'Dokumenttyp', // Renamed to Swedish
                  type: 'select',
                  options: [
                    // UPDATED: New, Swedish-focused options
                    { label: 'Policy', value: 'policy' },
                    { label: 'Riktlinje', value: 'guideline' },
                    { label: 'Anvisning', value: 'instruction' },
                    { label: 'Plan', value: 'plan' },
                    { label: 'Protokoll', value: 'protocol' },
                    { label: 'Rapport', value: 'report' },
                    { label: 'Beslut', value: 'decision' },
                    { label: 'Avtal', value: 'agreement' },
                    { label: 'Mall', value: 'template' },
                    { label: 'FAQ', value: 'faq' },
                  ],
                  admin: {},
                },
                {
                  name: 'department',
                  label: 'Verksamhetsområde', // Renamed to Swedish
                  type: 'relationship',
                  relationTo: 'departments',
                  admin: {},
                },
                {
                  name: 'documentStatus',
                  type: 'select',
                  defaultValue: 'draft',
                  options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'Under Review', value: 'review' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Active (Published in Knowledge Base)', value: 'active' },
                    { label: 'Archived', value: 'archived' },
                    { label: 'Superseded', value: 'superseded' },
                  ],
                  admin: {
                    description:
                      'Document status in municipal workflow. "Active" documents are embedded in the knowledge base for search. Publishing automatically sets status to "Active".',
                  },
                },
                {
                  name: 'targetAudience',
                  type: 'select',
                  hasMany: true,
                  options: [
                    { label: 'Citizens', value: 'citizens' },
                    { label: 'Municipal Staff', value: 'staff' },
                    { label: 'Elected Officials', value: 'officials' },
                    { label: 'Businesses', value: 'businesses' },
                    { label: 'Other Municipalities', value: 'municipalities' },
                  ],
                  admin: {},
                },
                {
                  name: 'securityLevel',
                  type: 'select',
                  defaultValue: 'internal',
                  options: [
                    { label: 'Public', value: 'public' },
                    { label: 'Internal', value: 'internal' },
                    { label: 'Confidential', value: 'confidential' },
                    { label: 'Restricted', value: 'restricted' },
                  ],
                  admin: {},
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Legal & Compliance',
              fields: [
                {
                  name: 'legalBasis',
                  type: 'array',
                  fields: [
                    {
                      name: 'law',
                      type: 'text',
                      label: 'Law/Regulation',
                    },
                    {
                      name: 'chapter',
                      type: 'text',
                      label: 'Chapter/Section',
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: 'Legal Reference URL',
                    },
                  ],
                  admin: {},
                },
                {
                  name: 'gdprRelevant',
                  type: 'checkbox',
                  label: 'Contains Personal Data',
                  admin: {},
                },
                {
                  name: 'accessibilityCompliant',
                  type: 'checkbox',
                  label: 'WCAG 2.1 AA Compliant',
                  admin: {},
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Lifecycle Management',
              fields: [
                {
                  name: 'version',
                  type: 'text',
                  label: 'Document Version',
                  admin: {
                    description: 'Version number (e.g., 1.6, 2.0)',
                  },
                },
                {
                  name: 'effectiveDate',
                  type: 'date',
                  label: 'Date of Establishment (Datum för fastställelse)',
                  admin: {},
                },
                {
                  name: 'reviewDate',
                  type: 'date',
                  label: 'Next Review Date',
                },
                {
                  name: 'reviewInterval',
                  type: 'select',
                  label: 'Review Interval (Revideringsintervall)',
                  options: [
                    { label: 'As needed (Vid behov)', value: 'as_needed' },
                    { label: 'Annually (Årligen)', value: 'annual' },
                    { label: 'Every 2 years (Vartannat år)', value: 'biannual' },
                    { label: 'Every 3 years (Var tredje år)', value: 'triannual' },
                    { label: 'Every 5 years (Var femte år)', value: 'five_years' },
                  ],
                  defaultValue: 'as_needed',
                  admin: {},
                },
                {
                  name: 'appliesTo',
                  type: 'textarea',
                  label: 'Document Applies To (Dokumentet gäller för)',
                  admin: {
                    description:
                      'Organizations, departments, or activities this document covers (e.g., "Verksamheter som utför SoL, LSS, HSL")',
                  },
                },
                {
                  name: 'expiryDate',
                  type: 'date',
                  label: 'Expiry Date',
                },
                {
                  name: 'author',
                  type: 'text',
                  label: 'Author Name',
                  admin: {},
                },
                {
                  name: 'authorEmail',
                  type: 'email',
                  label: 'Author Email',
                  admin: {},
                },
                {
                  name: 'reviewer',
                  type: 'text',
                  label: 'Review Responsible (Revideringsansvarig)',
                  admin: {
                    description: 'Person or department responsible for reviewing this document',
                  },
                },
                {
                  name: 'approver',
                  type: 'text',
                  label: 'Approver',
                  admin: {},
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Content Organization',
              fields: [
                {
                  name: 'keywords',
                  type: 'array',
                  fields: [
                    {
                      name: 'keyword',
                      type: 'text',
                    },
                  ],
                  admin: {},
                },
                {
                  name: 'relatedDocuments',
                  type: 'relationship',
                  relationTo: 'articles',
                  hasMany: true,
                },
                {
                  name: 'language',
                  type: 'select',
                  defaultValue: 'sv',
                  options: [
                    { label: 'Svenska', value: 'sv' },
                    { label: 'English', value: 'en' },
                    { label: 'Lätt svenska', value: 'sv-simple' },
                  ],
                  admin: {},
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  endpoints: [generateContentEndpoint, generateMetadataEndpoint],
}
