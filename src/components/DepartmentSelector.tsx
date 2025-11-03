'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronRightIcon, CheckSquare, Square } from 'lucide-react'
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

  // Get all child department IDs recursively
  const getChildDepartmentIds = (dept: Department): string[] => {
    const ids: string[] = []
    const traverse = (d: Department) => {
      ids.push(d.id)
      if (d.children) {
        d.children.forEach(traverse)
      }
    }
    // Include the department itself and all children
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
  const handleToggleChildren = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation()
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

    return (
      <div key={dept.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer group`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(dept.id)}
              className="p-1 hover:bg-gray-200 rounded mr-1"
              title="Expandera/dölj"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5 mr-1" />}

          <label className="flex items-center cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleDepartment(dept.id)}
              className="mr-2 h-3 w-3"
            />
            <span className="text-sm flex items-center gap-1">
              {dept.name}
              {/* Indicator: show if children are selected but parent is not */}
              {!isSelected && childrenSelected && (
                <span
                  className="text-xs text-blue-600 font-medium"
                  title="Vissa underavdelningar är valda"
                >
                  (•)
                </span>
              )}
            </span>
          </label>

          {/* Toggle all children button - only visible on hover and if has children */}
          {hasChildren && (
            <button
              onClick={(e) => handleToggleChildren(dept, e)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded ml-1 transition-opacity"
              title="Välj/avmarkera alla underavdelningar"
            >
              {childrenSelected ? (
                <CheckSquare className="h-3 w-3 text-blue-600" />
              ) : (
                <Square className="h-3 w-3 text-gray-400" />
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>{dept.children.map((child) => renderDepartment(child, level + 1))}</div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Laddar avdelningar...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500">
        Kunde inte ladda avdelningar
      </div>
    )
  }

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
        {departments.length === 0 ? (
          <div className="text-sm text-gray-500 px-2">Inga avdelningar tillgängliga</div>
        ) : (
          departments.map((dept) => renderDepartment(dept))
        )}
      </div>
    </div>
  )
}