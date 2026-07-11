import { createOrder } from './orders'
import { getOrCreateConversationRaw, sendMessage } from './messages'
import { formatPrice } from './format'
import type { CartItem } from '../types'

export interface SellerGroup {
  sellerId: string
  sellerName: string
  items: CartItem[]
  total: number
}

/**
 * Passe une commande auprès d'UN vendeur : crée la conversation, la commande,
 * et envoie au vendeur un message listant les articles souhaités.
 * Renvoie l'id de la conversation.
 */
export async function placeOrderForSeller(buyerId: string, group: SellerGroup): Promise<string> {
  const first = group.items[0]
  const convId = await getOrCreateConversationRaw(first.listingId, group.sellerId, buyerId)
  await createOrder(buyerId, group.sellerId, group.items, convId)

  const lines = group.items.map((i) => `• ${i.title} — ${formatPrice(i.price)} FCFA`).join('\n')
  const plural = group.items.length > 1
  const body =
    `🛒 Demande d'achat\n${lines}\n` +
    `Total : ${formatPrice(group.total)} FCFA\n\n` +
    `Bonjour, je souhaite acheter ${plural ? 'ces articles' : 'cet article'}. ` +
    `${plural ? 'Sont-ils' : 'Est-il'} toujours disponible${plural ? 's' : ''} ?`
  await sendMessage(convId, buyerId, body)
  return convId
}

/** Passe les commandes pour plusieurs vendeurs. Renvoie le nombre de vendeurs contactés. */
export async function placeOrders(buyerId: string, groups: SellerGroup[]): Promise<number> {
  let ok = 0
  for (const g of groups) {
    try {
      await placeOrderForSeller(buyerId, g)
      ok++
    } catch (e) {
      console.error('Commande échouée pour le vendeur', g.sellerId, e)
    }
  }
  return ok
}
