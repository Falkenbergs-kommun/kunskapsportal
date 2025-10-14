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
          if (isBeingPublished) {
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
            // Fetch the article with department relationship populated
            const articleWithDept = await req.payload.findByID({
              collection: 'articles',
              id: doc.id,
              depth: 2,
            })
            await embed(articleWithDept, req.payload.config, req.payload)
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
              required: false,
              validate: (value: unknown, { data }: { data: any }) => {
                // Only require title when publishing
                if (data?._status === 'published' && !value) {
                  return 'Title is required when publishing'
                }
                return true
              },
              admin: {
                description: 'Required when publishing',
              },
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
              required: false,
              validate: (value: unknown, { data }: { data: any }) => {
                // Only require slug when publishing
                if (data?._status === 'published' && !value) {
                  return 'Slug is required when publishing'
                }
                return true
              },
              admin: {
                description: 'Required when publishing',
              },
            },
            {
              name: 'coverPhoto',
              label: 'Cover Photo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'A cover photo for the article. Can be generated by AI based on the title and content.',
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
                  label: 'Dokumentstatus',
                  type: 'select',
                  defaultValue: 'draft',
                  options: [
                    { label: 'Utkast', value: 'draft' },
                    { label: 'Under granskning', value: 'review' },
                    { label: 'Godkänd', value: 'approved' },
                    { label: 'Aktiv (Publicerad i kunskapsdatabasen)', value: 'active' },
                    { label: 'Arkiverad', value: 'archived' },
                    { label: 'Ersatt', value: 'superseded' },
                  ],
                  admin: {
                    description:
                      'Dokumentets status i den kommunala arbetsflödet. "Aktiva" dokument bäddas in i kunskapsdatabasen för sökning. Publicering sätter automatiskt statusen till "Aktiv".',
                    condition: (data) => data._status !== 'published', // Hide when published to avoid confusion
                  },
                },
                {
                  name: 'targetAudience',
                  label: 'Målgrupp',
                  type: 'select',
                  hasMany: true,
                  options: [
                    { label: 'Medborgare', value: 'citizens' },
                    { label: 'Kommunanställda', value: 'staff' },
                    { label: 'Förtroendevalda', value: 'officials' },
                    { label: 'Företag', value: 'businesses' },
                    { label: 'Andra kommuner', value: 'municipalities' },
                  ],
                  admin: {},
                },
                {
                  name: 'securityLevel',
                  label: 'Säkerhetsnivå',
                  type: 'select',
                  defaultValue: 'internal',
                  options: [
                    { label: 'Offentlig', value: 'public' },
                    { label: 'Intern', value: 'internal' },
                    { label: 'Konfidentiell', value: 'confidential' },
                    { label: 'Begränsad', value: 'restricted' },
                  ],
                  admin: {},
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Juridik & Efterlevnad',
              fields: [
                {
                  name: 'legalBasis',
                  label: 'Rättslig grund',
                  type: 'array',
                  fields: [
                    {
                      name: 'law',
                      type: 'text',
                      label: 'Lag/Förordning',
                    },
                    {
                      name: 'chapter',
                      type: 'text',
                      label: 'Kapitel/Paragraf',
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: 'Länk till rättskälla',
                    },
                  ],
                  admin: {},
                },
                {
                  name: 'gdprRelevant',
                  type: 'checkbox',
                  label: 'Innehåller personuppgifter',
                  admin: {},
                },
                {
                  name: 'accessibilityCompliant',
                  type: 'checkbox',
                  label: 'Uppfyller WCAG 2.1 AA',
                  admin: {},
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Livscykelhantering',
              fields: [
                {
                  name: 'version',
                  type: 'text',
                  label: 'Dokumentversion',
                  admin: {
                    description: 'Versionsnummer (t.ex. 1.6, 2.0)',
                  },
                },
                {
                  name: 'effectiveDate',
                  type: 'date',
                  label: 'Datum för fastställelse',
                  admin: {},
                },
                {
                  name: 'reviewDate',
                  type: 'date',
                  label: 'Nästa granskningsdatum',
                },
                {
                  name: 'reviewInterval',
                  type: 'select',
                  label: 'Revideringsintervall',
                  options: [
                    { label: 'Vid behov', value: 'as_needed' },
                    { label: 'Årligen', value: 'annual' },
                    { label: 'Vartannat år', value: 'biannual' },
                    { label: 'Var tredje år', value: 'triannual' },
                    { label: 'Var femte år', value: 'five_years' },
                  ],
                  defaultValue: 'as_needed',
                  admin: {},
                },
                {
                  name: 'appliesTo',
                  type: 'textarea',
                  label: 'Dokumentet gäller för',
                  admin: {
                    description:
                      'Organisationer, avdelningar eller aktiviteter som detta dokument omfattar (t.ex. "Verksamheter som utför SoL, LSS, HSL")',
                  },
                },
                {
                  name: 'expiryDate',
                  type: 'date',
                  label: 'Giltig till',
                },
                {
                  name: 'author',
                  type: 'text',
                  label: 'Författare',
                  admin: {},
                },
                {
                  name: 'authorEmail',
                  type: 'email',
                  label: 'Författares e-post',
                  admin: {},
                },
                {
                  name: 'reviewer',
                  type: 'text',
                  label: 'Revideringsansvarig',
                  admin: {
                    description: 'Person eller avdelning ansvarig för att granska detta dokument',
                  },
                },
                {
                  name: 'approver',
                  type: 'text',
                  label: 'Godkännare',
                  admin: {},
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Innehållsorganisation',
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
                  label: 'Relaterade dokument',
                  type: 'relationship',
                  relationTo: 'articles',
                  hasMany: true,
                },
                {
                  name: 'language',
                  label: 'Språk',
                  type: 'select',
                  defaultValue: 'sv',
                  options: [
                    { label: 'Svenska', value: 'sv' },
                    { label: 'Engelska', value: 'en' },
                    { label: 'Lättläst svenska', value: 'sv-simple' },
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
