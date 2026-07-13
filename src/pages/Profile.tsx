import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusCircle,
  Heart,
  Trash2,
  ShoppingBag,
  Store,
  MessageSquare,
  Gift,
  LogIn,
  LogOut,
  Settings,
  MapPin,
  Star,
  CheckCircle2,
  MessageCircle,
  Camera,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  BarChart3,
} from 'lucide-react'
import { Mark, Wordmark } from '../components/Logo'
import { PasswordStrength } from '../components/PasswordStrength'
import { checkPassword } from '../lib/password'
import { activePromo } from '../lib/promo'
import { isAdminEmail } from '../lib/newsletter'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { useGeo } from '../store/GeoContext'
import { useLocalStorage } from '../lib/useLocalStorage'
import { priceLabel, formatPrice, timeAgo } from '../lib/format'
import { locationLabel } from '../data/locations'
import { fetchOrders, updateOrderStatus } from '../lib/orders'
import { fetchReviewsForSeller, averageRating } from '../lib/reviews'
import { updateMyProfile, fetchProfile } from '../lib/profiles'
import { downscaleImage } from '../lib/image'
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
  const { place } = useGeo()
  const [seller] = useLocalStorage('chapci.seller.v1', { name: '', phone: '' })

  const [tab, setTab] = useState<Tab>('achats')
  const [purchases, setPurchases] = useState<Order[]>([])
  const [sales, setSales] = useState<Order[]>([])
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  const myListings = listings.filter((l) => isMine(l.id))
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) || seller.name || user?.email?.split('@')[0] || ''
  const rating = averageRating(myReviews)

  // Statistiques vendeur
  const activePromoCount = myListings.filter((l) => activePromo(l)).length
  const salesOngoing = sales.filter((o) => o.status === 'en_cours').length
  const salesDone = sales.filter((o) => o.status === 'finalise').length
  const revenue = sales
    .filter((o) => o.status === 'finalise')
    .reduce((sum, o) => sum + o.items.reduce((t, it) => t + it.price, 0), 0)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchOrders(user.id, 'buyer').then((o) => active && setPurchases(o)).catch(() => {})
    fetchOrders(user.id, 'seller').then((o) => active && setSales(o)).catch(() => {})
    fetchReviewsForSeller(user.id).then((r) => active && setMyReviews(r)).catch(() => {})
    fetchProfile(user.id).then((p) => active && setAvatarUrl(p?.avatarUrl ?? '')).catch(() => {})
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
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-2xl font-black">
                {(displayName || 'C').charAt(0).toUpperCase()}
              </div>
            )}
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
        <div className="mt-4 grid grid-cols-3 gap-2">
          <QuickAction icon={<PlusCircle size={20} />} label="Publier" onClick={() => navigate('/publier')} />
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
            <Empty text="Aucune demande d’achat. Cliquez « Acheter » sur une annonce pour envoyer une demande au vendeur." cta />
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
            <Empty text="Connectez-vous pour voir vos ventes et statistiques." />
          ) : (
            <div className="space-y-4">
              {/* Statistiques vendeur */}
              <div className="card p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                  <BarChart3 size={16} className="text-primary-500" /> Vos statistiques
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <StatTile label="Annonces" value={myListings.length} />
                  <StatTile label="Demandes" value={sales.length} />
                  <StatTile label="En cours" value={salesOngoing} />
                  <StatTile label="Finalisées" value={salesDone} />
                  <StatTile
                    label="Note"
                    value={rating.count ? `${rating.avg.toFixed(1)}★` : '—'}
                    sub={rating.count ? `${rating.count} avis` : 'aucun avis'}
                  />
                  <StatTile label="Promos" value={activePromoCount} />
                </div>
                {revenue > 0 && (
                  <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-semibold text-emerald-700">
                      Chiffre d’affaires (ventes finalisées)
                    </p>
                    <p className="text-lg font-black text-emerald-700">{formatPrice(revenue)} FCFA</p>
                  </div>
                )}
              </div>

              {sales.length === 0 ? (
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
              )}
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
            {place && (place.regionId || place.address) && (
              <div className="card flex items-start gap-3 p-4">
                <MapPin size={18} className="mt-0.5 shrink-0 text-primary-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800">Connecté depuis</p>
                  <p className="truncate text-sm text-gray-600">
                    {place.commune || place.address
                      ? `${place.commune ?? ''}${place.commune && place.address ? ' · ' : ''}${place.address ?? ''}`
                      : locationLabel(place.regionId, place.cityId, place.commune)}
                  </p>
                </div>
              </div>
            )}
            {user && (
              <AvatarUpload userId={user.id} currentUrl={avatarUrl} name={displayName} onUpdated={setAvatarUrl} />
            )}
            {user && <SettingsForm userId={user.id} initialName={displayName} />}
            {user && <ChangePassword />}
            {user && <TwoFactor />}

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
              <button onClick={() => signOut()} className="btn-outline w-full py-3 text-gray-700">
                <LogOut size={18} /> Déconnexion
              </button>
            )}

            {user && <DeleteAccount />}

            <button
              onClick={() => {
                if (confirm('Réinitialiser vos données locales (favoris, panier local) ?')) resetDemo()
              }}
              className="w-full text-center text-sm text-gray-400"
            >
              Réinitialiser les données de démonstration
            </button>

            <div className="flex items-center justify-center gap-4">
              <Link to="/contact" className="text-xs text-gray-500 underline">
                Nous contacter
              </Link>
              <Link to="/confidentialite" className="text-xs text-gray-500 underline">
                Confidentialité
              </Link>
            </div>

            {isAdminEmail(user?.email) && (
              <Link
                to="/admin/newsletter"
                className="block text-center text-xs font-semibold text-primary-600 underline"
              >
                📧 Abonnés newsletter (admin)
              </Link>
            )}

            <p className="flex items-center justify-center gap-1.5 pb-4 text-center text-xs text-gray-400">
              <Mark size={16} /> <Wordmark className="text-xs" ci="text-ivoire-green" /> · v1.0 🇨🇮
            </p>
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

