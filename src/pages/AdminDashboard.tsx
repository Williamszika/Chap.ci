import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, Package, MessageSquare, ShoppingBag, Star, Mail,
  Loader2, Lock, Download, Trash2, TrendingUp, Wallet, RefreshCw,
} from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { formatPrice, timeAgo } from '../lib/format'
import { emojiFor } from '../lib/placeholder'
import {
  fetchAdminStats, fetchAdminUsers, fetchAdminListings, deleteAdminListing, fetchAdminOrders,
  type AdminStats, type AdminUser, type AdminListing, type AdminOrder,
} from '../lib/admin'
import { fetchNewsletter, type Subscriber } from '../lib/newsletter'

type Tab = 'overview' | 'listings' | 'users' | 'orders' | 'newsletter'

const STATUS_LABEL: Record<string, string> = {
  en_cours: 'En cours', finalise: 'Finalisé', annule: 'Annulé', pending: 'En attente',
}
const statusLabel = (s: string) => STATUS_LABEL[s] || s

export function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [gate, setGate] = useState<'loading' | 'ok' | 'denied' | 'error'>('loading')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    if (!user) { setGate('denied'); return }
    let alive = true
    fetchAdminStats()
      .then((s) => { if (alive) { setStats(s); setGate('ok') } })
      .catch((e) => {
        if (!alive) return
        if (/réservé|403|forbidden/i.test((e as Error).message)) setGate('denied')
        else { setError((e as Error).message); setGate('error') }
      })
    return () => { alive = false }
  }, [user])

  if (gate === 'loading')
    return <Shell><Center><Loader2 className="animate-spin" size={22} /> Chargement…</Center></Shell>

  if (gate === 'denied')
    return (
      <Shell>
        <Center>
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400"><Lock size={26} /></span>
            <p className="mt-4 font-semibold text-gray-800">Accès réservé à l’administrateur</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">Connectez-vous avec le compte administrateur du site pour accéder au tableau de bord.</p>
          </div>
        </Center>
      </Shell>
    )

  if (gate === 'error')
    return <Shell><Center><p className="text-sm text-red-600">⚠️ {error}</p></Center></Shell>

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="safe-top sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-3 py-3">
          <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1"><ArrowLeft size={22} /></button>
          <h1 className="font-display text-lg font-bold">Administration</h1>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2">
          {([['overview','Aperçu'],['listings','Annonces'],['users','Utilisateurs'],['orders','Commandes'],['newsletter','Abonnés']] as [Tab,string][]).map(([id,label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${tab === id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5">
        {tab === 'overview' && stats && <Overview stats={stats} />}
        {tab === 'listings' && <ListingsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'newsletter' && <NewsletterTab />}
      </div>
    </div>
  )
}

// ---------- Aperçu ----------
function Overview({ stats }: { stats: AdminStats }) {
  const cards = [
    { icon: <Users size={18} />, label: 'Utilisateurs', value: stats.users },
    { icon: <Package size={18} />, label: 'Annonces', value: stats.listings },
    { icon: <ShoppingBag size={18} />, label: 'Commandes', value: stats.orders },
    { icon: <MessageSquare size={18} />, label: 'Conversations', value: stats.conversations },
    { icon: <Star size={18} />, label: 'Avis', value: stats.reviews },
    { icon: <Mail size={18} />, label: 'Abonnés', value: stats.newsletter },
  ]
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-4 shadow-card">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">{c.icon}</span>
            <p className="mt-2 font-display text-2xl font-bold text-gray-900">{formatPrice(c.value)}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 text-white shadow-card">
        <span className="flex items-center gap-2 text-sm font-medium text-white/90"><Wallet size={16} /> Valeur totale des commandes</span>
        <p className="mt-1 font-display text-3xl font-bold">{formatPrice(stats.ordersValue)} <span className="text-lg">FCFA</span></p>
        {Object.keys(stats.ordersByStatus).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(stats.ordersByStatus).map(([s, n]) => (
              <span key={s} className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">{statusLabel(s)} : {n}</span>
            ))}
          </div>
        )}
      </div>

      <Block title="Dernières annonces" icon={<TrendingUp size={16} />}>
        {stats.recentListings.length === 0 ? <Empty>Aucune annonce.</Empty> : (
          <ul className="divide-y divide-gray-100">
            {stats.recentListings.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2.5">
                <Thumb listing={l} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-800">{l.title}</span>
                  <span className="text-xs text-gray-400">{timeAgo(l.createdAt)}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-primary-600">{formatPrice(l.price)} F</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Derniers inscrits" icon={<Users size={16} />}>
        {stats.recentUsers.length === 0 ? <Empty>Aucun utilisateur.</Empty> : (
          <ul className="divide-y divide-gray-100">
            {stats.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <Avatar name={u.fullName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-800">{u.fullName}</span>
                  <span className="block truncate text-xs text-gray-400">{u.email}</span>
                </span>
                <span className="shrink-0 text-xs text-gray-400">{timeAgo(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </div>
  )
}

// ---------- Annonces (modération) ----------
function ListingsTab() {
  const [items, setItems] = useState<AdminListing[] | null>(null)
  const [err, setErr] = useState('')
  const load = () => {
    setItems(null); setErr('')
    fetchAdminListings().then(setItems).catch((e) => setErr((e as Error).message))
  }
  useEffect(load, [])

  const remove = async (l: AdminListing) => {
    if (!confirm(`Supprimer définitivement « ${l.title} » ?`)) return
    try { await deleteAdminListing(l.id); setItems((p) => (p ?? []).filter((x) => x.id !== l.id)) }
    catch (e) { alert((e as Error).message) }
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-2">
      <RowHead count={items.length} label="annonce" />
      {items.map((l) => (
        <div key={l.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
          <Thumb listing={l} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-800">{l.title}</p>
            <p className="text-sm font-bold text-primary-600">{formatPrice(l.price)} FCFA</p>
            <p className="truncate text-xs text-gray-400">{l.sellerEmail || l.sellerName || '—'} · {timeAgo(l.createdAt)}</p>
          </div>
          <button onClick={() => remove(l)} aria-label="Supprimer" className="shrink-0 rounded-xl p-2 text-red-500 transition hover:bg-red-50">
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      {items.length === 0 && <Empty>Aucune annonce publiée.</Empty>}
    </div>
  )
}

// ---------- Utilisateurs ----------
function UsersTab() {
  const [items, setItems] = useState<AdminUser[] | null>(null)
  const [err, setErr] = useState('')
  const load = () => { setItems(null); setErr(''); fetchAdminUsers().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])
  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-2">
      <RowHead count={items.length} label="utilisateur" />
      {items.map((u) => (
        <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
          <Avatar name={u.fullName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-800">{u.fullName}</p>
            <p className="truncate text-xs text-gray-500">{u.email}</p>
            <p className="text-xs text-gray-400">
              {u.listings} annonce{u.listings > 1 ? 's' : ''}{u.commune ? ` · ${u.commune}` : ''} · inscrit {timeAgo(u.createdAt)}
            </p>
          </div>
        </div>
      ))}
      {items.length === 0 && <Empty>Aucun utilisateur.</Empty>}
    </div>
  )
}

// ---------- Commandes ----------
function OrdersTab() {
  const [items, setItems] = useState<AdminOrder[] | null>(null)
  const [err, setErr] = useState('')
  const load = () => { setItems(null); setErr(''); fetchAdminOrders().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])
  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-2">
      <RowHead count={items.length} label="commande" />
      {items.map((o) => (
        <div key={o.id} className="rounded-2xl bg-white p-3 shadow-card">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">{statusLabel(o.status)}</span>
            <span className="text-sm font-bold text-gray-900">{formatPrice(o.total)} FCFA</span>
          </div>
          <ul className="mt-2 space-y-0.5">
            {o.items.map((it, i) => (
              <li key={i} className="flex justify-between text-sm text-gray-700">
                <span className="min-w-0 truncate">{it.title}</span>
                <span className="shrink-0 pl-2 text-gray-500">{formatPrice(it.price)} F</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-400">
            {o.buyerEmail || '—'} → {o.sellerEmail || '—'} · {timeAgo(o.createdAt)}
          </p>
        </div>
      ))}
      {items.length === 0 && <Empty>Aucune commande.</Empty>}
    </div>
  )
}

// ---------- Abonnés newsletter ----------
function NewsletterTab() {
  const [subs, setSubs] = useState<Subscriber[] | null>(null)
  const [err, setErr] = useState('')
  const load = () => { setSubs(null); setErr(''); fetchNewsletter().then(setSubs).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  const exportCsv = () => {
    if (!subs) return
    const csv = 'email,date_inscription\n' + subs.map((s) => `${s.email},${new Date(s.createdAt).toISOString().slice(0, 10)}`).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `chapci-newsletter-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!subs) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-2xl font-bold text-gray-900">{subs.length}</p>
          <p className="text-sm text-gray-500">abonné{subs.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={exportCsv} disabled={subs.length === 0} className="btn-primary py-2.5 disabled:opacity-50">
          <Download size={18} /> Exporter (CSV)
        </button>
      </div>
      <p className="text-xs text-gray-400">Importez le CSV dans Brevo, Mailchimp ou MailerLite pour vos campagnes.</p>
      {subs.length === 0 ? <Empty>Aucun abonné pour l’instant.</Empty> : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
          {subs.map((s) => (
            <li key={s.email} className="flex items-center gap-3 px-4 py-3">
              <Mail size={16} className="shrink-0 text-primary-500" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{s.email}</span>
              <span className="shrink-0 text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString('fr-FR')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------- petits composants ----------
function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1"><ArrowLeft size={22} /></button>
        <h1 className="font-display text-lg font-bold">Administration</h1>
      </header>
      {children}
    </div>
  )
}
function Center({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[50vh] items-center justify-center gap-2 px-6 text-gray-500">{children}</div>
}
function Block({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="mb-1 flex items-center gap-1.5 font-display text-sm font-bold text-gray-800">{icon} {title}</h2>
      {children}
    </section>
  )
}
function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-gray-400">{children}</p>
}
function RowHead({ count, label }: { count: number; label: string }) {
  return <p className="px-1 pb-1 text-sm font-semibold text-gray-500">{formatPrice(count)} {label}{count > 1 ? 's' : ''}</p>
}
function ErrRetry({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <Center>
      <div className="flex flex-col items-center text-center">
        <p className="text-sm text-red-600">⚠️ {msg}</p>
        <button onClick={onRetry} className="btn-outline mt-3 py-2 text-sm"><RefreshCw size={16} /> Réessayer</button>
      </div>
    </Center>
  )
}
function Thumb({ listing }: { listing: { images: string[]; categoryId: string; subcategory?: string | null } }) {
  const img = listing.images?.[0]
  if (img) return <img src={img} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
      {emojiFor(listing.categoryId, listing.subcategory ?? undefined)}
    </span>
  )
}
function Avatar({ name }: { name: string }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-600">{initial}</span>
}
