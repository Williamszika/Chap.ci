// =============================================================================
//  Newsletter — inscription publique + export réservé à l'administrateur.
//  Backend PHP auto-hébergé (TPE Cloud). Les droits admin sont vérifiés côté
//  serveur (/admin/*).
// =============================================================================
import * as php from './php'

export interface Subscriber {
  email: string
  createdAt: number
}

/** Emails administrateurs (repli d'affichage éventuel). Aucune adresse nominative
 *  n'est écrite en dur dans le code livré au navigateur (P23) : à définir via
 *  VITE_ADMIN_EMAILS au build si besoin. Les droits réels sont vérifiés côté serveur. */
const ADMIN_EMAILS = ((import.meta.env.VITE_ADMIN_EMAILS as string) || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

/** Inscrit une adresse à la newsletter (idempotent). */
export async function subscribeNewsletter(email: string): Promise<void> {
  return php.phpSubscribeNewsletter(email.trim().toLowerCase())
}

/** L'utilisateur connecté est-il déjà abonné ? (pour ne pas afficher le popup en double) */
export async function isSubscribed(): Promise<boolean> {
  return php.phpNewsletterStatus()
}

/** Liste des abonnés (administrateur uniquement — le serveur vérifie les droits). */
export async function fetchNewsletter(): Promise<Subscriber[]> {
  return php.phpFetchNewsletter()
}
