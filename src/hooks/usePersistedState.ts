'use client'

import { useState, useEffect, Dispatch, SetStateAction } from 'react'

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(key)
      if (storedValue !== null) {
        setState(JSON.parse(storedValue))
      }
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error)
    } finally {
      setIsLoading(false)
    }
  }, [key])

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(key, JSON.stringify(state))
      } catch (error) {
        console.error(`Failed to save ${key} to localStorage:`, error)
      }
    }
  }, [key, state, isLoading])

  return [state, setState, isLoading]
}