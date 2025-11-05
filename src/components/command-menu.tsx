'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Newspaper, Zap, Sparkles, AlignLeft, SettingsIcon, ExternalLink } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KnowledgeSourceFilter, countSelectedSources } from './KnowledgeSourceFilter'
import { usePersistedState } from '@/hooks/usePersistedState'
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
  const [results, setResults] = React.useState<any[]>([])  // Changed to any[] to support external results
  const [totalResults, setTotalResults] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showFilterDialog, setShowFilterDialog] = React.useState(false)

  // Separate localStorage keys for search (different from chat)
  const [selectedDepartments, setSelectedDepartments] = usePersistedState<string[]>(
    'search_selected_departments',
    []
  )
  const [selectedExternalSources, setSelectedExternalSources] = usePersistedState<string[]>(
    'search_selected_external_sources',
    []
  )

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
    } else {
      // Re-read search mode from cookie when dialog opens (in case it was changed elsewhere)
      if (typeof document !== 'undefined') {
        const saved = document.cookie
          .split('; ')
          .find((row) => row.startsWith('searchMode='))
          ?.split('=')[1]
        if (saved && saved !== searchMode) {
          setSearchMode(saved as SearchMode)
        }
      }
    }
  }, [open, searchMode])

  React.useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([])
        setTotalResults(0)
        return
      }
      setIsLoading(true)
      try {
        // Build query parameters
        const params = new URLSearchParams({
          q: query,
          mode: searchMode,
        })

        // Add department filters
        if (selectedDepartments.length > 0) {
          params.append('departmentIds', selectedDepartments.join(','))
        }

        // Add external source filters (includes sub-sources with dot notation like "svensk-lag.pbl")
        if (selectedExternalSources.length > 0) {
          params.append('externalSourceIds', selectedExternalSources.join(','))
        }

        const response = await fetch(`/api/search?${params.toString()}`)
        const data = await response.json()
        setResults(data.results || [])
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
  }, [query, searchMode, selectedDepartments, selectedExternalSources])

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen],
  )

  const handleArticleClick = React.useCallback(
    (url: string, isExternal: boolean) => {
      if (isExternal) {
        // Open external links in new tab
        runCommand(() => window.open(url, '_blank', 'noopener,noreferrer'))
      } else {
        // Navigate to internal article
        runCommand(() => router.push(url))
      }
    },
    [runCommand, router],
  )

  return (
    <>
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
          <div className="flex items-center justify-between gap-2 px-3 pb-2">
            <div className="flex items-center gap-1">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilterDialog(true)}
              className="h-6 px-2 text-xs"
            >
              <SettingsIcon className="h-3 w-3 mr-1" />
              {(() => {
                const totalSources = countSelectedSources(
                  selectedDepartments,
                  selectedExternalSources
                )
                return totalSources > 0
                  ? `${totalSources} källor valda`
                  : '0 källor valda'
              })()}
            </Button>
          </div>
        </div>
      <CommandList className="!max-h-[600px]">
        {isLoading && <CommandEmpty>Searching...</CommandEmpty>}
        {!isLoading && query.length > 1 && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {results.length > 0 && (
          <CommandGroup
            heading={`Results (${results.length}${totalResults > results.length ? ` of ${totalResults}` : ''})`}
          >
            {results.map((result) => {
              const isExternal = result.isExternal || false
              const url = isExternal
                ? result.url
                : `/${getDepartmentFullPath(result.department || null)}/${result.slug}`

              // Get source label
              let sourceLabel = ''
              let sourceBadgeVariant: 'default' | 'secondary' | 'outline' = 'secondary'

              if (isExternal) {
                // External source - use source ID as label
                sourceLabel = result.source
                sourceBadgeVariant = 'outline'
              } else if (result.department && typeof result.department === 'object') {
                // Internal source - show department
                sourceLabel = result.department.name
                sourceBadgeVariant = 'secondary'
              }

              return (
                <CommandItem
                  key={`${result.source || 'internal'}-${result.id}`}
                  value={result.title || ''}
                  onSelect={() => handleArticleClick(url, isExternal)}
                  className="cursor-pointer py-3 data-[selected=true]:bg-slate-200 data-[selected=true]:text-slate-900 gap-3"
                >
                  {isExternal ? (
                    <ExternalLink className="mr-2 h-4 w-4 flex-shrink-0 text-blue-600" />
                  ) : (
                    <Newspaper className="mr-2 h-4 w-4 flex-shrink-0" />
                  )}
                  <div className="flex flex-col flex-1 min-w-0 gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate flex-1">{result.title}</span>
                      {sourceLabel && (
                        <Badge variant={sourceBadgeVariant} className="shrink-0 text-xs">
                          {sourceLabel}
                        </Badge>
                      )}
                    </div>
                    {result.summary && (
                      <span className="text-xs text-muted-foreground/75 line-clamp-2">
                        {result.summary}
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

      {/* Knowledge Source Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filtrera kunskap</DialogTitle>
            <DialogDescription>
              Välj vilka avdelningar och externa källor du vill söka i
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <KnowledgeSourceFilter
              selectedDepartments={selectedDepartments}
              onDepartmentChange={setSelectedDepartments}
              selectedExternalSources={selectedExternalSources}
              onExternalSourceChange={setSelectedExternalSources}
              useGoogleGrounding={false}
              onGoogleGroundingChange={() => {}}
              geminiGroundingEnabled={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
