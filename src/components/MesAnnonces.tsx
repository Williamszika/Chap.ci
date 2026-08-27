import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Check, Eye, EyeOff, Megaphone, MoreHorizontal, Pencil,
  PlusCircle, RotateCw, Search, Trash2, X,
} from 'lucide-react'
import { mediaUrl, thumbUrl } from '../lib/native'
import { phpQuiFavori, type QuiFavori } from '../lib/php'
import { priceLabel } from '../lib/format'
import { timeAgo } from '../lib/format'
import { activePromo } from '../lib/promo'
import { setListingHidden, setListingSold } from '../lib/api'
import { useApp } from '../store/AppContext'
import { useToast } from '../store/ToastContext'
import type { Listing } from '../types'

/**
 * « Mes annonces » — la table de travail du vendeur (maquette validée par le
 * Patron le 27/08).
 *
 * Ce que l'écran doit permettre de faire en un regard : voir combien
 * d'annonces sont en ligne, lesquelles dorment, laquelle est masquée et
 * POURQUOI. Chaque ligne porte ses trois chiffres — vues, favoris, contacts —
 * parce que « 214 vues » tout seul ne dit pas quoi corriger, alors que
 * « 214 vues, 12 favoris, 0 contact » désigne le prix ou la description.
 */

type Etat = 'toutes' | 'ligne' | 'vendues' | 'masquees' | 'une'
type Tri = 'vues' | 'recentes' | 'prix'

const TRIS: [Tri, string][] = [
  ['vues', 'Plus vues'],
  ['recentes', 'Plus récentes'],
  ['prix', 'Prix le plus haut'],
]

