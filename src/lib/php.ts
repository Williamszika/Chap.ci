// =============================================================================
//  Client du backend PHP auto-hébergé (server/) — base TPE Cloud. Unique backend
//  du site (annonces, messagerie, commandes, avis, profils, comptes).
// =============================================================================
import type { Conversation, Listing, Message, Order, Review } from '../types'
import type { NewListingInput } from '../store/AppContext'
import type { ProfileFields, PublicProfile } from './profiles'
import type { CartItem } from '../types'

import { apiBase } from './native'
const API = apiBase() // absolue dans l'app native, relative sur le web
const TOKEN_KEY = 'chapci.php.token'
const UID_KEY = 'chapci.php.uid'
const USER_KEY = 'chapci.php.user'
// Jeton de déverrouillage du tableau de bord admin — en sessionStorage (effacé à
// la fermeture de l'onglet) : la serrure se referme à chaque nouvelle session.
const ADMIN_UNLOCK_KEY = 'chapci.admin.unlock'

export interface PhpUser {
  id: string
  email: string
  verified?: boolean
  /** Adresse confirmée par code : condition pour publier une annonce. */
  emailVerified?: boolean
  /** '' = aucun badge · 'anciennete' = vert (6 mois) · 'admin' = bleu (équipe). */
  badge?: 'admin' | 'anciennete' | ''
  /**
   * Le numéro déjà connu du compte (inscription par téléphone, ou saisi depuis).
   * Sert à PRÉ-REMPLIR le champ vendeur de l'écran de publication, comme le nom :
   * c'était le dernier champ qu'un premier vendeur devait taper à la main.
   */
  phone?: string | null
  user_metadata?: { full_name?: string | null }
}

/**
 * P3 · Jeton « hérité » éventuellement encore présent en localStorage (sessions
 * ouvertes avant la migration vers le cookie HttpOnly). On le lit uniquement pour
 * le transmettre une dernière fois en repli (Bearer) le temps que le serveur
 * repose la session en cookie ; il est ensuite effacé (voir phpMe).
 */
export function phpGetToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function phpGetUid(): string | null {
  return localStorage.getItem(UID_KEY)
}
export function phpGetStoredUser(): PhpUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as PhpUser) : null
  } catch {
    return null
  }
}
/**
 * P3 · On NE stocke plus le jeton dans le navigateur : l'identité est portée par
 * le cookie HttpOnly posé par le serveur (involable par une injection XSS). On ne
 * met en cache que l'objet utilisateur (non sensible) pour un affichage instantané.
 */
function cacheUser(user: PhpUser) {
  localStorage.setItem(UID_KEY, user.id)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export function phpClearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(UID_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(ADMIN_UNLOCK_KEY) // referme la serrure du tableau de bord
  localStorage.removeItem(ADMIN_UNLOCK_KEY)
}

/**
 * Erreur d'API enrichie du code HTTP (`status`). `status === 0` signale un échec
 * réseau/timeout (pas de réponse du serveur), ce qui permet aux appelants de
 * distinguer « hors-ligne » d'un vrai refus serveur (401/403…).
 */
export class ApiError extends Error {
  status: number
  moderation?: unknown
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function req<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const hasBody = opts.body !== undefined
  const headers: Record<string, string> = {}
  // On ne pose Content-Type que s'il y a un corps : évite un préflight CORS
  // inutile sur les GET (et reste conforme aux requêtes « simples »).
  if (hasBody) headers['Content-Type'] = 'application/json'
  // Repli « hérité » : si un ancien jeton traîne encore en localStorage, on le
  // transmet en Bearer jusqu'à la migration vers le cookie (voir phpMe).
  const token = phpGetToken()
  if (token) headers.Authorization = `Bearer ${token}`
  // 2ᵉ serrure admin : sur les routes /admin, on transmet le jeton de
  // déverrouillage (obtenu après saisie du code d'accès). Limité à /admin pour ne
  // pas déclencher de préflight CORS inutile ailleurs.
  if (path.startsWith('/admin')) {
    // Modérateur = jeton persistant (localStorage) ; propriétaire = jeton de
    // session (sessionStorage). On envoie celui qui est présent.
    const unlock = localStorage.getItem(ADMIN_UNLOCK_KEY) || sessionStorage.getItem(ADMIN_UNLOCK_KEY)
    if (unlock) headers['X-Admin-Unlock'] = unlock
  }

  // Délai de garde : au-delà de 15 s on abandonne, pour ne jamais laisser un
  // spinner bloqué indéfiniment sur un réseau instable (P·robustesse mobile).
  //
  // L'AbortController ne suffit PAS dans l'application Android, et c'est
  // contre-intuitif. Capacitor remplace `window.fetch` (CapacitorHttp activé
  // dans capacitor.config.ts) : les GET repartent vers le vrai fetch, qui
  // respecte le signal — mais les POST, PUT, PATCH et DELETE sont convertis en
  // appel au pont natif, et le `signal` est purement et simplement abandonné en
  // route (@capacitor/android .../native-bridge.js, la branche qui appelle
  // `cap.nativePromise('CapacitorHttp', 'request', …)` sans le transmettre).
  //
  // Autrement dit : sur un réseau ivoirien qui décroche en plein envoi, « Se
  // connecter » et « Publier » — précisément les gestes qui comptent — tournent
  // indéfiniment, sans message et sans moyen d'annuler. On double donc la garde
  // par une course : quoi qu'il arrive côté transport, la promesse rend la main
  // au bout de 15 s avec un message en français. La requête peut continuer sa
  // vie dans le vide ; ce qui compte, c'est que l'écran, lui, réponde.
  const ctrl = new AbortController()
  // Le corps d'une promesse s'exécute tout de suite : `minuterie` porte donc
  // déjà son identifiant quand on en a besoin, plus bas.
  let minuterie = 0
  const garde = new Promise<never>((_, rejeter) => {
    minuterie = window.setTimeout(() => {
      ctrl.abort() // utile pour les GET, sans effet sur le pont natif
      const e = new Error('délai dépassé')
      e.name = 'AbortError'
      rejeter(e)
    }, 15000)
  })
  let res: Response
  try {
    res = await Promise.race([
      fetch(API + path, {
        method: opts.method || 'GET',
        headers,
        // P3 · Envoie/reçoit le cookie de session HttpOnly (même origine, et origine
        // croisée légitime grâce à Allow-Credentials côté serveur).
        credentials: 'include',
        body: hasBody ? JSON.stringify(opts.body) : undefined,
        signal: ctrl.signal,
      }),
      garde,
    ])
  } catch (e) {
    // Échec réseau réel (hors-ligne, DNS, CORS, timeout/abort) : message clair
    // en français au lieu du « Load failed » / « Failed to fetch » brut.
    const aborted = (e as Error)?.name === 'AbortError'
    throw new ApiError(
      aborted
        ? 'Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez.'
        : 'Connexion au serveur impossible. Vérifiez votre connexion internet et réessayez.',
      0,
    )
  } finally {
    // Toujours désarmer la minuterie : sans cela, une réponse rapide laisserait
    // derrière elle un rejet programmé qui remonterait quinze secondes plus tard
    // comme promesse non gérée.
    window.clearTimeout(minuterie)
  }

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      // Réponse non-JSON (portail captif Wi-Fi, page d'erreur d'un proxy…) :
      // on ne laisse pas planter le parsing, on renvoie une erreur lisible.
      throw new ApiError(
        res.ok ? 'Réponse inattendue du serveur. Vérifiez votre connexion.' : `Erreur ${res.status}`,
        res.ok ? 0 : res.status,
      )
    }
  }
  const obj = (data ?? {}) as { error?: string; moderation?: unknown; reasons?: unknown }
  if (!res.ok) {
    const err = new ApiError(obj.error || `Erreur ${res.status}`, res.status)
    // Refus de modération : on transmet les raisons détaillées à l'appelant.
    if (obj.moderation && Array.isArray(obj.reasons)) err.moderation = obj.reasons
    throw err
  }
  return data as T
}

