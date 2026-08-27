import { useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../lib/native'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
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
  Check,
  CheckCircle2,
  MessageCircle,
  Camera,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  BarChart3,
  ChevronRight,
  Pencil,
  Eye,
  EyeOff,
  BadgeCheck,
  Bell,
  BellOff,
  Package,
  HelpCircle,
  LifeBuoy,
  Megaphone,
  MailCheck,
  Smartphone,
  Briefcase,
} from 'lucide-react'
import { Mark, Wordmark } from '../components/Logo'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { fetchVerifyStatus, sendEmailCode, confirmEmailCode, type VerifyStatus } from '../lib/verify'
import { MyAdsPanel } from '../components/MyAdsPanel'
import { PasswordStrength } from '../components/PasswordStrength'
import { checkPassword } from '../lib/password'
import { activePromo } from '../lib/promo'
import { useIsAdmin } from '../lib/useIsAdmin'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { useGeo } from '../store/GeoContext'
import { useToast } from '../store/ToastContext'
import { useLocalStorage } from '../lib/useLocalStorage'
import { priceLabel, formatFCFA, timeAgo } from '../lib/format'
import { locationLabel } from '../data/locations'
import { categories } from '../data/categories'
import { fetchOrders, updateOrderStatus } from '../lib/orders'
import { fetchReviewsForSeller, averageRating } from '../lib/reviews'
import { updateMyProfile, fetchProfile } from '../lib/profiles'
import { fetchMyListings, setListingHidden, fetchSavedSearches, deleteSavedSearch, savedSearchesEnabled, fetchSellerAnalytics, type SavedSearch, type SellerAnalytics } from '../lib/api'
import { isPhp } from '../lib/backend'
import { TableauPro } from './EspacePro'
import { phpProStatut } from '../lib/php'
import {
  phpNotifPrefs, phpSaveNotifPrefs, type NotifPrefs,
  phpPushDevices, phpPushUnsubscribe, phpPushTest, type PushAppareil,
} from '../lib/php'
import { etatPush, activerPush, desactiverPush, type EtatPush } from '../lib/push'
import { downscaleImage } from '../lib/image'
import type { Listing, Order, Review } from '../types'

type Tab = 'accueil' | 'achats' | 'ventes' | 'annonces' | 'pubs' | 'params'

const statusLabel: Record<string, { label: string; cls: string }> = {
  en_cours: { label: 'En cours', cls: 'bg-amber-50 text-amber-700' },
  finalise: { label: 'Finalisé', cls: 'bg-ivoire-green/10 text-ivoire-green-dark' },
  annule: { label: 'Annulé', cls: 'bg-gray-100 text-gray-500' },
}

