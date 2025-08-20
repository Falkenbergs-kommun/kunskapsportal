'use client'
import { useState } from 'react'
import {
  Calendar,
  Building,
  FileText,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const mockArticle = {
  id: '12345',
  title: 'Example Article Title',
  headerImage: 'https://via.placeholder.com/1024x400.png/ddd/999?text=Header+Image',
  department: 'municipal_board',
  documentType: 'policy',
  updatedAt: '2023-10-27T10:00:00.000Z',
  documentStatus: 'active',
  version: '2.1',
  author: 'John Doe',
  approver: 'Jane Smith',
  effectiveDate: '2023-11-01T00:00:00.000Z',
  reviewDate: '2024-10-27T10:00:00.000Z',
  tldr: 'This is a short summary of the article content, explaining the main points in a concise way for quick understanding.',
  content: {
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Introduction' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This is the first paragraph of the article. It provides an overview of the topic and sets the stage for the content that follows.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'A Deeper Dive' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This section goes into more detail about the subject matter, exploring various facets and providing in-depth analysis.',
          },
        ],
      },
    ],
  },
  sourceDocuments: [
    {
      title: 'Related Policy Document.pdf',
      url: '#',
      type: 'pdf',
      size: '1.2 MB',
    },
    {
      title: 'External Reference Link',
      url: '#',
      type: 'docx',
      size: '340 KB',
    },
  ],
}

const documentTypeLabels: Record<string, string> = {
  policy: 'Policy',
  procedure: 'Procedur',
}

const departmentLabels: Record<string, string> = {
  municipal_board: 'Kommunstyrelsen',
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500',
  draft: 'bg-amber-500',
}

export default function ArticleView() {
  const [showMetadata, setShowMetadata] = useState(false)
  const article = mockArticle

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Ej angivet'
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const renderContent = (content: any) => {
    if (!content || !content.content) return null

    return content.content.map((node: any, index: number) => {
      switch (node.type) {
        case 'heading':
          const HeadingTag = `h${node.attrs.level}` as keyof JSX.IntrinsicElements
          return (
            <HeadingTag
              key={index}
              className={cn(
                'font-bold text-slate-900 mb-4',
                node.attrs.level === 2 && 'text-2xl mt-8',
                node.attrs.level === 3 && 'text-xl mt-6',
                node.attrs.level === 4 && 'text-lg mt-4',
              )}
            >
              {node.content?.[0]?.text || ''}
            </HeadingTag>
          )
        case 'paragraph':
          return (
            <p key={index} className="text-slate-700 leading-relaxed mb-4">
              {node.content?.[0]?.text || ''}
            </p>
          )
        default:
          return null
      }
    })
  }

  return (
    <article className="max-w-4xl mx-auto px-6 py-8" data-testid="article-view">
      {article.headerImage && (
        <div className="mb-8">
          <img
            src={article.headerImage}
            alt={article.title}
            className="w-full h-64 object-cover rounded-xl shadow-sm"
            data-testid="img-article-header"
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-4" data-testid="text-article-title">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {article.department && (
            <div className="flex items-center space-x-2">
              <Building className="text-blue-600" size={16} />
              <span data-testid="text-department">
                {departmentLabels[article.department] || article.department}
              </span>
            </div>
          )}

          {article.documentType && (
            <div className="flex items-center space-x-2">
              <FileText className="text-emerald-600" size={16} />
              <span data-testid="text-document-type">
                {documentTypeLabels[article.documentType] || article.documentType}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Calendar className="text-amber-600" size={16} />
            <span data-testid="text-updated-date">Uppdaterad {formatDate(article.updatedAt)}</span>
          </div>

          {article.documentStatus && (
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  statusColors[article.documentStatus] || 'bg-gray-500',
                )}
              ></div>
              <span
                className={cn(
                  'font-medium capitalize',
                  article.documentStatus === 'active' && 'text-emerald-600',
                )}
                data-testid="text-document-status"
              >
                {article.documentStatus === 'active' ? 'Aktiv' : article.documentStatus}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => setShowMetadata(!showMetadata)}
          className="w-full justify-between p-4 h-auto bg-slate-50 hover:bg-slate-100"
          data-testid="button-toggle-metadata"
        >
          <span className="font-medium text-slate-900">Visa fullständig metadata</span>
          {showMetadata ? (
            <ChevronDown className="text-slate-400" size={16} />
          ) : (
            <ChevronRight className="text-slate-400" size={16} />
          )}
        </Button>

        {showMetadata && (
          <div
            className="mt-4 p-4 bg-white border border-slate-200 rounded-lg"
            data-testid="metadata-content"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Dokument-ID</label>
                <span className="text-slate-900">{article.id}</span>
              </div>
              {article.version && (
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Version</label>
                  <span className="text-slate-900">{article.version}</span>
                </div>
              )}
              {article.author && (
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Skapad av</label>
                  <span className="text-slate-900">{article.author}</span>
                </div>
              )}
              {article.approver && (
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Godkänd av</label>
                  <span className="text-slate-900">{article.approver}</span>
                </div>
              )}
              {article.effectiveDate && (
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Ikraftträdande</label>
                  <span className="text-slate-900">{formatDate(article.effectiveDate)}</span>
                </div>
              )}
              {article.reviewDate && (
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Nästa granskning</label>
                  <span className="text-slate-900">{formatDate(article.reviewDate)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {article.tldr && (
        <div
          className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl"
          data-testid="tldr-section"
        >
          <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <Lightbulb className="mr-2" size={20} />
            Sammanfattning (TLDR)
          </h2>
          <p className="text-blue-800 leading-relaxed">{article.tldr}</p>
        </div>
      )}

      <div className="prose prose-slate max-w-none mb-12" data-testid="article-content">
        {renderContent(article.content)}
      </div>

      {article.sourceDocuments && article.sourceDocuments.length > 0 && (
        <div className="border-t border-slate-200 pt-8" data-testid="source-documents">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Källdokument och referenser</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {article.sourceDocuments.map((doc, index) => {
              const getFileIcon = (type: string) => {
                switch (type.toLowerCase()) {
                  case 'pdf':
                    return '📄'
                  case 'docx':
                  case 'doc':
                    return '📘'
                  case 'xlsx':
                  case 'xls':
                    return '📊'
                  default:
                    return '📄'
                }
              }

              return (
                <a
                  key={index}
                  href={doc.url}
                  className="flex items-center p-4 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors group"
                  data-testid={`link-source-doc-${index}`}
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-3 text-lg">
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.type.toUpperCase()}
                      {doc.size && ` • ${doc.size}`}
                    </p>
                  </div>
                  <ExternalLink className="text-slate-400 group-hover:text-blue-600" size={16} />
                </a>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}
