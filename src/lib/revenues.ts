// =============================================================================
//  Recettes du site — ce que Chap.ci a réellement encaissé.
//
//  Deux natures, connues de deux façons différentes :
//
//   • les PUBLICITÉS sont connues du site (prix, moyen de paiement, numéro du
//     payeur, date) : rien à saisir ;
//   • les DONS ne le sont PAS. La page /don affiche un numéro Mobile Money et
//     le donateur envoie l'argent depuis son téléphone : la transaction se joue
//     entre lui et l'opérateur, Chap.ci n'y est jamais. Aucun code ne peut les
//     deviner — on les relève sur le compte Mobile Money et on les inscrit.
//
//  D'où « confirmé », qui ne veut pas dire « payé » mais « retrouvé sur le
//  relevé de l'opérateur ».
// =============================================================================
import { isPhp } from './backend'
import * as php from './php'

export type RevenueKind = 'pub' | 'don' | 'autre'

export interface RevenueLine {
  id: string
  kind?: RevenueKind
  label: string
  amount: number
  method: string
  number: string
  email?: string | null
  note?: string
  status?: string
  /** Date de l'encaissement (ms). */
  at: number
  /** Retrouvé sur le relevé Mobile Money. */
  confirmed: boolean
  confirmedAt?: number | null
}

export interface Revenues {
  pubs: RevenueLine[]
  dons: RevenueLine[]
  autres: RevenueLine[]
  totaux: {
    pub: number; don: number; autre: number; total: number
    confirme: number; aVerifier: number; nbAVerifier: number
  }
  parMois: { mois: string; total: number }[]
}

export async function fetchRevenues(from = '', to = ''): Promise<Revenues> {
  if (!isPhp) throw new Error('Les recettes nécessitent le backend Chap.ci.')
  return php.phpAdminRevenues<Revenues>(from, to)
}

export async function addRevenue(input: {
  kind: RevenueKind
  label: string
  amount: number
  method: string
  number?: string
  occurredAt?: string
  note?: string
  confirmed?: boolean
}): Promise<{ ok: boolean; id: string }> {
  if (!isPhp) throw new Error('Les recettes nécessitent le backend Chap.ci.')
  return php.phpAdminRevenueAdd(input)
}

export async function confirmRevenue(id: string, confirmed: boolean): Promise<void> {
  return php.phpAdminRevenueConfirm(id, confirmed)
}

export async function deleteRevenue(id: string): Promise<void> {
  return php.phpAdminRevenueDelete(id)
}

export const REVENUE_METHODS: { id: string; label: string }[] = [
  { id: 'orange', label: 'Orange Money' },
  { id: 'wave', label: 'Wave' },
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'moov', label: 'Moov Money' },
  { id: 'especes', label: 'Espèces' },
  { id: 'autre', label: 'Autre' },
]

export const methodLabel = (id: string): string =>
  REVENUE_METHODS.find((m) => m.id === id)?.label ?? (id || '—')