// ---- Auth -------------------------------------------------------------------
// Version des mentions légales acceptée à l'inscription (consentement horodaté).
export const CGU_VERSION = '2026-07-14'
export async function phpSignup(email: string, password: string, fullName: string): Promise<PhpUser> {
  const d = await req<{ token: string; user: PhpUser }>('/auth/signup', {
    method: 'POST',
    // Le formulaire n'autorise l'envoi que si la case CGU est cochée : on
    // transmet le consentement + la version acceptée, horodatés côté serveur.
    body: { email, password, full_name: fullName, consent: true, cguVersion: CGU_VERSION },
  })
  cacheUser(d.user)
  return d.user
}
export interface LoginResult { user?: PhpUser; mfaRequired?: boolean; mfaToken?: string }
export async function phpLogin(email: string, password: string): Promise<LoginResult> {
  const d = await req<{ token?: string; user?: PhpUser; mfa_required?: boolean; mfa_token?: string }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  // 2FA activée : le serveur ne délivre pas encore la session, il renvoie un
  // jeton de défi. La session s'ouvrira après validation du code (phpTwoFAVerify).
  if (d.mfa_required) return { mfaRequired: true, mfaToken: d.mfa_token }
  if (d.user) cacheUser(d.user)
  return { user: d.user }
}

// ---- Double authentification (2FA / TOTP) ----------------------------------
export async function phpTwoFAStatus(): Promise<{ enabled: boolean }> {
  try { return await req<{ enabled: boolean }>('/auth/2fa/status') } catch { return { enabled: false } }
}
export async function phpTwoFASetup(): Promise<{ factorId: string; secret: string; uri: string }> {
  return req('/auth/2fa/setup', { method: 'POST', body: {} })
}
export async function phpTwoFAActivate(code: string): Promise<{ recoveryCodes: string[] }> {
  return req('/auth/2fa/activate', { method: 'POST', body: { code } })
}
export async function phpTwoFADisable(code: string): Promise<void> {
  await req('/auth/2fa/disable', { method: 'POST', body: { code } })
}
export async function phpTwoFAVerify(mfaToken: string, code: string): Promise<PhpUser> {
  const d = await req<{ token: string; user: PhpUser }>('/auth/2fa/verify', {
    method: 'POST',
    body: { mfaToken, code },
  })
  cacheUser(d.user)
  return d.user
}
// Connexion / inscription via Google : on transmet le « credential » (jeton
// d'identité) fourni par Google Identity Services ; le serveur le vérifie.
export async function phpGoogleLogin(credential: string): Promise<PhpUser> {
  const d = await req<{ token: string; user: PhpUser }>('/auth/google', {
    method: 'POST',
    body: { credential },
  })
  cacheUser(d.user)
  return d.user
}
// Connexion / inscription via Facebook : on transmet le jeton d'accès obtenu par
// le SDK Facebook ; le serveur le vérifie (débog + profil).
export async function phpFacebookLogin(accessToken: string): Promise<PhpUser> {
  const d = await req<{ token: string; user: PhpUser }>('/auth/facebook', {
    method: 'POST',
    body: { accessToken },
  })
  cacheUser(d.user)
  return d.user
}
// Connexion par téléphone — étape 1 : demande d'un code par SMS.
// En mode test serveur (sms.debug), le code est renvoyé dans `debugCode`.
export async function phpPhoneStart(phone: string): Promise<{ delivered: boolean; debugCode?: string }> {
  return req('/auth/phone/start', { method: 'POST', body: { phone } })
}
// Connexion par téléphone — étape 2 : vérification du code + ouverture de session.
export async function phpPhoneVerify(phone: string, code: string, fullName?: string): Promise<PhpUser> {
  const d = await req<{ token: string; user: PhpUser }>('/auth/phone/verify', {
    method: 'POST',
    body: { phone, code, full_name: fullName ?? '' },
  })
  cacheUser(d.user)
  return d.user
}
export async function phpMe(): Promise<PhpUser | null> {
  // P3 · On tente toujours l'appel : la session peut être portée par le cookie
  // HttpOnly (aucun jeton en localStorage) OU par un jeton hérité en repli.
  try {
    const d = await req<{ user: PhpUser | null }>('/auth/me')
    if (d.user) {
      cacheUser(d.user)
      // Migration terminée : le serveur vient de (re)poser le cookie, on efface
      // l'éventuel jeton hérité du localStorage — il ne doit plus y traîner.
      localStorage.removeItem(TOKEN_KEY)
    } else {
      // Aucune session valide (cookie absent/expiré) : on nettoie le cache local.
      phpClearSession()
    }
    return d.user
  } catch (e) {
    // Session réellement invalide (401/403 : cookie expiré) → on nettoie et on
    // considère l'utilisateur déconnecté. Sinon l'UI resterait « connectée »
    // pendant que chaque action suivante échoue en 401 (état incohérent).
    const status = e instanceof ApiError ? e.status : 0
    if (status === 401 || status === 403) {
      phpClearSession()
      return null
    }
    // Vraie panne réseau (status 0) : on garde l'affichage optimiste depuis le cache.
    return phpGetStoredUser()
  }
}
export async function phpUpdatePassword(password: string, currentPassword?: string): Promise<void> {
  // Le serveur invalide les anciens jetons ET repose le cookie de la session
  // courante (P3) : rien à stocker côté navigateur. On efface au passage un
  // éventuel jeton hérité pour ne pas réutiliser un ancien jeton invalidé.
  await req('/auth/password', { method: 'POST', body: { password, currentPassword } })
  localStorage.removeItem(TOKEN_KEY)
}
export async function phpDeleteAccount(password: string): Promise<void> {
  await req('/auth/delete', { method: 'POST', body: { password } })
  phpClearSession()
}
export async function phpSignOut(): Promise<void> {
  // P3 · Le cookie de session est HttpOnly : seul le serveur peut l'effacer.
  try { await req('/auth/logout', { method: 'POST', body: {} }) } catch { /* best-effort */ }
  phpClearSession()
}

