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
  // null = compte sans la permission 'contact' (le serveur masque le compteur)
  contactOpen?: number | null
  adsPending?: number | null
  periods?: {
    users: { day: number; week: number; month: number; year: number }
    listings: { day: number; week: number; month: number; year: number }
  }
  series?: { date: string; users: number; listings: number }[]
  /**
   * Le Parcours : quatre marches, dans l'ordre où une personne les monte.
   * Les trois dernières suivent la COHORTE des comptes créés dans la fenêtre,
   * pas l'activité de la fenêtre — sinon un vendeur inscrit l'an dernier
   * gonflerait le « ont publié » des sept derniers jours.
   */
  parcours?: Record<'j7' | 'j30' | 'tout', {
    visiteurs: number
    comptes: number
    publie: number
    vendu: number
  }>
  ordersByStatus: Record<string, number>
  ordersValue: number
  recentListings: Listing[]
  recentUsers: { id: string; email: string; fullName: string; status?: UserStatus; createdAt: number }[]
  /** Carte « Sécurité » de l'aperçu — fournie par le serveur au propriétaire uniquement. */
  security?: {
    failedLogins: number
    adminsIntegrity: boolean | null
    owner2fa: boolean
    alerts: number
  } | null
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
  /** Dernière activité constatée (ms), `null` si jamais vue. */
  derniereActivite?: number | null
  /** Ancienneté de cette activité, en secondes. */
  vuIlYA?: number | null
  /** Vu il y a moins de cinq minutes — la même fenêtre que celle d'écriture. */
  enLigne?: boolean
}

/**
 * La fiche complète d'un compte — pour les administrateurs ET les modérateurs.
 *
 * ⚠️ Elle porte le TÉLÉPHONE et l'E-MAIL. Rien de ce type ne doit atterrir sur
 * un écran public : le profil public d'un vendeur, c'est `SellerProfile`, et il
 * n'affiche ni l'un ni l'autre.
 */
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
  /** Comment il s'est inscrit : 'email', 'google', 'facebook'… */
  provider?: string
  emailVerifie?: boolean
  /** Membre de l'équipe ? On ne bloque pas un collègue par mégarde. */
  equipe?: 'proprietaire' | 'moderateur' | null
  /** Dernière activité constatée (ms), `null` si jamais vue. */
  derniereActivite?: number | null
  /** Ancienneté de cette activité, en secondes. */
  vuIlYA?: number | null
  /** Vu il y a moins de cinq minutes — la même fenêtre que celle d'écriture. */
  enLigne?: boolean

  chiffres?: {
    annonces: number
    annoncesMasquees: number
    annoncesVendues: number
    signalementsSubis: number
    signalementsSubisOuverts: number
    signalementsEmis: number
    conversations: number
    messages: number
    commandesPassees: number
    commandesRecues: number
    avisRecus: number
    publicites: number
  }
  note?: { moyenne: number; nombre: number } | null
  motifsSignales?: { motif: string; n: number }[]
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
export async function deleteAdminListing(id: string, motif = ''): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminDeleteListing(id, motif)
}
/**
 * Masquer / démasquer une annonce. Le motif est EXIGÉ au masquage — c'est lui
 * que le vendeur reçoit, et sans lui il republie la même annonce demain.
 */
export async function setAdminListingHidden(id: string, hidden: boolean, motif = ''): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminSetListingHidden(id, hidden, motif)
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
/** Ce qu'on fait d'un signalement : le classer, ou agir sur l'annonce avec lui. */
export type ReportAction = 'classer' | 'masquer' | 'supprimer'
export async function resolveReport(id: string, action: ReportAction = 'classer', motif = ''): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminResolveReport(id, action, motif)
}

