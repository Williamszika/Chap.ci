import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Langue d'affichage des pages d'information (`?lang=` dans l'URL).
//
// L'application ouvre les pages Aide, FAQ, Contact, À propos, CGU et
// Confidentialité dans une vue web embarquée. Quand son utilisateur a choisi
// une autre langue que le français, elle ajoute `?lang=en|es|pt|ar|zh` à
// l'adresse. Le site étant en HashRouter, le paramètre voyage DANS le hash
// (`#/aide?lang=en`) et se lit par `useLocation().search` — exactement comme
// `?rubrique=` sur la page Aide ou `?sujet=` sur la page Contact.
//
// Le français reste la référence : sans paramètre (donc pour tous les
// visiteurs du site web), rien ne change — et surtout, RIEN de plus n'est
// téléchargé : les traductions ne se chargent qu'à la demande (voir le hook).

/** Les langues des pages du site — les mêmes que dans l'application. */
export type LangueSite = 'fr' | 'en' | 'es' | 'pt' | 'ar' | 'zh'

/** Une langue traduite (le français, lui, vit en dur dans les pages). */
export type LangueTraduite = Exclude<LangueSite, 'fr'>

const LANGUES: readonly string[] = ['fr', 'en', 'es', 'pt', 'ar', 'zh']
const CLE_MEMOIRE = 'chapci.lang'

/**
 * Lit `?lang=` dans la partie recherche de l'URL ; français par défaut.
 *
 * La langue lue est mémorisée pour la session de navigation : les liens
 * internes des pages (FAQ → Contact, CGU → Confidentialité) ne portent pas le
 * paramètre, et sans cette mémoire ils retomberaient en français au premier
 * clic. Un paramètre explicite reprend toujours la main — l'application envoie
 * `?lang=` à chaque ouverture, y compris `fr`, précisément pour cela. Un
 * visiteur web ordinaire n'a jamais le paramètre : rien n'est mémorisé, tout
 * reste en français.
 */
export function langueDepuis(search: string): LangueSite {
  const brut = (new URLSearchParams(search).get('lang') || '').toLowerCase()
  if (LANGUES.includes(brut)) {
    try {
      sessionStorage.setItem(CLE_MEMOIRE, brut)
    } catch {
      /* stockage indisponible : la langue vivra le temps de la page */
    }
    return brut as LangueSite
  }
  try {
    const memo = sessionStorage.getItem(CLE_MEMOIRE)
    if (memo && LANGUES.includes(memo)) return memo as LangueSite
  } catch {
    /* stockage indisponible */
  }
  return 'fr'
}

/** L'arabe s'écrit de droite à gauche : les pages traduites posent `dir`. */
export function estRTL(l: LangueSite): boolean {
  return l === 'ar'
}

/**
 * Charge (paresseusement) la traduction d'une page selon `?lang=`.
 *
 * - `t` : les textes traduits, ou `null` tant que la page est en français —
 *   par choix (pas de paramètre) ou le temps que la traduction arrive.
 * - `dir` : `'rtl'` quand la traduction arabe est affichée, sinon `undefined`
 *   (on ne bascule la mise en page qu'une fois le texte arabe réellement là,
 *   jamais sur du texte français).
 *
 * `charger` ne reçoit jamais `'fr'` : le français est déjà dans la page.
 */
export function useTraductionPage<T>(
  charger: (langue: LangueTraduite) => Promise<T | null>,
): { langue: LangueSite; t: T | null; dir: 'rtl' | undefined } {
  const { search } = useLocation()
  const langue = langueDepuis(search)
  const [t, setT] = useState<T | null>(null)
  useEffect(() => {
    if (langue === 'fr') {
      setT(null)
      return
    }
    let vivant = true
    charger(langue)
      .then((d) => {
        if (vivant) setT(d)
      })
      .catch(() => {
        /* traduction introuvable : la page reste en français */
      })
    return () => {
      vivant = false
    }
    // Volontairement recalculé sur la seule langue : `charger` est une flèche
    // stable écrite en dur dans chaque page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langue])
  return { langue, t, dir: t !== null && estRTL(langue) ? 'rtl' : undefined }
}