// ---- Annonces ---------------------------------------------------------------
export async function phpFetchListings(): Promise<Listing[]> {
  return req<Listing[]>('/listings')
}
export async function phpCreateListing(input: NewListingInput): Promise<Listing> {
  return req<Listing>('/listings', { method: 'POST', body: input })
}
export async function phpDeleteListing(id: string): Promise<void> {
  await req(`/listings/${id}`, { method: 'DELETE' })
}
export async function phpMyListings(): Promise<Listing[]> {
  return req<Listing[]>('/listings/mine')
}
/** Statistiques réelles du tableau de bord vendeur (vues, tendances, série). */
export interface SellerAnalytics {
  period: string
  views: { value: number; trend: number | null }
  activeListings: number
  demands: { value: number; trend: number | null }
  sales: { value: number; trend: number | null }
  series: { day: string; dow: number; n: number }[]
}
export interface SellerResponseTime {
  /** Nombre de réponses mesurées. 0 = pas assez de données pour dire quoi que ce soit. */
  count: number
  /** Médiane en secondes, ou null tant qu'on n'a pas au moins trois réponses. */
  medianSeconds: number | null
}
/** Temps de réponse habituel d'un vendeur (public, lu avant de le contacter). */
export async function phpSellerResponseTime(sellerId: string): Promise<SellerResponseTime> {
  return req(`/seller/response-time?seller_id=${encodeURIComponent(sellerId)}`)
}

export async function phpSellerAnalytics(period: string): Promise<SellerAnalytics> {
  return req<SellerAnalytics>(`/seller/analytics?period=${encodeURIComponent(period)}`)
}
export async function phpUpdateListing(id: string, input: NewListingInput): Promise<Listing> {
  return req<Listing>(`/listings/${id}`, { method: 'PUT', body: input })
}
export async function phpSetListingHidden(id: string, hidden: boolean): Promise<void> {
  await req(`/listings/${id}/visibility`, { method: 'POST', body: { hidden } })
}
export async function phpReportListing(listingId: string, reason: string, details: string): Promise<void> {
  await req('/reports', { method: 'POST', body: { listingId, reason, details } })
}
/** Comptabilise une vue d'annonce (best-effort, silencieux). */
export async function phpListingView(id: string): Promise<void> {
  try { await req(`/listings/${id}/view`, { method: 'POST', body: {} }) } catch { /* silencieux */ }
}

// ---- Favoris (côté serveur) -------------------------------------------------
export async function phpGetFavorites(): Promise<string[]> {
  try { return await req<string[]>('/favorites') } catch { return [] }
}
export async function phpAddFavorite(id: string): Promise<void> {
  try { await req(`/favorites/${id}`, { method: 'POST', body: {} }) } catch { /* silencieux */ }
}
export async function phpRemoveFavorite(id: string): Promise<void> {
  try { await req(`/favorites/${id}`, { method: 'DELETE' }) } catch { /* silencieux */ }
}

// ---- Notifications ----------------------------------------------------------
export interface PhpNotification {
  id: string; type: string; title: string; body: string; link: string; read: boolean; createdAt: number
}
export async function phpNotifications(): Promise<PhpNotification[]> {
  return req<PhpNotification[]>('/notifications')
}
export async function phpNotifCount(): Promise<number> {
  try { const d = await req<{ count: number }>('/notifications/count'); return d.count } catch { return 0 }
}
export async function phpNotifMarkRead(id?: string): Promise<void> {
  try { await req('/notifications/read', { method: 'POST', body: id ? { id } : {} }) } catch { /* silencieux */ }
}
/** Efface des notifications : `ids` pour une sélection, rien pour tout effacer. */
export async function phpNotifDelete(ids?: string[]): Promise<void> {
  try { await req('/notifications', { method: 'DELETE', body: ids && ids.length ? { ids } : {} }) } catch { /* silencieux */ }
}
export interface NotifPrefs {
  favorite: boolean
  message: boolean
  /** Repli par e-mail quand la personne n'est ni sur le site, ni joignable en push. */
  email: boolean
}
export async function phpNotifPrefs(): Promise<NotifPrefs> {
  try { return await req<NotifPrefs>('/notifications/prefs') }
  catch { return { favorite: true, message: true, email: true } }
}
export async function phpSaveNotifPrefs(p: NotifPrefs): Promise<void> {
  await req('/notifications/prefs', { method: 'PUT', body: p })
}

// ---- Notifications push ------------------------------------------------------
/** La clé publique VAPID du site — le navigateur en a besoin AVANT de s'abonner. */
export async function phpPushKey(): Promise<{ cle: string; actif: boolean }> {
  try { return await req<{ cle: string; actif: boolean }>('/push/key') }
  catch { return { cle: '', actif: false } }
}
export async function phpPushSubscribe(sub: PushSubscriptionJSON): Promise<void> {
  await req('/push/subscribe', { method: 'POST', body: sub as unknown as Record<string, unknown> })
}
export async function phpPushUnsubscribe(x: { endpoint?: string; id?: string }): Promise<void> {
  try { await req('/push/unsubscribe', { method: 'POST', body: x }) } catch { /* silencieux */ }
}
export interface PushAppareil {
  id: string; appareil: string; repere: string; depuis: number; dernier: number | null
}
export async function phpPushDevices(): Promise<PushAppareil[]> {
  try { return await req<PushAppareil[]>('/push/devices') } catch { return [] }
}
/** Envoie une notification d'essai à tous les appareils du compte. */
export async function phpPushTest(): Promise<{ appareils: number; envoyes: number }> {
  return req<{ appareils: number; envoyes: number }>('/push/test', { method: 'POST', body: {} })
}

// ---- Conversations & messages ----------------------------------------------
export async function phpGetOrCreateConversation(listingId: string | null, sellerId: string): Promise<string> {
  const d = await req<{ id: string }>('/conversations', {
    method: 'POST',
    body: { listingId, sellerId },
  })
  return d.id
}
export async function phpFetchConversations(): Promise<Conversation[]> {
  return req<Conversation[]>('/conversations')
}
export async function phpFetchMessages(conversationId: string): Promise<Message[]> {
  return req<Message[]>(`/conversations/${conversationId}/messages`)
}
/**
 * Envoie un message. Le serveur peut renvoyer, dans `auto`, la RÉPONSE
 * AUTOMATIQUE que le vendeur professionnel a fait partir dans la foulée :
 * l'acheteur la voit arriver tout de suite, sans attendre le prochain sondage.
 */
