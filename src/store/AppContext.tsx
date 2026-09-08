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
import { isPhp } from '../lib/backend'
import { recordInterest } from '../lib/interests'
import { fetchListingsPage, createListing, deleteListingRemote, updateListingRemote } from '../lib/api'
import { phpGetFavorites, phpAddFavorite, phpRemoveFavorite } from '../lib/php'
import { useAuth } from './AuthContext'

/** Le backend distant (base TPE Cloud) est toujours disponible. */
const remoteEnabled = isPhp

const LS_LISTINGS = 'chapci.listings.v1'
const LS_FAVORITES = 'chapci.favorites.v1'
const LS_MYIDS = 'chapci.myids.v1'

/**
 * Données nécessaires pour créer une annonce (l'id et la date sont générés).
 *
 * `photosAnalysees` n'est PAS une propriété de l'annonce : c'est une
 * déclaration du client au serveur, le temps d'une requête — « l'analyse locale
 * des photos a bien tourné ici ». Elle ne se lit nulle part après. D'où le
 * `&` plutôt qu'un champ ajouté à `Listing`, qui la ferait traîner dans tout le
 * reste du programme.
 */
export type NewListingInput = Omit<Listing, 'id' | 'createdAt' | 'currency'> & {
  photosAnalysees?: boolean
}

type Mode = 'remote' | 'local'

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
    // Sécurité : si le type stocké ne correspond pas à celui attendu (donnée
    // corrompue ou héritée d'une ancienne version), on revient au fallback plutôt
    // que de planter le rendu — ex. `.filter` sur un non-tableau → écran blanc.
    if (Array.isArray(fallback) !== Array.isArray(parsed)) return fallback
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
      // ── LE CATALOGUE ARRIVE PAR PAGES (08/09/2026) ────────────────────────
      //
      // Il arrivait EN UN SEUL BLOC, et ce bloc était plafonné à 500 annonces
      // côté serveur. Deux conséquences, toutes deux invisibles jusqu'ici :
      //
      //   1. La 501ᵉ annonce n'existait pas pour le site. Jamais. Sans le
      //      moindre message — ni pour le visiteur, ni pour le vendeur dont
      //      l'annonce ne s'affichait nulle part. Ce n'était pas une
      //      hypothèse : c'est écrit dans la route, `$limit = 500`.
      //   2. Chaque visiteur payait le catalogue ENTIER avant de voir la
      //      première carte — sur un forfait d'Abidjan, et sur une page où il
      //      ne regardera que six annonces.
      //
      // La PREMIÈRE page suffit à peindre l'accueil : on la rend tout de
      // suite. Les suivantes se glissent derrière, l'une après l'autre, sans
      // que personne attende. La recherche du site continue de filtrer en
      // mémoire — elle tolère les fautes, comprend le Nouchi et trie par
      // distance, toutes choses qu'un SQL ne sait pas faire — et se complète à
      // mesure que les pages entrent.
      const PAGE = 100          // la borne dure du serveur
      const PLAFOND = 5000      // au-delà, il faudra une vraie recherche serveur

      // La demande partie AVANT React (voir index.html, en bas). On la
      // consomme une seule fois : un rechargement volontaire doit repartir
      // vers le serveur, pas resservir la réponse du démarrage.
      const avance = (window as unknown as { __chapciAnnonces?: Promise<Listing[] | null> | null }).__chapciAnnonces
      if (avance) (window as unknown as { __chapciAnnonces?: unknown }).__chapciAnnonces = null
      const premiere = (avance ? await avance : null) ?? await fetchListingsPage(0, PAGE)
      setRemoteListings(premiere)
      setMode('remote'); modeRef.current = 'remote'

      if (premiere.length === PAGE) {
        // En arrière-plan : on ne bloque NI le rendu, NI le retour de refresh().
        void (async () => {
          const vues = new Set(premiere.map((l) => l.id))
          let offset = PAGE
          try {
            for (;;) {
              const page = await fetchListingsPage(offset, PAGE)
              if (page.length === 0) break
              // Une annonce publiée pendant qu'on pagine décale les suivantes
              // et peut en renvoyer une deux fois. On dédoublonne plutôt que
              // de laisser la même carte apparaître à deux endroits.
              const neuves = page.filter((l) => !vues.has(l.id))
              for (const l of neuves) vues.add(l.id)
              if (neuves.length) setRemoteListings((avant) => [...avant, ...neuves])
              offset += PAGE
              if (page.length < PAGE || offset >= PLAFOND) break
            }
          } catch {
            // Réseau coupé en cours de pagination : on garde ce qui est arrivé.
            // Mieux vaut un catalogue partiel qu'une page vide.
          }
        })()
      }
      return 'remote'
    } catch (e) {
      // Serveur injoignable : on bascule en mode local (annonces de l'appareil).
      console.warn('Backend distant indisponible, mode local activé.', e)
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
    const base = mode === 'remote' ? [...remoteListings, ...userListings] : userListings
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
      if (effectiveMode === 'remote') {
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
      // Annonce partagée (base TPE Cloud) : on met à jour côté serveur
      // PUIS on rafraîchit le cache local, sinon la page détail resterait sur
      // l'ancienne version.
      if (mode === 'remote' && !isLocal) {
        const updated = await updateListingRemote(id, input)
        setRemoteListings((prev) => {
          // L'annonce était MASQUÉE : elle n'est donc pas dans la liste publique
          // chargée au démarrage, et un simple `map` ne l'y remettrait pas — le
          // vendeur qui vient de la corriger atterrissait sur « Annonce
          // introuvable ». On l'ajoute quand elle redevient visible.
          if (!prev.some((l) => l.id === id)) return updated.hidden ? prev : [updated, ...prev]
          return prev.map((l) => (l.id === id ? updated : l))
        })
        return updated
      }
      // Annonce locale (créée sur l'appareil, ou mode 100 % local) : mise à jour
      // en mémoire, en conservant l'id et la date de création d'origine.
      const base = userListings.find((l) => l.id === id)
      if (!base) {
        // L'annonce n'est pas présente sur cet appareil (elle existe côté serveur,
        // mais le mode est retombé en local). On NE prétend PAS l'avoir enregistrée :
        // on signale l'échec pour que l'utilisateur réessaie une fois reconnecté.
        throw new Error('Modification impossible hors connexion. Réessayez une fois reconnecté.')
      }
      const updated: Listing = {
        ...base,
        ...input,
        id,
        currency: 'FCFA',
        createdAt: base.createdAt,
      }
      setUserListings((prev) => prev.map((l) => (l.id === id ? updated : l)))
      return updated
    },
    [mode, userListings],
  )

  const deleteListing = useCallback(
    async (id: string) => {
      if (mode === 'remote' && !id.startsWith('user-') && !id.startsWith('seed-')) {
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

  // Favoris rattachés au COMPTE (P14) : à la connexion on fusionne les favoris
  // anonymes de l'appareil avec ceux du compte ; à la déconnexion on les retire de
  // l'appareil (pour ne pas les exposer à l'utilisateur suivant).
  const prevUidRef = useRef<string | null | undefined>(undefined)
  useEffect(() => {
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
