'use client'

import { useState } from 'react'
import { Search, FileText, Calendar, User, Building } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FavoriteStar } from '@/components/favorite-star'

const mockArticles = [
  {
    id: '1',
    title: 'Kommunens miljöpolicy',
    summary: 'Riktlinjer och mål för miljöarbete inom kommunen',
    author: 'Anna Andersson',
    updatedAt: '2024-01-15',
    documentType: 'Policy',
    url: '/ksf/miljo-policy'
  },
  {
    id: '2', 
    title: 'Budget 2024 - Investeringsplan',
    summary: 'Detaljerad plan för kommande års investeringar och prioriteringar',
    author: 'Erik Eriksson',
    updatedAt: '2023-12-10',
    documentType: 'Plan',
    url: '/ksf/budget-2024'
  },
  {
    id: '3',
    title: 'Personalhandboken',
    summary: 'Komplett guide för anställda inom kommunen',
    author: 'Maria Månsson',
    updatedAt: '2024-02-01',
    documentType: 'Handbook',
    url: '/ksf/personalhandbook'
  },
  {
    id: '4',
    title: 'Säkerhetsrutiner vid kris',
    summary: 'Procedurer och ansvarsfördelning vid olika typer av kriser',
    author: 'Lars Larsson',
    updatedAt: '2024-01-20',
    documentType: 'Procedure',
    url: '/ksf/sakerhetsrutiner'
  },
  {
    id: '5',
    title: 'Digital transformation strategi',
    summary: 'Färdplan för kommunens digitala utveckling fram till 2030',
    author: 'Sofia Svensson',
    updatedAt: '2024-01-08',
    documentType: 'Strategy',
    url: '/ksf/digital-strategi'
  }
]

interface DepartmentViewProps {
  departmentName: string
  departmentSlug?: string
}

export default function DepartmentView({ departmentName, departmentSlug }: DepartmentViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredArticles = mockArticles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.summary.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Department Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              {departmentName}
            </h1>
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
          <h2 className="text-xl font-semibold text-slate-900">
            Dokument och policies
          </h2>
          <span className="text-sm text-slate-500">
            {filteredArticles.length} dokument
          </span>
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
                          href={article.url} 
                          className="hover:text-blue-600 transition-colors"
                        >
                          {article.title}
                        </a>
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {article.summary}
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