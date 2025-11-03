'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Newspaper, Zap, Sparkles, AlignLeft } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { getDepartmentFullPath } from '@/lib/utils'
import type { Article } from '@/payload-types'

type SearchMode = 'hybrid' | 'semantic' | 'exact'

export function CommandMenu({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<Article[]>([])
  const [totalResults, setTotalResults] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  // Load search mode from cookie
  const [searchMode, setSearchMode] = React.useState<SearchMode>(() => {
    if (typeof document !== 'undefined') {
      const saved = document.cookie
        .split('; ')
        .find((row) => row.startsWith('searchMode='))
        ?.split('=')[1]
      return (saved as SearchMode) || 'hybrid'
    }
    return 'hybrid'
  })

  // Save search mode to cookie when it changes
  const handleSearchModeChange = (mode: SearchMode) => {
    setSearchMode(mode)
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    document.cookie = `searchMode=${mode}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`
  }

  React.useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setTotalResults(0)
    }
  }, [open])

  React.useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([])
        setTotalResults(0)
        return
      }
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&mode=${searchMode}`
        )
        const data = await response.json()
        setResults(data.articles || [])
        setTotalResults(data.total || 0)
      } catch (error) {
        console.error('Failed to fetch search results:', error)
        setResults([])
        setTotalResults(0)
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchResults, 200) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [query, searchMode])

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen],
  )

  const handleArticleClick = React.useCallback(
    (url: string) => {
      runCommand(() => router.push(url))
    },
    [runCommand, router],
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="max-w-5xl" shouldFilter={false}>
      <div className="border-b">
        <div className="px-3 py-2">
          <CommandInput
            placeholder="Search articles by title, content, summary, author..."
            value={query}
            onValueChange={setQuery}
            className="border-0"
          />
        </div>
        {query && (
          <div className="flex items-center gap-1 px-3 pb-2">
            <span className="text-xs text-slate-600 mr-1">Sökläge:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded">
              <Button
                variant={searchMode === 'hybrid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSearchModeChange('hybrid')}
                className="h-6 px-2 text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                Smart
              </Button>
              <Button
                variant={searchMode === 'semantic' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSearchModeChange('semantic')}
                className="h-6 px-2 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Semantisk
              </Button>
              <Button
                variant={searchMode === 'exact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSearchModeChange('exact')}
                className="h-6 px-2 text-xs"
              >
                <AlignLeft className="h-3 w-3 mr-1" />
                Exakt
              </Button>
            </div>
          </div>
        )}
      </div>
      <CommandList className="!max-h-[600px]">
        {isLoading && <CommandEmpty>Searching...</CommandEmpty>}
        {!isLoading && query.length > 1 && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {results.length > 0 && (
          <CommandGroup
            heading={`Articles (${results.length}${totalResults > results.length ? ` of ${totalResults}` : ''})`}
          >
            {results.map((article) => {
              const departmentPath = getDepartmentFullPath(article.department || null)
              const url = `/${departmentPath}/${article.slug}`
              return (
                <CommandItem
                  key={article.id}
                  value={article.title || ''}
                  onSelect={() => handleArticleClick(url)}
                  className="cursor-pointer py-3 data-[selected=true]:bg-slate-200 data-[selected=true]:text-slate-900"
                >
                  <Newspaper className="mr-2 h-4 w-4 flex-shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{article.title}</span>
                    {article.department && typeof article.department === 'object' && (
                      <span className="text-xs text-muted-foreground truncate">
                        {getDepartmentFullPath(article.department)}
                      </span>
                    )}
                    {article.summary && (
                      <span className="text-xs text-muted-foreground/75 mt-1 line-clamp-3">
                        {article.summary}
                      </span>
                    )}
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
