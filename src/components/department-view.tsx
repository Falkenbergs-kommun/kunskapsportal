'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, FileText, Calendar, User, Building, ChevronRight, ArrowUpDown, Loader2, Sparkles, AlignLeft, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemFooter,
} from '@/components/ui/item'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FavoriteStar } from '@/components/favorite-star'
import { getDepartmentFullPath } from '@/lib/utils'

import { Article, Department } from '@/payload-types'

const documentTypeLabels: Record<string, string> = {
  policy: 'Policy',
  guideline: 'Riktlinje',
  instruction: 'Anvisning',
  plan: 'Plan',
  protocol: 'Protokoll',
  report: 'Rapport',
  decision: 'Beslut',
  agreement: 'Avtal',
  template: 'Mall',
  faq: 'FAQ',
}

interface SubdepartmentWithCount extends Department {
  articleCount: number
}

interface DepartmentViewProps {
  departmentName: string
  departmentSlug?: string
  departmentId: string
  articles: Article[]
  totalArticles: number
  subdepartments?: SubdepartmentWithCount[]
}

type SortOption = '-updatedAt' | 'updatedAt' | 'title' | '-title'
type SearchMode = 'hybrid' | 'semantic' | 'exact'

export default function DepartmentView({
  departmentName,
  departmentSlug,
  departmentId,
  articles: initialArticles,
  totalArticles,
  subdepartments = [],
}: DepartmentViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid')
  const [sortBy, setSortBy] = useState<SortOption>('-updatedAt')
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([])
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Article[] | null>(null)
  const [searchResultsTotal, setSearchResultsTotal] = useState(0)

  // Debounced search function
  const performSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setSearchResults(null)
        setSearchResultsTotal(0)
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/departments/articles?departmentId=${departmentId}&search=${encodeURIComponent(term)}&sort=${sortBy}&mode=${searchMode}`,
        )
        const data = await response.json()

        if (data.docs) {
          setSearchResults(data.docs)
          setSearchResultsTotal(data.totalDocs)
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsSearching(false)
      }
    },
    [departmentId, sortBy, searchMode],
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchTerm)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchTerm, performSearch])

  // Use search results if searching, otherwise use loaded articles
  const displayArticles = searchResults !== null ? searchResults : articles
  const displayTotal = searchResults !== null ? searchResultsTotal : totalArticles

  // Get all unique document types from displayed articles
  const availableDocTypes = Array.from(
    new Set(displayArticles.map((a) => a.documentType).filter(Boolean)),
  )

  // Count articles per document type
  const docTypeCounts = availableDocTypes.reduce(
    (acc, type) => {
      acc[type as string] = displayArticles.filter((a) => a.documentType === type).length
      return acc
    },
    {} as Record<string, number>,
  )

  // Filter articles by document type only (search is handled server-side)
  const filteredArticles = displayArticles.filter((article) =>
    selectedDocTypes.length === 0 || selectedDocTypes.includes(article.documentType || '')
  )

  // Sort filtered articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case '-updatedAt':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'updatedAt':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      case 'title':
        return (a.title || '').localeCompare(b.title || '', 'sv')
      case '-title':
        return (b.title || '').localeCompare(a.title || '', 'sv')
      default:
        return 0
    }
  })

  const hasMoreArticles = searchResults === null && articles.length < totalArticles

  const loadMoreArticles = async () => {
    if (isLoadingMore || !hasMoreArticles) return

    setIsLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const response = await fetch(
        `/api/departments/articles?departmentId=${departmentId}&page=${nextPage}&limit=50&sort=${sortBy}`,
      )
      const data = await response.json()

      if (data.docs) {
        setArticles((prev) => [...prev, ...data.docs])
        setCurrentPage(nextPage)
      }
    } catch (error) {
      console.error('Failed to load more articles:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const toggleDocType = (docType: string) => {
    setSelectedDocTypes((prev) =>
      prev.includes(docType) ? prev.filter((t) => t !== docType) : [...prev, docType],
    )
  }

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

      {/* Subdepartments Section */}
      {subdepartments.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subdepartments.map((subdept) => {
              const subdeptPath = getDepartmentFullPath(subdept)
              return (
                <Link key={subdept.id} href={`/${subdeptPath}`}>
                  <Card className="hover:shadow-md transition-all hover:border-blue-300 bg-slate-50 h-full py-2">
                    <CardContent>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900">{subdept.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <FileText className="h-4 w-4" />
                            <span>{subdept.articleCount} dokument</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Search Bar and Sort */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Sök i titel, innehåll, sammanfattning..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px] h-12">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-updatedAt">Nyast först</SelectItem>
              <SelectItem value="updatedAt">Äldst först</SelectItem>
              <SelectItem value="title">A-Ö</SelectItem>
              <SelectItem value="-title">Ö-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Mode Toggle */}
        {searchTerm && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Sökläge:</span>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <Button
                variant={searchMode === 'hybrid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchMode('hybrid')}
                className="h-8"
                title="Bästa av båda - snabba exakta resultat + smarta semantiska matchningar"
              >
                <Zap className="h-3 w-3 mr-1" />
                Smart
              </Button>
              <Button
                variant={searchMode === 'semantic' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchMode('semantic')}
                className="h-8"
                title="AI-driven semantisk sökning - hittar relaterat innehåll baserat på mening"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Semantisk
              </Button>
              <Button
                variant={searchMode === 'exact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchMode('exact')}
                className="h-8"
                title="Blixtsnabb exakt nyckelordsmatchning"
              >
                <AlignLeft className="h-3 w-3 mr-1" />
                Exakt
              </Button>
            </div>
          </div>
        )}

        {/* Document Type Filters */}
        {availableDocTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableDocTypes.map((docType) => (
              <Badge
                key={docType}
                variant={selectedDocTypes.includes(docType as string) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleDocType(docType as string)}
              >
                {documentTypeLabels[docType as string] || docType} ({docTypeCounts[docType as string]})
              </Badge>
            ))}
            {selectedDocTypes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocTypes([])}
                className="h-6 px-2 text-xs"
              >
                Rensa filter
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Dokument och policies</h2>
          <span className="text-sm text-slate-500">
            {searchResults !== null ? (
              <>
                {sortedArticles.length} sökresultat
                {searchTerm && (
                  <span className="ml-2 text-xs text-slate-400">
                    av {displayTotal} totalt
                  </span>
                )}
              </>
            ) : (
              <>Visar {sortedArticles.length} av {displayTotal} dokument</>
            )}
          </span>
        </div>

        {sortedArticles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-500 mb-2">
              {searchTerm || selectedDocTypes.length > 0
                ? 'Inga dokument matchar dina filter'
                : 'Inga dokument'}
            </p>
            {(searchTerm || selectedDocTypes.length > 0) && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedDocTypes([])
                }}
              >
                Rensa alla filter
              </Button>
            )}
          </div>
        ) : (
          <>
            <ItemGroup className="gap-2">
              {sortedArticles.map((article) => (
                <Item key={article.id} variant="outline" size="sm" asChild>
                  <Link
                    href={`/${getDepartmentFullPath(article.department || null)}/${article.slug}`}
                  >
                    <ItemContent>
                      <ItemTitle>{article.title}</ItemTitle>
                    </ItemContent>
                    <Badge variant="secondary" className="shrink-0">
                      {article.documentType
                        ? documentTypeLabels[article.documentType] || article.documentType
                        : 'Okänd typ'}
                    </Badge>
                    <ItemFooter className="text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {article.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(article.updatedAt)}
                        </div>
                      </div>
                    </ItemFooter>
                  </Link>
                </Item>
              ))}
            </ItemGroup>

            {/* Load More Button */}
            {hasMoreArticles && (
              <div className="flex flex-col items-center gap-3 pt-6">
                <p className="text-sm text-slate-500">
                  {articles.length} av {totalArticles} dokument laddade
                </p>
                <Button
                  onClick={loadMoreArticles}
                  disabled={isLoadingMore}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Laddar...
                    </>
                  ) : (
                    'Ladda fler dokument'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
