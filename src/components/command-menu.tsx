'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { File, Home, Newspaper } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { getDepartmentFullPath } from '@/lib/utils'
import type { Article } from '@/payload-types'

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
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
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
  }, [query])

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
    <CommandDialog open={open} onOpenChange={setOpen} className="max-w-5xl">
      <CommandInput
        placeholder="Search articles by title, content, summary, author..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="!max-h-[600px]">
        {isLoading && <CommandEmpty>Searching...</CommandEmpty>}
        {!isLoading && query.length > 1 && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/admin'))}>
            <File className="mr-2 h-4 w-4" />
            <span>Go to Admin</span>
          </CommandItem>
        </CommandGroup>

        {results.length > 0 && (
          <CommandGroup heading={`Articles (${results.length}${totalResults > results.length ? ` of ${totalResults}` : ''})`}>
            {results.map((article) => {
              const departmentPath = getDepartmentFullPath(article.department || null)
              const url = `/${departmentPath}/${article.slug}`
              return (
                <CommandItem
                  key={article.id}
                  value={article.title || ''}
                  onSelect={() => handleArticleClick(url)}
                  className="cursor-pointer py-3"
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
