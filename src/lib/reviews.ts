import { supabase } from './supabaseClient'
import type { Review } from '../types'

interface ReviewRow {
  id: string
  listing_id: string | null
  seller_id: string
  reviewer_id: string
  rating: number
  comment: string | null
  created_at: string
}

async function enrich(rows: ReviewRow[]): Promise<Review[]> {
  if (!supabase || rows.length === 0) return []
  const ids = [...new Set(rows.map((r) => r.reviewer_id))]
  const { data } = await supabase.from('profiles').select('id,full_name').in('id', ids)
  const names = new Map((data ?? []).map((p) => [p.id, (p as { full_name: string | null }).full_name]))
  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    sellerId: r.seller_id,
    reviewerId: r.reviewer_id,
    rating: r.rating,
    comment: r.comment ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
    reviewerName: names.get(r.reviewer_id) || 'Utilisateur',
  }))
}

export async function fetchReviewsForSeller(sellerId: string): Promise<Review[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return enrich((data as ReviewRow[]) ?? [])
}

export async function fetchReviewsForListing(listingId: string): Promise<Review[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return enrich((data as ReviewRow[]) ?? [])
}

export async function createReview(input: {
  listingId: string
  sellerId: string
  reviewerId: string
  rating: number
  comment?: string
}): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré')
  const { error } = await supabase.from('reviews').insert({
    listing_id: input.listingId,
    seller_id: input.sellerId,
    reviewer_id: input.reviewerId,
    rating: input.rating,
    comment: input.comment ?? null,
  })
  if (error) throw error
}

/** Note moyenne + nombre d'avis. */
export function averageRating(reviews: Review[]): { avg: number; count: number } {
  if (reviews.length === 0) return { avg: 0, count: 0 }
  const sum = reviews.reduce((s, r) => s + r.rating, 0)
  return { avg: sum / reviews.length, count: reviews.length }
}
