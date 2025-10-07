'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'

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
      ? selectedDepartments.filter(id => id !== deptId)
      : [...selectedDepartments, deptId]
    onSelectionChange(newSelection)
  }

  const renderDepartment = (dept: Department, level: number = 0) => {
    const isExpanded = expanded.has(dept.id)
    const isSelected = selectedDepartments.includes(dept.id)
    const hasChildren = dept.children && dept.children.length > 0

    return (
      <div key={dept.id} className="select-none">
        <div 
          className={`flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(dept.id)}
              className="p-1 hover:bg-gray-200 rounded mr-1"
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
            <span className="text-sm">{dept.name}</span>
          </label>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {dept.children.map(child => renderDepartment(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Loading departments...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-2 max-h-60 overflow-y-auto bg-white">
      <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
        Filter by Department
      </div>
      {departments.length === 0 ? (
        <div className="text-sm text-gray-500 px-2">
          No departments available
        </div>
      ) : (
        departments.map(dept => renderDepartment(dept))
      )}
    </div>
  )
}