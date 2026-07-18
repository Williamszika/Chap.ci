import * as php from './php'
import type { Conversation, Message, Listing } from '../types'

/** Ouvre la conversation existante entre l'acheteur et le vendeur, ou la crée. */
export async function getOrCreateConversation(
  listing: Listing,
  _buyerId: string,
): Promise<string> {
  if (!listing.sellerId) throw new Error('Cette annonce n’a pas de compte vendeur.')
  return php.phpGetOrCreateConversation(listing.id, listing.sellerId)
}

/** Ouvre/crée une conversation à partir des identifiants bruts (pour le panier). */
export async function getOrCreateConversationRaw(
  listingId: string,
  sellerId: string,
  _buyerId: string,
): Promise<string> {
  return php.phpGetOrCreateConversation(listingId, sellerId)
}

/** Liste les conversations de l'utilisateur, enrichies (annonce, interlocuteur, dernier message). */
export async function fetchConversations(_userId: string): Promise<Conversation[]> {
  return php.phpFetchConversations()
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  return php.phpFetchMessages(conversationId)
}

export async function sendMessage(
  conversationId: string,
  _senderId: string,
  body: string,
): Promise<Message> {
  return php.phpSendMessage(conversationId, body)
}

/** Abonnement (par sondage) aux nouveaux messages d'une conversation. */
export function subscribeMessages(
  conversationId: string,
  onInsert: (m: Message) => void,
): () => void {
  return php.phpPollMessages(conversationId, onInsert)
}

/** Abonnement (par sondage) à TOUS les nouveaux messages de l'utilisateur (badge « non lus »). */
export function subscribeAllMessages(onInsert: (m: Message) => void): () => void {
  return php.phpPollAll(onInsert)
}

/** Récupère une conversation seule (pour la page de discussion). */
export async function fetchConversation(id: string, userId: string): Promise<Conversation | null> {
  const all = await fetchConversations(userId)
  return all.find((c) => c.id === id) ?? null
}
