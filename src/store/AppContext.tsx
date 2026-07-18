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
  refresh: () => Promise<Mode>
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

  // Référence toujours à jour du mode et du chargement (P24) : addListing peut
  // ainsi savoir où enregistrer même si le chargement initial vient de finir.
  const modeRef = useRef<Mode>('local')
  const loadingRef = useRef<boolean>(remoteEnabled)

  const refresh = useCallback(async (): Promise<Mode> => {
    if (!remoteEnabled) {
      setMode('local'); modeRef.current = 'local'
      setLoading(false); loadingRef.current = false
      return 'local'
    }
    try {
      const data = await fetchListings()
      setRemoteListings(data)
      setMode('supabase'); modeRef.current = 'supabase'
      return 'supabase'
    } catch (e) {
      // Table absente ou hors-ligne : on bascule en mode local (démo + appareil)
      console.warn('Supabase indisponible, mode local activé.', e)
      setMode('local'); modeRef.current = 'local'
      return 'local'
    } finally {
      setLoading(false); loadingRef.current = false
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
      // P24 : si un backend existe mais que le chargement initial n'est pas
      // terminé, on le laisse d'abord déterminer le mode — sinon, sur connexion
      // lente, l'annonce partirait en local et ne serait jamais partagée.
      let effectiveMode = modeRef.current
      if (remoteEnabled && loadingRef.current) {
        effectiveMode = await refresh()
      }
      if (effectiveMode === 'supabase') {
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
    [user?.id, refresh],
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

  // Référence synchrone des favoris (P25) : deux clics rapprochés sur le cœur
  // lisent/écrivent la même source, donc l'action envoyée au serveur reste
  // cohérente avec l'affichage (pas de double « ajout » ni de désynchro).
  const favoritesRef = useRef<string[]>(favorites)
  useEffect(() => { favoritesRef.current = favorites }, [favorites])

  const toggleFavorite = useCallback((id: string) => {
    const has = favoritesRef.current.includes(id)
    const next = has ? favoritesRef.current.filter((f) => f !== id) : [id, ...favoritesRef.current]
    favoritesRef.current = next // mis à jour immédiatement, avant le re-rendu
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
    setFavorites(next)
  }, [user])

  // Favoris rattachés au COMPTE (P14) — uniquement en mode PHP. En mode Supabase,
  // les favoris restent LOCAUX à l'appareil : on n'y touche ni à la connexion ni à
  // la déconnexion (sinon se déconnecter effacerait les favoris de l'appareil).
  const prevUidRef = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    if (!isPhp) return
    const uid = user?.id ?? null
    const prev = prevUidRef.current
    prevUidRef.current = uid
    if (uid) {
      let alive = true
      // Connexion depuis un état anonyme : on FUSIONNE les favoris ajoutés hors
      // connexion avec ceux du compte (au lieu de les écraser) et on pousse les
      // nouveaux vers le serveur. Changement de compte (prev défini) : on remplace.
      const localAnon = prev ? [] : [...favoritesRef.current]
      phpGetFavorites()
        .then((serverIds) => {
          if (!alive) return
          const merged = Array.from(new Set([...localAnon, ...serverIds]))
          setFavorites(merged); favoritesRef.current = merged
          localAnon.filter((id) => !serverIds.includes(id)).forEach((id) => phpAddFavorite(id))
        })
        .catch(() => {})
      return () => { alive = false }
    }
    // Vraie déconnexion (on avait un compte, maintenant plus) : on vide, pour ne pas
    // exposer les favoris d'un compte à l'utilisateur suivant sur le même appareil.
    if (prev) { setFavorites([]); favoritesRef.current = [] }
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