export async function phpSendMessage(
  conversationId: string, body: string,
): Promise<Message & { auto?: Message | null }> {
  return req(`/conversations/${conversationId}/messages`, { method: 'POST', body: { body } })
}
/** Supprime un de MES messages (pour tout le monde). */
export async function phpDeleteMessage(conversationId: string, messageId: string): Promise<void> {
  await req(`/conversations/${conversationId}/messages/${messageId}`, { method: 'DELETE' })
}
/** Supprime la conversation de MON côté (l'autre garde la sienne). */
export async function phpDeleteConversation(conversationId: string): Promise<void> {
  await req(`/conversations/${conversationId}`, { method: 'DELETE' })
}
/** Archive ou désarchive de MON côté. */
export async function phpArchiveConversation(conversationId: string, archived: boolean): Promise<void> {
  await req(`/conversations/${conversationId}/archive`, { method: 'POST', body: { archived } })
}
/** Bloque ou débloque l'autre participant ; renvoie l'état résultant. */
export async function phpBlockConversation(conversationId: string, block: boolean): Promise<boolean> {
  const d = await req<{ blocked: boolean }>(`/conversations/${conversationId}/block`, { method: 'POST', body: { block } })
  return !!d.blocked
}
/** Signale la conversation à la modération (motifs cochés + détail libre). */
export async function phpReportConversation(conversationId: string, reasons: string[], details: string): Promise<void> {
  await req(`/conversations/${conversationId}/report`, { method: 'POST', body: { reasons, details } })
}

/** « Temps réel » par polling : émet les nouveaux messages d'une conversation. */
export function phpPollMessages(conversationId: string, onInsert: (m: Message) => void): () => void {
  const seen = new Set<string>()
  let first = true
  let alive = true
  const tick = async () => {
    try {
      const msgs = await phpFetchMessages(conversationId)
      for (const m of msgs) {
        if (!seen.has(m.id)) {
          seen.add(m.id)
          if (!first) onInsert(m)
        }
      }
      first = false
    } catch {
      /* ignore */
    }
  }
  tick()
  const iv = setInterval(() => alive && tick(), 4000)
  return () => {
    alive = false
    clearInterval(iv)
  }
}

/** Polling global : déclenche onInsert quand un tiers a écrit (pour le badge). */
export function phpPollAll(onInsert: (m: Message) => void): () => void {
  let lastSig = ''
  let first = true
  let alive = true
  const tick = async () => {
    try {
      const convs = await phpFetchConversations()
      const uid = phpGetUid()
      const sig = convs
        .filter((c) => c.lastSenderId && c.lastSenderId !== uid)
        .map((c) => `${c.id}:${c.lastAt}`)
        .join('|')
      if (!first && sig !== lastSig) {
        onInsert({ id: 'poll', conversationId: '', senderId: 'other', body: '', createdAt: Date.now() })
      }
      lastSig = sig
      first = false
    } catch {
      /* ignore */
    }
  }
  tick()
  const iv = setInterval(() => alive && tick(), 8000)
  return () => {
    alive = false
    clearInterval(iv)
  }
}

// ---- Commandes --------------------------------------------------------------
export async function phpCreateOrder(
  sellerId: string,
  items: CartItem[],
  conversationId: string | null,
): Promise<string> {
  const d = await req<{ id: string }>('/orders', {
    method: 'POST',
    body: {
      sellerId,
      conversationId,
      items: items.map((it) => ({ listingId: it.listingId, title: it.title, price: it.price, image: it.image ?? null })),
    },
  })
  return d.id
}
export async function phpFetchOrders(role: 'buyer' | 'seller'): Promise<Order[]> {
  return req<Order[]>(`/orders?role=${role}`)
}
export async function phpUpdateOrderStatus(orderId: string, status: string): Promise<void> {
  await req(`/orders/${orderId}`, { method: 'PATCH', body: { status } })
}
export async function phpPurchasedListingIds(): Promise<Set<string>> {
  const ids = await req<string[]>('/purchased')
  return new Set(ids)
}

// ---- Avis -------------------------------------------------------------------
export async function phpFetchReviewsForSeller(sellerId: string): Promise<Review[]> {
  return req<Review[]>(`/reviews?seller_id=${encodeURIComponent(sellerId)}`)
}
export async function phpFetchReviewsForListing(listingId: string): Promise<Review[]> {
  return req<Review[]>(`/reviews?listing_id=${encodeURIComponent(listingId)}`)
}
export async function phpFetchReviewsForTarget(targetId: string): Promise<Review[]> {
  return req<Review[]>(`/reviews?target_id=${encodeURIComponent(targetId)}`)
}
export async function phpCreateReview(input: {
  listingId: string
  sellerId: string
  rating: number
  comment?: string
  targetId?: string
  kind?: 'seller' | 'buyer'
}): Promise<void> {
  await req('/reviews', {
    method: 'POST',
    body: {
      listingId: input.listingId, sellerId: input.sellerId,
      targetId: input.targetId ?? input.sellerId, kind: input.kind ?? 'seller',
      rating: input.rating, comment: input.comment ?? null,
    },
  })
}

// ---- Suivi de transaction (« deal » d'une conversation) --------------------
export interface DealState {
  role: 'buyer' | 'seller'
  listingId: string | null
  listingTitle: string | null
  sellerId: string
  buyerId: string
  otherId: string
  otherName: string
  order: { id: string; status: 'en_cours' | 'finalise' | 'annule'; sellerConfirmed: boolean } | null
  sold: boolean
  iReviewed: boolean
  myRating: number | null
}
export async function phpGetDeal(convId: string): Promise<DealState> {
  return req<DealState>(`/conversations/${convId}/deal`)
}
export async function phpDealAction(convId: string, action: 'bought' | 'received' | 'sold' | 'cancel'): Promise<void> {
  await req(`/conversations/${convId}/deal`, { method: 'POST', body: { action } })
}

// ---- Profils ----------------------------------------------------------------
export async function phpFetchProfile(id: string): Promise<PublicProfile | null> {
  return req<PublicProfile | null>(`/profile/${id}`)
}
export async function phpUpdateProfile(fields: ProfileFields): Promise<void> {
  await req('/profile', { method: 'PUT', body: fields })
}

// ---- Contact ----------------------------------------------------------------
export interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
  company?: string // pot de miel anti-robot : doit rester vide
}
export async function phpContact(payload: ContactPayload): Promise<void> {
  await req('/contact', { method: 'POST', body: payload })
}

