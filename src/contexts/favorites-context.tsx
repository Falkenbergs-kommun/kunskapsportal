// src/contexts/favorites-context.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Favorite {
  url: string
  title: string
  emoji: string
}

interface FavoritesContextType {
  favorites: Favorite[]
  isLoading: boolean
  addFavorite: (item: Favorite) => void
  removeFavorite: (url: string) => void
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
        setFavorites(JSON.parse(storedFavorites))
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

  const addFavorite = (item: Favorite) => {
    // Prevent duplicates
    if (!favorites.some((fav) => fav.url === item.url)) {
      updateAndPersistFavorites([...favorites, item])
    }
  }

  const removeFavorite = (url: string) => {
    const newFavorites = favorites.filter((fav) => fav.url !== url)
    updateAndPersistFavorites(newFavorites)
  }

  const isFavorite = (url: string) => {
    return favorites.some((fav) => fav.url === url)
  }

  return (
    <FavoritesContext.Provider
      value={{ favorites, isLoading, addFavorite, removeFavorite, isFavorite }}
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
