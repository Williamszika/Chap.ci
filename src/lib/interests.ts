// =============================================================================
//  Centres d'intérêt — l'« agent » observe le comportement (favoris, recherches,
//  catégories consultées) pour envoyer des suggestions personnalisées par email.
// =============================================================================
import { isPhp } from './backend'
import * as php from './php'

/**
 * Enregistre un signal d'intérêt pour une catégorie (best-effort, silencieux).
 * Ne fait rien si l'utilisateur n'est pas connecté ou hors mode auto-hébergé.
 */
export function recordInterest(categoryId?: string | null, weight = 1): void {
  if (!isPhp || !categoryId) return
  if (!php.phpGetToken()) return // seulement pour les utilisateurs connectés
  void php.phpRecordInterest(categoryId, weight)
}
