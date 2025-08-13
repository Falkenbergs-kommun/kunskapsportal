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
        description: 'Automatically detected document type'
      }
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
        description: 'Status of document conversion to PDF'
      }
    },
    {
      name: 'conversionError',
      type: 'text',
      admin: {
        readOnly: true,
        condition: (data) => data.conversionStatus === 'failed'
      }
    }
  ],
  upload: {
    mimeTypes: [
      // PDF documents
      'application/pdf',
      
      // Word documents  
      'application/msword', // .doc
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
        if (operation === 'create' || operation === 'update') {
          // Set document type based on MIME type
          if (data.mimeType) {
            const { documentConverter } = await import('../services/documentConverter')
            data.documentType = documentConverter.getDocumentTypeName(data.mimeType)
            
            // Set initial conversion status (prefer Mistral OCR = convert Office docs to PDF)
            const shouldConvert = documentConverter.needsConversion(data.mimeType, true)
            if (shouldConvert) {
              data.conversionStatus = 'pending'
            } else {
              data.conversionStatus = 'none'
            }
          }
        }
        return data
      }
    ]
  }
}
