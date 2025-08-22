import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { Department } from '@/payload-types'

// Helper function to recursively build the full path of a department
export const getDepartmentFullPath = (department: Department | number | null): string => {
  if (!department || typeof department === 'number') {
    return ''
  }

  // Recursively get the parent's path and append the current slug
  const parentPath = getDepartmentFullPath(department.parent || null)
  return parentPath ? `${parentPath}/${department.slug}` : department.slug || ''
}
