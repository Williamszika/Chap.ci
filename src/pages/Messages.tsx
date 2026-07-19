import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, LogIn } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { useNotifications } from '../store/NotificationsContext'
import { timeAgo } from '../lib/format'

/**
 * Coquille de messagerie à 2 volets.
 *  - Ordinateur / tablette (md+) : liste des conversations à GAUCHE + conversation
 *    ouverte à DROITE (comme WhatsApp Web). Les deux volets sont toujours visibles.
 *  - Mobile : un seul volet à la fois — la liste (route /messages), puis la
 *    conversation en plein écran (route /messages/:id).
 * `activeId` = conversation ouverte (undefined sur la page liste).
 */
export function MessagesLayout({ activeId, detail }: { activeId?: string; detail: ReactNode }) {
  const hasDetail = !!activeId
  return (
    <div className="min-h-screen bg-[#FFF6EA] md:mx-auto md:max-w-[1120px] md:px-4 md:py-4">
      <div className="md:grid md:h-[calc(100vh-7rem)] md:grid-cols-[360px_minmax(0,1fr)] md:gap-4">
        {/* Volet LISTE — masqué sur mobile quand une conversation est ouverte */}
        <aside
          className={`${hasDetail ? 'hidden md:block' : 'block'} md:h-full md:min-h-0 md:overflow-hidden md:rounded-3xl md:border md:border-[#EFE6D7] md:bg-white md:shadow-card`}
        >
          <ConversationList activeId={activeId} />
        </aside>

        {/* Volet CONVERSATION — masqué sur mobile sur la page liste */}
        <main
          className={`${hasDetail ? 'block' : 'hidden md:block'} md:h-full md:min-h-0 md:overflow-hidden md:rounded-3xl md:border md:border-[#EFE6D7] md:bg-white md:shadow-card`}
        >
          {detail}
        </main>
      </div>
    </div>
  )
}

/** Message affiché dans le volet de droite tant qu'aucune conversation n'est ouverte (ordinateur). */
function EmptyDetail() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-3 px-6 text-center md:flex">
      <div className="text-5xl">💬</div>
      <p className="text-lg font-bold text-gray-700">Sélectionnez une conversation</p>
      <p className="max-w-xs text-sm text-gray-500">
        Choisissez une discussion dans la liste de gauche pour l’ouvrir ici.
      </p>
    </div>
  )
}

/** Initiale d'affichage de l'avatar, dérivée du nom de l'interlocuteur. */
function avatarInitial(name?: string): string {
  return (name?.trim().charAt(0) || '?').toUpperCase()
}

/** Liste des conversations (réutilisée dans les deux volets). */
export function ConversationList({ activeId }: { activeId?: string }) {
  const navigate = useNavigate()
  const { user, enabled, loading: authLoading } = useAuth()
  const { conversations: convs, loading, unreadConvIds, refresh } = useNotifications()

  useEffect(() => {
    if (user) refresh()
  }, [user, refresh])

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-2 border-b border-[#EFE6D7] bg-white/90 px-3 py-3 backdrop-blur-md md:rounded-t-3xl">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="-ml-1 p-1 md:hidden">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-extrabold text-ink">Messages</h1>
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
          <div className="py-24 text-center text-sm text-gray-400">Chargement…</div>
        ) : convs.length === 0 ? (
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
          <div className="divide-y divide-[#EFE6D7] bg-white md:rounded-b-3xl">
            {convs.map((c) => {
              const unread = unreadConvIds.has(c.id)
              const active = c.id === activeId
              return (
                <Link
                  key={c.id}
                  to={`/messages/${c.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-cream-100 ${
                    active ? 'bg-primary-50' : unread ? 'bg-primary-50/50' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    {c.listingImage ? (
                      <img
                        src={c.listingImage}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover ring-1 ring-[#EFE6D7]"
                      />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-ivoire-green to-ivoire-green-dark font-display text-lg font-bold text-white">
                        {avatarInitial(c.otherName)}
                      </div>
                    )}
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-primary-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate font-display text-gray-900 ${unread ? 'font-extrabold' : 'font-bold'}`}>
                        {c.otherName}
                      </p>
                      <span className={`shrink-0 text-[11px] ${unread ? 'font-bold text-primary-600' : 'text-gray-400'}`}>
                        {c.lastAt ? timeAgo(c.lastAt) : ''}
                      </span>
                    </div>
                    {c.listingTitle && (
                      <p className="truncate text-xs font-medium text-primary-600">{c.listingTitle}</p>
                    )}
                    <p className={`truncate text-sm ${unread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                      {c.lastMessage ?? 'Nouvelle conversation'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function Messages() {
  return <MessagesLayout detail={<EmptyDetail />} />
}
