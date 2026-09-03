import { useState } from 'react'
import { formatFCFA } from '../lib/format'
import type { Message } from '../types'

/**
 * « FAIRE UNE OFFRE » — les écrans de la nouveauté n° 4 (03/09/2026).
 *
 *  · `OffreSheet` : la feuille où l'on tape un montant. Ouverte depuis la fiche
 *    (« Faire une offre ») ou depuis la conversation (« Proposer un prix »,
 *    qui sert aussi de contre-proposition).
 *  · `OffreCarte` : ce qu'un message-offre montre dans le fil — le montant,
 *    l'état, et pour le destinataire d'une offre encore ouverte : Accepter,
 *    Refuser, Contre-proposer.
 *
 * Accepter n'est pas payer, et ne change pas le prix affiché de l'annonce :
 * c'est une parole donnée dans la conversation. C'est écrit sous le bouton,
 * parce qu'un acheteur qui croit avoir « acheté » en acceptant se sentirait
 * floué à la remise en main propre.
 */

/** −10 % arrondi aux 500 FCFA : le point de départ habituel d'une négociation. */
export function montantSuggere(prix: number): number {
  return Math.max(500, Math.round((prix * 0.9) / 500) * 500)
}

export function OffreSheet({
  prix, titre, onClose, onEnvoyer,
}: { prix: number; titre: string; onClose: () => void; onEnvoyer: (montant: number) => Promise<void> }) {
  const [montant, setMontant] = useState(String(montantSuggere(prix)))
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const n = Number(montant) || 0
  const envoyer = async () => {
    if (n <= 0) { setErreur('Indiquez un montant en FCFA.'); return }
    setEnCours(true); setErreur(null)
    try { await onEnvoyer(n) }
    catch (e) { setErreur(e instanceof Error && e.message ? e.message : 'L’offre n’est pas partie. Réessayez.'); setEnCours(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-app rounded-t-3xl bg-white p-5 pb-8 safe-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
        <p className="text-center font-display text-lg font-extrabold text-gray-900">{titre}</p>
        {prix > 0 && (
          <p className="mt-1 text-center text-sm text-gray-600">
            Prix affiché : <span className="tnum font-semibold">{formatFCFA(prix)}</span>
          </p>
        )}
        <label htmlFor="offre-montant" className="mt-4 block text-sm font-semibold text-gray-800">Votre offre</label>
        <div className="relative mt-1">
          <input
            id="offre-montant"
            inputMode="numeric"
            autoFocus
            value={montant}
            onChange={(e) => setMontant(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => { if (e.key === 'Enter') void envoyer() }}
            className="input pr-16 text-2xl font-extrabold tabular-nums"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">FCFA</span>
        </div>
        {prix > 0 && n > 0 && (
          <p className="mt-1.5 text-xs text-gray-500">
            {n < prix ? `soit ${Math.round((1 - n / prix) * 100)} % de moins que le prix affiché`
              : n === prix ? 'au prix affiché' : 'au-dessus du prix affiché'}
          </p>
        )}
        {erreur && <p className="mt-2 text-sm font-semibold text-red-600">{erreur}</p>}
        <button onClick={() => void envoyer()} disabled={enCours || n <= 0} className="btn-primary mt-4 w-full py-3 disabled:opacity-60">
          {enCours ? 'Envoi…' : 'Envoyer l’offre'}
        </button>
        <p className="mt-2 text-center text-xs text-gray-500">
          Accepter une offre n’est pas un paiement : c’est une parole donnée. Le paiement se fait en main propre, ou à la livraison.
        </p>
      </div>
    </div>
  )
}

const ETATS: Record<NonNullable<Message['offre']>['statut'], { texte: string; classe: string }> = {
  proposee: { texte: 'En attente', classe: 'bg-amber-100 text-amber-800' },
  acceptee: { texte: 'Acceptée ✅', classe: 'bg-green-100 text-green-800' },
  refusee: { texte: 'Refusée', classe: 'bg-gray-200 text-gray-700' },
  remplacee: { texte: 'Remplacée', classe: 'bg-gray-200 text-gray-600' },
}

export function OffreCarte({
  message, moi, mine, enCours, onRepondre, onContre,
}: {
  message: Message
  moi: string
  /** La bulle est de mon côté (couleurs inversées). */
  mine: boolean
  enCours: boolean
  onRepondre: (action: 'accepter' | 'refuser') => void
  onContre: () => void
}) {
  const o = message.offre
  if (!o) return null
  const etat = ETATS[o.statut] ?? ETATS.proposee
  const jeReponds = o.statut === 'proposee' && o.par !== moi
  return (
    <div>
      <p className={`text-xs font-semibold ${mine ? 'text-white/80' : 'text-gray-500'}`}>
        {o.par === moi ? 'Votre offre' : 'Offre reçue'}
      </p>
      <p className={`tnum font-display text-2xl font-black ${mine ? 'text-white' : 'text-gray-900'}`}>
        {formatFCFA(o.montant)}
      </p>
      <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${etat.classe}`}>{etat.texte}</span>
      {jeReponds && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button onClick={() => onRepondre('accepter')} disabled={enCours} className="btn-primary px-3 py-2 text-sm disabled:opacity-60">
            Accepter
          </button>
          <button onClick={() => onRepondre('refuser')} disabled={enCours} className="btn-outline px-3 py-2 text-sm disabled:opacity-60">
            Refuser
          </button>
          <button onClick={onContre} disabled={enCours} className="btn-outline px-3 py-2 text-sm disabled:opacity-60">
            Contre-proposer
          </button>
        </div>
      )}
    </div>
  )
}
