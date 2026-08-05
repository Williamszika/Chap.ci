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
 * Fenêtre de fête : du 1ᵉʳ au 10 août. Dedans :
 *   · de 18 h à 6 h (heure du téléphone) -> NUIT, feux d'artifice ;
 *   · le reste de la journée             -> JOUR, confettis.
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
  if (day < 1 || day > 10) return null
  const h = d.getHours()
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
  return d.getMonth() === 7 && d.getDate() === 7
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
