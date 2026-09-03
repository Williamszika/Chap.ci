import { useEffect, useState } from 'react'
import { fetchPrixMarche, type PrixMarche } from '../lib/api'
import { formatFCFA } from '../lib/format'
import { verdictPrix, fourchetteTexte } from '../lib/prixMarche'

/**
 * « ÇA VAUT COMBIEN ? » — les deux écrans de la nouveauté n° 3 (03/09/2026).
 *
 *  · `PrixMarcheVendeur` : sous le champ prix, pendant la saisie. Il dit la
 *    fourchette de la sous-catégorie sur Chap.ci et situe le prix tapé. Il
 *    n'empêche rien : un vendeur a le droit d'être cher, ou de brader.
 *  · `PrixMarcheAcheteur` : sur la fiche, sous le prix. Un mot, pas un
 *    tableau. « Bien en dessous — méfiance » est le seul qui compte vraiment.
 *
 * La lecture vient de `lib/prixMarche.ts`, la même pour les deux, exprès.
 */

interface Cle { categoryId: string; subcategory?: string; condition?: string; marque?: string; sauf?: string }

/** Charge la fourchette quand la clé change ; `undefined` tant qu'on ne sait pas. */
function useFourchette(cle: Cle, actif: boolean): PrixMarche | null | undefined {
  const [f, setF] = useState<PrixMarche | null | undefined>(undefined)
  const { categoryId, subcategory, condition, marque, sauf } = cle
  useEffect(() => {
    if (!actif || !categoryId || !subcategory) { setF(undefined); return }
    let vivant = true
    // Un demi-seconde de calme : la sous-catégorie et la marque changent par
    // à-coups pendant la saisie, inutile d'interroger le serveur à chaque frappe.
    const t = setTimeout(async () => {
      const r = await fetchPrixMarche({ categoryId, subcategory, condition, marque, sauf })
      if (vivant) setF(r)
    }, 500)
    return () => { vivant = false; clearTimeout(t) }
  }, [actif, categoryId, subcategory, condition, marque, sauf])
  return f
}

/** Sous le champ prix du formulaire de publication. */
export function PrixMarcheVendeur({ prix, ...cle }: Cle & { prix: number }) {
  const f = useFourchette(cle, true)
  if (!f || f.p25 == null || f.p75 == null) return null
  const v = verdictPrix(prix, f)
  const base = f.base === 'marque' ? 'cette marque' : 'ce type d’objet'
  return (
    <p className="mt-2 text-sm text-gray-700" aria-live="polite">
      Sur Chap.ci, {base} se vend <span className="tnum font-semibold">{fourchetteTexte(f, formatFCFA)}</span>
      <span className="text-gray-500"> ({f.n} annonces récentes)</span>
      {v === 'moyen' && <span className="ml-1 font-semibold text-green-700">— votre prix est dans la moyenne.</span>}
      {v === 'haut' && <span className="ml-1 font-semibold text-amber-700">— votre prix est au-dessus : ça peut se vendre moins vite.</span>}
      {v === 'bas' && <span className="ml-1 font-semibold text-amber-700">— votre prix est bien en dessous : vérifiez qu’il ne manque pas un zéro.</span>}
    </p>
  )
}

/** Sur la fiche, sous le prix : un mot pour l'acheteur. */
export function PrixMarcheAcheteur({ prix, ...cle }: Cle & { prix: number }) {
  const f = useFourchette(cle, prix > 0)
  const v = verdictPrix(prix, f ?? null)
  if (!f || !v) return null
  if (v === 'bas') {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm font-semibold text-amber-800">
        <span aria-hidden="true">⚠️</span>
        Bien en dessous du marché ({fourchetteTexte(f, formatFCFA)}) — méfiance : ne payez rien avant d’avoir vu l’objet.
      </p>
    )
  }
  return (
    <p className="mt-1.5 text-sm text-gray-600">
      {v === 'moyen' ? 'Prix dans la moyenne' : 'Prix au-dessus de la moyenne'} sur Chap.ci
      <span className="text-gray-500"> ({fourchetteTexte(f, formatFCFA)}, {f.n} annonces)</span>
    </p>
  )
}
