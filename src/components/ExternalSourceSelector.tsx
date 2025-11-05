'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'

interface SubSource {
  id: string
  label: string
}

interface ExternalSource {
  id: string
  label: string
  icon?: string
  color?: string
  type?: string
  subSources?: SubSource[]
}

interface ExternalSourceSelectorProps {
  selectedSources: string[]
  onSelectionChange: (sources: string[]) => void
}

export function ExternalSourceSelector({
  selectedSources,
  onSelectionChange,
}: ExternalSourceSelectorProps) {
  const [sources, setSources] = useState<ExternalSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/chat')
      if (!response.ok) throw new Error('Failed to fetch sources')
      const data = await response.json()
      // Filter out "google" - it's not an external source, handled separately
      const filteredSources = (data.externalSources || []).filter((s: ExternalSource) => s.id !== 'google')
      setSources(filteredSources)
      setLoading(false)
    } catch (_err) {
      setError('Failed to load external sources')
      setLoading(false)
    }
  }

  const handleToggleSource = (sourceId: string) => {
    // Prevent "google" from being added (it's not an external source)
    if (sourceId === 'google') return

    const newSelection = selectedSources.includes(sourceId)
      ? selectedSources.filter((id) => id !== sourceId)
      : [...selectedSources, sourceId]
    onSelectionChange(newSelection)
  }

  const handleToggleExpand = (sourceId: string) => {
    const newExpanded = new Set(expandedSources)
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId)
    } else {
      newExpanded.add(sourceId)
    }
    setExpandedSources(newExpanded)
  }

  const handleToggleSubSource = (sourceId: string, subSourceId: string) => {
    const fullId = `${sourceId}.${subSourceId}`
    const newSelection = selectedSources.includes(fullId)
      ? selectedSources.filter((id) => id !== fullId)
      : [...selectedSources, fullId]
    onSelectionChange(newSelection)
  }

  const handleToggleAllSubSources = (sourceId: string, allSubSourceIds: string[]) => {
    const allFullIds = allSubSourceIds.map((subId) => `${sourceId}.${subId}`)
    const allSelected = allFullIds.every((id) => selectedSources.includes(id))

    if (allSelected) {
      // Deselect all sub-sources for this parent
      const newSelection = selectedSources.filter((id) => !id.startsWith(`${sourceId}.`))
      onSelectionChange(newSelection)
    } else {
      // Select all sub-sources for this parent
      const newSelection = [...selectedSources.filter((id) => !id.startsWith(`${sourceId}.`)), ...allFullIds]
      onSelectionChange(newSelection)
    }
  }

  const handleSelectAll = () => {
    // Select all top-level sources AND all their sub-sources
    const allIds: string[] = []
    sources.forEach((source) => {
      allIds.push(source.id)
      if (source.subSources && source.subSources.length > 0) {
        source.subSources.forEach((subSource) => {
          allIds.push(`${source.id}.${subSource.id}`)
        })
      }
    })
    onSelectionChange(allIds)
  }

  const handleClearAll = () => {
    // Clear all sources (including sub-sources with dot notation)
    onSelectionChange([])
  }

  // Don't render anything if no sources configured
  if (loading) return null
  if (error) return null
  if (sources.length === 0) return null

  return (
    <div className="border rounded-lg p-2 max-h-60 overflow-y-auto bg-white">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="text-xs font-semibold text-gray-600">Externa Källor</div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-6 px-2 text-xs"
            title="Välj alla externa källor"
          >
            Välj alla
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 px-2 text-xs"
            title="Rensa alla val"
          >
            Rensa alla
          </Button>
        </div>
      </div>
      {sources.map((source) => {
        const isSelected = selectedSources.includes(source.id)
        const isExpanded = expandedSources.has(source.id)
        const hasSubSources = source.subSources && source.subSources.length > 0

        // Calculate selected sub-sources from dot notation (e.g., "svensk-lag.pbl")
        const selectedSubSourceIds = hasSubSources
          ? selectedSources
              .filter((id) => id.startsWith(`${source.id}.`))
              .map((id) => id.substring(source.id.length + 1))
          : []

        // For hierarchical sources: show indeterminate state if sub-sources selected but parent isn't
        const isIndeterminate = hasSubSources && !isSelected && selectedSubSourceIds.length > 0
        const allSubSourcesSelected = Boolean(
          hasSubSources &&
          selectedSubSourceIds.length > 0 &&
          source.subSources!.every(sub => selectedSubSourceIds.includes(sub.id))
        )

        return (
          <div key={source.id} className="mb-1">
            <div className="flex items-center py-1 px-2 hover:bg-gray-100 rounded">
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={isSelected || allSubSourcesSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate || false
                  }}
                  onChange={() => handleToggleSource(source.id)}
                  className="mr-2 h-3 w-3"
                />
                {source.icon && <span className="mr-2">{source.icon}</span>}
                <span className="text-sm">{source.label}</span>
              </label>
              {hasSubSources && (
                <button
                  onClick={() => handleToggleExpand(source.id)}
                  className="ml-2 text-gray-500 hover:text-gray-700 text-xs"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
            </div>

            {/* Hierarchical sub-sources */}
            {hasSubSources && isExpanded && (
              <div className="ml-6 mt-1 border-l-2 border-gray-200 pl-2">
                {/* Select all option */}
                <label className="flex items-center py-1 cursor-pointer hover:bg-gray-50 rounded px-1">
                  <input
                    type="checkbox"
                    checked={Boolean(
                      source.subSources!.every((sub) => selectedSubSourceIds.includes(sub.id)) &&
                      selectedSubSourceIds.length > 0
                    )}
                    onChange={() =>
                      handleToggleAllSubSources(
                        source.id,
                        source.subSources!.map((s) => s.id),
                      )
                    }
                    className="mr-2 h-3 w-3"
                  />
                  <span className="text-xs font-medium text-gray-600">Alla</span>
                </label>

                {/* Individual sub-sources */}
                {source.subSources!.map((subSource) => (
                  <label
                    key={subSource.id}
                    className="flex items-center py-1 cursor-pointer hover:bg-gray-50 rounded px-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubSourceIds.includes(subSource.id)}
                      onChange={() => handleToggleSubSource(source.id, subSource.id)}
                      className="mr-2 h-3 w-3"
                    />
                    <span className="text-xs">{subSource.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