export function MesAnnonces({ annonces, onRecharger, filtreInitial, onFiltreConsomme }: {
  annonces: Listing[]
  onRecharger: () => Promise<void> | void
  /** « promo » quand on arrive depuis la carte des promotions de l'accueil. */
  filtreInitial?: 'all' | 'promo'
  onFiltreConsomme?: () => void
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const { deleteListing } = useApp()
  const [etat, setEtat] = useState<Etat>('toutes')
  const [tri, setTri] = useState<Tri>('vues')
  const [cherche, setCherche] = useState('')
  const [menu, setMenu] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  // Qui a mis CETTE annonce en favori — la feuille s'ouvre sur le ❤ d'une ligne.
  const [qui, setQui] = useState<{ titre: string; gens: QuiFavori[] } | null>(null)
  const [quiCharge, setQuiCharge] = useState(false)
  const promo = filtreInitial === 'promo'

  const compte = useMemo(() => ({
    toutes: annonces.length,
    ligne: annonces.filter((l) => !l.hidden && !l.sold).length,
    vendues: annonces.filter((l) => l.sold).length,
    masquees: annonces.filter((l) => l.hidden).length,
    une: annonces.filter((l) => activePromo(l)).length,
  }), [annonces])

  const liste = useMemo(() => {
    let out = annonces
    if (promo) out = out.filter((l) => activePromo(l))
    else if (etat === 'ligne') out = out.filter((l) => !l.hidden && !l.sold)
    else if (etat === 'vendues') out = out.filter((l) => l.sold)
    else if (etat === 'masquees') out = out.filter((l) => l.hidden)
    else if (etat === 'une') out = out.filter((l) => activePromo(l))
    const q = cherche.trim().toLowerCase()
    if (q) out = out.filter((l) => l.title.toLowerCase().includes(q))
    const tri_ = [...out]
    if (tri === 'vues') tri_.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    else if (tri === 'recentes') tri_.sort((a, b) => b.createdAt - a.createdAt)
    else tri_.sort((a, b) => b.price - a.price)
    return tri_
  }, [annonces, etat, tri, cherche, promo])

  /** Ouvre la liste de ceux qui suivent l'annonce. */
  const ouvrirQui = async (id: string) => {
    setQuiCharge(true)
    setQui({ titre: '', gens: [] })
    try { setQui(await phpQuiFavori(id)) }
    catch (e) { setQui(null); toast.error((e as Error).message) }
    finally { setQuiCharge(false) }
  }

  // Une action met la ligne en attente, agit, puis recharge la liste.
  const agir = async (id: string, faire: () => Promise<unknown>, echec: string) => {
    setMenu(null)
    setBusy(id)
    try { await faire(); await onRecharger() }
    catch { toast.error(echec) }
    finally { setBusy(null) }
  }

  return (
    <div className="space-y-3">
      <button onClick={() => navigate('/publier')} className="btn-primary w-full py-3">
        <PlusCircle size={20} /> Publier une annonce
      </button>

      {/* Chercher et trier. */}
      <div className="flex gap-2">
        <span className="flex flex-1 items-center gap-2 rounded-full border border-line bg-white px-4 py-2">
          <Search size={15} className="shrink-0 text-gray-400" />
          <input value={cherche} onChange={(e) => setCherche(e.target.value)}
            placeholder="Chercher dans mes annonces…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-gray-400" />
        </span>
        <select value={tri} onChange={(e) => setTri(e.target.value as Tri)}
          className="rounded-full border border-line bg-white px-3 text-[12.5px] font-bold text-gray-600 outline-none">
          {TRIS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
        </select>
      </div>

      {/* Filtrer par état — chaque puce porte son compteur. */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {promo ? (
          <button onClick={() => onFiltreConsomme?.()}
            className="chip-etat bg-primary-500 text-white">
            En promotion · {compte.une} ✕
          </button>
        ) : (
          ([
            ['toutes', 'Toutes', compte.toutes],
            ['ligne', 'En ligne', compte.ligne],
            ['vendues', 'Vendues', compte.vendues],
            ['masquees', 'Masquées', compte.masquees],
            ['une', 'À la une', compte.une],
          ] as [Etat, string, number][]).map(([id, label, n]) => (
            <button key={id} onClick={() => setEtat(id)}
              className={`chip-etat ${
                etat === id ? 'bg-ink text-white'
                  : id === 'masquees' && n > 0 ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                    : 'bg-white text-gray-600 ring-1 ring-line'}`}>
              {label} · {n}
            </button>
          ))
        )}
      </div>

      {liste.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
          <p className="text-sm text-gray-600">
            {cherche ? 'Aucune annonce ne correspond à votre recherche.'
              : etat === 'masquees' ? 'Aucune annonce masquée — tout est en ligne.'
                : 'Vous n’avez pas encore d’annonce ici.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          {liste.map((l) => {
            const enUne = activePromo(l)
            return (
              <div key={l.id} className={`relative p-3 ${busy === l.id ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <Link to={l.hidden ? `/modifier/${l.id}` : `/annonce/${l.id}`}
                    state={l.hidden ? { listing: l } : undefined}
                    className="relative shrink-0">
                    <img src={mediaUrl(thumbUrl(l.images[0]))} alt=""
                      className={`h-12 w-16 rounded-xl border border-line object-cover ${l.hidden || l.sold ? 'opacity-40' : ''}`} />
                    {l.hidden && (
                      <span className="absolute inset-0 grid place-items-center">
                        <EyeOff size={16} className="text-gray-600" />
                      </span>
                    )}
                  </Link>

                  <Link to={l.hidden ? `/modifier/${l.id}` : `/annonce/${l.id}`}
                    state={l.hidden ? { listing: l } : undefined}
                    className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-ink">{l.title}</p>
                    <p className="text-xs font-extrabold text-primary-700">{priceLabel(l.price, l.negotiable)}</p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">
                      {timeAgo(l.createdAt)}{l.commune ? ` · ${l.commune}` : ''}
                    </p>
                  </Link>

                  {/* Le ❤ est cliquable : il ouvre la liste des personnes qui
                      suivent l'annonce. Un chiffre seul ne dit pas à qui
                      republier, ni pour quelle commune baisser le prix. */}
                  <div className="tnum shrink-0 text-right text-[11px] text-gray-500">
                    <p><b className="text-[13px] text-ink">{l.views ?? 0}</b> vues</p>
                    <p>
                      <button onClick={() => ouvrirQui(l.id)}
                        disabled={(l.favoris ?? 0) === 0}
                        className="font-semibold underline decoration-dotted underline-offset-2 disabled:no-underline disabled:opacity-100">
                        {l.favoris ?? 0} ❤
                      </button>
                      {' · '}{l.contacts ?? 0} 💬
                    </p>
                  </div>

                  <span className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-extrabold ${
                    l.sold ? 'bg-gray-100 text-gray-500'
                      : l.hidden ? 'bg-red-50 text-red-600'
                        : enUne ? 'bg-cream-100 text-primary-700'
                          : 'bg-emerald-50 text-emerald-700'}`}>
                    {l.sold ? 'Vendue' : l.hidden ? 'À corriger' : enUne ? 'À la une' : 'En ligne'}
                  </span>

                  <button onClick={() => setMenu(menu === l.id ? null : l.id)}
                    aria-label="Actions" className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-cream-100">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                {/* Masquée : on dit POURQUOI, et le bouton répare. Une annonce
                    masquée sans explication est une annonce abandonnée. */}
                {l.hidden && l.hiddenReason && (
                  <div className="mt-2 flex gap-2 rounded-xl border border-accent-ocre/30 bg-accent-ocre/8 p-2.5 text-[12px] leading-relaxed text-accent-ocre-dark">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <p className="flex-1">{l.hiddenReason}</p>
                    <button onClick={() => navigate(`/modifier/${l.id}`, { state: { listing: l } })}
                      className="h-fit shrink-0 rounded-lg bg-primary-500 px-3 py-1.5 text-[11.5px] font-extrabold text-white">
                      Corriger
                    </button>
                  </div>
                )}

                {/* Le menu ⋯ : tout ce qu'on peut faire d'une annonce. */}
                {menu === l.id && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl bg-cream-100 p-2 sm:grid-cols-3">
                    <ActionMenu icone={<Pencil size={14} />} label="Modifier"
                      onClick={() => navigate(`/modifier/${l.id}`, { state: { listing: l } })} />
                    {!l.sold && (
                      <ActionMenu icone={<Megaphone size={14} />} label={enUne ? 'Prolonger' : 'Mettre à la une'}
                        onClick={() => navigate('/publicite')} />
                    )}
                    <ActionMenu icone={<Check size={14} />}
                      label={l.sold ? 'Remettre en vente' : 'Marquer vendue'}
                      onClick={() => agir(l.id, () => setListingSold(l.id, !l.sold),
                        'Impossible de changer l’état de cette annonce.')} />
                    <ActionMenu icone={l.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      label={l.hidden ? 'Afficher' : 'Masquer'}
                      onClick={() => agir(l.id, () => setListingHidden(l.id, !l.hidden),
                        'Action impossible.')} />
                    <ActionMenu icone={<RotateCw size={14} />} label="Republier"
                      onClick={() => navigate(`/modifier/${l.id}`, { state: { listing: l } })} />
                    <ActionMenu icone={<Trash2 size={14} />} label="Supprimer" danger
                      onClick={() => {
                        if (!confirm('Supprimer définitivement cette annonce ?')) return
                        agir(l.id, () => deleteListing(l.id),
                          'Suppression impossible : vous devez être le propriétaire connecté.')
                      }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="px-1 text-center text-[11.5px] leading-relaxed text-gray-400">
        Les chiffres de chaque annonce se mettent à jour en continu · appuyez sur le ❤ pour
        voir qui suit l’annonce · une annonce masquée vous dit pourquoi, et le bouton la répare
      </p>

      {/* QUI SUIT CETTE ANNONCE */}
      {qui && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setQui(null)}>
          <div className="max-h-[75vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 pb-8"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-[15px] font-extrabold text-ink">Qui suit cette annonce</p>
                {qui.titre && <p className="mt-0.5 truncate text-[12px] text-gray-500">{qui.titre}</p>}
              </div>
              <button onClick={() => setQui(null)} aria-label="Fermer"
                className="shrink-0 rounded-lg p-1.5 text-gray-400"><X size={18} /></button>
            </div>

            {quiCharge ? (
              <p className="py-10 text-center text-sm text-gray-400">Chargement…</p>
            ) : qui.gens.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">Personne pour l’instant.</p>
            ) : (
              <div className="mt-3 divide-y divide-line">
                {qui.gens.map((g, i) => (
                  <div key={g.id || i} className="flex items-center gap-3 py-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-cream-100 font-display text-[15px] font-extrabold text-primary-700">
                      {g.avatar
                        ? <img src={mediaUrl(g.avatar)} alt="" className="h-full w-full object-cover" />
                        : (g.nom.trim().charAt(0) || '?').toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-ink">{g.nom}</span>
                      <span className="mt-0.5 block text-[11.5px] text-gray-500">
                        {g.commune ? `${g.commune} · ` : ''}{timeAgo(g.quand)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-3 rounded-xl bg-cream-100 px-3 py-2 text-[11.5px] leading-relaxed text-gray-600">
              Vous ne pouvez pas leur écrire : sur Chap.ci, c’est l’acheteur qui ouvre la
              conversation. Ce que cette liste sert : savoir pour quelle commune ajuster le
              prix, et quelle annonce republier.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionMenu({ icone, label, onClick, danger }: {
  icone: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-[12px] font-semibold transition hover:bg-cream-50 ${
        danger ? 'text-red-600' : 'text-gray-700'}`}>
      {icone} {label}
    </button>
  )
}
