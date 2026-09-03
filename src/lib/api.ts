import * as php from './php'
import type { Listing } from '../types'
import type { NewListingInput } from '../store/AppContext'

// Le site est 100 % auto-hébergé sur la base TPE Cloud (backend PHP `server/`) :
// toutes ces fonctions délèguent au client PHP.

/** Charge toutes les annonces partagées depuis le backend. */
export async function fetchListings(): Promise<Listing[]> {
  return php.phpFetchListings()
}

/** Crée une annonce partagée et renvoie l'annonce créée. */
export async function createListing(
  // `NewListingInput` et non `Omit<Listing, …>` : l'entrée porte en plus la
  // déclaration `photosAnalysees`, qui part bien au serveur. Typée trop
  // étroitement ici, un lecteur croirait qu'elle est perdue en route.
  input: NewListingInput,
  _userId: string | null,
): Promise<Listing> {
  return php.phpCreateListing(input)
}

/** Supprime une annonce (seul le propriétaire y est autorisé côté serveur). */
export async function deleteListingRemote(id: string): Promise<void> {
  return php.phpDeleteListing(id)
}

/** Mes annonces (y compris masquées). */
export async function fetchMyListings(): Promise<Listing[]> {
  return php.phpMyListings()
}

/** Statistiques réelles du tableau de bord vendeur (vues, tendances, série). */
export async function fetchSellerAnalytics(period: string) {
  return php.phpSellerAnalytics(period)
}
export type { SellerAnalytics } from './php'

/**
 * Temps de réponse habituel d'un vendeur. Ne lève jamais : ce chiffre est un
 * bonus, une fiche annonce ne doit pas se casser parce qu'il manque.
 */
export async function fetchSellerResponseTime(sellerId: string) {
  try { return await php.phpSellerResponseTime(sellerId) }
  catch { return { count: 0, medianSeconds: null } }
}
export type { SellerResponseTime } from './php'

/**
 * « Ça vaut combien ? » — la fourchette du marché. `null` si le serveur ne
 * répond pas : un blanc, jamais une fausse fourchette.
 */
export async function fetchPrixMarche(q: {
  categoryId: string; subcategory: string; condition?: string; marque?: string; sauf?: string
}): Promise<php.PrixMarche | null> {
  try { return await php.phpPrixMarche(q) }
  catch { return null }
}
export type { PrixMarche } from './php'

/** Modifier une annonce. */
export async function updateListingRemote(id: string, input: Omit<Listing, 'id' | 'createdAt' | 'currency'>): Promise<Listing> {
  return php.phpUpdateListing(id, input)
}

/** Masquer / réafficher une annonce. */
export async function setListingHidden(id: string, hidden: boolean): Promise<void> {
  return php.phpSetListingHidden(id, hidden)
}

/** Marquer vendue / remettre en vente (depuis « Mes annonces »). */
export async function setListingSold(id: string, sold: boolean): Promise<void> {
  return php.phpSetListingSold(id, sold)
}

/** Signaler une annonce. */
export async function reportListing(listingId: string, reason: string, details: string): Promise<void> {
  return php.phpReportListing(listingId, reason, details)
}

// ---- Recherches sauvegardées (alertes email) -------------------------------
export type { SavedSearch } from './php'
export const savedSearchesEnabled = true
export async function fetchSavedSearches(): Promise<php.SavedSearch[]> {
  return php.phpSavedSearches()
}
export async function createSavedSearch(label: string, params: string): Promise<php.SavedSearch> {
  return php.phpCreateSavedSearch(label, params)
}
export async function deleteSavedSearch(id: string): Promise<void> {
  return php.phpDeleteSavedSearch(id)
}

// ---- Réponses toutes prêtes (messagerie) -----------------------------------
export type { ReponsePrete } from './php'
export async function fetchReponses(): Promise<php.ReponsePrete[]> {
  return php.phpReponses()
}
export async function createReponse(texte: string): Promise<php.ReponsePrete> {
  return php.phpAjouterReponse(texte)
}
export async function deleteReponse(id: string): Promise<void> {
  return php.phpSupprimerReponse(id)
}
