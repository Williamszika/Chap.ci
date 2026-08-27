import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Handshake, MessageCircle, Star, XCircle } from 'lucide-react'
import { mediaUrl, thumbUrl } from '../lib/native'
import { formatFCFA, formatPrice, timeAgo } from '../lib/format'
import { updateOrderStatus } from '../lib/orders'
import { useToast } from '../store/ToastContext'
import type { Order, OrderStatus, Review } from '../types'

/**
 * « Mes commandes » — du premier contact à la vente (maquette validée le 27/08).
 *
 * Une commande se termine d'un bouton, et le total du mois se lit sans
 * calculer. Le vendeur qui doit additionner ses ventes à la main ne le fait
 * pas : il ne sait donc pas si son mois a été bon, et il ne sait pas non plus
 * quelles annonces republier.
 */

type Vue = 'ventes' | 'achats'

const ETATS: [OrderStatus, string][] = [
  ['en_cours', 'En cours'],
  ['finalise', 'Finalisées'],
  ['annule', 'Annulées'],
]

/** « Aminata Koné » → « Aminata K. » : le prénom suffit, le nom encombre. */
function nomCourt(nom?: string): string {
  const p = (nom ?? '').trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return 'Utilisateur'
  if (p.length === 1) return p[0]
  return `${p[0]} ${p[p.length - 1].charAt(0)}.`
}

/** Le total d'une commande : tous ses articles additionnés. */
function total(o: Order): number {
  return o.items.reduce((s, it) => s + it.price, 0)
}

