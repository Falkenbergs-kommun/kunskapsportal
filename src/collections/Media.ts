import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'documentType',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Automatically detected document type',
      },
    },
    {
      name: 'conversionStatus',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'No conversion needed', value: 'none' },
        { label: 'Conversion pending', value: 'pending' },
        { label: 'Conversion successful', value: 'success' },
        { label: 'Conversion failed', value: 'failed' },
      ],
      admin: {
        readOnly: true,
        description: 'Status of document conversion to PDF',
      },
    },
    {
      name: 'conversionError',
      type: 'text',
      admin: {
        readOnly: true,
        condition: (data) => data.conversionStatus === 'failed',
      },
    },
  ],
  upload: {
    mimeTypes: [
      // Images
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',

      // PDF documents
      'application/pdf',

      // Word documents
      'application/msword', // .doc
      'application/x-cfb', // .doc (alternative MIME type detection)
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

      // PowerPoint presentations
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

      // Excel spreadsheets (for data documents)
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx

      // Text files
      'text/plain', // .txt
    ],
  },
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // NY LOGIK: Fyll i 'alt'-text från filnamnet vid uppladdning
        if (operation === 'create' && !data.alt && data.filename) {
          // Ta bort filändelsen från filnamnet
          const filenameWithoutExt = data.filename.split('.').slice(0, -1).join('.')
          // Ersätt bindestreck och understreck med mellanslag för läsbarhet
          const readableName = filenameWithoutExt.replace(/[-_]/g, ' ')
          data.alt = readableName
        }

        if (operation === 'create' || operation === 'update') {
          // Befintlig logik för att hantera dokumenttyp och konverteringsstatus
          if (data.mimeType) {
            const { documentConverter } = await import('../services/documentConverter')
            data.documentType = documentConverter.getDocumentTypeName(data.mimeType)

            const shouldConvert = documentConverter.needsConversion(data.mimeType, true)
            if (shouldConvert) {
              data.conversionStatus = 'pending'
            } else {
              data.conversionStatus = 'none'
            }
          }
        }
        return data
      },
    ],
  },
}
