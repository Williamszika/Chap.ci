import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Listing } from '../types'
import { seedListings } from '../data/seedListings'

const LS_LISTINGS = 'chapci.listings.v1'
const LS_FAVORITES = 'chapci.favorites.v1'

interface AppState {
  listings: Listing[]
  favorites: string[]
  addListing: (listing: Listing) => void
  deleteListing: (id: string) => void
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  getListing: (id: string) => Listing | undefined
  resetDemo: () => void
}

const AppContext = createContext<AppState | null>(null)

function loadUserListings(): Listing[] {
  try {
    const raw = localStorage.getItem(LS_LISTINGS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as Listing[]
    return []
  } catch {
    return []
  }
}

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(LS_FAVORITES)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as string[]
    return []
  } catch {
    return []
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Annonces créées par l'utilisateur (persistées) + annonces de démo
  const [userListings, setUserListings] = useState<Listing[]>(() => loadUserListings())
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())

  useEffect(() => {
    localStorage.setItem(LS_LISTINGS, JSON.stringify(userListings))
  }, [userListings])

  useEffect(() => {
    localStorage.setItem(LS_FAVORITES, JSON.stringify(favorites))
  }, [favorites])

  const listings = useMemo<Listing[]>(() => {
    // Les annonces utilisateur d'abord (plus récentes), puis les démos
    return [...userListings, ...seedListings].sort((a, b) => b.createdAt - a.createdAt)
  }, [userListings])

  const addListing = useCallback((listing: Listing) => {
    setUserListings((prev) => [listing, ...prev])
  }, [])

  const deleteListing = useCallback((id: string) => {
    setUserListings((prev) => prev.filter((l) => l.id !== id))
    setFavorites((prev) => prev.filter((f) => f !== id))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [id, ...prev],
    )
  }, [])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  const getListing = useCallback(
    (id: string) => listings.find((l) => l.id === id),
    [listings],
  )

  const resetDemo = useCallback(() => {
    setUserListings([])
    setFavorites([])
  }, [])

  const value: AppState = {
    listings,
    favorites,
    addListing,
    deleteListing,
    toggleFavorite,
    isFavorite,
    getListing,
    resetDemo,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp doit être utilisé dans <AppProvider>')
  return ctx
}
