import * as php from './php'
import type { Listing } from '../types'

// Le site est 100 % auto-hébergé sur la base TPE Cloud (backend PHP `server/`) :
// toutes ces fonctions délèguent au client PHP.

/** Charge toutes les annonces partagées depuis le backend. */
export async function fetchListings(): Promise<Listing[]> {
  return php.phpFetchListings()
}

/** Crée une annonce partagée et renvoie l'annonce créée. */
export async function createListing(
  input: Omit<Listing, 'id' | 'createdAt' | 'currency'>,
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

/** Modifier une annonce. */
export async function updateListingRemote(id: string, input: Omit<Listing, 'id' | 'createdAt' | 'currency'>): Promise<Listing> {
  return php.phpUpdateListing(id, input)
}

/** Masquer / réafficher une annonce. */
export async function setListingHidden(id: string, hidden: boolean): Promise<void> {
  return php.phpSetListingHidden(id, hidden)
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
