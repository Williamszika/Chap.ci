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

export function festiveMode(): FestiveMode | null {
  const f = param('fete')
  if (f === '0') return null
  if (f === 'a') return 'day'
  if (f === 'b') return 'night'
  const d = new Date()
  if (d.getMonth() !== 7) return null // août = mois 7
  const day = d.getDate()
  if (day >= 1 && day <= 6) return 'day'
  if (day >= 7 && day <= 10) return 'night'
  return null
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
