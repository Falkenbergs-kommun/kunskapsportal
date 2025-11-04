'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'

interface Department {
  id: string
  name: string
  slug: string
  children: Department[]
}

interface DepartmentSelectorProps {
  selectedDepartments: string[]
  onSelectionChange: (departments: string[]) => void
}

export function DepartmentSelector({ selectedDepartments, onSelectionChange }: DepartmentSelectorProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/chat')
      if (!response.ok) throw new Error('Failed to fetch departments')
      const data = await response.json()
      setDepartments(data.departments)
      setLoading(false)
    } catch (err) {
      setError('Failed to load departments')
      setLoading(false)
    }
  }

  // Get all department IDs recursively
  const getAllDepartmentIds = (depts: Department[]): string[] => {
    const ids: string[] = []
    const traverse = (dept: Department) => {
      ids.push(dept.id)
      if (dept.children) {
        dept.children.forEach(traverse)
      }
    }
    depts.forEach(traverse)
    return ids
  }

  // Get all child department IDs (including the department itself)
  const getChildDepartmentIds = (dept: Department): string[] => {
    const ids: string[] = []
    const traverse = (d: Department) => {
      ids.push(d.id)
      if (d.children) {
        d.children.forEach(traverse)
      }
    }
    traverse(dept)
    return ids
  }

  // Check if any children of this department are selected
  const hasSelectedChildren = (dept: Department): boolean => {
    if (!dept.children || dept.children.length === 0) return false

    const traverse = (d: Department): boolean => {
      if (selectedDepartments.includes(d.id)) return true
      if (d.children) {
        return d.children.some(traverse)
      }
      return false
    }

    return dept.children.some(traverse)
  }

  const toggleExpanded = (deptId: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId)
    } else {
      newExpanded.add(deptId)
    }
    setExpanded(newExpanded)
  }

  const handleToggleDepartment = (deptId: string) => {
    const newSelection = selectedDepartments.includes(deptId)
      ? selectedDepartments.filter((id) => id !== deptId)
      : [...selectedDepartments, deptId]
    onSelectionChange(newSelection)
  }

  // Toggle all children of a department
  const handleToggleAllChildren = (dept: Department) => {
    const childIds = dept.children.map((child) => child.id)
    const allChildrenSelected = childIds.every((id) => selectedDepartments.includes(id))

    let newSelection: string[]
    if (allChildrenSelected) {
      // Deselect all children
      newSelection = selectedDepartments.filter((id) => !childIds.includes(id))
    } else {
      // Select all children
      const childIdsToAdd = childIds.filter((id) => !selectedDepartments.includes(id))
      newSelection = [...selectedDepartments, ...childIdsToAdd]
    }
    onSelectionChange(newSelection)
  }

  // Select all departments
  const handleSelectAll = () => {
    const allIds = getAllDepartmentIds(departments)
    onSelectionChange(allIds)
  }

  // Clear all selections
  const handleClearAll = () => {
    onSelectionChange([])
  }

  const renderDepartment = (dept: Department, level: number = 0) => {
    const isExpanded = expanded.has(dept.id)
    const isSelected = selectedDepartments.includes(dept.id)
    const hasChildren = dept.children && dept.children.length > 0
    const childrenSelected = hasChildren && hasSelectedChildren(dept)

    // For hierarchical departments: show indeterminate state if children selected but parent isn't
    const isIndeterminate = hasChildren && !isSelected && childrenSelected
    const allChildrenSelected = hasChildren && dept.children.every(child => selectedDepartments.includes(child.id))

    // Only show at top level (level 0) - don't indent or show nested beyond first level
    if (level === 0) {
      return (
        <div key={dept.id}>
          <div className="flex items-center py-1 px-2 hover:bg-gray-100 rounded">
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={isSelected || allChildrenSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate
                }}
                onChange={() => handleToggleDepartment(dept.id)}
                className="mr-2 h-3 w-3"
              />
              <span className="text-sm">{dept.name}</span>
            </label>

            {hasChildren && (
              <button
                onClick={() => toggleExpanded(dept.id)}
                className="ml-2 text-gray-500 hover:text-gray-700 text-xs"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
          </div>

          {/* Hierarchical sub-departments */}
          {hasChildren && isExpanded && (
            <div className="ml-6 mt-1 border-l-2 border-gray-200 pl-2">
              {/* Select all option */}
              <label className="flex items-center py-1 cursor-pointer hover:bg-gray-50 rounded px-1">
                <input
                  type="checkbox"
                  checked={
                    dept.children.every((child) => selectedDepartments.includes(child.id)) &&
                    dept.children.length > 0
                  }
                  onChange={() => handleToggleAllChildren(dept)}
                  className="mr-2 h-3 w-3"
                />
                <span className="text-xs font-medium text-gray-600">Alla</span>
              </label>

              {/* Individual sub-departments (non-recursive, just direct children) */}
              {dept.children.map((child) => (
                <label key={child.id} className="flex items-center py-1 cursor-pointer hover:bg-gray-50 rounded px-1">
                  <input
                    type="checkbox"
                    checked={selectedDepartments.includes(child.id)}
                    onChange={() => handleToggleDepartment(child.id)}
                    className="mr-2 h-3 w-3"
                  />
                  <span className="text-xs">{child.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  if (loading) return null
  if (error) return null
  if (departments.length === 0) return null

  return (
    <div className="border rounded-lg p-2 bg-white">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="text-xs font-semibold text-gray-600">Filtrera per avdelning</div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-6 px-2 text-xs"
            title="Välj alla avdelningar"
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
      <div className="max-h-60 overflow-y-auto">
        {departments.map((dept) => renderDepartment(dept))}
      </div>
    </div>
  )
}
