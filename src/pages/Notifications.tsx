import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Heart, MessageSquare, CheckCheck, Trash2, Check } from 'lucide-react'
import {
  phpNotifications,
  phpNotifMarkRead,
  phpNotifDelete,
  type PhpNotification,
} from '../lib/php'
import { isPhp } from '../lib/backend'
import { useAuth } from '../store/AuthContext'
import { timeAgo } from '../lib/format'

function iconFor(type: string) {
  if (type === 'favorite') return <Heart size={18} className="text-red-500" />
  if (type === 'message') return <MessageSquare size={18} className="text-primary-500" />
  return <Bell size={18} className="text-gray-500" />
}

export function Notifications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState<PhpNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isPhp || !user) {
      setLoading(false)
      return
    }
    let alive = true
    phpNotifications()
      .then((n) => { if (alive) setItems(n) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [user])

  const unreadCount = items.filter((n) => !n.read).length
  const allSelected = items.length > 0 && selected.size === items.length

  function toggleSel(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openItem(n: PhpNotification) {
    if (selectMode) { toggleSel(n.id); return }
    if (!n.read) {
      phpNotifMarkRead(n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    }
    if (n.link) navigate(n.link.replace(/^#/, ''))
  }

  function markAll() {
    if (!unreadCount) return
    phpNotifMarkRead()
    setItems((prev) => prev.map((x) => ({ ...x, read: true })))
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((n) => n.id)))
  }

  async function deleteSelected() {
    const ids = Array.from(selected)
    if (!ids.length) return
    setItems((prev) => prev.filter((n) => !selected.has(n.id)))
    setSelected(new Set())
    setSelectMode(false)
    await phpNotifDelete(ids)
  }

  function exitSelect() {
    setSelectMode(false)
    setSelected(new Set())
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-16 md:mx-auto md:my-6 md:min-h-0 md:max-w-2xl md:rounded-3xl md:bg-white md:shadow-card">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="flex-1 font-display text-lg font-bold">Notifications</h1>
        {items.length > 0 && (
          selectMode ? (
            <button onClick={exitSelect} className="text-sm font-semibold text-gray-500 active:opacity-70">
              Annuler
            </button>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="text-sm font-semibold text-primary-600 active:opacity-70"
            >
              Sélectionner
            </button>
          )
        )}
      </header>

      {/* Barre d'actions */}
      {items.length > 0 && (
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-white px-3 py-2">
          {selectMode ? (
            <>
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 active:opacity-70"
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-md border ${
                    allSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300'
                  }`}
                >
                  {allSelected && <Check size={13} />}
                </span>
                {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              <button
                onClick={deleteSelected}
                disabled={selected.size === 0}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white transition disabled:bg-gray-200 disabled:text-gray-400 enabled:bg-red-500 enabled:active:scale-95"
              >
                <Trash2 size={15} /> Supprimer{selected.size > 0 ? ` (${selected.size})` : ''}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={markAll}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 disabled:text-gray-300 active:opacity-70"
              >
                <CheckCheck size={16} /> Tout marquer lu
              </button>
              <button
                onClick={() => setSelectMode(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 active:opacity-70"
              >
                <Trash2 size={15} /> Effacer
              </button>
            </>
          )}
        </div>
      )}

      <div className="p-3 md:p-4">
        {!user ? (
          <Empty text="Connectez-vous pour voir vos notifications." />
        ) : loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Chargement…</p>
        ) : items.length === 0 ? (
          <Empty text="Aucune notification pour l’instant." />
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const checked = selected.has(n.id)
              return (
                <li key={n.id}>
                  <button
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                      selectMode && checked
                        ? 'border-primary-300 bg-primary-50'
                        : n.read
                          ? 'border-gray-100 bg-white'
                          : 'border-primary-100 bg-primary-50/50'
                    }`}
                  >
                    {selectMode && (
                      <span
                        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
                          checked ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300'
                        }`}
                      >
                        {checked && <Check size={15} />}
                      </span>
                    )}
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gray-100">
                      {iconFor(n.type)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${n.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
                        {n.title}
                      </span>
                      <span className={`block text-sm leading-snug ${n.read ? 'text-gray-400' : 'text-gray-600'}`}>
                        {n.body}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!selectMode && !n.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center gap-2 py-16 text-center text-gray-400">
      <Bell size={40} className="text-gray-300" />
      <p className="text-sm">{text}</p>
    </div>
  )
}
