import { type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { formatPrice } from '../lib/format'

/**
 * La boîte à outils commune des onglets du tableau de bord — le vocabulaire
 * emprunté aux CRM professionnels, appliqué à l'administration de Chap.ci.
 *
 * Trois gestes, toujours les mêmes, dans le même ordre :
 *   1. UN CHIFFRE en tête — combien, et combien attendent une décision ;
 *   2. DES PUCES qui filtrent, chacune portant son compteur ;
 *   3. UNE RECHERCHE et un tri.
 *
 * Ce n'est pas de la décoration. Une liste de deux cents lignes sans compteur
 * ne dit pas où regarder : on la parcourt du haut, on se lasse au tiers, et ce
 * qui attendait au fond attend encore le mois suivant.
 */

/** Une valeur mise en avant : le chiffre, ce qu'il compte, et une nuance. */
export function KpiCrm({ valeur, libelle, sous, ton = 'neutre' }: {
  valeur: ReactNode
  libelle: string
  sous?: string
  ton?: 'neutre' | 'alerte' | 'bon'
}) {
  const fond = ton === 'alerte' ? 'border-red-200 bg-red-50'
    : ton === 'bon' ? 'border-ivoire-green/25 bg-ivoire-green/8'
      : 'border-line bg-white'
  const encre = ton === 'alerte' ? 'text-red-700' : ton === 'bon' ? 'text-ivoire-green-dark' : 'text-ink'
  return (
    <div className={`rounded-2xl border px-3 py-3 shadow-card ${fond}`}>
      <p className={`tnum font-display text-lg font-extrabold leading-none md:text-xl ${encre}`}>{valeur}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{libelle}</p>
      {sous && <p className="mt-0.5 text-[10.5px] leading-snug text-gray-500">{sous}</p>}
    </div>
  )
}

/** La rangée de valeurs en tête d'onglet. */
export function KpisCrm({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">{children}</div>
}

export interface PuceCrm {
  id: string
  label: string
  n?: number
  /** Rouge : ce qui attend une décision. */
  alerte?: boolean
}

/** Les puces de filtre, chacune avec son compteur. */
export function PucesCrm({ valeur, onChange, puces }: {
  valeur: string
  onChange: (id: string) => void
  puces: PuceCrm[]
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
      {puces.map((p) => {
        const actif = valeur === p.id
        return (
          <button key={p.id} onClick={() => onChange(p.id)}
            className={`chip-etat ${
              actif ? (p.alerte ? 'bg-red-600 text-white' : 'bg-ink text-white')
                : p.alerte ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                  : 'bg-white text-gray-600 ring-1 ring-line'}`}>
            {p.label}{p.n === undefined ? '' : ` · ${formatPrice(p.n)}`}
          </button>
        )
      })}
    </div>
  )
}

/** La barre de recherche, avec un tri facultatif à droite. */
export function BarreCrm({ q, onQ, placeholder, tri, onTri, tris }: {
  q: string
  onQ: (v: string) => void
  placeholder: string
  tri?: string
  onTri?: (v: string) => void
  tris?: [string, string][]
}) {
  return (
    <div className="flex gap-2">
      <span className="flex flex-1 items-center gap-2 rounded-full border border-line bg-white px-4 py-2">
        <Search size={15} className="shrink-0 text-gray-400" />
        <input value={q} onChange={(e) => onQ(e.target.value)} placeholder={placeholder}
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-gray-400" />
        {/* Zone tapable 44×44 par marge négative — voir Vitrine.tsx. */}
        {q !== '' && (
          <button onClick={() => onQ('')} aria-label="Effacer"
            className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center text-gray-400">✕</button>
        )}
      </span>
      {tris && onTri && (
        <select value={tri} onChange={(e) => onTri(e.target.value)}
          className="rounded-full border border-line bg-white px-3 text-[12.5px] font-bold text-gray-600 outline-none">
          {tris.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
        </select>
      )}
    </div>
  )
}

/**
 * La phrase du haut : ce qui attend une décision, ou que tout est traité.
 * Un onglet qui ne dit pas ce qu'il attend de vous se lit comme un rapport.
 */
export function AttenteCrm({ n, phrase, action }: { n: number; phrase: string; action?: ReactNode }) {
  if (n === 0) {
    return (
      <p className="px-1 text-[12.5px] text-gray-500">
        Rien n’attend de décision ici — tout est traité.
      </p>
    )
  }
  // La phrase entière vient de l'appelant : accorder « acheteur sans réponse
  // depuis plus de 48 h » en collant un « s » à la fin donnait « 48 hs ».
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5">
      <p className="text-[13px] font-bold text-red-800">{phrase}</p>
      {action}
    </div>
  )
}

/** Le mot cherché, insensible aux accents et à la casse. */
export function contient(champ: string | null | undefined, q: string): boolean {
  if (!q) return true
  // On retire les accents des DEUX côtés : « Kone » doit trouver « Koné ».
  const propre = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return propre(String(champ ?? '')).includes(propre(q))
}
