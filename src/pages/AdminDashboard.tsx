import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, Star, Mail,
  Loader2, Lock, Download, Trash2, TrendingUp, RefreshCw,
  Flag, Ban, ShieldOff, ShieldCheck as ShieldOk, Eye, EyeOff, ChevronRight, UserX, AlertTriangle, X,
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
  modTokens, createModToken, revokeModToken, modAudit, type ServiceToken, type ModAuditEntry,
  adminUnlock, adminUnlockEmail, adminLock,
  type AdminStats, type AdminUser, type AdminListing, type AdminOrder, type Moderators, type SmtpSettings,
  type AdminUserDetail, type Report, type UserStatus, type AdminConversation, type AdminReview,
  type VisitStats, type VisitRange, type ResponseTime, type BackupFile, type ContactMessage,
} from '../lib/admin'
import { fetchNewsletter, type Subscriber } from '../lib/newsletter'
import {
  fetchAdminAds, adminAdAction, adminAdDelete, adminAdBroadcast,
  fetchSeoState, setSeoEnabled, runSeoNow,
  AD_GAP_DEFAULT, type AdminAd, type AdStyle, type SeoState,
} from '../lib/ads'
import { AnimatedAdText } from '../components/AnimatedAdText'
import { AdImageFill } from '../components/AdImageFill'
import { AdTextControls } from '../components/AdTextControls'
import { downscaleListingImage } from '../lib/image'
import { ShieldCheck, UserPlus, Crown, MailCheck, Send, Save, CheckCircle2, Megaphone, CalendarClock, Copy, Database, KeyRound, Pencil, Inbox, Undo2, Sparkles, ChevronDown } from 'lucide-react'

type Tab = 'overview' | 'listings' | 'users' | 'orders' | 'newsletter' | 'moderators' | 'emails' | 'campaigns' | 'reports' | 'contact' | 'ads' | 'conversations' | 'reviews' | 'visitors' | 'backup' | 'automation'

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
          <div className="mx-auto flex max-w-sm flex-col items-center rounded-3xl border border-line bg-white px-6 py-10 text-center shadow-card">
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
    <div className="min-h-screen bg-cream-200 pb-16">
      <header className="safe-top sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5 px-3 py-3">
          <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1"><ArrowLeft size={22} /></button>
          <h1 className="font-display text-lg font-bold">Administration</h1>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${role.owner ? 'bg-ink' : 'bg-ivoire-green'}`}>
            {role.owner ? 'Propriétaire' : 'Modérateur'}
          </span>
          <button
            onClick={() => { adminLock(); setReload((n) => n + 1) }}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-ivoire-green/10 px-3.5 py-1.5 text-xs font-bold text-ivoire-green-dark transition hover:bg-ivoire-green/15 active:scale-95"
            title="Cliquer pour verrouiller le tableau de bord"
          >
            🔓 {role.owner ? 'Déverrouillé' : 'Accès permanent'}
          </button>
        </div>
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-2 pb-2">
          {([['overview','Aperçu'],['visitors','Visiteurs'],['listings','Annonces'],['users','Utilisateurs'],['reports','Signalements'],['contact','Contact'],['ads','Publicités'],['orders','Commandes'],['conversations','Conversations'],['reviews','Avis'],['newsletter','Abonnés'],['campaigns','Campagnes'],['moderators','Modérateurs'],['emails','Emails'],['backup','Sauvegarde'],['automation','Tâches auto']] as [Tab,string][]).filter(([id]) => canSee(id)).map(([id,label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${tab === id ? 'border border-primary-500 bg-primary-500 text-white shadow-sm' : 'border border-line2 bg-white text-gray-600 hover:bg-cream-100'}`}
            >
              {label}
              {id === 'reports' && !!stats?.reportsOpen && (
                <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{stats.reportsOpen}</span>
              )}
              {id === 'contact' && !!stats?.contactOpen && (
                <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">{stats.contactOpen}</span>
              )}
              {id === 'ads' && !!stats?.adsPending && (
                <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">{stats.adsPending}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5 md:max-w-[1280px] md:px-6">
        {tab === 'overview' && stats && (
          <Overview stats={stats} onGo={setTab} canSee={canSee} owner={role.owner} email={user?.email ?? ''} />
        )}
        {tab === 'visitors' && <VisitorsTab />}
        {tab === 'listings' && <ListingsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'reports' && <ReportsTab onChanged={refreshStats} />}
        {tab === 'contact' && <ContactTab onChanged={refreshStats} />}
        {tab === 'ads' && <AdsTab onChanged={refreshStats} />}
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
  // Minuteur « Expire dans 0:47 » : lancé à l'envoi du code (durée de vie 60 s).
  const [left, setLeft] = useState<number | null>(null)
  const hiddenRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (left === null || left <= 0) return
    const t = setInterval(() => setLeft((v) => (v === null ? null : v - 1)), 1000)
    return () => clearInterval(t)
  }, [left !== null && left > 0])

  async function doUnlock(value: string) {
    setErr(''); setInfo('')
    if (!value.trim()) return setErr('Entrez le code d’accès.')
    setBusy(true)
    try { await adminUnlock(value.trim().toUpperCase()); onUnlocked() }
    catch (e) {
      setErr((e as Error).message)
      if (owner) { setCode(''); hiddenRef.current?.focus() }
    } finally { setBusy(false) }
  }
  function submit(e: React.FormEvent) { e.preventDefault(); doUnlock(code) }

  function onDigits(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    setErr('')
    // 6ᵉ chiffre saisi → tentative automatique (le bouton reste disponible).
    if (digits.length === 6 && !busy) doUnlock(digits)
  }

  async function sendEmail() {
    setErr(''); setInfo(''); setBusy(true)
    try {
      const r = await adminUnlockEmail()
      if (r.sent > 0) {
        setInfo('Code envoyé par email.')
        setCode(''); setLeft(60); hiddenRef.current?.focus()
      } else {
        setInfo('Envoi impossible (email non configuré ?).')
      }
    } catch (e) { setErr((e as Error).message) }
    finally { setBusy(false) }
  }

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const focusIdx = Math.min(code.length, 5)

  return (
    // Écran « serrure » de l'artifact : halo orange en haut, contenu centré.
    <div className="flex min-h-[74vh] flex-col items-center justify-center bg-[radial-gradient(520px_250px_at_50%_4%,#FFF6EC,transparent_72%)] px-6 py-9 text-center">
      <div className="grid h-[62px] w-[62px] place-items-center rounded-full border border-primary-100 bg-[#FFF6EC] text-[27px]" aria-hidden>
        🔒
      </div>
      <h1 className="mt-3 font-display text-[21px] font-extrabold text-ink">Tableau de bord verrouillé</h1>
      <p className="mt-1 max-w-[36ch] text-[13.5px] leading-relaxed text-gray-600">
        {owner
          ? 'Recevez un code d’accès par email, puis saisissez-le ici. Il expire dans 1 minute.'
          : 'Entrez le code d’accès fourni par l’administrateur principal.'}
      </p>

      <form onSubmit={submit} className="mt-4 flex w-full max-w-xs flex-col items-center">
        {owner ? (
          /* Code à 6 chiffres — cases séparées de l'artifact. La saisie passe par
             un champ invisible (clavier numérique mobile, collage possible). */
          <div
            className="relative cursor-text"
            onClick={() => hiddenRef.current?.focus()}
          >
            <input
              ref={hiddenRef}
              value={code}
              onChange={(e) => onDigits(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              aria-label="Code d’accès à 6 chiffres"
              className="absolute inset-0 h-full w-full opacity-0"
            />
            <div className="flex justify-center gap-2" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <i
                  key={i}
                  className={`grid h-[50px] w-10 place-items-center rounded-xl border-[1.5px] bg-white font-display text-[23px] font-extrabold not-italic text-ink ${
                    i === focusIdx && code.length < 6
                      ? 'border-primary-500 shadow-[0_0_0_3px_#FFF6EC]'
                      : 'border-line2'
                  }`}
                >
                  {code[i] ?? ''}
                </i>
              ))}
            </div>
          </div>
        ) : (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="Code d’accès personnel"
            maxLength={16}
            autoFocus
            className="input text-center font-mono text-lg tracking-[0.3em]"
          />
        )}

        {owner && left !== null && (
          <p className="mt-2.5 text-xs text-gray-400">
            {left > 0 ? (
              <>Expire dans <b className="tnum font-bold text-primary-700">{mmss(left)}</b></>
            ) : (
              <span className="font-semibold text-red-500">Code expiré — recevez-en un nouveau.</span>
            )}
          </p>
        )}

        {err && <p className="mt-3 w-full rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{err}</p>}
        {info && <p className="mt-3 w-full rounded-xl bg-ivoire-green/10 px-4 py-3 text-sm font-medium text-ivoire-green-dark">{info}</p>}

        <button type="submit" disabled={busy} className="btn-primary mt-4 w-full py-3.5 text-base">
          {busy ? <Loader2 size={20} className="animate-spin" /> : 'Déverrouiller'}
        </button>
        {owner ? (
          <button type="button" onClick={sendEmail} disabled={busy} className="btn-outline mt-2.5 w-full py-2.5 text-sm">
            <Mail size={16} /> Recevoir un code par email
          </button>
        ) : (
          <p className="mt-3.5 text-[11px] leading-relaxed text-gray-400">
            Vous n’avez pas le code ? Demandez-le à l’administrateur principal du site.
          </p>
        )}
      </form>
    </div>
  )
}

