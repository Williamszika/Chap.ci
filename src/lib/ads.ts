// =============================================================================
//  Écran publicitaire — pubs payantes affichées sur la bannière de l'accueil.
//  Ouvertes à tous (même sans compte) ; tarif réduit pour les membres actifs.
// =============================================================================
import { isPhp } from './backend'
import * as php from './php'

export interface AdTariff {
  member: boolean
  prices: { day: number; week: number; month: number }
}

export type AdStyle = 'classique' | 'neon' | 'script' | 'impact' | 'ivoire'
export type AdAnim = 'fondu' | 'glissement' | 'pulse' | 'defilement' | 'machine'

export interface Ad {
  id: string
  title: string
  description: string
  link?: string | null
  images: string[]
  /** 'paid' = pub payante · 'admin' = diffusion Chap.ci · 'seo' = Bureau Croissance SEO. */
  kind?: 'paid' | 'admin' | 'seo'
  style?: AdStyle | null
  anim?: AdAnim | null
}

export interface SeoState {
  enabled: boolean
  todayDone: boolean
  current: { title: string; createdAt: number } | null
  cronKey: string
  site: string
}

export interface AdminAd extends Ad {
  formule: 'day' | 'week' | 'month'
  qty: number
  price: number
  payMethod: string
  payNumber: string
  status: 'pending' | 'active' | 'rejected' | 'expired'
  expiresAt?: number | null
  createdAt: number
}

export const AD_FALLBACK_TARIFF: AdTariff = {
  member: false,
  prices: { day: 400, week: 2000, month: 6000 },
}

/** Tarif applicable au visiteur courant (plein tarif hors backend PHP). */
export async function fetchAdTariff(): Promise<AdTariff> {
  if (!isPhp) return AD_FALLBACK_TARIFF
  return php.phpAdTariff<AdTariff>()
}

export async function submitAd(input: {
  title: string
  description: string
  link: string
  images: string[]
  formule: 'day' | 'week' | 'month'
  qty: number
  payMethod: string
  payNumber: string
  website?: string // pot de miel
}): Promise<{ ok: boolean; id: string; price: number; member: boolean }> {
  if (!isPhp) throw new Error('La publicité nécessite le backend Chap.ci.')
  return php.phpAdSubmit(input)
}

export async function fetchActiveAds(): Promise<Ad[]> {
  if (!isPhp) return []
  return php.phpAdsActive<Ad[]>()
}

export async function fetchAd(id: string): Promise<Ad & { expiresAt?: number }> {
  if (!isPhp) throw new Error('Publicité introuvable.')
  return php.phpAdGet(id)
}

export async function fetchAdminAds(): Promise<AdminAd[]> {
  if (!isPhp) throw new Error('Le tableau de bord admin nécessite le backend PHP.')
  return php.phpAdminAds<AdminAd[]>()
}

export async function adminAdAction(id: string, action: 'approve' | 'reject'): Promise<void> {
  if (!isPhp) throw new Error('Le tableau de bord admin nécessite le backend PHP.')
  return php.phpAdminAdAction(id, action)
}

export async function adminAdDelete(id: string): Promise<void> {
  if (!isPhp) throw new Error('Le tableau de bord admin nécessite le backend PHP.')
  return php.phpAdminAdDelete(id)
}

export const AD_FORMULES: { key: 'day' | 'week' | 'month'; label: string; unit: string; unitPlural: string }[] = [
  { key: 'day', label: 'Par jour', unit: 'jour', unitPlural: 'jours' },
  { key: 'week', label: 'Par semaine', unit: 'semaine', unitPlural: 'semaines' },
  { key: 'month', label: 'Par mois', unit: 'mois', unitPlural: 'mois' },
]

/** Diffusion admin : message animé affiché immédiatement sur l'écran. */
export async function adminAdBroadcast(input: {
  title: string
  description: string
  link: string
  images: string[]
  style: AdStyle
  anim: AdAnim
  days: number
}): Promise<{ ok: boolean; id: string }> {
  if (!isPhp) throw new Error('Le tableau de bord admin nécessite le backend PHP.')
  return php.phpAdminAdBroadcast(input)
}

export const AD_STYLES: { key: AdStyle; label: string }[] = [
  { key: 'classique', label: 'Classique' },
  { key: 'impact', label: 'Impact (majuscules)' },
  { key: 'neon', label: 'Néon lumineux' },
  { key: 'script', label: 'Élégant (italique)' },
  { key: 'ivoire', label: 'Drapeau ivoirien' },
]

/** Bureau de Croissance SEO — état, activation, génération immédiate. */
export async function fetchSeoState(): Promise<SeoState> {
  if (!isPhp) throw new Error('Le tableau de bord admin nécessite le backend PHP.')
  return php.phpAdminSeo<SeoState>()
}
export async function setSeoEnabled(enabled: boolean): Promise<void> {
  if (!isPhp) throw new Error('Le tableau de bord admin nécessite le backend PHP.')
  await php.phpAdminSeoToggle(enabled)
}
export async function runSeoNow(): Promise<{ ok: boolean; goal: string; title: string }> {
  if (!isPhp) throw new Error('Le tableau de bord admin nécessite le backend PHP.')
  return php.phpAdminSeoRun()
}

export const AD_ANIMS: { key: AdAnim; label: string }[] = [
  { key: 'fondu', label: 'Fondu' },
  { key: 'glissement', label: 'Glissement' },
  { key: 'pulse', label: 'Pulsation' },
  { key: 'defilement', label: 'Défilement (bandeau)' },
  { key: 'machine', label: 'Machine à écrire' },
]
