import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Listing } from '../types'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { isPhp } from '../lib/backend'
import { recordInterest } from '../lib/interests'
import { fetchListings, createListing, deleteListingRemote, updateListingRemote } from '../lib/api'
import { phpGetFavorites, phpAddFavorite, phpRemoveFavorite } from '../lib/php'
import { useAuth } from './AuthContext'

/** true si un backend distant (Supabase ou PHP) est disponible. */
const remoteEnabled = isPhp || isSupabaseConfigured

const LS_LISTINGS = 'chapci.listings.v1'
const LS_FAVORITES = 'chapci.favorites.v1'
const LS_MYIDS = 'chapci.myids.v1'

/** Données nécessaires pour créer une annonce (l'id et la date sont générés). */
export type NewListingInput = Omit<Listing, 'id' | 'createdAt' | 'currency'>

type Mode = 'supabase' | 'local'

interface AppState {
  listings: Listing[]
  loading: boolean
  mode: Mode
  favorites: string[]
  addListing: (input: NewListingInput) => Promise<Listing>
  updateListing: (id: string, input: NewListingInput) => Promise<Listing>
  deleteListing: (id: string) => Promise<void>
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  isMine: (id: string) => boolean
  getListing: (id: string) => Listing | undefined
  refresh: () => Promise<void>
  resetDemo: () => void
}