export function Profile() {
  const navigate = useNavigate()
  const { listings, deleteListing, resetDemo, isMine, favorites } = useApp()
  const { user, enabled, signOut, refreshUser } = useAuth()
  const isAdmin = useIsAdmin()
  const { place } = useGeo()
  const toast = useToast()
  const [seller] = useLocalStorage('chapci.seller.v1', { name: '', phone: '' })
  const location = useLocation()

  // Onglet initial : piloté par la navigation (menu « Mon compte » du desktop).
  const [tab, setTab] = useState<Tab>(() => ((location.state as { tab?: Tab } | null)?.tab) || 'accueil')
  // Compte PRO approuvé ? Alors la page Compte s'ouvre sur l'espace
  // professionnel (demande du Patron, 26/08) — les autres ne voient rien.
  const [proApprouve, setProApprouve] = useState(false)
  useEffect(() => {
    if (!isPhp || !user) { setProApprouve(false); return }
    phpProStatut<{ status?: string }>()
      .then((s) => setProApprouve(s.status === 'approuve'))
      .catch(() => setProApprouve(false))
  }, [user])
  useEffect(() => {
    const t = (location.state as { tab?: Tab } | null)?.tab
    if (t) setTab(t)
  }, [location.state])
  const [purchases, setPurchases] = useState<Order[]>([])
  const [sales, setSales] = useState<Order[]>([])
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  // Tableau de bord vendeur : période + statistiques réelles (vues, tendances…).
  const [period, setPeriod] = useState<'7j' | '30j' | 'annee'>('7j')
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null)

  // Filtres pilotés par les tuiles de statistiques (chaque tuile est cliquable).
  const [salesFilter, setSalesFilter] = useState<'all' | 'en_cours' | 'finalise'>('all')
  const [annoncesFilter, setAnnoncesFilter] = useState<'all' | 'promo'>('all')
  const [showReviews, setShowReviews] = useState(false)

  // Annonces du vendeur : en mode PHP on récupère TOUTES ses annonces (même
  // masquées, absentes de la liste publique) pour pouvoir les gérer.
  const [serverListings, setServerListings] = useState<Listing[]>([])
  const reloadMine = useRef(async () => {})
  reloadMine.current = async () => {
    if (!isPhp || !user) return
    try { setServerListings(await fetchMyListings()) } catch { /* ignore */ }
  }
  useEffect(() => { reloadMine.current() }, [user])

  const localMine = listings.filter((l) => isMine(l.id))
  const myListings = isPhp && user ? serverListings : localMine
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) || seller.name || user?.email?.split('@')[0] || ''
  const rating = averageRating(myReviews)

  // Statistiques vendeur
  const salesDone = sales.filter((o) => o.status === 'finalise').length
  const shownSales = salesFilter === 'all' ? sales : sales.filter((o) => o.status === salesFilter)
  const shownMine = annoncesFilter === 'promo' ? myListings.filter((l) => activePromo(l)) : myListings
  const revenue = sales
    .filter((o) => o.status === 'finalise')
    .reduce((sum, o) => sum + o.items.reduce((t, it) => t + it.price, 0), 0)

  // Données des panneaux du tableau de bord vendeur — dérivées des vraies annonces.
  const hasViews = myListings.some((l) => (l.views ?? 0) > 0)
  const topByViews = [...myListings].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 7)
  const maxViews = Math.max(1, ...topByViews.map((l) => l.views ?? 0))
  const categoryName = new Map(categories.map((c): [string, string] => [c.id, c.name]))
  const catCounts = new Map<string, number>()
  for (const l of myListings) catCounts.set(l.categoryId, (catCounts.get(l.categoryId) ?? 0) + 1)
  const catDist = [...catCounts.entries()]
    .map(([id, n]) => ({ name: categoryName.get(id) ?? id, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
  const catBarColors = ['bg-primary-500', 'bg-ivoire-green', 'bg-accent-gold', 'bg-accent-sky']

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

  // Statistiques réelles du tableau de bord (rechargées au changement de période).
  useEffect(() => {
    if (!user || !isPhp || tab !== 'ventes') return
    let active = true
    fetchSellerAnalytics(period).then((a) => active && setAnalytics(a)).catch(() => {})
    return () => { active = false }
  }, [user, tab, period])

  async function markReceived(order: Order) {
    try {
      await updateOrderStatus(order.id, 'finalise')
      setPurchases((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'finalise' } : o)))
    } catch {
      toast.error('Action impossible pour le moment.')
    }
  }

  async function logout() {
    try { await signOut() } catch { /* ignore */ }
    navigate('/')
  }

  // Accueil du compte connecté — mise en page pleine largeur (façon artifact),
  // aussi bien sur mobile que sur ordinateur.
  if (user && tab === 'accueil') {
    return (
      <div className="min-h-screen bg-cream-200 md:min-h-0 md:bg-transparent">
        <div className="mx-auto w-full max-w-2xl px-4 py-4 md:max-w-4xl md:px-6 md:py-6 lg:max-w-5xl">
          {/* Carte profil — masquée pour un compte PRO : sa console porte
              désormais la tuile « Profil & photo » (demande du 27/08). */}
          {!proApprouve && (
          <>
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card md:rounded-3xl md:p-5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white md:h-20 md:w-20">
              {avatarUrl ? (
                <img src={mediaUrl(avatarUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl font-black md:text-3xl">
                  {(displayName || 'C').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-display text-lg font-black text-ink md:text-xl">
                <span className="truncate">{displayName || 'Mon compte'}</span>
                {user.badge && <VerifiedBadge kind={user.badge} size={18} />}
              </p>
              <p className="truncate text-sm text-gray-500">
                {user.email}{seller.phone ? ` · ${seller.phone}` : ''}
              </p>
            </div>
            <button onClick={() => setTab('params')} className="btn-outline shrink-0 px-4 py-2 text-sm">
              <Pencil size={15} /> Modifier
            </button>
          </div>

          {/* Récapitulatif : annonces · favoris · note */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniStat value={myListings.length} label="annonces" />
            <MiniStat value={favorites.length} label="favoris" />
            <MiniStat value={rating.count ? rating.avg.toFixed(1) : '—'} label="note" />
          </div>

          {/* Badge de vérification (membre fidèle et actif) */}
          {isPhp && <VerificationCard onVerified={refreshUser} />}
          </>
          )}

          {/* Accès administrateur */}
          {isAdmin && (
            <Link
              to="/admin"
              className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 text-white shadow-card transition active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20"><ShieldCheck size={22} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">Tableau de bord administrateur</span>
                <span className="block text-sm text-white/85">Statistiques, modération, modérateurs…</span>
              </span>
              <ChevronRight size={20} className="shrink-0" />
            </Link>
          )}

          {/* LE TABLEAU DE BORD PROFESSIONNEL — pour un compte PRO approuvé,
              il ne s'ajoute pas au menu : il LE REMPLACE. Tout y est (boutique,
              entreprise, compte, sécurité, déconnexion), en tuiles qui portent
              leurs chiffres. Demande du Patron du 27/08 : « je veux que tous
              ses paramètres soient inclus dans son tableau de bord pro ». */}
          {proApprouve && (
            <div className="mt-6">
              <TableauPro dansCompte onOnglet={setTab} onDeconnexion={logout} />
            </div>
          )}

          {!proApprouve && (
          <>
          {/* Mon activité */}
          <p className="mb-2 mt-6 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">Mon activité</p>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            {/* « En ligne » veut dire visible : une annonce masquée ne l'est
                pas. Les compter ensemble laissait croire à un vendeur que son
                annonce tournait alors qu'elle attendait une correction. */}
            <AccountRow
              tint="ocre"
              icon={<Package size={20} />}
              label="Mes annonces"
              sub={[
                `${myListings.filter((l) => !l.hidden && !l.sold).length} en ligne`,
                myListings.some((l) => l.hidden) ? `${myListings.filter((l) => l.hidden).length} masquée${myListings.filter((l) => l.hidden).length > 1 ? 's' : ''}` : '',
                `${salesDone} vendue${salesDone > 1 ? 's' : ''}`,
              ].filter(Boolean).join(' · ')}
              onClick={() => setTab('annonces')}
            />
            <AccountRow tint="red" icon={<Heart size={20} className="fill-current" />} label="Mes favoris" badge={favorites.length || undefined} onClick={() => navigate('/favoris')} />
            <AccountRow tint="gray" icon={<MessageSquare size={20} />} label="Messages" sub="Vos conversations" onClick={() => navigate('/messages')} />
            <AccountRow tint="gold" icon={<ShoppingBag size={20} />} label="Mes commandes" sub={`${purchases.filter((o) => o.status === 'en_cours').length} en cours`} onClick={() => setTab('achats')} />
            <AccountRow tint="green" icon={<BarChart3 size={20} />} label="Statistiques de vente" sub="Vos chiffres, vos ventes" onClick={() => setTab('ventes')} />
            <AccountRow tint="ocre" icon={<Briefcase size={20} />} label="Compte professionnel" sub="Badge PRO & espace professionnel" onClick={() => navigate('/pro')} />
            {isPhp && (
              <AccountRow tint="primary" icon={<Megaphone size={20} />} label="Mes publicités" sub="Audience, coût, prolongation" onClick={() => setTab('pubs')} />
            )}
          </div>

          {/* Compte & sécurité */}
          <p className="mb-2 mt-6 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">Compte &amp; sécurité</p>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <AccountRow tint="primary" icon={<Bell size={20} />} label="Notifications" onClick={() => navigate('/notifications')} />
            <AccountRow tint="green" icon={<ShieldCheck size={20} />} label="Sécurité" sub="Mot de passe · double authentification" onClick={() => setTab('params')} />
            <AccountRow tint="sky" icon={<MapPin size={20} />} label="Adresse & localisation" onClick={() => setTab('params')} />
            <AccountRow tint="primary" icon={<HelpCircle size={20} />} label="Aide & support" onClick={() => navigate('/aide')} />
            {/* Écrire à une vraie personne, et suivre la réponse au même
                endroit. Le formulaire de /contact reste pour ceux qui n'ont pas
                de compte — ici, l'équipe voit les annonces de qui écrit. */}
            <AccountRow tint="green" icon={<LifeBuoy size={20} />} label="Contacter l’équipe" sub="Une question, une annonce masquée, un doute" onClick={() => navigate('/assistance')} />
            <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-red-50">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600"><LogOut size={20} /></span>
              <span className="flex-1 font-semibold text-red-600">Se déconnecter</span>
            </button>
          </div>
          </>
          )}

          <div className="h-6" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-200 md:min-h-0 md:bg-transparent">
      <div className="mx-auto w-full max-w-2xl px-4 py-4 md:max-w-4xl md:px-6 md:py-6 lg:max-w-5xl">
        {/* Déconnecté : accueil de connexion */}
        {!user && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-card md:rounded-3xl">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-2xl font-black text-white">C</div>
              <p className="mt-3 font-display text-lg font-black text-ink">Bienvenue&nbsp;👋</p>
              <p className="mt-1 text-sm text-gray-500">Connectez-vous pour vendre et acheter chap-chap.</p>
            </div>
            {enabled && (
              <button onClick={() => navigate('/connexion')} className="btn-primary w-full py-3.5">
                <LogIn size={20} /> Se connecter / Créer un compte
              </button>
            )}
          </div>
        )}

        {/* Connecté : en-tête de section (retour au menu du compte + titre) */}
        {user && (
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setTab('accueil')}
              aria-label="Retour au compte"
              className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-gray-600 transition md:hover:bg-cream-100"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display text-xl font-black text-ink">
              {tab === 'ventes'
                ? 'Tableau de bord'
                : tab === 'annonces'
                  ? 'Mes annonces'
                  : tab === 'achats'
                    ? 'Mes commandes'
                    : tab === 'pubs'
                      ? 'Mes publicités'
                      : 'Compte & sécurité'}
            </h1>
          </div>
        )}

        {/* ACHATS */}
        {tab === 'achats' &&
          (!user ? (
            <Empty text="Connectez-vous pour voir vos demandes d’achat." />
          ) : purchases.length === 0 ? (
            <Empty text="Aucune demande d’achat. Cliquez « Acheter » sur une annonce pour envoyer une demande au vendeur." cta />
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
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
              {/* Sélecteur de période — recharge les vraies statistiques */}
              <div className="flex justify-end">
                <div className="flex rounded-xl border border-line2 bg-white p-0.5 text-xs font-bold shadow-card">
                  {([['7j', '7 j'], ['30j', '30 j'], ['annee', 'Année']] as const).map(([p, lab]) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`rounded-lg px-3 py-1.5 transition ${period === p ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {lab}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 cartes clés — vos vrais chiffres (tendances réelles vs période précédente) */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <DashStat tint="primary" icon={<Eye size={18} />} value={analytics ? analytics.views.value : myListings.reduce((s, l) => s + (l.views ?? 0), 0)} label="Vues" trend={analytics?.views.trend} />
                <DashStat tint="green" icon={<Package size={18} />} value={analytics ? analytics.activeListings : myListings.length} label="Annonces actives" />
                <DashStat tint="sky" icon={<MessageSquare size={18} />} value={analytics ? analytics.demands.value : sales.length} label="Demandes reçues" trend={analytics?.demands.trend} />
                <DashStat tint="gold" icon={<ShoppingBag size={18} />} value={analytics ? analytics.sales.value : salesDone} label="Ventes" trend={analytics?.sales.trend} />
              </div>

              {revenue > 0 && (
                <button
                  onClick={() => { setShowReviews(false); setSalesFilter('finalise') }}
                  className="flex w-full items-center justify-between rounded-2xl border border-line bg-ivoire-green/10 px-4 py-3.5 text-left shadow-card transition hover:bg-ivoire-green/15 active:scale-[0.99]"
                >
                  <div>
                    <p className="text-xs font-semibold text-ivoire-green-dark">Chiffre d’affaires (ventes finalisées)</p>
                    <p className="tnum text-lg font-black text-ivoire-green-dark">{formatFCFA(revenue)}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-ivoire-green-dark">Détail <ChevronRight size={14} /></span>
                </button>
              )}

              {/* Panneaux du tableau de bord (vues par annonce + répartition par catégorie). */}
              {myListings.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {analytics ? (
                    <div className="card p-4">
                      <p className="font-display text-base font-black text-ink">Vues des annonces</p>
                      <p className="mb-4 text-xs text-gray-500">7 derniers jours</p>
                      <div className="flex h-36 items-end gap-2">
                        {analytics.series.map((d) => {
                          const dmax = Math.max(1, ...analytics.series.map((s) => s.n))
                          const pct = Math.round((d.n / dmax) * 100)
                          const peak = d.n === dmax && d.n > 0
                          const lbl = ['L', 'M', 'M', 'J', 'V', 'S', 'D'][d.dow - 1]
                          return (
                            <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                              <span className="tnum text-[10px] font-semibold text-gray-500">{d.n}</span>
                              <div className="flex w-full flex-1 items-end">
                                <div
                                  className={`w-full rounded-t-md ${peak ? 'bg-ivoire-green' : 'bg-gradient-to-t from-primary-600 to-primary-400'}`}
                                  style={{ height: `${Math.max(6, pct)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-500">{lbl}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : hasViews ? (
                    <div className="card p-4">
                      <p className="font-display text-base font-black text-ink">Vues des annonces</p>
                      <p className="mb-4 text-xs text-gray-500">Vos annonces les plus vues</p>
                      <div className="flex h-36 items-end gap-2">
                        {topByViews.map((l) => {
                          const pct = Math.round(((l.views ?? 0) / maxViews) * 100)
                          const peak = (l.views ?? 0) === maxViews
                          return (
                            <div key={l.id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                              <span className="tnum text-[10px] font-semibold text-gray-500">{l.views ?? 0}</span>
                              <div className="flex w-full flex-1 items-end">
                                <div
                                  className={`w-full rounded-t-md ${peak ? 'bg-ivoire-green' : 'bg-gradient-to-t from-primary-600 to-primary-400'}`}
                                  style={{ height: `${Math.max(6, pct)}%` }}
                                  title={l.title}
                                />
                              </div>
                              <span className="w-full truncate text-center text-[10px] text-gray-500">{l.title}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                  <div className="card p-4">
                    <p className="font-display text-base font-black text-ink">Répartition</p>
                    <p className="mb-4 text-xs text-gray-500">Par catégorie</p>
                    <div className="space-y-3">
                      {catDist.map((c, i) => {
                        const pct = Math.round((c.n / (myListings.length || 1)) * 100)
                        return (
                          <div key={c.name}>
                            <div className="flex items-center justify-between text-[13px] font-semibold text-gray-700">
                              <span className="min-w-0 truncate">{c.name}</span>
                              <span className="tnum shrink-0">{pct} %</span>
                            </div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                              <div
                                className={`h-full rounded-full ${catBarColors[i % catBarColors.length]}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Demandes reçues + filtres */}
              <div>
                <p className="mb-2 font-display text-base font-black text-ink">Demandes reçues</p>
                <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
                  {([['all', 'Toutes'], ['en_cours', 'En cours'], ['finalise', 'Finalisées']] as const).map(([f, lab]) => (
                    <button
                      key={f}
                      onClick={() => { setShowReviews(false); setSalesFilter(f) }}
                      className={`chip shrink-0 ${!showReviews && salesFilter === f ? 'border-primary-500 bg-primary-50 text-primary-700' : ''}`}
                    >
                      {lab}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowReviews(true)}
                    className={`chip shrink-0 ${showReviews ? 'border-primary-500 bg-primary-50 text-primary-700' : ''}`}
                  >
                    Avis{rating.count ? ` · ${rating.avg.toFixed(1)}★` : ''}
                  </button>
                </div>
              </div>

              {showReviews ? (
                <SellerReviews reviews={myReviews} rating={rating} onClear={() => setShowReviews(false)} />
              ) : (
                <>
                  {salesFilter !== 'all' && (
                    <FilterNote
                      label={salesFilter === 'en_cours' ? 'En cours' : 'Finalisées'}
                      onClear={() => setSalesFilter('all')}
                    />
                  )}
                  {shownSales.length === 0 ? (
                    <Empty
                      text={
                        salesFilter === 'all'
                          ? 'Aucune demande reçue pour l’instant. Publiez des annonces pour vendre !'
                          : 'Aucune demande dans cette catégorie.'
                      }
                    />
                  ) : (
                    <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                      {shownSales.map((o) => (
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
                </>
              )}
            </div>
          ))}

        {/* PUBLICITÉS — audience, coût, historique, prolongation */}
        {tab === 'pubs' && user && <MyAdsPanel />}

        {/* ANNONCES */}
        {tab === 'annonces' && (
          <>
            <button onClick={() => navigate('/publier')} className="btn-primary mb-3 w-full py-3">
              <PlusCircle size={20} /> Publier une annonce
            </button>
            {annoncesFilter === 'promo' && (
              <FilterNote label="En promotion" onClear={() => setAnnoncesFilter('all')} />
            )}
            {shownMine.length === 0 ? (
              <Empty text={annoncesFilter === 'promo' ? 'Aucune annonce en promotion.' : 'Vous n’avez pas encore d’annonce.'} />
            ) : (
              <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
                {shownMine.map((l) => (
                  <div key={l.id} className="card p-2.5">
                    <div className="flex items-center gap-3">
                      {/* Une annonce masquée n'a pas de fiche publique : le lien
                          menait à « Annonce introuvable ». On envoie donc au
                          formulaire, qui est de toute façon ce qu'il y a à
                          faire. */}
                      <Link to={l.hidden ? `/modifier/${l.id}` : `/annonce/${l.id}`} state={l.hidden ? { listing: l } : undefined} className="flex flex-1 items-center gap-3">
                        <div className="relative">
                          <img src={mediaUrl(l.images[0])} alt="" className={`h-16 w-16 rounded-xl object-cover ${l.hidden ? 'opacity-40' : ''}`} />
                          {l.hidden && (
                            <span className="absolute inset-0 grid place-items-center">
                              <EyeOff size={18} className="text-gray-600" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{l.title}</p>
                          <p className="text-sm font-bold text-primary-600">{priceLabel(l.price, l.negotiable)}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                            {l.sold ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-ivoire-green/15 px-2 py-0.5 font-semibold text-ivoire-green-dark">
                                <BadgeCheck size={11} /> Vendue
                              </span>
                            ) : l.hidden ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-500">
                                <EyeOff size={10} /> Masquée
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-ivoire-green/10 px-2 py-0.5 font-semibold text-ivoire-green-dark">
                                <span className="h-1.5 w-1.5 rounded-full bg-ivoire-green" /> En ligne
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-gray-500">
                              <Eye size={12} /> {l.views ?? 0} vue{(l.views ?? 0) > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                    {/* Masquée : on dit POURQUOI, et le bouton qui suit répare.
                        Une annonce masquée sans explication est abandonnée. */}
                    {l.hidden && l.hiddenReason && (
                      <div className="mt-2 flex gap-2 rounded-xl border border-accent-ocre/30 bg-accent-ocre/8 p-2.5 text-[12px] leading-relaxed text-accent-ocre-dark">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <p>{l.hiddenReason}</p>
                      </div>
                    )}
                    <div className="mt-2 flex gap-1.5 border-t border-line pt-2">
                      <button
                        onClick={() => navigate(`/modifier/${l.id}`, { state: { listing: l } })}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <Pencil size={14} /> Modifier
                      </button>
                      {isPhp && (
                        <button
                          onClick={async () => {
                            try { await setListingHidden(l.id, !l.hidden); await reloadMine.current() }
                            catch { toast.error('Action impossible.') }
                          }}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          {l.hidden ? <><Eye size={14} /> Afficher</> : <><EyeOff size={14} /> Masquer</>}
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!confirm('Supprimer définitivement cette annonce ?')) return
                          try { await deleteListing(l.id); await reloadMine.current() }
                          catch { toast.error('Suppression impossible : vous devez être le propriétaire connecté.') }
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PARAMÈTRES */}
        {tab === 'params' && (
          <div className="space-y-5 lg:columns-2 lg:gap-5 lg:space-y-0 lg:[&>*]:mb-5 lg:[&>*]:break-inside-avoid">
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
            {user && savedSearchesEnabled && <MyAlerts />}
            {user && isPhp && <NotificationSettings />}
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
                if (confirm('Effacer vos données locales de cet appareil (favoris) ?')) resetDemo()
              }}
              className="w-full text-center text-sm text-gray-500"
            >
              Effacer mes données locales (favoris)
            </button>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <Link to="/aide" className="text-xs text-gray-500 underline">
                Aide & FAQ
              </Link>
              <Link to="/contact" className="text-xs text-gray-500 underline">
                Nous contacter
              </Link>
              <Link to="/confidentialite" className="text-xs text-gray-500 underline">
                RGPD
              </Link>
              <Link to="/conditions" className="text-xs text-gray-500 underline">
                Conditions
              </Link>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="block text-center text-xs font-semibold text-primary-600 underline"
              >
                🛠️ Tableau de bord administrateur
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

/**
 * Réglages des notifications.
 *
 * Trois voies, de la plus immédiate à la plus sûre :
 *   · la cloche du site — ne prévient que pendant qu'on regarde le site ;
 *   · le push — arrive téléphone verrouillé, mais demande une autorisation et
 *     n'existe pas partout (iPhone hors écran d'accueil, vieux navigateurs) ;
 *   · l'e-mail — atteint tout le monde, mais avec le délai d'une boîte mail.
 *
 * D'où cet écran : on active le push là où c'est possible, et l'e-mail reste
 * derrière comme filet.
 */
function NotificationSettings() {
  const toast = useToast()
  const [prefs, setPrefs] = useState<NotifPrefs>({ favorite: true, message: true, email: true })
  const [loaded, setLoaded] = useState(false)
  const [etat, setEtat] = useState<EtatPush | null>(null)
  const [appareils, setAppareils] = useState<PushAppareil[]>([])
  const [occupe, setOccupe] = useState(false)

  useEffect(() => {
    let alive = true
    phpNotifPrefs().then((p) => { if (alive) { setPrefs(p); setLoaded(true) } })
    // `.catch` obligatoire : sans lui, un rejet laisserait l'écran sur
    // « Vérification… » pour toujours, sans erreur visible nulle part.
    etatPush().then((e) => { if (alive) setEtat(e) }).catch(() => { if (alive) setEtat('sw-absent') })
    return () => { alive = false }
  }, [])

  async function reverifier() {
    setEtat(null)
    setEtat(await etatPush().catch(() => 'sw-absent' as EtatPush))
  }

  const rafraichirAppareils = () => { phpPushDevices().then(setAppareils).catch(() => {}) }
  useEffect(() => { if (etat === 'actif') rafraichirAppareils() }, [etat])

  function toggle(key: keyof NotifPrefs) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    phpSaveNotifPrefs(next).catch(() => {})
  }

  async function activer() {
    setOccupe(true)
    try {
      const e = await activerPush()
      setEtat(e)
      if (e === 'actif') toast.success('Notifications activées sur cet appareil.')
      else if (e === 'refuse') toast.error('Vous avez refusé les notifications pour chap.ci.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Activation impossible.')
    } finally { setOccupe(false) }
  }

  async function desactiver() {
    setOccupe(true)
    try { await desactiverPush(); setEtat('inactif'); setAppareils([]) }
    finally { setOccupe(false) }
  }

  async function essai() {
    setOccupe(true)
    try {
      const r = await phpPushTest()
      if (r.envoyes > 0) toast.success('Notification envoyée — elle arrive dans un instant.')
      else if (r.appareils === 0) toast.error('Aucun appareil abonné à ce compte.')
      else toast.error('Le relais n’a pas accepté l’envoi. Réactivez les notifications.')
    } catch { toast.error('Essai impossible.') }
    finally { setOccupe(false) }
  }

  async function retirer(id: string) {
    await phpPushUnsubscribe({ id })
    setAppareils((a) => a.filter((x) => x.id !== id))
    setEtat(await etatPush())
  }

  return (
    <section className="card p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
        <Bell size={16} className="text-primary-500" /> Notifications
      </p>

      {/* ---- Sur cet appareil ------------------------------------------- */}
      <div className="mb-4 rounded-xl bg-gray-50 p-3">
        <p className="mb-1 flex items-center gap-2 text-[13px] font-bold text-gray-800">
          <Smartphone size={14} className="text-gray-500" /> Sur cet appareil
        </p>

        {etat === null && <p className="text-xs text-gray-500">Vérification…</p>}

        {etat === 'inactif' && (
          <>
            <p className="mb-2 text-xs leading-snug text-gray-600">
              Soyez prévenu d’un message ou d’une vente <b>même quand Chap.ci est fermé</b>,
              téléphone verrouillé.
            </p>
            <button onClick={activer} disabled={occupe} className="btn-primary w-full py-2 text-sm disabled:opacity-60">
              {occupe ? 'Un instant…' : 'Activer les notifications'}
            </button>
          </>
        )}

        {etat === 'actif' && (
          <>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={14} /> Activées sur cet appareil
            </p>
            <div className="flex gap-2">
              <button onClick={essai} disabled={occupe} className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 active:bg-gray-100 disabled:opacity-60">
                Envoyer un essai
              </button>
              <button onClick={desactiver} disabled={occupe} className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-500 active:bg-gray-100 disabled:opacity-60">
                Désactiver ici
              </button>
            </div>
          </>
        )}

        {etat === 'sw-absent' && (
          <>
            <p className="mb-2 text-xs leading-snug text-gray-600">
              Ce navigateur n’a pas activé le composant nécessaire aux notifications.
              La cause la plus fréquente : <b>la page a été ouverte depuis une autre
              application</b> (WhatsApp, Facebook, Messenger), dans son navigateur interne,
              qui ne le permet pas.
            </p>
            <p className="mb-2 text-xs leading-snug text-gray-600">
              Ouvrez <b>chap.ci dans Chrome</b> — menu ⋮ en haut à droite →
              « Ouvrir dans Chrome » — puis revenez ici. Si vous êtes déjà dans Chrome,
              <b> rechargez la page une fois</b> : au tout premier passage, le composant
              met quelques secondes à s’installer.
            </p>
            <button onClick={reverifier} disabled={occupe} className="w-full rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 active:bg-gray-100">
              Revérifier
            </button>
          </>
        )}

        {etat === 'refuse' && (
          <p className="text-xs leading-snug text-gray-600">
            Les notifications sont <b>bloquées pour chap.ci</b> dans ce navigateur. Pour revenir
            dessus : touchez le cadenas (ou l’icône à gauche de l’adresse) →
            <b> Notifications</b> → <b>Autoriser</b>, puis rechargez la page.
          </p>
        )}

        {etat === 'ios-a-installer' && (
          <p className="text-xs leading-snug text-gray-600">
            Sur iPhone, Apple réserve les notifications aux sites ajoutés à l’écran d’accueil.
            Dans Safari : bouton <b>Partager</b> → <b>Sur l’écran d’accueil</b>. Rouvrez ensuite
            Chap.ci depuis l’icône, et le bouton apparaîtra ici.
          </p>
        )}

        {etat === 'app-native' && (
          <p className="text-xs leading-snug text-gray-600">
            L’application ne reçoit pas encore ces notifications : elles fonctionnent sur
            <b> chap.ci dans votre navigateur</b>. Ouvrez chap.ci depuis Chrome pour les activer
            en attendant.
          </p>
        )}

        {etat === 'indisponible' && (
          <p className="text-xs leading-snug text-gray-600">
            Ce navigateur ne sait pas recevoir de notifications. L’e-mail ci-dessous prend le relais.
          </p>
        )}

        {appareils.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-gray-200 pt-2">
            {appareils.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate text-gray-700">
                  {a.appareil} <span className="text-gray-500">· depuis {timeAgo(a.depuis)}</span>
                </span>
                <button onClick={() => retirer(a.id)} className="shrink-0 text-gray-500 active:text-red-600" aria-label={`Retirer ${a.appareil}`}>
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---- Ce dont on vous prévient ----------------------------------- */}
      <div className="space-y-1">
        <ToggleRow label="Messages" desc="Quand vous recevez un nouveau message" on={prefs.message} onToggle={() => toggle('message')} disabled={!loaded} />
        <ToggleRow label="Favoris" desc="Quand une personne ajoute votre annonce à ses favoris" on={prefs.favorite} onToggle={() => toggle('favorite')} disabled={!loaded} />
        <ToggleRow label="E-mail de secours" desc="Un e-mail seulement si vous n’êtes ni sur le site, ni joignable sur un appareil" on={prefs.email} onToggle={() => toggle('email')} disabled={!loaded} />
      </div>
    </section>
  )
}

function ToggleRow({ label, desc, on, onToggle, disabled }: {
  label: string; desc: string; on: boolean; onToggle: () => void; disabled?: boolean
}) {
  return (
    <button onClick={onToggle} disabled={disabled} className="flex w-full items-center gap-3 rounded-xl py-2 text-left disabled:opacity-50">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-800">{label}</span>
        <span className="block text-xs leading-snug text-gray-500">{desc}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-primary-500' : 'bg-gray-300'}`}>
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-smooth ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
    </button>
  )
}

/** « Mes alertes » : recherches sauvegardées (notifications par email). */
function MyAlerts() {
  const toast = useToast()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchSavedSearches()
      .then((a) => active && setAlerts(a))
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  async function remove(id: string) {
    setBusy(id)
    try {
      await deleteSavedSearch(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch {
      toast.error('Suppression impossible pour le moment.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="card p-4">
      <p className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-800">
        <Bell size={16} className="text-primary-500" /> Mes alertes
      </p>
      <p className="mb-3 text-xs text-gray-500">
        Recevez un email dès qu’une nouvelle annonce correspond à vos recherches enregistrées.
      </p>

      {loading ? (
        <p className="py-2 text-sm text-gray-500">Chargement…</p>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl bg-gray-50 px-3 py-4 text-center">
          <BellOff size={22} className="mx-auto mb-1.5 text-gray-300" />
          <p className="text-sm text-gray-500">Aucune alerte pour l’instant.</p>
          <button
            onClick={() => navigate('/explorer')}
            className="mt-2 text-sm font-semibold text-primary-600"
          >
            Créer une alerte depuis l’explorateur
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-xl border border-line p-2.5">
              <button
                onClick={() => navigate(`/explorer${a.params ? `?${a.params}` : ''}`)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                  <Bell size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-800">{a.label}</span>
                  <span className="block text-xs text-primary-600">Voir les annonces →</span>
                </span>
              </button>
              <button
                onClick={() => remove(a.id)}
                disabled={busy === a.id}
                className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                aria-label="Supprimer l’alerte"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


/**
 * Carte « Mon compte » — vérification de l'adresse, puis badge.
 *
 * Deux choses que l'écran doit tenir séparées, parce que les confondre est la
 * confusion la plus courante des places de marché :
 *
 *   VÉRIFIER SON ADRESSE  ouvre le droit de PUBLIER. C'est une porte, pas une
 *                         récompense — et elle ne donne aucun badge.
 *   LE BADGE VERT         arrive tout seul à six mois. Il ne se demande pas,
 *                         il n'y a donc aucun bouton à proposer.
 *
 * D'où l'absence délibérée de tout bouton « obtenir le badge » : promettre une
 * action là où le temps seul décide serait une fausse promesse.
 */
function VerificationCard({ onVerified }: { onVerified: () => Promise<void> }) {
  const toast = useToast()
  const [status, setStatus] = useState<VerifyStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [ouvert, setOuvert] = useState(false)
  const [code, setCode] = useState('')

  const recharger = () => { fetchVerifyStatus().then(setStatus).catch(() => {}) }
  useEffect(recharger, [])

  async function envoyer() {
    setBusy(true)
    try {
      await sendEmailCode()
      setOuvert(true)
      toast.success('Code envoyé. Regardez votre boîte mail (et les indésirables).')
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setBusy(false) }
  }

  async function confirmer() {
    if (code.replace(/\D/g, '').length !== 6) return
    setBusy(true)
    try {
      await confirmEmailCode(code)
      toast.success('Adresse confirmée. Vous pouvez publier vos annonces. 🎉')
      setOuvert(false); setCode('')
      await onVerified()
      recharger()
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setBusy(false) }
  }

  if (!status) return null

  // ── Administrateur : badge bleu, rien à faire ni à attendre. ──────────────
  if (status.badge === 'admin') {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#BEE3FF] bg-[#EAF6FF] p-4 shadow-card">
        <VerifiedBadge kind="admin" size={32} />
        <div className="min-w-0 flex-1">
          <p className="font-display font-black text-[#0B6BCB]">Équipe Chap.ci</p>
          <p className="text-xs text-[#2E6FA8]">
            Le badge bleu montre aux membres qu’un message vient bien du site.
          </p>
        </div>
      </div>
    )
  }

  // ── Adresse non confirmée : la seule action possible de tout cet écran. ───
  if (!status.emailVerified) {
    return (
      <div className="mt-4 rounded-2xl border border-[#F4D9B0] bg-[#FFF6EC] p-4 shadow-card">
        <div className="flex items-center gap-2">
          <MailCheck size={20} className="text-primary-600" />
          <p className="font-display font-black text-ink">Confirmez votre adresse e-mail</p>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          Nécessaire pour <b>publier une annonce</b>. Vous recevez un code à 6 chiffres,
          valable 15 minutes. Acheter et discuter avec un vendeur ne demandent rien.
        </p>

        {!ouvert ? (
          <button onClick={envoyer} disabled={busy} className="btn-primary mt-3 w-full py-2.5 text-sm">
            {busy ? 'Envoi…' : 'Recevoir mon code'}
          </button>
        ) : (
          <div className="mt-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6 chiffres"
              className="input tnum text-center text-2xl font-bold tracking-[0.4em]"
            />
            <button onClick={confirmer} disabled={busy || code.length !== 6} className="btn-primary mt-2 w-full py-2.5 text-sm disabled:opacity-50">
              {busy ? 'Vérification…' : 'Confirmer'}
            </button>
            <button onClick={envoyer} disabled={busy} className="mt-2 w-full text-xs font-semibold text-gray-500 underline">
              Je n’ai rien reçu — renvoyer un code
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Badge vert acquis. ────────────────────────────────────────────────────
  if (status.badge === 'anciennete') {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-ivoire-green/30 bg-ivoire-green/5 p-4 shadow-card">
        <VerifiedBadge kind="anciennete" size={32} />
        <div className="min-w-0 flex-1">
          <p className="font-display font-black text-ivoire-green-dark">Membre vérifié</p>
          <p className="text-xs text-gray-600">
            Membre depuis {status.mois} mois. Le badge vert apparaît à côté de votre nom,
            ici et sur votre profil public.
          </p>
        </div>
      </div>
    )
  }

  // ── Adresse confirmée, badge en chemin. Aucun bouton : le temps suffit. ───
  return (
    <div className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-center gap-2">
        <Check size={18} className="text-ivoire-green" strokeWidth={3} />
        <p className="font-display font-black text-ink">Adresse confirmée</p>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Vous pouvez publier vos annonces.
      </p>
      <div className="mt-3 rounded-xl bg-cream-100 p-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
          <VerifiedBadge kind="anciennete" size={16} /> Badge vérifié — dans {status.moisRestants}&nbsp;mois
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
          Il apparaît tout seul après <b>6 mois</b> de présence. Rien à demander,
          rien à payer — vous êtes membre depuis {status.mois}&nbsp;mois.
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-ivoire-green transition-all"
            style={{ width: `${Math.min(100, Math.round((status.mois / 6) * 100))}%` }}
          />
        </div>
      </div>
    </div>
  )
}

const rowTints: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-600',
  red: 'bg-red-100 text-red-500',
  gray: 'bg-gray-100 text-gray-500',
  gold: 'bg-amber-100 text-amber-600',
  green: 'bg-ivoire-green/10 text-ivoire-green',
  ocre: 'bg-accent-ocre/10 text-accent-ocre-dark',
  sky: 'bg-sky-100 text-sky-600',
}

/** Ligne de menu du compte (icône colorée · libellé · sous-titre · pastille · chevron). */
function AccountRow({
  icon, tint = 'primary', label, sub, badge, onClick,
}: {
  icon: React.ReactNode
  tint?: keyof typeof rowTints
  label: string
  sub?: string
  badge?: number
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-cream-100">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${rowTints[tint]}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-gray-900">{label}</span>
        {sub ? <span className="block truncate text-xs text-gray-500">{sub}</span> : null}
      </span>
      {badge ? (
        <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-primary-500 px-2 text-xs font-bold text-white">{badge}</span>
      ) : null}
      <ChevronRight size={18} className="shrink-0 text-gray-300" />
    </button>
  )
}

/** Grande carte clé du tableau de bord (icône colorée + valeur + libellé + tendance). */
function DashStat({
  icon, tint = 'primary', value, label, trend,
}: {
  icon: React.ReactNode
  tint?: keyof typeof rowTints
  value: number | string
  label: string
  trend?: number | null
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <span className={`inline-grid h-10 w-10 place-items-center rounded-xl ${rowTints[tint]}`}>{icon}</span>
      <p className="tnum mt-3 font-display text-3xl font-black text-ink">{value}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-gray-500">
        <span>{label}</span>
        {trend != null && trend !== 0 && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${trend > 0 ? 'text-ivoire-green' : 'text-red-500'}`}>
            {trend > 0 ? '▲' : '▼'} {Math.abs(trend)} %
          </span>
        )}
      </p>
    </div>
  )
}

/** Petite tuile de récap du compte (annonces / favoris / note). */
function MiniStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-2 py-3 text-center shadow-card">
      <p className="tnum text-2xl font-black text-primary-600">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

/** Bandeau indiquant le filtre actif, avec un bouton pour l'effacer. */
function FilterNote({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-xl bg-primary-50 px-3 py-2 text-sm">
      <span className="font-medium text-primary-700">Filtre : {label}</span>
      <button onClick={onClear} className="text-xs font-semibold text-primary-600 underline">
        Tout afficher
      </button>
    </div>
  )
}

/** Avis reçus par le vendeur (affiché en cliquant sur la tuile « Note »). */
function SellerReviews({
  reviews, rating, onClear,
}: { reviews: Review[]; rating: { avg: number; count: number }; onClear: () => void }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
        <span className="flex items-center gap-1.5 text-sm font-bold text-amber-800">
          <Star size={15} className="fill-amber-400 text-amber-400" />
          {rating.count ? `${rating.avg.toFixed(1)} / 5 · ${rating.count} avis` : 'Aucun avis pour le moment'}
        </span>
        <button onClick={onClear} className="text-xs font-semibold text-amber-700 underline">
          Retour
        </button>
      </div>
      {reviews.length === 0 ? (
        <Empty text="Vous n’avez pas encore reçu d’avis. Ils apparaîtront ici après vos ventes." />
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="card p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">{r.reviewerName || 'Acheteur'}</p>
                <span className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                  ))}
                </span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
              <p className="mt-1 text-[11px] text-gray-500">{timeAgo(r.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
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
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="text-sm font-bold text-gray-900">{who}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
      </div>
      <button onClick={onOpen} className="block w-full text-left">
        {order.items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            {it.image && <img src={mediaUrl(it.image)} alt="" className="h-12 w-12 rounded-lg object-cover" />}
            <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{it.title}</span>
            <span className="text-sm font-semibold text-primary-600">{priceLabel(it.price)}</span>
          </div>
        ))}
      </button>
      <div className="border-t border-line px-4 py-2">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-500">{timeAgo(order.createdAt)}</span>
          <span className="tnum font-bold text-gray-800">{formatFCFA(total)}</span>
        </div>
        {footer}
      </div>
    </div>
  )
}

function SettingsForm({ userId, initialName }: { userId: string; initialName: string }) {
  const toast = useToast()
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
      toast.error('Enregistrement impossible.')
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
  const [current, setCurrent] = useState('')
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
    const res = await updatePassword(pw, current)
    setBusy(false)
    if (res.error) return setError(res.error)
    setDone(true)
    setCurrent('')
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
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Mot de passe actuel"
            className="input"
            autoComplete="current-password"
          />
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
  const toast = useToast()

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await downscaleImage(file, 256)
      await updateMyProfile(userId, { avatar_url: dataUrl })
      onUpdated(dataUrl)
    } catch {
      toast.error('Impossible d’enregistrer la photo.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {currentUrl ? (
          <img src={mediaUrl(currentUrl)} alt="" className="h-full w-full object-cover" />
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
  const [enroll, setEnroll] = useState<{ factorId: string; uri: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [recovery, setRecovery] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)
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
    setEnroll({ factorId: r.factorId!, uri: r.uri!, secret: r.secret! })
  }
  async function validate() {
    if (!enroll) return
    setBusy(true)
    const r = await activateTotp(enroll.factorId, code.trim())
    setBusy(false)
    if (r.error) return setMsg(r.error)
    setEnroll(null)
    setCode('')
    setMsg('')
    setRecovery(r.recoveryCodes && r.recoveryCodes.length ? r.recoveryCodes : [])
    listTotp().then(setFactors).catch(() => {})
  }
  async function disable() {
    if (!disableCode.trim()) return setMsg('Entrez un code pour désactiver.')
    setBusy(true)
    const r = await unenrollTotp(disableCode.trim())
    setBusy(false)
    if (r.error) return setMsg(r.error)
    setDisableCode('')
    setMsg('Double authentification désactivée.')
    listTotp().then(setFactors).catch(() => {})
  }

  return (
    <div className="card p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
        <ShieldCheck size={16} /> Double authentification (2FA)
      </p>

      {/* Codes de secours affichés une seule fois, juste après l'activation. */}
      {recovery && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-bold text-amber-800">✓ 2FA activée. Notez vos codes de secours.</p>
          <p className="mt-0.5 text-xs text-amber-700">
            Chaque code ne sert qu’une fois. Ils permettent de vous connecter si vous perdez votre téléphone.
            <b> Ils ne seront plus affichés.</b>
          </p>
          {recovery.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {recovery.map((c) => (
                <code key={c} className="rounded-lg bg-white px-2 py-1.5 text-center font-mono text-sm tracking-wider text-gray-800">
                  {c.slice(0, 4)} {c.slice(4)}
                </code>
              ))}
            </div>
          )}
          <button
            onClick={() => { navigator.clipboard?.writeText(recovery.join('\n')); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            className="btn-outline mt-2 w-full py-1.5 text-xs"
          >
            {copied ? 'Copiés ✓' : 'Copier les codes'}
          </button>
          <button onClick={() => setRecovery(null)} className="btn-primary mt-1.5 w-full py-2 text-sm">
            J’ai noté mes codes
          </button>
        </div>
      )}

      {active && !recovery ? (
        <div>
          <p className="mb-2 text-sm text-ivoire-green-dark">✓ Activée — votre compte est protégé.</p>
          <p className="mb-1.5 text-xs text-gray-500">
            Pour la désactiver, entrez un code de votre application (ou un code de secours).
          </p>
          <input
            inputMode="numeric"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
            placeholder="Code à 6 chiffres"
            maxLength={8}
            className="input text-center tracking-widest"
          />
          <button onClick={disable} disabled={busy} className="btn-outline mt-2 w-full py-2 text-sm text-red-600">
            {busy ? 'Vérification…' : 'Désactiver'}
          </button>
        </div>
      ) : enroll ? (
        <div>
          <p className="mb-2 text-xs text-gray-500">
            Ouvrez votre application d’authentification (Google Authenticator, Authy…), ajoutez la clé,
            puis entrez le code à 6 chiffres généré.
          </p>
          <a href={enroll.uri} className="btn-primary mb-2 w-full py-2.5 text-sm">
            <KeyRound size={16} /> Ouvrir dans mon app d’authentification
          </a>
          <p className="mb-1 text-center text-[11px] text-gray-400">ou saisissez cette clé manuellement :</p>
          <p className="mb-2 break-all rounded-lg bg-gray-50 px-2 py-1.5 text-center font-mono text-xs tracking-wide text-gray-700">
            {enroll.secret}
          </p>
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
      ) : !recovery ? (
        <div>
          <p className="mb-2 text-xs text-gray-500">
            Ajoutez une couche de sécurité avec une application d’authentification. Recommandé pour les comptes administrateurs.
          </p>
          <button onClick={start} disabled={busy} className="btn-outline w-full py-2.5 text-sm">
            {busy ? '…' : 'Activer la 2FA'}
          </button>
        </div>
      ) : null}
      {msg && <p className="mt-2 text-xs text-gray-500">{msg}</p>}
    </div>
  )
}

function DeleteAccount() {
  const toast = useToast()
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [text, setText] = useState('')
  const [pwd, setPwd] = useState('')
  const [busy, setBusy] = useState(false)

  async function del() {
    setBusy(true)
    const r = await deleteAccount(pwd)
    setBusy(false)
    if (r.error) return toast.error(r.error)
    toast.success('Votre compte et toutes vos données ont été supprimés.')
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
        supprimées. Tapez <strong>SUPPRIMER</strong> et saisissez votre mot de passe pour confirmer.
      </p>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="SUPPRIMER"
        className="input mt-2"
      />
      <input
        type="password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        placeholder="Votre mot de passe"
        autoComplete="current-password"
        className="input mt-2"
      />
      <div className="mt-2 flex gap-2">
        <button onClick={() => { setConfirming(false); setText(''); setPwd('') }} className="btn-outline flex-1 py-2 text-sm">
          Annuler
        </button>
        <button
          onClick={del}
          disabled={text !== 'SUPPRIMER' || !pwd || busy}
          className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? 'Suppression…' : 'Supprimer'}
        </button>
      </div>
    </div>
  )
}
