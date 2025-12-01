// src/contexts/favorites-context.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Favorite {
  url: string
  title: string
  emoji: string
  order: number
}

interface FavoritesContextType {
  favorites: Favorite[]
  isLoading: boolean
  addFavorite: (item: Omit<Favorite, 'order'>) => void
  removeFavorite: (url: string) => void
  reorderFavorites: (newOrder: Favorite[]) => void
  isFavorite: (url: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

const FAVORITES_KEY = 'sidebar_favorites'

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(true) // Start in loading state

  // Load favorites from localStorage on initial mount
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY)
      if (storedFavorites) {
        const parsed = JSON.parse(storedFavorites) as Favorite[]

        // Migration: Add order field to old favorites that don't have it
        const migrated = parsed.map((fav, index) => {
          if (typeof fav.order !== 'number') {
            return { ...fav, order: index }
          }
          return fav
        })

        // Sort by order
        const sorted = migrated.sort((a, b) => a.order - b.order)
        setFavorites(sorted)

        // Save migrated data back to localStorage if migration occurred
        if (migrated.some((fav, i) => fav.order !== parsed[i]?.order)) {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(sorted))
        }
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error)
    } finally {
      setIsLoading(false) // Set loading to false after attempting to load
    }
  }, [])

  const updateAndPersistFavorites = (newFavorites: Favorite[]) => {
    setFavorites(newFavorites)
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error)
    }
  }

  const addFavorite = (item: Omit<Favorite, 'order'>) => {
    // Prevent duplicates
    if (!favorites.some((fav) => fav.url === item.url)) {
      // Assign order as max existing order + 1
      const maxOrder = favorites.length > 0 ? Math.max(...favorites.map((f) => f.order)) : -1
      const newFavorite: Favorite = { ...item, order: maxOrder + 1 }
      updateAndPersistFavorites([...favorites, newFavorite])
    }
  }

  const removeFavorite = (url: string) => {
    const newFavorites = favorites.filter((fav) => fav.url !== url)
    updateAndPersistFavorites(newFavorites)
  }

  const reorderFavorites = (newOrder: Favorite[]) => {
    // Reassign order numbers based on new array position
    const reordered = newOrder.map((fav, index) => ({ ...fav, order: index }))
    updateAndPersistFavorites(reordered)
  }

  const isFavorite = (url: string) => {
    return favorites.some((fav) => fav.url === url)
  }

  return (
    <FavoritesContext.Provider
      value={{ favorites, isLoading, addFavorite, removeFavorite, reorderFavorites, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