// ---------- Aperçu ----------
// Libellés FR des permissions (note de bienvenue du modérateur).
const PERM_LABELS: Record<string, string> = {
  visitors: 'Visiteurs', listings: 'Annonces', users: 'Utilisateurs', reports: 'Signalements',
  contact: 'Messages de contact', orders: 'Commandes', conversations: 'Conversations',
  reviews: 'Avis', newsletter: 'Abonnés', campaigns: 'Campagnes',
}

function Overview({ stats, onGo, canSee, owner, email }: {
  stats: AdminStats
  onGo: (t: Tab) => void
  canSee: (t: Tab) => boolean
  owner: boolean
  email: string
}) {
  // « Bonjour Fatou » : prénom déduit de l'email (fatou.moderation@… → Fatou).
  const firstName = (email.split('@')[0] || '').split(/[._-]/)[0]
  const greet = firstName ? firstName[0].toUpperCase() + firstName.slice(1) : ''
  const allowed = Object.keys(PERM_LABELS).filter((k) => canSee(k as Tab)).map((k) => PERM_LABELS[k])
  // 4 grandes cartes de l'artifact : emoji sur tuile teintée, gros chiffre,
  // libellé + tendance 7 jours (▲ vert) — Signalements en alerte rouge.
  const cards: { e: string; tint: string; label: string; value: number; tab: Tab; trend?: string | null; alert?: boolean }[] = [
    { e: '👥', tint: 'bg-sky-100', label: 'Utilisateurs', value: stats.users, tab: 'users', trend: stats.periods && stats.periods.users.week > 0 ? `${formatPrice(stats.periods.users.week)} (7 j)` : null },
    { e: '📦', tint: 'bg-ivoire-green/15', label: 'Annonces', value: stats.listings, tab: 'listings', trend: stats.periods && stats.periods.listings.week > 0 ? `${formatPrice(stats.periods.listings.week)} (7 j)` : null },
    { e: '🤝', tint: 'bg-amber-100', label: 'Commandes', value: stats.orders, tab: 'orders' },
    { e: '🚩', tint: 'bg-red-100', label: 'Signalements', value: stats.reportsOpen ?? 0, tab: 'reports', alert: (stats.reportsOpen ?? 0) > 0 },
  ]
  // Un modérateur ne voit que les cartes des sections qu'il peut ouvrir.
  const visible = cards.filter((c) => canSee(c.tab))

  // Nouvelles inscriptions : 7 derniers jours de la série — le jour le plus
  // fort est en vert, comme la maquette.
  const week = (stats.series ?? []).slice(-7).map((d) => ({
    ...d,
    letter: 'DLMMJVS'[new Date(d.date + 'T00:00:00Z').getUTCDay()],
  }))
  const maxUsers = Math.max(1, ...week.map((d) => d.users))
  const weekTotal = week.reduce((s, d) => s + d.users, 0)

  const sec = stats.security
  const statusPill = (s?: string): [string, string] =>
    s === 'blocked'
      ? ['BLOQUÉ', 'bg-red-50 text-red-600']
      : s === 'restricted'
        ? ['RESTREINT', 'bg-amber-50 text-amber-700']
        : ['ACTIF', 'bg-ivoire-green/10 text-ivoire-green-dark']

  // Largeur des cartes adaptée au nombre visible (modérateur : pleine largeur).
  const colsCls = visible.length >= 4 ? 'lg:grid-cols-4' : visible.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'

  return (
    <div className="space-y-3">
      {/* Vue modérateur : note de bienvenue personnalisée (artifact) */}
      {!owner && (
        <div className="rounded-r-xl border-l-[3px] border-primary-500 bg-[#FFF6EC] px-3.5 py-3 text-[13px] leading-relaxed text-gray-700">
          👋 Bonjour{greet ? ` ${greet}` : ''}. Vous voyez <b>uniquement</b> les fonctions autorisées
          par l’administrateur{allowed.length > 0 ? <> : {allowed.map((l, i) => <span key={l}>{i > 0 && ', '}<b>{l}</b></span>)}</> : null}.
          Le reste (utilisateurs, sauvegarde, clé cron…) reste réservé au propriétaire.
        </div>
      )}

      {/* Cartes principales */}
      <div className={`grid grid-cols-2 gap-3 ${colsCls}`}>
        {visible.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onGo(c.tab)}
            className={`rounded-2xl bg-white p-4 text-left shadow-card transition hover:shadow-md active:scale-[0.98] ${c.alert ? 'ring-1 ring-red-300' : ''}`}
          >
            <span className={`grid h-11 w-11 place-items-center rounded-xl text-[20px] ${c.tint}`} aria-hidden>{c.e}</span>
            <p className="mt-3 font-display text-[26px] font-extrabold leading-none text-ink md:text-[28px]">{formatPrice(c.value)}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[13px] text-gray-500">
              {c.label}
              {c.alert ? (
                <span className="font-bold text-red-500">à traiter</span>
              ) : c.trend ? (
                <span className="font-bold text-ivoire-green">▲ {c.trend}</span>
              ) : null}
            </p>
          </button>
        ))}
      </div>

      {/* Graphique en barres + carte Sécurité — propriétaire uniquement (artifact) */}
      {owner && (
      <div className={`grid gap-3 ${sec ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <p className="font-display text-base font-bold text-ink">Nouvelles inscriptions</p>
          <p className="text-xs text-gray-400">7 derniers jours{weekTotal > 0 ? ` · ${weekTotal} au total` : ''}</p>
          <div className="mt-4 flex h-36 items-end justify-around gap-2 md:h-44">
            {week.map((d) => {
              const top = d.users === maxUsers && d.users > 0
              return (
                <div key={d.date} className="flex h-full w-full max-w-[52px] flex-col items-center justify-end gap-1.5">
                  <div
                    title={`${d.users} inscription${d.users > 1 ? 's' : ''}`}
                    className={`w-full rounded-t-md ${top ? 'bg-gradient-to-b from-ivoire-green to-ivoire-green-dark' : 'bg-gradient-to-b from-primary-500 to-primary-700'}`}
                    style={{ height: `${Math.max(4, (d.users / maxUsers) * 100)}%` }}
                  />
                  <span className="text-[11px] font-semibold text-gray-400">{d.letter}</span>
                </div>
              )
            })}
          </div>
          {weekTotal === 0 && (
            <p className="mt-2 text-center text-xs text-gray-400">Aucune inscription sur les 7 derniers jours.</p>
          )}
        </div>

        {/* Sécurité — fournie par le serveur au propriétaire uniquement */}
        {sec && (
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <p className="font-display text-base font-bold text-ink">Sécurité</p>
            <p className="text-xs text-gray-400">7 derniers jours</p>
            <dl className="mt-2 divide-y divide-[#F3EADB] text-sm">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-700">Intégrité admins</dt>
                <dd className={sec.adminsIntegrity === false ? 'font-bold text-red-600' : sec.adminsIntegrity ? 'font-bold text-ivoire-green' : 'text-gray-400'}>
                  {sec.adminsIntegrity === false ? '⚠ altérée' : sec.adminsIntegrity ? '✓ ok' : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-700">Connexions échouées</dt>
                <dd className="tnum font-semibold text-gray-800">{sec.failedLogins}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-700">2FA propriétaire</dt>
                <dd className={sec.owner2fa ? 'font-bold text-ivoire-green' : 'font-bold text-amber-600'}>
                  {sec.owner2fa ? '✓ active' : 'inactive'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-700">Alertes email</dt>
                <dd className={sec.alerts > 0 ? 'tnum font-bold text-red-600' : 'text-gray-400'}>
                  {sec.alerts > 0 ? sec.alerts : 'aucune'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
      )}

      {/* Vues de pages — graphique intelligent (permission « Visiteurs ») */}
      {canSee('visitors') && <PageViewsCard />}

      {/* Vue modérateur : signalements ouverts à traiter (artifact) */}
      {!owner && canSee('reports') && <ModoReportsPanel onGo={onGo} />}

      {/* Derniers utilisateurs — tableau de l'artifact (permission « Utilisateurs ») */}
      {canSee('users') && (
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <p className="px-4 pb-2 pt-4 font-display text-base font-bold text-ink">Derniers utilisateurs</p>
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 bg-[#FBF4E9] px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider text-gray-400 sm:grid-cols-[1fr_88px_150px]">
          <span>Utilisateur</span>
          <span className="hidden sm:block">Inscrit</span>
          <span className="text-right sm:text-left">Statut</span>
        </div>
        {stats.recentUsers.length === 0 ? (
          <Empty>Aucun utilisateur.</Empty>
        ) : (
          <ul className="divide-y divide-[#F3EADB]">
            {stats.recentUsers.map((ru) => {
              const [pillLabel, pillCls] = statusPill(ru.status)
              return (
                <li key={ru.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 px-4 py-2.5 sm:grid-cols-[1fr_88px_150px]">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={ru.fullName} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-800">{ru.fullName}</span>
                      <span className="block truncate text-xs text-gray-400">{ru.email}</span>
                    </span>
                  </span>
                  <span className="tnum hidden text-xs text-gray-500 sm:block">
                    {new Date(ru.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="flex items-center justify-end gap-1.5 sm:justify-between">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${pillCls}`}>{pillLabel}</span>
                    <button
                      type="button"
                      onClick={() => onGo('users')}
                      className="hidden rounded-lg border border-line2 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 sm:block"
                    >
                      Voir
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      )}
    </div>
  )
}

