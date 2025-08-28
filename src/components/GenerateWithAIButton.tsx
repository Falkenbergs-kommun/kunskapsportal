// File: /Users/frej/Code/payload/knowledge-base/src/components/GenerateWithAIButton.tsx
'use client'

import React, { useState } from 'react'
import { Button, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { generateContentFromDocuments } from '../app/(payload)/admin/[[...segments]]/actions'

const GenerateWithAIButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

  // Use this hook to get the current value of the source_documents field
  const sourceDocuments = useFormFields(([fields]) => fields.source_documents?.value)

  const handleClick = async () => {
    setMessage('') // Clear previous messages

    // 1. Add a client-side check first for instant feedback
    const hasSourceDocuments = Array.isArray(sourceDocuments) && sourceDocuments.length > 0
    if (!hasSourceDocuments) {
      setMessage('❌ Please upload at least one source document before generating content.')
      return
    }

    if (!id) {
      setMessage('Please save the article first before generating content.')
      return
    }

    setIsLoading(true)
    setMessage('🚀 Starting AI content generation...')

    try {
      const result = await generateContentFromDocuments(String(id))

      if (result.success) {
        setMessage('✅ Content generated successfully! Refreshing page...')
        // Reload the page after a delay to show the new content
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        // Use the specific error message from the server
        setMessage(`❌ Error: ${result.message}`)
      }
    } catch (error) {
      setMessage('❌ An unexpected client-side error occurred. See console for details.')
      console.error('[AI Button] An unexpected error occurred:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #e1e5e9', borderRadius: '4px' }}>
      <p style={{ marginBottom: '1rem', fontSize: '14px', color: '#6c757d' }}>
        Generate article content from uploaded source documents using AI.
      </p>

      <Button buttonStyle="primary" onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate with AI'}
      </Button>

      {message && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.5rem',
            borderRadius: '4px',
            backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : '#721c24',
            fontSize: '14px',
          }}
        >
          {message}
        </div>
      )}
    </div>
  )
}

export default GenerateWithAIButton
