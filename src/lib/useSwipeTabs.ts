import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isNative } from './native'

/**
 * Passer d'un onglet à l'autre d'un glissement du pouce.
 *
 * ── Pourquoi seulement dans l'application ────────────────────────────────────
 * Sur le site, un glissement horizontal n'existe pas : on est à la souris ou au
 * pavé tactile, et un défilement latéral de pavé déclencherait des changements
 * de page à l'insu de l'utilisateur. Ce geste n'a de sens que sous un pouce.
 *
 * ── Pourquoi « Publier » est SAUTÉ ───────────────────────────────────────────
 * La barre montre cinq onglets, le glissement n'en enchaîne que quatre. Publier
 * n'est pas une destination qu'on parcourt : c'est une action, et elle ouvre un
 * mur de connexion pour qui n'a pas de compte. Y arriver PAR ACCIDENT, en
 * balayant distraitement, serait la pire façon de rencontrer ce mur. Le bouton
 * central reste évidemment accessible d'un appui — c'est même pour cela qu'il
 * est au centre et en orange.
 *
 * ── Pourquoi tant de garde-fous ──────────────────────────────────────────────
 * Un geste global est un geste qui vole les autres. L'application est pleine de
 * bandes qui défilent horizontalement — la galerie d'une annonce, les puces de
 * catégories, les filtres de l'explorateur, l'écran publicitaire. Si le pouce
 * part de l'une d'elles, elle est prioritaire : on ne change pas de page pendant
 * que quelqu'un regarde des photos.
 */

/** Les quatre destinations que l'on parcourt, dans l'ordre de la barre. */
const ONGLETS = ['/', '/explorer', '/favoris', '/compte'] as const

/** Distance minimale du geste, et dominance horizontale exigée. */
const DISTANCE_MIN = 70      // px — en dessous, c'est une hésitation, pas un geste
const DOMINANCE = 1.8        // le déplacement horizontal doit valoir 1,8× le vertical
const DUREE_MAX = 700        // ms — un glissement lent est un défilement, pas un balayage

/**
 * Le pouce est-il parti d'une bande qui défile horizontalement ?
 * Si oui, elle garde la main : c'est SON geste, pas celui de la navigation.
 */
function dansUneBandeHorizontale(cible: EventTarget | null): boolean {
  let n = cible instanceof Element ? cible : null
  while (n && n !== document.body) {
    if (n.scrollWidth > n.clientWidth + 4) {
      const ox = getComputedStyle(n).overflowX
      if (ox === 'auto' || ox === 'scroll') return true
    }
    n = n.parentElement
  }
  return false
}

export function useSwipeTabs(): void {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // La position courante est lue au moment du RELÂCHEMENT, pas de la pose du
  // doigt : sans cette référence, l'effet se réabonnerait à chaque changement de
  // page et perdrait le geste en cours.
  const page = useRef(pathname)
  page.current = pathname

  useEffect(() => {
    if (!isNative) return

    let x0 = 0, y0 = 0, t0 = 0, actif = false

    const debut = (e: TouchEvent) => {
      // Un seul doigt : à deux, c'est un zoom, jamais une navigation.
      if (e.touches.length !== 1) { actif = false; return }
      // Une fenêtre ouverte par-dessus (photo en grand, feuille de partage,
      // aperçu admin) capte tous les gestes tant qu'elle est là.
      if (document.querySelector('[role="dialog"]')) { actif = false; return }
      if (dansUneBandeHorizontale(e.target)) { actif = false; return }
      const t = e.touches[0]
      x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); actif = true
    }

    const fin = (e: TouchEvent) => {
      if (!actif) return
      actif = false
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - x0
      const dy = t.clientY - y0
      if (Date.now() - t0 > DUREE_MAX) return
      if (Math.abs(dx) < DISTANCE_MIN) return
      if (Math.abs(dx) < Math.abs(dy) * DOMINANCE) return

      const i = (ONGLETS as readonly string[]).indexOf(page.current)
      if (i === -1) return // page hors barre d'onglets : le geste ne nous regarde pas

      // Glisser vers la GAUCHE fait avancer : le contenu suit le doigt, comme
      // on tourne une page. Pas de bouclage — revenir à l'accueil depuis le
      // compte en continuant vers la droite désoriente plus que ça n'aide.
      const j = dx < 0 ? i + 1 : i - 1
      if (j < 0 || j >= ONGLETS.length) return
      navigate(ONGLETS[j])
    }

    document.addEventListener('touchstart', debut, { passive: true })
    document.addEventListener('touchend', fin, { passive: true })
    return () => {
      document.removeEventListener('touchstart', debut)
      document.removeEventListener('touchend', fin)
    }
  }, [navigate])
}
