import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, Package, MessageSquare, ShoppingBag, Star, Mail,
  Loader2, Lock, Download, Trash2, TrendingUp, Wallet, RefreshCw,
  Flag, Ban, ShieldOff, ShieldCheck as ShieldOk, Eye, EyeOff, ChevronRight, UserX, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { formatPrice, formatFCFA, timeAgo } from '../lib/format'
import { emojiFor } from '../lib/placeholder'
import { locationLabel } from '../data/locations'
import {
  fetchAdminStats, fetchAdminUsers, fetchAdminListings, deleteAdminListing, fetchAdminOrders,
  fetchModerators, saveModerator, removeModerator, blockModerator, adminRole, sendTestEmail, getSmtp, saveSmtp,
  campaignCount, campaignSend, digestInfo, digestSend, suggestionsTest,
  setAdminListingHidden, fetchAdminUserDetail, setUserStatus, deleteUser, fetchReports, resolveReport,
  fetchContactMessages, setContactHandled, deleteContactMessage, suggestContactReply, replyContactMessage,
  fetchAdminConversations, fetchAdminReviews, deleteAdminReview, fetchVisits, fetchResponseTime,
  listBackups, downloadBackup, resetData,
  adminUnlock, adminUnlockEmail, adminLock,
  type AdminStats, type AdminUser, type AdminListing, type AdminOrder, type Moderators, type SmtpSettings,
  type AdminUserDetail, type Report, type UserStatus, type AdminConversation, type AdminReview,
  type VisitStats, type VisitRange, type ResponseTime, type BackupFile, type ContactMessage,
} from '../lib/admin'
import { fetchNewsletter, type Subscriber } from '../lib/newsletter'
import { ShieldCheck, UserPlus, Crown, MailCheck, Send, Save, CheckCircle2, Megaphone, CalendarClock, Copy, Database, KeyRound, Pencil, Inbox, Undo2, Sparkles, ChevronDown } from 'lucide-react'

type Tab = 'overview' | 'listings' | 'users' | 'orders' | 'newsletter' | 'moderators' | 'emails' | 'campaigns' | 'reports' | 'contact' | 'conversations' | 'reviews' | 'visitors' | 'backup' | 'automation'

const STATUS_LABEL: Record<string, string> = {
  en_cours: 'En cours', finalise: 'Finalisé', annule: 'Annulé', pending: 'En attente',
}
const statusLabel = (s: string) => STATUS_LABEL[s] || s

export function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [gate, setGate] = useState<'loading' | 'ok' | 'denied' | 'error' | 'locked'>('loading')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [role, setRole] = useState<{ owner: boolean; permissions: string[] }>({ owner: false, permissions: [] })
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!user) { setGate('denied'); return }
    let alive = true
    setGate('loading')
    // Le rôle (propriétaire / permissions) est lisible même verrouillé (/admin/check).
    adminRole().then((r) => { if (alive) setRole({ owner: r.owner, permissions: r.permissions }) }).catch(() => {})
    fetchAdminStats()
      .then((s) => { if (alive) { setStats(s); setGate('ok') } })
      .catch((e) => {
        if (!alive) return
        // 423 = compte admin OK mais tableau de bord verrouillé (code d'accès requis).
        if ((e as { status?: number }).status === 423) { setGate('locked'); return }
        if (/réservé|403|forbidden/i.test((e as Error).message)) setGate('denied')
        else { setError((e as Error).message); setGate('error') }
      })
    return () => { alive = false }
  }, [user, reload])

  // Onglets visibles selon le rôle : le propriétaire voit tout ; un modérateur voit
  // « Aperçu » + uniquement les fonctionnalités que l'admin lui a cochées.
  const canSee = (id: Tab) => role.owner || id === 'overview' || role.permissions.includes(id)

  // Rafraîchit les compteurs (badges signalements / contact) après une action,
  // sans re-passer par l'écran de chargement.
  const refreshStats = () => { fetchAdminStats().then(setStats).catch(() => {}) }

  if (gate === 'loading')
    return <Shell><Center><Loader2 className="animate-spin" size={22} /> Chargement…</Center></Shell>

  if (gate === 'denied')
    return (
      <Shell>
        <Center>
          <div className="mx-auto flex max-w-sm flex-col items-center rounded-3xl border border-[#EFE6D7] bg-white px-6 py-10 text-center shadow-card">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600"><Lock size={30} /></span>
            <h1 className="mt-4 font-display text-xl font-bold text-gray-900">Accès réservé à l’administrateur</h1>
            <p className="mt-1.5 max-w-xs text-sm text-gray-500">Connectez-vous avec le compte administrateur du site pour accéder au tableau de bord.</p>
          </div>
        </Center>
      </Shell>
    )

  if (gate === 'error')
    return <Shell><Center><p className="text-sm text-red-600">⚠️ {error}</p></Center></Shell>

  if (gate === 'locked')
    return <Shell><AdminUnlockGate owner={role.owner} onUnlocked={() => setReload((n) => n + 1)} /></Shell>

  return (
    <div className="min-h-screen bg-[#FFF6EA] pb-16">
      <header className="safe-top sticky top-0 z-30 border-b border-[#EFE6D7] bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5 px-3 py-3">
          <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1"><ArrowLeft size={22} /></button>
          <h1 className="font-display text-lg font-bold">Administration</h1>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${role.owner ? 'bg-ink' : 'bg-ivoire-green'}`}>
            {role.owner ? 'Propriétaire' : 'Modérateur'}
          </span>
          <button
            onClick={() => { adminLock(); setReload((n) => n + 1) }}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-[#E6DAC6] bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-cream-100 active:scale-95"
            title="Verrouiller le tableau de bord"
          >
            <Lock size={14} /> Verrouiller
          </button>
        </div>
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-2 pb-2">
          {([['overview','Aperçu'],['visitors','Visiteurs'],['listings','Annonces'],['users','Utilisateurs'],['reports','Signalements'],['contact','Contact'],['orders','Commandes'],['conversations','Conversations'],['reviews','Avis'],['newsletter','Abonnés'],['campaigns','Campagnes'],['moderators','Modérateurs'],['emails','Emails'],['backup','Sauvegarde'],['automation','Tâches auto']] as [Tab,string][]).filter(([id]) => canSee(id)).map(([id,label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${tab === id ? 'border border-primary-500 bg-primary-500 text-white shadow-sm' : 'border border-[#E6DAC6] bg-white text-gray-600 hover:bg-cream-100'}`}
            >
              {label}
              {id === 'reports' && !!stats?.reportsOpen && (
                <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{stats.reportsOpen}</span>
              )}
              {id === 'contact' && !!stats?.contactOpen && (
                <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">{stats.contactOpen}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5 md:max-w-[1280px] md:px-6">
        {tab === 'overview' && stats && <Overview stats={stats} onGo={setTab} canSee={canSee} />}
        {tab === 'visitors' && <VisitorsTab />}
        {tab === 'listings' && <ListingsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'reports' && <ReportsTab onChanged={refreshStats} />}
        {tab === 'contact' && <ContactTab onChanged={refreshStats} />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'conversations' && <ConversationsTab />}
        {tab === 'reviews' && <ReviewsTab />}
        {tab === 'newsletter' && <NewsletterTab />}
        {tab === 'campaigns' && <CampaignsTab />}
        {tab === 'moderators' && <ModeratorsTab />}
        {tab === 'emails' && <EmailsTab />}
        {tab === 'backup' && <BackupTab />}
        {tab === 'automation' && <AutomationTab />}
      </div>
    </div>
  )
}

