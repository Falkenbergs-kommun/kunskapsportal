import React from 'react'

interface SourceBadgeProps {
  source: 'internal' | string
  label?: string
  icon?: string
  color?: string
}

export function SourceBadge({ source, label, icon, color }: SourceBadgeProps) {
  if (source === 'internal') {
    return null // Don't show badge for internal sources
  }

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  }

  const bgColor =
    color && colorClasses[color] ? colorClasses[color] : 'bg-gray-100 text-gray-800'

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bgColor}`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label || source}
    </span>
  )
}
