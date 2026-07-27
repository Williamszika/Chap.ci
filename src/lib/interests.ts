// =============================================================================
//  Centres d'intérêt — l'« agent » observe le comportement (favoris, recherches,
//  catégories consultées) pour envoyer des suggestions personnalisées par email.
// =============================================================================
import { isPhp } from './backend'
import * as php from './php'

/**
 * Enregistre un signal d'intérêt pour une catégorie (best-effort, silencieux).
 * La sous-catégorie, si connue, affine les suggestions (« produits similaires »).
 * Ne fait rien si l'utilisateur n'est pas connecté ou hors mode auto-hébergé.
 */
export function recordInterest(
  categoryId?: string | null,
  weight = 1,
  subcategory?: string | null,
): void {
  if (!isPhp || !categoryId) return
  // « Suis-je connecté ? » se lit sur l'identifiant mis en cache, PAS sur le
  // jeton : depuis le passage aux sessions par cookie HttpOnly, ce jeton hérité
  // est effacé du localStorage dès la première visite (php.ts, phpMe). Le test
  // précédent renvoyait donc toujours faux, et AUCUN centre d'intérêt n'était
  // enregistré — laissant la table vide et la tâche « Suggestions
  // personnalisées » sans personne à qui écrire.
  if (!php.phpGetUid()) return // seulement pour les utilisateurs connectés
  void php.phpRecordInterest(categoryId, weight, subcategory ?? undefined)
}
