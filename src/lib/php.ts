// =============================================================================
//  Client du backend PHP/MySQL auto-hébergé (server/) — activé si VITE_BACKEND=php
//  Reproduit les mêmes signatures que les libs Supabase pour un remplacement
//  transparent (annonces, messagerie, commandes, avis, profils, comptes).
// =============================================================================
import type { Conversation, Listing, Message, Order, Review } from '../types'
import type { NewListingInput } from '../store/AppContext'
import type { ProfileFields, PublicProfile } from './profiles'
import type { CartItem } from '../types'

const API = ((import.meta.env.VITE_API_URL as string) || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'chapci.php.token'
const UID_KEY = 'chapci.php.uid'
const USER_KEY = 'chapci.php.user'

export interface PhpUser {
  id: string
  email: string
  user_metadata?: { full_name?: string | null }
}

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
function setSession(token: string, user: PhpUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(UID_KEY, user.id)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export function phpClearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(UID_KEY)
  localStorage.removeItem(USER_KEY)
}

async function req<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = phpGetToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(API + path, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error((data && data.error) || `Erreur ${res.status}`)
    // Refus de modération : on transmet les raisons détaillées à l'appelant.
    if (data && data.moderation && Array.isArray(data.reasons)) {
      ;(err as Error & { moderation?: unknown }).moderation = data.reasons
    }
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
  setSession(d.token, d.user)
  return d.user
}
export async function phpLogin(email: string, password: string): Promise<PhpUser> {
  const d = await req<{ token: string; user: PhpUser }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  setSession(d.token, d.user)
  return d.user
}
// Connexion / inscription via Google : on transmet le « credential » (jeton
// d'identité) fourni par Google Identity Services ; le serveur le vérifie.
export async function phpGoogleLogin(credential: string): Promise<PhpUser> {
  const d = await req<{ token: string; user: PhpUser }>('/auth/google', {
    method: 'POST',
    body: { credential },
  })
  setSession(d.token, d.user)
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
  setSession(d.token, d.user)
  return d.user
}
export async function phpMe(): Promise<PhpUser | null> {
  if (!phpGetToken()) return null
  try {
    const d = await req<{ user: PhpUser | null }>('/auth/me')
    if (d.user) localStorage.setItem(USER_KEY, JSON.stringify(d.user))
    return d.user
  } catch {
    return phpGetStoredUser()
  }
}
export async function phpUpdatePassword(password: string): Promise<void> {
  await req('/auth/password', { method: 'POST', body: { password } })
}
export async function phpDeleteAccount(password: string): Promise<void> {
  await req('/auth/delete', { method: 'POST', body: { password } })
  phpClearSession()
}
export function phpSignOut(): void {
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
export interface NotifPrefs { favorite: boolean; message: boolean }
export async function phpNotifPrefs(): Promise<NotifPrefs> {
  try { return await req<NotifPrefs>('/notifications/prefs') } catch { return { favorite: true, message: true } }
}
export async function phpSaveNotifPrefs(p: NotifPrefs): Promise<void> {
  await req('/notifications/prefs', { method: 'PUT', body: p })
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
export async function phpSendMessage(conversationId: string, body: string): Promise<Message> {
  return req<Message>(`/conversations/${conversationId}/messages`, { method: 'POST', body: { body } })
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
export async function phpAdminDeleteListing(id: string): Promise<void> {
  await req(`/admin/listings/${id}`, { method: 'DELETE' })
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
export async function phpAdminSetListingHidden(id: string, hidden: boolean): Promise<void> {
  await req(`/listings/${id}/visibility`, { method: 'POST', body: { hidden } })
}
export async function phpAdminReports<T>(): Promise<T> {
  return req<T>('/admin/reports')
}
export async function phpAdminResolveReport(id: string): Promise<void> {
  await req(`/admin/reports/${id}`, { method: 'POST', body: {} })
}
export async function phpAdminOrders<T>(): Promise<T> {
  return req<T>('/admin/orders')
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
export async function phpAdminModerators<T>(): Promise<T> {
  return req<T>('/admin/moderators')
}
export async function phpAddModerator(email: string): Promise<{ emailed: boolean; already: boolean }> {
  const d = await req<{ emailed?: boolean; already?: boolean }>('/admin/moderators', { method: 'POST', body: { email } })
  return { emailed: !!d?.emailed, already: !!d?.already }
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
export async function phpDigestInfo(): Promise<{ cronKey: string; site: string }> {
  return req('/admin/digest-info')
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

// ---- Sauvegarde de la base (admin) -----------------------------------------
export interface BackupFile { file: string; bytes: number; at: number }
export async function phpAdminBackups(): Promise<{ cronKey: string; site: string; backups: BackupFile[] }> {
  return req('/admin/backups')
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
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
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
