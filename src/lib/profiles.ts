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
    /** Ce que fait l'entreprise — écrit dans sa fiche, montré aux acheteurs. */
    description?: string | null
    /** Les sept jours d'ouverture, de dimanche à samedi. */
    horaires?: { ouvert: boolean; de: string; a: string }[] | null
    /**
     * Vrai si le numéro officiel a été contrôlé au registre par l'équipe.
     * Le NUMÉRO lui-même ne sort pas du serveur (décision du Patron, 28/08) :
     * la page dit « Registre vérifié », elle ne publie pas l'immatriculation.
     */
    registreVerifie?: boolean
    /** Ventes conclues — celles que l'acheteur a confirmées reçues. */
    ventes?: number
    /** Date d'approbation du dossier, en millisecondes. */
    depuis?: number | null
    /**
     * Les réseaux sociaux et le site (05/09/2026) : {facebook: url, …},
     * adresses déjà vérifiées et normalisées par le serveur. Objet vide si
     * le professionnel n'en a renseigné aucun.
     */
    reseaux?: Record<string, string> | null
  } | null
}

export async function fetchProfile(id: string): Promise<PublicProfile | null> {
  return php.phpFetchProfile(id)
}

/** MON profil, avec ce que la fiche publique ne rend pas (téléphone, adresse). */
export async function fetchMyProfile(): Promise<php.MonProfil> {
  return php.phpMonProfil()
}
export type { MonProfil } from './php'

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
