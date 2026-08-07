// =============================================================================
//  Les notifications push, côté navigateur.
//
//  La cloche du site n'existe que pendant qu'on regarde le site. Le push, lui,
//  arrive sur le téléphone verrouillé, navigateur fermé, application jamais
//  rouverte — c'est la seule voie qui prévient VRAIMENT quelqu'un d'absent.
//
//  Le chemin complet, une seule fois pour toutes :
//    1. le navigateur demande la permission à la personne ;
//    2. il s'abonne auprès de SON relais (Google pour Chrome, Mozilla pour
//       Firefox, Apple pour Safari) en présentant la clé publique du site ;
//    3. il nous rend une adresse et deux clés de chiffrement ;
//    4. on les range sur le serveur, qui chiffrera chaque message pour elles.
//
//  Le relais transporte sans jamais pouvoir lire. C'est la RFC 8291.
// =============================================================================
import { isPhp } from './backend'
import { isNative } from './native'
import { phpPushKey, phpPushSubscribe, phpPushUnsubscribe } from './php'

export type EtatPush =
  /** Navigateur trop ancien, ou backend statique : rien à proposer. */
  | 'indisponible'
  /** L'application Android empaquetée : sa WebView n'a pas l'API Push. */
  | 'app-native'
  /** iPhone dans Safari : Apple n'ouvre le push qu'aux sites ajoutés à l'écran d'accueil. */
  | 'ios-a-installer'
  /** La personne a refusé. Seuls les réglages du navigateur peuvent revenir dessus. */
  | 'refuse'
  /** Possible, mais pas encore activé sur cet appareil. */
  | 'inactif'
  | 'actif'

/** Vrai sur un iPhone/iPad — y compris les iPad récents qui se disent « Mac ». */
function estIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1)
}

/** Vrai si la page tourne comme une application installée (écran d'accueil). */
function estInstallee(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true
}

/**
 * La clé publique du serveur arrive en base64url ; `subscribe()` veut des
 * octets. Il n'y a pas de raccourci : `atob` ne connaît pas l'alphabet URL.
 */
function cleEnOctets(b64url: string): ArrayBuffer {
  const bourrage = '='.repeat((4 - (b64url.length % 4)) % 4)
  const brut = atob((b64url + bourrage).replace(/-/g, '+').replace(/_/g, '/'))
  const tampon = new ArrayBuffer(brut.length)
  const vue = new Uint8Array(tampon)
  for (let i = 0; i < brut.length; i++) vue[i] = brut.charCodeAt(i)
  return tampon
}

/** Vrai si ce navigateur sait, en principe, recevoir des notifications push. */
export function pushPossible(): boolean {
  return isPhp && !isNative
    && typeof navigator !== 'undefined' && 'serviceWorker' in navigator
    && typeof window !== 'undefined' && 'PushManager' in window && 'Notification' in window
}

/** Où en est cet appareil ? Ne demande rien à personne : lit, c'est tout. */
export async function etatPush(): Promise<EtatPush> {
  if (isNative) return 'app-native'
  if (!isPhp) return 'indisponible'
  if (!pushPossible()) return estIOS() && !estInstallee() ? 'ios-a-installer' : 'indisponible'
  if (Notification.permission === 'denied') return 'refuse'
  try {
    const reg = await navigator.serviceWorker.ready
    return (await reg.pushManager.getSubscription()) ? 'actif' : 'inactif'
  } catch {
    return 'inactif'
  }
}

/**
 * Active les notifications sur CET appareil.
 *
 * Rend l'état obtenu. La demande de permission n'est légitime qu'à la suite
 * d'un geste de la personne — un bouton qu'elle a touché : les navigateurs
 * refusent (et pénalisent) une demande spontanée au chargement.
 */
export async function activerPush(): Promise<EtatPush> {
  const etat = await etatPush()
  if (etat !== 'inactif' && etat !== 'actif') return etat

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'refuse' : 'inactif'

  const { cle, actif } = await phpPushKey()
  if (!actif || !cle) throw new Error('Les notifications ne sont pas configurées sur le serveur.')

  const reg = await navigator.serviceWorker.ready
  // Un abonnement peut déjà exister avec une AUTRE clé du site (clé VAPID
  // changée, ou navigateur restauré) : il ne serait plus déchiffrable. On
  // repart de zéro plutôt que de garder un abonnement muet.
  const ancien = await reg.pushManager.getSubscription()
  if (ancien) { try { await ancien.unsubscribe() } catch { /* on continue */ } }

  const sub = await reg.pushManager.subscribe({
    // Obligatoire : promet que chaque envoi produira une notification visible.
    // Les navigateurs n'acceptent plus le push silencieux.
    userVisibleOnly: true,
    applicationServerKey: cleEnOctets(cle),
  })
  await phpPushSubscribe(sub.toJSON())
  return 'actif'
}

/** Coupe les notifications sur cet appareil, des deux côtés. */
export async function desactiverPush(): Promise<void> {
  if (!pushPossible()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await phpPushUnsubscribe({ endpoint: sub.endpoint })
  try { await sub.unsubscribe() } catch { /* le serveur ne l'a déjà plus */ }
}

/**
 * À appeler au démarrage, quand quelqu'un est connecté.
 *
 * Ne demande AUCUNE permission et n'affiche rien. Elle répare seulement deux
 * pannes silencieuses, celles qu'on ne découvrirait jamais autrement :
 *   · le navigateur a renouvelé l'adresse chez le relais (il le fait tout seul,
 *     sans prévenir) — le serveur écrivait alors dans le vide ;
 *   · une autre personne s'est connectée sur cet appareil — les notifications
 *     seraient parties au compte précédent.
 * Dans les deux cas la route serveur est idempotente : elle remplace la ligne.
 */
export async function synchroniserPush(): Promise<void> {
  if (!pushPossible() || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await phpPushSubscribe(sub.toJSON())
  } catch { /* la synchronisation n'est jamais urgente */ }
}
