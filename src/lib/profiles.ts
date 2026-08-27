import * as php from './php'

export interface PublicProfile {
  id: string
  fullName: string
  bio?: string
  avatarUrl?: string
  /** Badge bleu de vérification (membre fidèle et actif). */
  verified?: boolean
  /** '' = aucun · 'anciennete' = vert (6 mois) · 'admin' = bleu (équipe). */
  badge?: 'admin' | 'anciennete' | ''
  /** La vitrine d'un compte professionnel approuvé (sinon absente). */
  pro?: {
    nom?: string | null
    type?: string | null
    secteur?: string | null
    banniere?: string | null
    logo?: string | null
  } | null
}

export async function fetchProfile(id: string): Promise<PublicProfile | null> {
  return php.phpFetchProfile(id)
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

export async function updateMyProfile(_id: string, fields: ProfileFields): Promise<void> {
  return php.phpUpdateProfile(fields)
}

/** Insère/met à jour le profil (upsert) — utile juste après l'inscription. */
export async function upsertMyProfile(_id: string, fields: ProfileFields): Promise<void> {
  return php.phpUpdateProfile(fields)
}
