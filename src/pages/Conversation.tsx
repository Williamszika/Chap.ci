import { useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../lib/native'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Tag } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { useNotifications } from '../store/NotificationsContext'
import {
  fetchConversation,
  fetchMessages,
  sendMessage,
  subscribeMessages,
} from '../lib/messages'
import { DealCard } from '../components/DealCard'
import type { Conversation as Conv, Message } from '../types'

/** Initiale d'affichage de l'avatar, dérivée du nom de l'interlocuteur. */
function initial(name?: string): string {
  return (name?.trim().charAt(0) || '?').toUpperCase()
}

/** Heure courte « 10:02 » pour l'horodatage d'un message. */
function hhmm(ts: number): string {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function Conversation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { markRead, refresh } = useNotifications()
  const [conv, setConv] = useState<Conv | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !id) return
    let active = true
    Promise.all([fetchConversation(id, user.id), fetchMessages(id)])
      .then(([c, m]) => {
        if (!active) return
        setConv(c)
        setMessages(m)
      })
      .finally(() => active && setLoading(false))

    // La conversation est ouverte → marquée comme lue.
    markRead(id)

    const unsub = subscribeMessages(id, (m) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
      // Message reçu pendant la lecture : on garde la conversation « lue ».
      if (m.senderId !== user.id) markRead(id)
    })
    return () => {
      active = false
      unsub()
      // À la sortie, on rafraîchit la liste globale (badges à jour).
      refresh()
    }
  }, [id, user, markRead, refresh])

  useEffect(() => {
    // Défilement INTERNE à la zone des messages (ne fait pas défiler la page :
    // la barre de navigation et les 2 volets restent en place sur ordinateur).
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !user || !id) return
    setText('')
    setSending(true)
    // Affichage optimiste
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversationId: id,
      senderId: user.id,
      body,
      createdAt: Date.now(),
    }
    setMessages((prev) => [...prev, optimistic])
    try {
      const saved = await sendMessage(id, user.id, body)
      // Si le temps réel a déjà inséré ce message, on retire juste l'optimiste
      // (évite un doublon / conflit de clé React) ; sinon on le remplace.
      setMessages((prev) =>
        prev.some((m) => m.id === saved.id)
          ? prev.filter((m) => m.id !== optimistic.id)
          : prev.map((m) => (m.id === optimistic.id ? saved : m)),
      )
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setText(body)
    } finally {
      setSending(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-200 p-6 text-center">
        <p className="font-semibold text-gray-700">Connectez-vous pour accéder à la messagerie.</p>
        <Link to="/connexion" className="btn-primary">
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-200 md:mx-auto md:max-w-5xl md:px-4 md:py-4">
      <div className="flex min-h-screen flex-col bg-cream-200 md:h-[calc(100vh-7rem)] md:min-h-0 md:overflow-hidden md:rounded-3xl md:border md:border-line md:bg-white md:shadow-card">
          {/* En-tête — bouton « retour » vers la liste des conversations */}
          <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/90 px-3 py-2.5 backdrop-blur-md md:rounded-t-3xl">
            <button onClick={() => navigate('/messages')} aria-label="Retour" className="-ml-1 p-1">
              <ArrowLeft size={22} />
            </button>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ivoire-green to-ivoire-green-dark font-display text-base font-bold text-white">
              {initial(conv?.otherName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display font-bold text-gray-900">
                {conv?.otherName ?? 'Conversation'}
              </p>
            </div>
            {conv?.listingId && (
              <Link
                to={`/annonce/${conv.listingId}`}
                className="flex max-w-[46%] shrink-0 items-center gap-2 rounded-xl border border-line bg-cream-200 px-2 py-1.5 transition hover:bg-cream-100"
              >
                {conv.listingImage ? (
                  <img src={mediaUrl(conv.listingImage)} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-600">
                    <Tag size={16} />
                  </div>
                )}
                {conv.listingTitle && (
                  <span className="truncate text-xs font-semibold text-primary-700">{conv.listingTitle}</span>
                )}
              </Link>
            )}
          </header>

          {/* Suivi de transaction (achat / réception / avis) */}
          {id && conv?.listingId && <DealCard convId={id} userId={user.id} />}

          {/* Messages */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4 md:min-h-0">
            {loading ? (
              <p className="py-10 text-center text-sm text-gray-500">Chargement…</p>
            ) : messages.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Envoyez le premier message 👋
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === user.id
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] md:max-w-[66%] ${
                        mine
                          ? 'rounded-br-md bg-gradient-to-b from-primary-500 to-primary-700 text-white shadow-[0_4px_12px_-4px_rgba(247,127,0,0.45)]'
                          : 'rounded-bl-md border border-line bg-white text-gray-800 shadow-card'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <div className={`mt-1 text-[11px] ${mine ? 'text-white/75' : 'text-gray-500'}`}>
                        {hhmm(m.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Saisie */}
          <form
            onSubmit={send}
            className="safe-bottom sticky bottom-0 flex items-center gap-2 border-t border-line bg-white px-3 py-3 md:rounded-b-3xl"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Votre message…"
              className="flex-1 rounded-full border border-line bg-cream-200 px-4 py-3 text-[15px] outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-b from-primary-500 to-primary-700 text-white shadow-[0_4px_12px_-4px_rgba(247,127,0,0.5)] transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
              aria-label="Envoyer"
            >
              <Send size={18} />
            </button>
          </form>
      </div>
    </div>
  )
}
