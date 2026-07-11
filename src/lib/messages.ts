import { supabase } from './supabaseClient'
import type { Conversation, Message, Listing } from '../types'

interface ConvRow {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  created_at: string
}
interface MsgRow {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

const msgRowToMessage = (r: MsgRow): Message => ({
  id: r.id,
  conversationId: r.conversation_id,
  senderId: r.sender_id,
  body: r.body,
  createdAt: new Date(r.created_at).getTime(),
})

/** Ouvre la conversation existante entre l'acheteur et le vendeur, ou la crée. */
export async function getOrCreateConversation(
  listing: Listing,
  buyerId: string,
): Promise<string> {
  if (!supabase) throw new Error('Supabase non configuré')
  if (!listing.sellerId) throw new Error('Cette annonce n’a pas de compte vendeur.')

  const { data: existing, error: e1 } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listing.id)
    .eq('buyer_id', buyerId)
    .maybeSingle()
  if (e1) throw e1
  if (existing) return (existing as { id: string }).id

  const { data, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listing.id, buyer_id: buyerId, seller_id: listing.sellerId })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

/** Liste les conversations de l'utilisateur, enrichies (annonce, interlocuteur, dernier message). */
export async function fetchConversations(userId: string): Promise<Conversation[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  const convs = (data as ConvRow[]) ?? []
  if (convs.length === 0) return []

  const listingIds = [...new Set(convs.map((c) => c.listing_id).filter(Boolean) as string[])]
  const otherIds = [
    ...new Set(convs.map((c) => (c.buyer_id === userId ? c.seller_id : c.buyer_id))),
  ]
  const convIds = convs.map((c) => c.id)

  const [listingsRes, profilesRes, msgsRes] = await Promise.all([
    listingIds.length
      ? supabase.from('listings').select('id,title,images').in('id', listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string; images: string[] }[] }),
    otherIds.length
      ? supabase.from('profiles').select('id,full_name').in('id', otherIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    supabase
      .from('messages')
      .select('conversation_id,body,created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: true }),
  ])

  const listingsMap = new Map(
    (listingsRes.data ?? []).map((l) => [l.id, l as { id: string; title: string; images: string[] }]),
  )
  const profilesMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, (p as { full_name: string | null }).full_name]),
  )
  const lastByConv = new Map<string, { body: string; created_at: string }>()
  for (const m of (msgsRes.data ?? []) as { conversation_id: string; body: string; created_at: string }[]) {
    lastByConv.set(m.conversation_id, { body: m.body, created_at: m.created_at })
  }

  return convs.map((c): Conversation => {
    const otherId = c.buyer_id === userId ? c.seller_id : c.buyer_id
    const listing = c.listing_id ? listingsMap.get(c.listing_id) : undefined
    const last = lastByConv.get(c.id)
    return {
      id: c.id,
      listingId: c.listing_id,
      buyerId: c.buyer_id,
      sellerId: c.seller_id,
      createdAt: new Date(c.created_at).getTime(),
      listingTitle: listing?.title,
      listingImage: listing?.images?.[0],
      otherName: profilesMap.get(otherId) || 'Utilisateur',
      lastMessage: last?.body,
      lastAt: last ? new Date(last.created_at).getTime() : new Date(c.created_at).getTime(),
    }
  })
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as MsgRow[]).map(msgRowToMessage)
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<Message> {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select()
    .single()
  if (error) throw error
  return msgRowToMessage(data as MsgRow)
}

/** Abonnement temps réel aux nouveaux messages d'une conversation. */
export function subscribeMessages(
  conversationId: string,
  onInsert: (m: Message) => void,
): () => void {
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(msgRowToMessage(payload.new as MsgRow)),
    )
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}

/** Récupère une conversation seule (pour la page de discussion). */
export async function fetchConversation(id: string, userId: string): Promise<Conversation | null> {
  const all = await fetchConversations(userId)
  return all.find((c) => c.id === id) ?? null
}
