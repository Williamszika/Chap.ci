import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, LogIn } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { useNotifications } from '../store/NotificationsContext'
import { timeAgo } from '../lib/format'

export function Messages() {
  const navigate = useNavigate()
  const { user, enabled, loading: authLoading } = useAuth()
  const { conversations: convs, loading, unreadConvIds, refresh } = useNotifications()

  useEffect(() => {
    if (user) refresh()
  }, [user, refresh])

  return (
    <div className="min-h-screen bg-[#f4f5f7] md:mx-auto md:max-w-2xl">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">Messages</h1>
      </header>

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
        <div className="divide-y divide-gray-100 bg-white">
          {convs.map((c) => {
            const unread = unreadConvIds.has(c.id)
            return (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 ${unread ? 'bg-primary-50/40' : ''}`}
              >
                <div className="relative shrink-0">
                  {c.listingImage ? (
                    <img src={c.listingImage} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-100 text-primary-600">
                      <MessageCircle size={22} />
                    </div>
                  )}
                  {unread && (
                    <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate ${unread ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-900'}`}>
                      {c.otherName}
                    </p>
                    <span className={`shrink-0 text-[11px] ${unread ? 'font-bold text-primary-600' : 'text-gray-400'}`}>
                      {c.lastAt ? timeAgo(c.lastAt) : ''}
                    </span>
                  </div>
                  {c.listingTitle && (
                    <p className="truncate text-xs text-primary-600">{c.listingTitle}</p>
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
  )
}
