import type { CollectionConfig } from 'payload'
import { embed } from '../qdrant'
import { generateContentEndpoint } from '../endpoints/generateContent'
import { generateMetadataEndpoint } from '../endpoints/generateMetadata'
import { canAccessDepartment, getAccessibleDepartmentIds } from '@/lib/access-control'

export const Articles: CollectionConfig = {
  slug: 'articles',
  access: {
    // Public read access for viewing
    read: () => true,

    // Only editors with department access can create
    create: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'superadmin') return true

      // Must have at least one department assigned
      return !!(user.departments && user.departments.length > 0)
    },

    // Can update if user has access to article's department
    update: async ({ req, id }) => {
      const user = req.user
      if (!user) return false
      if (user.role === 'superadmin') return true
      if (!id) return false

      // Fetch article to check its department
      const article = await req.payload.findByID({
        collection: 'articles',
        id,
        depth: 1,
      })

      if (!article?.department) {
        // Articles without departments can be edited by any editor
        return true
      }

      const deptPath = typeof article.department === 'object' ? article.department.fullPath : null

      if (!deptPath) return false

      return canAccessDepartment(user, deptPath)
    },

    // Only superadmins can delete
    delete: ({ req: { user } }) => {
      return user?.role === 'superadmin'
    },
  },
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
              type: 'textarea',
              admin: {
                components: {
                  Field: '@/components/ToastUIEditor',
                },
              },
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
              label: 'Sammanfattning',
              admin: {
                description: 'En kort sammanfattning av dokumentets innehåll.',
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
                    { label: 'Rutin', value: 'routine' },
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
                  // Filter departments based on user access
                  filterOptions: async ({ req }) => {
                    const user = req.user
                    if (!user) return { id: { equals: 'none' } }
                    if (user.role === 'superadmin') return true

                    const accessibleIds = await getAccessibleDepartmentIds(user, req.payload)
                    return {
                      id: { in: accessibleIds },
                    }
                  },
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
                  access: {
                    update: ({ doc }) => {
                      // Prevent updates when article is published
                      return doc?._status !== 'published'
                    },
                  },
                  admin: {
                    description:
                      'Dokumentets status i den kommunala arbetsflödet. "Aktiva" dokument bäddas in i kunskapsdatabasen för sökning. Publicering sätter automatiskt statusen till "Aktiv". För att ändra status måste artikeln först avpubliceras.',
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
                  label: 'Informationsklass',
                  type: 'select',
                  defaultValue: 'internal',
                  options: [
                    { label: 'Klass 0 – Öppen information', value: 'public' },
                    { label: 'Klass 1 – Allmän information', value: 'internal' },
                    { label: 'Klass 2 – Känslig information', value: 'confidential' },
                    { label: 'Klass 3 – Skyddsvärd information', value: 'restricted' },
                  ],
                  validate: (value: unknown, { data }: { data: any }) => {
                    // Block publishing of class 2-3 documents
                    if (data?._status === 'published') {
                      if (value === 'confidential' || value === 'restricted') {
                        return 'Dokument med informationsklass 2-3 kan inte publiceras i detta system. Systemet är endast godkänt för Öppen (0) och Allmän (1) information enligt GDPR-konsekvensbedömning. För känslig eller skyddsvärd information, använd annat godkänt system.'
                      }
                    }
                    return true
                  },
                  admin: {
                    description:
                      'VIKTIGT: Endast klass 0 och 1 kan publiceras i systemet. Klass 2-3 kräver andra godkända system med högre säkerhetsnivå.',
                  },
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
                  admin: {
                    description:
                      'Kan dokumentet skrivas utan personuppgifter? Använd helst roller/funktioner istället för namn för att minimera personuppgiftsbehandling.',
                  },
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
            {
              type: 'collapsible',
              label: 'Systemfält',
              admin: {
                initCollapsed: true,
              },
              fields: [
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
            },
          ],
        },
      ],
    },
  ],
  endpoints: [generateContentEndpoint, generateMetadataEndpoint],
}
