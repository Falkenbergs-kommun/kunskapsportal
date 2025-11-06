'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Loader2,
  Newspaper,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getDepartmentFullPath } from '@/lib/utils'
import type { Department as PayloadDepartment } from '@/payload-types'
import { usePlatform } from '@/hooks/usePlatform'
import Link from 'next/link'

interface SearchResult {
  id: string
  title: string
  slug: string
  summary?: string
  department?: PayloadDepartment | number | null
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { modKey } = usePlatform()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const initialQuery = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Auto-focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Perform search when query param changes
  useEffect(() => {
    const query = searchParams.get('q')
    if (query && query.length >= 2) {
      setSearchQuery(query)
      performSearch(query)
    }
  }, [searchParams])

  const performSearch = async (query: string) => {
    if (query.length < 2) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&mode=hybrid`)
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleClearInput = () => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }

  const handleArticleClick = useCallback((article: SearchResult) => {
    const url = `/${getDepartmentFullPath(article.department || null)}/${article.slug}`
    router.push(url)
  }, [router])

  const currentQuery = searchParams.get('q') || ''

  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      {/* Search Section */}
      <div className="py-12">
        <h1 className="text-3xl font-bold text-black mb-8">Sök</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Sök i kunskapsbasen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-12 text-base border-2 border-slate-200 rounded-full focus:border-black transition-colors"
            />
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-slate-400" />
            )}
          </div>
        </form>

        {/* Quick hint */}
        <p className="text-sm text-slate-500 mb-8">
          Tips: Tryck <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs">{modKey}K</kbd> för avancerad sökning eller <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs">{modKey}J</kbd> för AI-chatt
        </p>
      </div>

      {/* Search Results */}
      {currentQuery && (
        <div className="w-full mb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              {isSearching
                ? 'Söker...'
                : searchResults.length === 0
                ? 'Inga resultat hittades'
                : `${searchResults.length} resultat för "${currentQuery}"`}
            </p>
            <Link
              href="/"
              className="text-sm text-slate-600 hover:text-black transition-colors"
            >
              Tillbaka till startsidan
            </Link>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleArticleClick(result)}
                  className="w-full flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:border-black hover:bg-slate-50 transition-all text-left"
                >
                  <Newspaper className="h-6 w-6 text-slate-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">
                        {result.title}
                      </h3>
                      {result.department && typeof result.department !== 'number' && (
                        <Badge variant="secondary" className="shrink-0">
                          {result.department.name}
                        </Badge>
                      )}
                    </div>
                    {result.summary && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {result.summary}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
