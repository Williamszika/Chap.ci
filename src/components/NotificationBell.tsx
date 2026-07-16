import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Heart, MessageSquare, CheckCheck } from 'lucide-react'
import {
  phpNotifications,
  phpNotifCount,
  phpNotifMarkRead,
  type PhpNotification,
} from '../lib/php'
import { isPhp } from '../lib/backend'
import { useAuth } from '../store/AuthContext'
import { timeAgo } from '../lib/format'

function iconFor(type: string) {
  if (type === 'favorite') return <Heart size={16} className="text-red-500" />
  if (type === 'message') return <MessageSquare size={16} className="text-primary-500" />
  return <Bell size={16} className="text-gray-500" />
}

/**
 * Cloche de notifications avec menu déroulant.
 * - Clic sur la cloche → ouvre la liste (lues + non lues).
 * - Non lue = texte en gras + pastille ; lue = affichage clair.
 * - Clic sur une notification → marquée lue puis redirection.
 * - « Tout marquer lu » dans l'en-tête, « Voir tout » en bas.
 */
export function NotificationBell({
  buttonClass,
  badgeClass,
}: {
  buttonClass?: string
  badgeClass?: string
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<PhpNotification[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Compteur des non-lues (rafraîchi périodiquement).
  useEffect(() => {
    if (!isPhp || !user) return
    let alive = true
    const tick = () => phpNotifCount().then((c) => { if (alive) setCount(c) })
    tick()
    const iv = setInterval(tick, 20000)
    return () => { alive = false; clearInterval(iv) }
  }, [user])

  // Charge la liste à l'ouverture du menu.
  useEffect(() => {
    if (!open || !isPhp || !user) return
    let alive = true
    setLoading(true)
    phpNotifications()
      .then((n) => { if (alive) setItems(n) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [open, user])

  // Ferme le menu au clic à l'extérieur ou avec Échap.
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!isPhp || !user) return null

  function openItem(n: PhpNotification) {
    if (!n.read) {
      phpNotifMarkRead(n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setCount((c) => Math.max(0, c - 1))
    }
    setOpen(false)
    if (n.link) navigate(n.link.replace(/^#/, ''))
  }

  function markAll() {
    if (!items.some((n) => !n.read)) return
    phpNotifMarkRead()
    setItems((prev) => prev.map((x) => ({ ...x, read: true })))
    setCount(0)
  }

  const unread = count

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className={buttonClass ?? 'relative rounded-full bg-white/15 p-2.5 active:scale-95'}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className={badgeClass ?? 'absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-primary-600'}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white text-gray-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="font-display text-sm font-bold">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 active:opacity-70"
              >
                <CheckCheck size={14} /> Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-[min(70vh,26rem)] overflow-y-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-gray-400">Chargement…</p>
            ) : items.length === 0 ? (
              <div className="grid place-items-center gap-2 py-10 text-center text-gray-400">
                <Bell size={32} className="text-gray-300" />
                <p className="text-sm">Aucune notification.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => openItem(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 active:bg-gray-100 ${
                        n.read ? 'bg-white' : 'bg-primary-50/60'
                      }`}
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gray-100">
                        {iconFor(n.type)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm ${
                            n.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'
                          }`}
                        >
                          {n.title}
                        </span>
                        <span
                          className={`block truncate text-[13px] leading-snug ${
                            n.read ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {n.body}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => { setOpen(false); navigate('/notifications') }}
            className="block w-full border-t border-gray-100 bg-gray-50 py-2.5 text-center text-xs font-semibold text-primary-600 active:bg-gray-100"
          >
            Voir toutes les notifications
          </button>
        </div>
      )}
    </div>
  )
}
