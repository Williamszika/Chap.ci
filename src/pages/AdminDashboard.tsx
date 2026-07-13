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
  fetchModerators, addModerator, removeModerator, sendTestEmail, getSmtp, saveSmtp,
  campaignCount, campaignSend, digestInfo, digestSend, suggestionsTest,
  type AdminStats, type AdminUser, type AdminListing, type AdminOrder, type Moderators, type SmtpSettings,
} from '../lib/admin'
import { fetchNewsletter, type Subscriber } from '../lib/newsletter'
import { ShieldCheck, UserPlus, Crown, MailCheck, Send, Save, CheckCircle2, Megaphone, CalendarClock, Copy } from 'lucide-react'

type Tab = 'overview' | 'listings' | 'users' | 'orders' | 'newsletter' | 'moderators' | 'emails' | 'campaigns'

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
          {([['overview','Aperçu'],['listings','Annonces'],['users','Utilisateurs'],['orders','Commandes'],['newsletter','Abonnés'],['campaigns','Campagnes'],['moderators','Modérateurs'],['emails','Emails']] as [Tab,string][]).map(([id,label]) => (
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
        {tab === 'campaigns' && <CampaignsTab />}
        {tab === 'moderators' && <ModeratorsTab />}
        {tab === 'emails' && <EmailsTab />}
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

// ---------- Modérateurs ----------
function ModeratorsTab() {
  const [data, setData] = useState<Moderators | null>(null)
  const [err, setErr] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => { setData(null); setErr(''); fetchModerators().then(setData).catch((e) => setErr((e as Error).message)) }
  useEffect(load, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setMsg('Adresse email invalide.'); return }
    setBusy(true); setMsg('')
    try {
      const { emailed, already } = await addModerator(value)
      setEmail('')
      const fresh = await fetchModerators()
      setData(fresh)
      const base = already ? 'Cet email était déjà modérateur' : '✓ Modérateur ajouté'
      setMsg(emailed
        ? `${base} — email de notification envoyé.`
        : `${base}. Envoi de l’email impossible : activez le SMTP dans api/config.php (mot de passe de no-reply@chap.ci).`)
    } catch (e) { setMsg((e as Error).message) }
    finally { setBusy(false) }
  }

  const remove = async (m: string) => {
    if (!confirm(`Retirer les droits de modérateur à ${m} ?`)) return
    try { await removeModerator(m); setData((p) => p ? { ...p, moderators: p.moderators.filter((x) => x.email !== m) } : p) }
    catch (e) { alert((e as Error).message) }
  }

  const resend = async (m: string) => {
    setMsg('')
    try {
      const { emailed } = await addModerator(m)
      setMsg(emailed
        ? `✓ Email renvoyé à ${m}.`
        : `Envoi impossible à ${m} : activez le SMTP dans api/config.php.`)
    } catch (e) { setMsg((e as Error).message) }
  }

  if (err) return <ErrRetry msg={err} onRetry={load} />
  if (!data) return <Center><Loader2 className="animate-spin" size={20} /></Center>
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary-50 p-3 text-sm text-primary-800">
        <p className="flex items-center gap-1.5 font-semibold"><ShieldCheck size={16} /> Rôles</p>
        <p className="mt-1 text-primary-700">
          Un modérateur a <b>exactement les mêmes accès</b> que toi au tableau de bord.
          Le <b>propriétaire</b> ne peut pas être retiré.
        </p>
      </div>

      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (msg) setMsg('') }}
          placeholder="email@du-moderateur.com"
          autoComplete="off"
          className="input"
          aria-label="Email du modérateur"
        />
        <button type="submit" disabled={busy} className="btn-primary py-3 disabled:opacity-50">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> Ajouter</>}
        </button>
      </form>
      {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{msg}</p>}

      <div>
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Propriétaire</p>
        <div className="space-y-2">
          {data.owners.map((o) => (
            <div key={o} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Crown size={18} /></span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">{o}</span>
              <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">Propriétaire</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Modérateurs ({data.moderators.length})
        </p>
        {data.moderators.length === 0 ? (
          <Empty>Aucun modérateur. Ajoutez-en un ci-dessus.</Empty>
        ) : (
          <div className="space-y-2">
            {data.moderators.map((m) => (
              <div key={m.email} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600"><ShieldCheck size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-800">{m.email}</span>
                  <span className="text-xs text-gray-400">ajouté {timeAgo(m.createdAt)}</span>
                </span>
                <button onClick={() => resend(m.email)} aria-label="Renvoyer l’email" title="Renvoyer l’email" className="shrink-0 rounded-xl p-2 text-primary-500 transition hover:bg-primary-50">
                  <Send size={17} />
                </button>
                <button onClick={() => remove(m.email)} aria-label="Retirer" className="shrink-0 rounded-xl p-2 text-red-500 transition hover:bg-red-50">
                  <Trash2 size={18} />
                </button>
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
        const r = await campaignSend(subject.trim(), message.trim(), offset, 25)
        sent += r.sent; grand = r.total; offset = r.processed
        setProgress(grand ? Math.min(100, Math.round((offset / grand) * 100)) : 100)
        if (r.done) break
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
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
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
      if (r.listings === 0) {
        setMsg('ℹ️ Aucune annonce à suggérer pour l’instant (publiez d’autres annonces, puis réessayez).')
      } else if (r.personalized === false) {
        setMsg(`✓ Email d’aperçu envoyé (${r.listings} annonces récentes). Astuce : vos propres annonces ne se recommandent pas ; c’est pourquoi c’est un aperçu. Les vrais abonnés recevront des suggestions personnalisées selon leur historique.`)
      } else {
        setMsg(`✓ Email de suggestions envoyé (${r.listings} annonces choisies selon vos centres d’intérêt).`)
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
          <button onClick={copy} className="shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50">
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
              <button onClick={() => copy(type)} className="shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50">
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

      <div className="rounded-2xl border border-gray-200 p-4">
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
