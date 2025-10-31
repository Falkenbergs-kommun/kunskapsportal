'use client'

import React, { useCallback, useRef } from 'react'
import { useField } from '@payloadcms/ui'
import type { TextareaFieldClientComponent } from 'payload'
import dynamic from 'next/dynamic'
import type { Editor as ToastEditor } from '@toast-ui/react-editor'

// Import Toast UI Editor dynamically to avoid SSR issues
const Editor = dynamic(() => import('@toast-ui/react-editor').then((m) => m.Editor), {
  ssr: false,
  loading: () => <div style={{ padding: '20px' }}>Loading editor...</div>,
})

// Import CSS
import '@toast-ui/editor/dist/toastui-editor.css'

const ToastUIEditor: TextareaFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })
  const editorRef = useRef<ToastEditor>(null)

  const handleChange = useCallback(() => {
    const editor = editorRef.current?.getInstance()
    if (editor) {
      const markdown = editor.getMarkdown()
      setValue(markdown)
    }
  }, [setValue])

  // Custom image upload handler
  const handleImageUpload = useCallback(async (file: File, callback: (url: string, altText: string) => void) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const result = await response.json()
      const imageUrl = result.doc.url || ''

      // Call the callback with the image URL
      callback(imageUrl, file.name)
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload image. Please try again.')
    }
  }, [])

  // Get the label as a string, handling both string and object types
  const labelText =
    typeof field?.label === 'string' ? field.label : field?.name || 'Content'

  return (
    <div className="toastui-editor-wrapper">
      <div style={{ marginBottom: '10px', fontWeight: '500', fontSize: '13px' }}>
        {labelText}
        {field?.required && <span style={{ color: 'red' }}> *</span>}
      </div>
      <div className="toastui-editor-container">
        <Editor
          ref={editorRef}
          initialValue={value || ''}
          previewStyle="vertical"
          height="600px"
          initialEditType="wysiwyg"
          useCommandShortcut={true}
          usageStatistics={false}
          extendedAutolinks={true}
          toolbarItems={[
            ['heading', 'bold', 'italic'],
            ['ul', 'ol'],
            ['image', 'link'],
            ['table'],
          ]}
          onChange={handleChange}
          hooks={{
            addImageBlobHook: handleImageUpload,
          }}
          customHTMLRenderer={{
            htmlBlock: {
              br() {
                return [{ type: 'openTag', tagName: 'br', selfClose: true }]
              },
            },
          }}
        />
      </div>
      <style jsx global>{`
        .toastui-editor-wrapper {
          margin-bottom: 20px;
        }

        .toastui-editor-container {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* Override default Toast UI styles for better appearance */
        .toastui-editor-wrapper .toastui-editor-defaultUI {
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }

        .toastui-editor-wrapper .toastui-editor-toolbar {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 6px 8px;
        }

        .toastui-editor-wrapper .toastui-editor-toolbar button {
          border-radius: 4px;
          margin: 2px;
          padding: 6px 10px;
        }

        .toastui-editor-wrapper .toastui-editor-toolbar button:hover {
          background: #f3f4f6;
        }

        /* Make image and link buttons more prominent */
        .toastui-editor-wrapper .toastui-editor-toolbar button[aria-label*='Image'],
        .toastui-editor-wrapper .toastui-editor-toolbar button[aria-label*='Link'] {
          background: #eff6ff;
          border: 1px solid #3b82f6;
          font-weight: 600;
        }

        .toastui-editor-wrapper .toastui-editor-toolbar button[aria-label*='Image']:hover,
        .toastui-editor-wrapper .toastui-editor-toolbar button[aria-label*='Link']:hover {
          background: #dbeafe;
          border-color: #2563eb;
        }

        .toastui-editor-wrapper .toastui-editor-mode-switch {
          border-radius: 4px;
          overflow: hidden;
        }

        .toastui-editor-wrapper .toastui-editor-mode-switch .tab-item {
          background: #f9fafb;
          border: none;
          padding: 8px 16px;
        }

        .toastui-editor-wrapper .toastui-editor-mode-switch .tab-item.active {
          background: #3b82f6;
          color: white;
          font-weight: 600;
        }

        /* WYSIWYG content styling */
        .toastui-editor-wrapper .toastui-editor-contents {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica',
            'Arial', sans-serif;
          font-size: 16px;
          line-height: 1.8;
          color: #1f2937;
          padding: 24px;
        }

        .toastui-editor-wrapper .toastui-editor-contents h1 {
          font-size: 2.25em;
          font-weight: 700;
          margin-top: 24px;
          margin-bottom: 16px;
          color: #111827;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .toastui-editor-wrapper .toastui-editor-contents h2 {
          font-size: 1.75em;
          font-weight: 600;
          margin-top: 20px;
          margin-bottom: 12px;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 6px;
        }

        .toastui-editor-wrapper .toastui-editor-contents h3 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 16px;
          margin-bottom: 8px;
          color: #374151;
        }

        .toastui-editor-wrapper .toastui-editor-contents p {
          margin-bottom: 16px;
          line-height: 1.8;
        }

        .toastui-editor-wrapper .toastui-editor-contents strong {
          font-weight: 600;
          color: #111827;
        }

        .toastui-editor-wrapper .toastui-editor-contents em {
          font-style: italic;
          color: #374151;
        }

        .toastui-editor-wrapper .toastui-editor-contents a {
          color: #2563eb;
          text-decoration: underline;
        }

        .toastui-editor-wrapper .toastui-editor-contents ul,
        .toastui-editor-wrapper .toastui-editor-contents ol {
          margin-left: 24px;
          margin-bottom: 16px;
        }

        .toastui-editor-wrapper .toastui-editor-contents li {
          margin-bottom: 8px;
        }

        .toastui-editor-wrapper .toastui-editor-contents blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 16px;
          margin-left: 0;
          margin-right: 0;
          color: #4b5563;
          font-style: italic;
          background: #f8fafc;
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .toastui-editor-wrapper .toastui-editor-contents code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 0.9em;
          color: #dc2626;
        }

        .toastui-editor-wrapper .toastui-editor-contents pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin-bottom: 16px;
        }

        .toastui-editor-wrapper .toastui-editor-contents pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }

        .toastui-editor-wrapper .toastui-editor-contents img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .toastui-editor-wrapper .toastui-editor-contents table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }

        .toastui-editor-wrapper .toastui-editor-contents th,
        .toastui-editor-wrapper .toastui-editor-contents td {
          border: 1px solid #d1d5db;
          padding: 12px;
          text-align: left;
        }

        .toastui-editor-wrapper .toastui-editor-contents th {
          background: #f3f4f6;
          font-weight: 600;
        }

        .toastui-editor-wrapper .toastui-editor-contents hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 32px 0;
        }

        /* Markdown mode styling */
        .toastui-editor-wrapper .toastui-editor-md-container .toastui-editor {
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
        }

        /* Preview pane styling */
        .toastui-editor-wrapper .toastui-editor-md-preview {
          background: #ffffff;
        }

        /* Selection */
        .toastui-editor-wrapper .ProseMirror-selectednode {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

export default ToastUIEditor
