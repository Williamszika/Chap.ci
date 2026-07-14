// =============================================================================
//  Suivi de transaction (« deal ») lié à une conversation.
//  Puisque l'achat/la livraison se font hors application, on FAIT DÉCLARER la
//  transaction : l'acheteur confirme « j'ai acheté » puis « bien reçu », le
//  vendeur marque « vendu ». Ça débloque les avis (à double sens).
//  Disponible uniquement avec le backend auto-hébergé (PHP).
// =============================================================================
import { isPhp } from './backend'
import * as php from './php'
import type { DealState } from './php'

export type { DealState } from './php'
export type DealAction = 'bought' | 'received' | 'sold' | 'cancel'

/** Le suivi de transaction n'existe qu'avec le backend PHP. */
export const dealEnabled = isPhp

export async function getDeal(convId: string): Promise<DealState | null> {
  if (!isPhp) return null
  try {
    return await php.phpGetDeal(convId)
  } catch {
    return null
  }
}

export async function dealAction(convId: string, action: DealAction): Promise<void> {
  if (!isPhp) throw new Error('Le suivi de transaction nécessite le backend auto-hébergé.')
  return php.phpDealAction(convId, action)
}
