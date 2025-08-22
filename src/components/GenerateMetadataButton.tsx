'use client'
import { useFormFields } from '@payloadcms/ui'
import { Button } from '@payloadcms/ui'
import { useState } from 'react'

const GenerateMetadataButton = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Try to get form data, but don't rely on it
  const dispatchFields = useFormFields(([fields, dispatch]) => dispatch)

  const handleGenerateMetadata = async () => {
    // Get article ID from URL path
    const path = window.location.pathname
    const articleIdMatch = path.match(/\/admin\/collections\/articles\/(\d+)/)
    const articleId = articleIdMatch ? articleIdMatch[1] : null

    console.log('Debug - articleId from URL:', articleId)

    if (!articleId) {
      setError('Could not determine article ID')
      return
    }

    setIsGenerating(true)
    setError('')
    setSuccess('')

    try {
      // Fetch current article data to validate it has title and content
      console.log('Fetching article data to validate...')
      const articleResponse = await fetch(`/api/articles/${articleId}?depth=0`)
      if (!articleResponse.ok) {
        throw new Error('Failed to fetch article data')
      }
      const articleData = await articleResponse.json()

      console.log('Article data:', articleData)

      if (!articleData.title) {
        setError('Article must have a title before generating metadata')
        return
      }

      if (!articleData.content) {
        setError('Article must have content before generating metadata')
        return
      }

      // Call the metadata generation API
      const response = await fetch(`/api/generate-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: articleId }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const { article } = await response.json()
      console.log('Updated article:', article)

      // Try to update form fields with generated metadata
      // Always reload the page to ensure all fields, especially relationships, are updated correctly.
      setSuccess('Metadata generated successfully! Refreshing page to display updates...')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      console.error('Error generating metadata:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate metadata')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      style={{
        marginBottom: '20px',
        padding: '16px',
        border: '1px solid #e1e5e9',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Button onClick={handleGenerateMetadata} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : '✨ Generate Metadata with AI'}
        </Button>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>Powered by Gemini 2.5 Flash</span>
      </div>

      {error && (
        <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '8px' }}>Error: {error}</div>
      )}

      {success && (
        <div style={{ color: '#28a745', fontSize: '14px', marginTop: '8px' }}>✅ {success}</div>
      )}

      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
        This will analyze your content and automatically populate metadata fields based on Swedish
        municipal standards.
      </div>
    </div>
  )
}

export default GenerateMetadataButton
