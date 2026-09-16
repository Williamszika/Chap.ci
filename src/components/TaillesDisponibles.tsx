/**
 * LES TAILLES D'UN VÊTEMENT, EN PASTILLES — 16/09/2026.
 *
 * Demandé par le Patron à partir de planches d'applications de mode : une
 * rangée de pastilles rondes, lisible d'un coup d'œil, à la place d'une ligne
 * de texte.
 *
 * Ce que ça corrige : « Tailles disponibles · S, M, L » s'affichait dans la
 * grille générique, au même rang que « Matière · Coton » et « Marque · Uniwax ».
 * Or pour un vêtement, la taille n'est pas un détail parmi d'autres — c'est LA
 * question, celle qui décide si l'acheteur continue de lire ou s'en va. Elle
 * méritait d'être vue avant d'être lue.
 *
 * ⚠️ CE QUI DIFFÈRE DES PLANCHES, ET C'EST VOLONTAIRE.
 *
 * Dans une boutique en ligne, ces pastilles se CHOISISSENT : on tape « L »,
 * l'article part au panier dans cette taille. Chap.ci est un site de petites
 * annonces : ces tailles sont celles que LE VENDEUR A EN STOCK. Rien ne se
 * choisit ici, et la suite se règle avec lui.
 *
 * Elles sont donc des `<span>`, pas des `<button>` : pas d'état sélectionné,
 * pas de survol, pas de curseur en main. Copier le bouton des planches aurait
 * été un mensonge d'un pixel — quelqu'un aurait tapé « L » en croyant réserver
 * sa taille, et rien ne se serait produit. Un bouton qui ne fait rien use la
 * confiance plus vite qu'une ligne de texte terne.
 *
 * Le titre le dit aussi en toutes lettres : « disponibles », pas « choisissez ».
 */
import { useMemo } from 'react'

interface Props {
  /** Libellé du champ, tel que le schéma l'écrit (« Tailles disponibles »). */
  label: string
  /** Ce que le vendeur a coché, séparé par des virgules. */
  valeur: string
  /**
   * L'ordre du formulaire (XS, S, M, L, XL…). Sans lui, les tailles
   * s'afficheraient dans l'ordre où le vendeur les a cochées — « XL, S, M » se
   * lit mal, et deux annonces voisines ne se comparent plus.
   */
  ordre?: string[]
}

export function TaillesDisponibles({ label, valeur, ordre }: Props) {
  const tailles = useMemo(() => {
    const cochees = valeur
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!ordre?.length) return cochees
    // Un rang par option connue ; l'inconnu (une vieille annonce, une saisie
    // libre d'avant les schémas) passe à la fin plutôt que de disparaître.
    const rang = new Map(ordre.map((o, i) => [o, i]))
    return [...cochees].sort((a, b) => (rang.get(a) ?? 1e6) - (rang.get(b) ?? 1e6))
  }, [valeur, ordre])

  if (!tailles.length) return null

  return (
    <section className="mt-5">
      <h2 className="mb-2 font-display text-sm font-bold text-gray-900">{label}</h2>
      {/* `list` + `listitem` : un lecteur d'écran annonce « liste de 3 éléments »
          et non une suite de mots isolés. Le rôle est explicite parce que
          `list-none` retire la sémantique de liste dans certains navigateurs. */}
      <ul role="list" className="flex flex-wrap gap-2">
        {tailles.map((t) => (
          <li
            key={t}
            className="tnum inline-flex min-h-[40px] min-w-[40px] items-center justify-center
                       rounded-full border border-line2 bg-cream-100 px-3
                       font-display text-sm font-bold text-primary-800"
          >
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-gray-500">
        Ce que le vendeur a en stock. Confirmez avec lui avant de vous déplacer.
      </p>
    </section>
  )
}
