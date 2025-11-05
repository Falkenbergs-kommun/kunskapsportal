'use client'

import React from 'react'
import { DepartmentSelector } from './DepartmentSelector'
import { ExternalSourceSelector } from './ExternalSourceSelector'

interface KnowledgeSourceFilterProps {
  selectedDepartments: string[]
  onDepartmentChange: (departments: string[]) => void
  selectedExternalSources: string[]
  onExternalSourceChange: (sources: string[]) => void
  useGoogleGrounding: boolean
  onGoogleGroundingChange: (enabled: boolean) => void
  geminiGroundingEnabled: boolean
}

export function KnowledgeSourceFilter({
  selectedDepartments,
  onDepartmentChange,
  selectedExternalSources,
  onExternalSourceChange,
  useGoogleGrounding,
  onGoogleGroundingChange,
  geminiGroundingEnabled,
}: KnowledgeSourceFilterProps) {
  return (
    <div className="space-y-2">
      <div className="mb-2">
        <span className="text-xs font-semibold text-gray-600">Kunskapskällor</span>
      </div>

      <DepartmentSelector
        selectedDepartments={selectedDepartments}
        onSelectionChange={onDepartmentChange}
      />

      <ExternalSourceSelector
        selectedSources={selectedExternalSources}
        onSelectionChange={onExternalSourceChange}
      />

      {/* Google Grounding Toggle */}
      {geminiGroundingEnabled && (
        <div className="border rounded-lg p-2 bg-white mt-2">
          <label className="flex items-center py-1 px-2 cursor-pointer hover:bg-gray-50 rounded">
            <input
              type="checkbox"
              checked={useGoogleGrounding}
              onChange={(e) => onGoogleGroundingChange(e.target.checked)}
              className="mr-2 h-3 w-3"
            />
            <span className="mr-2">🔍</span>
            <span className="text-sm">Google Search</span>
          </label>
        </div>
      )}
    </div>
  )
}

// Helper function to count selected sources
export function countSelectedSources(
  selectedDepartments: string[],
  selectedExternalSources: string[]
): number {
  return selectedDepartments.length + selectedExternalSources.length
}

// Helper function to get filter button text
export function getFilterButtonText(
  selectedDepartments: string[],
  selectedExternalSources: string[],
  useGoogleGrounding: boolean
): string {
  const totalSources = countSelectedSources(selectedDepartments, selectedExternalSources)

  if (totalSources > 0 && useGoogleGrounding) {
    return `${totalSources} källor + Google valda`
  } else if (totalSources > 0) {
    return `${totalSources} källor valda`
  } else if (useGoogleGrounding) {
    return 'Google Search vald'
  } else {
    return '0 källor valda'
  }
}
