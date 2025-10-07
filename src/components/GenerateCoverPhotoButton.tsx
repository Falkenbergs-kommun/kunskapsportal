'use client'
import { useDocumentInfo, Button } from '@payloadcms/ui'
import { useState } from 'react'
import { generateCoverPhoto } from '../app/(payload)/admin/[[...segments]]/actions'

const GenerateCoverPhotoButton = () => {
  const { id } = useDocumentInfo()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleGenerate = async () => {
    if (!id) {
      setError('Please save the article first.')
      return
    }

    setIsGenerating(true)
    setError('')
    setSuccess('')

    try {
      const result = await generateCoverPhoto(id.toString())

      if (result.success) {
        setSuccess('Cover photo generated! Reloading to show the new image...')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('Error generating cover photo:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate cover photo.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      style={{
        marginBottom: '20px',
        marginTop: '20px',
        padding: '16px',
        border: '1px solid #e1e5e9',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : '🎨 Generate Cover Photo with AI'}
        </Button>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>Powered by Imagen4</span>
      </div>

      {error && (
        <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '8px' }}>Error: {error}</div>
      )}

      {success && (
        <div style={{ color: '#28a745', fontSize: '14px', marginTop: '8px' }}>✅ {success}</div>
      )}

      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
        This will generate an abstract background image based on the article&apos;s title and the first
        few sections of its content, then set it as the cover photo.
      </div>
    </div>
  )
}

export default GenerateCoverPhotoButton
