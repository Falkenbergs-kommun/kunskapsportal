'use client'

import React, { useState } from 'react'
import { Button, useDocumentInfo } from '@payloadcms/ui'
import { generateContentFromDocuments } from '../app/(payload)/admin/[[...segments]]/actions'

const GenerateWithAIButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

  const handleClick = async () => {
    console.log('[AI Button] Clicked. Article ID:', id)
    if (!id) {
      console.log('[AI Button] No ID found, showing message.')
      setMessage('Please save the article first before generating content')
      return
    }

    setIsLoading(true)
    setMessage('🚀 Starting AI content generation...')
    console.log('[AI Button] Set loading to true.')

    try {
      console.log('[AI Button] Calling server action `generateContentFromDocuments`.')
      const result = await generateContentFromDocuments(id)
      console.log('[AI Button] Server action result:', result)

      if (result.success) {
        setMessage('✅ Content generated successfully! Refreshing page...')
        console.log('[AI Button] Success. Refreshing page.')
        // Optionally reload the page after a delay
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage(`❌ Error: ${result.message}`)
        console.error('[AI Button] Server action returned an error:', result.message)
      }
    } catch (error) {
      setMessage('❌ An unexpected client-side error occurred. See console for details.')
      console.error('[AI Button] An unexpected error occurred:', error)
    } finally {
      setIsLoading(false)
      console.log('[AI Button] Set loading to false.')
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