// ---- Newsletter -------------------------------------------------------------
export async function phpSubscribeNewsletter(email: string): Promise<void> {
  await req('/newsletter', { method: 'POST', body: { email } })
}
export async function phpFetchNewsletter(): Promise<{ email: string; createdAt: number }[]> {
  const d = await req<{ subscribers: { email: string; createdAt: number }[] }>('/newsletter')
  return d.subscribers
}
export async function phpNewsletterStatus(): Promise<boolean> {
  try {
    const d = await req<{ subscribed: boolean }>('/newsletter/status')
    return !!d.subscribed
  } catch {
    return true // en cas de doute, ne pas importuner
  }
}

// ---- Espace professionnel ---------------------------------------------------
export async function phpProStatut<T>(): Promise<T> {
  return req<T>('/pro/statut')
}
export async function phpProDemande(d: {
  type: string; nom: string; numero: string; secteur: string; tel: string
}): Promise<void> {
  await req('/pro/demande', { method: 'POST', body: d })
}
/**
 * Le tableau de bord professionnel. Sans `userId`, c'est le sien ; avec, c'est
 * celui d'un autre — réservé aux administrateurs qui ont le droit
 * « utilisateurs », et rendu en lecture seule (le serveur renvoie `lecture`).
 */
export async function phpProTableau<T>(periode: 7 | 30 = 7, userId?: string): Promise<T> {
  const cible = userId ? `&userId=${encodeURIComponent(userId)}` : ''
  return req<T>(`/pro/tableau?periode=${periode}${cible}`)
}
/** Marquer une annonce vendue, ou la remettre en vente. */
export async function phpSetListingSold(id: string, sold: boolean): Promise<void> {
  await req(`/listings/${id}/vendue`, { method: 'POST', body: { sold } })
}

/** La vitrine du professionnel : bannière et logo (chaîne vide = retirer). */
export async function phpProVitrine(
  d: { banniere?: string; logo?: string },
): Promise<{ banniere: string; logo: string }> {
  return req('/pro/vitrine', { method: 'POST', body: d })
}

/** Un jour d'ouverture de la fiche professionnelle. */
export interface Horaire { ouvert: boolean; de: string; a: string }

/**
 * La fiche professionnelle : ce que les acheteurs voient sur la page vendeur.
 *
 * Le TYPE, le SECTEUR et le NUMÉRO n'y sont pas : ce sont les trois éléments
 * que l'équipe a vérifiés avant d'approuver le dossier, et seul un
 * administrateur peut les changer (voir phpAdminProFiche).
 */
export async function phpProFiche(d: {
  nom: string; tel: string; description: string; horaires?: Horaire[]
}): Promise<void> {
  await req('/pro/fiche', { method: 'POST', body: d })
}

/** Côté équipe : corriger le dossier vérifié d'un professionnel. */
export async function phpAdminProFiche(d: {
  userId: string; nom: string; type: string; secteur: string; numero: string; tel: string
}): Promise<{ change: number }> {
  return req('/admin/pro/fiche', { method: 'POST', body: d })
}

/** Qui a mis mon annonce en favori (professionnel approuvé, propriétaire seul). */
export interface QuiFavori { id: string; nom: string; avatar: string; commune: string; quand: number }
export async function phpQuiFavori(listingId: string): Promise<{ titre: string; gens: QuiFavori[] }> {
  return req(`/listings/${listingId}/favoris`)
}

/** La réponse automatique du professionnel : le texte, et s'il est activé. */
export interface ReponseAuto { texte: string; active: boolean }
export async function phpReponseAuto(): Promise<ReponseAuto> {
  return req<ReponseAuto>('/pro/reponse-auto')
}
export async function phpEnregistrerReponseAuto(d: ReponseAuto): Promise<ReponseAuto> {
  return req<ReponseAuto>('/pro/reponse-auto', { method: 'POST', body: d })
}

/** Le chemin de l'acheteur : vues → favoris → contacts → ventes, heures, communes. */
export interface ProEntonnoir {
  periode: number
  entonnoir: { vues: number; favoris: number; contacts: number; ventes: number }
  /** 24 cases, une par heure : combien de vues à cette heure-là. */
  heures: number[]
  communes: { nom: string; n: number; pct: number }[]
}
export async function phpProEntonnoir(periode: 7 | 30 = 7): Promise<ProEntonnoir> {
  return req<ProEntonnoir>(`/pro/entonnoir?periode=${periode}`)
}

/**
 * Ce que chacun accepte de recevoir. Le magasin est `profiles.notif_prefs` —
 * la MÊME colonne que consulte le serveur avant chaque notification. Le PUT
 * fusionne : envoyer une seule case n'efface pas les autres.
 */
export async function phpReglagesNotifs(): Promise<Record<string, boolean>> {
  try { return await req<Record<string, boolean>>('/notifications/prefs') }
  catch { return {} }
}
export async function phpEnregistrerReglagesNotifs(reglages: Record<string, boolean>): Promise<void> {
  await req('/notifications/prefs', { method: 'PUT', body: reglages })
}

/** L'état de sécurité du compte : appareils, connexions, mot de passe, 2FA. */
export interface Securite {
  twofa: boolean
  motDePasseLe: number | null
  appareils: { nom: string; depuis: number; vuLe: number | null }[]
  connexions: { quand: number; appareil: string; ip: string }[]
}
export async function phpSecurite(): Promise<Securite> {
  return req<Securite>('/securite')
}

/**
 * Montrer (ou retirer) ma position sur mes annonces DÉJÀ publiées. Éteindre
 * efface les coordonnées ; rallumer y remet celle du profil.
 */
export async function phpPositionAnnonces(montrer: boolean): Promise<{ annonces: number; sansPosition?: boolean }> {
  return req('/position/annonces', { method: 'POST', body: { montrer } })
}

/** MON profil complet (téléphone, commune, adresse) — pour les réglages. */
export interface MonProfil {
  fullName: string; firstName: string; lastName: string; gender: string
  birthDate: string; phone: string; bio: string; avatarUrl: string
  regionId: string; cityId: string; commune: string; address: string
  lat: number | null; lng: number | null; email: string
}
export async function phpMonProfil(): Promise<MonProfil> {
  return req<MonProfil>('/profile')
}

/** Mes favoris avec le prix retenu au moment de l'enregistrement. */
export interface FavoriDetail {
  listingId: string
  titre: string
  prix: number
  prixAlors: number | null
  image: string | null
  commune: string
  vendue: boolean
  retiree: boolean
  vendeurId: string
  createdAt: number
}
export async function phpFavorisDetail(): Promise<FavoriDetail[]> {
  return req<FavoriDetail[]>('/favorites/detail')
}

