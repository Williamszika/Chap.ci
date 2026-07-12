import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import type { Conversation } from '../types'
import { fetchConversations, subscribeAllMessages } from '../lib/messages'
import { useAuth } from './AuthContext'

const LS_READS = 'chapci.msgreads.v1'

interface NotificationsState {
  conversations: Conversation[]
  loading: boolean
  /** Nombre de conversations avec un message non lu. */
  unreadCount: number
  /** Ensemble des ids de conversations non lues. */
  unreadConvIds: Set<string>
  /** Recharge la liste des conversations. */
  refresh: () => void
  /** Marque une conversation comme lue (au moment de l'ouvrir). */
  markRead: (conversationId: string) => void
}

const NotificationsContext = createContext<NotificationsState | null>(null)

function loadReads(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_READS)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [reads, setReads] = useState<Record<string, number>>(() => loadReads())

  // Réf. toujours à jour des conversations (pour markRead sans re-création).
  const convRef = useRef<Conversation[]>(conversations)
  useEffect(() => {
    convRef.current = conversations
  }, [conversations])

  const refresh = useCallback(() => {
    if (!user) {
      setConversations([])
      return
    }
    setLoading(true)
    fetchConversations(user.id)
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false))
  }, [user])

  // Chargement initial + à chaque changement d'utilisateur.
  useEffect(() => {
    if (!user) {
      setConversations([])
      return
    }
    refresh()
  }, [user, refresh])

  // Temps réel : un nouveau message d'un tiers rafraîchit la liste.
  useEffect(() => {
    if (!user) return
    const unsub = subscribeAllMessages((m) => {
      if (m.senderId !== user.id) refresh()
    })
    return unsub
  }, [user, refresh])

  const markRead = useCallback((conversationId: string) => {
    // On mémorise au moins l'heure (serveur) du dernier message pour que le
    // badge se vide même si l'horloge du téléphone est décalée.
    const conv = convRef.current.find((c) => c.id === conversationId)
    const ts = Math.max(conv?.lastAt ?? 0, Date.now())
    setReads((prev) => {
      const next = { ...prev, [conversationId]: ts }
      try {
        localStorage.setItem(LS_READS, JSON.stringify(next))
      } catch {
        /* stockage indisponible */
      }
      return next
    })
  }, [])

  const unreadConvIds = useMemo(() => {
    if (!user) return new Set<string>()
    const s = new Set<string>()
    for (const c of conversations) {
      const fromOther = c.lastSenderId && c.lastSenderId !== user.id
      const seenAt = reads[c.id] ?? 0
      if (fromOther && (c.lastAt ?? 0) > seenAt) s.add(c.id)
    }
    return s
  }, [conversations, reads, user])

  const value: NotificationsState = {
    conversations,
    loading,
    unreadCount: unreadConvIds.size,
    unreadConvIds,
    refresh,
    markRead,
  }

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications(): NotificationsState {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications doit être utilisé dans <NotificationsProvider>')
  return ctx
}
