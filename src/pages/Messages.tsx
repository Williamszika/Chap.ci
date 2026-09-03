import { useCallback, useEffect, useMemo, useState } from 'react'
import { mediaUrl, thumbUrl } from '../lib/native'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bot, MessageCircle, LogIn, Tag } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { useNotifications } from '../store/NotificationsContext'
import { timeAgo, formatFCFA } from '../lib/format'
import type { Conversation } from '../types'

/**
 * « Messages » — répondre vite, sans chercher (maquette validée le 27/08).
 *
 * Le classement est l'écran : une conversation à laquelle on n'a pas répondu
 * remonte en haut avec le nombre de jours d'attente et l'annonce concernée.
 * Un acheteur qui attend deux jours ne revient pas — et le taux de réponse est
 * le premier chiffre qu'il regarde avant d'écrire au suivant.
 */

type Filtre = 'sans' | 'toutes' | 'acheteurs' | 'archivees'

/** Initiale d'affichage de l'avatar, dérivée du nom de l'interlocuteur. */
function avatarInitial(name?: string): string {
  return (name?.trim().charAt(0) || '?').toUpperCase()
}

/**
 * Couleur du rond, tirée du nom : la même personne garde la même teinte d'une
 * fois sur l'autre, on la reconnaît avant d'avoir lu.
 */
const TEINTES = [
  'bg-cream-100 text-primary-700',
  'bg-blue-50 text-blue-700',
  'bg-emerald-50 text-emerald-700',
  'bg-pink-50 text-pink-700',
]
function teinte(nom?: string): string {
  let n = 7
  for (const c of nom ?? '') n = (n * 31 + c.charCodeAt(0)) % 9973
  return TEINTES[n % TEINTES.length]
}

/** « 2 j sans réponse », « 3 h sans réponse » — l'attente, en clair. */
function attente(depuis: number): string {
  const min = Math.max(0, Math.round((Date.now() - depuis) / 60000))
  if (min >= 2880) return `${Math.floor(min / 1440)} j sans réponse`
  if (min >= 1440) return '1 j sans réponse'
  if (min >= 60) return `${Math.floor(min / 60)} h sans réponse`
  return 'à répondre'
}

