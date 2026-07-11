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

export async function updateMyProfile(
  id: string,
  fields: { full_name?: string; bio?: string; phone?: string; avatar_url?: string },
): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré')
  const { error } = await supabase.from('profiles').update(fields).eq('id', id)
  if (error) throw error
}
