// Badge de vérification bleu : statut + demande (accordée si éligible).
import { isPhp } from './backend'
import * as php from './php'

export interface VerifyStatus {
  verified: boolean
  eligible: boolean
  ageOk: boolean
  activityOk: boolean
  months: number
}

export async function fetchVerifyStatus(): Promise<VerifyStatus> {
  if (!isPhp) return { verified: false, eligible: false, ageOk: false, activityOk: false, months: 0 }
  return php.phpVerifyStatus<VerifyStatus>()
}

/** Demande la vérification. Renvoie { verified }. Lève une erreur si non éligible. */
export async function requestVerify(): Promise<{ verified: boolean }> {
  if (!isPhp) throw new Error('La vérification nécessite le backend Chap.ci.')
  return php.phpVerifyRequest<{ verified: boolean }>()
}
