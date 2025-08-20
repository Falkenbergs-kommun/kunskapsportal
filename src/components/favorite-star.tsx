'use client'

import { Star } from 'lucide-react'
import { useFavorites } from '@/contexts/favorites-context'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

interface FavoriteStarProps {
  title: string
  url?: string
  emoji?: string
  className?: string
}

export function FavoriteStar({ title, url, emoji = '⭐', className }: FavoriteStarProps) {
  const pathname = usePathname()
  const currentUrl = url || pathname
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const isCurrentlyFavorite = isFavorite(currentUrl)

  const handleToggleFavorite = () => {
    if (isCurrentlyFavorite) {
      removeFavorite(currentUrl)
    } else {
      addFavorite({
        title,
        url: currentUrl,
        emoji
      })
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleFavorite}
      className={className}
    >
      <Star 
        className={`h-4 w-4 ${isCurrentlyFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
      />
    </Button>
  )
}