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
  if (!res.ok) throw new Error((data && data.error) || `Erreur ${res.status}`)
  return data as T
}

// ---- Auth -------------------------------------------------------------------
export async function phpSignup(email: string, password: string, fullName: string): Promise<PhpUser> {
  const d = await req<{ token: string; user: PhpUser }>('/auth/signup', {
    method: 'POST',
    body: { email, password, full_name: fullName },
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
export async function phpDeleteAccount(): Promise<void> {
  await req('/auth/delete', { method: 'POST', body: {} })
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
export async function phpCreateReview(input: {
  listingId: string
  sellerId: string
  rating: number
  comment?: string
}): Promise<void> {
  await req('/reviews', {
    method: 'POST',
    body: { listingId: input.listingId, sellerId: input.sellerId, rating: input.rating, comment: input.comment ?? null },
  })
}

// ---- Profils ----------------------------------------------------------------
export async function phpFetchProfile(id: string): Promise<PublicProfile | null> {
  return req<PublicProfile | null>(`/profile/${id}`)
}
export async function phpUpdateProfile(fields: ProfileFields): Promise<void> {
  await req('/profile', { method: 'PUT', body: fields })
}