// ---- Messages du formulaire de contact --------------------------------------
export interface ContactMessage {
  id: string
  name?: string | null
  email?: string | null
  subject: string
  message: string
  handled: boolean
  createdAt: number
  replyBody?: string | null
  repliedAt?: number | null
  repliedBy?: string | null
}
export async function fetchContactMessages(): Promise<ContactMessage[]> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminContactMessages<ContactMessage[]>()
}
export async function setContactHandled(id: string, handled: boolean): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminContactHandled(id, handled)
}
export async function deleteContactMessage(id: string): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminContactDelete(id)
}
/** Propositions de réponse de l'IA du site (générées localement, sans clé API). */
export async function suggestContactReply(id: string): Promise<{ draft: string; drafts?: string[]; ai: boolean }> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminContactSuggest(id)
}
/** Envoie la réponse par email depuis contact@chap.ci (signature ajoutée). */
export async function replyContactMessage(id: string, body: string): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminContactReply(id, body)
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
export interface VisitPoint {
  /** Clé exacte de la tranche : « 2026-08-05 » en jour, « 2026-08 » en mois. */
  key: string
  label: string
  views: number
  visitors: number
  signups: number
  listings: number
}
export interface VisitStats {
  range: VisitRange
  series: VisitPoint[]
  totalViews: number
  totalVisitors: number
  totalSignups: number
  totalListings: number
  /** Horodatage de la toute première visite enregistrée, ou null si la table est vide. */
  mesureDepuis: string | null
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
  moderators: { email: string; createdAt: number; permissions: string[]; hasCode: boolean; blocked: boolean }[]
  features: { key: string; label: string }[]
}
export type ModeratorSaveResult = php.ModeratorSaveResult
export async function fetchModerators(): Promise<Moderators> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminModerators<Moderators>()
}
/** Crée ou met à jour un modérateur : email + fonctionnalités cochées + code d'accès
 *  (généré si vide). `code` (en clair) n'est renvoyé qu'une fois, à transmettre au modérateur. */
export async function saveModerator(email: string, permissions: string[], code?: string): Promise<ModeratorSaveResult> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpSaveModerator(email, permissions, code)
}
export async function removeModerator(email: string): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpRemoveModerator(email)
}
/** Bloque (ou débloque) l'accès d'un modérateur au tableau de bord. */
export async function blockModerator(email: string, blocked: boolean): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpBlockModerator(email, blocked)
}
/** Rôle de l'utilisateur connecté : propriétaire ou modérateur, avec ses permissions. */
export async function adminRole(): Promise<php.AdminRole> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminRole()
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
// Serrure du tableau de bord (code d'accès administrateur).
export async function adminUnlock(code: string) {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminUnlock(code)
}
export async function adminUnlockEmail() {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminUnlockEmail()
}
export function adminLock() {
  php.phpAdminLock()
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
// ---- Jetons de service « modération auto » (propriétaire) -------------------
export type ServiceToken = php.ServiceToken
export type ModAuditEntry = php.ModAuditEntry
export async function modTokens() {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpModTokens()
}
export async function createModToken(label: string, rotate: boolean) {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpModTokenCreate(label, rotate)
}
export async function revokeModToken(id: string) {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpModTokenRevoke(id)
}
export async function modAudit() {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpModAudit()
}

export type ResetResult = php.ResetResult
/** Efface les données de test (une sauvegarde de sécurité est créée avant). */
export async function resetData(accounts: boolean): Promise<ResetResult> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpResetData(accounts)
}

// ---- Invitations au test fermé du Play Store --------------------------------
//
// ⚠️ LES ADRESSES NE SONT PAS DANS LE CODE, et ne doivent jamais y entrer : ce
// sont des personnes réelles. Elles se collent dans l'écran, partent au serveur
// qui les range en base, et n'apparaissent nulle part dans le dépôt.

export interface Invite {
  email: string
  envois: number
  dernierEnvoi: number
  statut: string
}
export interface ListeInvites {
  /** Le lien d'adhésion, composé par le serveur depuis l'identifiant de l'app. */
  lien: string
  invites: Invite[]
}
export interface ResultatEnvoi {
  envoyes: number
  echecs: number
  /** Déjà invitées, et non relancées : c'est le comportement par défaut. */
  ignores: number
  traites: number
  total: number
  rejetes: string[]
  fini: boolean
  lien: string
}

export async function fetchInvites(): Promise<ListeInvites> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpInvitations<ListeInvites>()
}

/**
 * Envoie UN LOT. L'écran boucle avec un `offset` croissant tant que `fini` est
 * faux : dix-huit e-mails SMTP dépassent volontiers le temps d'une requête web,
 * et un envoi coupé au milieu ne se rattrape pas — on ne saurait plus qui a
 * reçu quoi.
 */
export async function envoyerInvitations(
  destinataires: string,
  sujet: string,
  message: string,
  opts: { relancer?: boolean; offset?: number; limit?: number } = {},
): Promise<ResultatEnvoi> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpSendInvitations<ResultatEnvoi>({ destinataires, sujet, message, ...opts })
}
