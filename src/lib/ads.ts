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
/** Clé d'animation (voir AD_ANIMS — 50 animations disponibles). */
export type AdAnim = string

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
  /** Animations enchaînées du texte (une ou plusieurs parmi AD_ANIMS). */
  anims?: string[]
  /** Pause (en secondes) entre deux animations, de 5 s à 60 s. */
  animGap?: number
  /** Animer en boucle continue pendant toute la durée d'affichage (défaut : oui). */
  animLoop?: boolean
  /** Couleur du texte (ex. « #FFFFFF ») pour rester lisible sur l'image. */
  textColor?: string | null
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
  /** Contact de l'annonceur (notifications de statut + vérification). */
  email?: string | null
  phone?: string | null
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
  email: string
  phone?: string
  style?: AdStyle
  anims?: string[]
  gap?: number
  loop?: boolean
  textColor?: string
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
  anims: string[]
  gap: number
  loop: boolean
  textColor: string
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

/** Pause par défaut entre deux animations (secondes). */
export const AD_GAP_DEFAULT = 8
export const AD_GAP_MIN = 5
export const AD_GAP_MAX = 60

/** 50 animations de texte disponibles (l'admin en sélectionne une ou plusieurs). */
export const AD_ANIMS: { key: string; label: string }[] = [
  { key: 'fondu', label: 'Fondu' },
  { key: 'fondu-haut', label: 'Fondu ↓ (du haut)' },
  { key: 'fondu-bas', label: 'Fondu ↑ (du bas)' },
  { key: 'fondu-gauche', label: 'Fondu → (gauche)' },
  { key: 'fondu-droite', label: 'Fondu ← (droite)' },
  { key: 'glissement', label: 'Glissement (bas→haut)' },
  { key: 'glissement-bas', label: 'Glissement (haut→bas)' },
  { key: 'glissement-gauche', label: 'Glissement (gauche)' },
  { key: 'glissement-droite', label: 'Glissement (droite)' },
  { key: 'zoom', label: 'Zoom avant' },
  { key: 'zoom-arriere', label: 'Zoom arrière' },
  { key: 'zoom-haut', label: 'Zoom du haut' },
  { key: 'zoom-bas', label: 'Zoom du bas' },
  { key: 'pop', label: 'Pop' },
  { key: 'rebond', label: 'Rebond (du haut)' },
  { key: 'rebond-haut', label: 'Rebond (du bas)' },
  { key: 'ressort', label: 'Ressort élastique' },
  { key: 'jello', label: 'Jello' },
  { key: 'tada', label: 'Tada' },
  { key: 'flipx', label: 'Retournement horizontal' },
  { key: 'flipy', label: 'Retournement vertical' },
  { key: 'bascule', label: 'Bascule' },
  { key: 'balancier', label: 'Balancier' },
  { key: 'roulement', label: 'Roulement' },
  { key: 'rotation', label: 'Rotation' },
  { key: 'pivot', label: 'Pivot' },
  { key: 'pulse', label: 'Pulsation' },
  { key: 'battement', label: 'Battement de cœur' },
  { key: 'clignote', label: 'Clignotement' },
  { key: 'secousse', label: 'Secousse' },
  { key: 'tremble', label: 'Tremblement' },
  { key: 'oscille', label: 'Oscillation' },
  { key: 'balance', label: 'Balancement' },
  { key: 'vacille', label: 'Vacillement' },
  { key: 'surligne', label: 'Surlignage' },
  { key: 'machine', label: 'Machine à écrire' },
  { key: 'defilement', label: 'Défilement (entrée)' },
  { key: 'flou', label: 'Flou → net' },
  { key: 'flouzoom', label: 'Flou + zoom' },
  { key: 'neon', label: 'Néon clignotant' },
  { key: 'etirement', label: 'Étirement des lettres' },
  { key: 'compression', label: 'Compression' },
  { key: 'glitch', label: 'Glitch' },
  { key: 'fonduechelle', label: 'Fondu + échelle' },
  { key: 'tournoie', label: 'Tournoiement' },
  { key: 'plonge', label: 'Plongée' },
  { key: 'leve', label: 'Lever' },
  { key: 'apparition', label: 'Apparition (voile)' },
  { key: 'balayage', label: 'Balayage (révélation)' },
  { key: 'estampe', label: 'Estampe (impact)' },
]
