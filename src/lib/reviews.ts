import * as php from './php'
import type { Review } from '../types'

export async function fetchReviewsForSeller(sellerId: string): Promise<Review[]> {
  return php.phpFetchReviewsForSeller(sellerId)
}

export async function fetchReviewsForListing(listingId: string): Promise<Review[]> {
  return php.phpFetchReviewsForListing(listingId)
}

export async function createReview(input: {
  listingId: string
  sellerId: string
  reviewerId: string
  rating: number
  comment?: string
  /** Personne notée (par défaut le vendeur). Pour un avis vendeur→acheteur : l'acheteur. */
  targetId?: string
  kind?: 'seller' | 'buyer'
}): Promise<void> {
  return php.phpCreateReview({
    listingId: input.listingId,
    sellerId: input.sellerId,
    rating: input.rating,
    comment: input.comment,
    targetId: input.targetId ?? input.sellerId,
    kind: input.kind ?? 'seller',
  })
}

/** Tous les avis REÇUS par une personne (comme vendeur et comme acheteur). */
export async function fetchReviewsForTarget(targetId: string): Promise<Review[]> {
  return php.phpFetchReviewsForTarget(targetId)
}

/** Note moyenne + nombre d'avis. */
export function averageRating(reviews: Review[]): { avg: number; count: number } {
  if (reviews.length === 0) return { avg: 0, count: 0 }
  const sum = reviews.reduce((s, r) => s + r.rating, 0)
  return { avg: sum / reviews.length, count: reviews.length }
}
