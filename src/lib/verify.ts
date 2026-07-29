// =============================================================================
//  Vérification du compte et badges.
//
//  Deux choses distinctes, qu'il ne faut jamais confondre :
//
//   • VÉRIFIER SON ADRESSE (code à 6 chiffres reçu par e-mail) — c'est la
//     condition pour PUBLIER une annonce. Elle ne donne aucun badge : une
//     distinction que tout le monde obtient ne distingue plus personne.
//
//   • LE BADGE — calculé par le serveur, jamais demandé :
//       'admin'       bleu · l'équipe Chap.ci
//       'anciennete'  vert · adresse confirmée + 6 mois de présence
//       ''            aucun
// =============================================================================
import { isPhp } from './backend'
import * as php from './php'
import type { BadgeKind } from '../components/VerifiedBadge'

export interface VerifyStatus {
  emailVerified: boolean
  badge: BadgeKind | ''
  /** Ancienneté du compte, en mois révolus. */
  mois: number
  /** Mois restants avant le badge vert (0 s'il est déjà acquis). */
  moisRestants: number
  membreDepuis?: number
}

const VIDE: VerifyStatus = { emailVerified: false, badge: '', mois: 0, moisRestants: 6 }

export async function fetchVerifyStatus(): Promise<VerifyStatus> {
  if (!isPhp) return VIDE
  return php.phpVerifyStatus<VerifyStatus>()
}

/** Demande l'envoi d'un code à l'adresse du compte. */
export async function sendEmailCode(): Promise<{ ok: boolean; already?: boolean }> {
  if (!isPhp) throw new Error('La vérification nécessite le backend Chap.ci.')
  return php.phpVerifyEmailSend()
}

/** Confirme le code reçu. Lève une erreur explicite si le code est refusé. */
export async function confirmEmailCode(code: string): Promise<{ ok: boolean; badge?: BadgeKind | '' }> {
  if (!isPhp) throw new Error('La vérification nécessite le backend Chap.ci.')
  return php.phpVerifyEmailConfirm(code)
}