// ---------- Serrure du tableau de bord (code d'accès administrateur) ----------
function AdminUnlockGate({ owner, onUnlocked }: { owner: boolean; onUnlocked: () => void }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setInfo('')
    if (!code.trim()) return setErr('Entrez le code d’accès.')
    setBusy(true)
    try { await adminUnlock(code.trim().toUpperCase()); onUnlocked() }
    catch (e) { setErr((e as Error).message) }
    finally { setBusy(false) }
  }
  async function sendEmail() {
    setErr(''); setInfo(''); setBusy(true)
    try {
      const r = await adminUnlockEmail()
      setInfo(r.sent > 0 ? 'Code envoyé à l’email de l’admin principal.' : 'Envoi impossible (email non configuré ?).')
    } catch (e) { setErr((e as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <div className="rounded-2xl border border-[#EFE6D7] bg-white p-6 shadow-card">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600"><Lock size={30} /></span>
          <h1 className="mt-4 font-display text-xl font-bold text-gray-900">Tableau de bord verrouillé</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            {owner
              ? 'Recevez un code par email, puis saisissez-le ici. Il expire dans 1 minute.'
              : 'Entrez le code d’accès fourni par l’administrateur principal.'}
          </p>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="Code d’accès"
            maxLength={16}
            autoFocus
            className="input text-center font-mono text-lg tracking-[0.3em]"
          />
          {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{err}</p>}
          {info && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{info}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 text-base">
            {busy ? <Loader2 size={20} className="animate-spin" /> : 'Déverrouiller'}
          </button>
        </form>
        {owner ? (
          <button onClick={sendEmail} disabled={busy} className="btn-outline mt-3 w-full py-2.5 text-sm">
            <Mail size={16} /> Recevoir un code par email
          </button>
        ) : (
          <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-400">
            Vous n’avez pas le code ? Demandez-le à l’administrateur principal du site.
          </p>
        )}
      </div>
    </div>
  )
}

// ---------- Aperçu ----------
function Overview({ stats, onGo, canSee }: { stats: AdminStats; onGo: (t: Tab) => void; canSee: (t: Tab) => boolean }) {
  const cards: { icon: ReactNode; label: string; value: number; tab?: Tab; alert?: boolean }[] = [
    { icon: <Users size={18} />, label: 'Utilisateurs', value: stats.users, tab: 'users' },
    { icon: <Package size={18} />, label: 'Annonces', value: stats.listings, tab: 'listings' },
    { icon: <ShoppingBag size={18} />, label: 'Commandes', value: stats.orders, tab: 'orders' },
    { icon: <MessageSquare size={18} />, label: 'Conversations', value: stats.conversations, tab: 'conversations' },
    { icon: <Star size={18} />, label: 'Avis', value: stats.reviews, tab: 'reviews' },
    { icon: <Mail size={18} />, label: 'Abonnés', value: stats.newsletter, tab: 'newsletter' },
    { icon: <Flag size={18} />, label: 'Signalements', value: stats.reportsOpen ?? 0, tab: 'reports', alert: (stats.reportsOpen ?? 0) > 0 },
    { icon: <Inbox size={18} />, label: 'Contact à traiter', value: stats.contactOpen ?? 0, tab: 'contact', alert: (stats.contactOpen ?? 0) > 0 },
  ]
  // Un modérateur ne voit que les cartes des sections qu'il peut réellement
  // ouvrir (cohérent avec la barre d'onglets — pas de cul-de-sac 403).
  const visible = cards.filter((c) => !c.tab || canSee(c.tab))
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((c) => {
          const clickable = !!c.tab
          const Comp = clickable ? 'button' : 'div'
          return (
            <Comp
              key={c.label}
              {...(clickable ? { onClick: () => onGo(c.tab!), type: 'button' as const } : {})}
              className={`rounded-2xl bg-white p-4 text-left shadow-card transition ${clickable ? 'active:scale-[0.98] hover:shadow-md' : ''} ${c.alert ? 'ring-2 ring-red-400' : ''}`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.alert ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>{c.icon}</span>
              <p className="mt-2 font-display text-2xl font-bold text-gray-900">{formatPrice(c.value)}</p>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                {c.label}{clickable && <ChevronRight size={12} className="text-gray-300" />}
              </p>
            </Comp>
          )
        })}
      </div>

      {/* Statistiques temporelles : nouveaux inscrits / annonces par période */}
      {stats.periods && (
        <>
          <PeriodStats title="Nouveaux inscrits" icon={<Users size={16} />} data={stats.periods.users} onGo={() => onGo('users')} />
          <PeriodStats title="Nouvelles annonces" icon={<Package size={16} />} data={stats.periods.listings} onGo={() => onGo('listings')} />
        </>
      )}

      {/* Graphique évolutif sur 14 jours */}
      {stats.series && stats.series.length > 0 && <TrendChart series={stats.series} />}

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

// Bloc de statistiques temporelles (jour / semaine / mois / année).
function PeriodStats({
  title, icon, data, onGo,
}: {
  title: string
  icon: ReactNode
  data: { day: number; week: number; month: number; year: number }
  onGo: () => void
}) {
  const cells: { label: string; value: number }[] = [
    { label: "Aujourd’hui", value: data.day },
    { label: '7 jours', value: data.week },
    { label: '30 jours', value: data.month },
    { label: '1 an', value: data.year },
  ]
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-600">{icon}</span>
        {title}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {cells.map((c) => (
          <button
            key={c.label}
            onClick={onGo}
            className="rounded-xl bg-gray-50 px-1 py-3 text-center transition hover:bg-primary-50 active:scale-[0.97]"
          >
            <p className="font-display text-xl font-bold text-gray-900">+{c.value}</p>
            <p className="text-[10px] font-medium leading-tight text-gray-500">{c.label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// Graphique évolutif (courbe) sur 14 jours, avec bascule Inscrits / Annonces.
function TrendChart({ series }: { series: { date: string; users: number; listings: number }[] }) {
  const [metric, setMetric] = useState<'users' | 'listings'>('users')
  const total = series.reduce((s, d) => s + d[metric], 0)
  const dayNum = (iso: string) => iso.slice(8, 10)
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <TrendingUp size={16} className="text-primary-500" /> Évolution (14 jours)
        </p>
        <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold">
          <button onClick={() => setMetric('users')} className={`rounded-md px-2.5 py-1 ${metric === 'users' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>Inscrits</button>
          <button onClick={() => setMetric('listings')} className={`rounded-md px-2.5 py-1 ${metric === 'listings' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>Annonces</button>
        </div>
      </div>
      <AreaChart values={series.map((d) => d[metric])} />
      <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
        <span>{dayNum(series[0].date)}</span>
        <span className="font-semibold text-gray-500">{total} au total · 14 j</span>
        <span>{dayNum(series[series.length - 1].date)}</span>
      </div>
    </div>
  )
}

// ---------- Visiteurs (analytics) ----------
function formatDuration(sec: number | null): string {
  if (sec == null) return '—'
  if (sec < 60) return `${sec} s`
  if (sec < 3600) return `${Math.round(sec / 60)} min`
  if (sec < 86400) { const h = Math.floor(sec / 3600); const m = Math.round((sec % 3600) / 60); return m ? `${h} h ${m} min` : `${h} h` }
  const d = Math.floor(sec / 86400); const h = Math.round((sec % 86400) / 3600); return h ? `${d} j ${h} h` : `${d} j`
}

/** Courbe (aire) générique à partir d'une série de valeurs. */
function AreaChart({ values }: { values: number[] }) {
  const W = 320, H = 120, pad = 8
  const vals = values
  const max = Math.max(1, ...vals)
  const n = Math.max(1, vals.length)
  const x = (i: number) => pad + (n === 1 ? 0 : (i / (n - 1)) * (W - 2 * pad))
  const y = (v: number) => H - pad - (v / max) * (H - 2 * pad)
  const line = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${x(0)},${H - pad} ${line} ${x(n - 1)},${H - pad}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F77F00" stopOpacity="0.35" />
          <stop offset="1" stopColor="#F77F00" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#areaGrad)" />
      <polyline points={line} fill="none" stroke="#F77F00" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const RANGES: { v: VisitRange; label: string }[] = [
  { v: 'day', label: 'Jour' },
  { v: 'week', label: 'Semaine' },
  { v: 'month', label: 'Mois' },
  { v: 'year', label: 'Année' },
]

function VisitorsTab() {
  const [range, setRange] = useState<VisitRange>('day')
  const [metric, setMetric] = useState<'visitors' | 'views'>('visitors')
  const [data, setData] = useState<VisitStats | null>(null)
  const [rt, setRt] = useState<ResponseTime | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => { setData(null); setErr(''); fetchVisits(range).then(setData).catch((e) => setErr((e as Error).message)) }, [range])
  useEffect(() => { fetchResponseTime().then(setRt).catch(() => {}) }, [])

  const s = data?.series ?? []
  const labelAt = (i: number) => s[i]?.label ?? ''

  return (
    <div className="space-y-4">
      {/* Sélecteur de granularité */}
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.v}
            onClick={() => setRange(r.v)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${range === r.v ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {err ? <ErrRetry msg={err} onRetry={() => setRange((x) => x)} /> : !data ? <Center><Loader2 className="animate-spin" size={20} /></Center> : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="font-display text-2xl font-bold text-gray-900">{formatPrice(data.totalVisitors)}</p>
              <p className="text-xs text-gray-500">Visiteurs uniques</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="font-display text-2xl font-bold text-gray-900">{formatPrice(data.totalViews)}</p>
              <p className="text-xs text-gray-500">Pages vues</p>
            </div>
          </div>

          {/* Courbe */}
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <TrendingUp size={16} className="text-primary-500" /> Évolution des visites
              </p>
              <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold">
                <button onClick={() => setMetric('visitors')} className={`rounded-md px-2.5 py-1 ${metric === 'visitors' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>Visiteurs</button>
                <button onClick={() => setMetric('views')} className={`rounded-md px-2.5 py-1 ${metric === 'views' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>Pages vues</button>
              </div>
            </div>
            <AreaChart values={s.map((x) => x[metric])} />
            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>{labelAt(0)}</span>
              <span>{labelAt(Math.floor(s.length / 2))}</span>
              <span>{labelAt(s.length - 1)}</span>
            </div>
          </div>
        </>
      )}

      {/* Temps de réponse moyen */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
          <MessageSquare size={16} className="text-primary-500" /> Temps de réponse aux messages
        </p>
        {!rt ? (
          <p className="text-sm text-gray-400">Chargement…</p>
        ) : rt.count === 0 ? (
          <p className="text-sm text-gray-500">Pas encore assez de messages pour calculer.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="font-display text-xl font-bold text-emerald-600">{formatDuration(rt.medianSeconds)}</p>
              <p className="text-[11px] text-gray-500">Réponse habituelle (médiane)</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="font-display text-xl font-bold text-gray-800">{formatDuration(rt.avgSeconds)}</p>
              <p className="text-[11px] text-gray-500">Moyenne ({formatPrice(rt.count)} réponses)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Conversations (supervision) ----------
function ConversationsTab() {
  const [items, setItems] = useState<AdminConversation[] | null>(null)
  const [err, setErr] = useState('')
  const load = () => { setItems(null); setErr(''); fetchAdminConversations().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])
  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-2">
      <RowHead count={items.length} label="conversation" />
      {items.map((c) => (
        <div key={c.id} className="rounded-2xl bg-white p-3 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-gray-800">{c.listingTitle || 'Conversation'}</p>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{c.messages} msg</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">{c.buyerEmail || '—'} ↔ {c.sellerEmail || '—'}</p>
          {c.lastMessage && <p className="mt-1 truncate rounded-lg bg-gray-50 px-2 py-1 text-xs text-gray-600">« {c.lastMessage} »</p>}
          <p className="mt-1 text-[11px] text-gray-400">{timeAgo(c.createdAt)}</p>
        </div>
      ))}
      {items.length === 0 && <Empty>Aucune conversation.</Empty>}
    </div>
  )
}

// ---------- Avis (modération) ----------
function ReviewsTab() {
  const [items, setItems] = useState<AdminReview[] | null>(null)
  const [err, setErr] = useState('')
  const load = () => { setItems(null); setErr(''); fetchAdminReviews().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])
  const remove = async (r: AdminReview) => {
    if (!confirm('Supprimer cet avis ?')) return
    try { await deleteAdminReview(r.id); setItems((p) => (p ?? []).filter((x) => x.id !== r.id)) }
    catch (e) { alert((e as Error).message) }
  }
  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-2">
      <RowHead count={items.length} label="avis" />
      {items.map((r) => (
        <div key={r.id} className="rounded-2xl bg-white p-3 shadow-card">
          <div className="flex items-center justify-between">
            <p className="truncate text-sm font-semibold text-gray-800">{r.reviewerName || r.reviewerEmail || 'Acheteur'}</p>
            <span className="flex shrink-0 items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
              ))}
            </span>
          </div>
          {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-[11px] text-gray-400">
              {r.listingTitle ? `Sur « ${r.listingTitle} » · ` : ''}{timeAgo(r.createdAt)}
            </p>
            <button onClick={() => remove(r)} className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label="Supprimer l’avis">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && <Empty>Aucun avis.</Empty>}
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
            <p className="tnum text-sm font-bold text-primary-600">{formatFCFA(l.price)}</p>
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
const STATUS_BADGE: Record<UserStatus, { label: string; cls: string }> = {
  active: { label: 'Actif', cls: 'bg-emerald-50 text-emerald-700' },
  restricted: { label: 'Restreint', cls: 'bg-amber-50 text-amber-700' },
  blocked: { label: 'Bloqué', cls: 'bg-red-50 text-red-700' },
}

function UsersTab() {
  const [items, setItems] = useState<AdminUser[] | null>(null)
  const [err, setErr] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const load = () => { setItems(null); setErr(''); fetchAdminUsers().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  if (selected) return <UserDetail id={selected} onBack={() => { setSelected(null); load() }} />
  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-2">
      <RowHead count={items.length} label="utilisateur" />
      {items.map((u) => {
        const b = STATUS_BADGE[u.status] ?? STATUS_BADGE.active
        return (
          <button key={u.id} onClick={() => setSelected(u.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-card transition hover:shadow-md active:scale-[0.99]">
            <Avatar name={u.fullName} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-semibold text-gray-800">
                {u.fullName}
                {u.status !== 'active' && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${b.cls}`}>{b.label}</span>}
              </p>
              <p className="truncate text-xs text-gray-500">{u.email}</p>
              <p className="text-xs text-gray-400">
                {u.listings} annonce{u.listings > 1 ? 's' : ''}{u.commune ? ` · ${u.commune}` : ''} · inscrit {timeAgo(u.createdAt)}
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-gray-300" />
          </button>
        )
      })}
      {items.length === 0 && <Empty>Aucun utilisateur.</Empty>}
    </div>
  )
}

function UserDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [u, setU] = useState<AdminUserDetail | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const load = () => { setU(null); setErr(''); fetchAdminUserDetail(id).then(setU).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [id])

  const changeStatus = async (status: UserStatus) => {
    setBusy(true)
    try { await setUserStatus(id, status); load() }
    catch (e) { alert((e as Error).message) } finally { setBusy(false) }
  }
  const removeUser = async () => {
    if (!confirm(`Supprimer définitivement le compte de ${u?.email} et TOUT son contenu ? Action irréversible.`)) return
    setBusy(true)
    try { await deleteUser(id); onBack() }
    catch (e) { alert((e as Error).message); setBusy(false) }
  }
  const toggleListing = async (lid: string, hidden: boolean) => {
    try { await setAdminListingHidden(lid, hidden); load() } catch (e) { alert((e as Error).message) }
  }
  const removeListing = async (lid: string, title: string) => {
    if (!confirm(`Supprimer « ${title} » ?`)) return
    try { await deleteAdminListing(lid); load() } catch (e) { alert((e as Error).message) }
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!u) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  const b = STATUS_BADGE[u.status] ?? STATUS_BADGE.active

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800">
        <ArrowLeft size={16} /> Retour aux utilisateurs
      </button>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <Avatar name={u.fullName} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-semibold text-gray-900">
              {u.fullName}
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${b.cls}`}>{b.label}</span>
            </p>
            <p className="truncate text-sm text-gray-500">{u.email}</p>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {u.phone && <Info label="Téléphone" value={u.phone} />}
          {(u.commune || u.cityId) && <Info label="Localisation" value={locationLabel(u.regionId ?? '', u.cityId ?? '', u.commune ?? undefined)} />}
          <Info label="Inscrit" value={timeAgo(u.createdAt)} />
          <Info label="Annonces" value={String(u.listings.length)} />
        </dl>
        {u.bio && <p className="mt-2 rounded-xl bg-gray-50 p-2 text-sm text-gray-600">{u.bio}</p>}
      </div>

      {/* Actions de modération */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="mb-2 text-sm font-bold text-gray-800">Modération du compte</p>
        <div className="grid grid-cols-3 gap-2">
          <ModBtn active={u.status === 'active'} onClick={() => changeStatus('active')} disabled={busy} icon={<ShieldOk size={15} />} label="Actif" tone="emerald" />
          <ModBtn active={u.status === 'restricted'} onClick={() => changeStatus('restricted')} disabled={busy} icon={<ShieldOff size={15} />} label="Restreindre" tone="amber" />
          <ModBtn active={u.status === 'blocked'} onClick={() => changeStatus('blocked')} disabled={busy} icon={<Ban size={15} />} label="Bloquer" tone="red" />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          <b>Restreint</b> : ne peut plus publier. <b>Bloqué</b> : ne peut plus se connecter (ses annonces sont masquées).
        </p>
        <button onClick={removeUser} disabled={busy} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
          <UserX size={16} /> Supprimer ce compte
        </button>
      </div>

      {/* Ses annonces */}
      <div>
        <p className="mb-2 text-sm font-bold text-gray-800">Annonces ({u.listings.length})</p>
        <div className="space-y-2">
          {u.listings.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
              <Thumb listing={l} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold text-gray-800">
                  {l.title}
                  {l.hidden && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">Masquée</span>}
                </p>
                <p className="tnum text-sm font-bold text-primary-600">{formatFCFA(l.price)}</p>
              </div>
              <button onClick={() => toggleListing(l.id, !l.hidden)} aria-label={l.hidden ? 'Afficher' : 'Masquer'} className="shrink-0 rounded-xl p-2 text-gray-500 hover:bg-gray-100">
                {l.hidden ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
              <button onClick={() => removeListing(l.id, l.title)} aria-label="Supprimer" className="shrink-0 rounded-xl p-2 text-red-500 hover:bg-red-50">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {u.listings.length === 0 && <Empty>Aucune annonce.</Empty>}
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  )
}

function ModBtn({ active, onClick, disabled, icon, label, tone }: { active: boolean; onClick: () => void; disabled: boolean; icon: ReactNode; label: string; tone: 'emerald' | 'amber' | 'red' }) {
  const tones: Record<string, string> = {
    emerald: 'border-emerald-500 bg-emerald-500 text-white',
    amber: 'border-amber-500 bg-amber-500 text-white',
    red: 'border-red-500 bg-red-500 text-white',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-xs font-semibold transition disabled:opacity-50 ${active ? tones[tone] : 'border-[#E6DAC6] text-gray-600'}`}
    >
      {icon}{label}
    </button>
  )
}

// ---------- Signalements ----------
function ReportsTab({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<Report[] | null>(null)
  const [err, setErr] = useState('')
  const load = () => { setItems(null); setErr(''); fetchReports().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  const hide = async (r: Report) => {
    try { await setAdminListingHidden(r.listingId, !r.listingHidden); load() } catch (e) { alert((e as Error).message) }
  }
  const resolve = async (r: Report) => {
    try { await resolveReport(r.id); load(); onChanged?.() } catch (e) { alert((e as Error).message) }
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-2">
      <RowHead count={items.length} label="signalement" />
      {items.map((r) => (
        <div key={r.id} className={`rounded-2xl bg-white p-3 shadow-card ${r.status === 'open' ? 'ring-1 ring-red-100' : 'opacity-70'}`}>
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${r.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
              <Flag size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-gray-800">
                {r.reason}
                {r.status === 'resolved' && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Traité</span>}
                {r.listingHidden && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">Annonce masquée</span>}
              </p>
              <a href={`#/annonce/${r.listingId}`} className="block truncate text-sm text-primary-600 hover:underline">{r.listingTitle}</a>
              {r.details && <p className="mt-1 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">{r.details}</p>}
              <p className="mt-1 text-[11px] text-gray-400">Signalé par {r.reporterEmail || '—'} · {timeAgo(r.createdAt)}</p>
              <div className="mt-2 flex gap-1.5">
                <button onClick={() => hide(r)} className="flex items-center gap-1 rounded-lg border border-[#E6DAC6] px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  {r.listingHidden ? <><Eye size={13} /> Réafficher</> : <><EyeOff size={13} /> Masquer l’annonce</>}
                </button>
                {r.status === 'open' && (
                  <button onClick={() => resolve(r)} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">
                    <CheckCircle2 size={13} /> Marquer traité
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <Empty>Aucun signalement. 🎉</Empty>}
    </div>
  )
}

// ---------- Messages du formulaire de contact ----------
function ContactTab({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<ContactMessage[] | null>(null)
  const [err, setErr] = useState('')
  const load = () => { setItems(null); setErr(''); fetchContactMessages().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  const mark = async (m: ContactMessage, handled: boolean) => {
    try { await setContactHandled(m.id, handled); load(); onChanged?.() } catch (e) { alert((e as Error).message) }
  }
  const remove = async (m: ContactMessage) => {
    if (!confirm('Supprimer définitivement ce message ?')) return
    try { await deleteContactMessage(m.id); load(); onChanged?.() } catch (e) { alert((e as Error).message) }
  }

  // Ouverture d'un message (une carte à la fois) + brouillon de réponse.
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [sending, setSending] = useState(false)

  const toggleOpen = (m: ContactMessage) => {
    if (openId === m.id) { setOpenId(null); return }
    setOpenId(m.id)
    setDraft('')
  }
  const suggest = async (m: ContactMessage) => {
    setSuggesting(true)
    try {
      const r = await suggestContactReply(m.id)
      setDraft(r.draft)
    } catch (e) { alert((e as Error).message) } finally { setSuggesting(false) }
  }
  const sendReply = async (m: ContactMessage) => {
    const body = draft.trim()
    if (!body) return
    setSending(true)
    try {
      await replyContactMessage(m.id, body)
      setDraft('')
      load()
      onChanged?.()
    } catch (e) { alert((e as Error).message) } finally { setSending(false) }
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-2">
      <RowHead count={items.length} label="message" />
      {items.map((m) => {
        const open = openId === m.id
        return (
          <div key={m.id} className={`overflow-hidden rounded-2xl bg-white shadow-card ${m.handled ? '' : 'ring-1 ring-primary-100'}`}>
            {/* En-tête cliquable : ouvre / referme le message */}
            <button onClick={() => toggleOpen(m)} aria-expanded={open} className="flex w-full items-center gap-2.5 p-3 text-left transition hover:bg-cream-100/60">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.handled ? 'bg-gray-100 text-gray-400' : 'bg-primary-100 text-primary-600'}`}>
                <Inbox size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-gray-800">
                  {m.subject}
                  {m.replyBody != null && <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">Répondu</span>}
                  {m.handled && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Traité</span>}
                </span>
                {!open && <span className="mt-0.5 block truncate text-sm text-gray-500">{m.message}</span>}
                <span className="mt-0.5 block text-[11px] text-gray-400">
                  De {m.name || '—'}{m.email ? ` · ${m.email}` : ''} · {timeAgo(m.createdAt)}
                </span>
              </span>
              <ChevronDown size={17} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="border-t border-[#EFE6D7] px-3 pb-3">
                {/* Message complet (texte échappé par React : pas d'injection HTML) */}
                <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">{m.message}</p>

                {m.replyBody != null ? (
                  /* Réponse déjà envoyée */
                  <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <p className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={13} /> Réponse envoyée depuis contact@chap.ci
                      {m.repliedAt ? ` · ${timeAgo(m.repliedAt)}` : ''}{m.repliedBy ? ` · par ${m.repliedBy}` : ''}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-emerald-900">{m.replyBody}</p>
                  </div>
                ) : m.email ? (
                  /* Composer : réponse envoyée par email depuis contact@chap.ci */
                  <div className="mt-2 rounded-xl border border-[#EFE6D7] bg-[#FFF6EA]/70 p-3">
                    <p className="text-xs font-bold text-gray-700">Répondre à {m.name || m.email}</p>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={5}
                      placeholder="Votre réponse… (ou cliquez sur « Proposer une réponse » pour un brouillon IA)"
                      className="input mt-2 min-h-[110px] w-full resize-y bg-white text-sm leading-relaxed"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => suggest(m)}
                        disabled={suggesting}
                        className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
                      >
                        {suggesting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        {suggesting ? 'Rédaction…' : 'Proposer une réponse (IA)'}
                      </button>
                      <button
                        onClick={() => sendReply(m)}
                        disabled={sending || !draft.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
                      >
                        {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        {sending ? 'Envoi…' : 'Envoyer via contact@chap.ci'}
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                      L’email part de <b>contact@chap.ci</b> avec la signature « — L’équipe Chap.ci » ajoutée
                      automatiquement, et votre message d’origine cité en dessous. {m.email} pourra répondre
                      directement à contact@chap.ci : la suite se passe dans votre boîte mail.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                    Cette personne n’a pas laissé d’adresse email : réponse par email impossible.
                    Vous pouvez seulement marquer le message comme traité.
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.handled ? (
                    <button onClick={() => mark(m, false)} className="flex items-center gap-1 rounded-lg border border-[#E6DAC6] px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      <Undo2 size={13} /> Rouvrir
                    </button>
                  ) : (
                    <button onClick={() => mark(m, true)} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">
                      <CheckCircle2 size={13} /> Marquer traité
                    </button>
                  )}
                  <button onClick={() => remove(m)} className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
      {items.length === 0 && <Empty>Aucun message de contact.</Empty>}
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
            <span className="tnum text-sm font-bold text-gray-900">{formatFCFA(o.total)}</span>
          </div>
          <ul className="mt-2 space-y-0.5">
            {o.items.map((it, i) => (
              <li key={i} className="flex justify-between text-sm text-gray-700">
                <span className="min-w-0 truncate">{it.title}</span>
                <span className="shrink-0 pl-2 text-gray-500">{formatPrice(it.price)} F</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-[#EFE6D7] pt-2 text-xs text-gray-400">
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
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-[#EFE6D7] bg-white">
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

// ---------- Modérateurs ----------
function ModeratorsTab() {
  const [data, setData] = useState<Moderators | null>(null)
  const [err, setErr] = useState('')
  const [email, setEmail] = useState('')
  const [perms, setPerms] = useState<string[]>([])
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [issued, setIssued] = useState<{ email: string; code: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const load = () => { setData(null); setErr(''); fetchModerators().then(setData).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  const labelOf = (key: string) => data?.features.find((f) => f.key === key)?.label ?? key
  const toggle = (key: string) => setPerms((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]))
  const resetForm = () => { setEmail(''); setPerms([]); setCode('') }
  const edit = (m: { email: string; permissions: string[] }) => { setEmail(m.email); setPerms(m.permissions); setCode(''); setMsg(''); setIssued(null) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setMsg('Adresse email invalide.'); return }
    setBusy(true); setMsg(''); setIssued(null)
    try {
      const r = await saveModerator(value, perms, code.trim() || undefined)
      setData(await fetchModerators())
      if (r.code) setIssued({ email: value, code: r.code })
      setMsg(r.already ? '✓ Modérateur mis à jour.' : '✓ Modérateur créé.')
      resetForm()
    } catch (e) { setMsg((e as Error).message) }
    finally { setBusy(false) }
  }

  const remove = async (m: string) => {
    if (!confirm(`Retirer les droits de modérateur à ${m} ?`)) return
    try { await removeModerator(m); load() }
    catch (e) { alert((e as Error).message) }
  }
  const toggleBlock = async (m: { email: string; blocked: boolean }) => {
    if (!m.blocked && !confirm(`Bloquer l’accès de ${m.email} ? Il perdra l’accès immédiatement.`)) return
    try { await blockModerator(m.email, !m.blocked); load() }
    catch (e) { alert((e as Error).message) }
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!data) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary-50 p-3 text-sm text-primary-800">
        <p className="flex items-center gap-1.5 font-semibold"><ShieldCheck size={16} /> Rôles &amp; permissions</p>
        <p className="mt-1 text-primary-700">
          Tu crées chaque modérateur avec son <b>email</b>, les <b>fonctionnalités</b> que tu lui
          autorises, et un <b>code d’accès</b> personnel. Il déverrouille <b>une fois</b> et garde
          l’accès <b>jusqu’à ce que tu le bloques</b> (bouton <Ban size={12} className="inline" />).
          Un modérateur bloqué perd l’accès immédiatement. Le <b>propriétaire</b> garde tout.
        </p>
      </div>

      {/* Code d'accès généré, affiché une seule fois */}
      {issued && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">Code d’accès de {issued.email}</p>
          <p className="mt-0.5 text-xs text-amber-700">Transmets-le au modérateur. <b>Il ne sera plus affiché.</b></p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.3em] text-gray-800">{issued.code}</code>
            <button
              onClick={() => { navigator.clipboard?.writeText(issued.code); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
              className="shrink-0 rounded-lg border border-amber-200 bg-white p-2 text-gray-600"
              aria-label="Copier le code"
            >
              {copied ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Créer / mettre à jour un modérateur */}
      <form onSubmit={save} className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
        <p className="font-display text-sm font-bold text-gray-800">Créer / modifier un modérateur</p>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (msg) setMsg('') }}
          placeholder="email@du-moderateur.com"
          autoComplete="off"
          className="input"
          aria-label="Email du modérateur"
        />
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Fonctionnalités autorisées</p>
          <div className="grid grid-cols-2 gap-1.5">
            {data.features.map((f) => (
              <label key={f.key} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${perms.includes(f.key) ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-[#E6DAC6] text-gray-600'}`}>
                <input type="checkbox" checked={perms.includes(f.key)} onChange={() => toggle(f.key)} className="accent-primary-500" />
                {f.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="Code d’accès (laisser vide = généré)"
            maxLength={16}
            className="input font-mono tracking-widest"
            aria-label="Code d’accès du modérateur"
          />
          <p className="mt-1 text-[11px] text-gray-400">Laisse vide pour un code généré automatiquement, ou choisis-en un (min. 6 caractères).</p>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary flex-1 py-3 disabled:opacity-50">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> Enregistrer</>}
          </button>
          {email && <button type="button" onClick={resetForm} className="btn-outline px-4 py-3 text-sm">Annuler</button>}
        </div>
        {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{msg}</p>}
      </form>

      <div>
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Propriétaire</p>
        <div className="space-y-2">
          {data.owners.map((o) => (
            <div key={o} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Crown size={18} /></span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">{o}</span>
              <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">Tous droits</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Modérateurs ({data.moderators.length})
        </p>
        {data.moderators.length === 0 ? (
          <Empty>Aucun modérateur. Créez-en un ci-dessus.</Empty>
        ) : (
          <div className="space-y-2">
            {data.moderators.map((m) => (
              <div key={m.email} className="rounded-2xl bg-white p-3 shadow-card">
                <div className="flex items-center gap-2">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${m.blocked ? 'bg-red-100 text-red-500' : 'bg-primary-100 text-primary-600'}`}><ShieldCheck size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-gray-800">{m.email}</span>
                      {m.blocked && <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">Bloqué</span>}
                    </span>
                    <span className="text-xs text-gray-400">
                      ajouté {timeAgo(m.createdAt)}{m.hasCode ? '' : ' · sans code'}
                    </span>
                  </span>
                  <button onClick={() => toggleBlock(m)} aria-label={m.blocked ? 'Débloquer' : 'Bloquer'} title={m.blocked ? 'Débloquer l’accès' : 'Bloquer l’accès'} className={`shrink-0 rounded-xl p-2 transition ${m.blocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}>
                    {m.blocked ? <ShieldOk size={17} /> : <Ban size={17} />}
                  </button>
                  <button onClick={() => edit(m)} aria-label="Modifier" title="Modifier" className="shrink-0 rounded-xl p-2 text-primary-500 transition hover:bg-primary-50">
                    <Pencil size={17} />
                  </button>
                  <button onClick={() => remove(m.email)} aria-label="Retirer" className="shrink-0 rounded-xl p-2 text-red-500 transition hover:bg-red-50">
                    <Trash2 size={18} />
                  </button>
                </div>
                {m.permissions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1 pl-[52px]">
                    {m.permissions.map((p) => (
                      <span key={p} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{labelOf(p)}</span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 pl-[52px] text-[11px] text-gray-400">Aucune fonctionnalité cochée (accès « Aperçu » seulement).</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Campagnes (envoi promo aux abonnés) ----------
function CampaignsTab() {
  const [total, setTotal] = useState<number | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState('')

  useEffect(() => { campaignCount().then(setTotal).catch(() => setTotal(0)) }, [])

  const send = async () => {
    if (!subject.trim() || !message.trim()) { setResult('⚠️ Renseignez l’objet et le message.'); return }
    if (!confirm(`Envoyer cette campagne à ${total ?? 0} abonné(s) ?`)) return
    setSending(true); setProgress(0); setResult('')
    let offset = 0, sent = 0, grand = total ?? 0
    try {
      // Envoi par lots pour respecter les quotas de l'hébergeur.
      for (;;) {
        const prevOffset = offset
        const r = await campaignSend(subject.trim(), message.trim(), offset, 25)
        sent += r.sent; grand = r.total; offset = r.processed
        setProgress(grand ? Math.min(100, Math.round((offset / grand) * 100)) : 100)
        if (r.done) break
        // Garde anti-boucle infinie : si le curseur n'avance plus, on s'arrête.
        if (offset <= prevOffset) break
      }
      setResult(`✓ Campagne envoyée à ${sent} abonné${sent > 1 ? 's' : ''} ! 🎉`)
      setSubject(''); setMessage('')
    } catch (e) { setResult('⚠️ ' + (e as Error).message) }
    finally { setSending(false) }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary-50 p-3 text-sm text-primary-800">
        <p className="flex items-center gap-1.5 font-semibold"><Megaphone size={16} /> Campagne publicitaire</p>
        <p className="mt-1 text-primary-700">
          Écrivez une promo, elle part à vos <b>{total ?? '…'} abonné{(total ?? 0) > 1 ? 's' : ''}</b> depuis
          <b> hello@chap.ci</b>, avec votre logo. Envoi progressif pour respecter les limites de l’hébergeur.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Objet de l’email</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sending} className="input"
            placeholder="Ex : 🔥 Grande promo Tabaski — livraison offerte !" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} disabled={sending} rows={7} className="input resize-y"
            placeholder={"Bonjour,\n\nCette semaine sur Chap.ci : des centaines de bonnes affaires près de chez vous, et la livraison offerte sur les vélos et téléphones !\n\nProfitez-en vite."} />
          <p className="mt-1 text-xs text-gray-400">Astuce : sautez une ligne pour créer un nouveau paragraphe.</p>
        </div>
        <button onClick={send} disabled={sending || (total ?? 0) === 0} className="btn-primary w-full py-3 disabled:opacity-50">
          {sending ? <><Loader2 size={18} className="animate-spin" /> Envoi… {progress}%</> : <><Send size={18} /> Envoyer à {total ?? 0} abonné{(total ?? 0) > 1 ? 's' : ''}</>}
        </button>
        {sending && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-primary-500 transition-[width] duration-300 ease-smooth" style={{ width: `${progress}%` }} />
          </div>
        )}
        {result && <p className={`text-sm ${result.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{result}</p>}
      </div>

      <p className="px-1 text-xs text-gray-400">
        💡 Les abonnés peuvent répondre (ça arrive dans <b>hello@chap.ci</b>) et se désinscrire.
        Envoyez du contenu utile pour ne pas lasser.
      </p>

      <AutoOffers />
      <SmartAgents />
    </div>
  )
}

// ---------- Agents intelligents (suggestions personnalisées) ----------
function SmartAgents() {
  const [info, setInfo] = useState<{ cronKey: string; site: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => { digestInfo().then(setInfo).catch(() => {}) }, [])

  const test = async () => {
    setBusy(true); setMsg('')
    try {
      const r = await suggestionsTest()
      const picked = r.titles?.length ? ` — ${r.titles.slice(0, 3).join(', ')}${r.titles.length > 3 ? '…' : ''}` : ''
      if (r.listings === 0) {
        setMsg('ℹ️ Aucune annonce à suggérer pour l’instant (publiez d’autres annonces, puis réessayez).')
      } else if (r.personalized === false) {
        setMsg(`✓ Email d’aperçu envoyé (${r.listings} annonces récentes)${picked}. Astuce : vos propres annonces ne se recommandent pas ; c’est pourquoi c’est un aperçu. Les vrais abonnés recevront des suggestions personnalisées selon leur historique.`)
      } else {
        setMsg(`✓ Suggestions envoyées (${r.listings}) — catégorie « ${r.category || '—'} »${picked}. Les articles similaires (même sous-catégorie) sont priorisés.`)
      }
    } catch (e) { setMsg('⚠️ ' + (e as Error).message) }
    finally { setBusy(false) }
  }

  const cmd = info ? `curl -s "${info.site}/api/cron/suggestions?key=${info.cronKey}" >/dev/null 2>&1` : ''
  const copy = () => { navigator.clipboard?.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <div className="mt-2 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
      <p className="flex items-center gap-1.5 font-display text-sm font-bold text-gray-800">
        <ShieldCheck size={16} className="text-emerald-600" /> Agents intelligents (suggestions personnalisées)
      </p>
      <p className="text-sm text-gray-600">
        Un « agent » observe automatiquement chaque utilisateur (<b>favoris</b>, <b>recherches</b>,
        <b> catégories consultées</b>) et lui envoie par email des <b>suggestions d’articles qui
        l’intéressent</b>. À programmer <b>2 fois par semaine</b>.
      </p>

      <button onClick={test} disabled={busy} className="btn-outline py-2 text-sm disabled:opacity-50">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Tester sur mon compte
      </button>
      {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-gray-500'}`}>{msg}</p>}

      <div className="rounded-xl bg-white p-3">
        <p className="mb-1.5 text-xs font-semibold text-gray-500">
          Pour l’AUTOMATISER (cPanel → Tâches planifiées) — <b>lundi &amp; jeudi à 9h</b> :
          planning <code className="rounded bg-gray-100 px-1">0 9 * * 1,4</code>
        </p>
        <div className="mt-1 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-900 px-2 py-1.5 text-[11px] text-gray-100">{cmd}</code>
          <button onClick={copy} className="shrink-0 rounded-lg border border-[#E6DAC6] p-1.5 text-gray-600 hover:bg-gray-50">
            {copied ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Copy size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Offres automatiques (programmées, type OLX/eBay) ----------
function AutoOffers() {
  const [info, setInfo] = useState<{ cronKey: string; site: string } | null>(null)
  const [busy, setBusy] = useState<'' | 'daily' | 'weekly'>('')
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => { digestInfo().then(setInfo).catch(() => {}) }, [])

  const sendNow = async (type: 'daily' | 'weekly') => {
    setBusy(type); setMsg('')
    try {
      const r = await digestSend(type)
      setMsg(r.listings === 0
        ? '⚠️ Aucune annonce à envoyer pour l’instant (publiez des annonces d’abord).'
        : `✓ Offres envoyées à ${r.sent} abonné${r.sent > 1 ? 's' : ''} (${r.listings} annonces).`)
    } catch (e) { setMsg('⚠️ ' + (e as Error).message) }
    finally { setBusy('') }
  }

  const cmd = (type: string) =>
    info ? `curl -s "${info.site}/api/cron/digest?key=${info.cronKey}&type=${type}" >/dev/null 2>&1` : ''

  const copy = (type: string) => {
    navigator.clipboard?.writeText(cmd(type))
    setCopied(type)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="mt-2 space-y-3 rounded-2xl border border-primary-200 bg-primary-50/40 p-4">
      <p className="flex items-center gap-1.5 font-display text-sm font-bold text-gray-800">
        <CalendarClock size={16} className="text-primary-600" /> Offres automatiques (comme OLX / eBay)
      </p>
      <p className="text-sm text-gray-600">
        Un email « <b>bonnes affaires du jour</b> » / « <b>sélection de la semaine</b> » avec de vraies
        annonces (photo, prix, lien) envoyé <b>automatiquement</b> à tes abonnés. Teste-le, puis programme-le.
      </p>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => sendNow('daily')} disabled={!!busy} className="btn-outline py-2 text-sm disabled:opacity-50">
          {busy === 'daily' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Tester « du jour »
        </button>
        <button onClick={() => sendNow('weekly')} disabled={!!busy} className="btn-outline py-2 text-sm disabled:opacity-50">
          {busy === 'weekly' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Tester « de la semaine »
        </button>
      </div>
      {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{msg}</p>}

      <div className="rounded-xl bg-white p-3">
        <p className="mb-1.5 text-xs font-semibold text-gray-500">Pour l’AUTOMATISER (cPanel → Tâches planifiées / Cron Jobs) :</p>
        {[['daily', 'Chaque jour à 8h', '0 8 * * *'], ['weekly', 'Chaque lundi à 8h', '0 8 * * 1']].map(([type, when, sched]) => (
          <div key={type} className="mb-2">
            <p className="text-xs text-gray-500">{when} — planning <code className="rounded bg-gray-100 px-1">{sched}</code></p>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-900 px-2 py-1.5 text-[11px] text-gray-100">{cmd(type)}</code>
              <button onClick={() => copy(type)} className="shrink-0 rounded-lg border border-[#E6DAC6] p-1.5 text-gray-600 hover:bg-gray-50">
                {copied === type ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Colle la commande dans une nouvelle tâche planifiée cPanel avec le planning indiqué. Chaque déclenchement
        enverra automatiquement les offres à tes abonnés. 🎯
      </p>
    </div>
  )
}

// ---------- Emails (configuration SMTP + test) ----------
function EmailsTab() {
  const [cfg, setCfg] = useState<SmtpSettings | null>(null)
  const [err, setErr] = useState('')
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState('465')
  const [secure, setSecure] = useState('ssl')
  const [user, setUser] = useState('no-reply@chap.ci')
  const [pass, setPass] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState('')

  useEffect(() => {
    getSmtp().then((s) => {
      setCfg(s); setHost(s.host); setPort(s.port); setSecure(s.secure); setUser(s.user)
    }).catch((e) => setErr((e as Error).message))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setSaveMsg('')
    try {
      await saveSmtp({ host, port, secure, user, pass })
      setPass('')
      setCfg((c) => (c ? { ...c, host, port, secure, user, configured: true } : c))
      setSaveMsg('✓ Réglages enregistrés. Cliquez « Envoyer un email de test » pour vérifier.')
    } catch (e) { setSaveMsg((e as Error).message) }
    finally { setSaving(false) }
  }

  const test = async () => {
    setTesting(true); setTestMsg('')
    try {
      const r = await sendTestEmail()
      setTestMsg(r.sent
        ? `✓ Email de test envoyé à ${r.to} (via ${r.via}). Vérifiez votre boîte — pensez aux spams.`
        : `⚠️ L’envoi a échoué (via ${r.via}). Vérifiez le mot de passe et le serveur SMTP ci-dessus.`)
    } catch (e) { setTestMsg((e as Error).message) }
    finally { setTesting(false) }
  }

  if (err) return <Center><p className="text-sm text-red-600">⚠️ {err}</p></Center>

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary-50 p-3 text-sm text-primary-800">
        <p className="flex items-center gap-1.5 font-semibold"><MailCheck size={16} /> Envoi des emails</p>
        <p className="mt-1 text-primary-700">
          Pour que vos emails (bienvenue, modérateurs…) arrivent de façon <b>fiable</b>, renseignez le mot
          de passe de votre boîte <b>no-reply@chap.ci</b>. L’application enverra alors les emails par SMTP.
        </p>
      </div>

      {cfg && (
        <p className={`text-sm font-medium ${cfg.configured ? 'text-emerald-600' : 'text-gray-500'}`}>
          {cfg.configured
            ? <><CheckCircle2 size={15} className="mr-1 inline" /> SMTP configuré et actif.</>
            : 'SMTP non configuré — les emails utilisent mail() (moins fiable).'}
        </p>
      )}

      <form onSubmit={save} className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Boîte email (utilisateur SMTP)</label>
          <input value={user} onChange={(e) => setUser(e.target.value)} className="input" autoComplete="off" placeholder="no-reply@chap.ci" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Mot de passe de cette boîte</label>
          <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" className="input" autoComplete="new-password"
            placeholder={cfg?.configured ? '•••••••• (laisser vide pour ne pas changer)' : 'Mot de passe de no-reply@chap.ci'} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-gray-500">Serveur SMTP</label>
            <input value={host} onChange={(e) => setHost(e.target.value)} className="input" placeholder="localhost" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Port</label>
            <input value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric" className="input" placeholder="465" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Sécurité</label>
          <select value={secure} onChange={(e) => setSecure(e.target.value)} className="input">
            <option value="ssl">SSL (port 465)</option>
            <option value="tls">TLS / STARTTLS (port 587)</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full py-3 disabled:opacity-50">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Enregistrer</>}
        </button>
        {saveMsg && <p className={`text-sm ${saveMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{saveMsg}</p>}
      </form>

      <div className="rounded-2xl border border-[#E6DAC6] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">Vérifier l’envoi&nbsp;:</p>
          <button onClick={test} disabled={testing} className="btn-outline shrink-0 py-2 text-sm disabled:opacity-50">
            {testing ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Envoyer un email de test</>}
          </button>
        </div>
        {testMsg && <p className={`mt-2 text-sm ${testMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{testMsg}</p>}
        <p className="mt-2 text-xs text-gray-400">
          Astuce : si <b>localhost</b> ne marche pas, essayez <b>mail.chap.ci</b>. Port 465 = SSL, port 587 = TLS.
        </p>
      </div>
    </div>
  )
}

// ---------- Tâches automatiques (clé cron + URLs prêtes à copier) ----------
// Registre des tâches planifiées du serveur. Chaque entrée génère une URL cron
// prête à copier, avec la clé RÉELLEMENT active (récupérée via digestInfo).
const CRON_JOBS: { id: string; label: string; desc: string; query?: string; schedule: string; cronExpr: string }[] = [
  { id: 'security',       label: 'Surveillance sécurité',       desc: 'Compte les tentatives de connexion suspectes et repère les IP à surveiller.', query: '?days=1',  schedule: 'Chaque jour à 8h',    cronExpr: '0 8 * * *' },
  { id: 'cleanup',        label: 'Ménage / maintenance',        desc: 'Purge les vieilles données et masque les annonces de plus de 90 jours.',                        schedule: 'Chaque jour à 4h',    cronExpr: '0 4 * * *' },
  { id: 'backup',         label: 'Sauvegarde de la base',       desc: 'Sauvegarde complète (7 dernières conservées) + email récapitulatif.',                          schedule: 'Chaque jour à 3h',    cronExpr: '0 3 * * *' },
  { id: 'digest',         label: 'Résumé du jour',              desc: 'Envoie aux abonnés les nouvelles annonces du jour.',                          query: '?type=daily', schedule: 'Chaque jour à 18h',   cronExpr: '0 18 * * *' },
  { id: 'suggestions',    label: 'Suggestions personnalisées',  desc: 'Recommande à chaque utilisateur des annonces selon ses centres d’intérêt.',                     schedule: 'Lundi & jeudi à 9h',  cronExpr: '0 9 * * 1,4' },
  { id: 'alerts',         label: 'Alertes recherches',          desc: 'Prévient quand une annonce correspond à une recherche sauvegardée.',                            schedule: 'Toutes les 2 heures', cronExpr: '0 */2 * * *' },
  { id: 'review-invites', label: 'Invitations à noter',         desc: 'Invite l’acheteur à laisser un avis après une vente confirmée par le vendeur.',                 schedule: 'Chaque jour à 10h',   cronExpr: '0 10 * * *' },
  { id: 'stats',          label: 'Statistiques hebdo',          desc: 'Agrégats anonymes d’activité (pour le rapport hebdomadaire).', query: '?days=7',                schedule: 'Lundi à 7h',          cronExpr: '0 7 * * 1' },
  { id: 'report',         label: 'Rapport mensuel',             desc: 'Envoie à contact@chap.ci un récap activité + sécurité + santé de la base.',   query: '?days=30',  schedule: 'Le 1er du mois à 7h', cronExpr: '0 7 1 * *' },
]

function AutomationTab() {
  const [info, setInfo] = useState<{ cronKey: string; site: string } | null>(null)
  const [err, setErr] = useState('')
  const [reveal, setReveal] = useState(false)
  const [copied, setCopied] = useState('')

  const load = () => { setErr(''); digestInfo().then(setInfo).catch((e) => setErr((e as Error).message)) }
  useEffect(() => { load() }, [])

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(id); setTimeout(() => setCopied(''), 1500)
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!info) return <Center><Loader2 className="animate-spin" size={20} /></Center>

  const key = info.cronKey
  const masked = key ? `${key.slice(0, 4)}${'•'.repeat(Math.max(8, key.length - 8))}${key.slice(-4)}` : '(aucune)'
  const urlFor = (j: typeof CRON_JOBS[number]) => `${info.site}/api/cron/${j.id}${j.query ? `${j.query}&` : '?'}key=${key}`

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="rounded-2xl bg-primary-50 p-3 text-sm text-primary-800">
        <p className="flex items-center gap-1.5 font-semibold"><KeyRound size={16} /> Clé des tâches automatiques</p>
        <p className="mt-1 text-primary-700">
          Toutes les tâches planifiées (sécurité, ménage, sauvegarde, emails…) <b>et les routines
          claude.ai</b> utilisent cette <b>même clé</b>. Si tu la changes un jour, reviens ici : c’est la
          <b> seule source</b> à recopier partout. Un <b>403 « Clé invalide »</b> = la clé utilisée
          ailleurs ne correspond plus à celle-ci.
        </p>
      </div>

      {/* La clé active */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="mb-2 font-display text-sm font-bold text-gray-800">Ta clé active</p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-900 px-3 py-2 text-[13px] text-gray-100">
            {reveal ? (key || '(aucune)') : masked}
          </code>
          <button onClick={() => setReveal((v) => !v)} className="shrink-0 rounded-lg border border-[#E6DAC6] p-2 text-gray-600 hover:bg-gray-50" aria-label={reveal ? 'Masquer la clé' : 'Afficher la clé'}>
            {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button onClick={() => copy('key', key)} disabled={!key} className="shrink-0 rounded-lg border border-[#E6DAC6] p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40" aria-label="Copier la clé">
            {copied === 'key' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          <b>Pour une routine claude.ai</b> : copie cette clé, puis dans le prompt de la routine remplace
          ce qu’il y a après <code className="rounded bg-gray-100 px-1">key=</code>. Ne la partage jamais publiquement.
        </p>
      </div>

      {/* Les URLs cron prêtes à copier */}
      <div className="space-y-2.5">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">URLs prêtes à copier</p>
        {CRON_JOBS.map((j) => (
          <div key={j.id} className="rounded-2xl bg-white p-3.5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-gray-800">{j.label}</p>
                <p className="mt-0.5 text-xs text-gray-600">{j.desc}</p>
              </div>
              <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">{j.schedule}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-900 px-2 py-1.5 text-[11px] text-gray-100">{urlFor(j)}</code>
              <button onClick={() => copy(j.id, urlFor(j))} className="shrink-0 rounded-lg border border-[#E6DAC6] p-1.5 text-gray-600 hover:bg-gray-50" aria-label="Copier l’URL">
                {copied === j.id ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Copy size={15} />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              cPanel → Tâches planifiées — <code className="rounded bg-gray-100 px-1">{j.cronExpr}</code>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Sauvegarde de la base (export + cron automatique) ----------
function BackupTab() {
  const [info, setInfo] = useState<{ cronKey: string; site: string; backups: BackupFile[] } | null>(null)
  const [err, setErr] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = () => listBackups().then(setInfo).catch((e) => setErr((e as Error).message))
  useEffect(() => { load() }, [])

  const downloadNow = async () => {
    setDownloading(true)
    try { await downloadBackup() } catch (e) { setErr((e as Error).message) }
    finally { setDownloading(false) }
  }

  const cmd = info ? `curl -s "${info.site}/api/cron/backup?key=${info.cronKey}" >/dev/null 2>&1` : ''
  const copy = () => {
    navigator.clipboard?.writeText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const humanSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(b / 1024))} Ko`)

  if (err) return <ErrRetry msg={err} onRetry={() => { setErr(''); load() }} />

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary-50 p-3 text-sm text-primary-800">
        <p className="flex items-center gap-1.5 font-semibold"><Database size={16} /> Sauvegarde de la base</p>
        <p className="mt-1 text-primary-700">
          Exportez toute la base (comptes, annonces, messages, commandes, avis…) dans un fichier
          <b> JSON</b>. Téléchargez-le quand vous voulez, ou <b>automatisez</b> une sauvegarde quotidienne.
        </p>
      </div>

      {/* Téléchargement immédiat */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="mb-1 font-display text-sm font-bold text-gray-800">Télécharger maintenant</p>
        <p className="mb-3 text-sm text-gray-600">
          Génère et télécharge un export complet de la base à cet instant. Conservez ce fichier en lieu sûr.
        </p>
        <button onClick={downloadNow} disabled={downloading} className="btn-primary py-2.5 text-sm disabled:opacity-50">
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Télécharger la sauvegarde
        </button>
      </div>

      {/* Automatisation via cron */}
      <div className="space-y-3 rounded-2xl border border-primary-200 bg-primary-50/40 p-4">
        <p className="flex items-center gap-1.5 font-display text-sm font-bold text-gray-800">
          <CalendarClock size={16} className="text-primary-600" /> Sauvegarde automatique (quotidienne)
        </p>
        <p className="text-sm text-gray-600">
          Programme une sauvegarde chaque nuit sur le serveur. Les <b>7 dernières</b> sont conservées et
          vous recevez un email récapitulatif à chaque fois.
        </p>
        <div className="rounded-xl bg-white p-3">
          <p className="mb-1.5 text-xs font-semibold text-gray-500">cPanel → Tâches planifiées / Cron Jobs :</p>
          <p className="text-xs text-gray-500">Chaque jour à 3h — planning <code className="rounded bg-gray-100 px-1">0 3 * * *</code></p>
          <div className="mt-1 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-900 px-2 py-1.5 text-[11px] text-gray-100">{cmd}</code>
            <button onClick={copy} className="shrink-0 rounded-lg border border-[#E6DAC6] p-1.5 text-gray-600 hover:bg-gray-50">
              {copied ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Sauvegardes présentes sur le serveur */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-sm font-bold text-gray-800">Sauvegardes sur le serveur</p>
          <button onClick={load} className="text-xs font-semibold text-primary-600"><RefreshCw size={13} className="mr-1 inline" />Actualiser</button>
        </div>
        {!info ? (
          <p className="py-3 text-sm text-gray-400">Chargement…</p>
        ) : info.backups.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
            Aucune sauvegarde automatique pour l’instant. Programmez le cron ci-dessus.
          </p>
        ) : (
          <ul className="space-y-2">
            {info.backups.map((b) => (
              <li key={b.file} className="flex items-center gap-2 rounded-xl border border-[#EFE6D7] p-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600"><Database size={16} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-800">{b.file}</span>
                  <span className="block text-xs text-gray-500">{humanSize(b.bytes)} · {timeAgo(b.at)}</span>
                </span>
                <button
                  onClick={() => downloadBackup(b.file).catch((e) => setErr((e as Error).message))}
                  className="shrink-0 rounded-lg border border-[#E6DAC6] p-2 text-gray-600 hover:bg-gray-50"
                  aria-label="Télécharger"
                >
                  <Download size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Zone de danger : réinitialisation des données de test */}
      <ResetDataBox onDone={load} />
    </div>
  )
}

// ---------- Réinitialisation (repartir à zéro) ----------
function ResetDataBox({ onDone }: { onDone: () => void }) {
  const [accounts, setAccounts] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const run = async () => {
    if (confirm !== 'EFFACER') return
    if (!window.confirm('Dernière confirmation : effacer définitivement les données de test ? Une sauvegarde de sécurité sera créée avant.')) return
    setBusy(true); setMsg('')
    try {
      const r = await resetData(accounts)
      const total = Object.values(r.deleted).reduce((s, n) => s + n, 0)
      setMsg(`✓ ${total} enregistrement${total > 1 ? 's' : ''} effacé${total > 1 ? 's' : ''}. Sauvegarde de sécurité : ${r.backup ?? '—'}.`)
      setConfirm('')
      onDone()
    } catch (e) { setMsg('⚠️ ' + (e as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <div className="mt-2 space-y-3 rounded-2xl border border-red-200 bg-red-50/50 p-4">
      <p className="flex items-center gap-1.5 font-display text-sm font-bold text-red-700">
        <AlertTriangle size={16} /> Zone de danger — repartir à zéro
      </p>
      <p className="text-sm text-gray-600">
        Efface les <b>annonces, conversations, messages, commandes, avis, signalements, alertes et
        statistiques de visites</b> pour lancer le site avec des données réelles. Une <b>sauvegarde de
        sécurité</b> est créée automatiquement avant la suppression.
      </p>
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={accounts} onChange={(e) => setAccounts(e.target.checked)} className="mt-0.5" />
        <span>Effacer aussi les <b>comptes de test</b> et abonnés (garde votre compte administrateur).</span>
      </label>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500">Tapez <b>EFFACER</b> pour confirmer</label>
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="EFFACER"
          className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-400" />
      </div>
      <button onClick={run} disabled={busy || confirm !== 'EFFACER'}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Réinitialiser les données
      </button>
      {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{msg}</p>}
    </div>
  )
}

// ---------- petits composants ----------
function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#FFF6EA] pb-16">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-[#EFE6D7] bg-white/90 backdrop-blur-md px-3 py-3">
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
