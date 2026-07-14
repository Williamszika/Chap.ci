import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { useNotifications } from '../store/NotificationsContext'
import {
  fetchConversation,
  fetchMessages,
  sendMessage,
  subscribeMessages,
} from '../lib/messages'
import type { Conversation as Conv, Message } from '../types'

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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-semibold text-gray-700">Connectez-vous pour accéder à la messagerie.</p>
        <Link to="/connexion" className="btn-primary">
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f5f7] lg:mx-auto lg:max-w-2xl">
      {/* En-tête */}
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-2.5">
        <button onClick={() => navigate('/messages')} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-gray-900">{conv?.otherName ?? 'Conversation'}</p>
          {conv?.listingId && conv?.listingTitle && (
            <Link to={`/annonce/${conv.listingId}`} className="truncate text-xs text-primary-600">
              {conv.listingTitle}
            </Link>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Chargement…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            Envoyez le premier message 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user.id
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] ${
                    mine
                      ? 'rounded-br-md bg-primary-500 text-white'
                      : 'rounded-bl-md bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  {m.body}
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
        className="sticky bottom-0 flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-2.5 safe-bottom"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Votre message…"
          className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-[15px] outline-none"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-500 text-white disabled:opacity-40"
          aria-label="Envoyer"
        >
          <Send size={19} />
        </button>
      </form>
    </div>
  )
}
