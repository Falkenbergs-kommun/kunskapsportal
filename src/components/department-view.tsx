'use client'

import { useState } from 'react'
import { Search, FileText, Calendar, User, Building } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FavoriteStar } from '@/components/favorite-star'

import { Article, Department } from '@/payload-types'

// Helper function to recursively build the full path of a department
const getDepartmentFullPath = (department: Department | number | null): string => {
  if (!department || typeof department === 'number') {
    return ''
  }

  // Recursively get the parent's path and append the current slug
  const parentPath = getDepartmentFullPath(department.parent || null)
  return parentPath ? `${parentPath}/${department.slug}` : department.slug || ''
}

interface DepartmentViewProps {
  departmentName: string
  departmentSlug?: string
  articles: Article[]
}

export default function DepartmentView({
  departmentName,
  departmentSlug,
  articles,
}: DepartmentViewProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      {/* Department Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{departmentName}</h1>
            <div className="flex items-center text-sm text-slate-600">
              <Building className="mr-2 h-4 w-4" />
              <span>Avdelning</span>
            </div>
          </div>
          <FavoriteStar
            title={departmentName}
            url={departmentSlug}
            emoji="🏢"
            className="ml-4 mt-1"
          />
        </div>
      </header>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Sök dokument och policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Dokument och policies</h2>
          <span className="text-sm text-slate-500">{filteredArticles.length} dokument</span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-500">Inga dokument hittades för "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        <a
                          href={`/${getDepartmentFullPath(article.department || null)}/${
                            article.slug
                          }`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {article.title}
                        </a>
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {/* {article.summary} */}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-4 shrink-0">
                      {article.documentType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center">
                      <User className="mr-1 h-3 w-3" />
                      {article.author}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(article.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
