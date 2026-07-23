// =============================================================================
//  Pixels marketing — Meta (Facebook/Instagram), TikTok, Google (GA4).
//
//  Objectif : mesurer les conversions (inscriptions, publications) et constituer
//  des audiences de reciblage pour les futures campagnes publicitaires.
//
//  Contrainte CSP : la Content-Security-Policy du site interdit les scripts
//  « inline ». On n'injecte donc PAS les snippets HTML tels quels : tout le code
//  d'amorçage tourne DANS ce module (bundlé = origine 'self', autorisée) et on ne
//  charge que les scripts EXTERNES (dont les hôtes sont ajoutés à script-src).
//
//  Ne s'active QUE sur le web en production (pas en dev, pas dans l'app native
//  Capacitor — le suivi natif se fait via les SDK, séparément).
// =============================================================================
import { isNative } from './native'

const META_PIXEL_ID = '1617587653705134'
const TIKTOK_PIXEL_ID = 'D9H1PR3C77U7JAF0T350'
const GA4_ID = 'G-PLS797WWZM'

let started = false

/** Charge et initialise les 3 pixels. À appeler une seule fois au démarrage. */
export function initMarketing(): void {
  if (started) return
  if (typeof window === 'undefined') return
  if (isNative) return // app native : pas de pixels web
  if (import.meta.env.DEV) return // pas de traceurs en développement
  started = true
  try { loadMeta() } catch { /* silencieux */ }
  try { loadTikTok() } catch { /* silencieux */ }
  try { loadGA4() } catch { /* silencieux */ }
}

// --- Meta Pixel (fbevents.js) -----------------------------------------------
function loadMeta(): void {
  const w = window as any
  if (w.fbq) return
  const n: any = (w.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
  })
  if (!w._fbq) w._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = []
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)
  w.fbq('init', META_PIXEL_ID)
  // La 1ʳᵉ PageView (et les suivantes en SPA) sont envoyées par trackPage().
}

// --- TikTok Pixel (events.js) -----------------------------------------------
function loadTikTok(): void {
  const w = window as any
  w.TiktokAnalyticsObject = 'ttq'
  const ttq: any = (w.ttq = w.ttq || [])
  ttq.methods = ['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie','holdConsent','revokeConsent','grantConsent']
  ttq.setAndDefer = function (t: any, e: string) {
    t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) }
  }
  for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i])
  ttq.load = function (e: string, n?: any) {
    const r = 'https://analytics.tiktok.com/i18n/pixel/events.js'
    ttq._i = ttq._i || {}
    ttq._i[e] = []
    ttq._i[e]._u = r
    ttq._t = ttq._t || {}
    ttq._t[e] = +new Date()
    ttq._o = ttq._o || {}
    ttq._o[e] = n || {}
    const s = document.createElement('script')
    s.type = 'text/javascript'
    s.async = true
    s.src = r + '?sdkid=' + e + '&lib=ttq'
    const f = document.getElementsByTagName('script')[0]
    f.parentNode!.insertBefore(s, f)
  }
  ttq.load(TIKTOK_PIXEL_ID)
  // ttq.page() est appelé par trackPage().
}

// --- Google Analytics 4 (gtag.js) -------------------------------------------
function loadGA4(): void {
  const w = window as any
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID
  document.head.appendChild(s)
  w.dataLayer = w.dataLayer || []
  const gtag = function () { w.dataLayer.push(arguments) }
  w.gtag = gtag
  ;(gtag as any)('js', new Date())
  // send_page_view:false → on pilote NOUS-MÊMES les vues via trackPage()
  // (SPA HashRouter : GA4 ne détecte pas les changements de route seul).
  ;(gtag as any)('config', GA4_ID, { send_page_view: false })
}

// --- Événements --------------------------------------------------------------

/** Vue de page (à chaque changement de route SPA, 1ʳᵉ vue incluse). */
export function trackPage(path: string): void {
  if (!started) return
  const w = window as any
  try { w.fbq?.('track', 'PageView') } catch { /* */ }
  try { w.ttq?.page?.() } catch { /* */ }
  try { w.gtag?.('event', 'page_view', { page_path: path, page_location: location.href, page_title: document.title }) } catch { /* */ }
}

/** Conversion : inscription d'un nouvel utilisateur. */
export function trackSignup(): void {
  if (!started) return
  const w = window as any
  try { w.fbq?.('track', 'CompleteRegistration') } catch { /* */ }
  try { w.ttq?.track?.('CompleteRegistration') } catch { /* */ }
  try { w.gtag?.('event', 'sign_up') } catch { /* */ }
}

/** Conversion : publication d'une annonce (action clé de la marketplace). */
export function trackPublish(): void {
  if (!started) return
  const w = window as any
  try { w.fbq?.('track', 'Lead') } catch { /* */ }
  try { w.ttq?.track?.('SubmitForm') } catch { /* */ }
  try { w.gtag?.('event', 'generate_lead') } catch { /* */ }
}
