import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusCircle,
  Heart,
  Trash2,
  ShoppingBag,
  Store,
  MessageSquare,
  ShoppingCart,
  Gift,
  LogIn,
  LogOut,
  Settings,
  MapPin,
  Star,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { useCart } from '../store/CartContext'
import { useLocalStorage } from '../lib/useLocalStorage'
import { priceLabel, formatPrice, timeAgo } from '../lib/format'
import { locationLabel } from '../data/locations'
import { fetchOrders, updateOrderStatus } from '../lib/orders'
import { fetchReviewsForSeller, averageRating } from '../lib/reviews'
import { updateMyProfile } from '../lib/profiles'
import type { Order, Review } from '../types'

type Tab = 'achats' | 'ventes' | 'annonces' | 'params'

const statusLabel: Record<string, { label: string; cls: string }> = {
  en_cours: { label: 'En cours', cls: 'bg-amber-50 text-amber-700' },
  finalise: { label: 'Finalisé', cls: 'bg-emerald-50 text-emerald-700' },
  annule: { label: 'Annulé', cls: 'bg-gray-100 text-gray-500' },
}

export function Profile() {
  const navigate = useNavigate()
  const { listings, deleteListing, resetDemo, isMine, favorites } = useApp()
  const { user, enabled, signOut } = useAuth()
  const cart = useCart()
  const [seller] = useLocalStorage('chapci.seller.v1', { name: '', phone: '' })

  const [tab, setTab] = useState<Tab>('achats')
  const [purchases, setPurchases] = useState<Order[]>([])
  const [sales, setSales] = useState<Order[]>([])
  const [myReviews, setMyReviews] = useState<Review[]>([])

  const myListings = listings.filter((l) => isMine(l.id))
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) || seller.name || user?.email?.split('@')[0] || ''
  const rating = averageRating(myReviews)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchOrders(user.id, 'buyer').then((o) => active && setPurchases(o)).catch(() => {})
    fetchOrders(user.id, 'seller').then((o) => active && setSales(o)).catch(() => {})
    fetchReviewsForSeller(user.id).then((r) => active && setMyReviews(r)).catch(() => {})
    return () => {
      active = false
    }
  }, [user])

  async function markReceived(order: Order) {
    try {
      await updateOrderStatus(order.id, 'finalise')
      setPurchases((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'finalise' } : o)))
    } catch {
      alert('Action impossible pour le moment.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* En-tête */}
      <header className="safe-top bg-gradient-to-b from-primary-500 to-primary-600 px-4 pb-5 pt-5 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-2xl font-black">
            {(displayName || 'C').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black">{displayName || 'Bienvenue 👋'}</p>
            {user ? (
              rating.count > 0 ? (
                <span className="flex items-center gap-1 text-sm text-white/90">
                  <Star size={14} className="fill-amber-300 text-amber-300" /> {rating.avg.toFixed(1)} ·{' '}
                  {rating.count} avis
                </span>
              ) : (
                <p className="truncate text-sm text-white/85">{user.email}</p>
              )
            ) : (
              <p className="text-sm text-white/85">Connectez-vous pour vendre et acheter</p>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <QuickAction icon={<PlusCircle size={20} />} label="Publier" onClick={() => navigate('/publier')} />
          <QuickAction
            icon={<ShoppingCart size={20} />}
            label="Panier"
            badge={cart.count}
            onClick={() => navigate('/panier')}
          />
          <QuickAction icon={<MessageSquare size={20} />} label="Messages" onClick={() => navigate('/messages')} />
          <QuickAction
            icon={<Heart size={20} />}
            label="Favoris"
            badge={favorites.length}
            onClick={() => navigate('/favoris')}
          />
        </div>
      </header>

      {/* Connexion requise */}
      {enabled && !user && (
        <div className="px-4 pt-4">
          <button onClick={() => navigate('/connexion')} className="btn-primary w-full py-3.5">
            <LogIn size={20} /> Se connecter / Créer un compte
          </button>
        </div>
      )}

      {/* Onglets */}
      <div className="no-scrollbar sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-gray-100 bg-white px-2">
        {([
          ['achats', 'Mes achats'],
          ['ventes', 'Mes ventes'],
          ['annonces', 'Mes annonces'],
          ['params', 'Paramètres'],
        ] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 whitespace-nowrap px-3 py-3 text-sm font-semibold ${
              tab === t ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {/* ACHATS */}
        {tab === 'achats' &&
          (!user ? (
            <Empty text="Connectez-vous pour voir vos demandes d’achat." />
          ) : purchases.length === 0 ? (
            <Empty text="Aucune demande d’achat. Ajoutez des articles au panier et envoyez votre demande !" cta />
          ) : (
            <div className="space-y-3">
              {purchases.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  who={`Vendeur : ${o.otherName}`}
                  onOpen={() => o.conversationId && navigate(`/messages/${o.conversationId}`)}
                  footer={
                    <div className="flex flex-wrap gap-2">
                      {o.conversationId && (
                        <button onClick={() => navigate(`/messages/${o.conversationId}`)} className="btn-outline flex-1 py-2 text-sm">
                          <MessageCircle size={16} /> Discuter
                        </button>
                      )}
                      {o.status === 'en_cours' && (
                        <button onClick={() => markReceived(o)} className="btn-primary flex-1 py-2 text-sm">
                          <CheckCircle2 size={16} /> Article reçu
                        </button>
                      )}
                      {o.status === 'finalise' && o.items[0]?.listingId && (
                        <Link to={`/annonce/${o.items[0].listingId}`} className="btn-outline flex-1 py-2 text-sm">
                          <Star size={16} /> Laisser un avis
                        </Link>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          ))}

        {/* VENTES */}
        {tab === 'ventes' &&
          (!user ? (
            <Empty text="Connectez-vous pour voir les demandes reçues." />
          ) : sales.length === 0 ? (
            <Empty text="Aucune demande reçue pour l’instant. Publiez des annonces pour vendre !" />
          ) : (
            <div className="space-y-3">
              {sales.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  who={`Acheteur : ${o.otherName}`}
                  onOpen={() => o.conversationId && navigate(`/messages/${o.conversationId}`)}
                  footer={
                    o.conversationId && (
                      <button onClick={() => navigate(`/messages/${o.conversationId}`)} className="btn-primary w-full py-2 text-sm">
                        <MessageCircle size={16} /> Répondre à l’acheteur
                      </button>
                    )
                  }
                />
              ))}
            </div>
          ))}

        {/* ANNONCES */}
        {tab === 'annonces' && (
          <>
            <button onClick={() => navigate('/publier')} className="btn-primary mb-3 w-full py-3">
              <PlusCircle size={20} /> Publier une annonce
            </button>
            {myListings.length === 0 ? (
              <Empty text="Vous n’avez pas encore d’annonce." />
            ) : (
              <div className="space-y-2">
                {myListings.map((l) => (
                  <div key={l.id} className="card flex items-center gap-3 p-2.5">
                    <Link to={`/annonce/${l.id}`} className="flex flex-1 items-center gap-3">
                      <img src={l.images[0]} alt="" className="h-16 w-16 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{l.title}</p>
                        <p className="text-sm font-bold text-primary-600">{priceLabel(l.price, l.negotiable)}</p>
                        <p className="flex items-center gap-1 text-[11px] text-gray-400">
                          <MapPin size={11} />
                          {locationLabel(l.regionId, l.cityId, l.commune)}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={async () => {
                        if (!confirm('Supprimer cette annonce ?')) return
                        try {
                          await deleteListing(l.id)
                        } catch {
                          alert('Suppression impossible : vous devez être le propriétaire connecté.')
                        }
                      }}
                      className="grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PARAMÈTRES */}
        {tab === 'params' && (
          <div className="space-y-5">
            {user && <SettingsForm userId={user.id} initialName={displayName} />}

            {user && (
              <button onClick={() => navigate(`/vendeur/${user.id}`)} className="card flex w-full items-center gap-3 p-4">
                <Store size={18} className="text-primary-500" />
                <span className="flex-1 text-left text-sm font-medium text-gray-800">Voir mon profil public</span>
              </button>
            )}

            <Link to="/don" className="card flex items-center gap-3 p-4">
              <Gift size={18} className="text-ivoire-green" />
              <span className="flex-1 text-sm font-medium text-gray-800">Soutenir Chap.ci (faire un don)</span>
            </Link>

            <section className="rounded-2xl bg-primary-50 p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-bold text-primary-800">
                <ShoppingBag size={18} /> Installer l’application
              </p>
              <p className="text-xs leading-relaxed text-primary-700">
                <strong>iPhone :</strong> Safari → Partager → « Sur l’écran d’accueil ».<br />
                <strong>Android :</strong> Chrome → menu ⋮ → « Installer l’application ».
              </p>
            </section>

            {user && (
              <button onClick={() => signOut()} className="btn-outline w-full py-3 text-red-600">
                <LogOut size={18} /> Déconnexion
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('Réinitialiser vos données locales (favoris, panier local) ?')) resetDemo()
              }}
              className="w-full text-center text-sm text-gray-400"
            >
              Réinitialiser les données de démonstration
            </button>

            <p className="pb-4 text-center text-xs text-gray-400">Chap.ci · v1.0 🇨🇮</p>
          </div>
        )}
      </div>
    </div>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
  badge,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  badge?: number
}) {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center gap-1 rounded-2xl bg-white/15 py-2.5">
      <span className="relative">
        {icon}
        {badge ? (
          <span className="absolute -right-2.5 -top-1.5 min-w-[16px] rounded-full bg-red-500 px-1 text-center text-[9px] font-bold">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  )
}

function Empty({ text, cta }: { text: string; cta?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="text-4xl">🛍️</div>
      <p className="max-w-xs text-sm text-gray-500">{text}</p>
      {cta && (
        <Link to="/explorer" className="btn-outline py-2 text-sm">
          Explorer les annonces
        </Link>
      )}
    </div>
  )
}

function OrderCard({
  order,
  who,
  footer,
  onOpen,
}: {
  order: Order
  who: string
  footer: React.ReactNode
  onOpen: () => void
}) {
  const total = order.items.reduce((s, i) => s + i.price, 0)
  const st = statusLabel[order.status] ?? statusLabel.en_cours
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <span className="text-sm font-bold text-gray-900">{who}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
      </div>
      <button onClick={onOpen} className="block w-full text-left">
        {order.items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            {it.image && <img src={it.image} alt="" className="h-12 w-12 rounded-lg object-cover" />}
            <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{it.title}</span>
            <span className="text-sm font-semibold text-primary-600">{priceLabel(it.price)}</span>
          </div>
        ))}
      </button>
      <div className="border-t border-gray-100 px-4 py-2">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-400">{timeAgo(order.createdAt)}</span>
          <span className="font-bold text-gray-800">{formatPrice(total)} FCFA</span>
        </div>
        {footer}
      </div>
    </div>
  )
}

function SettingsForm({ userId, initialName }: { userId: string; initialName: string }) {
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      await updateMyProfile(userId, { full_name: name.trim(), bio: bio.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } catch {
      alert('Enregistrement impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
        <Settings size={16} /> Mon profil
      </p>
      <div className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom affiché" className="input" />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio (présentez-vous en quelques mots)"
          rows={3}
          className="input resize-none"
        />
        <button onClick={save} disabled={busy} className="btn-primary w-full py-2.5 text-sm">
          {saved ? 'Enregistré ✓' : busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
