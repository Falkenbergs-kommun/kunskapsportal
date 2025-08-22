'use client'
import { useState } from 'react'
import { Calendar, Building, FileText, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FavoriteStar } from '@/components/favorite-star'
import { Article } from '@/payload-types'

const documentTypeLabels: Record<string, string> = {
  policy: 'Policy',
  procedure: 'Procedur',
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500',
  draft: 'bg-amber-500',
}

export default function ArticleDisplay({ article }: { article: Article | null }) {
  const [showMetadata, setShowMetadata] = useState(false)

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Ej angivet'
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const renderContent = (content: any) => {
    if (!content || !content.root || !content.root.children) return null

    return content.root.children.map((node: any, index: number) => {
      switch (node.type) {
        case 'heading':
          const HeadingTag = node.tag as keyof React.JSX.IntrinsicElements
          const level = parseInt(node.tag.replace('h', ''))
          return (
            <HeadingTag
              key={index}
              className={cn(
                'font-bold text-slate-900 mb-4',
                level === 2 && 'text-2xl mt-8',
                level === 3 && 'text-xl mt-6',
                level === 4 && 'text-lg mt-4',
              )}
            >
              {node.children?.[0]?.text || ''}
            </HeadingTag>
          )
        case 'paragraph':
          return (
            <p key={index} className="text-slate-700 leading-relaxed mb-4">
              {node.children?.[0]?.text || ''}
            </p>
          )
        case 'upload':
          const { value } = node
          if (value && typeof value === 'object' && 'url' in value) {
            return (
              <div className="my-4">
                <img
                  src={value.url as string}
                  alt={value.alt as string}
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            )
          }
          return null
        default:
          return null
      }
    })
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center">
        <p className="text-slate-500">Article not found.</p>
      </div>
    )
  }

  return (
    <article className="max-w-4xl mx-auto px-6 py-8" data-testid="article-view">
      {article.coverPhoto && typeof article.coverPhoto === 'object' && article.coverPhoto.url && (
        <div className="mb-8">
          <img
            src={article.coverPhoto.url}
            alt={article.title}
            className="w-full h-64 object-cover rounded-xl shadow-sm"
            data-testid="img-article-header"
          />
        </div>
      )}

      <header className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-4xl font-bold text-slate-900 flex-1" data-testid="text-article-title">
            {article.title}
          </h1>
          <FavoriteStar title={article.title} emoji="📄" className="ml-4 mt-1" />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {article.department && (
            <div className="flex items-center space-x-2">
              <Building className="text-blue-600" size={16} />
              <span data-testid="text-department">
                {typeof article.department === 'object' && article.department.name}
              </span>
            </div>
          )}

          {article.documentType && (
            <div className="flex items-center space-x-2">
              <FileText className="text-emerald-600" size={16} />
              <span data-testid="text-document-type">
                {article.documentType &&
                  (documentTypeLabels[article.documentType] || article.documentType)}
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

      <div className="prose prose-slate max-w-none mb-12" data-testid="article-content">
        {renderContent(article.content)}
      </div>

      {article.source_documents &&
        Array.isArray(article.source_documents) &&
        article.source_documents.length > 0 && (
          <div className="border-t border-slate-200 pt-8" data-testid="source-documents">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Källdokument och referenser
            </h3>
            <div className="flex flex-col space-y-2">
              {article.source_documents.map((doc: any, index: number) => {
                if (typeof doc === 'number') return null
                const fileExtension = doc.filename?.split('.').pop()?.toUpperCase()
                return (
                  <a
                    key={index}
                    href={doc.url || ''}
                    className="inline-flex items-center text-blue-600 hover:underline"
                    data-testid={`link-source-doc-${index}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2" size={16} />
                    <span>
                      {doc.filename}
                      {fileExtension && (
                        <span className="text-gray-500 ml-2">[{fileExtension}]</span>
                      )}
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        )}
    </article>
  )
}
