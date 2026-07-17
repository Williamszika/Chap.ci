// =============================================================================
//  Newsletter — inscription publique + export réservé à l'administrateur.
//  Fonctionne avec le backend PHP (auto-hébergé) ou Supabase.
// =============================================================================
import { supabase } from './supabaseClient'
import { isPhp } from './backend'
import * as php from './php'

export interface Subscriber {
  email: string
  createdAt: number
}

/** Emails administrateurs pour l'affichage du lien d'export (repli Supabase
 *  uniquement). Aucune adresse nominative n'est écrite en dur dans le code
 *  livré au navigateur (P23) : à définir via VITE_ADMIN_EMAILS au build si
 *  besoin. Sur le backend PHP, les droits admin sont vérifiés côté serveur
 *  (/admin/check), donc ce repli n'est pas utilisé. */
const ADMIN_EMAILS = ((import.meta.env.VITE_ADMIN_EMAILS as string) || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

/** Inscrit une adresse à la newsletter (idempotent). */
export async function subscribeNewsletter(email: string): Promise<void> {
  const clean = email.trim().toLowerCase()
  if (isPhp) return php.phpSubscribeNewsletter(clean)
  if (!supabase) throw new Error('Newsletter indisponible (backend non configuré).')
  const { error } = await supabase.from('newsletter').upsert({ email: clean }, { onConflict: 'email' })
  if (error) throw error
}

/** L'utilisateur connecté est-il déjà abonné ? (pour ne pas afficher le popup en double) */
export async function isSubscribed(): Promise<boolean> {
  if (isPhp) return php.phpNewsletterStatus()
  return true // hors PHP : on n'affiche pas le popup
}

/** Liste des abonnés (administrateur uniquement — le serveur vérifie les droits). */
export async function fetchNewsletter(): Promise<Subscriber[]> {
  if (isPhp) return php.phpFetchNewsletter()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('newsletter')
    .select('email, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    email: (r as { email: string }).email,
    createdAt: new Date((r as { created_at: string }).created_at).getTime(),
  }))
}