// Vue modérateur : panneau « Signalements à traiter » (les ouverts, 5 max).
function ModoReportsPanel({ onGo }: { onGo: (t: Tab) => void }) {
  const [items, setItems] = useState<Report[] | null>(null)
  useEffect(() => {
    let alive = true
    fetchReports()
      .then((r: Report[]) => { if (alive) setItems(r.filter((x) => x.status === 'open').slice(0, 5)) })
      .catch(() => { if (alive) setItems([]) })
    return () => { alive = false }
  }, [])
  if (!items || items.length === 0) return null
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-card">
      <p className="font-display text-base font-bold text-ink">Signalements à traiter</p>
      <div className="divide-y divide-[#F3EADB]">
        {items.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onGo('reports')}
            className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-cream-100/60"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-[18px]" aria-hidden>🚩</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-gray-800">{r.listingTitle}</span>
              <span className="block truncate text-xs text-gray-400">{r.reason}{r.details ? ` · ${r.details}` : ''}</span>
            </span>
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
              À voir
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Carte « Vues de pages » de l'aperçu — graphique intelligent :
// fenêtre 7 / 14 / 30 jours, barres lisibles (pic en vert) sur 7-14 j,
// courbe sur 30 j, tendance vs période précédente et pic calculés des données.
function PageViewsCard() {
  const [visits, setVisits] = useState<VisitStats | null>(null)
  const [failed, setFailed] = useState(false)
  const [win, setWin] = useState<7 | 14 | 30>(7)

  useEffect(() => {
    let alive = true
    fetchVisits('day')
      .then((v) => { if (alive) setVisits(v) })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [])

  if (failed) return null
  if (!visits) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="font-display text-base font-bold text-ink">Vues de pages</p>
        <div className="mt-4 flex h-24 items-center justify-center text-gray-300"><Loader2 size={18} className="animate-spin" /></div>
      </div>
    )
  }

  // La série « day » couvre les 30 derniers jours consécutifs (aujourd'hui inclus) :
  // la date du point i se déduit de sa position, ce qui donne l'initiale du jour.
  const pts = visits.series.slice(-win).map((p, i, arr) => {
    const d = new Date(Date.now() - (arr.length - 1 - i) * 86400000)
    return { ...p, letter: 'DLMMJVS'[d.getDay()] }
  })
  const totalViews = pts.reduce((s, p) => s + p.views, 0)
  const maxViews = Math.max(1, ...pts.map((p) => p.views))
  const avgVisitors = Math.round(pts.reduce((s, p) => s + p.visitors, 0) / Math.max(1, pts.length))
  // Tendance : seconde moitié de la fenêtre comparée à la première.
  const half = Math.floor(win / 2)
  const prev = pts.slice(0, half).reduce((s, p) => s + p.views, 0)
  const cur = pts.slice(-half).reduce((s, p) => s + p.views, 0)
  const pct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null
  // Pic : meilleur jour de la fenêtre.
  const peak = pts.reduce((best, p) => (p.views > best.views ? p : best), pts[0])

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-base font-bold text-ink">Vues de pages</p>
          <p className="text-xs text-gray-400">
            {win} derniers jours · <b className="tnum font-bold text-gray-600">{formatPrice(totalViews)}</b> vues
            {avgVisitors > 0 ? <> · ≈ {formatPrice(avgVisitors)} visiteurs/jour</> : null}
          </p>
        </div>
        <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold">
          {([7, 14, 30] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWin(w)}
              className={`rounded-md px-2.5 py-1 ${win === w ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}
            >
              {w} j
            </button>
          ))}
        </div>
      </div>

      {/* Enseignements automatiques : tendance + pic */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {pct !== null && (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${pct >= 0 ? 'bg-ivoire-green/10 text-ivoire-green-dark' : 'bg-red-50 text-red-600'}`}>
            {pct >= 0 ? '▲' : '▼'} {pct >= 0 ? '+' : ''}{pct} % vs période précédente
          </span>
        )}
        {totalViews > 0 && (
          <span className="rounded-full bg-[#FFF6EC] px-2.5 py-1 text-[11px] font-bold text-primary-700">
            Pic : {peak.label} · {formatPrice(peak.views)} vues
          </span>
        )}
      </div>

      {win === 30 ? (
        /* 30 jours : la courbe reste lisible là où 30 barres ne le seraient plus. */
        <div className="mt-3">
          <AreaChart values={pts.map((p) => p.views)} />
          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
            <span>{pts[0].label}</span>
            <span>{pts[pts.length - 1].label}</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex h-32 items-end justify-around gap-1.5 md:h-40">
          {pts.map((p, i) => {
            const top = p.views === maxViews && p.views > 0
            return (
              <div key={i} className="flex h-full w-full max-w-[52px] flex-col items-center justify-end gap-1.5">
                <div
                  title={`${p.label} : ${p.views} vue${p.views > 1 ? 's' : ''} · ${p.visitors} visiteur${p.visitors > 1 ? 's' : ''}`}
                  className={`w-full rounded-t-md ${top ? 'bg-gradient-to-b from-ivoire-green to-ivoire-green-dark' : 'bg-gradient-to-b from-primary-500 to-primary-700'}`}
                  style={{ height: `${Math.max(4, (p.views / maxViews) * 100)}%` }}
                />
                <span className="text-[10px] font-semibold text-gray-400">{win === 7 ? p.letter : p.label.slice(0, 2)}</span>
              </div>
            )
          })}
        </div>
      )}
      {totalViews === 0 && (
        <p className="mt-2 text-center text-xs text-gray-400">Aucune vue enregistrée sur cette période.</p>
      )}
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
              <p className="font-display text-xl font-bold text-ivoire-green-dark">{formatDuration(rt.medianSeconds)}</p>
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
  active: { label: 'Actif', cls: 'bg-ivoire-green/10 text-ivoire-green-dark' },
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
    emerald: 'border-ivoire-green bg-ivoire-green text-white',
    amber: 'border-amber-500 bg-amber-500 text-white',
    red: 'border-red-500 bg-red-500 text-white',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-xs font-semibold transition disabled:opacity-50 ${active ? tones[tone] : 'border-line2 text-gray-600'}`}
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
                {r.status === 'resolved' && <span className="rounded-full bg-ivoire-green/10 px-1.5 py-0.5 text-[10px] font-bold text-ivoire-green-dark">Traité</span>}
                {r.listingHidden && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">Annonce masquée</span>}
              </p>
              <a href={`#/annonce/${r.listingId}`} className="block truncate text-sm text-primary-600 hover:underline">{r.listingTitle}</a>
              {r.details && <p className="mt-1 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">{r.details}</p>}
              <p className="mt-1 text-[11px] text-gray-400">Signalé par {r.reporterEmail || '—'} · {timeAgo(r.createdAt)}</p>
              <div className="mt-2 flex gap-1.5">
                <button onClick={() => hide(r)} className="flex items-center gap-1 rounded-lg border border-line2 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  {r.listingHidden ? <><Eye size={13} /> Réafficher</> : <><EyeOff size={13} /> Masquer l’annonce</>}
                </button>
                {r.status === 'open' && (
                  <button onClick={() => resolve(r)} className="flex items-center gap-1 rounded-lg bg-ivoire-green px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-ivoire-green">
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

  // Propositions de l'IA du site (générées côté serveur, sans service externe) :
  // le premier clic charge les propositions, les suivants passent à la suivante.
  const [proposals, setProposals] = useState<string[]>([])
  const [propIdx, setPropIdx] = useState(0)

  const toggleOpen = (m: ContactMessage) => {
    if (openId === m.id) { setOpenId(null); return }
    setOpenId(m.id)
    setDraft('')
    setProposals([])
    setPropIdx(0)
  }
  const suggest = async (m: ContactMessage) => {
    if (proposals.length > 0) {
      const next = (propIdx + 1) % proposals.length
      setPropIdx(next)
      setDraft(proposals[next])
      return
    }
    setSuggesting(true)
    try {
      const r = await suggestContactReply(m.id)
      const list = r.drafts && r.drafts.length > 0 ? r.drafts : [r.draft]
      setProposals(list)
      setPropIdx(0)
      setDraft(list[0])
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
                  {m.handled && <span className="rounded-full bg-ivoire-green/10 px-1.5 py-0.5 text-[10px] font-bold text-ivoire-green-dark">Traité</span>}
                </span>
                {!open && <span className="mt-0.5 block truncate text-sm text-gray-500">{m.message}</span>}
                <span className="mt-0.5 block break-words text-[11px] text-gray-400">
                  De {m.name || '—'}{m.email ? ` · ${m.email}` : ''} · {timeAgo(m.createdAt)}
                </span>
              </span>
              <ChevronDown size={17} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="border-t border-line px-3 pb-3">
                {/* Ordinateur/iPad large : message à gauche, réponse à droite.
                    Téléphone/tablette : empilés. */}
                <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-3">
                {/* Message complet (texte échappé par React : pas d'injection HTML) */}
                <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">{m.message}</p>

                {m.replyBody != null ? (
                  /* Réponse déjà envoyée */
                  <div className="mt-2 rounded-xl border border-ivoire-green/20 bg-ivoire-green/10 p-3 lg:mt-3">
                    <p className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-ivoire-green-dark">
                      <CheckCircle2 size={13} /> Réponse envoyée depuis contact@chap.ci
                      {m.repliedAt ? ` · ${timeAgo(m.repliedAt)}` : ''}{m.repliedBy ? ` · par ${m.repliedBy}` : ''}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ivoire-green-dark">{m.replyBody}</p>
                  </div>
                ) : m.email ? (
                  /* Composer : réponse envoyée par email depuis contact@chap.ci */
                  <div className="mt-2 rounded-xl border border-line bg-cream-200/70 p-3 lg:mt-3">
                    <p className="text-xs font-bold text-gray-700">Répondre à {m.name || m.email}</p>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={5}
                      placeholder="Votre réponse… (ou laissez l’IA du site vous proposer un message)"
                      className="input mt-2 min-h-[110px] w-full resize-y bg-white text-[16px] leading-relaxed md:text-sm"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => suggest(m)}
                        disabled={suggesting}
                        className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-[13px] font-semibold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60 md:py-1.5 md:text-xs"
                      >
                        {suggesting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        {suggesting ? 'Rédaction…' : proposals.length > 0 ? 'Autre proposition' : 'Proposer un message (IA)'}
                      </button>
                      <button
                        onClick={() => sendReply(m)}
                        disabled={sending || !draft.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50 md:py-1.5 md:text-xs"
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
                  <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 lg:mt-3">
                    Cette personne n’a pas laissé d’adresse email : réponse par email impossible.
                    Vous pouvez seulement marquer le message comme traité.
                  </p>
                )}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.handled ? (
                    <button onClick={() => mark(m, false)} className="flex items-center gap-1 rounded-lg border border-line2 px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 md:px-2.5 md:py-1.5 md:text-xs">
                      <Undo2 size={13} /> Rouvrir
                    </button>
                  ) : (
                    <button onClick={() => mark(m, true)} className="flex items-center gap-1 rounded-lg bg-ivoire-green px-3 py-2 text-[13px] font-semibold text-white hover:bg-ivoire-green md:px-2.5 md:py-1.5 md:text-xs">
                      <CheckCircle2 size={13} /> Marquer traité
                    </button>
                  )}
                  <button onClick={() => remove(m)} className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 md:px-2.5 md:py-1.5 md:text-xs">
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

// ---------- Publicités (écran publicitaire) ----------
const AD_STATUS_PILL: Record<string, [string, string]> = {
  pending: ['En attente', 'bg-amber-50 text-amber-700'],
  active: ['À l’écran', 'bg-ivoire-green/10 text-ivoire-green-dark'],
  rejected: ['Rejetée', 'bg-gray-100 text-gray-500'],
  expired: ['Expirée', 'bg-gray-100 text-gray-500'],
}
const AD_FORMULE_LABEL: Record<string, string> = { day: 'jour(s)', week: 'semaine(s)', month: 'mois' }

// Bureau de Croissance SEO : un « employé virtuel » qui diffuse 1 message/jour.
function SeoOfficePanel({ onChanged }: { onChanged?: () => void }) {
  const [st, setSt] = useState<SeoState | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const load = () => { fetchSeoState().then(setSt).catch(() => setSt(null)) }
  useEffect(load, [])
  if (!st) return null

  const cronUrl = `${st.site}/api/cron/seo?key=${encodeURIComponent(st.cronKey)}`
  const toggle = async () => {
    setBusy(true)
    try { await setSeoEnabled(!st.enabled); load() } catch (e) { alert((e as Error).message) } finally { setBusy(false) }
  }
  const runNow = async () => {
    setBusy(true)
    try { const r = await runSeoNow(); load(); onChanged?.(); alert(`Diffusion générée : « ${r.title} »`) }
    catch (e) { alert((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="rounded-2xl border border-ivoire-green/30 bg-ivoire-green/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[15px] font-extrabold text-ink">🌱 Bureau de Croissance SEO</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
            Publie <b>automatiquement une diffusion par jour</b> sur l’écran (annonce, publication ou
            message) selon les objectifs du site — texte animé, style tournant.
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          aria-pressed={st.enabled}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${st.enabled ? 'bg-ivoire-green' : 'bg-gray-300'}`}
          title={st.enabled ? 'Activé' : 'Désactivé'}
        >
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${st.enabled ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className={`font-semibold ${st.enabled ? 'text-ivoire-green-dark' : 'text-gray-500'}`}>
          {st.enabled ? '● Actif' : '○ En pause'}
        </span>
        <span className="text-gray-500">
          Aujourd’hui : {st.todayDone ? '✓ diffusion publiée' : '— pas encore'}
        </span>
        {st.current && <span className="min-w-0 truncate text-gray-500">À l’écran : « {st.current.title} »</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={runNow} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-ivoire-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-ivoire-green disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Générer la diffusion du jour
        </button>
        <button
          onClick={() => { navigator.clipboard?.writeText(cronUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="flex items-center gap-1.5 rounded-lg border border-line2 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? <CheckCircle2 size={13} className="text-ivoire-green-dark" /> : <Copy size={13} />} Copier l’URL cron quotidienne
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
        Pour l’automatisation : programmez l’URL cron <b>une fois par jour</b> (cron cPanel « 0 9 * * * »
        ou une routine claude.ai). Voir aussi l’onglet <b>Tâches auto</b>.
      </p>
    </div>
  )
}

function AdsTab({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<AdminAd[] | null>(null)
  const [err, setErr] = useState('')
  const [preview, setPreview] = useState<AdminAd | null>(null) // pub ouverte en grand
  const load = () => { setItems(null); setErr(''); fetchAdminAds().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  // Compositeur de diffusion Chap.ci (message animé).
  const [bTitle, setBTitle] = useState('')
  const [bDesc, setBDesc] = useState('')
  const [bLink, setBLink] = useState('')
  const [bStyle, setBStyle] = useState<AdStyle>('classique')
  const [bAnims, setBAnims] = useState<string[]>(['fondu']) // animations enchaînées du texte
  const [bGap, setBGap] = useState(AD_GAP_DEFAULT)          // pause (s) entre animations
  const [bLoop, setBLoop] = useState(true)                  // enchaîner en boucle par défaut
  const [bTextColor, setBTextColor] = useState('#FFFFFF')   // couleur du texte (lisibilité)
  const [bDays, setBDays] = useState(7)
  const [bImg, setBImg] = useState<string | null>(null)
  const [bBusy, setBBusy] = useState(false)
  const [bMsg, setBMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const act = async (a: AdminAd, action: 'approve' | 'reject') => {
    if (action === 'approve' && !confirm(`Activer « ${a.title} » ? La pub passera à l’écran (paiement de ${formatPrice(a.price)} F vérifié ?).`)) return
    try { await adminAdAction(a.id, action); load(); onChanged?.() } catch (e) { alert((e as Error).message) }
  }
  const remove = async (a: AdminAd) => {
    if (!confirm('Supprimer définitivement cette publicité ?')) return
    try { await adminAdDelete(a.id); load(); onChanged?.() } catch (e) { alert((e as Error).message) }
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try { setBImg(await downscaleListingImage(f, 1600, 0.82)) } catch { /* image illisible */ }
  }
  async function broadcast() {
    setBMsg('')
    // Message OU image : on peut diffuser une image seule (sans texte).
    if (bTitle.trim().length < 2 && !bImg) { setBMsg('Écrivez un message ou ajoutez une image.'); return }
    setBBusy(true)
    try {
      await adminAdBroadcast({
        title: bTitle.trim(), description: bDesc.trim(), link: bLink.trim(),
        images: bImg ? [bImg] : [], style: bStyle,
        anims: bAnims.length ? bAnims : ['fondu'], gap: bGap, loop: bLoop, textColor: bTextColor, days: bDays,
      })
      setBMsg('✓ Diffusion lancée : le message est à l’écran.')
      setBTitle(''); setBDesc(''); setBLink(''); setBImg(null)
      load(); onChanged?.()
    } catch (e) { setBMsg((e as Error).message) } finally { setBBusy(false) }
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-3.5">
      {/* Bureau de Croissance SEO — diffusions quotidiennes automatiques */}
      <SeoOfficePanel onChanged={load} />

      {/* Diffusion Chap.ci : message animé, style d'écriture, durée */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <p className="font-display text-[15px] font-extrabold text-ink">📺 Diffuser un message Chap.ci</p>
        <p className="mt-0.5 text-xs text-gray-400">
          Affiché immédiatement sur l’écran publicitaire (sans paiement) : annonces de la maison,
          messages d’information, promotions…
        </p>
        <input
          value={bTitle}
          onChange={(e) => setBTitle(e.target.value)}
          maxLength={90}
          placeholder="Le message à afficher en grand…"
          className="input mt-3"
        />
        <textarea
          value={bDesc}
          onChange={(e) => setBDesc(e.target.value)}
          rows={2}
          maxLength={600}
          placeholder="Texte secondaire (facultatif)…"
          className="input mt-2 min-h-[64px] resize-y"
        />
        <AdTextControls
          style={bStyle} setStyle={setBStyle}
          anims={bAnims} setAnims={setBAnims}
          gap={bGap} setGap={setBGap}
          loop={bLoop} setLoop={setBLoop}
          textColor={bTextColor} setTextColor={setBTextColor}
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={bLink}
            onChange={(e) => setBLink(e.target.value)}
            maxLength={300}
            placeholder="Lien (facultatif) https://…"
            inputMode="url"
            className="input"
          />
          <label className="flex items-center gap-2 rounded-xl border border-line2 bg-white px-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Durée</span>
            <input
              type="number"
              min={1}
              max={90}
              value={bDays}
              onChange={(e) => setBDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
              className="tnum w-full bg-transparent py-3 text-[15px] outline-none"
              aria-label="Durée en jours"
            />
            <span className="text-xs text-gray-400">j</span>
          </label>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <button onClick={() => fileRef.current?.click()} className="btn-outline px-3 py-2 text-xs">
            {bImg ? 'Changer l’image de fond' : '🖼️ Image de fond (facultatif)'}
          </button>
          {bImg && (
            <button onClick={() => setBImg(null)} className="text-xs font-semibold text-red-500">Retirer</button>
          )}
        </div>

        {/* Aperçu en direct de la diffusion (image nette + texte animé par-dessus). */}
        <div className="relative mt-3 flex min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-black p-4 text-center text-white">
          {/* Image NETTE (conversion auto), jamais un simple fond assombri. */}
          {bImg && <AdImageFill src={bImg} />}
          {bImg && !bTitle.trim() && !bDesc.trim() ? (
            /* Image seule : aucun texte, juste le visuel plein cadre + badge */
            <span className="relative self-start rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur">Publicité</span>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-black/20" />
              <div className="relative flex w-full flex-col items-center gap-1.5 [text-shadow:0_2px_10px_rgba(0,0,0,.55)]">
                <AnimatedAdText
                  text={bTitle || 'Votre message ici'}
                  style={bStyle}
                  color={bTextColor}
                  anims={bAnims.length ? bAnims : ['fondu']}
                  gapMs={bGap * 1000}
                  loop={bLoop}
                  className="text-xl font-extrabold"
                />
                {bDesc && <p className="text-xs font-semibold" style={{ color: bTextColor }}>{bDesc}</p>}
              </div>
            </>
          )}
        </div>

        {bMsg && <p className={`mt-2 text-sm ${bMsg.startsWith('✓') ? 'text-ivoire-green-dark' : 'text-red-600'}`}>{bMsg}</p>}
        <button onClick={broadcast} disabled={bBusy} className="btn-primary mt-3 w-full py-3">
          {bBusy ? <Loader2 size={18} className="animate-spin" /> : '📺 Diffuser à l’écran'}
        </button>
      </div>

      {/* Demandes & diffusions */}
      <div className="rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
        <p className="font-display text-[15px] font-extrabold text-ink">Publicités · {items.length}</p>
        {items.length === 0 ? (
          <Empty>Aucune publicité pour l’instant.</Empty>
        ) : (
          <div className="divide-y divide-line">
            {items.map((a) => {
              const [pillLabel, pillCls] = AD_STATUS_PILL[a.status] ?? AD_STATUS_PILL.pending
              return (
                <div key={a.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setPreview(a)}
                      aria-label="Voir la publicité en grand"
                      className="group relative h-12 w-20 shrink-0 overflow-hidden rounded-lg"
                    >
                      {a.images[0] ? (
                        <img src={a.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-gray-900 text-lg">📺</span>
                      )}
                      <span className="absolute inset-0 grid place-items-center text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                        <Eye size={16} />
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-display text-sm font-bold text-gray-800">{a.title || <span className="italic text-gray-400">(image seule)</span>}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${pillCls}`}>{pillLabel}</span>
                        {a.kind === 'admin' && (
                          <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">Diffusion Chap.ci</span>
                        )}
                        {a.kind === 'seo' && (
                          <span className="shrink-0 rounded-full bg-ivoire-green/10 px-2 py-0.5 text-[10px] font-bold text-ivoire-green-dark">🌱 Croissance SEO</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-gray-400">
                        {a.kind === 'admin'
                          ? <>Durée {a.qty} j{a.expiresAt ? <> · fin {timeAgo(a.expiresAt)}</> : null}</>
                          : <>
                              <b className="tnum text-gray-600">{formatPrice(a.price)} F</b> · {a.qty} {AD_FORMULE_LABEL[a.formule] ?? a.formule} ·{' '}
                              {a.payMethod} {a.payNumber}
                            </>}
                        {' · '}reçue {timeAgo(a.createdAt)}
                        {a.link && <> · <a href={a.link} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-600 underline">lien</a></>}
                      </p>

                      {/* Vérification du paiement (pubs payantes en attente) : montant,
                          moyen, numéro du payeur, contact — pour valider avant activation. */}
                      {a.kind !== 'admin' && a.kind !== 'seo' && a.status === 'pending' && (
                        <div className="mt-2 rounded-lg border border-[#F4D9B0] bg-[#FFF6EC] p-2.5 text-[12px] leading-relaxed text-gray-700">
                          <p className="font-bold text-ink">💳 Vérifier le paiement avant d’approuver</p>
                          <div className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
                            <span>Montant&nbsp;: <b className="tnum text-ink">{formatPrice(a.price)} F</b></span>
                            <span>Moyen&nbsp;: <b>{a.payMethod === 'wave' ? 'Wave' : 'Orange Money'}</b></span>
                            <span className="sm:col-span-2">
                              Payé depuis&nbsp;: <b className="tnum">{a.payNumber || '—'}</b> → vers <b className="tnum">07 59 90 11 20</b>
                            </span>
                            {a.email && (
                              <span className="truncate sm:col-span-2">
                                Contact&nbsp;: <a href={`mailto:${a.email}`} className="text-primary-600 underline">{a.email}</a>
                                {a.phone ? <> · <a href={`tel:${a.phone.replace(/\s/g, '')}`} className="text-primary-600">{a.phone}</a></> : null}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-gray-500">
                            Confirmez la réception de <b className="tnum">{formatPrice(a.price)} F</b> depuis ce numéro, puis approuvez.
                          </p>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button onClick={() => setPreview(a)} className="flex items-center gap-1 rounded-lg border border-line2 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                          <Eye size={13} /> Voir en grand
                        </button>
                        {a.status === 'pending' && (
                          <button onClick={() => act(a, 'approve')} className="flex items-center gap-1 rounded-lg bg-ivoire-green px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-ivoire-green">
                            <CheckCircle2 size={13} /> Approuver
                          </button>
                        )}
                        {(a.status === 'pending' || a.status === 'active') && (
                          <button onClick={() => act(a, 'reject')} className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                            <Ban size={13} /> {a.status === 'active' ? 'Retirer de l’écran' : 'Rejeter'}
                          </button>
                        )}
                        <button onClick={() => remove(a)} className="flex items-center gap-1 rounded-lg border border-line2 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Aperçu « en grand » : voir la pub complète, puis accepter / refuser. */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-ink">Aperçu de la publicité</h3>
              <button onClick={() => setPreview(null)} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-full text-gray-500 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* Rendu fidèle de la bannière, comme à l'écran */}
            <div className="relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl bg-black text-white">
              {preview.images[0] && <AdImageFill src={preview.images[0]} />}
              {(preview.title || preview.description) ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/20" />
                  <div className="relative flex flex-col items-center gap-2 p-5 text-center [text-shadow:0_2px_10px_rgba(0,0,0,.55)]">
                    {preview.title && (
                      <AnimatedAdText
                        text={preview.title}
                        style={preview.style ?? 'classique'}
                        color={preview.textColor}
                        anims={preview.anims?.length ? preview.anims : (preview.anim ? [preview.anim] : ['fondu'])}
                        gapMs={Math.max(5, Math.min(60, preview.animGap ?? 8)) * 1000}
                        loop={preview.animLoop !== false}
                        className="text-2xl font-extrabold leading-tight"
                      />
                    )}
                    {preview.description && (
                      <p className="text-sm font-semibold" style={{ color: preview.textColor || 'rgba(255,255,255,0.9)' }}>{preview.description}</p>
                    )}
                  </div>
                </>
              ) : preview.images[0] ? (
                <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/85 backdrop-blur">Publicité</span>
              ) : null}
            </div>

            {/* Visuels supplémentaires */}
            {preview.images.length > 1 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {preview.images.map((im, i) => <img key={i} src={im} alt="" className="h-20 w-full rounded-lg object-cover" />)}
              </div>
            )}

            {/* Détails complets */}
            <div className="mt-3 space-y-1 text-[13px]">
              {preview.kind !== 'admin' && preview.kind !== 'seo' ? (
                <>
                  <KV k="Montant à vérifier" v={<b className="tnum text-ink">{formatPrice(preview.price)} F</b>} />
                  <KV k="Formule" v={`${preview.qty} ${AD_FORMULE_LABEL[preview.formule] ?? preview.formule}`} />
                  <KV k="Payé via" v={preview.payMethod === 'wave' ? 'Wave' : 'Orange Money'} />
                  <KV k="Numéro du payeur" v={<span className="tnum">{preview.payNumber || '—'} → 07 59 90 11 20</span>} />
                  {preview.email && <KV k="Contact" v={<a href={`mailto:${preview.email}`} className="text-primary-600 underline">{preview.email}</a>} />}
                  {preview.phone && <KV k="Téléphone" v={<a href={`tel:${preview.phone.replace(/\s/g, '')}`} className="text-primary-600">{preview.phone}</a>} />}
                </>
              ) : (
                <KV k="Type" v={preview.kind === 'seo' ? '🌱 Croissance SEO' : 'Diffusion Chap.ci'} />
              )}
              {preview.link && <KV k="Lien" v={<a href={preview.link} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-600 underline">{preview.link}</a>} />}
              {preview.expiresAt ? <KV k="Fin" v={new Date(preview.expiresAt).toLocaleDateString('fr-FR')} /> : null}
            </div>

            {/* Accepter / Refuser / Supprimer */}
            <div className="mt-4 flex flex-wrap gap-2">
              {preview.status === 'pending' && (
                <button onClick={() => { const a = preview; setPreview(null); act(a, 'approve') }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ivoire-green px-3 py-2.5 text-sm font-bold text-white hover:bg-ivoire-green">
                  <CheckCircle2 size={16} /> Approuver
                </button>
              )}
              {(preview.status === 'pending' || preview.status === 'active') && (
                <button onClick={() => { const a = preview; setPreview(null); act(a, 'reject') }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                  <Ban size={16} /> {preview.status === 'active' ? 'Retirer de l’écran' : 'Refuser'}
                </button>
              )}
              <button onClick={() => { const a = preview; setPreview(null); remove(a) }} aria-label="Supprimer" className="flex items-center justify-center gap-1.5 rounded-xl border border-line2 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Ligne clé/valeur des détails d'une publicité (aperçu admin). */
function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-gray-400">{k}</span>
      <span className="break-all text-right font-semibold text-ink">{v}</span>
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
          <p className="mt-2 border-t border-line pt-2 text-xs text-gray-400">
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
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-line bg-white">
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
// Dégradés d'avatars des modérateurs (rotation, comme l'artifact).
const AV_GRADS = [
  'linear-gradient(145deg,#F77F00,#D95F00)',
  'linear-gradient(145deg,#9a4100,#7c3600)',
  'linear-gradient(145deg,#009E60,#007447)',
  'linear-gradient(145deg,#8E86C8,#6b62a8)',
]

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
    <div className="space-y-3.5">
      {/* Note de l'artifact : filet orange à gauche, fond crème */}
      <div className="rounded-r-xl border-l-[3px] border-primary-500 bg-[#FFF6EC] px-3.5 py-3 text-[13px] leading-relaxed text-gray-700">
        Vous créez chaque modérateur avec son email, les fonctionnalités autorisées et un code
        d’accès. Il déverrouille une fois et garde l’accès <b>jusqu’à ce que vous le bloquiez</b>.
      </div>

      {/* Panneau « Créer un modérateur » (panel-lite de l'artifact) */}
      <form onSubmit={save} className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <p className="font-display text-[15px] font-extrabold text-ink">Créer un modérateur</p>
        <div className="relative mt-3">
          <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (msg) setMsg('') }}
            placeholder="email@du-moderateur.ci"
            autoComplete="off"
            className="input pl-10"
            aria-label="Email du modérateur"
          />
        </div>

        <p className="mb-1.5 mt-4 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-400">
          Fonctionnalités autorisées
        </p>
        <div className="grid grid-cols-2 gap-2">
          {data.features.map((f) => {
            const on = perms.includes(f.key)
            return (
              <label
                key={f.key}
                className={`flex cursor-pointer select-none items-center gap-2 rounded-[11px] border px-3 py-2.5 text-[13px] transition ${
                  on ? 'border-primary-500 bg-[#FFF6EC] font-semibold text-primary-700' : 'border-line2 text-gray-600'
                }`}
              >
                <input type="checkbox" checked={on} onChange={() => toggle(f.key)} className="sr-only" />
                <span
                  aria-hidden
                  className={`grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border-[1.5px] text-[11px] text-white ${
                    on ? 'border-primary-500 bg-primary-500' : 'border-line2 bg-white'
                  }`}
                >
                  {on ? '✓' : ''}
                </span>
                {f.label}
              </label>
            )
          })}
        </div>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="Code d’accès personnalisé (vide = généré)"
          maxLength={16}
          className="input mt-3 font-mono tracking-widest"
          aria-label="Code d’accès du modérateur"
        />

        {/* Code d'accès délivré — encadré pointillé de l'artifact, affiché une seule fois */}
        {issued && (
          <>
            <div className="mt-3 flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-[11px] border border-dashed border-primary-500 bg-[#FFFBF4] px-3 py-3 text-center font-display text-[19px] font-extrabold tracking-[5px] text-ink">
                {issued.code}
              </div>
              <button
                type="button"
                onClick={() => { navigator.clipboard?.writeText(issued.code); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                className="shrink-0 rounded-[11px] border border-line2 bg-white p-3 text-gray-600 transition active:scale-95"
                aria-label="Copier le code"
              >
                {copied ? <CheckCircle2 size={18} className="text-ivoire-green-dark" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              Code d’accès de {issued.email} — transmettez-le-lui (affiché une seule fois).
            </p>
          </>
        )}

        {msg && <p className={`mt-3 text-sm ${msg.startsWith('✓') ? 'text-ivoire-green-dark' : 'text-red-600'}`}>{msg}</p>}

        <div className="mt-3.5 flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary flex-1 py-3 disabled:opacity-50">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> Enregistrer le modérateur</>}
          </button>
          {email && <button type="button" onClick={resetForm} className="btn-outline px-4 py-3 text-sm">Annuler</button>}
        </div>
      </form>

      {/* Panneau « Modérateurs · N » — lignes de l'artifact */}
      <div className="rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
        <p className="font-display text-[15px] font-extrabold text-ink">Modérateurs · {data.moderators.length}</p>
        {data.moderators.length === 0 ? (
          <Empty>Aucun modérateur. Créez-en un ci-dessus.</Empty>
        ) : (
          <div className="divide-y divide-line">
            {data.moderators.map((m, i) => (
              <div key={m.email} className="flex items-center gap-3 py-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-display font-extrabold text-white"
                  style={{ background: AV_GRADS[i % AV_GRADS.length], opacity: m.blocked ? 0.45 : 1 }}
                  aria-hidden
                >
                  {(m.email[0] || '?').toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate font-display text-[13.5px] font-bold text-gray-800">{m.email}</span>
                    {m.blocked && (
                      <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-red-600">
                        Bloqué
                      </span>
                    )}
                  </p>
                  {m.permissions.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.permissions.map((p) => (
                        <span key={p} className="rounded-full border border-line bg-cream-200 px-2 py-0.5 text-[10.5px] font-semibold text-gray-600">
                          {labelOf(p)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-gray-400">Aucune fonctionnalité cochée (« Aperçu » seulement).</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
                  <button
                    onClick={() => toggleBlock(m)}
                    className={`rounded-[9px] border px-2.5 py-1.5 text-[11.5px] font-bold transition ${
                      m.blocked
                        ? 'border-ivoire-green/30 text-ivoire-green-dark hover:bg-ivoire-green/10'
                        : 'border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {m.blocked ? '✓ Débloquer' : '⊘ Bloquer'}
                  </button>
                  <span className="flex">
                    <button onClick={() => edit(m)} aria-label="Modifier" title="Modifier (email + fonctionnalités repris dans le formulaire)" className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-primary-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(m.email)} aria-label="Retirer" title="Retirer ce modérateur" className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Propriétaire(s) — conservé (tous droits, non délégable) */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        {data.owners.map((o) => (
          <div key={o} className="flex items-center gap-3 py-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Crown size={16} /></span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">{o}</span>
            <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">Propriétaire</span>
          </div>
        ))}
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
        {result && <p className={`text-sm ${result.startsWith('✓') ? 'text-ivoire-green-dark' : 'text-red-600'}`}>{result}</p>}
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

  const cmd = info ? `curl -s "${info.site}/api/cron/suggestions?key=${encodeURIComponent(info.cronKey)}" >/dev/null 2>&1` : ''
  const copy = () => { navigator.clipboard?.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <div className="mt-2 space-y-3 rounded-2xl border border-ivoire-green/30 bg-ivoire-green/10 p-4">
      <p className="flex items-center gap-1.5 font-display text-sm font-bold text-gray-800">
        <ShieldCheck size={16} className="text-ivoire-green-dark" /> Agents intelligents (suggestions personnalisées)
      </p>
      <p className="text-sm text-gray-600">
        Un « agent » observe automatiquement chaque utilisateur (<b>favoris</b>, <b>recherches</b>,
        <b> catégories consultées</b>) et lui envoie par email des <b>suggestions d’articles qui
        l’intéressent</b>. À programmer <b>2 fois par semaine</b>.
      </p>

      <button onClick={test} disabled={busy} className="btn-outline py-2 text-sm disabled:opacity-50">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Tester sur mon compte
      </button>
      {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-ivoire-green-dark' : 'text-gray-500'}`}>{msg}</p>}

      <div className="rounded-xl bg-white p-3">
        <p className="mb-1.5 text-xs font-semibold text-gray-500">
          Pour l’AUTOMATISER (cPanel → Tâches planifiées) — <b>lundi &amp; jeudi à 9h</b> :
          planning <code className="rounded bg-gray-100 px-1">0 9 * * 1,4</code>
        </p>
        <div className="mt-1 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-900 px-2 py-1.5 text-[11px] text-gray-100">{cmd}</code>
          <button onClick={copy} className="shrink-0 rounded-lg border border-line2 p-1.5 text-gray-600 hover:bg-gray-50">
            {copied ? <CheckCircle2 size={15} className="text-ivoire-green-dark" /> : <Copy size={15} />}
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
    info ? `curl -s "${info.site}/api/cron/digest?key=${encodeURIComponent(info.cronKey)}&type=${type}" >/dev/null 2>&1` : ''

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
      {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-ivoire-green-dark' : 'text-red-600'}`}>{msg}</p>}

      <div className="rounded-xl bg-white p-3">
        <p className="mb-1.5 text-xs font-semibold text-gray-500">Pour l’AUTOMATISER (cPanel → Tâches planifiées / Cron Jobs) :</p>
        {[['daily', 'Chaque jour à 8h', '0 8 * * *'], ['weekly', 'Chaque lundi à 8h', '0 8 * * 1']].map(([type, when, sched]) => (
          <div key={type} className="mb-2">
            <p className="text-xs text-gray-500">{when} — planning <code className="rounded bg-gray-100 px-1">{sched}</code></p>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-900 px-2 py-1.5 text-[11px] text-gray-100">{cmd(type)}</code>
              <button onClick={() => copy(type)} className="shrink-0 rounded-lg border border-line2 p-1.5 text-gray-600 hover:bg-gray-50">
                {copied === type ? <CheckCircle2 size={15} className="text-ivoire-green-dark" /> : <Copy size={15} />}
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
        <p className={`text-sm font-medium ${cfg.configured ? 'text-ivoire-green-dark' : 'text-gray-500'}`}>
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
        {saveMsg && <p className={`text-sm ${saveMsg.startsWith('✓') ? 'text-ivoire-green-dark' : 'text-red-600'}`}>{saveMsg}</p>}
      </form>

      <div className="rounded-2xl border border-line2 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">Vérifier l’envoi&nbsp;:</p>
          <button onClick={test} disabled={testing} className="btn-outline shrink-0 py-2 text-sm disabled:opacity-50">
            {testing ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Envoyer un email de test</>}
          </button>
        </div>
        {testMsg && <p className={`mt-2 text-sm ${testMsg.startsWith('✓') ? 'text-ivoire-green-dark' : 'text-red-600'}`}>{testMsg}</p>}
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
// `maxAgeH` : au-delà de ce nombre d'heures sans passage, la tâche est signalée
// comme en panne. Toujours un peu plus que l'intervalle prévu, pour tolérer un
// décalage d'exécution sans crier au loup.
const CRON_JOBS: { id: string; label: string; desc: string; query?: string; schedule: string; cronExpr: string; maxAgeH: number }[] = [
  { id: 'security',       label: 'Surveillance sécurité',       desc: 'Compte les tentatives de connexion suspectes et repère les IP à surveiller.', query: '?days=1',  schedule: 'Chaque jour à 8h',    cronExpr: '0 8 * * *',   maxAgeH: 26 },
  { id: 'cleanup',        label: 'Ménage / maintenance',        desc: 'Purge les vieilles données et masque les annonces de plus de 90 jours.',                        schedule: 'Chaque jour à 4h',    cronExpr: '0 4 * * *',   maxAgeH: 26 },
  { id: 'backup',         label: 'Sauvegarde de la base',       desc: 'Sauvegarde complète (7 dernières conservées) + email récapitulatif.',                          schedule: 'Chaque jour à 3h',    cronExpr: '0 3 * * *',   maxAgeH: 26 },
  { id: 'digest',         label: 'Résumé du jour',              desc: 'Envoie aux abonnés les nouvelles annonces du jour.',                          query: '?type=daily', schedule: 'Chaque jour à 18h',   cronExpr: '0 18 * * *',  maxAgeH: 26 },
  { id: 'suggestions',    label: 'Suggestions personnalisées',  desc: 'Recommande à chaque utilisateur des annonces selon ses centres d’intérêt.',                     schedule: 'Lundi & jeudi à 9h',  cronExpr: '0 9 * * 1,4', maxAgeH: 96 },
  { id: 'seo',            label: 'Bureau de Croissance SEO',    desc: 'Publie chaque jour une diffusion animée sur l’écran (annonce, publication ou message) selon les objectifs du site.', schedule: 'Chaque jour à 9h', cronExpr: '0 9 * * *', maxAgeH: 26 },
  { id: 'ads-expiring',   label: 'Rappel d’expiration des pubs', desc: 'Prévient l’annonceur par e-mail ~3 jours avant la fin de sa publicité pour qu’il la renouvelle.', schedule: 'Chaque jour à 11h', cronExpr: '0 11 * * *',  maxAgeH: 26 },
  { id: 'activation-relance', label: 'Relance « publiez votre 1ʳᵉ annonce »', desc: 'Invite une seule fois, par e-mail, les inscrits sans aucune annonce (≥ 3 jours) à publier leur première.', schedule: 'Chaque jour à 12h', cronExpr: '0 12 * * *', maxAgeH: 26 },
  { id: 'alerts',         label: 'Alertes recherches',          desc: 'Prévient quand une annonce correspond à une recherche sauvegardée.',                            schedule: 'Toutes les 2 heures', cronExpr: '0 */2 * * *', maxAgeH: 4 },
  { id: 'review-invites', label: 'Invitations à noter',         desc: 'Invite l’acheteur à laisser un avis après une vente confirmée par le vendeur.',                 schedule: 'Chaque jour à 10h',   cronExpr: '0 10 * * *',  maxAgeH: 26 },
  { id: 'stats',          label: 'Statistiques hebdo',          desc: 'Agrégats anonymes d’activité (pour le rapport hebdomadaire).', query: '?days=7',                schedule: 'Lundi à 7h',          cronExpr: '0 7 * * 1',   maxAgeH: 192 },
  { id: 'report',         label: 'Rapport mensuel',             desc: 'Envoie à contact@chap.ci un récap activité + sécurité + santé de la base.',   query: '?days=30',  schedule: 'Le 1er du mois à 7h', cronExpr: '0 7 1 * *',   maxAgeH: 768 },
]

function AutomationTab() {
  const [info, setInfo] = useState<{
    cronKey: string
    site: string
    runs?: Record<string, { lastOkAt: string | null; runs: number }>
  } | null>(null)
  const [err, setErr] = useState('')
  const [reveal, setReveal] = useState(false)
  const [copied, setCopied] = useState('')
  const [fmt, setFmt] = useState<'cmd' | 'url'>('cmd')

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
  // Filet de sécurité : le serveur n'accepte plus qu'une clé « sûre » (lettres,
  // chiffres, . _ ~ -). Si une clé exotique apparaissait malgré tout, on prévient
  // au lieu de laisser l'utilisateur chercher un 403 pendant des jours.
  const keyIsSafe = !key || /^[A-Za-z0-9._~-]+$/.test(key)
  // Commande prête pour cPanel : clé dans l'EN-TÊTE (invisible dans les journaux)
  // et APOSTROPHES SIMPLES (le shell ne touche à rien de ce qu'il y a dedans).
  const cmdFor = (j: typeof CRON_JOBS[number]) =>
    `curl -sS -H 'X-Cron-Key: ${key}' '${info.site}/api/cron/${j.id}${j.query ?? ''}' >/dev/null 2>&1`
  // Variante URL simple (toujours acceptée par le serveur, en repli).
  const urlFor = (j: typeof CRON_JOBS[number]) =>
    `${info.site}/api/cron/${j.id}${j.query ? `${j.query}&` : '?'}key=${encodeURIComponent(key)}`
  const textFor = (j: typeof CRON_JOBS[number]) => (fmt === 'cmd' ? cmdFor(j) : urlFor(j))

  // État réel de chaque tâche, d'après la trace serveur du dernier passage.
  // « jamais » et « en retard » sont les deux cas qu'il faut voir d'un coup d'œil :
  // le 26/07, la sauvegarde quotidienne était muette depuis douze jours sans que
  // rien, nulle part, ne le signale.
  const statusOf = (j: typeof CRON_JOBS[number]) => {
    const at = info.runs?.[j.id]?.lastOkAt
    if (!at) return { tone: 'bad' as const, text: 'jamais exécutée' }
    const ms = Date.parse(at)
    if (Number.isNaN(ms)) return { tone: 'bad' as const, text: 'date illisible' }
    const late = Date.now() - ms > j.maxAgeH * 3600_000
    return { tone: late ? ('warn' as const) : ('ok' as const), text: timeAgo(ms) }
  }
  const TONE = {
    ok:   'bg-ivoire-green/10 text-ivoire-green-dark',
    warn: 'bg-amber-100 text-amber-800',
    bad:  'bg-red-100 text-red-700',
  }
  const broken = CRON_JOBS.filter((j) => statusOf(j).tone !== 'ok')

  return (
    <div className="space-y-4">
      {/* Modération automatique : jeton de service cloisonné (Le Gardien) */}
      <ModerationAutoCard />

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

      {/* Alerte : des tâches ne tournent pas. C'est la première chose à voir. */}
      {broken.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm">
          <p className="font-display font-bold text-red-800">
            {broken.length === 1
              ? '1 tâche automatique ne tourne pas'
              : `${broken.length} tâches automatiques ne tournent pas`}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-red-700">
            {broken.map((j) => j.label).join(' · ')}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-red-700">
            Vérifiez dans <b>cPanel → Tâches planifiées</b> que la commande de chacune
            correspond bien à celle affichée plus bas. La cause la plus fréquente est une
            clé recopiée entre <b>guillemets doubles</b> : le shell y avale tout ce qui
            ressemble à <code className="rounded bg-red-100 px-1">$VARIABLE</code>, et la
            tâche échoue en silence.
          </p>
        </div>
      )}

      {/* La clé active */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="mb-2 font-display text-sm font-bold text-gray-800">Ta clé active</p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-900 px-3 py-2 text-[13px] text-gray-100">
            {reveal ? (key || '(aucune)') : masked}
          </code>
          <button onClick={() => setReveal((v) => !v)} className="shrink-0 rounded-lg border border-line2 p-2 text-gray-600 hover:bg-gray-50" aria-label={reveal ? 'Masquer la clé' : 'Afficher la clé'}>
            {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button onClick={() => copy('key', key)} disabled={!key} className="shrink-0 rounded-lg border border-line2 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40" aria-label="Copier la clé">
            {copied === 'key' ? <CheckCircle2 size={16} className="text-ivoire-green-dark" /> : <Copy size={16} />}
          </button>
        </div>
        {!keyIsSafe && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ⚠️ Cette clé contient des caractères spéciaux qui peuvent être <b>déformés</b> dans une URL
            ou une commande (ex. <code className="rounded bg-amber-100 px-1">$</code>,{' '}
            <code className="rounded bg-amber-100 px-1">?</code>, <code className="rounded bg-amber-100 px-1">%</code>) —
            cause classique des 403. Mettez dans <code className="rounded bg-amber-100 px-1">api/config.php</code> une clé
            faite uniquement de <b>lettres et chiffres</b> (≥ 24 caractères), ou retirez la ligne{' '}
            <code className="rounded bg-amber-100 px-1">cron_key</code> : le serveur en générera une automatiquement.
          </p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          <b>Pour une routine claude.ai</b> : copie cette clé et colle-la dans le prompt de la routine.
          Fais-la toujours passer par l’en-tête, entre <b>apostrophes simples</b> :{' '}
          <code className="rounded bg-gray-100 px-1">-H 'X-Cron-Key: …'</code>. Ne la partage jamais publiquement.
        </p>
      </div>

      {/* Les URLs cron prêtes à copier */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {fmt === 'cmd' ? 'Commandes prêtes à copier' : 'URLs prêtes à copier'}
          </p>
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            <button
              onClick={() => setFmt('cmd')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${fmt === 'cmd' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}
            >
              Commande cPanel
            </button>
            <button
              onClick={() => setFmt('url')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${fmt === 'url' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}
            >
              URL simple
            </button>
          </div>
        </div>
        <p className="px-1 text-[11px] text-gray-500">
          {fmt === 'cmd'
            ? 'Recommandé : la clé passe dans l’en-tête (absente des journaux) et entre apostrophes simples (le shell n’y touche pas).'
            : 'À ouvrir dans un navigateur ou avec wget. La clé apparaît dans l’URL — préférez la commande pour les tâches planifiées.'}
        </p>
        {CRON_JOBS.map((j) => (
          <div key={j.id} className="rounded-2xl bg-white p-3.5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-gray-800">{j.label}</p>
                <p className="mt-0.5 text-xs text-gray-600">{j.desc}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">{j.schedule}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[statusOf(j).tone]}`}>
                  {statusOf(j).tone === 'ok' ? '✓ ' : '⚠ '}{statusOf(j).text}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-900 px-2 py-1.5 text-[11px] text-gray-100">{textFor(j)}</code>
              <button onClick={() => copy(j.id, textFor(j))} className="shrink-0 rounded-lg border border-line2 p-1.5 text-gray-600 hover:bg-gray-50" aria-label={fmt === 'cmd' ? 'Copier la commande' : 'Copier l’URL'}>
                {copied === j.id ? <CheckCircle2 size={15} className="text-ivoire-green-dark" /> : <Copy size={15} />}
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

// ---------- Modération automatique : jeton de service cloisonné (Le Gardien) ----------
function ModerationAutoCard() {
  const [data, setData] = useState<{ site: string; tokens: ServiceToken[] } | null>(null)
  const [audit, setAudit] = useState<ModAuditEntry[]>([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [fresh, setFresh] = useState('') // jeton en clair, montré une seule fois
  const [copied, setCopied] = useState('')
  const [confirmRotate, setConfirmRotate] = useState(false)

  const load = () => {
    setErr('')
    modTokens().then(setData).catch((e) => setErr((e as Error).message))
    modAudit().then((d) => setAudit(d.entries)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const copy = (id: string, text: string) => { navigator.clipboard?.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 1500) }
  const active = data?.tokens.filter((t) => !t.revoked && t.scope === 'moderation') ?? []
  const hasActive = active.length > 0

  const generate = async (rotate: boolean) => {
    setBusy(true); setErr(''); setConfirmRotate(false)
    try { const r = await createModToken('Le Gardien — modération', rotate); setFresh(r.token); load() }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const revoke = async (id: string) => {
    if (!confirm('Révoquer ce jeton ? La routine qui l’utilise perdra immédiatement l’accès.')) return
    setBusy(true)
    try { await revokeModToken(id); load() } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!data) return <div className="rounded-2xl bg-white p-4 shadow-card"><Center><Loader2 className="animate-spin" size={20} /></Center></div>

  const base = `${data.site}/api/mod/queue`

  return (
    <div className="space-y-3 rounded-2xl border border-primary-200 bg-white p-4 shadow-card">
      <div>
        <p className="flex items-center gap-1.5 font-display text-sm font-black text-gray-800">
          <ShieldOk size={16} className="text-ivoire-green" /> Modération automatique — « Le Gardien »
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Un <b>jeton de service cloisonné</b> permet à la routine de <b>lire la file</b>, <b>masquer</b> et
          <b> signaler</b> des annonces — <b>sans jamais</b> toucher aux comptes, réglages ou sauvegardes.
          Révocable à tout moment.
        </p>
      </div>

      {/* Jeton fraîchement créé : affiché une seule fois */}
      {fresh && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-bold text-amber-800">✓ Jeton créé — copiez-le maintenant</p>
          <p className="mt-0.5 text-xs text-amber-700">Il <b>ne sera plus jamais affiché</b>. Donnez-le au Gardien, puis gardez-le secret.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-900 px-3 py-2 text-[12px] text-gray-100">{fresh}</code>
            <button onClick={() => copy('fresh', fresh)} className="shrink-0 rounded-lg border border-amber-300 bg-white p-2 text-gray-600 hover:bg-amber-100" aria-label="Copier le jeton">
              {copied === 'fresh' ? <CheckCircle2 size={16} className="text-ivoire-green-dark" /> : <Copy size={16} />}
            </button>
          </div>
          <button onClick={() => setFresh('')} className="mt-2 text-xs font-semibold text-amber-800 underline">J’ai copié le jeton</button>
        </div>
      )}

      {/* Générer / renouveler */}
      <div className="flex flex-wrap items-center gap-2">
        {!hasActive ? (
          <button onClick={() => generate(false)} disabled={busy} className="btn-primary py-2 text-sm disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Générer le jeton
          </button>
        ) : !confirmRotate ? (
          <button onClick={() => setConfirmRotate(true)} disabled={busy} className="btn-outline py-2 text-sm disabled:opacity-50">
            <RefreshCw size={15} /> Renouveler (rotation)
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-2 py-1.5">
            <span className="text-xs text-amber-800">Révoquer l’ancien et en créer un nouveau ?</span>
            <button onClick={() => generate(true)} disabled={busy} className="rounded-md bg-amber-600 px-2 py-1 text-xs font-semibold text-white">Oui, renouveler</button>
            <button onClick={() => setConfirmRotate(false)} className="text-xs text-amber-800 underline">Annuler</button>
          </div>
        )}
      </div>

      {/* Liste des jetons */}
      {data.tokens.length > 0 && (
        <div className="space-y-1.5">
          {data.tokens.map((t) => (
            <div key={t.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${t.revoked ? 'border-line bg-gray-50 opacity-70' : 'border-line2 bg-white'}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${t.revoked ? 'bg-gray-200 text-gray-400' : 'bg-ivoire-green/10 text-ivoire-green'}`}>
                <ShieldOk size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">{t.label} <code className="ml-1 rounded bg-gray-100 px-1 text-[11px] text-gray-500">{t.prefix}…</code></p>
                <p className="text-[11px] text-gray-500">
                  {t.revoked ? 'Révoqué' : 'Actif'} · {t.uses} appel{t.uses > 1 ? 's' : ''}
                  {t.lastUsedAt ? ` · vu ${timeAgo(t.lastUsedAt)}` : ' · jamais utilisé'}
                </p>
              </div>
              {!t.revoked && (
                <button onClick={() => revoke(t.id)} disabled={busy} className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40" aria-label="Révoquer">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comment le donner au Gardien */}
      <div className="rounded-xl bg-primary-50/60 p-3 text-xs text-primary-800">
        <p className="font-semibold">Donner le jeton à la routine « Le Gardien »</p>
        <p className="mt-1 text-primary-700">
          Transmettez-le <b>uniquement</b> dans l’en-tête HTTP
          <code className="rounded bg-white px-1"> X-Service-Token: LE_JETON</code> (jamais dans l’URL —
          un secret en query-string finit dans les journaux). Points d’entrée :
        </p>
        <ul className="mt-1 list-inside list-disc text-primary-700">
          <li><code>GET {base}</code> — lire la file (annonces + signalements + score de risque)</li>
          <li><code>POST /api/mod/hide</code> — masquer (haute confiance)</li>
          <li><code>POST /api/mod/flag</code> — signaler pour revue humaine</li>
          <li><code>POST /api/mod/seen</code> — marquer « examinées, OK » (ne plus les revoir)</li>
          <li><code>POST /api/mod/digest</code> — envoyer le récap par email</li>
        </ul>
      </div>

      {/* Journal d'audit */}
      {audit.length > 0 && (
        <div>
          <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Journal (dernières actions)</p>
          <div className="space-y-1">
            {audit.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-xs">
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 font-semibold ${e.action === 'hide' ? 'bg-red-50 text-red-600' : e.action === 'flag' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                  {e.action === 'hide' ? 'masqué' : e.action === 'flag' ? 'signalé' : e.action}
                </span>
                <span className="min-w-0 flex-1 truncate text-gray-600">{e.listingTitle || e.listingId || '—'}{e.reason ? ` · ${e.reason}` : ''}</span>
                <span className="shrink-0 text-gray-400">{timeAgo(e.at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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

  const cmd = info ? `curl -s "${info.site}/api/cron/backup?key=${encodeURIComponent(info.cronKey)}" >/dev/null 2>&1` : ''
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
            <button onClick={copy} className="shrink-0 rounded-lg border border-line2 p-1.5 text-gray-600 hover:bg-gray-50">
              {copied ? <CheckCircle2 size={15} className="text-ivoire-green-dark" /> : <Copy size={15} />}
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
              <li key={b.file} className="flex items-center gap-2 rounded-xl border border-line p-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600"><Database size={16} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-800">{b.file}</span>
                  <span className="block text-xs text-gray-500">{humanSize(b.bytes)} · {timeAgo(b.at)}</span>
                </span>
                <button
                  onClick={() => downloadBackup(b.file).catch((e) => setErr((e as Error).message))}
                  className="shrink-0 rounded-lg border border-line2 p-2 text-gray-600 hover:bg-gray-50"
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
      {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-ivoire-green-dark' : 'text-red-600'}`}>{msg}</p>}
    </div>
  )
}

// ---------- petits composants ----------
function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-cream-200 pb-16">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/90 backdrop-blur-md px-3 py-3">
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