function StatTile({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-2 py-3 text-center">
      <p className="text-xl font-black text-gray-900">{value}</p>
      <p className="text-[11px] font-medium text-gray-500">{label}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
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

function ChangePassword() {
  const { updatePassword } = useAuth()
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    setError('')
    const check = checkPassword(pw)
    if (!check.ok) return setError(`Mot de passe trop faible — ajoutez : ${check.missing.join(', ')}.`)
    if (pw !== confirm) return setError('Les deux mots de passe ne correspondent pas.')
    setBusy(true)
    const res = await updatePassword(pw)
    setBusy(false)
    if (res.error) return setError(res.error)
    setDone(true)
    setPw('')
    setConfirm('')
    setTimeout(() => {
      setDone(false)
      setOpen(false)
    }, 2200)
  }

  return (
    <div className="card p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-sm font-bold text-gray-800"
      >
        <KeyRound size={16} className="text-primary-500" />
        <span className="flex-1 text-left">Changer le mot de passe</span>
        <span className="text-xs font-medium text-primary-600">{open ? 'Fermer' : 'Modifier'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Nouveau mot de passe"
            className="input"
            autoComplete="new-password"
          />
          <PasswordStrength value={pw} />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirmer le mot de passe"
            className="input"
            autoComplete="new-password"
          />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
          <button onClick={submit} disabled={busy} className="btn-primary w-full py-2.5 text-sm">
            {done ? 'Mot de passe modifié ✓' : busy ? 'Modification…' : 'Enregistrer le nouveau mot de passe'}
          </button>
        </div>
      )}
    </div>
  )
}

