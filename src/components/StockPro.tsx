import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Minus, Plus, PackageOpen, RefreshCw, AlertTriangle } from 'lucide-react'
import { phpProStock, phpStockMaj, type LigneStock, type StockPro as DonneesStock } from '../lib/php'
import { formatFCFA, formatPrice } from '../lib/format'
import { mediaUrl } from '../lib/native'
import { useToast } from '../store/ToastContext'

/**
 * LE STOCK DU PROFESSIONNEL (07/09/2026).
 *
 * Le Patron : « pour les comptes Pro, il doit y avoir une gérance de stock et
 * un signalement si les produits sont sous le minimum, 5 ». Chaque produit
 * porte sa quantité et son seuil ; « + » et « − » écrivent tout de suite ;
 * une vente conclue retire une unité toute seule. Ce qui manque est en tête,
 * en rouge — on ouvre l'écran pour savoir quoi commander, pas pour lire une
 * liste.
 */
export function StockPro({ pro, onChange }: { pro: boolean; onChange?: () => void }) {
  const toast = useToast()
  const [data, setData] = useState<DonneesStock | null>(null)
  const [err, setErr] = useState('')
  const [occupe, setOccupe] = useState<string | null>(null)

  const charger = useCallback(() => {
    setErr('')
    phpProStock().then(setData).catch((e) => setErr((e as Error).message))
  }, [])
  useEffect(() => { if (pro) charger() }, [pro, charger])

  async function ecrire(l: LigneStock, corps: { stock?: number | null; stockMin?: number }) {
    if (occupe) return
    setOccupe(l.id)
    try {
      const r = await phpStockMaj(l.id, corps)
      setData((d) => d ? recalculer({ ...d, annonces: d.annonces.map((x) => x.id === l.id ? { ...x, stock: r.stock, stockMin: r.stockMin, stockEtat: r.stockEtat } : x) }) : d)
      onChange?.()
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setOccupe(null) }
  }

  if (!pro) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-card">
        <p className="text-3xl">📦</p>
        <p className="mt-2 font-display text-base font-bold text-ink">Le stock est réservé aux comptes professionnels</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
          Une boutique approuvée suit la quantité de chaque produit et reçoit une alerte sous le minimum.
        </p>
        <Link to="/pro" className="btn-primary mt-4 inline-flex py-2 text-sm">Devenir professionnel</Link>
      </div>
    )
  }
  if (err) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <p className="text-sm text-red-600">⚠️ {err}</p>
        <button onClick={charger} className="btn-outline mt-3 py-2 text-sm"><RefreshCw size={16} /> Réessayer</button>
      </div>
    )
  }
  if (!data) return <div className="flex justify-center py-12 text-gray-500"><Loader2 className="animate-spin" size={20} /></div>

  const suivies = data.annonces.filter((l) => l.stock !== null)
  const autres = data.annonces.filter((l) => l.stock === null && !l.sold)

  return (
    <div className="space-y-4">
      {/* Le bandeau : ce qui manque, avant tout. */}
      {data.bas > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" />
          <div className="min-w-0 text-sm text-red-800">
            <p className="font-bold">
              {formatPrice(data.bas)} produit{data.bas > 1 ? 's' : ''} sous le minimum
              {data.rupture > 0 ? `, dont ${formatPrice(data.rupture)} en rupture` : ''}
            </p>
            <p className="mt-0.5 text-[12.5px] text-red-700">
              Réapprovisionnez, ou baissez le minimum si ce produit se vend lentement. À zéro, l’annonce affiche « Rupture de stock » et ne se commande plus.
            </p>
          </div>
        </div>
      ) : suivies.length > 0 ? (
        <div className="rounded-2xl border border-ivoire-green/25 bg-ivoire-green/8 px-4 py-3 text-sm text-ivoire-green-dark">
          <span className="font-bold">Rien ne manque.</span> {formatPrice(suivies.length)} produit{suivies.length > 1 ? 's' : ''} suivi{suivies.length > 1 ? 's' : ''} ; chaque vente conclue retire une unité, et vous êtes prévenu sous le minimum.
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white px-4 py-4 text-sm text-gray-600 shadow-card">
          <p className="font-display text-[15px] font-bold text-ink">Suivez la quantité de vos produits</p>
          <p className="mt-1">
            Touchez « Suivre » sur une annonce, indiquez combien il vous en reste : chaque vente conclue en retire une, et vous recevez une alerte quand il en reste {data.minDefaut} ou moins — puis une autre à zéro.
          </p>
        </div>
      )}

      {suivies.length > 0 && (
        <section className="rounded-2xl border border-line bg-white shadow-card">
          <p className="px-4 pt-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-400">Produits suivis</p>
          <ul className="divide-y divide-line">
            {suivies.map((l) => <Ligne key={l.id} l={l} occupe={occupe === l.id} onEcrire={(c) => ecrire(l, c)} />)}
          </ul>
        </section>
      )}

      {autres.length > 0 && (
        <section className="rounded-2xl border border-line bg-white shadow-card">
          <p className="px-4 pt-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-400">Sans suivi de stock</p>
          <ul className="divide-y divide-line">
            {autres.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                <Vignette l={l} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{l.title}</p>
                  <p className="text-xs text-gray-500">{l.price > 0 ? formatFCFA(l.price) : 'Gratuit'}</p>
                </div>
                <button
                  onClick={() => ecrire(l, { stock: 10, stockMin: data.minDefaut })}
                  disabled={occupe === l.id}
                  className="btn-outline shrink-0 px-3 py-1.5 text-xs"
                >
                  {occupe === l.id ? <Loader2 size={14} className="animate-spin" /> : <PackageOpen size={14} />} Suivre
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.annonces.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">Aucune annonce pour l’instant. Publiez un produit, puis suivez son stock ici.</p>
      )}
    </div>
  )
}

