// =============================================================================
//  Suivi anonyme des visites (analytics maison, respectueux de la vie privée).
//  Un identifiant aléatoire par appareil (pas de nom, pas d'email) permet de
//  distinguer « pages vues » et « visiteurs uniques ». Aucune donnée externe.
// =============================================================================
import { isPhp } from './backend'

const API = ((import.meta.env.VITE_API_URL as string) || '/api').replace(/\/$/, '')
const VID_KEY = 'chapci.vid'

function visitorId(): string {
  try {
    let v = localStorage.getItem(VID_KEY)
    if (!v) {
      v = 'v-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
      localStorage.setItem(VID_KEY, v)
    }
    return v
  } catch {
    return 'anon'
  }
}

let lastPath = ''
let lastTime = 0

/** Enregistre une vue de page (best-effort, silencieux). */
export function trackPageView(path: string): void {
  if (!isPhp) return
  const now = Date.now()
  if (path === lastPath && now - lastTime < 1500) return // anti-doublon
  lastPath = path
  lastTime = now
  try {
    const body = JSON.stringify({ vid: visitorId(), path, ref: document.referrer || '' })
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API + '/track', new Blob([body], { type: 'application/json' }))
    } else {
      void fetch(API + '/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    /* silencieux */
  }
}