function AvatarUpload({
  userId,
  currentUrl,
  name,
  onUpdated,
}: {
  userId: string
  currentUrl: string
  name: string
  onUpdated: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await downscaleImage(file, 256)
      await updateMyProfile(userId, { avatar_url: dataUrl })
      onUpdated(dataUrl)
    } catch {
      alert('Impossible d’enregistrer la photo.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {currentUrl ? (
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xl font-black text-gray-400">
            {(name || 'C').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-800">Photo de profil</p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="mt-1 flex items-center gap-1 text-sm font-semibold text-primary-600"
        >
          <Camera size={15} /> {busy ? 'Chargement…' : currentUrl ? 'Changer la photo' : 'Ajouter une photo'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  )
}

function TwoFactor() {
  const { enrollTotp, activateTotp, listTotp, unenrollTotp } = useAuth()
  const [factors, setFactors] = useState<{ id: string; status: string }[]>([])
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const active = factors.some((f) => f.status === 'verified')

  useEffect(() => {
    listTotp().then(setFactors).catch(() => {})
  }, [listTotp])

  async function start() {
    setMsg('')
    setBusy(true)
    const r = await enrollTotp()
    setBusy(false)
    if (r.error) return setMsg(r.error)
    setEnroll({ factorId: r.factorId!, qr: r.qr!, secret: r.secret! })
  }
  async function validate() {
    if (!enroll) return
    setBusy(true)
    const r = await activateTotp(enroll.factorId, code.trim())
    setBusy(false)
    if (r.error) return setMsg(r.error)
    setEnroll(null)
    setCode('')
    setMsg('Double authentification activée ✓')
    listTotp().then(setFactors).catch(() => {})
  }
  async function disable() {
    const f = factors[0]
    if (!f) return
    if (!window.confirm('Désactiver la double authentification ?')) return
    await unenrollTotp(f.id)
    listTotp().then(setFactors).catch(() => {})
    setMsg('Double authentification désactivée')
  }

  return (
    <div className="card p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
        <ShieldCheck size={16} /> Double authentification (2FA)
      </p>
      {active ? (
        <div>
          <p className="mb-2 text-sm text-emerald-600">✓ Activée — votre compte est protégé.</p>
          <button onClick={disable} className="btn-outline w-full py-2 text-sm text-red-600">
            Désactiver
          </button>
        </div>
      ) : enroll ? (
        <div>
          <p className="mb-2 text-xs text-gray-500">
            Scannez ce QR code avec Google Authenticator / Authy, ou saisissez la clé, puis entrez le code à 6 chiffres.
          </p>
          <div className="flex justify-center">
            <img src={enroll.qr} alt="QR 2FA" className="h-40 w-40" />
          </div>
          <p className="mb-2 break-all text-center font-mono text-[11px] text-gray-500">{enroll.secret}</p>
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="Code à 6 chiffres"
            maxLength={6}
            className="input text-center tracking-widest"
          />
          <button onClick={validate} disabled={busy} className="btn-primary mt-2 w-full py-2.5 text-sm">
            {busy ? 'Vérification…' : 'Activer'}
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs text-gray-500">
            Ajoutez une couche de sécurité avec une application d’authentification.
          </p>
          <button onClick={start} disabled={busy} className="btn-outline w-full py-2.5 text-sm">
            {busy ? '…' : 'Activer la 2FA'}
          </button>
        </div>
      )}
      {msg && <p className="mt-2 text-xs text-gray-500">{msg}</p>}
    </div>
  )
}

function DeleteAccount() {
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function del() {
    setBusy(true)
    const r = await deleteAccount()
    setBusy(false)
    if (r.error) return alert(r.error)
    alert('Votre compte et toutes vos données ont été supprimés.')
    navigate('/')
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600"
      >
        <AlertTriangle size={16} /> Supprimer mon compte
      </button>
    )
  }
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-bold text-red-700">Supprimer définitivement mon compte</p>
      <p className="mt-1 text-xs text-red-600">
        Action irréversible. Toutes vos données (annonces, commandes, messages, avis, profil) seront
        supprimées. Tapez <strong>SUPPRIMER</strong> pour confirmer.
      </p>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="SUPPRIMER"
        className="input mt-2"
      />
      <div className="mt-2 flex gap-2">
        <button onClick={() => { setConfirming(false); setText('') }} className="btn-outline flex-1 py-2 text-sm">
          Annuler
        </button>
        <button
          onClick={del}
          disabled={text !== 'SUPPRIMER' || busy}
          className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? 'Suppression…' : 'Supprimer'}
        </button>
      </div>
    </div>
  )
}
