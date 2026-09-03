import { useEffect, useRef, useState, type ReactNode } from 'react'
import { mediaUrl } from '../lib/native'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Tag, ShieldCheck, MoreVertical, Trash2, Archive, Ban, Flag, X, Zap } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { useNotifications } from '../store/NotificationsContext'
import {
  fetchConversation,
  fetchMessages,
  sendMessage,
  subscribeMessages,
} from '../lib/messages'
import {
  phpDeleteMessage,
  phpDeleteConversation,
  phpArchiveConversation,
  phpBlockConversation,
  phpReportConversation,
  phpProposerOffre,
  phpRepondreOffre,
} from '../lib/php'
import { fetchReponses, type ReponsePrete } from '../lib/api'
import { DealCard } from '../components/DealCard'
import { OffreSheet, OffreCarte } from '../components/Offre'
import type { Conversation as Conv, Message } from '../types'

/** Une ligne du menu d'actions (feuille du bas). */
function MenuItem({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] transition hover:bg-cream-100 ${danger ? 'text-red-600' : 'text-gray-800'}`}
    >
      {icon} {label}
    </button>
  )
}

const REPORT_REASONS = ['Spam', 'Harcèlement', 'Arnaque / fraude', 'Contenu choquant', 'Autre']

/** Feuille de signalement — cases à cocher + détail libre. */
function ReportModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reasons: string[], details: string) => void }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [details, setDetails] = useState('')
  const chosen = REPORT_REASONS.filter((r) => checked[r])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-gray-900">Signaler la conversation</h2>
          <button onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-full text-gray-500 transition hover:bg-cream-100">
            <X size={18} />
          </button>
        </div>
        <p className="mb-3 text-sm text-gray-600">Choisissez un ou plusieurs motifs.</p>
        <div className="space-y-1">
          {REPORT_REASONS.map((r) => (
            <label key={r} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-cream-100">
              <input
                type="checkbox"
                checked={!!checked[r]}
                onChange={(e) => setChecked((c) => ({ ...c, [r]: e.target.checked }))}
                className="h-5 w-5 accent-primary-500"
              />
              <span className="text-[15px] text-gray-800">{r}</span>
            </label>
          ))}
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Détails (facultatif)…"
          className="input mt-3"
        />
        <button
          disabled={chosen.length === 0}
          onClick={() => onSubmit(chosen, details.trim())}
          className="btn-primary mt-4 w-full disabled:opacity-40"
        >
          Envoyer le signalement
        </button>
      </div>
    </div>
  )
}

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
  // « Faire une offre » : la feuille du montant, et le verrou pendant qu'une
  // réponse (accepter / refuser) part au serveur.
  const [offreOuverte, setOffreOuverte] = useState(false)
  const [offreEnCours, setOffreEnCours] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menu, setMenu] = useState<null | { kind: 'conv' } | { kind: 'msg'; id: string }>(null)
  const [reporting, setReporting] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [archived, setArchived] = useState(false)
  // Les phrases enregistrées du vendeur, et la feuille qui les propose.
  const [reponses, setReponses] = useState<ReponsePrete[]>([])
  const [feuilleReponses, setFeuilleReponses] = useState(false)
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
        setBlocked(!!c?.blockedByMe)
        setArchived(!!c?.archived)
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

  // Les réponses toutes prêtes, chargées une fois. Sans elles la barre de
  // saisie reste telle quelle : l'éclair n'apparaît que s'il a quelque chose
  // à proposer.
  useEffect(() => {
    if (!user) return
    let actif = true
    fetchReponses().then((r) => actif && setReponses(r)).catch(() => {})
    return () => { actif = false }
  }, [user])

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
      // La réponse automatique du vendeur, s'il en a une : elle apparaît dans
      // la seconde, au lieu d'attendre le prochain sondage.
      if (saved.auto) {
        const auto = saved.auto
        setMessages((prev) => (prev.some((m) => m.id === auto.id) ? prev : [...prev, auto]))
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setText(body)
    } finally {
      setSending(false)
    }
  }

  /** « Proposer un prix » — sert aussi de contre-proposition. */
  async function proposerOffre(montant: number) {
    if (!id) return
    const saved = await phpProposerOffre(id, montant)
    setMessages((prev) => {
      // Ma précédente offre encore ouverte est « remplacée » côté serveur :
      // on le reflète tout de suite, sans attendre le prochain sondage.
      const maj = prev.map((m) => (m.offre && m.offre.par === user?.id && m.offre.statut === 'proposee'
        ? { ...m, offre: { ...m.offre, statut: 'remplacee' as const } } : m))
      return maj.some((m) => m.id === saved.id) ? maj : [...maj, saved]
    })
    setOffreOuverte(false)
  }

  async function repondreOffre(mid: string, action: 'accepter' | 'refuser') {
    if (!id) return
    setOffreEnCours(true)
    try {
      const r = await phpRepondreOffre(id, mid, action)
      setMessages((prev) => {
        const maj = prev.map((m) => (m.id === mid ? { ...m, offre: r.offre } : m))
        return maj.some((m) => m.id === r.message.id) ? maj : [...maj, r.message]
      })
    } catch {
      // Le serveur a dit non (offre déjà close, ou plus la mienne à traiter) :
      // on relit le fil plutôt que d'afficher un état qu'on a deviné.
      try { setMessages(await fetchMessages(id)) } catch { /* le prochain sondage le fera */ }
    } finally {
      setOffreEnCours(false)
    }
  }

  async function delMessage(mid: string) {
    setMenu(null)
    if (!id || !window.confirm('Supprimer ce message ? Il disparaîtra pour tout le monde.')) return
    try {
      await phpDeleteMessage(id, mid)
      setMessages((prev) => prev.map((m) => (m.id === mid ? { ...m, deleted: true, body: '' } : m)))
    } catch (e) {
      window.alert((e as Error).message)
    }
  }

  async function delConv() {
    setMenu(null)
    if (!id || !window.confirm('Supprimer cette conversation de votre côté ? L’autre personne garde la sienne.')) return
    try {
      await phpDeleteConversation(id)
      refresh()
      navigate('/messages')
    } catch (e) {
      window.alert((e as Error).message)
    }
  }

  async function toggleArchive() {
    setMenu(null)
    if (!id) return
    const next = !archived
    try {
      await phpArchiveConversation(id, next)
      setArchived(next)
      refresh()
      if (next) navigate('/messages') // archivée → on quitte le fil
    } catch (e) {
      window.alert((e as Error).message)
    }
  }

  async function toggleBlock() {
    setMenu(null)
    if (!id) return
    try {
      const b = await phpBlockConversation(id, !blocked)
      setBlocked(b)
    } catch (e) {
      window.alert((e as Error).message)
    }
  }

  async function submitReport(reasons: string[], details: string) {
    if (!id) return
    try {
      await phpReportConversation(id, reasons, details)
      setReporting(false)
      window.alert('Signalement envoyé. Merci.')
    } catch (e) {
      window.alert((e as Error).message)
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
            <button onClick={() => navigate('/messages')} aria-label="Retour" className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full transition md:hover:bg-cream-100">
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
            <button
              onClick={() => setMenu({ kind: 'conv' })}
              aria-label="Options de la conversation"
              className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-full transition md:hover:bg-cream-100"
            >
              <MoreVertical size={20} />
            </button>
          </header>

          {/* Suivi de transaction (achat / réception / avis) */}
          {id && conv?.listingId && <DealCard convId={id} userId={user.id} />}

          {/* Rappel de sécurité — court, et seulement au DÉBUT d'une conversation.
              Le bloc long existe sur la fiche annonce, mais la négociation et la
              décision de payer se prennent ICI, parfois des jours plus tard. Une
              ligne suffit ; répétée à chaque message, elle ne serait plus lue. */}
          {!loading && messages.length <= 2 && (
            <div className="mx-3 mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-amber-700" />
              <p className="text-[12.5px] leading-relaxed text-amber-800">
                Restez sur Chap.ci pour échanger, et <b>vérifiez le produit avant de payer</b>.
                Rencontrez-vous dans un lieu public, ou choisissez le paiement à la livraison.
              </p>
            </div>
          )}

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
                  <div key={m.id} className={`group flex items-center gap-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {mine && !m.deleted && !m.id.startsWith('tmp-') && (
                      <button
                        onClick={() => setMenu({ kind: 'msg', id: m.id })}
                        aria-label="Options du message"
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-gray-400 opacity-60 transition hover:bg-cream-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <MoreVertical size={16} />
                      </button>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] md:max-w-[66%] ${
                        mine
                          ? 'rounded-br-md bg-gradient-to-b from-primary-500 to-primary-700 text-white shadow-[0_4px_12px_-4px_rgba(0,158,96,0.45)]'
                          : 'rounded-bl-md border border-line bg-white text-gray-800 shadow-card'
                      }`}
                    >
                      {m.deleted ? (
                        <p className={`whitespace-pre-wrap break-words italic ${mine ? 'text-white/80' : 'text-gray-500'}`}>Message supprimé</p>
                      ) : m.offre ? (
                        <OffreCarte
                          message={m}
                          moi={user.id}
                          mine={mine}
                          enCours={offreEnCours}
                          onRepondre={(action) => void repondreOffre(m.id, action)}
                          onContre={() => setOffreOuverte(true)}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      )}
                      <div className={`mt-1 text-[11px] ${mine ? 'text-white/75' : 'text-gray-500'}`}>
                        {/* Une réponse automatique se dit : l'acheteur doit
                            savoir qu'une vraie personne n'a pas encore lu. */}
                        {m.auto && <span className="mr-1 font-bold">🤖 Réponse automatique ·</span>}
                        {hhmm(m.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Saisie — ou barre de blocage si j'ai bloqué la personne */}
          {blocked ? (
            <div className="safe-bottom sticky bottom-0 flex items-center justify-between gap-3 border-t border-line bg-white px-4 py-3 md:rounded-b-3xl">
              <p className="text-sm text-gray-600">Vous avez bloqué cette personne.</p>
              <button onClick={toggleBlock} className="btn-outline px-3 py-1.5 text-sm">
                Débloquer
              </button>
            </div>
          ) : (
            <form
              onSubmit={send}
              className="safe-bottom sticky bottom-0 flex items-center gap-2 border-t border-line bg-white px-3 py-3 md:rounded-b-3xl"
            >
              {/* « Proposer un prix » : l'offre structurée, à la place de
                  « dernier prix ? ». Sert aussi de contre-proposition. */}
              {conv?.listingId && (
                <button
                  type="button"
                  onClick={() => setOffreOuverte(true)}
                  aria-label="Proposer un prix"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream-100 text-primary-600 transition active:scale-95"
                >
                  <Tag size={18} />
                </button>
              )}
              {reponses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFeuilleReponses(true)}
                  aria-label="Réponses toutes prêtes"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream-100 text-primary-600 transition active:scale-95"
                >
                  <Zap size={18} />
                </button>
              )}
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Votre message…"
                className="flex-1 rounded-full border border-line bg-cream-200 px-4 py-3 text-[15px] outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-b from-primary-500 to-primary-700 text-white shadow-[0_4px_12px_-4px_rgba(0,158,96,0.5)] transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
                aria-label="Envoyer"
              >
                <Send size={18} />
              </button>
            </form>
          )}

          {/* Réponses toutes prêtes — un appui pose la phrase dans la barre de
              saisie. On n'envoie pas à la place du vendeur : il relit, il
              complète le prix ou la commune, puis il envoie. */}
          {offreOuverte && (
            <OffreSheet
              // Le point de départ : la dernière offre du fil, sinon rien — la
              // conversation ne connaît pas le prix de l'annonce.
              prix={[...messages].reverse().find((m) => m.offre)?.offre?.montant ?? 0}
              titre="Proposer un prix"
              onClose={() => setOffreOuverte(false)}
              onEnvoyer={proposerOffre}
            />
          )}
          {feuilleReponses && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setFeuilleReponses(false)}>
              <div className="w-full max-w-md rounded-t-3xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
                <p className="flex items-center gap-1.5 px-1 font-display text-[15px] font-extrabold text-ink">
                  <Zap size={16} className="text-primary-600" /> Réponses toutes prêtes
                </p>
                <div className="mt-3 space-y-1.5">
                  {reponses.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setText(r.texte); setFeuilleReponses(false) }}
                      className="w-full rounded-2xl bg-cream-100 px-4 py-3 text-left text-[14.5px] text-gray-800 transition hover:bg-cream-200"
                    >
                      {r.texte}
                    </button>
                  ))}
                </div>
                <p className="mt-3 px-1 text-[12px] text-gray-500">
                  Vos phrases se gèrent depuis la liste des messages.
                </p>
              </div>
            </div>
          )}

          {/* Feuille d'actions — appui sur « ⋮ » d'un message ou de la conversation */}
          {menu && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setMenu(null)}>
              <div className="w-full max-w-md rounded-t-3xl bg-white p-2 pb-6" onClick={(e) => e.stopPropagation()}>
                {menu.kind === 'msg' ? (
                  <MenuItem icon={<Trash2 size={18} />} label="Supprimer le message" danger onClick={() => delMessage(menu.id)} />
                ) : (
                  <>
                    <MenuItem icon={<Archive size={18} />} label={archived ? 'Désarchiver la conversation' : 'Archiver la conversation'} onClick={toggleArchive} />
                    <MenuItem icon={<Ban size={18} />} label={blocked ? 'Débloquer la personne' : 'Bloquer la personne'} onClick={toggleBlock} />
                    <MenuItem icon={<Flag size={18} />} label="Signaler la conversation" danger onClick={() => { setMenu(null); setReporting(true) }} />
                    <MenuItem icon={<Trash2 size={18} />} label="Supprimer la conversation" danger onClick={delConv} />
                  </>
                )}
              </div>
            </div>
          )}

          {reporting && <ReportModal onClose={() => setReporting(false)} onSubmit={submitReport} />}
      </div>
    </div>
  )
}