function recalculer(d: DonneesStock): DonneesStock {
  const suivies = d.annonces.filter((l) => l.stock !== null)
  const rupture = suivies.filter((l) => l.stockEtat === 'rupture').length
  const bas = suivies.filter((l) => l.stockEtat === 'bas').length + rupture
  const rang = { rupture: 0, bas: 1, ok: 2, aucun: 3 }
  const annonces = [...d.annonces].sort((a, b) => (rang[a.stockEtat] - rang[b.stockEtat]) || ((a.stock ?? Infinity) - (b.stock ?? Infinity)))
  return { ...d, annonces, suivies: suivies.length, bas, rupture }
}

function Vignette({ l }: { l: LigneStock }) {
  return l.image
    ? <img src={mediaUrl(l.image)} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover" />
    : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gray-100 text-xl">📦</span>
}

function Ligne({ l, occupe, onEcrire }: { l: LigneStock; occupe: boolean; onEcrire: (c: { stock?: number | null; stockMin?: number }) => void }) {
  const [min, setMin] = useState(String(l.stockMin))
  useEffect(() => { setMin(String(l.stockMin)) }, [l.stockMin])
  const stock = l.stock ?? 0
  const teinte = l.stockEtat === 'rupture' ? 'text-red-700' : l.stockEtat === 'bas' ? 'text-ivoire-orange' : 'text-ink'
  return (
    <li className={`px-4 py-3 ${l.stockEtat === 'rupture' ? 'bg-red-50/60' : ''}`}>
      <div className="flex items-center gap-3">
        <Vignette l={l} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{l.title}</p>
          <p className="text-xs text-gray-500">
            {l.price > 0 ? formatFCFA(l.price) : 'Gratuit'}
            {l.stockEtat === 'rupture' && <span className="ml-2 font-bold text-red-600">Rupture de stock</span>}
            {l.stockEtat === 'bas' && <span className="ml-2 font-bold text-ivoire-orange">Sous le minimum</span>}
            {l.hidden && <span className="ml-2 text-gray-500">· masquée</span>}
          </p>
        </div>
        {/* − quantité + : le geste du comptoir. */}
        <div className="flex shrink-0 items-center gap-1">
          {/* 44 px sur les deux axes : c'est « le geste du comptoir », un pouce
              qui tape vite en plein marché (relevé par 🎨 L'Atelier). */}
          <button aria-label="Retirer un" onClick={() => onEcrire({ stock: Math.max(0, stock - 1) })} disabled={occupe || stock <= 0}
            className="grid h-11 w-11 place-items-center rounded-full border border-line2 bg-white text-gray-700 transition active:scale-95 disabled:opacity-40">
            <Minus size={16} />
          </button>
          <span className={`tnum w-10 text-center font-display text-lg font-extrabold ${teinte}`}>
            {occupe ? <Loader2 size={16} className="mx-auto animate-spin" /> : formatPrice(stock)}
          </span>
          <button aria-label="Ajouter un" onClick={() => onEcrire({ stock: stock + 1 })} disabled={occupe}
            className="grid h-11 w-11 place-items-center rounded-full border border-line2 bg-white text-gray-700 transition active:scale-95 disabled:opacity-40">
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 pl-[60px] text-xs text-gray-500">
        <label className="flex items-center gap-1.5">
          Minimum
          <input
            type="number" inputMode="numeric" min={0} max={100000} value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={() => { const v = Math.max(0, parseInt(min, 10) || 0); if (v !== l.stockMin) onEcrire({ stockMin: v }) }}
            className="tnum w-16 rounded-lg border border-line2 bg-white px-2 py-1 text-center text-sm text-ink outline-none focus:border-primary-500"
          />
        </label>
        <button onClick={() => onEcrire({ stock: null })} disabled={occupe} className="min-h-[44px] text-gray-500 underline-offset-2 hover:underline">
          Ne plus suivre
        </button>
      </div>
    </li>
  )
}