const AppContext = createContext<AppState | null>(null)

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed as T
  } catch {
    return fallback
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const [userListings, setUserListings] = useState<Listing[]>(() =>
    loadJSON<Listing[]>(LS_LISTINGS, []),
  )
  const [remoteListings, setRemoteListings] = useState<Listing[]>([])
  const [favorites, setFavorites] = useState<string[]>(() => loadJSON<string[]>(LS_FAVORITES, []))
  const [myIds, setMyIds] = useState<string[]>(() => loadJSON<string[]>(LS_MYIDS, []))
  const [mode, setMode] = useState<Mode>('local')
  const [loading, setLoading] = useState<boolean>(remoteEnabled)

  // Persistance locale
  useEffect(() => {
    localStorage.setItem(LS_LISTINGS, JSON.stringify(userListings))
  }, [userListings])
  useEffect(() => {
    localStorage.setItem(LS_FAVORITES, JSON.stringify(favorites))
  }, [favorites])
  useEffect(() => {
    localStorage.setItem(LS_MYIDS, JSON.stringify(myIds))
  }, [myIds])

  const refresh = useCallback(async () => {
    if (!remoteEnabled) {
      setMode('local')
      setLoading(false)
      return
    }
    try {
      const data = await fetchListings()
      setRemoteListings(data)
      setMode('supabase')
    } catch (e) {
      // Table absente ou hors-ligne : on bascule en mode local (démo + appareil)
      console.warn('Supabase indisponible, mode local activé.', e)
      setMode('local')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const listings = useMemo<Listing[]>(() => {
    // Uniquement les VRAIES annonces : en mode backend, les annonces partagées
    // (+ celles créées localement avant l'activation du backend). Plus aucune
    // annonce de démonstration — le site n'affiche que des données réelles.
    const base = mode === 'supabase' ? [...remoteListings, ...userListings] : userListings
    // Dédoublonnage par id (sécurité)
    const seen = new Set<string>()
    const unique = base.filter((l) => (seen.has(l.id) ? false : seen.add(l.id)))
    return unique.sort((a, b) => b.createdAt - a.createdAt)
  }, [mode, remoteListings, userListings])

  const addListing = useCallback(
    async (input: NewListingInput): Promise<Listing> => {
      if (mode === 'supabase') {
        // Le backend est joignable : l'annonce DOIT être enregistrée côté
        // serveur (sinon elle n'apparaîtrait que sur cet appareil et jamais dans
        // le catalogue partagé / les emails). En cas d'échec on RELANCE l'erreur
        // pour que l'utilisateur soit prévenu, au lieu d'un faux succès local.
        const created = await createListing(input, user?.id ?? null)
        setRemoteListings((prev) => [created, ...prev])
        setMyIds((prev) => [created.id, ...prev])
        return created
      }
      const local: Listing = {
        ...input,
        id: `user-${Date.now()}`,
        currency: 'FCFA',
        createdAt: Date.now(),
      }
      setUserListings((prev) => [local, ...prev])
      setMyIds((prev) => [local.id, ...prev])
      return local
    },
    [mode, user?.id],
  )

  const updateListing = useCallback(
    async (id: string, input: NewListingInput): Promise<Listing> => {
      const isLocal = id.startsWith('user-') || id.startsWith('seed-')
      // Annonce partagée (backend PHP ou Supabase) : on met à jour côté serveur
      // PUIS on rafraîchit le cache local, sinon la page détail resterait sur
      // l'ancienne version.
      if (mode === 'supabase' && !isLocal) {
        const updated = await updateListingRemote(id, input)
        setRemoteListings((prev) => prev.map((l) => (l.id === id ? updated : l)))
        return updated
      }
      // Annonce locale (créée sur l'appareil, ou mode 100 % local) : mise à jour
      // en mémoire, en conservant l'id et la date de création d'origine.
      const base = userListings.find((l) => l.id === id)
      const updated: Listing = {
        ...(base as Listing),
        ...input,
        id,
        currency: 'FCFA',
        createdAt: base?.createdAt ?? Date.now(),
      }
      setUserListings((prev) => prev.map((l) => (l.id === id ? updated : l)))
      return updated
    },
    [mode, userListings],
  )

  const deleteListing = useCallback(
    async (id: string) => {
      if (mode === 'supabase' && !id.startsWith('user-') && !id.startsWith('seed-')) {
        try {
          await deleteListingRemote(id)
          setRemoteListings((prev) => prev.filter((l) => l.id !== id))
        } catch (e) {
          console.error('Suppression impossible (droits).', e)
          throw e
        }
      } else {
        setUserListings((prev) => prev.filter((l) => l.id !== id))
      }
      setMyIds((prev) => prev.filter((x) => x !== id))
      setFavorites((prev) => prev.filter((f) => f !== id))
    },
    [mode],
  )

  // Référence toujours à jour des annonces (pour retrouver une catégorie sans
  // recréer les callbacks).
  const listingsRef = useRef<Listing[]>([])
  useEffect(() => { listingsRef.current = listings }, [listings])

  const toggleFavorite = useCallback((id: string) => {
    const has = favorites.includes(id)
    // Synchronise avec le serveur (en mode PHP + connecté) : l'ajout d'un favori
    // crée une notification pour le vendeur.
    if (isPhp && user) {
      if (has) phpRemoveFavorite(id)
      else phpAddFavorite(id)
    }
    if (!has) {
      // Ajout d'un favori = signal d'intérêt fort pour la catégorie (et la
      // sous-catégorie) de l'annonce → suggestions « produits similaires ».
      const l = listingsRef.current.find((x) => x.id === id)
      recordInterest(l?.categoryId, 2, l?.subcategory)
    }
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [id, ...prev]))
  }, [favorites, user])

  // Charge les favoris du serveur à la connexion (mode PHP) et les fusionne.
  useEffect(() => {
    if (!isPhp || !user) return
    let alive = true
    phpGetFavorites().then((ids) => {
      if (alive && ids.length) setFavorites((prev) => Array.from(new Set([...ids, ...prev])))
    })
    return () => { alive = false }
  }, [user])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])
  const isMine = useCallback((id: string) => myIds.includes(id), [myIds])
  const getListing = useCallback((id: string) => listings.find((l) => l.id === id), [listings])

  const resetDemo = useCallback(() => {
    setUserListings([])
    setFavorites([])
    setMyIds([])
  }, [])

  const value: AppState = {
    listings,
    loading,
    mode,
    favorites,
    addListing,
    updateListing,
    deleteListing,
    toggleFavorite,
    isFavorite,
    isMine,
    getListing,
    refresh,
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
