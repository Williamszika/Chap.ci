// =============================================================================
//  La messagerie de l'équipe.
//
//  Trois usages, un seul mécanisme :
//    · un membre écrit à l'équipe — bouton « Contacter l'équipe » ;
//    · un administrateur ou un modérateur lui répond ;
//    · les modérateurs se parlent entre eux, hors de vue des membres.
//
//  Ce n'est PAS la messagerie acheteur ↔ vendeur (`conversations`), qui exige
//  une annonce réelle et son propriétaire — un membre qui écrit à l'équipe n'a
//  ni l'une ni l'autre, et l'équipe est plusieurs personnes.
//
//  ⚠️ Un fil `staff` n'est jamais servi à un non-membre de l'équipe. Le serveur
//  le vérifie à chaque route ; ce fichier ne fait que transporter.
// =============================================================================
import { isPhp } from './backend'
import * as php from './php'

const NON_DISPO = 'La messagerie de l’équipe nécessite le backend auto-hébergé (PHP).'

/** Qui a écrit : un membre, ou l'équipe. */
export type RoleFil = 'utilisateur' | 'equipe'

export interface Fil {
  id: string
  /** 'user' = membre ↔ équipe · 'staff' = entre modérateurs */
  kind: 'user' | 'staff'
  sujet: string
  statut: 'open' | 'closed'
  /**
   * Renseignés seulement pour l'équipe QUI A LE DROIT de les voir (voir
   * `identites`). Un membre ne voit jamais les autres.
   */
  userId?: string | null
  userNom?: string | null
  userEmail?: string | null
  creeLe: number
  dernierLe: number
  dernierPar: RoleFil
  nonLus: number
}

export interface MessageFil {
  id: string
  role: RoleFil
  /** Vu d'un membre, l'équipe signe « L'équipe Chap.ci » — jamais un nom. */
  nom: string
  body: string
  createdAt: number
}

export interface ListeFils {
  /** Vrai si celui qui demande est administrateur ou modérateur. */
  equipe: boolean
  /**
   * Vrai si ce membre de l'équipe a le droit de voir QUI a ouvert le fil.
   *
   * Répondre à une demande n'exige pas de connaître l'e-mail de qui la pose.
   * Le nom et l'adresse sont derrière la fonctionnalité « Utilisateurs »,
   * comme sur la fiche d'un compte ; sans elle, `userNom` et `userEmail`
   * arrivent vides et l'écran affiche simplement « Membre ».
   */
  identites?: boolean
  fils: Fil[]
}

export async function chargerFils(): Promise<ListeFils> {
  if (!isPhp) throw new Error(NON_DISPO)
  return php.phpTeamThreads<ListeFils>()
}

export async function ouvrirFil(
  sujet: string,
  message: string,
  kind: 'user' | 'staff' = 'user',
): Promise<string> {
  if (!isPhp) throw new Error(NON_DISPO)
  const r = await php.phpTeamOpenThread(sujet, message, kind)
  return r.id
}

export async function chargerFil(id: string): Promise<{ fil: Fil; messages: MessageFil[] }> {
  if (!isPhp) throw new Error(NON_DISPO)
  return php.phpTeamThread<{ fil: Fil; messages: MessageFil[] }>(id)
}

export async function repondre(id: string, message: string): Promise<MessageFil> {
  if (!isPhp) throw new Error(NON_DISPO)
  return php.phpTeamReply<MessageFil>(id, message)
}

export async function changerStatut(id: string, statut: 'open' | 'closed'): Promise<void> {
  if (!isPhp) throw new Error(NON_DISPO)
  return php.phpTeamSetStatus(id, statut)
}

/**
 * Le nombre de messages non lus, pour la pastille.
 *
 * Ne lève jamais : une pastille qui casse un écran entier vaut moins qu'une
 * pastille absente. Rend 0 dès que quoi que ce soit se passe mal — pas
 * connecté, réseau coupé, backend statique.
 */
export async function nonLus(): Promise<number> {
  try {
    const r = await chargerFils()
    return r.fils.reduce((n, f) => n + (f.nonLus || 0), 0)
  } catch {
    return 0
  }
}