// ---- Administration ---------------------------------------------------------
export async function phpAdminStats<T>(): Promise<T> {
  return req<T>('/admin/stats')
}
export async function phpAdminUsers<T>(): Promise<T> {
  return req<T>('/admin/users')
}
export async function phpAdminListings<T>(): Promise<T> {
  return req<T>('/admin/listings')
}
export async function phpAdminPro<T>(): Promise<T> {
  return req<T>('/admin/pro')
}
export async function phpAdminProDecider(userId: string, action: 'approuver' | 'refuser', motif = ''): Promise<void> {
  await req('/admin/pro/decider', { method: 'POST', body: { userId, action, motif } })
}
export async function phpAdminDeleteListing(id: string, motif = ''): Promise<void> {
  await req(`/admin/listings/${id}`, { method: 'DELETE', body: { motif } })
}
export async function phpAdminUserDetail<T>(id: string): Promise<T> {
  return req<T>(`/admin/users/${id}`)
}
export async function phpAdminSetUserStatus(id: string, status: string): Promise<void> {
  await req(`/admin/users/${id}/status`, { method: 'POST', body: { status } })
}
export async function phpAdminDeleteUser(id: string): Promise<void> {
  await req(`/admin/users/${id}`, { method: 'DELETE' })
}
/**
 * Masquer / démasquer une annonce EN TANT QU'ADMINISTRATEUR.
 *
 * Ce n'est plus `/listings/{id}/visibility`, qui est la route du vendeur sur sa
 * propre annonce : celle-ci exige un motif au masquage et l'envoie au vendeur.
 * Une annonce qui disparaît sans un mot se republie à l'identique le lendemain.
 */
export async function phpAdminSetListingHidden(id: string, hidden: boolean, motif = ''): Promise<void> {
  await req(`/admin/listings/${id}/visibility`, { method: 'POST', body: { hidden, motif } })
}
export async function phpAdminReports<T>(): Promise<T> {
  return req<T>('/admin/reports')
}
/** Traiter un signalement : le classer, ou masquer / supprimer l'annonce avec lui. */
export async function phpAdminResolveReport(
  id: string,
  action: 'classer' | 'masquer' | 'supprimer' = 'classer',
  motif = '',
): Promise<void> {
  await req(`/admin/reports/${id}`, { method: 'POST', body: { action, motif } })
}

// ---- Messagerie de l'équipe -------------------------------------------------
// ---- Invitations au test fermé (Play Store) ---------------------------------
export async function phpInvitations<T>(): Promise<T> {
  return req<T>('/admin/invitations')
}
export async function phpSendInvitations<T>(body: {
  destinataires: string
  sujet: string
  message: string
  relancer?: boolean
  offset?: number
  limit?: number
}): Promise<T> {
  return req<T>('/admin/invitations', { method: 'POST', body })
}

export async function phpTeamThreads<T>(): Promise<T> {
  return req<T>('/team/threads')
}
export async function phpTeamOpenThread(
  sujet: string,
  body: string,
  kind: 'user' | 'staff' = 'user',
  destinataire = '',
): Promise<{ id: string }> {
  return req<{ id: string }>('/team/threads', { method: 'POST', body: { sujet, body, kind, destinataire } })
}
export async function phpTeamThread<T>(id: string): Promise<T> {
  return req<T>(`/team/threads/${id}/messages`)
}
export async function phpTeamReply<T>(id: string, body: string): Promise<T> {
  return req<T>(`/team/threads/${id}/messages`, { method: 'POST', body: { body } })
}
export async function phpTeamSetStatus(id: string, statut: 'open' | 'closed'): Promise<void> {
  await req(`/team/threads/${id}/statut`, { method: 'POST', body: { statut } })
}
export async function phpAdminOrders<T>(): Promise<T> {
  return req<T>('/admin/orders')
}
export async function phpAdminContactMessages<T>(): Promise<T> {
  return req<T>('/admin/contact-messages')
}
export async function phpAdminContactHandled(id: string, handled: boolean): Promise<void> {
  await req(`/admin/contact-messages/${id}`, { method: 'POST', body: { handled } })
}
export async function phpAdminContactDelete(id: string): Promise<void> {
  await req(`/admin/contact-messages/${id}`, { method: 'DELETE' })
}
export async function phpAdminContactSuggest(id: string): Promise<{ draft: string; drafts?: string[]; ai: boolean }> {
  return req(`/admin/contact-messages/${id}/suggest`, { method: 'POST', body: {} })
}
export async function phpAdminContactReply(id: string, body: string): Promise<void> {
  await req(`/admin/contact-messages/${id}/reply`, { method: 'POST', body: { body } })
}
// ---- Écran publicitaire ----
export async function phpAdTariff<T>(): Promise<T> {
  return req<T>('/ads/tarif')
}
export async function phpAdSubmit<T>(body: Record<string, unknown>): Promise<T> {
  return req<T>('/ads', { method: 'POST', body })
}
export async function phpAdsActive<T>(): Promise<T> {
  return req<T>('/ads/active')
}
/** Mesure d'audience : un affichage, puis un clic. Silencieux et sans blocage. */
export async function phpAdTrack(id: string, quoi: 'view' | 'click'): Promise<void> {
  try { await req(`/ads/${encodeURIComponent(id)}/${quoi}`, { method: 'POST', body: {} }) } catch { /* jamais bloquant */ }
}
/** Chiffres publics d'une publicité (son annonceur les consulte sur /pub/:id). */
export async function phpAdStats<T>(id: string): Promise<T> {
  return req<T>(`/ads/${encodeURIComponent(id)}/stats`)
}
/** Historique complet des publicités du compte connecté. */
export async function phpAdsMine<T>(): Promise<T> {
  return req<T>('/ads/mine')
}
export async function phpVerifyStatus<T>(): Promise<T> {
  return req<T>('/verify/status')
}
/** Envoi du code de vérification à l'adresse du compte. */
export async function phpVerifyEmailSend<T = { ok: boolean; already?: boolean }>(): Promise<T> {
  return req<T>('/verify/email/send', { method: 'POST', body: {} })
}
/** Confirmation du code à 6 chiffres. */
export async function phpVerifyEmailConfirm<T = { ok: boolean }>(code: string): Promise<T> {
  return req<T>('/verify/email/confirm', { method: 'POST', body: { code } })
}
export async function phpAdGet<T>(id: string): Promise<T> {
  return req<T>(`/ads/${id}`)
}
export async function phpAdminAds<T>(): Promise<T> {
  return req<T>('/admin/ads')
}
export async function phpAdminAdAction(id: string, action: 'approve' | 'reject', reason = ''): Promise<void> {
  await req(`/admin/ads/${id}/${action}`, { method: 'POST', body: { reason } })
}
export async function phpAdminAdDelete(id: string): Promise<void> {
  await req(`/admin/ads/${id}`, { method: 'DELETE' })
}
export async function phpAdminAdBroadcast<T>(body: Record<string, unknown>): Promise<T> {
  return req<T>('/admin/ads/broadcast', { method: 'POST', body })
}
export async function phpAdminSeo<T>(): Promise<T> {
  return req<T>('/admin/seo')
}
export async function phpAdminSeoToggle(enabled: boolean): Promise<void> {
  await req('/admin/seo', { method: 'POST', body: { enabled } })
}
export async function phpAdminSeoRun<T>(): Promise<T> {
  return req<T>('/admin/seo/run', { method: 'POST', body: {} })
}

