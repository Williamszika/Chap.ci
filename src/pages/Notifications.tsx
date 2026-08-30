import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Heart, MessageSquare, Trash2, Check, Star, Handshake, Sparkles } from 'lucide-react'
import {
  phpNotifications,
  phpNotifMarkRead,
  phpNotifDelete,
  type PhpNotification,
} from '../lib/php'
import { isPhp } from '../lib/backend'
import { useAuth } from '../store/AuthContext'
import { timeAgo } from '../lib/format'
import { RetourCompte } from '../components/RetourCompte'

// Icône colorée selon le type de notification (glyphe posé sur une tuile blanche).
function iconFor(type: string) {
  const t = (type || '').toLowerCase()
  if (t.includes('favori') || t.includes('favorite') || t.includes('like'))
    return <Heart size={18} className="fill-red-500 text-red-500" />
  if (t.includes('message') || t.includes('chat'))
    return <MessageSquare size={18} className="text-gray-600" />
  if (
    t.includes('achat') || t.includes('purchase') || t.includes('order') ||
    t.includes('offre') || t.includes('offer') || t.includes('deal') || t.includes('vente')
  )
    return <Handshake size={18} className="text-accent-ocre" />
  if (
    t.includes('avis') || t.includes('review') || t.includes('rating') ||
    t.includes('note') || t.includes('star')
  )
    return <Star size={18} className="fill-accent-gold text-accent-gold" />
  // Une nouveauté du site : ni une vente, ni un acheteur — une chose que
  // Chap.ci sait faire de plus. Elle mérite son propre glyphe, sinon elle se
  // confond avec le reste et se lit comme du bruit.
  if (t.includes('nouveaute'))
    return <Sparkles size={18} className="text-primary-600" />
  return <Bell size={18} className="text-accent-gold" />
}

export function Notifications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState<PhpNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false) // P15 : panne ≠ liste vide
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // P15 : on distingue une vraie absence de notifications d'une panne réseau,
  // et on propose de réessayer plutôt que d'afficher « Aucune notification ».
  const load = useCallback(() => {
    if (!isPhp || !user) { setLoading(false); return }
    setLoading(true)
    setLoadError(false)
    phpNotifications()
      .then((n) => setItems(n))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { load() }, [load])

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
    <div className="min-h-screen bg-cream-200 pb-16 md:min-h-0 md:pb-8">
      {/* En-tête : titre + action « Tout marquer lu » */}
      <div className="border-b border-line px-4 py-4 md:px-6 md:py-5">
        <RetourCompte className="mb-2" />
        <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[22px] font-extrabold text-ink md:text-2xl">Notifications</h1>
        {items.length > 0 && (
          selectMode ? (
            <button onClick={exitSelect} className="text-sm font-semibold text-gray-500 active:opacity-70">
              Annuler
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={markAll}
                disabled={unreadCount === 0}
                className="rounded-full px-2.5 py-1.5 text-sm font-semibold text-primary-600 transition enabled:hover:bg-primary-50 enabled:active:opacity-70 disabled:text-gray-300"
              >
                Tout marquer lu
              </button>
              <button
                onClick={() => setSelectMode(true)}
                aria-label="Gérer les notifications"
                className="grid h-11 w-11 place-items-center rounded-full text-gray-400 transition active:scale-95 md:hover:bg-[#F3EADB] md:hover:text-gray-600"
              >
                <Trash2 size={17} />
              </button>
            </div>
          )
        )}
        </div>
      </div>

      {/* Barre de sélection (mode suppression) */}
      {items.length > 0 && selectMode && (
        <div className="flex items-center justify-between gap-2 border-b border-line bg-white px-4 py-2.5 md:px-6">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 active:opacity-70"
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-md border ${
                allSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 bg-white'
              }`}
            >
              {allSelected && <Check size={13} />}
            </span>
            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <button
            onClick={deleteSelected}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-white transition disabled:bg-gray-200 disabled:text-gray-400 enabled:bg-red-500 enabled:active:scale-95"
          >
            <Trash2 size={15} /> Supprimer{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
        </div>
      )}

      {!user ? (
        <Empty text="Connectez-vous pour voir vos notifications." />
      ) : loading ? (
        <p className="px-4 py-12 text-center text-sm text-gray-400">Chargement…</p>
      ) : loadError ? (
        <div className="grid place-items-center gap-3 px-4 py-16 text-center text-gray-500">
          <Bell size={40} className="text-gray-300" />
          <p className="text-sm">Impossible de charger vos notifications.<br />Vérifiez votre connexion.</p>
          <button onClick={load} className="btn-primary mt-1 px-5 text-sm">
            Réessayer
          </button>
        </div>
      ) : items.length === 0 ? (
        <Empty text="Aucune notification pour l’instant." />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((n) => {
            const checked = selected.has(n.id)
            const unread = !n.read
            return (
              <li key={n.id}>
                <button
                  onClick={() => openItem(n)}
                  className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors md:px-6 ${
                    selectMode && checked
                      ? 'bg-primary-50'
                      : unread
                        ? 'bg-[#FCEEDD] hover:bg-[#FBE7D2]'
                        : 'hover:bg-[#FBF4E9]'
                  }`}
                >
                  {selectMode && (
                    <span
                      className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
                        checked ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {checked && <Check size={15} />}
                    </span>
                  )}
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line bg-white shadow-card">
                    {iconFor(n.type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[15px] leading-snug ${
                        unread ? 'font-bold text-ink' : 'font-semibold text-gray-800'
                      }`}
                    >
                      {n.title}
                    </span>
                    <span
                      className={`mt-0.5 block text-sm leading-snug ${
                        unread ? 'text-gray-600' : 'text-gray-500'
                      }`}
                    >
                      {n.body}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!selectMode && unread && (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center gap-2 px-4 py-16 text-center text-gray-400">
      <Bell size={40} className="text-gray-300" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}
