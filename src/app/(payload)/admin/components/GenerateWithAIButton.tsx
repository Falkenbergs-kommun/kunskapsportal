import React from 'react'
import { useFormFields, useField } from 'payload/dist/admin'

const GenerateWithAIButton: React.FC<{ path: string }> = ({ path }) => {
  const { value: content, setValue } = useField<string>({ path: 'content' })
  const { value: sourceDocuments } = useFormFields(([fields]) => fields.source_documents) || {}

  const handleClick = async () => {
    if (!sourceDocuments) {
      alert('Please upload source documents first.')
      return
    }

    // Mocking the Gemini flow
    alert('Sending documents to Gemini for processing...')
    console.log('Mocking Gemini flow with documents:', sourceDocuments)
    // In a real implementation, you would send the files to a backend endpoint
    // that communicates with the Gemini API and then updates the content field.
    setValue('New content from AI')
  }

  return (
    <div>
      <button type="button" onClick={handleClick} className="btn btn--style-primary">
        Generate with AI
      </button>
    </div>
  )
}

export default GenerateWithAIButton