export async function phpAdminConversations<T>(): Promise<T> {
  return req<T>('/admin/conversations')
}
export async function phpAdminReviews<T>(): Promise<T> {
  return req<T>('/admin/reviews')
}
export async function phpAdminDeleteReview(id: string): Promise<void> {
  await req(`/admin/reviews/${id}`, { method: 'DELETE' })
}
export async function phpAdminVisits<T>(range: string): Promise<T> {
  return req<T>(`/admin/visits?range=${encodeURIComponent(range)}`)
}
export async function phpAdminGeo<T>(range: string): Promise<T> {
  return req<T>(`/admin/geo?range=${encodeURIComponent(range)}`)
}
export async function phpAdminResponseTime<T>(): Promise<T> {
  return req<T>('/admin/response-time')
}
export async function phpAdminCheck(): Promise<boolean> {
  try {
    const d = await req<{ admin: boolean }>('/admin/check')
    return !!d.admin
  } catch {
    return false
  }
}
export interface AdminRole { admin: boolean; owner: boolean; permissions: string[] }
export async function phpAdminRole(): Promise<AdminRole> {
  try {
    const d = await req<{ admin?: boolean; owner?: boolean; permissions?: string[] }>('/admin/check')
    return { admin: !!d?.admin, owner: !!d?.owner, permissions: d?.permissions ?? [] }
  } catch {
    return { admin: false, owner: false, permissions: [] }
  }
}
export async function phpAdminModerators<T>(): Promise<T> {
  return req<T>('/admin/moderators')
}
export interface ModeratorSaveResult { emailed: boolean; already: boolean; code: string | null; permissions: string[] }
export async function phpSaveModerator(email: string, permissions: string[], code?: string): Promise<ModeratorSaveResult> {
  const d = await req<{ emailed?: boolean; already?: boolean; code?: string | null; permissions?: string[] }>('/admin/moderators', {
    method: 'POST', body: { email, permissions, code: code ?? '' },
  })
  return { emailed: !!d?.emailed, already: !!d?.already, code: d?.code ?? null, permissions: d?.permissions ?? [] }
}
export async function phpRemoveModerator(email: string): Promise<void> {
  await req('/admin/moderators', { method: 'DELETE', body: { email } })
}
export async function phpAdminTestEmail(): Promise<{ sent: boolean; to: string; via: string }> {
  return req('/admin/test-email', { method: 'POST', body: {} })
}
export async function phpCampaignCount(): Promise<number> {
  const d = await req<{ total: number }>('/admin/campaign/count')
  return d.total
}
export async function phpCampaignSend(subject: string, message: string, offset: number, limit: number): Promise<{ sent: number; processed: number; total: number; done: boolean }> {
  return req('/admin/campaign/send', { method: 'POST', body: { subject, message, offset, limit } })
}
export async function phpDigestInfo(): Promise<{
  cronKey: string
  site: string
  /** Dernier passage réussi par tâche (clé = suffixe de route : backup, cleanup…). */
  runs?: Record<string, { lastOkAt: string | null; runs: number }>
  /** Début du suivi : avant cette date, on ne sait rien, on n'accuse donc rien. */
  trackedSince?: string | null
  /** Une clé écrite dans config.php a été refusée et remplacée en silence par le
   *  secret aléatoire. Cause la plus probable d'un « Clé invalide » qui se répète. */
  cleIgnoree?: boolean
  /** Pourquoi elle a été refusée, en clair. Vide si elle a été acceptée. */
  cleMotif?: string
}> {
  return req('/admin/digest-info')
}

// ---- Serrure du tableau de bord admin (code d'accès serveur) ----------------
export async function phpAdminUnlockStatus(): Promise<boolean> {
  try { const d = await req<{ unlocked: boolean }>('/admin/unlock/status'); return !!d.unlocked } catch { return false }
}
export async function phpAdminUnlock(code: string): Promise<void> {
  const d = await req<{ token?: string; persistent?: boolean }>('/admin/unlock', { method: 'POST', body: { code } })
  if (d.token) {
    sessionStorage.removeItem(ADMIN_UNLOCK_KEY)
    localStorage.removeItem(ADMIN_UNLOCK_KEY)
    // Modérateur (persistant) → localStorage ; propriétaire → sessionStorage.
    ;(d.persistent ? localStorage : sessionStorage).setItem(ADMIN_UNLOCK_KEY, d.token)
  }
}
export async function phpAdminUnlockEmail(): Promise<{ sent: number }> {
  return req('/admin/unlock/email', { method: 'POST', body: {} })
}
export function phpAdminLock(): void {
  sessionStorage.removeItem(ADMIN_UNLOCK_KEY)
  localStorage.removeItem(ADMIN_UNLOCK_KEY)
}
export async function phpBlockModerator(email: string, blocked: boolean): Promise<void> {
  await req('/admin/moderators/block', { method: 'POST', body: { email, blocked } })
}
export async function phpDigestSend(type: 'daily' | 'weekly'): Promise<{ sent: number; listings: number; subscribers?: number; reason?: string }> {
  return req('/admin/digest-send', { method: 'POST', body: { type } })
}
export async function phpRecordInterest(categoryId: string, weight = 1, subcategory?: string): Promise<void> {
  try { await req('/interests', { method: 'POST', body: { categoryId, weight, subcategory } }) } catch { /* silencieux */ }
}
export async function phpSuggestionsTest(): Promise<{ sent: number; listings: number; personalized?: boolean; category?: string; titles?: string[] }> {
  return req('/admin/suggestions-test', { method: 'POST', body: {} })
}
export interface SmtpSettings { host: string; port: string; secure: string; user: string; configured?: boolean }
export async function phpGetSmtp(): Promise<SmtpSettings> {
  return req<SmtpSettings>('/admin/smtp')
}
export async function phpSaveSmtp(s: { host: string; port: string; secure: string; user: string; pass: string }): Promise<void> {
  await req('/admin/smtp', { method: 'POST', body: s })
}

// ---- Recherches sauvegardées (alertes email) -------------------------------
export interface SavedSearch { id: string; label: string; params: string; createdAt: number }
export async function phpSavedSearches(): Promise<SavedSearch[]> {
  return req<SavedSearch[]>('/searches')
}
export async function phpCreateSavedSearch(label: string, params: string): Promise<SavedSearch> {
  return req<SavedSearch>('/searches', { method: 'POST', body: { label, params } })
}
export async function phpDeleteSavedSearch(id: string): Promise<void> {
  await req(`/searches/${id}`, { method: 'DELETE' })
}

