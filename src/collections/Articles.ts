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
      url: ({ data }) => `${process.env.PAYLOAD_URL || 'http://localhost:3000'}/preview/articles/${data.id}`,
    },
    defaultColumns: ['title', '_status', 'documentStatus', 'documentType', 'department', 'updatedAt'],
  },
  versions: {
    maxPerDoc: 50,
    drafts: true,
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
            req.payload.logger.info(`Auto-setting documentStatus to 'active' when publishing article`)
          }
          
          if (isBeingDrafted && data.documentStatus === 'active') {
            data.documentStatus = 'draft'
            req.payload.logger.info(`Auto-setting documentStatus to 'draft' when unpublishing article`)
          }
        }
        
        return data
      }
    ],
    afterChange: [
      async ({ doc, req, previousDoc, operation }) => {
        if (process.env.QDRANT_ENABLED !== 'true') {
          return
        }

        try {
          // Only embed documents that are:
          // 1. Published (not draft)
          // 2. Have 'active' document status
          const shouldEmbed = doc._status === 'published' && doc.documentStatus === 'active'
          
          if (shouldEmbed) {
            await embed(doc, req.payload.config)
            req.payload.logger.info(`Embedded published & active article ${doc.id} in Qdrant`)
          } else {
            // Remove from Qdrant if no longer published or not active
            const { deleteFromQdrant } = await import('../qdrant')
            await deleteFromQdrant(doc.id)
            
            const reason = doc._status !== 'published' ? 'unpublished' : 'not active'
            req.payload.logger.info(`Removed ${reason} article ${doc.id} from Qdrant`)
          }
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
      name: 'title',
      type: 'text',
      required: true,
    },
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
                  Field: '@/components/GenerateWithAIButton', // Direct component reference
                },
              },
            },
          ],
        },
        {
          label: 'Content',
          fields: [
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
              type: 'collapsible',
              label: 'Classification',
              fields: [
                {
                  name: 'documentType',
                  type: 'select',
                  required: false, // Made optional to avoid validation errors during AI content generation
                  options: [
                    { label: 'Policy', value: 'policy' },
                    { label: 'Procedure', value: 'procedure' },
                    { label: 'Regulation', value: 'regulation' },
                    { label: 'Guideline', value: 'guideline' },
                    { label: 'Decision', value: 'decision' },
                    { label: 'Report', value: 'report' },
                    { label: 'Template', value: 'template' },
                    { label: 'FAQ', value: 'faq' },
                  ],
                },
                {
                  name: 'department',
                  type: 'select',
                  required: false, // Made optional to avoid validation errors during AI content generation
                  options: [
                    { label: 'Kommunstyrelsen', value: 'municipal_board' },
                    { label: 'Tekniska förvaltningen', value: 'technical_services' },
                    { label: 'Socialförvaltningen', value: 'social_services' },
                    { label: 'Utbildningsförvaltningen', value: 'education' },
                    { label: 'Miljöförvaltningen', value: 'environment' },
                    { label: 'Byggförvaltningen', value: 'building_permits' },
                    { label: 'HR-avdelningen', value: 'human_resources' },
                  ],
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
                    description: 'Document status in municipal workflow. "Active" documents are embedded in the knowledge base for search. Publishing automatically sets status to "Active".'
                  }
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
                      type: 'url',
                      label: 'Legal Reference URL',
                    },
                  ],
                },
                {
                  name: 'gdprRelevant',
                  type: 'checkbox',
                  label: 'Contains Personal Data',
                },
                {
                  name: 'accessibilityCompliant',
                  type: 'checkbox',
                  label: 'WCAG 2.1 AA Compliant',
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
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Lifecycle Management',
              fields: [
                {
                  name: 'effectiveDate',
                  type: 'date',
                  label: 'Effective Date',
                },
                {
                  name: 'reviewDate',
                  type: 'date',
                  label: 'Next Review Date',
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
                },
                {
                  name: 'authorEmail',
                  type: 'email',
                  label: 'Author Email',
                },
                {
                  name: 'reviewer',
                  type: 'text',
                  label: 'Reviewer',
                },
                {
                  name: 'approver',
                  type: 'text',
                  label: 'Approver',
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
