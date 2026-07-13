import { supabase } from './supabaseClient'
import { isPhp } from './backend'
import * as php from './php'
import type { CartItem, Order, OrderItem, OrderStatus } from '../types'

interface OrderRow {
  id: string
  buyer_id: string
  seller_id: string
  conversation_id: string | null
  status: string
  created_at: string
}
interface OrderItemRow {
  order_id: string
  listing_id: string | null
  title: string
  price: number
  image: string | null
}

/** Crée une commande (demande d'achat) pour un vendeur avec ses articles. */
export async function createOrder(
  buyerId: string,
  sellerId: string,
  items: CartItem[],
  conversationId: string | null,
): Promise<string> {
  if (isPhp) return php.phpCreateOrder(sellerId, items, conversationId)
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase
    .from('orders')
    .insert({ buyer_id: buyerId, seller_id: sellerId, conversation_id: conversationId })
    .select('id')
    .single()
  if (error) throw error
  const orderId = (data as { id: string }).id

  const rows = items.map((it) => ({
    order_id: orderId,
    listing_id: it.listingId,
    title: it.title,
    price: it.price,
    image: it.image ?? null,
  }))
  const { error: e2 } = await supabase.from('order_items').insert(rows)
  if (e2) throw e2
  return orderId
}

/** Liste les commandes de l'utilisateur, en tant qu'acheteur ou vendeur. */
export async function fetchOrders(userId: string, role: 'buyer' | 'seller'): Promise<Order[]> {
  if (isPhp) return php.phpFetchOrders(role)
  if (!supabase) return []
  const col = role === 'buyer' ? 'buyer_id' : 'seller_id'
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq(col, userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  const orders = (data as OrderRow[]) ?? []
  if (orders.length === 0) return []

  const ids = orders.map((o) => o.id)
  const otherIds = [...new Set(orders.map((o) => (role === 'buyer' ? o.seller_id : o.buyer_id)))]

  const [itemsRes, profRes] = await Promise.all([
    supabase.from('order_items').select('*').in('order_id', ids),
    supabase.from('profiles').select('id,full_name').in('id', otherIds),
  ])
  const itemsByOrder = new Map<string, OrderItem[]>()
  for (const r of (itemsRes.data ?? []) as OrderItemRow[]) {
    const arr = itemsByOrder.get(r.order_id) ?? []
    arr.push({ listingId: r.listing_id, title: r.title, price: Number(r.price), image: r.image ?? undefined })
    itemsByOrder.set(r.order_id, arr)
  }
  const names = new Map(
    (profRes.data ?? []).map((p) => [p.id, (p as { full_name: string | null }).full_name]),
  )

  return orders.map((o): Order => ({
    id: o.id,
    buyerId: o.buyer_id,
    sellerId: o.seller_id,
    conversationId: o.conversation_id,
    status: (o.status as OrderStatus) ?? 'en_cours',
    createdAt: new Date(o.created_at).getTime(),
    items: itemsByOrder.get(o.id) ?? [],
    otherName: names.get(role === 'buyer' ? o.seller_id : o.buyer_id) || 'Utilisateur',
  }))
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  if (isPhp) return php.phpUpdateOrderStatus(orderId, status)
  if (!supabase) throw new Error('Supabase non configuré')
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) throw error
}

/** Renvoie l'ensemble des listing_id que l'utilisateur a commandés (pour autoriser les avis). */
export async function fetchPurchasedListingIds(userId: string): Promise<Set<string>> {
  if (isPhp) return php.phpPurchasedListingIds()
  if (!supabase) return new Set()
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_items(listing_id)')
    .eq('buyer_id', userId)
  if (error) return new Set()
  const set = new Set<string>()
  for (const o of (data as { order_items: { listing_id: string | null }[] }[]) ?? []) {
    for (const it of o.order_items ?? []) if (it.listing_id) set.add(it.listing_id)
  }
  return set
}
