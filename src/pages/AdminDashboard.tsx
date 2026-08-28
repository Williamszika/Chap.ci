import { useEffect, useRef, useState, type ReactNode } from 'react'
import { mediaUrl } from '../lib/native'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, Star, Mail,
  Loader2, Lock, Download, Trash2, TrendingUp, RefreshCw,
  Flag, Ban, ShieldOff, ShieldCheck as ShieldOk, Eye, EyeOff, ChevronRight, UserX, AlertTriangle, X,
  Plus, LifeBuoy,
} from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { formatPrice, formatFCFA, timeAgo } from '../lib/format'
import { emojiFor } from '../lib/placeholder'
import { locationLabel } from '../data/locations'
import { TYPES_PRO } from '../data/secteursPro'
import { KpiCrm, KpisCrm, PucesCrm, BarreCrm, AttenteCrm, contient } from '../components/CrmAdmin'
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
  type AdminUserDetail, type Report, type ReportAction, type UserStatus, type AdminConversation, type AdminReview,
  fetchInvites, envoyerInvitations, type ListeInvites,
  fetchGeo, type GeoStats, type GeoRange,
  fetchAdminPro, deciderPro, corrigerFichePro, type AdminProDemande,
} from '../lib/admin'
import { ouvrirFil } from '../lib/equipe'
import {
  type VisitStats, type VisitRange, type VisitPoint, type ResponseTime, type BackupFile, type ContactMessage,
} from '../lib/admin'
import { fetchNewsletter, type Subscriber } from '../lib/newsletter'
import {
  fetchAdminAds, adminAdAction, adminAdDelete, adminAdBroadcast,
  fetchSeoState, setSeoEnabled, runSeoNow,
  AD_GAP_DEFAULT, type AdminAd, type AdStyle, type SeoState,
} from '../lib/ads'
import { ComptabiliteTab } from '../components/ComptabiliteTab'
import { TableauPro } from './EspacePro'
import { AnimatedAdText } from '../components/AnimatedAdText'
import { AdImageFill } from '../components/AdImageFill'
import { AdTextControls } from '../components/AdTextControls'
import { downscaleListingImage } from '../lib/image'
import { ShieldCheck, UserPlus, Crown, MailCheck, Send, Save, CheckCircle2, Megaphone, CalendarClock, Copy, Database, KeyRound, Pencil, Inbox, Undo2, Sparkles, ChevronDown } from 'lucide-react'

