'use client'

import React, { useState, useEffect } from 'react'

interface ExternalSource {
  id: string
  label: string
  icon?: string
  color?: string
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

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/chat')
      if (!response.ok) throw new Error('Failed to fetch sources')
      const data = await response.json()
      setSources(data.externalSources || [])
      setLoading(false)
    } catch (err) {
      setError('Failed to load external sources')
      setLoading(false)
    }
  }

  const handleToggleSource = (sourceId: string) => {
    const newSelection = selectedSources.includes(sourceId)
      ? selectedSources.filter((id) => id !== sourceId)
      : [...selectedSources, sourceId]
    onSelectionChange(newSelection)
  }

  // Don't render anything if no sources configured
  if (loading) return null
  if (error) return null
  if (sources.length === 0) return null

  return (
    <div className="border rounded-lg p-2 max-h-60 overflow-y-auto bg-white">
      <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Externa Källor</div>
      {sources.map((source) => {
        const isSelected = selectedSources.includes(source.id)

        return (
          <div
            key={source.id}
            className="flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
          >
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggleSource(source.id)}
                className="mr-2 h-3 w-3"
              />
              {source.icon && <span className="mr-2">{source.icon}</span>}
              <span className="text-sm">{source.label}</span>
            </label>
          </div>
        )
      })}
    </div>
  )
}
