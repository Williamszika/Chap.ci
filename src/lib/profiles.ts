import { supabase } from './supabaseClient'

export interface PublicProfile {
  id: string
  fullName: string
  bio?: string
  avatarUrl?: string
}

export async function fetchProfile(id: string): Promise<PublicProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, bio, avatar_url')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  const p = data as { id: string; full_name: string | null; bio: string | null; avatar_url: string | null }
  return {
    id: p.id,
    fullName: p.full_name || 'Vendeur',
    bio: p.bio ?? undefined,
    avatarUrl: p.avatar_url ?? undefined,
  }
}

export interface ProfileFields {
  full_name?: string
  bio?: string
  phone?: string
  avatar_url?: string
  first_name?: string
  last_name?: string
  gender?: string
  birth_date?: string | null
  region_id?: string
  city_id?: string
  commune?: string
  address?: string
  lat?: number | null
  lng?: number | null
}

export async function updateMyProfile(id: string, fields: ProfileFields): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré')
  const { error } = await supabase.from('profiles').update(fields).eq('id', id)
  if (error) throw error
}

/** Insère/met à jour le profil (upsert) — utile juste après l'inscription. */
export async function upsertMyProfile(id: string, fields: ProfileFields): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré')
  const { error } = await supabase.from('profiles').upsert({ id, ...fields })
  if (error) throw error
}
