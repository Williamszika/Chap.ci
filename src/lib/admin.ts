// =============================================================================
//  Administration — tableau de bord (statistiques, annonces, utilisateurs,
//  commandes). Disponible avec le backend PHP auto-hébergé.
// =============================================================================
import type { Listing } from '../types'
import { isPhp } from './backend'
import * as php from './php'

const NOT_SUPPORTED = 'Le tableau de bord admin nécessite le backend auto-hébergé (PHP).'

export interface AdminStats {
  users: number
  listings: number
  conversations: number
  messages: number
  orders: number
  reviews: number
  newsletter: number
  reportsOpen?: number
  periods?: {
    users: { day: number; week: number; month: number; year: number }
    listings: { day: number; week: number; month: number; year: number }
  }
  series?: { date: string; users: number; listings: number }[]
  ordersByStatus: Record<string, number>
  ordersValue: number
  recentListings: Listing[]
  recentUsers: { id: string; email: string; fullName: string; createdAt: number }[]
}

export type UserStatus = 'active' | 'restricted' | 'blocked'

export interface AdminUser {
  id: string
  email: string
  fullName: string
  phone?: string | null
  commune?: string | null
  status: UserStatus
  listings: number
  createdAt: number
}

export interface AdminUserDetail {
  id: string
  email: string
  fullName: string
  phone?: string | null
  commune?: string | null
  cityId?: string | null
  regionId?: string | null
  bio?: string | null
  avatarUrl?: string | null
  status: UserStatus
  createdAt: number
  listings: Listing[]
}

export interface Report {
  id: string
  listingId: string
  listingTitle: string
  listingHidden: boolean
  reason: string
  details?: string | null
  reporterEmail?: string | null
  status: 'open' | 'resolved'
  createdAt: number
}

export type AdminListing = Listing & { sellerEmail?: string | null }

export interface AdminOrder {
  id: string
  status: string
  buyerEmail?: string | null
  sellerEmail?: string | null
  createdAt: number
  items: { title: string; price: number; image?: string | null }[]
  total: number
}

export async function fetchAdminStats(): Promise<AdminStats> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminStats<AdminStats>()
}
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminUsers<AdminUser[]>()
}
export async function fetchAdminListings(): Promise<AdminListing[]> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminListings<AdminListing[]>()
}
export async function deleteAdminListing(id: string): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminDeleteListing(id)
}
/** Masquer / réafficher une annonce (modération). */
export async function setAdminListingHidden(id: string, hidden: boolean): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminSetListingHidden(id, hidden)
}
export async function fetchAdminUserDetail(id: string): Promise<AdminUserDetail> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminUserDetail<AdminUserDetail>(id)
}
export async function setUserStatus(id: string, status: UserStatus): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminSetUserStatus(id, status)
}
export async function deleteUser(id: string): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminDeleteUser(id)
}
export async function fetchReports(): Promise<Report[]> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminReports<Report[]>()
}
export async function resolveReport(id: string): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminResolveReport(id)
}
export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminOrders<AdminOrder[]>()
}

export interface AdminConversation {
  id: string
  buyerEmail?: string | null
  sellerEmail?: string | null
  listingTitle?: string | null
  messages: number
  lastMessage?: string | null
  createdAt: number
}
export interface AdminReview {
  id: string
  rating: number
  comment?: string | null
  reviewerName?: string | null
  reviewerEmail?: string | null
  sellerEmail?: string | null
  listingId?: string | null
  listingTitle?: string | null
  createdAt: number
}
export async function fetchAdminConversations(): Promise<AdminConversation[]> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminConversations<AdminConversation[]>()
}
export async function fetchAdminReviews(): Promise<AdminReview[]> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminReviews<AdminReview[]>()
}
export async function deleteAdminReview(id: string): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminDeleteReview(id)
}

export type VisitRange = 'day' | 'week' | 'month' | 'year'
export interface VisitStats {
  range: VisitRange
  series: { label: string; views: number; visitors: number }[]
  totalViews: number
  totalVisitors: number
}
export interface ResponseTime {
  count: number
  avgSeconds: number | null
  medianSeconds: number | null
}
export async function fetchVisits(range: VisitRange): Promise<VisitStats> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminVisits<VisitStats>(range)
}
export async function fetchResponseTime(): Promise<ResponseTime> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminResponseTime<ResponseTime>()
}

export interface Moderators {
  owners: string[]
  moderators: { email: string; createdAt: number }[]
}
export async function fetchModerators(): Promise<Moderators> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminModerators<Moderators>()
}
/** Ajoute (ou re-notifie) un modérateur. `emailed` = email envoyé, `already` = était déjà modérateur. */
export async function addModerator(email: string): Promise<{ emailed: boolean; already: boolean }> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAddModerator(email)
}
export async function removeModerator(email: string): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpRemoveModerator(email)
}
/** Envoie un email de test à l'administrateur connecté (diagnostic). */
export async function sendTestEmail(): Promise<{ sent: boolean; to: string; via: string }> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminTestEmail()
}

export async function campaignCount(): Promise<number> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpCampaignCount()
}
export async function campaignSend(subject: string, message: string, offset: number, limit: number) {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpCampaignSend(subject, message, offset, limit)
}
export async function digestInfo() {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpDigestInfo()
}
export async function digestSend(type: 'daily' | 'weekly') {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpDigestSend(type)
}
export async function suggestionsTest() {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpSuggestionsTest()
}

export type SmtpSettings = php.SmtpSettings
export async function getSmtp(): Promise<SmtpSettings> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpGetSmtp()
}
export async function saveSmtp(s: { host: string; port: string; secure: string; user: string; pass: string }): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpSaveSmtp(s)
}

// ---- Sauvegarde de la base --------------------------------------------------
export type BackupFile = php.BackupFile
export async function listBackups() {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminBackups()
}
/** Télécharge un export JSON complet de la base (immédiat ou une sauvegarde existante). */
export async function downloadBackup(file?: string): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpDownloadBackup(file)
}
export type ResetResult = php.ResetResult
/** Efface les données de test (une sauvegarde de sécurité est créée avant). */
export async function resetData(accounts: boolean): Promise<ResetResult> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpResetData(accounts)
}
