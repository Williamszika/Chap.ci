// =============================================================================
//  Fête de l'Indépendance 🇨🇮 — logique partagée (bandeau + ambiance site).
//  Concept « jour » (1ᵉʳ→6 août) : couleurs + confettis. « nuit » (7→10 août) :
//  feux d'artifice. Test à tout moment : ?fete=a (jour) / b (nuit) / 0 (off).
// =============================================================================
export type FestiveMode = 'day' | 'night'

export const FESTIVE_COLORS = ['#F77F00', '#FFFFFF', '#009E60', '#F6B301', '#FF9A2E', '#00B86B']
// Palette « nuit » (couleurs saturées, bien visibles même sur fond clair).
export const FIREWORK_COLORS = ['#F77F00', '#009E60', '#EA580C', '#F6B301', '#00A651', '#FF5A1F']

const HIDE_EVENT = 'chapci-fete-hide'
const HIDE_KEY = 'chapci.fete.hide'

function param(name: string): string | null {
  try {
    const s = new URLSearchParams(window.location.search)
    if (s.has(name)) return s.get(name)
    const h = window.location.hash
    const i = h.indexOf('?')
    if (i >= 0) return new URLSearchParams(h.slice(i + 1)).get(name)
  } catch { /* ignore */ }
  return null
}

/**
 * L'AMBIANCE SUIT L'HEURE, PAS LA DATE.
 *
 * Jusqu'au 05/08/2026, « nuit » désignait un intervalle de dates — du 7 au
 * 10 août — et « jour » les six jours d'avant. Résultat : les feux d'artifice
 * ne se déclenchaient jamais le soir, et les confettis tombaient à minuit.
 * Le Patron l'a dit en une phrase : « normalement les nuits, c'est les feux
 * d'artifice ». Il a raison — un feu d'artifice, c'est le soir.
 *
 * LA FÊTE S'ARRÊTE AVEC LA FÊTE.
 *
 * La fenêtre allait jusqu'au 10 août : trois jours de confettis APRÈS
 * l'indépendance, pour un site de petites annonces. Le Patron l'a dit le 8 au
 * matin — « la fête est finie aujourd'hui, l'animation doit disparaître ».
 * Il a raison : une décoration qui traîne cesse d'être une fête et devient un
 * oubli, et c'est ce que voit le visiteur.
 *
 * La fenêtre va donc du 1ᵉʳ août au petit matin du 8 :
 *   · 1ᵉʳ → 6 août   : le décompte monte      -> JOUR, confettis ;
 *   · 7 août         : le Jour J ;
 *   · nuit du 7 au 8 : jusqu'à 6 h, c'est encore la nuit de la fête ;
 *   · 8 août, 6 h    : terminé, plus rien.
 *
 * Dedans, l'ambiance suit l'HEURE : de 18 h à 6 h, feux d'artifice ; le reste
 * de la journée, confettis.
 *
 * On lit l'heure LOCALE de l'appareil, pas celle du serveur : c'est la nuit de
 * celui qui regarde qui compte, pas celle d'Abidjan.
 *
 * Essais à tout moment : ?fete=a (jour) · ?fete=b (nuit) · ?fete=j (le 7 août)
 * · ?fete=0 (éteint).
 */
export function festiveMode(): FestiveMode | null {
  const f = param('fete')
  if (f === '0') return null
  if (f === 'a') return 'day'
  if (f === 'b') return 'night'
  if (f === 'j') return 'day' // le jour de la fête : confettis + message de vœux
  const d = new Date()
  if (d.getMonth() !== 7) return null // août = mois 7
  const day = d.getDate()
  const h = d.getHours()
  if (day < 1 || day > 8) return null
  // Le 8, on laisse finir la nuit du 7 — un feu d'artifice ne s'éteint pas à
  // minuit pile — puis plus rien.
  if (day === 8 && h >= 6) return null
  return h >= 18 || h < 6 ? 'night' : 'day'
}

/**
 * LE 7 AOÛT, ON SOUHAITE LA FÊTE — on ne décompte plus.
 *
 * L'ambiance (confettis ou feux) répond à l'heure ; le MESSAGE répond à la
 * date. Ce sont deux choses différentes, et les confondre donnait « Plus que
 * 0 jours » le jour même de l'indépendance.
 */
export function isFeteDay(): boolean {
  if (param('fete') === 'j') return true
  const d = new Date()
  if (d.getMonth() !== 7) return false
  // Le 7 toute la journée — ET la nuit du 7 au 8 jusqu'à 6 h. À deux heures du
  // matin on fête encore le 7 : sans cette seconde condition, le bandeau
  // afficherait « J-0 » au milieu du feu d'artifice.
  return d.getDate() === 7 || (d.getDate() === 8 && d.getHours() < 6)
}

export function daysToFete(): number {
  const d = new Date()
  return Math.max(0, Math.ceil((new Date(d.getFullYear(), 7, 7).getTime() - d.getTime()) / 86400000))
}

export function prefersReducedMotion(): boolean {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

export function isFestiveDismissed(mode: FestiveMode): boolean {
  try { return sessionStorage.getItem(HIDE_KEY) === mode } catch { return false }
}
export function dismissFestive(mode: FestiveMode): void {
  try { sessionStorage.setItem(HIDE_KEY, mode) } catch { /* ignore */ }
  try { window.dispatchEvent(new Event(HIDE_EVENT)) } catch { /* ignore */ }
}
export function onFestiveHide(cb: () => void): () => void {
  window.addEventListener(HIDE_EVENT, cb)
  return () => window.removeEventListener(HIDE_EVENT, cb)
}
