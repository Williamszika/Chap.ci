import { supabase } from './supabaseClient'
import type { Listing } from '../types'

// Ligne de la table `listings` côté Supabase (snake_case)
interface ListingRow {
  id: string
  user_id: string | null
  title: string
  description: string
  price: number
  negotiable: boolean
  category_id: string
  subcategory: string | null
  condition: string
  images: string[] | null
  region_id: string
  city_id: string | null
  commune: string | null
  lat: number | null
  lng: number | null
  seller_name: string
  seller_phone: string
  delivery: boolean
  featured: boolean
  created_at: string
  promo_price?: number | null
  promo_until?: string | null
}

function rowToListing(r: ListingRow): Listing {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    price: Number(r.price),
    negotiable: r.negotiable,
    currency: 'FCFA',
    categoryId: r.category_id,
    subcategory: r.subcategory ?? undefined,
    condition: r.condition === 'neuf' ? 'neuf' : 'occasion',
    images: r.images ?? [],
    regionId: r.region_id,
    cityId: r.city_id ?? '',
    commune: r.commune ?? undefined,
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
    sellerName: r.seller_name,
    sellerPhone: r.seller_phone,
    sellerId: r.user_id ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
    delivery: r.delivery,
    featured: r.featured,
    promoPrice: r.promo_price != null ? Number(r.promo_price) : undefined,
    promoUntil: r.promo_until ? new Date(r.promo_until).getTime() : undefined,
  }
}

/** Charge toutes les annonces partagées depuis Supabase. */
export async function fetchListings(): Promise<Listing[]> {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data as ListingRow[]).map(rowToListing)
}

/** Crée une annonce partagée dans Supabase et renvoie l'annonce créée. */
export async function createListing(
  input: Omit<Listing, 'id' | 'createdAt' | 'currency'>,
  userId: string | null,
): Promise<Listing> {
  if (!supabase) throw new Error('Supabase non configuré')
  const client = supabase

  const base: Record<string, unknown> = {
    user_id: userId,
    title: input.title,
    description: input.description,
    price: input.price,
    negotiable: input.negotiable,
    category_id: input.categoryId,
    subcategory: input.subcategory ?? null,
    condition: input.condition,
    images: input.images,
    region_id: input.regionId,
    city_id: input.cityId || null,
    commune: input.commune ?? null,
    seller_name: input.sellerName,
    seller_phone: input.sellerPhone,
    delivery: input.delivery,
    featured: false,
  }

  const withGeo = { ...base, lat: input.lat ?? null, lng: input.lng ?? null }
  const withPromo: Record<string, unknown> = { ...withGeo }
  if (input.promoPrice != null && input.promoUntil != null) {
    withPromo.promo_price = input.promoPrice
    withPromo.promo_until = new Date(input.promoUntil).toISOString()
  }

  // Insert avec toutes les colonnes optionnelles ; si certaines n'existent pas
  // encore (migrations non exécutées), on réessaie sans elles, par paliers.
  let res = await client.from('listings').insert(withPromo).select().single()
  if (res.error && /promo_|column/i.test(res.error.message)) {
    res = await client.from('listings').insert(withGeo).select().single()
  }
  if (res.error && /lat|lng|column/i.test(res.error.message)) {
    res = await client.from('listings').insert(base).select().single()
  }
  if (res.error) throw res.error
  return rowToListing(res.data as ListingRow)
}

/** Supprime une annonce (RLS : seulement le propriétaire). */
export async function deleteListingRemote(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré')
  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) throw error
}