/** Liste des conversations (réutilisée dans les deux volets). */
export function ConversationList({ activeId }: { activeId?: string }) {
  const navigate = useNavigate()
  // Arrivé depuis le compte ? La flèche y ramène, et elle reste visible sur
  // ordinateur : sinon on entre dans les messages depuis le tableau de bord
  // sans aucun chemin de retour.
  const { state } = useLocation()
  const retour = (state as { retour?: string } | null)?.retour
  const { user, enabled, loading: authLoading } = useAuth()
  const { conversations: convs, loading, unreadConvIds, refresh } = useNotifications()
  const [filtre, setFiltre] = useState<Filtre>('toutes')

  useEffect(() => {
    if (user) refresh()
  }, [user, refresh])

  const moi = user?.id

  /**
   * Une conversation « sans réponse » : le dernier mot HUMAIN est à l'autre.
   * La réponse automatique du vendeur ne compte pas — sinon cet écran se
   * viderait tout seul et l'acheteur attendrait quand même.
   */
  const sansReponse = useCallback(
    (c: Conversation) => {
      const dernier = c.dernierHumain ?? c.lastSenderId
      return !c.archived && !!dernier && dernier !== moi
    },
    [moi],
  )

  const compte = useMemo(() => ({
    sans: convs.filter(sansReponse).length,
    toutes: convs.filter((c) => !c.archived).length,
    acheteurs: convs.filter((c) => !c.archived && c.sellerId === moi).length,
    archivees: convs.filter((c) => c.archived).length,
  }), [convs, moi, sansReponse])

  const liste = useMemo(() => {
    let out = convs.filter((c) => !c.archived)
    if (filtre === 'sans') out = out.filter(sansReponse)
    else if (filtre === 'acheteurs') out = out.filter((c) => c.sellerId === moi)
    else if (filtre === 'archivees') out = convs.filter((c) => c.archived)
    // Celles qui attendent d'abord, la plus ancienne en tête : c'est celle-là
    // qu'on risque de perdre.
    return [...out].sort((a, b) => {
      const sa = sansReponse(a) ? 1 : 0, sb = sansReponse(b) ? 1 : 0
      if (sa !== sb) return sb - sa
      if (sa === 1) return (a.lastAt ?? 0) - (b.lastAt ?? 0)
      return (b.lastAt ?? 0) - (a.lastAt ?? 0)
    })
  }, [convs, filtre, moi, sansReponse])

  const renderRow = (c: Conversation) => {
    const unread = unreadConvIds.has(c.id)
    const isActive = c.id === activeId
    const attend = sansReponse(c)
    const dernier = c.dernierHumain ?? c.lastSenderId
    const jaiRepondu = !!dernier && dernier === moi
    return (
      <Link
        key={c.id}
        to={`/messages/${c.id}`}
        className={`flex items-start gap-3 px-4 py-3.5 transition hover:bg-cream-100 ${
          isActive ? 'bg-primary-50' : attend ? 'bg-red-50/40' : unread ? 'bg-primary-50/50' : ''
        }`}
      >
        <div className="relative shrink-0">
          <div className={`grid h-12 w-12 place-items-center rounded-full font-display text-lg font-extrabold ${teinte(c.otherName)}`}>
            {avatarInitial(c.otherName)}
          </div>
          {unread && (
            <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-primary-500 ring-2 ring-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`min-w-0 truncate font-display text-gray-900 ${unread ? 'font-extrabold' : 'font-bold'}`}>
              {c.otherName}
              {attend && (
                <span className="ml-1.5 whitespace-nowrap rounded-md bg-red-50 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-red-600">
                  {attente(c.lastAt ?? Date.now())}
                </span>
              )}
            </p>
            {/* L'attente est déjà dite par la pastille rouge : on ne l'écrit
                pas deux fois sur la même ligne. */}
            {!attend && (
              <span className={`shrink-0 text-[11px] ${unread ? 'font-bold text-primary-600' : 'text-gray-500'}`}>
                {c.lastAt ? timeAgo(c.lastAt) : ''}
              </span>
            )}
          </div>
          {/* Une offre qui M'attend : c'est ici que le vendeur la voit avant
              d'ouvrir — « 3 offres reçues » se lit ligne par ligne. */}
          {c.offreEnAttente != null && (
            <p className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-extrabold text-amber-800">
              <Tag size={11} /> Offre : {formatFCFA(c.offreEnAttente)}
            </p>
          )}
          <p className={`truncate text-sm ${attend || unread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
            {c.lastMessage
              ? c.lastAuto ? `Réponse automatique : « ${c.lastMessage} »`
                : jaiRepondu ? `Vous : « ${c.lastMessage} »` : `« ${c.lastMessage} »`
              : 'Nouvelle conversation'}
          </p>
          {c.listingTitle && (
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium text-primary-600">
              {c.listingImage && (
                <img src={mediaUrl(thumbUrl(c.listingImage))} alt=""
                  className="h-4 w-4 shrink-0 rounded object-cover" />
              )}
              <span className="truncate">{c.listingTitle}</span>
            </p>
          )}
        </div>
        {jaiRepondu && c.sellerId === moi && (
          <span className="mt-1 shrink-0 whitespace-nowrap rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700">
            Répondu
          </span>
        )}
      </Link>
    )
  }

  const vide = compte.toutes === 0 && compte.archivees === 0

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-white/90 px-3 py-3 backdrop-blur-md md:rounded-t-3xl">
        <button onClick={() => (retour ? navigate(retour) : navigate(-1))} aria-label="Retour"
          className={`-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-cream-100 ${retour ? '' : 'md:hidden'}`}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-extrabold text-ink">Messages</h1>
        {compte.sans > 0 && (
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1.5 text-[12px] font-extrabold text-white">
            {compte.sans}
          </span>
        )}
      </header>

      <div className="flex-1 md:min-h-0 md:overflow-y-auto">
        {!enabled || (!user && !authLoading) ? (
          <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-50">
              <MessageCircle size={36} className="text-primary-500" />
            </div>
            <p className="text-lg font-bold text-gray-800">Connectez-vous pour discuter</p>
            <p className="max-w-xs text-sm text-gray-500">
              Créez un compte pour contacter les vendeurs et suivre vos conversations.
            </p>
            <button onClick={() => navigate('/connexion')} className="btn-primary mt-2">
              <LogIn size={18} /> Se connecter
            </button>
          </div>
        ) : loading || authLoading ? (
          <div className="py-24 text-center text-sm text-gray-500">Chargement…</div>
        ) : vide ? (
          <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
            <div className="text-5xl">💬</div>
            <p className="text-lg font-bold text-gray-800">Aucune conversation</p>
            <p className="max-w-xs text-sm text-gray-500">
              Ouvrez une annonce et appuyez sur « Contacter le vendeur » pour démarrer une discussion.
            </p>
            <Link to="/explorer" className="btn-outline mt-2 py-2">
              Explorer les annonces
            </Link>
          </div>
        ) : (
          <div className="space-y-3 pb-4 md:pb-0">
            {/* Le raccourci vers les réponses automatiques, EN HAUT et sur une
                seule ligne. Les deux réglages vivaient au bas de cette liste :
                le Patron, qui les avait demandés, ne les a jamais vus et les a
                redemandés deux fois. Ils ont maintenant leur écran ; ici il ne
                reste que la porte. */}
            <div className="bg-white">
              {compte.acheteurs > 0 && (
                <div className="px-4 pt-3">
                  <button onClick={() => navigate('/compte', { state: { tab: 'reponses' } })}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-accent-ocre/30 bg-cream-100 px-3 py-2.5 text-left">
                    <Bot size={16} className="shrink-0 text-primary-600" />
                    <span className="min-w-0 flex-1 text-[12.5px] font-bold text-ink">
                      Répondre plus vite
                      {/* « du professionnel » : la phrase d'accueil est réservée
                          aux comptes approuvés, autant le dire avant le clic. */}
                      <span className="mt-0.5 block text-[11.5px] font-medium leading-snug text-gray-600">
                        Vos phrases toutes prêtes, et la réponse automatique du professionnel.
                      </span>
                    </span>
                    <span className="shrink-0 text-gray-400" aria-hidden>›</span>
                  </button>
                </div>
              )}

              {/* Filtrer — « sans réponse » d'abord, c'est le tas qui coûte cher. */}
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
                {compte.sans > 0 && (
                  <button onClick={() => setFiltre('sans')}
                    className={`chip-etat ${filtre === 'sans' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 ring-1 ring-red-200'}`}>
                    Sans réponse · {compte.sans}
                  </button>
                )}
                <button onClick={() => setFiltre('toutes')}
                  className={`chip-etat ${filtre === 'toutes' ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
                  Toutes · {compte.toutes}
                </button>
                {compte.acheteurs > 0 && (
                  <button onClick={() => setFiltre('acheteurs')}
                    className={`chip-etat ${filtre === 'acheteurs' ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
                    Acheteurs
                  </button>
                )}
                {compte.archivees > 0 && (
                  <button onClick={() => setFiltre('archivees')}
                    className={`chip-etat ${filtre === 'archivees' ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
                    Archivées
                  </button>
                )}
              </div>
            </div>

            {liste.length === 0 ? (
              <p className="bg-white px-4 py-16 text-center text-sm text-gray-500">
                {filtre === 'sans' ? 'Tout le monde a eu sa réponse.'
                  : filtre === 'acheteurs' ? 'Aucun acheteur ne vous a encore écrit.'
                    : filtre === 'archivees' ? 'Aucune conversation archivée.'
                      : 'Toutes vos conversations sont archivées.'}
              </p>
            ) : (
              <div className="divide-y divide-line bg-white">{liste.map(renderRow)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function Messages() {
  return (
    <div className="min-h-screen bg-cream-200 md:mx-auto md:max-w-3xl md:px-4 md:py-4">
      <div className="md:overflow-hidden md:rounded-3xl md:border md:border-line md:bg-white md:shadow-card">
        <ConversationList />
      </div>
    </div>
  )
}