// ---- Réponses toutes prêtes (messagerie) -----------------------------------
export interface ReponsePrete { id: string; texte: string; createdAt: number }
export async function phpReponses(): Promise<ReponsePrete[]> {
  return req<ReponsePrete[]>('/reponses')
}
export async function phpAjouterReponse(texte: string): Promise<ReponsePrete> {
  return req<ReponsePrete>('/reponses', { method: 'POST', body: { texte } })
}
export async function phpSupprimerReponse(id: string): Promise<void> {
  await req(`/reponses/${id}`, { method: 'DELETE' })
}

// ---- Sauvegarde de la base (admin) -----------------------------------------
export interface BackupFile { file: string; bytes: number; at: number }
export async function phpAdminBackups(): Promise<{ cronKey: string; site: string; backups: BackupFile[] }> {
  return req('/admin/backups')
}
// ---- Jetons de service « modération auto » (propriétaire uniquement) --------
export interface ServiceToken {
  id: string; label: string; scope: string; prefix: string
  createdAt: number; lastUsedAt: number | null; uses: number; revoked: boolean
}
export async function phpModTokens(): Promise<{ site: string; tokens: ServiceToken[] }> {
  return req('/admin/service-tokens')
}
export async function phpModTokenCreate(label: string, rotate: boolean): Promise<{ token: string; scope: string; label: string }> {
  return req('/admin/service-tokens', { method: 'POST', body: { label, rotate } })
}
export async function phpModTokenRevoke(id: string): Promise<void> {
  await req(`/admin/service-tokens/${id}/revoke`, { method: 'POST', body: {} })
}
export interface ModAuditEntry {
  id: string; action: string; listingId: string | null; listingTitle: string | null
  reason: string; confidence: string; at: number
}
export async function phpModAudit(): Promise<{ entries: ModAuditEntry[] }> {
  return req('/admin/mod-audit')
}

export interface ResetResult { ok: boolean; deleted: Record<string, number>; backup: string | null; accounts: boolean }
export async function phpResetData(accounts: boolean): Promise<ResetResult> {
  return req<ResetResult>('/admin/reset', { method: 'POST', body: { confirm: 'EFFACER', accounts } })
}
/** Télécharge un export JSON de la base (génère un fichier téléchargé par le navigateur). */
export async function phpDownloadBackup(file?: string): Promise<void> {
  const token = phpGetToken()
  const url = file
    ? `${API}/admin/backup/download?file=${encodeURIComponent(file)}`
    : `${API}/admin/backup`
  // P3 · La session est portée par le cookie HttpOnly : sans `credentials`, la
  // requête part sans authentification → 401 (téléchargement de sauvegarde cassé).
  const res = await fetch(url, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`Erreur ${res.status}`)
  const blob = await res.blob()
  const name = file || `chapci-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

// ---- Recettes du site (propriétaire uniquement) ----
export async function phpAdminRevenues<T>(from = '', to = ''): Promise<T> {
  const q = new URLSearchParams()
  if (from) q.set('from', from)
  if (to) q.set('to', to)
  return req<T>(`/admin/revenues${q.toString() ? `?${q}` : ''}`)
}
export async function phpAdminRevenueAdd<T>(body: Record<string, unknown>): Promise<T> {
  return req<T>('/admin/revenues', { method: 'POST', body })
}
export async function phpAdminRevenueConfirm(id: string, confirmed: boolean): Promise<void> {
  await req(`/admin/revenues/${id}/confirm`, { method: 'POST', body: { confirmed } })
}
export async function phpAdminRevenueDelete(id: string): Promise<void> {
  await req(`/admin/revenues/${id}`, { method: 'DELETE' })
}

// -----------------------------------------------------------------------------
//  Comptabilité — réservée au propriétaire.
//
//  Le grand livre rassemble en un seul registre ce qui était éparpillé : les
//  publicités encaissées, les recettes relevées à la main, et les dépenses qui
//  n'existaient nulle part. Voir `admin/comptabilite` côté serveur.
// -----------------------------------------------------------------------------
export async function phpComptabilite<T>(exercice: number): Promise<T> {
  return req<T>(`/admin/comptabilite?exercice=${exercice}`)
}
export async function phpComptaAjout<T>(body: Record<string, unknown>): Promise<T> {
  return req<T>('/admin/comptabilite', { method: 'POST', body })
}
export async function phpComptaSupprimer(id: string): Promise<void> {
  await req(`/admin/comptabilite/${id}`, { method: 'DELETE' })
}
export async function phpComptaPointer(id: string, pointe: boolean): Promise<void> {
  await req(`/admin/comptabilite/${id}/pointer`, { method: 'POST', body: { pointe } })
}
export async function phpComptaCloturer<T>(exercice: number): Promise<T> {
  return req<T>('/admin/comptabilite/cloturer', { method: 'POST', body: { exercice } })
}

/**
 * Télécharge un registre ou l'état financier.
 *
 * Un simple lien `<a href>` ne conviendrait pas : les routes d'administration
 * exigent l'en-tête de déverrouillage `X-Admin-Unlock`, qu'un lien ne sait pas
 * porter. On récupère donc le fichier par requête, puis on le remet au
 * navigateur comme un téléchargement ordinaire.
 */
export async function phpComptaExport(exercice: number, quoi: 'recettes' | 'depenses' | 'smt'): Promise<void> {
  const headers: Record<string, string> = {}
  const token = phpGetToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const unlock = localStorage.getItem(ADMIN_UNLOCK_KEY) || sessionStorage.getItem(ADMIN_UNLOCK_KEY)
  if (unlock) headers['X-Admin-Unlock'] = unlock

  const res = await fetch(`${API}/admin/comptabilite/export?exercice=${exercice}&quoi=${quoi}`, {
    headers,
    credentials: 'include',
  })
  if (!res.ok) {
    let msg = `Erreur ${res.status}`
    try { msg = (await res.json())?.error ?? msg } catch { /* réponse non-JSON */ }
    throw new ApiError(msg, res.status)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  // L'état financier s'ouvre dans un onglet — on veut l'imprimer, pas
  // l'archiver tel quel. Les deux registres se téléchargent.
  if (quoi === 'smt') {
    a.target = '_blank'
    a.rel = 'noopener'
  } else {
    a.download = `chapci-${quoi}-${exercice}.csv`
  }
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Laisse au navigateur le temps d'ouvrir l'onglet avant de libérer l'objet.
  window.setTimeout(() => URL.revokeObjectURL(url), 20000)
}
