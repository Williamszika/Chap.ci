import { useEffect, useMemo, useState } from 'react'
import { Loader2, Check, X, Trash2, Plus, RefreshCw, AlertTriangle, Megaphone, HeartHandshake } from 'lucide-react'
import {
  fetchRevenues, addRevenue, confirmRevenue, deleteRevenue,
  REVENUE_METHODS, methodLabel, type Revenues, type RevenueLine, type RevenueKind,
} from '../lib/revenues'
import { formatPrice } from '../lib/format'

const F = (x: number) => `${formatPrice(x)} F`
const jour = (ms?: number | null) =>
  ms ? new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
/** « 2026-07 » → « juillet 2026 ». */
const moisLong = (m: string) => {
  const d = new Date(`${m}-01T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? m : d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function Carte({ value, label, sub, tint = 'bg-white' }: { value: string; label: string; sub?: string; tint?: string }) {
  return (
    <div className={`rounded-2xl border border-line ${tint} px-3 py-3.5 text-center shadow-card`}>
      <p className="tnum font-display text-[17px] font-extrabold leading-none text-ink md:text-xl">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      {sub && <p className="mt-0.5 text-[10.5px] text-gray-400">{sub}</p>}
    </div>
  )
}

/** Une ligne de recette, avec sa case de pointage. */
function Ligne({ r, onToggle, onDelete }: {
  r: RevenueLine
  onToggle: (r: RevenueLine, v: boolean) => void
  onDelete?: (r: RevenueLine) => void
}) {
  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <button
        onClick={() => onToggle(r, !r.confirmed)}
        aria-label={r.confirmed ? 'Retirer le pointage' : 'Marquer comme retrouvé sur le relevé'}
        title={r.confirmed ? `Retrouvé sur le relevé le ${jour(r.confirmedAt)}` : 'Pas encore retrouvé sur le relevé Mobile Money'}
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${
          r.confirmed
            ? 'border-ivoire-green bg-ivoire-green text-white'
            : 'border-line2 bg-white text-transparent hover:border-primary-400'
        }`}
      >
        <Check size={14} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="truncate text-[13.5px] font-semibold text-ink">{r.label}</span>
          <span className="tnum shrink-0 text-[13.5px] font-extrabold text-primary-700">{F(r.amount)}</span>
        </p>
        <p className="mt-0.5 text-[11.5px] text-gray-400">
          {jour(r.at)} · {methodLabel(r.method)}
          {r.number ? <> · <span className="tnum">{r.number}</span></> : null}
          {r.email ? <> · {r.email}</> : null}
          {!r.confirmed && <span className="ml-1 font-semibold text-amber-600">à vérifier</span>}
        </p>
        {r.note ? <p className="mt-0.5 text-[11.5px] italic text-gray-500">{r.note}</p> : null}
      </div>
      {onDelete && (
        <button onClick={() => onDelete(r)} aria-label="Supprimer" className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

/**
 * Recettes du site — onglet du tableau de bord, réservé au propriétaire.
 *
 * Il répond à une question simple : combien le site a-t-il encaissé, et cet
 * argent est-il bien sur le compte Mobile Money ? La seconde moitié de la
 * question ne peut pas être répondue par le serveur : aucune API d'Orange
 * Money ou de Wave n'est branchée ici (il faudrait un compte marchand et des
 * identifiants). Le pointage est donc manuel — on coche ce que l'on retrouve
 * sur le relevé du téléphone. C'est peu spectaculaire, mais c'est vrai.
 */
export function RevenuesTab() {
  const [data, setData] = useState<Revenues | null>(null)
  const [err, setErr] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)

  // Saisie d'une recette relevée sur le compte Mobile Money.
  const [ouvert, setOuvert] = useState(false)
  const [kind, setKind] = useState<RevenueKind>('don')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('orange')
  const [number, setNumber] = useState('')
  const [when, setWhen] = useState('')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => {
    setErr('')
    fetchRevenues(from, to).then(setData).catch((e) => setErr((e as Error).message))
  }
  useEffect(load, [from, to])

  const toutes = useMemo(
    () => (data ? [...data.pubs, ...data.dons, ...data.autres].sort((a, b) => b.at - a.at) : []),
    [data],
  )
  const maxMois = useMemo(() => Math.max(1, ...(data?.parMois ?? []).map((m) => m.total)), [data])

  const toggle = async (r: RevenueLine, v: boolean) => {
    setData((d) => d && {
      ...d,
      pubs: d.pubs.map((x) => (x.id === r.id ? { ...x, confirmed: v } : x)),
      dons: d.dons.map((x) => (x.id === r.id ? { ...x, confirmed: v } : x)),
      autres: d.autres.map((x) => (x.id === r.id ? { ...x, confirmed: v } : x)),
    })
    try { await confirmRevenue(r.id, v); load() } catch (e) { alert((e as Error).message); load() }
  }
  const remove = async (r: RevenueLine) => {
    if (!confirm(`Supprimer « ${r.label} » (${F(r.amount)}) du relevé des recettes ?`)) return
    try { await deleteRevenue(r.id); load() } catch (e) { alert((e as Error).message) }
  }
  const ajouter = async () => {
    const montant = Number(amount.replace(/\D/g, ''))
    if (!montant) { setMsg('Indiquez le montant reçu.'); return }
    setBusy(true); setMsg('')
    try {
      await addRevenue({
        kind, label: label.trim() || (kind === 'don' ? 'Don' : 'Recette'),
        amount: montant, method, number: number.trim(), occurredAt: when, note: note.trim(),
      })
      setMsg('✓ Recette enregistrée.')
      setLabel(''); setAmount(''); setNumber(''); setNote('')
      load()
    } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) }
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 text-center shadow-card">
        <AlertTriangle className="mx-auto text-amber-500" size={22} />
        <p className="mt-2 text-sm text-gray-600">{err}</p>
        <button onClick={load} className="btn-outline mt-3 px-4 py-2 text-sm"><RefreshCw size={15} /> Réessayer</button>
      </div>
    )
  }
  if (!data) return <div className="grid min-h-[30vh] place-items-center text-gray-400"><Loader2 className="animate-spin" size={20} /></div>

  const t = data.totaux

  return (
    <div className="space-y-3.5">
      {/* Totaux */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Carte value={F(t.total)} label="total encaissé" sub={from || to ? 'sur la période' : 'depuis le début'} />
        <Carte value={F(t.pub)} label="publicités" sub={`${data.pubs.length} bannière${data.pubs.length > 1 ? 's' : ''}`} />
        <Carte value={F(t.don)} label="dons" sub={`${data.dons.length} don${data.dons.length > 1 ? 's' : ''}`} />
        <Carte
          value={F(t.confirme)}
          label="vu sur le relevé"
          sub={t.aVerifier > 0 ? `${F(t.aVerifier)} à vérifier` : 'tout est pointé'}
          tint={t.aVerifier > 0 ? 'bg-amber-50' : 'bg-ivoire-green/5'}
        />
      </div>

      {/* Ce que ces chiffres veulent dire — et ce qu'ils ne disent pas. */}
      <div className="rounded-2xl border border-[#F4D9B0] bg-[#FFF6EC] p-3.5 text-[12.5px] leading-relaxed text-gray-700">
        <p className="font-bold text-ink">💡 Comment lire ce tableau</p>
        <p className="mt-1">
          Les <b>publicités</b> sont comptées automatiquement : le site connaît leur prix et le numéro qui a payé.
          Les <b>dons</b>, non — la page de don affiche seulement votre numéro, l’argent va directement de votre
          donateur à Orange Money ou Wave, sans passer par le site. Il n’existe aucun moyen pour Chap.ci de les
          deviner : vous les relevez sur votre téléphone et vous les inscrivez ici.
        </p>
        <p className="mt-1.5">
          La coche verte veut dire <b>« retrouvé sur mon relevé Mobile Money »</b> — pas « payé ». Approuver une
          publicité la coche automatiquement, puisque vous avez vérifié le versement pour l’approuver.
          Décochez si vous ne le retrouvez pas : la ligne repasse alors en « à vérifier ».
        </p>
      </div>

      {/* Période */}
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-white p-3.5 shadow-card">
        <label className="text-xs font-semibold text-gray-500">
          Du
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input mt-1 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-gray-500">
          Au
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input mt-1 py-2 text-sm" />
        </label>
        {(from || to) && (
          <button onClick={() => { setFrom(''); setTo('') }} className="btn-outline px-3 py-2 text-xs">
            <X size={14} /> Toute la période
          </button>
        )}
      </div>

      {/* Recettes par mois */}
      {data.parMois.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="font-display text-[15px] font-extrabold text-ink">Recettes par mois</p>
          <div className="mt-3 space-y-1.5">
            {data.parMois.map((m) => (
              <div key={m.mois} className="flex items-center gap-2.5">
                <span className="w-24 shrink-0 text-[11.5px] capitalize text-gray-500">{moisLong(m.mois)}</span>
                <span className="h-4 flex-1 overflow-hidden rounded-full bg-cream-100">
                  <span className="block h-full rounded-full bg-primary-400" style={{ width: `${Math.max(3, (m.total / maxMois) * 100)}%` }} />
                </span>
                <span className="tnum w-24 shrink-0 text-right text-[12.5px] font-bold text-ink">{F(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saisie d'un don relevé sur le compte Mobile Money */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <button onClick={() => setOuvert((o) => !o)} className="flex w-full items-center justify-between gap-2 text-left">
          <span className="font-display text-[15px] font-extrabold text-ink">
            <HeartHandshake size={16} className="mr-1 inline text-primary-500" /> Inscrire un don reçu
          </span>
          <span className="rounded-lg border border-line2 px-2.5 py-1.5 text-xs font-semibold text-gray-600">
            {ouvert ? 'Fermer' : <><Plus size={13} className="inline" /> Ajouter</>}
          </span>
        </button>
        {ouvert && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="text-[12px] leading-relaxed text-gray-500">
              Ouvrez votre relevé Orange Money ou Wave, et recopiez ici ce que vous y voyez.
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold text-gray-500">
                Nature
                <select value={kind} onChange={(e) => setKind(e.target.value as RevenueKind)} className="input mt-1 py-2.5 text-sm">
                  <option value="don">Don</option>
                  <option value="pub">Publicité (hors site)</option>
                  <option value="autre">Autre recette</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Montant reçu (FCFA)
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                  inputMode="numeric"
                  placeholder="Ex : 5000"
                  className="input tnum mt-1 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-gray-500 sm:col-span-2">
                De qui / libellé
                <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} placeholder="Ex : Don de Koffi A." className="input mt-1 py-2.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Moyen
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="input mt-1 py-2.5 text-sm">
                  {REVENUE_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Numéro du payeur
                <input value={number} onChange={(e) => setNumber(e.target.value.replace(/[^\d+ ]/g, ''))} maxLength={20} placeholder="07 00 00 00 00" className="input tnum mt-1 py-2.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Date de réception
                <input type="date" value={when} onChange={(e) => setWhen(e.target.value)} className="input mt-1 py-2.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Note (facultatif)
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="N° de transaction…" className="input mt-1 py-2.5 text-sm" />
              </label>
            </div>
            {msg && <p className={`mt-2 text-sm ${msg.startsWith('✓') ? 'text-ivoire-green-dark' : 'text-red-600'}`}>{msg}</p>}
            <button onClick={ajouter} disabled={busy} className="btn-primary mt-3 w-full py-2.5 text-sm">
              {busy ? <Loader2 size={17} className="animate-spin" /> : <><Plus size={16} /> Enregistrer cette recette</>}
            </button>
          </div>
        )}
      </div>

      {/* Le relevé complet */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <p className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-display text-[15px] font-extrabold text-ink">Relevé · {toutes.length} recette{toutes.length > 1 ? 's' : ''}</span>
          {t.nbAVerifier > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              {t.nbAVerifier} à retrouver sur le relevé
            </span>
          )}
        </p>
        {toutes.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Aucune recette sur cette période.</p>
        ) : (
          <div className="mt-1 divide-y divide-line">
            {toutes.map((r) => (
              <Ligne
                key={r.id}
                r={r}
                onToggle={toggle}
                // Une publicité vient des données du site : on ne la supprime
                // pas d'ici, on la gère dans l'onglet Publicités.
                onDelete={data.pubs.some((p) => p.id === r.id) ? undefined : remove}
              />
            ))}
          </div>
        )}
        <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] leading-relaxed text-gray-400">
          <Megaphone size={12} className="mr-1 inline" />
          Les diffusions Chap.ci et les messages du Bureau de Croissance ne figurent pas ici : ils
          n’ont jamais été facturés. Une demande refusée non plus.
        </p>
      </div>
    </div>
  )
}
