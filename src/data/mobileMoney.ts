// Métadonnées des opérateurs Mobile Money de Côte d'Ivoire (codes USSD, couleurs).
// Utilisé pour le paiement entre acheteur et vendeur et la page de don.

export interface MMOperator {
  id: 'orange' | 'mtn' | 'moov' | 'wave'
  name: string
  emoji: string
  color: string
  ussd: string
}

export const mobileMoneyOperators: MMOperator[] = [
  { id: 'orange', name: 'Orange Money', emoji: '🟠', color: '#FF7900', ussd: '#144#' },
  { id: 'mtn', name: 'MTN MoMo', emoji: '🟡', color: '#FFCC08', ussd: '*133#' },
  { id: 'moov', name: 'Moov Money', emoji: '🔵', color: '#004B9B', ussd: '*155#' },
  { id: 'wave', name: 'Wave', emoji: '🌊', color: '#1DC3EC', ussd: '*555#' },
]

/** Encode un code USSD pour un lien tel: (# -> %23, * -> %2A) */
export function ussdLink(code: string): string {
  return 'tel:' + code.replace(/#/g, '%23').replace(/\*/g, '%2A')
}
