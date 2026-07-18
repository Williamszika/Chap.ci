import * as php from './php'
import type { CartItem, Order, OrderStatus } from '../types'

/** Crée une commande (demande d'achat) pour un vendeur avec ses articles. */
export async function createOrder(
  _buyerId: string,
  sellerId: string,
  items: CartItem[],
  conversationId: string | null,
): Promise<string> {
  return php.phpCreateOrder(sellerId, items, conversationId)
}

/** Liste les commandes de l'utilisateur, en tant qu'acheteur ou vendeur. */
export async function fetchOrders(_userId: string, role: 'buyer' | 'seller'): Promise<Order[]> {
  return php.phpFetchOrders(role)
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  return php.phpUpdateOrderStatus(orderId, status)
}

/** Renvoie l'ensemble des listing_id que l'utilisateur a commandés (pour autoriser les avis). */
export async function fetchPurchasedListingIds(_userId: string): Promise<Set<string>> {
  return php.phpPurchasedListingIds()
}
