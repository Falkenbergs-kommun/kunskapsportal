'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Building,
  Loader2,
  ChevronRight,
  Newspaper,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDepartmentFullPath } from '@/lib/utils'

interface Department {
  id: string
  name: string
  slug: string
  subdepartments?: Array<{
    id: string
    name: string
  }>
}

interface SearchResult {
  id: string
  title: string
  slug: string
  summary?: string
  department?: {
    id: string
    name: string
    slug: string
  }
}

export default function Page() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [totalArticles, setTotalArticles] = useState(0)

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments?limit=1000')
        const data = await response.json()

        // Build department hierarchy
        const allDepts = data.docs
        const topLevelDepts = allDepts
          .filter((dept: any) => !dept.parent)
          .map((dept: any) => {
            // Find subdepartments (children)
            const subdepartments = allDepts
              .filter((child: any) => child.parent && child.parent.id === dept.id)
              .map((child: any) => ({
                id: child.id,
                name: child.name,
              }))

            return {
              id: dept.id,
              name: dept.name,
              slug: dept.slug,
              subdepartments: subdepartments.length > 0 ? subdepartments : undefined,
            }
          })

        setDepartments(topLevelDepts)
      } catch (error) {
        console.error('Error fetching departments:', error)
      }
    }

    fetchDepartments()
  }, [])

  // Fetch total article count
  useEffect(() => {
    const fetchTotalArticles = async () => {
      try {
        const response = await fetch('/api/articles?limit=1')
        const data = await response.json()
        setTotalArticles(data.totalDocs || 0)
      } catch (error) {
        console.error('Error fetching total articles:', error)
      }
    }

    fetchTotalArticles()
  }, [])

  // Debounced search
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&mode=hybrid`)
        const data = await response.json()
        setSearchResults(data.results || [])
      } catch (error) {
        console.error('Search failed:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const timer = setTimeout(performSearch, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleArticleClick = useCallback((article: SearchResult) => {
    const url = `/${getDepartmentFullPath(article.department || null)}/${article.slug}`
    router.push(url)
  }, [router])

  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      {/* Hero Search Section */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] mb-12">
        <h1 className="text-5xl font-bold text-black mb-16">
          Kunskapsportalen
        </h1>

        {/* Inline Search Bar with Results */}
        <div className="w-full max-w-3xl relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Sök i kunskapsbasen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-12 text-base border-2 border-slate-200 rounded-full focus:border-black transition-colors"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-slate-400" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchQuery.length >= 2 && (
            <div className="absolute w-full mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-xl max-h-[500px] overflow-y-auto z-50">
              {searchResults.length === 0 && !isSearching && (
                <div className="p-6 text-center text-slate-500">
                  Inga resultat hittades
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="p-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleArticleClick(result)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <Newspaper className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 truncate">
                            {result.title}
                          </span>
                          {result.department && (
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              {result.department.name}
                            </Badge>
                          )}
                        </div>
                        {result.summary && (
                          <p className="text-xs text-slate-600 line-clamp-2">
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

        {/* Quick hint */}
        {searchQuery.length === 0 && (
          <p className="text-sm text-slate-500 mt-4">
            Tips: Tryck <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs">⌘K</kbd> för avancerad sökning eller <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs">⌘J</kbd> för AI-chatt
          </p>
        )}
      </div>

      {/* Show content only when not searching */}
      {searchQuery.length < 2 && (
        <>
          {/* Departments Section */}
          <div className="pb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Bläddra efter avdelning</h2>
              <span className="text-sm text-slate-500">{totalArticles} dokument totalt</span>
            </div>

            {departments.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((dept) => (
                  <Link key={dept.id} href={`/${dept.slug}`}>
                    <Card className="hover:shadow-md transition-all hover:border-black bg-white h-full">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Building className="h-5 w-5 text-slate-600" />
                            <h3 className="font-semibold text-slate-900 truncate">
                              {dept.name}
                            </h3>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                        </div>
                        {dept.subdepartments && dept.subdepartments.length > 0 && (
                          <div className="text-xs text-slate-500 pl-7">
                            {dept.subdepartments.slice(0, 3).map((sub, idx) => (
                              <span key={sub.id}>
                                {sub.name}
                                {idx < Math.min(dept.subdepartments!.length, 3) - 1 && ', '}
                              </span>
                            ))}
                            {dept.subdepartments.length > 3 && (
                              <span> +{dept.subdepartments.length - 3}</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
