// =============================================================================
//  Suivi anonyme des visites (analytics maison, respectueux de la vie privée).
//  Un identifiant aléatoire par appareil (pas de nom, pas d'email) permet de
//  distinguer « pages vues » et « visiteurs uniques ». Aucune donnée externe.
// =============================================================================
import { isPhp } from './backend'
import { apiBase } from './native'
import { phpGetUid } from './php'

// Base API cohérente avec le reste de l'app : relative sur le web, absolue
// (https://chap.ci/api) dans l'app native Capacitor.
const API = apiBase()
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
    // `auth` : la page est-elle vue par quelqu'un qui a un compte ouvert ? On
    // n'envoie PAS qui c'est — juste 1 ou 0. Le serveur préfère sa propre lecture
    // de la session quand il l'a (cookie) ; ce drapeau sert surtout à l'app native,
    // dont la requête n'emporte pas le cookie.
    const body = JSON.stringify({
      vid: visitorId(),
      path,
      ref: document.referrer || '',
      auth: phpGetUid() ? 1 : 0,
    })
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

/* ===========================================================================
 *  LES MARCHES DE LA PUBLICATION
 *
 *  Le 17/08, on savait que 219 personnes étaient arrivées sur /publier en trente
 *  jours et qu'UNE avait publié. On ignorait laquelle des douze marches les
 *  arrêtait : le mur de connexion, le code e-mail, la troisième photo, un champ
 *  de catégorie ? Toute correction du formulaire aurait été une hypothèse.
 *
 *  Ces six repères répondent à la question. Ils partent vers la MÊME route que
 *  les visites (mêmes gardes : équipe exclue, session tranchée côté serveur)
 *  mais atterrissent dans une table à part : ce ne sont pas des pages vues, et
 *  les compter comme telles fausserait « Pages vues ».
 *
 *  Aucune donnée saisie ne part jamais — ni titre, ni prix, ni photo. `detail`
 *  ne porte que le NOM du champ qui a bloqué.
 * ======================================================================== */
export type EtapePublier =
  | 'arrivee'        // l'écran /publier s'ouvre
  | 'mur_connexion'  // le visiteur n'a pas de compte : on lui propose d'en créer un
  | 'mur_email'      // compte présent, adresse non confirmée : on demande le code
  | 'formulaire'     // le formulaire est réellement affiché, on peut saisir
  | 'echec'          // l'envoi a été refusé — `detail` dit quel champ
  | 'publiee'        // l'annonce est partie

export function trackEtapePublier(etape: EtapePublier, detail?: string): void {
  if (!isPhp) return
  try {
    const body = JSON.stringify({
      vid: visitorId(),
      path: '/publier',
      etape,
      detail: etape === 'echec' ? (detail ?? '').slice(0, 60) : '',
      auth: phpGetUid() ? 1 : 0,
    })
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
    /* la mesure ne casse jamais la publication */
  }
}