export function MesCommandes({ ventes, achats, avis, onRecharger }: {
  ventes: Order[]
  achats: Order[]
  /** Avis reçus en tant que vendeur — sert le « avis reçu ★ 5 » d'une vente. */
  avis: Review[]
  onRecharger: () => Promise<void> | void
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const [vue, setVue] = useState<Vue>(ventes.length === 0 && achats.length > 0 ? 'achats' : 'ventes')
  const [etat, setEtat] = useState<OrderStatus>('en_cours')
  const [busy, setBusy] = useState<string | null>(null)

  const jeVends = vue === 'ventes'
  const source = jeVends ? ventes : achats
  const compte = useMemo(() => ({
    en_cours: source.filter((o) => o.status === 'en_cours').length,
    finalise: source.filter((o) => o.status === 'finalise').length,
    annule: source.filter((o) => o.status === 'annule').length,
  }), [source])

  const liste = useMemo(
    () => source.filter((o) => o.status === etat).sort((a, b) => b.createdAt - a.createdAt),
    [source, etat],
  )

  // Ce mois-ci : les ventes CONCLUES ce mois (leur date de conclusion, pas
  // celle de la demande), ce qu'elles ont rapporté, et ce qui attend encore.
  const mois = useMemo(() => {
    const debut = new Date()
    debut.setDate(1); debut.setHours(0, 0, 0, 0)
    const faites = source.filter((o) => o.status === 'finalise' && (o.finalizedAt ?? o.createdAt) >= debut.getTime())
    return {
      n: faites.length,
      montant: faites.reduce((s, o) => s + total(o), 0),
      attente: source.filter((o) => o.status === 'en_cours').length,
    }
  }, [source])

  /** Note reçue pour cette vente, si l'acheteur en a laissé une. */
  const noteDe = (o: Order): number | null => {
    const lid = o.items[0]?.listingId
    const r = avis.find((a) => a.reviewerId === o.buyerId && (!lid || a.listingId === lid) && a.kind !== 'buyer')
    return r ? r.rating : null
  }

  const changer = async (o: Order, status: OrderStatus, echec: string) => {
    setBusy(o.id)
    try { await updateOrderStatus(o.id, status); await onRecharger() }
    catch { toast.error(echec) }
    finally { setBusy(null) }
  }

  return (
    <div className="space-y-3">
      {/* Deux natures de commandes : celles qu'on reçoit, celles qu'on passe.
          Le choix n'apparaît que si l'on a les deux. */}
      {ventes.length > 0 && achats.length > 0 && (
        <div className="flex rounded-2xl border border-line bg-white p-1 shadow-card">
          {([['ventes', 'Ventes', ventes.length], ['achats', 'Mes achats', achats.length]] as [Vue, string, number][]).map(([id, label, n]) => (
            <button key={id} onClick={() => { setVue(id); setEtat('en_cours') }}
              className={`flex-1 rounded-xl px-3 py-2 text-[13px] font-extrabold transition ${
                vue === id ? 'bg-ink text-white' : 'text-gray-500'}`}>
              {label} · {n}
            </button>
          ))}
        </div>
      )}

      {/* Filtrer par état. */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {ETATS.map(([id, label]) => (
          (id !== 'annule' || compte.annule > 0) && (
            <button key={id} onClick={() => setEtat(id)}
              className={`chip-etat ${etat === id ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
              {label}{id === 'annule' ? '' : ` · ${compte[id]}`}
            </button>
          )
        ))}
      </div>

      {liste.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
          <p className="text-sm text-gray-600">
            {etat === 'en_cours'
              ? jeVends ? 'Aucune commande en attente — tout est réglé.'
                : 'Aucun achat en cours.'
              : etat === 'finalise'
                ? jeVends ? 'Aucune vente conclue pour l’instant.' : 'Aucun achat terminé.'
                : 'Aucune commande annulée.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {liste.map((o) => {
            const note = jeVends && o.status === 'finalise' ? noteDe(o) : null
            const img = o.items[0]?.image
            const autres = o.items.length - 1
            return (
              <div key={o.id} className={`rounded-2xl border border-line bg-white p-3.5 shadow-card ${busy === o.id ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3">
                  {img ? (
                    <img src={mediaUrl(thumbUrl(img))} alt=""
                      className="h-12 w-14 shrink-0 rounded-xl border border-line object-cover" />
                  ) : (
                    <div className="grid h-12 w-14 shrink-0 place-items-center rounded-xl bg-cream-100 text-lg">🛍️</div>
                  )}
                  {/* Le prix se lit sur la ligne du titre, l'état sur celle de
                      l'acheteur : la phrase « Aminata K. · demandée il y a 2 j »
                      garde toute la largeur de la carte. */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-[13.5px] font-bold text-ink">
                        {o.items[0]?.title ?? 'Commande'}
                        {autres > 0 && <span className="font-semibold text-gray-500"> + {autres} autre{autres > 1 ? 's' : ''}</span>}
                      </p>
                      <p className="tnum shrink-0 text-[13px] font-extrabold text-primary-700">{formatFCFA(total(o))}</p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[11.5px] text-gray-500">
                        {nomCourt(o.otherName)} ·{' '}
                        {o.status === 'finalise'
                          ? `finalisée ${timeAgo(o.finalizedAt ?? o.createdAt)}`
                          : o.status === 'annule'
                            ? `annulée ${timeAgo(o.createdAt)}`
                            : `demandée ${timeAgo(o.createdAt)}`}
                      </p>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {/* L'avis reçu tient en une pastille : écrit dans la
                            phrase, il se faisait couper sur un téléphone. */}
                        {note !== null && (
                          <span title={`Avis reçu : ${note} sur 5`}
                            className="rounded-md bg-cream-100 px-1.5 py-1 text-[10px] font-extrabold text-accent-ocre-dark">
                            ★ {note}
                          </span>
                        )}
                        <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold ${
                          o.status === 'finalise' ? 'bg-emerald-50 text-emerald-700'
                            : o.status === 'annule' ? 'bg-gray-100 text-gray-500'
                              : 'bg-cream-100 text-primary-700'}`}>
                          {o.status === 'finalise' ? 'Finalisée' : o.status === 'annule' ? 'Annulée' : 'En cours'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Une commande se termine d'un bouton. */}
                {o.status === 'en_cours' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button disabled={busy === o.id}
                      onClick={() => changer(o, 'finalise', 'Impossible de finaliser cette commande.')}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary-500 px-3 py-2 text-[12px] font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50">
                      {jeVends ? <><Handshake size={14} /> Marquer finalisée</> : <><CheckCircle2 size={14} /> Article reçu</>}
                    </button>
                    {o.conversationId && (
                      <button onClick={() => navigate(`/messages/${o.conversationId}`)}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-line px-3 py-2 text-[12px] font-bold text-gray-700 transition active:scale-[0.98]">
                        <MessageCircle size={14} /> Écrire
                      </button>
                    )}
                    {jeVends && (
                      <button disabled={busy === o.id}
                        onClick={() => {
                          if (!window.confirm('Annuler cette commande ? L’acheteur en sera informé dans la conversation.')) return
                          changer(o, 'annule', 'Impossible d’annuler cette commande.')
                        }}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-line px-3 py-2 text-[12px] font-bold text-gray-500 transition active:scale-[0.98] disabled:opacity-50">
                        <XCircle size={14} /> Annuler
                      </button>
                    )}
                  </div>
                )}

                {/* Vente conclue sans avis : c'est là qu'on va le chercher. */}
                {o.status === 'finalise' && jeVends && note === null && o.conversationId && (
                  <button onClick={() => navigate(`/messages/${o.conversationId}`)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-[12.5px] font-bold text-gray-700 transition active:scale-[0.98]">
                    <Star size={15} /> Demander un avis à {nomCourt(o.otherName)}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Le total du mois, sans calculer. */}
      <div className="rounded-2xl border border-accent-ocre/30 bg-cream-100 p-3.5">
        <p className="font-display text-[13.5px] font-extrabold text-ink">Ce mois-ci</p>
        <div className="mt-2 flex gap-6">
          <span>
            <b className="tnum block text-[19px] font-black text-ink">{mois.n}</b>
            <small className="text-[11.5px] text-gray-600">{jeVends ? 'vente' : 'achat'}{mois.n > 1 ? 's' : ''}</small>
          </span>
          <span>
            <b className="tnum block text-[19px] font-black text-ink">{formatPrice(mois.montant)}</b>
            <small className="text-[11.5px] text-gray-600">FCFA {jeVends ? 'encaissés' : 'dépensés'}</small>
          </span>
          <span>
            <b className="tnum block text-[19px] font-black text-ink">{mois.attente}</b>
            <small className="text-[11.5px] text-gray-600">en attente</small>
          </span>
        </div>
      </div>
    </div>
  )
}
