import type { Listing } from '../types'

export interface ActivePromo {
  /** Prix réduit courant */
  price: number
  /** Prix normal (barré) */
  original: number
  /** Pourcentage de réduction arrondi */
  percent: number
  /** Fin de la promotion (timestamp ms) */
  until: number
}

/**
 * Renvoie la promotion active d'une annonce, ou null.
 * Une promo est active si un prix réduit valable est défini et non expiré.
 */
export function activePromo(l: Listing): ActivePromo | null {
  if (
    l.promoPrice == null ||
    l.promoUntil == null ||
    l.promoPrice <= 0 ||
    l.promoPrice >= l.price ||
    l.promoUntil <= Date.now()
  ) {
    return null
  }
  return {
    price: l.promoPrice,
    original: l.price,
    percent: Math.round((1 - l.promoPrice / l.price) * 100),
    until: l.promoUntil,
  }
}

/** Prix effectivement demandé (promo si active, sinon prix normal). */
export function effectivePrice(l: Listing): number {
  return activePromo(l)?.price ?? l.price
}

/** Date de fin de promo lisible : « jusqu'au 18 juil. ». */
export function promoEndLabel(until: number): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(until))
  } catch {
    return ''
  }
}
