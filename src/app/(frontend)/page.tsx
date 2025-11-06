'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Building,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { usePlatform } from '@/hooks/usePlatform'

interface Department {
  id: string
  name: string
  slug: string
  subdepartments?: Array<{
    id: string
    name: string
  }>
}

export default function Page() {
  const router = useRouter()
  const { modKey } = usePlatform()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [totalArticles, setTotalArticles] = useState(0)

  // Auto-focus search input on mount (with small delay for hydration)
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

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

  // Fetch total article count (published only)
  useEffect(() => {
    const fetchTotalArticles = async () => {
      try {
        const response = await fetch('/api/articles?limit=1&where[_status][equals]=published')
        const data = await response.json()
        setTotalArticles(data.totalDocs || 0)
      } catch (error) {
        console.error('Error fetching total articles:', error)
      }
    }

    fetchTotalArticles()
  }, [])

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

  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      {/* Hero Search Section */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] mb-12">
        <h1 className="text-5xl font-bold text-black mb-16">
          Kunskapsportalen
        </h1>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full">
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
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Departments Section */}
      <div className="pb-12 mt-12">
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
                          <h3 className="font-semibold text-slate-900 truncate flex-1 min-w-0">
                            {dept.name}
                          </h3>
                          <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                        </div>
                        {dept.subdepartments && dept.subdepartments.length > 0 && (
                          <div className="text-xs text-slate-500">
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
    </div>
  )
}