type Tab = 'overview' | 'listings' | 'users' | 'pro' | 'orders' | 'newsletter' | 'moderators' | 'emails' | 'campaigns' | 'reports' | 'contact' | 'ads' | 'comptabilite' | 'conversations' | 'reviews' | 'visitors' | 'backup' | 'automation'

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
  // Lien profond `#/admin?onglet=…` : la cloche « Demande de compte Pro »
  // amène DIRECTEMENT sur le bon onglet (HashRouter : le paramètre voyage
  // dans le hash, comme ?rubrique= sur la page Aide).
  const { search } = useLocation()
  useEffect(() => {
    const o = new URLSearchParams(search).get('onglet')
    if (o === 'pro') setTab('pro')
  }, [search])
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
          {/* L'assistance n'est pas un onglet : c'est un écran à part, le même
              que celui des membres. En faire un onglet aurait obligé à écrire
              deux fois la conversation — et les deux auraient divergé. */}
          <button
            onClick={() => navigate('/assistance')}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-line2 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-cream-100 active:scale-95"
            title="Demandes des membres, et fils entre modérateurs"
          >
            <LifeBuoy size={14} /> Assistance
          </button>
          <button
            onClick={() => { adminLock(); setReload((n) => n + 1) }}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-ivoire-green/10 px-3.5 py-1.5 text-xs font-bold text-ivoire-green-dark transition hover:bg-ivoire-green/15 active:scale-95"
            title="Cliquer pour verrouiller le tableau de bord"
          >
            🔓 {role.owner ? 'Déverrouillé' : 'Accès permanent'}
          </button>
        </div>
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-2 pb-2">
          {([['overview','Aperçu'],['visitors','Visiteurs'],['listings','Annonces'],['users','Utilisateurs'],['pro','Demandes Pro'],['reports','Signalements'],['contact','Contact'],['ads','Publicités'],['comptabilite','Comptabilité'],['orders','Commandes'],['conversations','Conversations'],['reviews','Avis'],['newsletter','Abonnés'],['campaigns','Campagnes'],['moderators','Modérateurs'],['emails','Emails'],['backup','Sauvegarde'],['automation','Tâches auto']] as [Tab,string][]).filter(([id]) => (id === 'comptabilite' ? role.owner : id === 'pro' ? canSee('users') : canSee(id))).map(([id,label]) => (
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
        {tab === 'pro' && <ProTab />}
        {tab === 'reports' && <ReportsTab onChanged={refreshStats} />}
        {tab === 'contact' && <ContactTab onChanged={refreshStats} />}
        {tab === 'ads' && <AdsTab onChanged={refreshStats} />}
        {tab === 'comptabilite' && role.owner && <ComptabiliteTab />}
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

/**
 * D'OÙ VIENNENT LES VISITEURS — pays et ville, par jour / semaine / mois.
 *
 * Les données arrivent de Cloudflare, qui géolocalise l'adresse IP et la pose
 * en en-têtes : le PAYS est toujours là, la VILLE seulement si le Patron a
 * activé « Add visitor location headers ». Quand la ville manque, on le DIT au
 * lieu de faire croire que personne ne vient de nulle part.
 */
const GEO_FENETRES: [GeoRange, string][] = [['day', 'Jour'], ['week', 'Semaine'], ['month', 'Mois']]

function VisiteursGeo() {
  const [range, setRange] = useState<GeoRange>('week')
  const [data, setData] = useState<GeoStats | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    let alive = true
    setData(null); setErr(false)
    fetchGeo(range).then((d) => { if (alive) setData(d) }).catch(() => { if (alive) setErr(true) })
    return () => { alive = false }
  }, [range])

  const maxPays = Math.max(1, ...(data?.pays ?? []).map((p) => p.visiteurs))

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-base font-bold text-ink">D’où viennent vos visiteurs</p>
          <p className="text-xs text-gray-500">Pays et ville, sur la période choisie.</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-0.5">
          {GEO_FENETRES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRange(id)}
              className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold transition ${
                range === id ? 'bg-white text-ink shadow-sm' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {err ? (
        <p className="py-6 text-center text-sm text-gray-500">Chargement impossible.</p>
      ) : !data ? (
        <p className="py-6 text-center text-sm text-gray-400">Chargement…</p>
      ) : data.visiteurs === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Aucune visite sur cette période.</p>
      ) : (
        <div className="mt-3 grid gap-5 md:grid-cols-2">
          {/* Les pays */}
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-gray-400">Pays</p>
            <ul className="space-y-2">
              {data.pays.map((p) => (
                <li key={p.code}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-gray-800">{p.nom}</span>
                    <span className="text-gray-500">{formatPrice(p.visiteurs)}</span>
                  </div>
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <span className="block h-full rounded-full bg-primary-500" style={{ width: `${Math.max(3, (p.visiteurs / maxPays) * 100)}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Les villes */}
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-gray-400">Villes</p>
            {data.villes.length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {data.villes.map((v, i) => (
                  <li key={`${v.code}-${v.ville}-${i}`} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="min-w-0 flex-1 truncate text-gray-800">
                      {v.ville} <span className="text-gray-400">· {v.pays}</span>
                    </span>
                    <span className="shrink-0 text-gray-500">{formatPrice(v.visiteurs)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl bg-cream-100/70 p-3 text-[12.5px] leading-snug text-gray-700">
                <p className="mb-1 font-semibold">Les villes ne sont pas encore disponibles.</p>
                Le pays est connu, mais pas la ville. Pour l’obtenir — c’est gratuit et
                en un clic : dans <b>Cloudflare → Rules → Settings → Managed Transforms</b>,
                activez <b>« Add visitor location headers »</b>. Les villes apparaîtront
                pour les visites suivantes.
              </div>
            )}
          </div>
        </div>
      )}

      {data && data.sansVille > 0 && data.villesActives && (
        <p className="mt-3 text-[11px] text-gray-400">
          {formatPrice(data.sansVille)} visite{data.sansVille > 1 ? 's' : ''} sans ville identifiée
          (réseau ou VPN masquant la localisation).
        </p>
      )}
    </div>
  )
}

/**
 * LE PARCOURS — quatre marches, et l'endroit où les gens s'arrêtent.
 *
 * Un tableau de bord qui affiche « 148 visiteurs · 12 comptes · 24 annonces »
 * ne dit rien : trois chiffres sans rapport entre eux. Mis bout à bout dans
 * l'ordre où une personne les traverse, les mêmes chiffres désignent une
 * marche précise — celle qu'il faut réparer cette semaine.
 *
 * Les trois dernières marches suivent la COHORTE des comptes créés dans la
 * fenêtre choisie, pas l'activité de la fenêtre : sinon un vendeur inscrit
 * l'an dernier gonflerait le « ont publié » des sept derniers jours.
 */
/* ---- L'aperçu façon CRM (maquette validée par le Patron le 27/08) --------- */

/** La flèche de tendance d'un chiffre clé, comparée à la période précédente. */
function ChipTendance({ n, prev, absolu = false }: { n: number; prev: number; absolu?: boolean }) {
  if (prev <= 0 && n <= 0) return <span className="chip-delta bg-cream-100 text-gray-500">—</span>
  if (prev <= 0) return <span className="chip-delta bg-emerald-50 text-emerald-700">▲ +{formatPrice(n)}</span>
  const diff = n - prev
  if (absolu) {
    if (diff === 0) return <span className="chip-delta bg-cream-100 text-gray-500">=</span>
    return diff > 0
      ? <span className="chip-delta bg-emerald-50 text-emerald-700">▲ {formatPrice(diff)}</span>
      : <span className="chip-delta bg-red-50 text-red-600">▼ {formatPrice(Math.abs(diff))}</span>
  }
  const pct = Math.round((diff / prev) * 100)
  if (pct === 0) return <span className="chip-delta bg-cream-100 text-gray-500">=</span>
  return pct > 0
    ? <span className="chip-delta bg-emerald-50 text-emerald-700">▲ {pct} %</span>
    : <span className="chip-delta bg-red-50 text-red-600">▼ {Math.abs(pct)} %</span>
}

const JOURS_ABR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
function jourAbr(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`)
  return `${JOURS_ABR[d.getUTCDay()]} ${d.getUTCDate()}`
}

/** La courbe de l'aperçu : visiteurs uniques (ligne) et inscriptions (barres). */
function CourbeVisites({ serie }: { serie: { jour: string; visiteurs: number; inscrits: number }[] }) {
  const L = 660; const BAS = 168; const HAUT = 16; const G = 34
  const max = Math.max(5, ...serie.map((p) => Math.max(p.visiteurs, p.inscrits)))
  const cran = max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : max <= 100 ? 20 : max <= 250 ? 50 : 100
  const plafond = Math.ceil(max / cran) * cran
  const x = (i: number) => serie.length < 2 ? G : G + (i * (L - G - 12)) / (serie.length - 1)
  const y = (n: number) => BAS - (n / plafond) * (BAS - HAUT)
  const pts = serie.map((p, i) => `${x(i).toFixed(1)},${y(p.visiteurs).toFixed(1)}`).join(' ')
  const dernier = serie[serie.length - 1]
  const pas = serie.length > 10 ? 5 : 1
  return (
    <svg viewBox="0 0 660 232" className="mt-2 w-full" role="img"
      aria-label="Visiteurs uniques et inscriptions, jour par jour">
      <defs>
        <linearGradient id="aire-admin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F77F00" stopOpacity=".22" />
          <stop offset="1" stopColor="#F77F00" stopOpacity=".02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={G} x2={648} y1={BAS - f * (BAS - HAUT)} y2={BAS - f * (BAS - HAUT)}
          stroke="#EFE6D7" strokeWidth="1" />
      ))}
      {[0, 0.5, 1].map((f) => (
        <text key={`y${f}`} x={G - 6} y={BAS - f * (BAS - HAUT) + 3.5} fontSize="10"
          fill="#9A9287" textAnchor="end" className="tnum">{Math.round(f * plafond)}</text>
      ))}
      {serie.map((p, i) => p.inscrits > 0 ? (
        <rect key={p.jour} x={x(i) - 5} y={y(p.inscrits)} width="10" height={BAS - y(p.inscrits)}
          rx="2" fill="#009E60" opacity=".85" />
      ) : null)}
      {serie.length > 1 && (
        <>
          <path fill="url(#aire-admin)"
            d={`M${pts.split(' ').join(' L')} L${x(serie.length - 1)},${BAS} L${x(0)},${BAS} Z`} />
          <polyline fill="none" stroke="#F77F00" strokeWidth="2.5" strokeLinejoin="round" points={pts} />
        </>
      )}
      {dernier && dernier.visiteurs > 0 && (
        <>
          <circle cx={x(serie.length - 1)} cy={y(dernier.visiteurs)} r="4.5"
            fill="#F77F00" stroke="#fff" strokeWidth="2" />
          <text x={x(serie.length - 1)} y={y(dernier.visiteurs) - 9} fontSize="11" fontWeight="800"
            fill="#C05E00" textAnchor="middle" className="tnum">{dernier.visiteurs}</text>
        </>
      )}
      {serie.map((p, i) => {
        const fin = i === serie.length - 1
        if (!fin && i % pas !== 0) return null
        return (
          <text key={`e${p.jour}`} x={x(i)} y={226} fontSize="10.5" textAnchor="middle"
            fill={fin ? '#1B1A17' : '#6B6459'} fontWeight={fin ? 800 : 400}>
            {fin ? 'auj.' : jourAbr(p.jour)}
          </text>
        )
      })}
    </svg>
  )
}

/** Le parcours — où ça fuit. Quatre marches en barres, la fenêtre suit le
 *  sélecteur de période de l'aperçu, et la note désigne la marche à réparer. */
function Parcours({ p, fenetre }: { p: NonNullable<AdminStats['parcours']>; fenetre: 'j7' | 'j30' }) {
  const d = p[fenetre]
  const marches = [
    { e: '🚶', label: 'Arrivés', n: d.visiteurs, de: null as number | null },
    { e: '👥', label: 'Inscrits', n: d.comptes, de: d.visiteurs },
    { e: '📦', label: 'Ont publié', n: d.publie, de: d.comptes },
    { e: '🤝', label: 'Ont vendu', n: d.vendu, de: d.publie },
  ]
  const plafond = Math.max(1, ...marches.map((m) => m.n))
  // La marche la plus coûteuse : celle qui perd le plus de MONDE, pas le plus
  // gros pourcentage. Perdre 136 personnes sur 148 compte plus que perdre 4
  // vendeurs sur 5, même si le second fait 80 %.
  let pire: { i: number; perdus: number } | null = null
  marches.forEach((m, i) => {
    if (m.de === null || m.de === 0) return
    const perdus = m.de - m.n
    if (perdus > 0 && (!pire || perdus > pire.perdus)) pire = { i, perdus }
  })
  const goulot = pire as { i: number; perdus: number } | null
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
      <p className="font-display text-[15px] font-extrabold text-ink">Le parcours — où ça fuit</p>
      <p className="mt-0.5 text-xs text-gray-500">
        Les {fenetre === 'j7' ? 7 : 30} derniers jours, marche par marche
      </p>
      <div className="mt-3 space-y-2">
        {marches.map((m) => {
          const taux = m.de && m.de > 0 ? Math.round((m.n / m.de) * 100) : null
          return (
            <div key={m.label} className="flex items-center gap-2.5">
              <span className="w-24 shrink-0 text-xs font-bold text-gray-600">{m.e} {m.label}</span>
              <span className="h-[26px] flex-1 overflow-hidden rounded-lg bg-cream-100">
                {m.n > 0 ? (
                  <span
                    className="tnum flex h-full min-w-[30px] items-center justify-end rounded-lg bg-gradient-to-r from-primary-500 to-primary-700 px-2 text-xs font-extrabold text-white"
                    style={{ width: `${Math.max(9, (m.n / plafond) * 100)}%` }}>
                    {formatPrice(m.n)}
                  </span>
                ) : (
                  <span className="flex h-full items-center px-2 text-xs font-bold text-gray-400">0</span>
                )}
              </span>
              <span className="tnum w-9 shrink-0 text-right text-[11px] text-gray-400">
                {taux !== null ? `${taux} %` : ''}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 flex-1 rounded-xl bg-cream-100/70 px-3 py-2 text-[12.5px] leading-snug text-gray-700">
        {d.visiteurs === 0 && d.comptes === 0 ? (
          <>Aucune donnée sur cette période — élargissez à 30 jours.</>
        ) : goulot === null ? (
          <>Aucune perte mesurable sur cette période.</>
        ) : (
          <>
            <b>La marche à réparer</b> : {formatPrice(marches[goulot.i].de ?? 0)} arrivent à
            « {marches[goulot.i - 1].label} », {formatPrice(marches[goulot.i].n)} passent à
            « {marches[goulot.i].label} ».
            {goulot.i === 1 && ' Chaque % gagné ici vaut plus que tout le reste.'}
            {goulot.i === 2 && ' Des gens s’inscrivent puis ne publient rien : écrivez-leur (Utilisateurs → « Sans annonce »).'}
            {goulot.i === 3 && ' Des annonces existent mais ne se vendent pas : prix, photos, ou pas assez d’acheteurs.'}
          </>
        )}
      </p>
    </div>
  )
}

function Overview({ stats, onGo, canSee, owner, email }: {
  stats: AdminStats
  onGo: (t: Tab) => void
  canSee: (t: Tab) => boolean
  owner: boolean
  email: string
}) {
  const { user } = useAuth()
  const [periode, setPeriode] = useState<'j7' | 'j30'>('j7')
  const jours = periode === 'j7' ? 7 : 30

  // « Bonsoir, Abraham » : le nom du profil s'il existe, sinon le début de
  // l'email (fatou.moderation@… → Fatou).
  const heure = new Date().getHours()
  const salut = heure >= 18 || heure < 5 ? 'Bonsoir' : 'Bonjour'
  const depuisEmail = (email.split('@')[0] || '').split(/[._-]/)[0]
  const nom = (user?.user_metadata?.full_name || '').trim()
    || (depuisEmail ? depuisEmail[0].toUpperCase() + depuisEmail.slice(1) : '')
  const dateJour = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const sec = stats.security
  const santeOk = sec ? sec.adminsIntegrity !== false && sec.alerts === 0 : null

  const allowed = Object.keys(PERM_LABELS).filter((k) => canSee(k as Tab)).map((k) => PERM_LABELS[k])
  const firstName = depuisEmail ? depuisEmail[0].toUpperCase() + depuisEmail.slice(1) : ''

  // La file « à traiter » : chaque ligne respecte la permission de son onglet.
  const at = stats.aTraiter
  const dossiers: { n: number; titre: string; sous: string; action: string; tab: Tab; rouge?: boolean }[] = []
  if (canSee('reports')) {
    const n = stats.reportsOpen ?? 0
    dossiers.push({
      n, rouge: n > 0, titre: n > 1 ? 'Signalements ouverts' : 'Signalement ouvert',
      sous: at && at.signalementsVieux > 0 ? `dont ${at.signalementsVieux} depuis plus de 48 h`
        : n > 0 ? 'à examiner' : 'rien en attente',
      action: 'Traiter', tab: 'reports',
    })
  }
  if (canSee('users') && at?.proEnAttente != null) {
    dossiers.push({
      n: at.proEnAttente, titre: at.proEnAttente > 1 ? 'Demandes de compte Pro' : 'Demande de compte Pro',
      sous: at.proEnAttente > 0 && at.proDernier
        ? `« ${at.proDernier.nom} », ${timeAgo(at.proDernier.quand)}` : 'rien en attente',
      action: 'Examiner', tab: 'pro',
    })
  }
  if (canSee('contact') && stats.contactOpen != null) {
    dossiers.push({
      n: stats.contactOpen, titre: stats.contactOpen > 1 ? 'Messages de contact' : 'Message de contact',
      sous: stats.contactOpen > 0 && at?.contactDernier ? `reçu ${timeAgo(at.contactDernier)}` : 'rien en attente',
      action: 'Répondre', tab: 'contact',
    })
  }
  if (canSee('ads') && stats.adsPending != null) {
    dossiers.push({
      n: stats.adsPending, titre: 'Publicités en attente',
      sous: stats.adsPending > 0 ? 'à valider' : 'rien à valider',
      action: 'Valider', tab: 'ads',
    })
  }
  const totalDossiers = dossiers.reduce((s, d) => s + d.n, 0)

  // Les chiffres clés de la période, chacun derrière sa permission.
  const t = stats.tendances?.[periode]
  const kpis: { icone: string; val: string; lib: string; chip: ReactNode; tab: Tab }[] = []
  if (t) {
    if (canSee('visitors')) kpis.push({ icone: '🚶', val: formatPrice(t.visiteurs.n), lib: `Visiteurs (${jours} j)`, chip: <ChipTendance n={t.visiteurs.n} prev={t.visiteurs.prev} />, tab: 'visitors' })
    if (canSee('users')) kpis.push({ icone: '👥', val: formatPrice(t.inscrits.n), lib: 'Nouveaux inscrits', chip: <ChipTendance n={t.inscrits.n} prev={t.inscrits.prev} absolu />, tab: 'users' })
    if (canSee('listings')) kpis.push({ icone: '📦', val: formatPrice(t.annonces.n), lib: 'Annonces publiées', chip: <ChipTendance n={t.annonces.n} prev={t.annonces.prev} absolu />, tab: 'listings' })
    if (canSee('orders')) kpis.push({ icone: '🤝', val: formatPrice(t.commandes.n), lib: 'Commandes', chip: <span className="chip-delta bg-cream-100 text-gray-500">{formatFCFA(t.commandes.valeur)}</span>, tab: 'orders' })
    if (canSee('reviews')) kpis.push({ icone: '⭐', val: stats.noteMoyenne?.note != null ? String(stats.noteMoyenne.note).replace('.', ',') : '—', lib: 'Note moyenne du site', chip: <span className="chip-delta bg-cream-100 text-gray-500">{stats.noteMoyenne?.avis ?? 0} avis</span>, tab: 'reviews' })
    if (canSee('newsletter')) kpis.push({ icone: '📧', val: formatPrice(stats.newsletter), lib: 'Abonnés newsletter', chip: <ChipTendance n={t.abonnes.n} prev={t.abonnes.prev} absolu />, tab: 'newsletter' })
  }

  // La courbe : 30 jours reçus, on n'en montre que la période choisie.
  const serie = (stats.serieVisites ?? []).slice(-jours)

  // L'activité récente : dernières inscriptions et dernières annonces mêlées.
  const activite: { quand: number; icone: string; fond: string; titre: string; sous: string }[] = [
    ...(stats.recentUsers ?? []).map((ru) => ({
      quand: ru.createdAt, icone: '👥', fond: 'bg-emerald-50',
      titre: `Nouvelle inscription — ${ru.fullName}`, sous: ru.email,
    })),
    ...(canSee('listings') ? (stats.recentListings ?? []).map((l) => ({
      quand: l.createdAt, icone: '📦', fond: 'bg-cream-100',
      titre: `Nouvelle annonce — « ${l.title} »`,
      sous: `${formatFCFA(l.price)}${l.commune ? ` · ${l.commune}` : ''}`,
    })) : []),
  ].sort((a, b) => b.quand - a.quand).slice(0, 6)

  const statusPill = (s?: string): [string, string] =>
    s === 'blocked'
      ? ['BLOQUÉ', 'bg-red-50 text-red-600']
      : s === 'restricted'
        ? ['RESTREINT', 'bg-amber-50 text-amber-700']
        : ['ACTIF', 'bg-ivoire-green/10 text-ivoire-green-dark']

  return (
    <div className="space-y-3">
      {/* Le bandeau sombre : bonjour, l'état du jour, la période. */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1B1A17] to-[#3A3630] p-5 text-white shadow-card md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider">
              🛡️ Tableau de bord
            </span>
            <p className="mt-3 font-display text-2xl font-extrabold leading-tight md:text-3xl">
              {salut}{nom ? `, ${nom}` : ''}
            </p>
            <p className="mt-1 text-sm text-white/80">Voici Chap.ci aujourd’hui — et ce qui vous attend.</p>
            <p className="mt-0.5 text-xs text-white/60">
              {dateJour}
              {santeOk === true && ' · Tout fonctionne ✓'}
              {santeOk === false && ' · ⚠ Sécurité à vérifier'}
            </p>
          </div>
          <div className="flex self-stretch rounded-full bg-white/15 p-1 sm:self-auto">
            {([['j7', '7 jours'], ['j30', '30 jours']] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setPeriode(id)}
                className={`flex-1 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-bold transition sm:flex-none ${
                  periode === id ? 'bg-white text-ink' : 'text-white/85'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vue modérateur : note de bienvenue personnalisée. */}
      {!owner && (
        <div className="rounded-r-xl border-l-[3px] border-primary-500 bg-[#FFF6EC] px-3.5 py-3 text-[13px] leading-relaxed text-gray-700">
          👋 Bonjour{firstName ? ` ${firstName}` : ''}. Vous voyez <b>uniquement</b> les fonctions autorisées
          par l’administrateur{allowed.length > 0 ? <> : {allowed.map((l, i) => <span key={l}>{i > 0 && ', '}<b>{l}</b></span>)}</> : null}.
          Le reste (utilisateurs, sauvegarde, clé cron…) reste réservé au propriétaire.
        </div>
      )}

      {/* La file « à traiter » : chaque dossier avec son bouton direct. */}
      {dossiers.length > 0 && (
        <div className="rounded-2xl border border-[#F3D9B8] bg-cream-100 p-4 md:p-5">
          <p className="font-display text-[15px] font-extrabold text-ink">
            {totalDossiers > 0
              ? `⏳ ${totalDossiers} dossier${totalDossiers > 1 ? 's' : ''} attend${totalDossiers > 1 ? 'ent' : ''} une décision`
              : '✅ Rien n’attend de décision'}
          </p>
          <div className="mt-1">
            {dossiers.map((d, i) => (
              <div key={d.titre}
                className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-[#F3D9B8]' : ''}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-extrabold text-white ${
                  d.n === 0 ? 'bg-[#D8D0C2]' : d.rouge ? 'bg-red-600' : 'bg-primary-500'}`}>
                  {d.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-ink">{d.titre}</span>
                  <span className="block truncate text-[11px] text-gray-500">{d.sous}</span>
                </span>
                {d.n > 0 && (
                  <button type="button" onClick={() => onGo(d.tab)}
                    className="shrink-0 rounded-xl border border-[#F3D9B8] bg-white px-3 py-1.5 text-xs font-extrabold text-primary-700">
                    {d.action} →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Les chiffres clés de la période, chacun avec sa tendance. */}
      {kpis.length > 0 && (
        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${kpis.length >= 6 ? 'xl:grid-cols-6' : ''}`}>
          {kpis.map((k) => (
            <button key={k.lib} type="button" onClick={() => onGo(k.tab)}
              className="rounded-2xl border border-line bg-white p-3.5 text-left shadow-card transition hover:shadow-md active:scale-[0.98]">
              <span aria-hidden>{k.icone}</span>
              <p className="tnum mt-1.5 font-display text-xl font-extrabold leading-tight text-ink">{k.val}</p>
              <p className="text-[11px] text-gray-500">{k.lib}</p>
              <p className="mt-1">{k.chip}</p>
            </button>
          ))}
        </div>
      )}

      {/* La courbe visiteurs + inscriptions, et le parcours. */}
      {(serie.length > 0 || (owner && stats.parcours)) && (
        <div className="grid gap-3 lg:grid-cols-3">
          {serie.length > 0 && (
            <div className={`flex flex-col rounded-2xl border border-line bg-white p-4 shadow-card md:p-5 ${
              owner && stats.parcours ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[15px] font-extrabold text-ink">Visiteurs et inscriptions</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {jours} derniers jours · public uniquement (équipe exclue)
                  </p>
                </div>
                <div className="flex gap-3 text-[11.5px] font-semibold text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-primary-500" />Visiteurs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-ivoire-green" />Inscriptions
                  </span>
                </div>
              </div>
              <div className="grid flex-1 content-center"><CourbeVisites serie={serie} /></div>
            </div>
          )}
          {owner && stats.parcours && <Parcours p={stats.parcours} fenetre={periode} />}
        </div>
      )}

      {/* L'activité récente du site, et la carte Sécurité (propriétaire). */}
      {(activite.length > 0 || (owner && sec)) && (
        <div className={`grid gap-3 ${activite.length > 0 && owner && sec ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
          {activite.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
              <p className="font-display text-[15px] font-extrabold text-ink">Activité récente</p>
              <div className="mt-2">
                {activite.map((e, i) => (
                  <div key={`${e.quand}-${i}`}
                    className={`flex items-start gap-2.5 py-2 ${i > 0 ? 'border-t border-line' : ''}`}>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] ${e.fond}`} aria-hidden>
                      {e.icone}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-ink">{e.titre}</span>
                      <span className="block truncate text-[11px] text-gray-500">{e.sous}</span>
                    </span>
                    <span className="whitespace-nowrap pt-0.5 text-[10.5px] text-gray-400">{timeAgo(e.quand)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {owner && sec && (
            <div className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
              <p className="font-display text-[15px] font-extrabold text-ink">🔐 Sécurité</p>
              <div className="mt-2">
                {([
                  ['Intégrité des administrateurs',
                    sec.adminsIntegrity === false ? 'table modifiée hors interface' : 'aucune modification hors interface',
                    sec.adminsIntegrity !== false],
                  ['Connexions échouées (7 j)',
                    sec.failedLogins > 0 ? `${sec.failedLogins} tentative${sec.failedLogins > 1 ? 's' : ''}` : 'aucune',
                    sec.failedLogins === 0],
                  ['2FA du propriétaire', sec.owner2fa ? 'active' : 'inactive — activez-la', sec.owner2fa],
                  ['Alertes e-mail (7 j)', sec.alerts > 0 ? `${sec.alerts} alerte${sec.alerts > 1 ? 's' : ''}` : 'aucune', sec.alerts === 0],
                ] as [string, string, boolean][]).map(([titre, sous, ok], i) => (
                  <div key={titre} className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-line' : ''}`}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-ink">{titre}</span>
                      <span className="block truncate text-[11px] text-gray-500">{sous}</span>
                    </span>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${
                      ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {ok ? '✓' : '!'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* D'où viennent les visiteurs — pays et ville, par jour / semaine / mois. */}
      {owner && <VisiteursGeo />}

      {/* Vues de pages — graphique intelligent (permission « Visiteurs »). */}
      {canSee('visitors') && <PageViewsCard />}

      {/* Vue modérateur : signalements ouverts à traiter. */}
      {!owner && canSee('reports') && <ModoReportsPanel onGo={onGo} />}

      {/* Derniers utilisateurs (permission « Utilisateurs »). */}
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

      <p className="px-1 text-center text-xs leading-relaxed text-gray-400">
        Chiffres réels du site, équipe exclue des visites · Les tendances comparent
        la période choisie à la précédente
      </p>
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
/** Courbe simple, une seule série — pour les statistiques d'une annonce. */
function AreaChart({ values }: { values: number[] }) {
  const W = 320, H = 120, pad = 8
  const max = Math.max(1, ...values)
  const n = Math.max(1, values.length)
  const x = (i: number) => pad + (n === 1 ? 0 : (i / (n - 1)) * (W - 2 * pad))
  const y = (v: number) => H - pad - (v / max) * (H - 2 * pad)
  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F77F00" stopOpacity="0.35" />
          <stop offset="1" stopColor="#F77F00" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${x(0)},${H - pad} ${line} ${x(n - 1)},${H - pad}`} fill="url(#areaGrad)" />
      <polyline points={line} fill="none" stroke="#F77F00" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ---------- La courbe d'audience ----------
//
// POURQUOI ELLE A ÉTÉ REFAITE. L'ancienne montrait UNE série à la fois, sans
// échelle, sans date lisible, avec trois étiquettes en bas. On y voyait une
// forme, jamais un chiffre : impossible de dire ce qu'avait donné un mardi.
// Et surtout, elle ne montrait pas les inscriptions — or le problème du site
// n'est pas le trafic, c'est ce qu'il devient.
//
// CE QU'ELLE MONTRE MAINTENANT, ensemble et sur la même journée :
//   · les VISITEURS uniques, en aire orange — le volume brut ;
//   · la TENDANCE sur 7 tranches, en trait plein — parce qu'à ces volumes une
//     variation d'un jour à l'autre est du bruit, pas un signal. C'est la seule
//     ligne qu'on ait le droit de lire comme une tendance ;
//   · les INSCRIPTIONS, en barres vertes, sur LEUR PROPRE ÉCHELLE. Mélanger
//     des dizaines de visiteurs et deux inscrits sur un même axe écrase les
//     seconds à hauteur de zéro : la courbe mentirait par construction.
//
// Et elle se lit : on touche ou on survole une tranche, on obtient la date et
// les trois chiffres exacts de CE jour-là.
function CourbeAudience({ points, range, mesureDepuis }: { points: VisitPoint[]; range: VisitRange; mesureDepuis: string | null }) {
  const [actif, setActif] = useState<number | null>(null)

  // LA COURBE PREND TOUTE LA LARGEUR DISPONIBLE.
  // Un viewBox figé se centre en gardant ses proportions : sur un écran large,
  // le dessin restait petit au milieu de deux marges vides. On mesure donc la
  // largeur réelle du conteneur — une unité SVG vaut alors un pixel, les
  // textes font la taille qu'on leur donne, et rien n'est déformé.
  const boite = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(360)
  useEffect(() => {
    const el = boite.current
    if (!el) return
    const maj = () => setW(Math.max(280, Math.round(el.clientWidth)))
    maj()
    const ro = new ResizeObserver(maj)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const H = 260, padX = 16, padHaut = 20, padBas = 34
  const n = Math.max(1, points.length)

  const visiteurs = points.map((p) => p.visitors)
  const inscrits = points.map((p) => p.signups)
  const maxV = Math.max(1, ...visiteurs)
  const maxI = Math.max(1, ...inscrits)

  const x = (i: number) => padX + (n === 1 ? W / 2 : (i / (n - 1)) * (W - 2 * padX))
  const yV = (v: number) => padHaut + (1 - v / maxV) * (H - padHaut - padBas)
  const hautBarre = (v: number) => (v / maxI) * (H - padHaut - padBas) * 0.55

  // CE QUI N'A PAS ÉTÉ MESURÉ N'EST PAS DESSINÉ.
  // Les tranches antérieures à la première visite enregistrée ne valent pas
  // zéro : on n'en sait rien. Les tracer au ras du sol se lit comme une audience
  // nulle, puis comme un décollage spectaculaire — deux mensonges pour le prix
  // d'un. La zone est grisée, et la courbe COMMENCE au premier jour mesuré.
  const debutMesure = mesureDepuis ? mesureDepuis.slice(0, 10) : null
  const avantMesure = (p: VisitPoint) => (debutMesure && range === 'day' ? p.key < debutMesure : false)
  const i0 = Math.max(0, points.findIndex((p) => !avantMesure(p)))
  const largeurGrise = i0 > 0 ? x(i0) - padX : 0

  /**
   * Moyenne mobile centrée sur 7 tranches : le bruit s'annule, la pente reste.
   * Elle ne regarde QUE les tranches mesurées — inclure les jours d'avant le
   * compteur, comptés zéro, écraserait la tendance de départ vers le bas.
   */
  const tendance = visiteurs.map((_, i) => {
    if (i < i0) return 0
    const a = Math.max(i0, i - 3), b = Math.min(n - 1, i + 3)
    let s = 0
    for (let k = a; k <= b; k++) s += visiteurs[k]
    return s / (b - a + 1)
  })

  /** Ne trace que la partie mesurée de la série. */
  const ligne = (vals: number[]) =>
    vals.slice(i0).map((v, k) => `${x(i0 + k).toFixed(1)},${yV(v).toFixed(1)}`).join(' ')
  const aire = `${x(i0)},${H - padBas} ${ligne(visiteurs)} ${x(n - 1)},${H - padBas}`

  const jourLong = (p: VisitPoint) => {
    if (range !== 'day') return p.label
    const d = new Date(`${p.key}T12:00:00Z`)
    return Number.isNaN(d.getTime()) ? p.label : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const surPointeur = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const r = svg.getBoundingClientRect()
    const cx = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    if (cx == null || r.width === 0) return
    const rel = ((cx - r.left) / r.width) * W
    const i = Math.round(((rel - padX) / Math.max(1, W - 2 * padX)) * (n - 1))
    setActif(Math.min(n - 1, Math.max(0, i)))
  }

  const p = actif != null ? points[actif] : null

  return (
    <div className="relative" ref={boite}>
      <svg
        viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block touch-none"
        onMouseMove={surPointeur} onMouseLeave={() => setActif(null)}
        onTouchStart={surPointeur} onTouchMove={surPointeur} onTouchEnd={() => setActif(null)}
        role="img"
        aria-label={`Audience par ${range === 'day' ? 'jour' : range === 'week' ? 'semaine' : range === 'month' ? 'mois' : 'année'} : ${points.length} points, maximum ${maxV} visiteurs.`}
      >
        <defs>
          <linearGradient id="audienceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F77F00" stopOpacity="0.28" />
            <stop offset="1" stopColor="#F77F00" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Repères horizontaux : une courbe sans échelle ne se lit pas. */}
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={padX} x2={W - padX} y1={yV(maxV * f)} y2={yV(maxV * f)} className="stroke-line" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <text x={padX} y={yV(maxV * f) - 5} fontSize="12" className="fill-gray-500">{Math.round(maxV * f)}</text>
          </g>
        ))}

        {largeurGrise > 0 && (
          <rect x={padX} y={padHaut} width={largeurGrise} height={H - padHaut - padBas} className="fill-line" opacity="0.5" />
        )}

        {/* Inscriptions : barres vertes, échelle propre, ancrées en bas. */}
        {points.map((pt, i) => pt.signups > 0 && (
          <rect
            key={`i${i}`} x={x(i) - 5} width="10"
            y={H - padBas - hautBarre(pt.signups)} height={hautBarre(pt.signups)}
            rx="2.5" className="fill-ivoire-green" opacity={actif === i ? 1 : 0.75}
          />
        ))}

        <polygon points={aire} fill="url(#audienceGrad)" />
        <polyline points={ligne(visiteurs)} fill="none" className="stroke-primary-500" strokeWidth="2" strokeOpacity="0.55" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polyline points={ligne(tendance)} fill="none" className="stroke-ivoire-orange-dark" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {actif != null && (
          <g>
            <line x1={x(actif)} x2={x(actif)} y1={padHaut} y2={H - padBas} className="stroke-accent-ocre-dark" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <circle cx={x(actif)} cy={yV(visiteurs[actif])} r="6" className="fill-primary-500 stroke-white" strokeWidth="2.5" />
          </g>
        )}

        {/* Dates : première, milieu, dernière — lisibles, pas décoratives. */}
        {[0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <text key={`d${i}`} x={x(i)} y={H - 10} fontSize="13" className="fill-gray-500" textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
            {points[i]?.label}
          </text>
        ))}
      </svg>

      {/* Lecture d'une tranche : la date en toutes lettres et les chiffres exacts. */}
      <div className="mt-3 min-h-[4rem] rounded-xl bg-cream-200 px-4 py-3 text-sm">
        {p ? (
          <>
            <p className="text-base font-semibold text-ink first-letter:uppercase">{jourLong(p)}</p>
            <p className="mt-0.5 text-gray-700">
              <b>{formatPrice(p.visitors)}</b> visiteur{p.visitors > 1 ? 's' : ''} ·{' '}
              <b>{formatPrice(p.views)}</b> page{p.views > 1 ? 's' : ''} vue{p.views > 1 ? 's' : ''} ·{' '}
              <b className="text-ivoire-green-dark">{formatPrice(p.signups)}</b> inscrit{p.signups > 1 ? 's' : ''} ·{' '}
              <b>{formatPrice(p.listings)}</b> annonce{p.listings > 1 ? 's' : ''}
            </p>
          </>
        ) : (
          <p className="text-gray-600">
            Touchez la courbe pour lire une {range === 'day' ? 'journée' : range === 'week' ? 'semaine' : range === 'month' ? 'mois' : 'année'} précise.
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-primary-500 opacity-60" /> Visiteurs</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-ivoire-orange-dark" /> Tendance (7 tranches)</span>
        <span className="flex items-center gap-1.5"><span className="h-4 w-2 rounded-sm bg-ivoire-green" /> Inscriptions</span>
      </div>
    </div>
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
  const [data, setData] = useState<VisitStats | null>(null)
  const [rt, setRt] = useState<ResponseTime | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => { setData(null); setErr(''); fetchVisits(range).then(setData).catch((e) => setErr((e as Error).message)) }, [range])
  useEffect(() => { fetchResponseTime().then(setRt).catch(() => {}) }, [])

  const s = data?.series ?? []

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
          {/* L'ENTONNOIR, dans l'ordre où on le perd : voir → s'inscrire → publier. */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="font-display text-2xl font-bold text-gray-900">{formatPrice(data.totalVisitors)}</p>
              <p className="text-xs text-gray-500">Visiteurs uniques</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="font-display text-2xl font-bold text-gray-900">{formatPrice(data.totalViews)}</p>
              <p className="text-xs text-gray-500">Pages vues</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="font-display text-2xl font-bold text-ivoire-green-dark">{formatPrice(data.totalSignups)}</p>
              <p className="text-xs text-gray-500">Nouveaux inscrits</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="font-display text-2xl font-bold text-gray-900">{formatPrice(data.totalListings)}</p>
              <p className="text-xs text-gray-500">Annonces publiées</p>
            </div>
          </div>

          {/* Ces chiffres ne comptent QUE le public. L'équipe et les comptes
              connectés (dont les testeurs) sont exclus — sinon le Patron qui
              rafraîchit son tableau de bord se comptait lui-même par dizaines. */}
          <p className="-mt-1 px-1 text-[11px] leading-snug text-gray-500">
            Chiffres du <b className="font-semibold">public</b> : votre équipe et les comptes
            connectés (dont vos testeurs) ne sont pas comptés.
          </p>

          {/* LE TAUX QU'IL FAUT REGARDER. Il est calculé, pas estimé : sur la
              période affichée, combien de visiteurs uniques ont fini par créer
              un compte. À ces volumes on le donne en clair, jamais arrondi. */}
          {data.totalVisitors > 0 && (
            <div className="rounded-2xl border border-line2 bg-cream-200 px-4 py-3">
              <p className="text-sm text-ink">
                <b>{formatPrice(data.totalSignups)}</b> inscription{data.totalSignups > 1 ? 's' : ''} pour{' '}
                <b>{formatPrice(data.totalVisitors)}</b> visiteur{data.totalVisitors > 1 ? 's' : ''} uniques
                {data.totalSignups > 0 && (
                  <> — soit 1 sur {Math.round(data.totalVisitors / data.totalSignups)}</>
                )}.
              </p>
              <p className="mt-0.5 text-xs text-gray-600">
                {data.totalSignups === 0
                  ? 'Personne ne s’est inscrit sur cette période.'
                  : data.totalListings === 0
                    ? 'Des comptes se créent, mais aucune annonce n’est publiée : la marche à corriger est APRÈS l’inscription.'
                    : `Et ${formatPrice(data.totalListings)} annonce${data.totalListings > 1 ? 's' : ''} publiée${data.totalListings > 1 ? 's' : ''} au bout.`}
              </p>
            </div>
          )}

          {/* Courbe */}
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <TrendingUp size={16} className="text-primary-500" /> Visiteurs et inscriptions
              </p>
            </div>
            <CourbeAudience points={s} range={range} mesureDepuis={data.mesureDepuis} />
            {data.mesureDepuis && (
              <p className="mt-2 text-[11px] text-gray-600">
                Mesure commencée le{' '}
                {new Date(data.mesureDepuis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
                La zone grisée est antérieure : elle n’a pas été mesurée, elle n’est pas à zéro.
              </p>
            )}
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
/**
 * CONVERSATIONS — où le dialogue s'arrête.
 *
 * Deux cents fils listés par date ne disent rien. Ce qui compte pour l'équipe,
 * c'est le fil où l'ACHETEUR a écrit et où le vendeur n'a jamais répondu :
 * c'est là qu'un acheteur quitte le site, et c'est le seul endroit où une
 * relance sert à quelque chose.
 */
function ConversationsTab() {
  const [items, setItems] = useState<AdminConversation[] | null>(null)
  const [err, setErr] = useState('')
  const [vue, setVue] = useState('toutes')
  const [q, setQ] = useState('')
  const load = () => { setItems(null); setErr(''); fetchAdminConversations().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])
  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>

  const quand = (c: AdminConversation) => c.lastAt ?? c.createdAt
  const sans = items.filter((c) => c.sansReponse)
  // Sans réponse depuis plus de 48 h : au-delà, l'acheteur a écrit ailleurs.
  const vieilles = sans.filter((c) => Date.now() - quand(c) > 2 * 86400_000)
  const muettes = items.filter((c) => c.messages === 0)
  const totalMsg = items.reduce((s2, c) => s2 + c.messages, 0)

  let liste = vue === 'sans' ? sans : vue === 'vieilles' ? vieilles : vue === 'muettes' ? muettes : items
  if (q) liste = liste.filter((c) =>
    contient(c.listingTitle, q) || contient(c.buyerEmail, q) || contient(c.sellerEmail, q)
    || contient(c.lastMessage, q))
  liste = [...liste].sort((a, b) => quand(b) - quand(a))

  return (
    <div className="space-y-3">
      <KpisCrm>
        <KpiCrm valeur={formatPrice(items.length)} libelle="conversations" />
        <KpiCrm valeur={formatPrice(totalMsg)} libelle="messages" />
        <KpiCrm valeur={formatPrice(sans.length)} libelle="sans réponse" sous="le vendeur n’a pas écrit"
          ton={sans.length > 0 ? 'alerte' : 'bon'} />
        <KpiCrm valeur={items.length ? `${Math.round((1 - sans.length / items.length) * 100)} %` : '—'}
          libelle="ont eu une réponse" />
      </KpisCrm>

      <AttenteCrm n={vieilles.length}
        phrase={`${vieilles.length} acheteur${vieilles.length > 1 ? 's' : ''} ${vieilles.length > 1 ? 'attendent' : 'attend'} une réponse depuis plus de 48 h`}
        action={<button onClick={() => setVue('vieilles')}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-extrabold text-white">Les voir</button>} />

      <PucesCrm valeur={vue} onChange={setVue} puces={[
        { id: 'toutes', label: 'Toutes', n: items.length },
        ...(sans.length > 0 ? [{ id: 'sans', label: 'Sans réponse', n: sans.length, alerte: true }] : []),
        ...(vieilles.length > 0 ? [{ id: 'vieilles', label: 'Plus de 48 h', n: vieilles.length, alerte: true }] : []),
        ...(muettes.length > 0 ? [{ id: 'muettes', label: 'Jamais écrit', n: muettes.length }] : []),
      ]} />

      <BarreCrm q={q} onQ={setQ} placeholder="Chercher une annonce, un e-mail, un mot…" />

      {liste.length === 0 ? <Empty>Aucune conversation dans cette vue.</Empty> : liste.map((c) => (
        <div key={c.id} className={`rounded-2xl bg-white p-3 shadow-card ${c.sansReponse ? 'ring-1 ring-red-200' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-gray-800">{c.listingTitle || 'Conversation'}</p>
            <span className="flex shrink-0 items-center gap-1.5">
              {c.sansReponse && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-red-600">
                  sans réponse
                </span>
              )}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{c.messages} msg</span>
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">{c.buyerEmail || '—'} ↔ {c.sellerEmail || '—'}</p>
          {c.lastMessage && <p className="mt-1 truncate rounded-lg bg-gray-50 px-2 py-1 text-xs text-gray-600">« {c.lastMessage} »</p>}
          <p className="mt-1 text-[11px] text-gray-400">
            {c.messages === 0 ? 'ouverte ' : 'dernier message '}{timeAgo(quand(c))}
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * AVIS — la réputation du site, et ce qui l'abîme.
 *
 * Ce qu'on vient chercher ici n'est pas la moyenne : ce sont les avis à une ou
 * deux étoiles. Un vendeur qui en accumule est un problème qui grandit, et il
 * se voit d'un coup d'œil quand on peut filtrer dessus.
 */
function ReviewsTab() {
  const [items, setItems] = useState<AdminReview[] | null>(null)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('tous')
  const [q, setQ] = useState('')
  const load = () => { setItems(null); setErr(''); fetchAdminReviews().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])
  const remove = async (r: AdminReview) => {
    if (!confirm('Supprimer cet avis ?')) return
    try { await deleteAdminReview(r.id); setItems((p) => (p ?? []).filter((x) => x.id !== r.id)) }
    catch (e) { alert((e as Error).message) }
  }
  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>

  const moyenne = items.length
    ? (items.reduce((s2, r) => s2 + r.rating, 0) / items.length).toFixed(1).replace('.', ',')
    : '—'
  const mauvais = items.filter((r) => r.rating <= 2)
  const bons = items.filter((r) => r.rating >= 4)
  // Les vendeurs qui accumulent les mauvaises notes : deux, et c'est un motif
  // de regarder le compte de plus près.
  const parVendeur = new Map<string, number>()
  for (const r of mauvais) {
    const v = r.sellerEmail ?? ''
    if (v) parVendeur.set(v, (parVendeur.get(v) ?? 0) + 1)
  }
  const recidivistes = [...parVendeur.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])

  let liste = note === 'mauvais' ? mauvais : note === 'bons' ? bons : items
  if (q) liste = liste.filter((r) =>
    contient(r.reviewerName, q) || contient(r.reviewerEmail, q)
    || contient(r.sellerEmail, q) || contient(r.listingTitle, q) || contient(r.comment, q))

  return (
    <div className="space-y-3">
      <KpisCrm>
        <KpiCrm valeur={moyenne} libelle="note moyenne" sous="sur 5" ton={items.length && Number(moyenne.replace(',', '.')) >= 4 ? 'bon' : 'neutre'} />
        <KpiCrm valeur={formatPrice(items.length)} libelle="avis" />
        <KpiCrm valeur={formatPrice(mauvais.length)} libelle="1 ou 2 étoiles"
          ton={mauvais.length > 0 ? 'alerte' : 'neutre'} />
        <KpiCrm valeur={formatPrice(recidivistes.length)} libelle="vendeurs à surveiller"
          sous="2 mauvais avis ou plus" ton={recidivistes.length > 0 ? 'alerte' : 'neutre'} />
      </KpisCrm>

      {recidivistes.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5">
          <p className="text-[13px] font-bold text-red-800">Vendeurs qui accumulent les mauvaises notes</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-red-700">
            {recidivistes.slice(0, 5).map(([mail, n]) => `${mail} (${n})`).join(' · ')}
          </p>
          <p className="mt-1 text-[11.5px] text-red-700/80">
            Cherchez leur adresse dans l’onglet Utilisateurs pour voir leur fiche complète.
          </p>
        </div>
      )}

      <PucesCrm valeur={note} onChange={setNote} puces={[
        { id: 'tous', label: 'Tous', n: items.length },
        ...(mauvais.length > 0 ? [{ id: 'mauvais', label: '1–2 étoiles', n: mauvais.length, alerte: true }] : []),
        { id: 'bons', label: '4–5 étoiles', n: bons.length },
      ]} />

      <BarreCrm q={q} onQ={setQ} placeholder="Chercher un auteur, un vendeur, une annonce…" />

      {liste.length === 0 ? <Empty>Aucun avis dans cette vue.</Empty> : liste.map((r) => (
        <div key={r.id} className={`rounded-2xl bg-white p-3 shadow-card ${r.rating <= 2 ? 'ring-1 ring-red-200' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-gray-800">{r.reviewerName || r.reviewerEmail || 'Acheteur'}</p>
            <span className="flex shrink-0 items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i2) => (
                <Star key={i2} size={13} className={i2 < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
              ))}
            </span>
          </div>
          {r.sellerEmail && <p className="mt-0.5 truncate text-[11.5px] text-gray-500">vendeur : {r.sellerEmail}</p>}
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
    </div>
  )
}

// ---------- Annonces (modération) ----------
/**
 * Le motif d'un masquage ou d'un retrait — et pourquoi on ne peut pas s'en passer.
 *
 * Une annonce qui disparaît sans un mot, le vendeur la republie à l'identique le
 * lendemain, et on recommence indéfiniment. Le motif est ce qui transforme une
 * suppression en correction. Le serveur l'exige au masquage ; ici on le demande,
 * et on propose les formulations courantes pour qu'un modérateur pressé n'ait
 * pas à les réécrire.
 *
 * Rend `null` si l'on annule, `''` jamais : au masquage, un motif vide est
 * refusé plus haut, et on préfère le dire tout de suite.
 */
const MOTIFS = [
  'photo absente ou trompeuse',
  'prix manifestement faux',
  'produit interdit à la vente',
  'annonce en double',
  'coordonnées d’un tiers publiées',
  'contenu inapproprié',
]
function demanderMotif(action: 'masquer' | 'retirer', titre: string): string | null {
  const m = prompt(
    `Pourquoi ${action} « ${titre} » ?\n\n`
    + 'Ce texte part au vendeur : écrivez-le comme vous le lui diriez.\n'
    + 'Formulations courantes — ' + MOTIFS.join(' · '),
    '',
  )
  if (m === null) return null
  const t = m.trim()
  if (!t && action === 'masquer') {
    alert('Le motif est obligatoire : c’est lui que le vendeur reçoit, et sans lui il republiera la même annonce.')
    return null
  }
  return t
}

type FiltreAnnonces = 'toutes' | 'visibles' | 'masquees' | 'sansphoto'

function ListingsTab() {
  const [items, setItems] = useState<AdminListing[] | null>(null)
  const [err, setErr] = useState('')
  const [filtre, setFiltre] = useState<FiltreAnnonces>('toutes')
  const [q, setQ] = useState('')
  const load = () => {
    setItems(null); setErr('')
    fetchAdminListings().then(setItems).catch((e) => setErr((e as Error).message))
  }
  useEffect(load, [])

  const remove = async (l: AdminListing) => {
    if (!confirm(`Retirer définitivement « ${l.title} » ? Cette action ne s’annule pas.`)) return
    const motif = demanderMotif('retirer', l.title)
    if (motif === null) return
    try { await deleteAdminListing(l.id, motif); setItems((p) => (p ?? []).filter((x) => x.id !== l.id)) }
    catch (e) { alert((e as Error).message) }
  }

  const basculer = async (l: AdminListing) => {
    const versMasque = !l.hidden
    const motif = versMasque ? demanderMotif('masquer', l.title) : ''
    if (motif === null) return
    try { await setAdminListingHidden(l.id, versMasque, motif); load() }
    catch (e) { alert((e as Error).message) }
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>

  const masquees = items.filter((l) => l.hidden).length
  const semaine = items.filter((l) => Date.now() - l.createdAt < 7 * 86400_000).length
  // Une annonce sans photo ne se vend pas et fait douter du site : c'est le
  // premier tas à traiter quand on ouvre cet onglet.
  const sansPhoto = items.filter((l) => (l.images?.length ?? 0) === 0)
  const terme = q.trim().toLowerCase()
  const vus = items.filter((l) => {
    if (filtre === 'visibles' && l.hidden) return false
    if (filtre === 'masquees' && !l.hidden) return false
    if (filtre === 'sansphoto' && (l.images?.length ?? 0) > 0) return false
    if (!terme) return true
    return (l.title + ' ' + (l.sellerEmail ?? '') + ' ' + (l.sellerName ?? '')).toLowerCase().includes(terme)
  })

  return (
    <div className="space-y-2">
      <KpisCrm>
        <KpiCrm valeur={formatPrice(items.length)} libelle="annonces" />
        <KpiCrm valeur={formatPrice(items.length - masquees)} libelle="en ligne" ton="bon" />
        <KpiCrm valeur={formatPrice(masquees)} libelle="masquées"
          ton={masquees > 0 ? 'alerte' : 'neutre'} />
        <KpiCrm valeur={formatPrice(semaine)} libelle="cette semaine" sous="publiées en 7 jours" />
      </KpisCrm>

      <AttenteCrm n={sansPhoto.length}
        phrase={`${sansPhoto.length} annonce${sansPhoto.length > 1 ? 's' : ''} sans aucune photo`}
        action={<button onClick={() => setFiltre('sansphoto')}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-extrabold text-white">Les voir</button>} />

      {/* Chercher, filtrer, ajouter — les trois gestes du contrôle complet.
          « Ajouter » ouvre le formulaire ordinaire : une annonce publiée par
          l'équipe reste une annonce, avec ses photos et ses règles. */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-card">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chercher un titre, un vendeur…"
          aria-label="Chercher une annonce"
          className="input h-10 min-w-[180px] flex-1 py-0 text-sm"
        />
        <div className="flex gap-1">
          {([['toutes', `Toutes (${items.length})`], ['visibles', `En ligne (${items.length - masquees})`], ['masquees', `Masquées (${masquees})`],
             ...(sansPhoto.length > 0 ? [['sansphoto', `Sans photo (${sansPhoto.length})`]] : [])] as [FiltreAnnonces, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFiltre(id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                filtre === id ? 'bg-primary-500 text-white' : 'border border-line2 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <a href="#/publier" className="flex items-center gap-1 rounded-lg bg-ivoire-green px-2.5 py-1.5 text-xs font-bold text-white">
          <Plus size={13} /> Ajouter
        </a>
      </div>

      <RowHead count={vus.length} label="annonce" />
      {vus.map((l) => (
        <div key={l.id} className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card ${l.hidden ? 'opacity-70 ring-1 ring-amber-100' : ''}`}>
          <Thumb listing={l} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate text-sm font-semibold text-gray-800">
              <a href={`#/annonce/${l.id}`} className="truncate hover:underline">{l.title}</a>
              {l.hidden && <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Masquée</span>}
            </p>
            <p className="tnum text-sm font-bold text-primary-600">{l.price === 0 ? 'Gratuit' : formatFCFA(l.price)}</p>
            <p className="truncate text-xs text-gray-500">{l.sellerEmail || l.sellerName || '—'} · {timeAgo(l.createdAt)}</p>
          </div>
          <button onClick={() => basculer(l)} aria-label={l.hidden ? 'Réafficher' : 'Masquer'} className="shrink-0 rounded-xl p-2 text-gray-600 transition hover:bg-gray-100">
            {l.hidden ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button onClick={() => remove(l)} aria-label="Retirer" className="shrink-0 rounded-xl p-2 text-red-500 transition hover:bg-red-50">
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      {vus.length === 0 && (
        <Empty>{items.length === 0 ? 'Aucune annonce publiée.' : 'Aucune annonce ne correspond à ce filtre.'}</Empty>
      )}
    </div>
  )
}

// ---------- Utilisateurs ----------
const STATUS_BADGE: Record<UserStatus, { label: string; cls: string }> = {
  active: { label: 'Actif', cls: 'bg-ivoire-green/10 text-ivoire-green-dark' },
  restricted: { label: 'Restreint', cls: 'bg-amber-50 text-amber-700' },
  blocked: { label: 'Bloqué', cls: 'bg-red-50 text-red-700' },
}

/**
 * « En ligne », ou vu quand.
 *
 * La fenêtre est de cinq minutes, et ce n'est pas un choix esthétique : c'est
 * exactement l'intervalle auquel le serveur réécrit la trace de présence. Une
 * fenêtre plus courte afficherait « hors ligne » quelqu'un qui est en train de
 * naviguer ; une plus longue mentirait dans l'autre sens.
 *
 * `null` veut dire « jamais vu depuis que la trace existe » — un compte créé
 * avant cette mise à jour, ou qui ne s'est jamais reconnecté. On le dit, plutôt
 * que de le faire passer pour un absent de longue date.
 */
function Presence({ enLigne, vuIlYA, compact }: { enLigne?: boolean; vuIlYA?: number | null; compact?: boolean }) {
  if (enLigne) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-ivoire-green-dark ${compact ? 'text-[11px]' : 'text-[12.5px]'}`}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ivoire-green opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ivoire-green" />
        </span>
        En ligne
      </span>
    )
  }
  if (vuIlYA == null) {
    return <span className={`text-gray-500 ${compact ? 'text-[11px]' : 'text-[12.5px]'}`}>Jamais vu</span>
  }
  const j = Math.floor(vuIlYA / 86400)
  const h = Math.floor(vuIlYA / 3600)
  const m = Math.floor(vuIlYA / 60)
  const quand = j > 0 ? `il y a ${j} j` : h > 0 ? `il y a ${h} h` : m > 0 ? `il y a ${m} min` : "à l'instant"
  return (
    <span className={`inline-flex items-center gap-1.5 text-gray-500 ${compact ? 'text-[11px]' : 'text-[12.5px]'}`}>
      <span className="h-2 w-2 rounded-full bg-gray-300" />
      Vu {quand}
    </span>
  )
}

/* ---- Demandes de comptes professionnels --------------------------------- */

/** Libellés des types d'organisation — mêmes identifiants que l'application. */
const PRO_TYPES: Record<string, string> = {
  boutique: '🏪 Boutique / Commerce', commerce: '🏪 Boutique / Commerce',
  vehicules: '🚗 Auto-moto / Garage', immobilier: '🏠 Agence immobilière',
  services: '🛠️ Artisan / Prestataire de services', formation: '🎓 École / Centre de formation',
  emploi: '🏢 Employeur / Recruteur', voyage: '✈️ Agence de voyage',
  agro: '🌾 Producteur / Agro-élevage', sante: '💊 Santé & Bien-être',
  association: '❤️ Association / ONG',
}

function ProTab() {
  const [items, setItems] = useState<AdminProDemande[] | null>(null)
  const [err, setErr] = useState('')
  const [detail, setDetail] = useState<AdminProDemande | null>(null)
  // On ouvre sur ce qui attend : personne ne vient ici relire un dossier clos.
  const [vue, setVue] = useState('attente')
  const [q, setQ] = useState('')
  const { search } = useLocation()
  const load = () => { setItems(null); setErr(''); fetchAdminPro().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  // Lien profond `?demande=<userId>` : la cloche ouvre DIRECTEMENT le dossier.
  useEffect(() => {
    const vise = new URLSearchParams(search).get('demande')
    if (vise && items) {
      const d = items.find((x) => x.userId === vise)
      if (d) setDetail(d)
    }
  }, [search, items])

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  if (detail) return <ProDetail demande={detail} onBack={() => { setDetail(null); load() }} />
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-card">
        Aucune demande de compte professionnel pour le moment.
      </div>
    )
  }

  const enAttente = items.filter((d) => d.status === 'en_attente').length
  const approuves = items.filter((d) => d.status === 'approuve').length
  const refuses = items.filter((d) => d.status === 'refuse').length
  // Un dossier qui attend depuis plus de trois jours : la personne a payé son
  // registre, elle attend, et elle ne le dira pas — elle partira.
  const vieux = items.filter((d) => d.status === 'en_attente'
    && !!d.demandeAt && Date.now() - d.demandeAt > 3 * 86400_000)
  // Sans numéro vérifiable, le dossier ne peut pas être contrôlé au registre :
  // il faut écrire au demandeur avant de décider.
  const sansNumero = items.filter((d) => d.status === 'en_attente' && !d.numero)

  const vus = items.filter((d) => {
    if (vue === 'attente' && d.status !== 'en_attente') return false
    if (vue === 'vieux' && !vieux.includes(d)) return false
    if (vue === 'approuves' && d.status !== 'approuve') return false
    if (vue === 'refuses' && d.status !== 'refuse') return false
    return contient(d.proNom, q) || contient(d.email, q) || contient(d.nom, q)
      || contient(d.numero, q) || contient(d.secteur, q)
  })

  return (
    <div className="space-y-2">
      <KpisCrm>
        <KpiCrm valeur={formatPrice(enAttente)} libelle="en attente"
          ton={enAttente > 0 ? 'alerte' : 'bon'} />
        <KpiCrm valeur={formatPrice(vieux.length)} libelle="depuis 3 jours"
          ton={vieux.length > 0 ? 'alerte' : 'neutre'} />
        <KpiCrm valeur={formatPrice(sansNumero.length)} libelle="sans numéro"
          sous="invérifiables au registre" ton={sansNumero.length > 0 ? 'alerte' : 'neutre'} />
        <KpiCrm valeur={formatPrice(approuves)} libelle="professionnels" sous={`${refuses} refusé${refuses > 1 ? 's' : ''}`} ton="bon" />
      </KpisCrm>

      <AttenteCrm n={vieux.length}
        phrase={`${vieux.length} dossier${vieux.length > 1 ? 's' : ''} ${vieux.length > 1 ? 'attendent' : 'attend'} une décision depuis plus de trois jours`}
        action={<button onClick={() => setVue('vieux')}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-extrabold text-white">Les voir</button>} />

      <PucesCrm valeur={vue} onChange={setVue} puces={[
        { id: 'attente', label: 'En attente', n: enAttente, alerte: enAttente > 0 },
        ...(vieux.length > 0 ? [{ id: 'vieux', label: 'Depuis 3 jours', n: vieux.length, alerte: true }] : []),
        { id: 'approuves', label: 'Approuvés', n: approuves },
        ...(refuses > 0 ? [{ id: 'refuses', label: 'Refusés', n: refuses }] : []),
        { id: 'tous', label: 'Tous', n: items.length },
      ]} />

      <BarreCrm q={q} onQ={setQ} placeholder="Chercher une enseigne, un e-mail, un numéro…" />

      {vus.length === 0 && <Empty>Aucun dossier dans cette vue.</Empty>}
      {vus.map((d) => {
        const attente = d.status === 'en_attente'
        return (
          <button
            key={d.userId}
            onClick={() => setDetail(d)}
            className={`block w-full rounded-2xl bg-white p-4 text-left shadow-card transition hover:bg-cream-100 ${attente ? 'border-2 border-primary-400' : 'border border-line2'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-bold text-ink">{d.proNom}</p>
                <p className="mt-0.5 text-xs text-gray-600">{PRO_TYPES[d.type] ?? d.type}</p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {d.nom ?? '—'} · {d.email}{d.demandeAt ? ` · ${timeAgo(d.demandeAt)}` : ''}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                attente ? 'bg-primary-100 text-primary-800'
                  : d.status === 'approuve' ? 'bg-ivoire-green/15 text-ivoire-green' : 'bg-red-50 text-red-700'
              }`}>
                {attente ? 'En attente' : d.status === 'approuve' ? 'Approuvée' : 'Refusée'}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/** La fiche complète : QUI demande (le compte, son historique) et QUOI (le
 *  dossier), puis la décision — tout au même endroit. */
function ProDetail({ demande: d, onBack }: { demande: AdminProDemande; onBack: () => void }) {
  const [u, setU] = useState<AdminUserDetail | null>(null)
  const [uErr, setUErr] = useState('')
  const [busy, setBusy] = useState(false)
  // Regarder sa console telle qu'il la voit. Sans cela, un administrateur qui
  // n'a pas lui-même de compte professionnel ne peut vérifier AUCUN écran pro :
  // il décrit des tuiles qu'il n'a jamais vues.
  const [voirConsole, setVoirConsole] = useState(false)
  useEffect(() => {
    fetchAdminUserDetail(d.userId).then(setU).catch((e) => setUErr((e as Error).message))
  }, [d.userId])

  const decider = async (action: 'approuver' | 'refuser') => {
    let motif = ''
    if (action === 'refuser') {
      const m = prompt(
        `Pourquoi refuser « ${d.proNom} » ?\n\n`
        + 'Ce texte part au demandeur : écrivez-le comme vous le lui diriez.\n'
        + 'Ex. : numéro RCCM introuvable au registre.',
        '',
      )
      if (m === null) return
      motif = m.trim()
    }
    setBusy(true)
    try { await deciderPro(d.userId, action, motif); onBack() }
    catch (e) { alert((e as Error).message) }
    finally { setBusy(false) }
  }

  const attente = d.status === 'en_attente'

  // La console du professionnel, en plein écran, telle qu'il la voit.
  if (voirConsole) {
    return (
      <div className="space-y-3">
        <button onClick={() => setVoirConsole(false)}
          className="flex items-center gap-1 text-sm font-semibold text-primary-600">
          ← Revenir au dossier de {d.proNom}
        </button>
        <TableauPro dansCompte userId={d.userId} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-primary-600">
        ← Toutes les demandes
      </button>

      {/* Le dossier demandé */}
      <div className={`rounded-2xl bg-white p-4 shadow-card ${attente ? 'border-2 border-primary-400' : 'border border-line2'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold text-ink">{d.proNom}</p>
            <p className="mt-0.5 text-sm text-gray-600">{PRO_TYPES[d.type] ?? d.type}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
            attente ? 'bg-primary-100 text-primary-800'
              : d.status === 'approuve' ? 'bg-ivoire-green/15 text-ivoire-green' : 'bg-red-50 text-red-700'
          }`}>
            {attente ? 'En attente' : d.status === 'approuve' ? 'Approuvée' : 'Refusée'}
          </span>
        </div>
        <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2">
          <InfoLigne l="Numéro officiel" v={d.numero ?? '— non fourni —'} />
          <InfoLigne l="Secteur" v={d.secteur ?? '—'} />
          <InfoLigne l="Téléphone pro" v={d.tel ?? '—'} />
          {/* Une date à zéro n'est pas « il y a 56 ans », c'est une date absente. */}
          <InfoLigne l="Déposée" v={d.demandeAt ? timeAgo(d.demandeAt) : '— inconnue —'} />
          {d.motif && <InfoLigne l="Motif du refus" v={d.motif} />}
        </dl>
        {attente && (
          <p className="mt-2 text-xs text-gray-500">
            Commerce : vérifiez le numéro RCCM sur{' '}
            <a href="https://rccm.ohada.org" target="_blank" rel="noreferrer" className="font-semibold text-primary-600">rccm.ohada.org</a>{' '}
            avant d'approuver.
          </p>
        )}
      </div>

      {/* La personne derrière le dossier */}
      <div className="rounded-2xl border border-line2 bg-white p-4 shadow-card">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Le compte</p>
        {uErr && <p className="text-sm text-red-600">{uErr}</p>}
        {!u && !uErr && <Center><Loader2 className="animate-spin" size={18} /></Center>}
        {u && (
          <dl className="grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2">
            <InfoLigne l="Nom" v={u.fullName || '—'} />
            <InfoLigne l="E-mail" v={u.email} />
            <InfoLigne l="E-mail vérifié" v={u.emailVerifie ? 'Oui ✓' : 'Non'} />
            <InfoLigne l="Téléphone" v={u.phone ?? '—'} />
            <InfoLigne l="Commune" v={u.commune ?? '—'} />
            <InfoLigne l="Inscrit" v={timeAgo(u.createdAt)} />
            <InfoLigne l="Statut du compte" v={u.status === 'active' ? 'Actif' : u.status} />
            <InfoLigne l="Connexion" v={u.provider ?? 'email'} />
          </dl>
        )}
      </div>

      {attente && (
        <div className="flex gap-2">
          <button
            onClick={() => decider('approuver')}
            disabled={busy}
            className="flex-1 rounded-xl bg-ivoire-green py-3 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-50"
          >
            {busy ? '…' : 'Approuver la demande'}
          </button>
          <button
            onClick={() => decider('refuser')}
            disabled={busy}
            className="flex-1 rounded-xl border border-red-200 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            Refuser
          </button>
        </div>
      )}

      {/* CORRIGER LE DOSSIER — la seule porte. Le professionnel ne peut pas
          changer son type, son secteur ni son numéro depuis son compte : ce
          sont les trois éléments contrôlés avant l'approbation. Quand il
          écrit « mon RCCM a changé », c'est ici que ça se règle. */}
      {/* VOIR SA CONSOLE. Un administrateur n'a pas forcément de compte
          professionnel — le Patron n'en a pas — et ne peut donc vérifier aucun
          écran pro : les tuiles, les statistiques, les réponses automatiques
          lui sont invisibles. Cette porte les lui ouvre, en lecture seule. */}
      {d.status === 'approuve' && (
        <button onClick={() => setVoirConsole(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-line2 bg-white p-4 text-left shadow-card transition hover:bg-cream-100">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream-100 text-lg" aria-hidden>👁️</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-ink">Voir son tableau de bord</span>
            <span className="mt-0.5 block text-xs leading-snug text-gray-500">
              Sa console professionnelle telle qu’il la voit — chiffres, tuiles, réglages.
              En lecture seule : rien n’est modifiable, et il n’est pas prévenu.
            </span>
          </span>
          <span className="shrink-0 text-gray-300" aria-hidden>›</span>
        </button>
      )}

      {d.status === 'approuve' && <CorrigerFiche demande={d} onFait={onBack} />}
    </div>
  )
}

/**
 * Le formulaire de correction d'un dossier approuvé, réservé à l'équipe.
 * Chaque modification part au journal d'audit (qui, quoi, avant → après) et
 * le professionnel en est averti dans sa cloche.
 */
function CorrigerFiche({ demande: d, onFait }: { demande: AdminProDemande; onFait: () => void }) {
  const [ouvert, setOuvert] = useState(false)
  const [nom, setNom] = useState(d.proNom ?? '')
  const [type, setType] = useState(d.type === 'commerce' ? 'boutique' : d.type)
  const [secteur, setSecteur] = useState(d.secteur ?? '')
  const [numero, setNumero] = useState(d.numero ?? '')
  const [tel, setTel] = useState(d.tel ?? '')
  const [busy, setBusy] = useState(false)
  const def = TYPES_PRO.find((t) => t.id === type) ?? TYPES_PRO[0]

  const enregistrer = async () => {
    setBusy(true)
    try {
      const r = await corrigerFichePro({ userId: d.userId, nom, type, secteur, numero, tel })
      alert(r.change === 0
        ? 'Rien n’a changé.'
        : `${r.change} champ${r.change > 1 ? 's' : ''} modifié${r.change > 1 ? 's' : ''}. Le professionnel a été averti.`)
      onFait()
    } catch (e) { alert((e as Error).message) }
    finally { setBusy(false) }
  }

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)}
        className="w-full rounded-2xl border border-line2 bg-white py-3 text-sm font-bold text-gray-700 shadow-card transition hover:bg-cream-100">
        ✏️ Corriger le dossier (type, secteur, numéro)
      </button>
    )
  }
  return (
    <div className="space-y-2.5 rounded-2xl border-2 border-primary-300 bg-white p-4 shadow-card">
      <p className="font-display text-sm font-bold text-ink">Corriger le dossier</p>
      <p className="text-xs leading-relaxed text-gray-500">
        Le professionnel ne peut pas modifier ces champs lui-même. Chaque changement est
        journalisé (avant → après) et lui est signalé dans sa cloche.
      </p>
      <label className="block text-xs font-semibold text-gray-500">
        Nom commercial
        <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80}
          className="mt-1 w-full rounded-xl border border-line2 px-3 py-2 text-sm text-ink outline-none focus:border-primary-400" />
      </label>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-gray-500">
          Type
          <select value={type} onChange={(e) => { setType(e.target.value); setSecteur('') }}
            className="mt-1 w-full rounded-xl border border-line2 px-3 py-2 text-sm text-ink outline-none focus:border-primary-400">
            {TYPES_PRO.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-gray-500">
          Secteur
          <select value={secteur} onChange={(e) => setSecteur(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line2 px-3 py-2 text-sm text-ink outline-none focus:border-primary-400">
            <option value="">— aucun —</option>
            {secteur !== '' && !def.secteurs.includes(secteur) && <option value={secteur}>{secteur}</option>}
            {def.secteurs.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-gray-500">
          {def.numero}
          <input value={numero} onChange={(e) => setNumero(e.target.value)} maxLength={60}
            className="mt-1 w-full rounded-xl border border-line2 px-3 py-2 text-sm text-ink outline-none focus:border-primary-400" />
        </label>
        <label className="block text-xs font-semibold text-gray-500">
          Téléphone pro
          <input value={tel} onChange={(e) => setTel(e.target.value)} maxLength={20}
            className="mt-1 w-full rounded-xl border border-line2 px-3 py-2 text-sm text-ink outline-none focus:border-primary-400" />
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={enregistrer} disabled={busy || nom.trim().length < 2}
          className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {busy ? '…' : 'Enregistrer la correction'}
        </button>
        <button onClick={() => setOuvert(false)}
          className="rounded-xl border border-line2 px-4 py-2.5 text-sm font-semibold text-gray-600">
          Annuler
        </button>
      </div>
    </div>
  )
}

function InfoLigne({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-gray-500">{l}</dt>
      <dd className="min-w-0 flex-1 break-words font-semibold text-ink">{v}</dd>
    </div>
  )
}

function UsersTab() {
  const [items, setItems] = useState<AdminUser[] | null>(null)
  const [err, setErr] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [enLigneSeuls, setEnLigneSeuls] = useState(false)
  const [muetsSeuls, setMuetsSeuls] = useState(false)
  const load = () => { setItems(null); setErr(''); fetchAdminUsers().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  if (selected) return <UserDetail id={selected} onBack={() => { setSelected(null); load() }} />
  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>

  const enLigne = items.filter((u) => u.enLigne).length
  // Les comptes muets : inscrits, puis plus rien. Ce sont eux la deuxième
  // marche du Parcours, et ce sont les seuls à qui écrire change quelque chose
  // — ils ont déjà dit oui une fois.
  const muets = items.filter((u) => u.listings === 0).length
  const terme = q.trim().toLowerCase()
  const vus = items.filter((u) => {
    if (enLigneSeuls && !u.enLigne) return false
    if (muetsSeuls && u.listings > 0) return false
    if (!terme) return true
    return `${u.fullName} ${u.email} ${u.phone ?? ''} ${u.commune ?? ''}`.toLowerCase().includes(terme)
  })

  const bloques = items.filter((u) => u.status === 'blocked' || u.status === 'restricted').length
  const semaine = items.filter((u) => Date.now() - u.createdAt < 7 * 86400_000).length

  return (
    <div className="space-y-2">
      <KpisCrm>
        <KpiCrm valeur={formatPrice(items.length)} libelle="comptes" />
        <KpiCrm valeur={formatPrice(semaine)} libelle="cette semaine" sous="nouveaux inscrits" />
        <KpiCrm valeur={formatPrice(enLigne)} libelle="en ligne" sous="vus il y a moins de 5 min"
          ton={enLigne > 0 ? 'bon' : 'neutre'} />
        <KpiCrm valeur={formatPrice(muets)} libelle="sans annonce"
          sous={items.length ? `${Math.round(muets / items.length * 100)} % des comptes` : undefined}
          ton={items.length > 0 && muets / items.length > 0.7 ? 'alerte' : 'neutre'} />
      </KpisCrm>
      {bloques > 0 && (
        <p className="px-1 text-[12.5px] text-gray-500">
          {formatPrice(bloques)} compte{bloques > 1 ? 's' : ''} bloqué{bloques > 1 ? 's' : ''} ou restreint{bloques > 1 ? 's' : ''}.
        </p>
      )}

      {/* Chercher quelqu'un, et voir qui est là maintenant. Sur une liste qui
          grandit, le nom qu'on cherche est rarement en haut. */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-card">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chercher un nom, un e-mail, un téléphone…"
          aria-label="Chercher un utilisateur"
          className="input h-10 min-w-[200px] flex-1 py-0 text-sm"
        />
        <button
          onClick={() => setEnLigneSeuls((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            enLigneSeuls ? 'bg-ivoire-green text-white' : 'border border-line2 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${enLigneSeuls ? 'bg-white' : 'bg-ivoire-green'}`} />
          En ligne ({enLigne})
        </button>
        <button
          onClick={() => setMuetsSeuls((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            muetsSeuls ? 'bg-primary-500 text-white' : 'border border-line2 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Sans annonce ({muets})
        </button>
      </div>

      <RowHead count={vus.length} label="utilisateur" />
      {vus.map((u) => {
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
              <p className="text-xs text-gray-500">
                {u.listings} annonce{u.listings > 1 ? 's' : ''}{u.commune ? ` · ${u.commune}` : ''} · inscrit {timeAgo(u.createdAt)}
              </p>
              <p className="mt-0.5"><Presence enLigne={u.enLigne} vuIlYA={u.vuIlYA} compact /></p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-gray-300" />
          </button>
        )
      })}
      {vus.length === 0 && (
        <Empty>{items.length === 0 ? 'Aucun utilisateur.' : 'Personne ne correspond à cette recherche.'}</Empty>
      )}
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
  const toggleListing = async (lid: string, hidden: boolean, title: string) => {
    const motif = hidden ? demanderMotif('masquer', title) : ''
    if (motif === null) return
    try { await setAdminListingHidden(lid, hidden, motif); load() } catch (e) { alert((e as Error).message) }
  }
  const removeListing = async (lid: string, title: string) => {
    if (!confirm(`Retirer définitivement « ${title} » ? Cette action ne s’annule pas.`)) return
    const motif = demanderMotif('retirer', title)
    if (motif === null) return
    try { await deleteAdminListing(lid, motif); load() } catch (e) { alert((e as Error).message) }
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
            <p className="mt-0.5"><Presence enLigne={u.enLigne} vuIlYA={u.vuIlYA} /></p>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {/* ⚠️ Téléphone et e-mail : ils ne sortent QUE sur cet écran, derrière
              la fonctionnalité « Utilisateurs ». Le profil public d'un vendeur
              (/vendeur/{id}) n'en montre aucun des deux. */}
          <Info label="Téléphone" value={u.phone || 'non renseigné'} />
          {(u.commune || u.cityId) && <Info label="Localisation" value={locationLabel(u.regionId ?? '', u.cityId ?? '', u.commune ?? undefined)} />}
          <Info label="Inscrit" value={timeAgo(u.createdAt)} />
          <Info
            label="Compte"
            value={
              (u.provider && u.provider !== 'email' ? u.provider.charAt(0).toUpperCase() + u.provider.slice(1) : 'E-mail')
              + (u.emailVerifie ? ' · vérifié' : ' · non vérifié')
            }
          />
        </dl>
        {u.bio && <p className="mt-2 rounded-xl bg-gray-50 p-2 text-sm text-gray-600">{u.bio}</p>}
      </div>

      {/* ---- Ce qui fait la décision -------------------------------------- *
        * Un compte inscrit hier avec quatre annonces signalées et un compte de
        * huit mois avec un seul signalement se ressemblent dans une liste. Ils
        * n'appellent pas la même décision. Ces chiffres-là sont la différence. */}
      {u.chiffres && (
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <p className="mb-2.5 flex flex-wrap items-center gap-2 text-sm font-bold text-gray-800">
            Son activité
            {u.chiffres.signalementsSubisOuverts > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                {u.chiffres.signalementsSubisOuverts} signalement{u.chiffres.signalementsSubisOuverts > 1 ? 's' : ''} ouvert{u.chiffres.signalementsSubisOuverts > 1 ? 's' : ''}
              </span>
            )}
            {u.note && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                ★ {String(u.note.moyenne).replace('.', ',')} sur {u.note.nombre} avis
              </span>
            )}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {([
              ['Annonces', u.chiffres.annonces],
              ['Masquées', u.chiffres.annoncesMasquees, u.chiffres.annoncesMasquees > 0],
              ['Vendues', u.chiffres.annoncesVendues],
              ['Signalé', u.chiffres.signalementsSubis, u.chiffres.signalementsSubis > 0],
              ['A signalé', u.chiffres.signalementsEmis],
              ['Conversations', u.chiffres.conversations],
              ['Achats', u.chiffres.commandesPassees],
              ['Ventes', u.chiffres.commandesRecues],
              ['Avis reçus', u.chiffres.avisRecus],
              ['Publicités', u.chiffres.publicites, u.chiffres.publicites > 0],
            ] as [string, number, boolean?][]).map(([label, valeur, alerte]) => (
              <div key={label} className={`rounded-xl px-2 py-2.5 text-center ${alerte ? 'bg-red-50' : 'bg-cream-100'}`}>
                <p className={`tnum font-display text-lg font-extrabold leading-none ${alerte ? 'text-red-700' : 'text-ink'}`}>{valeur}</p>
                <p className="mt-1 text-[11px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Ce qu'on lui reproche, du plus fréquent au moins fréquent. Un même
              motif répété dit autre chose qu'une plainte isolée. */}
          {!!u.motifsSignales?.length && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold text-gray-600">Motifs des signalements reçus</p>
              <div className="flex flex-wrap gap-1.5">
                {u.motifsSignales.map((m) => (
                  <span key={m.motif} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11.5px] font-medium text-gray-700">
                    {m.motif} · {m.n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <EcrireAuMembre id={id} nom={u.fullName} />

      {/* Actions de modération */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="mb-2 text-sm font-bold text-gray-800">Modération du compte</p>
        {/* Un modérateur ne doit pas découvrir en bloquant un compte qu'il vient
            de bloquer un collègue. Le serveur refuse déjà de toucher au
            propriétaire ; l'avertissement, lui, évite le geste. */}
        {u.equipe && (
          <p className="mb-2.5 flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-[13px] leading-relaxed text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>
              Ce compte fait partie de l’équipe
              {u.equipe === 'proprietaire' ? ' — c’est le propriétaire du site, il ne peut être ni bloqué ni supprimé.' : ' (modérateur).'}
            </span>
          </p>
        )}
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
              <button onClick={() => toggleListing(l.id, !l.hidden, l.title)} aria-label={l.hidden ? 'Afficher' : 'Masquer'} className="shrink-0 rounded-xl p-2 text-gray-500 hover:bg-gray-100">
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

/**
 * Écrire à ce membre — sans passer par une annonce.
 *
 * C'est ce qui manquait : pour prévenir quelqu'un, il n'y avait que la
 * messagerie acheteur-vendeur, qui exige une annonce et fait passer l'équipe
 * pour un client. Un modérateur qui doit se déguiser en acheteur pour dire
 * « votre photo est floue », c'est un outil qui manque.
 *
 * Le fil créé appartient au MEMBRE : il le trouve dans son assistance, reçoit
 * une notification, et peut répondre. Vu de lui, l'équipe signe « L'équipe
 * Chap.ci » — jamais le nom du modérateur.
 */
/**
 * Les modèles de message.
 *
 * Écrire à quelqu'un coûte cinq minutes de rédaction — et c'est exactement ce
 * qui fait qu'on ne le fait pas. Ces sept-là sont les situations réellement
 * rencontrées sur Chap.ci : un inscrit qui ne publie jamais, une photo floue,
 * un prix invraisemblable, une annonce faite avec un ancien formulaire, une
 * annonce postée dans la mauvaise rubrique, le recrutement de testeurs, et le
 * merci après une première vente.
 *
 * Ce sont des POINTS DE DÉPART, pas des envois automatiques : le texte se
 * relit et se corrige avant de partir. Un message qui sent le modèle fait plus
 * de mal que pas de message du tout.
 */
const MODELES_MESSAGE: { id: string; nom: string; sujet: string; texte: (prenom: string) => string }[] = [
  {
    id: 'sans-annonce',
    nom: 'Inscrit, mais n’a rien publié',
    sujet: 'Un coup de main pour votre première annonce ?',
    texte: (p) => `Bonjour${p ? ' ' + p : ''},

Vous avez créé votre compte sur Chap.ci, et nous en sommes contents — mais vous n’avez pas encore mis d’annonce en ligne.

Est-ce qu’il y a quelque chose qui bloque ? Le formulaire, les photos, le prix ? Dites-le-nous en répondant à ce message : c’est une vraie personne qui lit, et si c’est notre site qui complique les choses, nous le corrigerons.

Et si vous n’avez simplement rien à vendre pour l’instant, aucun souci — gardez-nous dans un coin de la tête.

À bientôt.`,
  },
  {
    id: 'photo',
    nom: 'Photos floues ou insuffisantes',
    sujet: 'Vos photos méritent mieux',
    texte: (p) => `Bonjour${p ? ' ' + p : ''},

Votre annonce est bien en ligne. Un point cependant : les photos ne rendent pas justice à ce que vous vendez — on distingue mal le produit.

Sur Chap.ci, les annonces avec des photos nettes reçoivent nettement plus de messages. Trois conseils qui changent tout :

1. En plein jour, près d’une fenêtre — jamais au flash.
2. Le produit seul, sur un fond uni (un drap, un mur).
3. Trois angles : l’ensemble, un détail, et l’étiquette ou le numéro de série s’il y en a.

Pour remplacer une photo : Mon compte → Mes annonces → Modifier.

Merci — et bonne vente.`,
  },
  {
    id: 'prix',
    nom: 'Prix qui paraît faux',
    sujet: 'Une question sur le prix de votre annonce',
    texte: (p) => `Bonjour${p ? ' ' + p : ''},

Le prix affiché sur votre annonce s’écarte beaucoup de ce qui se pratique pour ce type de produit. Cela arrive souvent pour une raison simple : un zéro en trop, ou un zéro en moins.

Pouvez-vous vérifier ? Un prix qui paraît trop beau fait fuir les acheteurs sérieux — ils supposent une arnaque et passent leur chemin.

Si le prix est juste et que quelque chose l’explique (état, urgence, lot), précisez-le dans la description : cela rassure.

Pour le modifier : Mon compte → Mes annonces → Modifier.

Merci.`,
  },
  {
    id: 'formulaire',
    nom: 'Annonce à reprendre avec le formulaire actuel',
    sujet: 'Votre annonce : quelques champs à compléter',
    texte: (p) => `Bonjour${p ? ' ' + p : ''},

Votre annonce a été publiée avec une version antérieure de notre formulaire. Depuis, nous en avons ajouté quelques champs — ceux que les acheteurs réclament le plus.

Il n’y a rien à supprimer, et surtout ne le faites pas : votre annonce a une adresse que Google connaît déjà, et la supprimer effacerait ce travail. Ouvrez simplement Mon compte → Mes annonces → Modifier. Le formulaire actuel s’ouvre avec tout ce que vous aviez saisi, et vous n’avez qu’à compléter ce qui manque.

Cinq minutes, et votre annonce ressort mieux dans les recherches.

Merci.`,
  },
  {
    id: 'titre',
    nom: 'Titre et description à reprendre',
    sujet: 'Votre annonce est presque invisible — deux minutes pour la réparer',
    texte: (p) => `Bonjour${p ? ' ' + p : ''},

Votre annonce est en ligne, mais telle qu’elle est rédigée, personne ne la trouvera. Deux choses la rendent invisible :

1. Le TITRE ne contient pas le mot que les gens tapent. Quelqu’un qui cherche écrit « cahiers », « chaussures », « lapin »… Si ce mot n’est pas dans votre titre, votre annonce ne sort pas dans les résultats. Mettez donc en premier le nom exact de ce que vous vendez, puis un détail utile.
   Exemple : « Lot de cahiers 32 à 300 pages » plutôt qu’un titre vague.

2. La DESCRIPTION ne décrit pas votre produit. Écrivez ce que c’est vraiment, en une ou deux phrases : la quantité, l’état, la taille, la marque si elle compte. « Contactez-moi pour plus d’infos » ne dit rien à l’acheteur, et il passe.

Il n’y a rien à supprimer — surtout pas : votre annonce a déjà une adresse que Google connaît. Ouvrez simplement Mon compte → Mes annonces → Modifier, corrigez le titre et la description, enregistrez. C’est tout.

Deux minutes, et votre annonce commence enfin à être vue.

Merci — et bonne vente.`,
  },
  {
    id: 'rubrique',
    nom: 'Annonce dans la mauvaise rubrique',
    sujet: 'Votre annonce serait mieux ailleurs',
    texte: (p) => `Bonjour${p ? ' ' + p : ''},

Votre annonce est publiée dans une rubrique où les acheteurs qu’elle intéresse ne vont pas la chercher. Elle existe, elle est visible — mais presque personne ne la croisera.

Ouvrez Mon compte → Mes annonces → Modifier, et changez la catégorie. Le formulaire s’adaptera tout seul et vous demandera les informations propres à la bonne rubrique.

Si vous hésitez sur la rubrique à choisir, répondez à ce message en décrivant ce que vous vendez : nous vous dirons laquelle.

Merci.`,
  },
  {
    id: 'testeur',
    nom: 'Inviter à tester l’application',
    sujet: 'Voulez-vous essayer l’application Chap.ci ?',
    texte: (p) => `Bonjour${p ? ' ' + p : ''},

Nous préparons l’application Android de Chap.ci, et nous cherchons quelques personnes pour l’installer avant tout le monde.

Ce que cela demande : installer l’application sur votre téléphone Android, et la garder installée quatorze jours. Rien d’autre. Vous pouvez l’utiliser normalement — c’est même le but.

Si vous êtes d’accord, répondez simplement « oui » à ce message avec l’adresse Gmail de votre téléphone, et nous vous envoyons le lien d’installation.

Merci beaucoup.`,
  },
  {
    id: 'merci',
    nom: 'Merci après une première vente',
    sujet: 'Bravo pour votre première vente 🎉',
    texte: (p) => `Bonjour${p ? ' ' + p : ''},

Votre première vente sur Chap.ci est passée — bravo, et merci de nous avoir fait confiance.

Deux choses qui aident beaucoup, si le cœur vous en dit :

1. Remettez une annonce. Les vendeurs qui en ont plusieurs vendent bien plus vite : les acheteurs regardent leur profil entier.
2. Parlez de nous autour de vous. Chap.ci est un site ivoirien, tenu par des Ivoiriens, et il grandit par le bouche-à-oreille.

Et si quelque chose vous a gêné pendant la vente, dites-le en répondant ici. C’est comme ça que le site s’améliore.

Encore bravo.`,
  },
]

function EcrireAuMembre({ id, nom }: { id: string; nom: string }) {
  const navigate = useNavigate()
  const [ouvert, setOuvert] = useState(false)
  const [sujet, setSujet] = useState('')
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    if (envoi) return
    setEnvoi(true); setErreur('')
    try {
      const fil = await ouvrirFil(sujet.trim(), message.trim(), 'user', id)
      navigate(`/assistance/${fil}`)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le message n’est pas parti. Réessayez.')
      setEnvoi(false)
    }
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-200 bg-primary-50/60 py-3 text-sm font-bold text-primary-700 transition active:scale-[0.99] hover:bg-primary-50"
      >
        <MessageSquare size={17} /> Écrire à {nom === '—' ? 'ce membre' : nom.split(' ')[0]}
      </button>
    )
  }

  return (
    <form onSubmit={envoyer} className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
      <p className="text-sm font-bold text-gray-800">Écrire à ce membre</p>
      <p className="text-xs leading-relaxed text-gray-600">
        Le message arrive dans son assistance, avec une notification. Il pourra répondre, et
        l’échange restera au même endroit. Il verra « L’équipe Chap.ci » — jamais votre nom.
      </p>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500">Partir d’un modèle</label>
        <select
          value=""
          disabled={envoi}
          onChange={(e) => {
            const m = MODELES_MESSAGE.find((x) => x.id === e.target.value)
            if (!m) return
            const prenom = nom === '—' ? '' : nom.split(' ')[0]
            setSujet(m.sujet)
            setMessage(m.texte(prenom))
          }}
          className="input"
        >
          <option value="">— Écrire de zéro —</option>
          {MODELES_MESSAGE.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
        <p className="mt-1 text-[11px] leading-snug text-gray-500">
          Un modèle remplit l’objet et le message. <b>Relisez avant d’envoyer</b> : un texte qui
          sent le modèle fait plus de mal que pas de message du tout.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500">Objet</label>
        <input value={sujet} onChange={(e) => setSujet(e.target.value)} disabled={envoi} maxLength={120}
          className="input" placeholder="Ex : votre annonce « Frigo Samsung »" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500">Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} disabled={envoi} rows={5} maxLength={4000}
          className="input resize-y"
          placeholder={'Bonjour,\n\nVotre annonce est en ligne, mais la photo est trop floue pour qu’on distingue le produit. Pouvez-vous la remplacer ? Elle sortira mieux dans les recherches.'} />
      </div>
      {erreur && <p className="text-[13px] font-semibold text-red-600">{erreur}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={!sujet.trim() || !message.trim() || envoi} className="btn-primary disabled:opacity-50">
          {envoi ? 'Envoi…' : 'Envoyer'}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600">
          Annuler
        </button>
      </div>
    </form>
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
  // On ouvre sur les signalements OUVERTS : c'est la seule raison de venir ici.
  const [vue, setVue] = useState('ouverts')
  const [q, setQ] = useState('')
  const load = () => { setItems(null); setErr(''); fetchReports().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  /**
   * Une décision, un seul appel.
   *
   * Auparavant « Marquer traité » ne faisait que ranger la ligne : pour agir sur
   * l'annonce il fallait la retrouver dans l'onglet Annonces, et la moitié du
   * temps ce second geste n'était pas fait — signalement classé, annonce
   * toujours en ligne. C'est exactement ce qu'un signalement est censé empêcher.
   * Masquer et supprimer closent donc le signalement avec eux, ainsi que les
   * autres signalements visant la même annonce : trois personnes signalent
   * souvent la même chose, et on ne retraite pas une décision prise.
   */
  const traiter = async (r: Report, action: ReportAction) => {
    if (action === 'supprimer' && !confirm(`Retirer définitivement « ${r.listingTitle} » ? Cette action ne s’annule pas.`)) return
    // Le motif par défaut reprend la raison du signalement — c'est déjà le bon
    // mot dans la grande majorité des cas. Vide = le serveur le compose.
    let motif = ''
    if (action !== 'classer') {
      const saisi = prompt(
        `Message envoyé au vendeur — ${action === 'masquer' ? 'masquage' : 'retrait'} de « ${r.listingTitle} »\n\n`
        + 'Laissez vide pour reprendre la raison du signalement.',
        '',
      )
      if (saisi === null) return
      motif = saisi.trim()
    }
    try { await resolveReport(r.id, action, motif); load(); onChanged?.() }
    catch (e) { alert((e as Error).message) }
  }

  /** Réafficher une annonce masquée : le seul cas où l'on ne clôt rien. */
  const reafficher = async (r: Report) => {
    try { await setAdminListingHidden(r.listingId, false); load() } catch (e) { alert((e as Error).message) }
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>

  const ouverts = items.filter((r) => r.status === 'open')
  // Un signalement ouvert depuis plus de 48 h, c'est une annonce que trois
  // personnes ont peut-être vue et signalée depuis. C'est le seul chiffre de
  // cet onglet qui appelle une action tout de suite.
  const vieux = ouverts.filter((r) => Date.now() - r.createdAt > 2 * 86400_000)
  const masqueesSig = items.filter((r) => r.listingHidden).length
  // Les annonces signalées PLUSIEURS fois : trois personnes qui disent la même
  // chose se trompent rarement.
  const parAnnonce = new Map<string, number>()
  for (const r of ouverts) parAnnonce.set(r.listingId, (parAnnonce.get(r.listingId) ?? 0) + 1)
  const repetes = [...parAnnonce.values()].filter((n) => n >= 2).length

  const vus = items.filter((r) => {
    if (vue === 'ouverts' && r.status !== 'open') return false
    if (vue === 'vieux' && !vieux.includes(r)) return false
    if (vue === 'traites' && r.status !== 'resolved') return false
    return contient(r.listingTitle, q) || contient(r.reason, q)
      || contient(r.details, q) || contient(r.reporterEmail, q)
  })

  return (
    <div className="space-y-2">
      <KpisCrm>
        <KpiCrm valeur={formatPrice(ouverts.length)} libelle="ouverts"
          ton={ouverts.length > 0 ? 'alerte' : 'bon'} />
        <KpiCrm valeur={formatPrice(vieux.length)} libelle="depuis 48 h"
          ton={vieux.length > 0 ? 'alerte' : 'neutre'} />
        <KpiCrm valeur={formatPrice(repetes)} libelle="signalés plusieurs fois"
          sous="la même annonce" ton={repetes > 0 ? 'alerte' : 'neutre'} />
        <KpiCrm valeur={formatPrice(masqueesSig)} libelle="annonces déjà masquées" />
      </KpisCrm>

      <AttenteCrm n={vieux.length}
        phrase={`${vieux.length} signalement${vieux.length > 1 ? 's' : ''} ouvert${vieux.length > 1 ? 's' : ''} depuis plus de 48 h`}
        action={<button onClick={() => setVue('vieux')}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-extrabold text-white">Les voir</button>} />

      <PucesCrm valeur={vue} onChange={setVue} puces={[
        { id: 'ouverts', label: 'Ouverts', n: ouverts.length, alerte: ouverts.length > 0 },
        ...(vieux.length > 0 ? [{ id: 'vieux', label: 'Depuis 48 h', n: vieux.length, alerte: true }] : []),
        { id: 'traites', label: 'Traités', n: items.length - ouverts.length },
        { id: 'tous', label: 'Tous', n: items.length },
      ]} />

      <BarreCrm q={q} onQ={setQ} placeholder="Chercher une annonce, un motif, un signaleur…" />

      {vus.map((r) => (
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
              {/* Trois issues, et elles closent le signalement avec elles :
                  rien à reprocher, l'annonce est corrigeable, l'annonce n'a
                  rien à faire ici. */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.listingHidden ? (
                  <button onClick={() => reafficher(r)} className="flex items-center gap-1 rounded-lg border border-line2 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    <Eye size={13} /> Réafficher
                  </button>
                ) : (
                  <button onClick={() => traiter(r, 'masquer')} className="flex items-center gap-1 rounded-lg border border-line2 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    <EyeOff size={13} /> Masquer l’annonce
                  </button>
                )}
                <button onClick={() => traiter(r, 'supprimer')} className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                  <Trash2 size={13} /> Supprimer l’annonce
                </button>
                {r.status === 'open' && (
                  <button onClick={() => traiter(r, 'classer')} className="flex items-center gap-1 rounded-lg bg-ivoire-green px-2.5 py-1.5 text-xs font-semibold text-white">
                    <CheckCircle2 size={13} /> Rien à reprocher
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {vus.length === 0 && (
        <Empty>{items.length === 0 ? 'Aucun signalement. 🎉' : 'Rien dans cette vue.'}</Empty>
      )}
    </div>
  )
}

// ---------- Messages du formulaire de contact ----------
function ContactTab({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<ContactMessage[] | null>(null)
  const [err, setErr] = useState('')
  // On ouvre sur ce qui n'a pas été traité : le reste est de l'archive.
  const [vue, setVue] = useState('attente')
  const [q, setQ] = useState('')
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
      {(() => {
        const attente = items.filter((m) => !m.handled)
        // Un message sans réponse depuis 48 h : la personne a écrit et n'a rien
        // reçu. C'est ce qui fait écrire « votre site ne répond pas » ailleurs.
        const vieuxMsg = attente.filter((m) => Date.now() - m.createdAt > 2 * 86400_000)
        return (
          <>
            <KpisCrm>
              <KpiCrm valeur={formatPrice(attente.length)} libelle="en attente"
                ton={attente.length > 0 ? 'alerte' : 'bon'} />
              <KpiCrm valeur={formatPrice(vieuxMsg.length)} libelle="depuis 48 h"
                ton={vieuxMsg.length > 0 ? 'alerte' : 'neutre'} />
              <KpiCrm valeur={formatPrice(items.length - attente.length)} libelle="traités" />
              <KpiCrm valeur={formatPrice(items.filter((m) => Date.now() - m.createdAt < 7 * 86400_000).length)}
                libelle="cette semaine" />
            </KpisCrm>
            <AttenteCrm n={vieuxMsg.length}
              phrase={`${vieuxMsg.length} message${vieuxMsg.length > 1 ? 's' : ''} sans réponse depuis plus de 48 h`}
              action={<button onClick={() => setVue('vieux')}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-extrabold text-white">Les voir</button>} />
            <PucesCrm valeur={vue} onChange={setVue} puces={[
              { id: 'attente', label: 'En attente', n: attente.length, alerte: attente.length > 0 },
              ...(vieuxMsg.length > 0 ? [{ id: 'vieux', label: 'Depuis 48 h', n: vieuxMsg.length, alerte: true }] : []),
              { id: 'traites', label: 'Traités', n: items.length - attente.length },
              { id: 'tous', label: 'Tous', n: items.length },
            ]} />
            <BarreCrm q={q} onQ={setQ} placeholder="Chercher un nom, un e-mail, un sujet…" />
          </>
        )
      })()}
      {items.filter((m) => {
        if (vue === 'attente' && m.handled) return false
        if (vue === 'traites' && !m.handled) return false
        if (vue === 'vieux' && (m.handled || Date.now() - m.createdAt <= 2 * 86400_000)) return false
        return contient(m.name, q) || contient(m.email, q)
          || contient(m.subject, q) || contient(m.message, q)
      }).map((m) => {
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
  merged: ['Prolongation', 'bg-sky-50 text-sky-700'],
}

/**
 * Motifs de refus proposés en un clic.
 *
 * Ils partent TELS QUELS dans l'e-mail envoyé à l'annonceur : ils sont donc
 * rédigés pour être lus par lui, pas pour classer un dossier. Un refus sans
 * motif fait recommencer la même erreur, puis revenir se plaindre — et il
 * s'agit ici de quelqu'un qui a payé.
 */
const MOTIFS_REFUS = [
  'Nous n’avons pas retrouvé votre paiement depuis le numéro indiqué.',
  'Le visuel est trop flou ou illisible à l’écran.',
  'Le contenu ne respecte pas nos conditions (contenu interdit ou trompeur).',
  'Le lien indiqué ne fonctionne pas.',
  'Le montant reçu ne correspond pas à la formule choisie.',
]
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
  const [vueAds, setVueAds] = useState('toutes')
  const [qAds, setQAds] = useState('')
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

  // Refus : jamais en un clic. On demande le motif, qui part dans l'e-mail.
  const [refus, setRefus] = useState<{ ad: AdminAd; reason: string; busy: boolean } | null>(null)

  const act = async (a: AdminAd, action: 'approve' | 'reject') => {
    if (action === 'reject') { setRefus({ ad: a, reason: '', busy: false }); return }
    if (!confirm(`Activer « ${a.title} » ? La pub passera à l’écran (paiement de ${formatPrice(a.price)} F vérifié ?).`)) return
    try { await adminAdAction(a.id, action); load(); onChanged?.() } catch (e) { alert((e as Error).message) }
  }
  const confirmerRefus = async () => {
    if (!refus || refus.reason.trim().length < 5) return
    setRefus({ ...refus, busy: true })
    try {
      await adminAdAction(refus.ad.id, 'reject', refus.reason.trim())
      setRefus(null); load(); onChanged?.()
    } catch (e) {
      alert((e as Error).message)
      setRefus((r) => (r ? { ...r, busy: false } : r))
    }
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

      {/* Ce qui attend une décision, avant la liste. Une demande de publicité
          non validée, c'est un annonceur qui a PAYÉ et qui attend son écran. */}
      {(() => {
        const attente = items.filter((a) => a.status === 'pending')
        const actives = items.filter((a) => a.status === 'active')
        const recettes = items
          .filter((a) => ['active', 'expired', 'merged'].includes(a.status))
          .reduce((s2, a) => s2 + (a.price ?? 0), 0)
        const vieuxA = attente.filter((a) => Date.now() - (a.createdAt ?? Date.now()) > 86400_000)
        return (
          <>
            <KpisCrm>
              <KpiCrm valeur={formatPrice(attente.length)} libelle="à valider"
                sous="l’annonceur a payé" ton={attente.length > 0 ? 'alerte' : 'bon'} />
              <KpiCrm valeur={formatPrice(actives.length)} libelle="à l’écran" ton="bon" />
              <KpiCrm valeur={formatPrice(recettes)} libelle="recettes" sous="FCFA, diffusées" />
              <KpiCrm valeur={formatPrice(items.length)} libelle="campagnes" sous="depuis le début" />
            </KpisCrm>
            <AttenteCrm n={vieuxA.length}
              phrase={`${vieuxA.length} publicité${vieuxA.length > 1 ? 's' : ''} payée${vieuxA.length > 1 ? 's' : ''} ${vieuxA.length > 1 ? 'attendent' : 'attend'} validation depuis plus de 24 h`} />
            <PucesCrm valeur={vueAds} onChange={setVueAds} puces={[
              { id: 'toutes', label: 'Toutes', n: items.length },
              ...(attente.length > 0 ? [{ id: 'pending', label: 'À valider', n: attente.length, alerte: true }] : []),
              { id: 'active', label: 'À l’écran', n: actives.length },
              { id: 'expired', label: 'Terminées', n: items.filter((a) => a.status === 'expired').length },
            ]} />
            <BarreCrm q={qAds} onQ={setQAds} placeholder="Chercher un titre, un e-mail…" />
          </>
        )
      })()}

      {/* Demandes & diffusions */}
      <div className="rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
        <p className="font-display text-[15px] font-extrabold text-ink">Publicités · {items.length}</p>
        {items.length === 0 ? (
          <Empty>Aucune publicité pour l’instant.</Empty>
        ) : (
          <div className="divide-y divide-line">
            {items.filter((a) => {
              if (vueAds !== 'toutes' && a.status !== vueAds) return false
              return contient(a.title, qAds) || contient(a.email, qAds)
                || contient(a.description, qAds)
            }).map((a) => {
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
                        <img src={mediaUrl(a.images[0])} alt="" className="h-full w-full object-cover" />
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
                {/* object-contain, pas cover : le Patron doit voir le visuel ENTIER
                    qu'un annonceur a payé, pas une bande recadrée au centre. */}
                {preview.images.map((im, i) => (
                  <img key={i} src={mediaUrl(im)} alt="" className="h-20 w-full rounded-lg bg-gray-100 object-contain" />
                ))}
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

      {/* Refus : le motif est obligatoire et part dans l'e-mail à l'annonceur. */}
      {refus && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => !refus.busy && setRefus(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-ink">
                {refus.ad.status === 'active' ? 'Retirer de l’écran' : 'Refuser la publicité'}
              </h3>
              <button onClick={() => setRefus(null)} disabled={refus.busy} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-full text-gray-500 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <p className="text-[12.5px] leading-relaxed text-gray-500">
              « {refus.ad.title || 'image seule'} » · <b className="tnum">{formatPrice(refus.ad.price)} F</b>
              {refus.ad.email ? <> · {refus.ad.email}</> : null}
            </p>

            <p className="mt-3 text-sm font-semibold text-gray-700">Motif (envoyé à l’annonceur)</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {MOTIFS_REFUS.map((m) => (
                <button
                  key={m}
                  onClick={() => setRefus({ ...refus, reason: m })}
                  className={`rounded-lg border px-2.5 py-1.5 text-left text-[11.5px] leading-snug transition ${
                    refus.reason === m ? 'border-primary-500 bg-[#FFF6EC] text-ink' : 'border-line2 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea
              value={refus.reason}
              onChange={(e) => setRefus({ ...refus, reason: e.target.value.slice(0, 400) })}
              rows={3}
              placeholder="Ou écrivez le motif exact…"
              className="input mt-2 min-h-[76px] resize-y text-sm leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              {refus.reason.trim().length}/400 · Ce texte apparaît tel quel dans l’e-mail. L’annonceur
              a payé : dites-lui ce qu’il doit corriger.
            </p>

            <div className="mt-3 flex gap-2">
              <button onClick={() => setRefus(null)} disabled={refus.busy} className="btn-outline flex-1 py-2.5 text-sm">
                Annuler
              </button>
              <button
                onClick={confirmerRefus}
                disabled={refus.busy || refus.reason.trim().length < 5}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {refus.busy ? <Loader2 size={16} className="animate-spin" /> : <><Ban size={16} /> Confirmer le refus</>}
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
/**
 * COMMANDES — ce qui s'est vendu, et ce qui traîne.
 *
 * La liste brute ne répondait à aucune question. Trois maintenant : combien
 * a-t-on encaissé, quel est le panier moyen, et combien de ventes restent
 * ouvertes — une commande « en cours » depuis trois semaines, c'est une vente
 * perdue que personne n'a vue passer.
 */
function OrdersTab() {
  const [items, setItems] = useState<AdminOrder[] | null>(null)
  const [err, setErr] = useState('')
  const [etat, setEtat] = useState('toutes')
  const [q, setQ] = useState('')
  const [tri, setTri] = useState('recentes')
  const load = () => { setItems(null); setErr(''); fetchAdminOrders().then(setItems).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])
  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!items) return <Center><Loader2 className="animate-spin" size={20} /></Center>

  const n = (st: string) => items.filter((o) => o.status === st).length
  const finalisees = items.filter((o) => o.status === 'finalise')
  const encaisse = finalisees.reduce((s2, o) => s2 + o.total, 0)
  const panier = finalisees.length ? Math.round(encaisse / finalisees.length) : 0
  // Une commande ouverte depuis plus de deux semaines n'aboutira plus toute seule.
  const dormantes = items.filter((o) => o.status === 'en_cours' && Date.now() - o.createdAt > 14 * 86400_000)

  let liste = etat === 'toutes' ? items
    : etat === 'dormantes' ? dormantes
      : items.filter((o) => o.status === etat)
  if (q) liste = liste.filter((o) =>
    contient(o.buyerEmail, q) || contient(o.sellerEmail, q)
    || o.items.some((it) => contient(it.title, q)))
  liste = [...liste].sort((a, b) => (tri === 'montant' ? b.total - a.total : b.createdAt - a.createdAt))

  return (
    <div className="space-y-3">
      <KpisCrm>
        <KpiCrm valeur={formatPrice(encaisse)} libelle="encaissé" sous="FCFA, ventes finalisées" ton="bon" />
        <KpiCrm valeur={formatPrice(panier)} libelle="panier moyen" sous="FCFA par vente" />
        <KpiCrm valeur={formatPrice(n('en_cours'))} libelle="en cours" />
        <KpiCrm valeur={formatPrice(dormantes.length)} libelle="dorment" sous="ouvertes depuis 15 jours"
          ton={dormantes.length > 0 ? 'alerte' : 'neutre'} />
      </KpisCrm>

      <AttenteCrm n={dormantes.length}
        phrase={`${dormantes.length} commande${dormantes.length > 1 ? 's' : ''} ouverte${dormantes.length > 1 ? 's' : ''} depuis plus de deux semaines`}
        action={<button onClick={() => setEtat('dormantes')}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-extrabold text-white">Les voir</button>} />

      <PucesCrm valeur={etat} onChange={setEtat} puces={[
        { id: 'toutes', label: 'Toutes', n: items.length },
        { id: 'en_cours', label: 'En cours', n: n('en_cours') },
        { id: 'finalise', label: 'Finalisées', n: n('finalise') },
        ...(n('annule') > 0 ? [{ id: 'annule', label: 'Annulées', n: n('annule') }] : []),
        ...(dormantes.length > 0 ? [{ id: 'dormantes', label: 'Qui dorment', n: dormantes.length, alerte: true }] : []),
      ]} />

      <BarreCrm q={q} onQ={setQ} placeholder="Chercher un e-mail, un article…"
        tri={tri} onTri={setTri} tris={[['recentes', 'Plus récentes'], ['montant', 'Montant']]} />

      {liste.length === 0 ? <Empty>Aucune commande dans cette vue.</Empty> : liste.map((o) => {
        const dort = o.status === 'en_cours' && Date.now() - o.createdAt > 14 * 86400_000
        return (
          <div key={o.id} className={`rounded-2xl bg-white p-3 shadow-card ${dort ? 'ring-1 ring-red-200' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                o.status === 'finalise' ? 'bg-ivoire-green/10 text-ivoire-green-dark'
                  : o.status === 'annule' ? 'bg-gray-100 text-gray-500'
                    : 'bg-primary-100 text-primary-700'}`}>
                {statusLabel(o.status)}
              </span>
              <span className="tnum text-sm font-bold text-gray-900">{formatFCFA(o.total)}</span>
            </div>
            <ul className="mt-2 space-y-0.5">
              {o.items.map((it, i2) => (
                <li key={i2} className="flex justify-between text-sm text-gray-700">
                  <span className="min-w-0 truncate">{it.title}</span>
                  <span className="shrink-0 pl-2 text-gray-500">{formatPrice(it.price)} F</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-line pt-2 text-xs text-gray-400">
              {o.buyerEmail || '—'} → {o.sellerEmail || '—'} · {timeAgo(o.createdAt)}
              {dort && <span className="ml-1 font-bold text-red-600">· dort depuis {Math.floor((Date.now() - o.createdAt) / 86400_000)} jours</span>}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Abonnés newsletter ----------
/**
 * ABONNÉS — une liste ne vaut que par ce qu'elle grossit.
 *
 * Le nombre seul ne dit pas si l'on progresse. Les trente derniers jours, et
 * ce qu'ils pèsent, le disent : une liste qui n'a pris personne ce mois-ci est
 * une liste qu'on croit vivante et qui ne l'est plus.
 */
function NewsletterTab() {
  const [subs, setSubs] = useState<Subscriber[] | null>(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [vue, setVue] = useState('tous')
  const load = () => { setSubs(null); setErr(''); fetchNewsletter().then(setSubs).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  const exportCsv = (lignes: Subscriber[]) => {
    const csv = 'email,date_inscription\n' + lignes.map((s2) => `${s2.email},${new Date(s2.createdAt).toISOString().slice(0, 10)}`).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `chapci-newsletter-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!subs) return <Center><Loader2 className="animate-spin" size={20} /></Center>

  const j30 = subs.filter((s2) => Date.now() - s2.createdAt < 30 * 86400_000)
  const j30prec = subs.filter((s2) => {
    const age = Date.now() - s2.createdAt
    return age >= 30 * 86400_000 && age < 60 * 86400_000
  })
  const j7 = subs.filter((s2) => Date.now() - s2.createdAt < 7 * 86400_000)

  let liste = vue === 'j30' ? j30 : vue === 'j7' ? j7 : subs
  if (q) liste = liste.filter((s2) => contient(s2.email, q))
  liste = [...liste].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="space-y-3">
      <KpisCrm>
        <KpiCrm valeur={formatPrice(subs.length)} libelle="abonnés" />
        <KpiCrm valeur={formatPrice(j30.length)} libelle="ce mois-ci"
          sous={j30prec.length > 0 ? `${j30prec.length} le mois précédent` : undefined}
          ton={j30.length > j30prec.length ? 'bon' : j30.length === 0 ? 'alerte' : 'neutre'} />
        <KpiCrm valeur={formatPrice(j7.length)} libelle="cette semaine" />
        <KpiCrm valeur={subs.length ? `${Math.round(j30.length / 30 * 10) / 10}` : '0'}
          libelle="par jour" sous="moyenne sur 30 jours" />
      </KpisCrm>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <PucesCrm valeur={vue} onChange={setVue} puces={[
          { id: 'tous', label: 'Tous', n: subs.length },
          { id: 'j30', label: '30 derniers jours', n: j30.length },
          { id: 'j7', label: '7 derniers jours', n: j7.length },
        ]} />
        <button onClick={() => exportCsv(liste)} disabled={liste.length === 0}
          className="btn-primary shrink-0 py-2 text-sm disabled:opacity-50">
          <Download size={16} /> Exporter ({liste.length})
        </button>
      </div>

      <BarreCrm q={q} onQ={setQ} placeholder="Chercher une adresse…" />

      <p className="px-1 text-xs text-gray-400">
        L’export reprend EXACTEMENT ce qui est affiché — filtre et recherche compris.
        Importez-le dans Brevo, Mailchimp ou MailerLite.
      </p>

      {liste.length === 0 ? <Empty>Aucun abonné dans cette vue.</Empty> : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-line bg-white">
          {liste.map((s2) => (
            <li key={s2.email} className="flex items-center gap-3 px-4 py-3">
              <Mail size={16} className="shrink-0 text-primary-500" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{s2.email}</span>
              <span className="shrink-0 text-xs text-gray-400">{new Date(s2.createdAt).toLocaleDateString('fr-FR')}</span>
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

      <InvitationsTesteurs />
      <AutoOffers />
      <SmartAgents />
    </div>
  )
}

// ---------- Invitations au test fermé du Play Store ----------
//
// Réservé au propriétaire (le serveur le vérifie deux fois : périmètre
// « invitations », réservé propriétaire, ET contrôle explicite de l'e-mail).
//
// ⚠️ LES ADRESSES NE SONT PAS DANS LE CODE. Elles se collent ici, partent au
// serveur, et se rangent en base. Écrire dix-huit adresses personnelles dans un
// dépôt Git, c'est les y laisser pour toujours — dans chaque copie, chez chaque
// personne qui le clone.

const MESSAGE_INVITATION_DEFAUT = `Bonjour,

Chap.ci ouvre ses portes, et j’aimerais que vous soyez parmi les premiers à l’essayer.

C’est une place de marché 100 % ivoirienne : on y publie une annonce en deux minutes, gratuitement, et on trouve ce qu’on cherche près de chez soi — à Cocody, à Yopougon, à Bouaké, partout.

Ce que j’attends de vous est simple : installez l’application, servez-vous-en normalement pendant quelques jours, et dites-moi franchement ce qui ne va pas. C’est exactement ce dont j’ai besoin avant l’ouverture au public.

Merci du temps que vous y mettrez.`

function InvitationsTesteurs() {
  const [liste, setListe] = useState<ListeInvites | null>(null)
  const [adresses, setAdresses] = useState('')
  const [sujet, setSujet] = useState('Vous êtes invité à tester Chap.ci 🇨🇮')
  const [message, setMessage] = useState(MESSAGE_INVITATION_DEFAUT)
  const [relancer, setRelancer] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [avancement, setAvancement] = useState(0)
  const [resultat, setResultat] = useState('')
  const [deplie, setDeplie] = useState(false)

  const recharger = () => { fetchInvites().then(setListe).catch(() => setListe(null)) }
  useEffect(recharger, [])

  // Combien d'adresses sont dans le champ, sans attendre le serveur.
  const compte = adresses.split(/[\s,;]+/).filter((a) => a.includes('@')).length

  const envoyer = async () => {
    if (!compte) { setResultat('⚠️ Collez au moins une adresse.'); return }
    if (!confirm(
      `Envoyer l’invitation à ${compte} adresse${compte > 1 ? 's' : ''} ?\n\n`
      + 'Vérifiez d’abord que le test fermé est PUBLIÉ dans la Play Console : '
      + 'sans cela, le lien « Devenir testeur » ne mène nulle part, et il faudra tout renvoyer.',
    )) return

    setEnvoi(true); setAvancement(0); setResultat('')
    let envoyes = 0, echecs = 0, ignores = 0, offset = 0, total = compte
    const rejetes: string[] = []
    try {
      // Envoi par lots, curseur croissant — comme les campagnes. Un envoi coupé
      // au milieu ne se rattrape pas : on ne saurait plus qui a reçu quoi.
      for (;;) {
        const precedent = offset
        const r = await envoyerInvitations(adresses, sujet.trim(), message.trim(), { relancer, offset, limit: 10 })
        envoyes += r.envoyes; echecs += r.echecs; ignores += r.ignores
        total = r.total; offset = r.traites
        if (r.rejetes?.length) rejetes.push(...r.rejetes)
        setAvancement(total ? Math.min(100, Math.round((offset / total) * 100)) : 100)
        if (r.fini) break
        if (offset <= precedent) break // garde anti-boucle
      }
      const bouts = [`✓ ${envoyes} invitation${envoyes > 1 ? 's' : ''} envoyée${envoyes > 1 ? 's' : ''}`]
      if (ignores) bouts.push(`${ignores} déjà invitée${ignores > 1 ? 's' : ''} (non relancée${ignores > 1 ? 's' : ''})`)
      if (echecs) bouts.push(`${echecs} échec${echecs > 1 ? 's' : ''} d’envoi`)
      if (rejetes.length) bouts.push(`adresses refusées : ${Array.from(new Set(rejetes)).join(', ')}`)
      setResultat(bouts.join(' · '))
      recharger()
    } catch (e) { setResultat('⚠️ ' + (e as Error).message) }
    finally { setEnvoi(false) }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <button onClick={() => setDeplie((v) => !v)} className="flex w-full items-center gap-2 text-left">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ivoire-green/10 text-ivoire-green-dark">
          <UserPlus size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-gray-800">Inviter des testeurs (Play Store)</span>
          <span className="block text-xs text-gray-500">
            {liste ? `${liste.invites.length} personne${liste.invites.length > 1 ? 's' : ''} déjà invitée${liste.invites.length > 1 ? 's' : ''}` : 'Test fermé — 12 testeurs, 14 jours'}
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-gray-400 transition ${deplie ? 'rotate-180' : ''}`} />
      </button>

      {deplie && (
        <div className="mt-3 space-y-3 border-t border-line pt-3">
          {/* L'ordre compte, et c'est tout l'enjeu : un lien envoyé avant la
              publication du test ne mène nulle part. */}
          <div className="rounded-xl bg-amber-50 p-3 text-[13px] leading-relaxed text-amber-900">
            <p className="font-bold">⚠️ Publiez le test fermé AVANT d’envoyer</p>
            <p className="mt-1">
              Play Console → <b>Tests → Test fermé</b> → la version doit être <b>envoyée pour examen</b>, puis
              disponible. Tant qu’elle est en <b>brouillon</b>, le lien « Devenir testeur » ne mène nulle part,
              et il faudra tout renvoyer.
            </p>
            {liste?.lien && (
              <p className="mt-1.5 break-all text-[12px] text-amber-800">
                Lien envoyé : <b>{liste.lien}</b>
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">
              Adresses e-mail · une par ligne (ou séparées par des virgules)
            </label>
            <textarea
              value={adresses}
              onChange={(e) => setAdresses(e.target.value)}
              disabled={envoi}
              rows={6}
              className="input resize-y font-mono text-[13px]"
              placeholder={'exemple1@gmail.com\nexemple2@gmail.com'}
            />
            <p className="mt-1 text-xs text-gray-500">
              {compte > 0 ? `${compte} adresse${compte > 1 ? 's' : ''} détectée${compte > 1 ? 's' : ''}.` : 'Collez la liste telle quelle depuis la Play Console.'}
              {' '}Ces adresses ne sont écrites nulle part dans le code du site.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Objet</label>
            <input value={sujet} onChange={(e) => setSujet(e.target.value)} disabled={envoi} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Votre mot</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} disabled={envoi} rows={8} className="input resize-y" />
            <p className="mt-1 text-xs text-gray-500">
              Les trois étapes, le bouton « Devenir testeur » et le rappel des 14 jours sont ajoutés
              automatiquement sous votre texte. Envoyé depuis <b>no-reply@chap.ci</b> ; les réponses
              arrivent sur <b>contact@chap.ci</b>.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={relancer} onChange={(e) => setRelancer(e.target.checked)} disabled={envoi} className="h-4 w-4 accent-primary-500" />
            Relancer aussi celles qui ont déjà reçu l’invitation
          </label>

          <button onClick={envoyer} disabled={envoi || !compte} className="btn-primary w-full py-3 disabled:opacity-50">
            {envoi
              ? <><Loader2 size={18} className="animate-spin" /> Envoi… {avancement}%</>
              : <><Send size={18} /> Envoyer à {compte} adresse{compte > 1 ? 's' : ''}</>}
          </button>
          {envoi && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-primary-500 transition-[width] duration-300" style={{ width: `${avancement}%` }} />
            </div>
          )}
          {resultat && <p className={`text-sm ${resultat.startsWith('✓') ? 'text-ivoire-green-dark' : 'text-red-600'}`}>{resultat}</p>}

          {!!liste?.invites.length && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500">Déjà invitées</p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {liste.invites.map((i) => (
                  <div key={i.email} className="flex items-center gap-2 rounded-lg bg-cream-100 px-2.5 py-1.5 text-[12.5px]">
                    <span className="min-w-0 flex-1 truncate text-gray-700">{i.email}</span>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${i.statut === 'envoye' ? 'bg-ivoire-green/10 text-ivoire-green-dark' : 'bg-red-50 text-red-700'}`}>
                      {i.statut === 'envoye' ? 'envoyée' : 'échec'}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-500">{timeAgo(i.dernierEnvoi)}{i.envois > 1 ? ` · ${i.envois}×` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
  { id: 'rappels-pro',    label: 'Rappels du professionnel',    desc: 'Message sans réponse depuis 24 h · annonce qui ne bouge plus depuis 10 jours · bilan de la semaine, le lundi matin.', schedule: 'Chaque jour à 6h', cronExpr: '0 6 * * *', maxAgeH: 26 },
  { id: 'stats',          label: 'Statistiques hebdo',          desc: 'Agrégats anonymes d’activité (pour le rapport hebdomadaire).', query: '?days=7',                schedule: 'Lundi à 7h',          cronExpr: '0 7 * * 1',   maxAgeH: 192 },
  { id: 'report',         label: 'Rapport mensuel',             desc: 'Envoie à contact@chap.ci un récap activité + sécurité + santé de la base.',   query: '?days=30',  schedule: 'Le 1er du mois à 7h', cronExpr: '0 7 1 * *',   maxAgeH: 768 },
]

function AutomationTab() {
  const [info, setInfo] = useState<{
    cronKey: string
    site: string
    runs?: Record<string, { lastOkAt: string | null; runs: number }>
    trackedSince?: string | null
    /** Une clé posée dans config.php a été refusée et remplacée en silence. */
    cleIgnoree?: boolean
    cleMotif?: string
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
    if (at) {
      const ms = Date.parse(at)
      if (Number.isNaN(ms)) return { tone: 'bad' as const, text: 'date illisible' }
      const late = Date.now() - ms > j.maxAgeH * 3600_000
      return { tone: late ? ('warn' as const) : ('ok' as const), text: timeAgo(ms) }
    }
    // Aucune trace. Ce n'est une PANNE que si le suivi tourne depuis assez
    // longtemps pour que la tâche ait forcément dû passer. Une tâche de midi
    // n'a rien à se reprocher à 8 h du matin : on ne l'accuse pas.
    const depuis = info.trackedSince ? Date.parse(info.trackedSince) : NaN
    const suiviTropJeune = Number.isNaN(depuis) || Date.now() - depuis < j.maxAgeH * 3600_000
    return suiviTropJeune
      ? { tone: 'wait' as const, text: 'en attente de son 1ᵉʳ passage' }
      : { tone: 'bad' as const, text: 'jamais exécutée' }
  }
  const TONE = {
    ok:   'bg-ivoire-green/10 text-ivoire-green-dark',
    wait: 'bg-gray-100 text-gray-500',
    warn: 'bg-amber-100 text-amber-800',
    bad:  'bg-red-100 text-red-700',
  }
  // Seules les tâches réellement fautives déclenchent l'alerte : une tâche qui
  // attend son heure n'est pas un incident, et une alarme qui se trompe le
  // premier jour apprend à ne plus la lire.
  const broken = CRON_JOBS.filter((j) => ['warn', 'bad'].includes(statusOf(j).tone))

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
        {/* La clé de config.php a été refusée et remplacée en silence.
            C'est la cause la plus probable d'un « Clé invalide » qui se répète :
            le Patron copie SA clé dans cPanel, le serveur en attend une autre, et
            jusqu'ici rien nulle part ne le disait. */}
        {info.cleIgnoree && (
          <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
            ⛔ <b>La clé écrite dans <code className="rounded bg-red-100 px-1">api/config.php</code> a été refusée</b>
            {info.cleMotif ? <> — {info.cleMotif}</> : null}. Le serveur en utilise une autre, générée
            automatiquement : c’est celle affichée ci-dessus, et c’est la <b>seule</b> qu’il accepte.
            <br />
            Si une de vos tâches cPanel porte encore l’ancienne, elle échoue à chaque passage avec
            « Clé invalide ». Recopiez les commandes ci-dessous, ou corrigez la ligne{' '}
            <code className="rounded bg-red-100 px-1">cron_key</code> de config.php — puis revenez ici vérifier
            que cet avertissement a disparu.
          </p>
        )}
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
                  {{ ok: '✓ ', wait: '· ', warn: '⚠ ', bad: '⚠ ' }[statusOf(j).tone]}{statusOf(j).text}
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
  if (img) return <img src={mediaUrl(img)} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
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
