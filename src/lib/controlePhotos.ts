/**
 * LE CONTRÔLE DES PHOTOS — côté serveur d'abord, modèle local en repli.
 *
 * Chantier 5 du 04/09/2026 : « le poids sur 3G ». L'écran Publier chargeait,
 * à la première photo, un modèle de 5,4 Mo (TensorFlow + NSFW.js) pour
 * filtrer la nudité dans le navigateur — sur un forfait ivoirien, le prix
 * d'une annonce. Quand la clé du moteur de vision est en place, le contrôle
 * se fait sur le serveur, sur les mêmes photos réduites à 768 px que
 * « Chap.ci écrit l'annonce », en un appel pour toutes les photos ajoutées
 * d'un coup — et le modèle local n'est jamais téléchargé.
 *
 * Sans clé (ou sans réseau, ou quota du jour atteint), ce fichier rend `null`
 * et l'écran se rabat sur le modèle local, comme avant : le filet ne tombe
 * jamais, il change juste de côté.
 */
import { reduirePourVision } from './deviner'
import { ApiError, phpControlerPhotos, phpDevinerDisponible, type VerdictPhoto } from './php'

export type { VerdictPhoto }

let disponibilite: Promise<boolean> | null = null

/** Le moteur est-il allumé ? Demandé une fois par session, pas à chaque photo. */
export function controleServeurDisponible(): Promise<boolean> {
  if (!disponibilite) disponibilite = phpDevinerDisponible().catch(() => false)
  return disponibilite
}

/**
 * Contrôle les photos (data-URI, pleine taille) par le serveur. Rend un
 * verdict par photo dans l'ordre, ou `null` si le serveur ne peut pas
 * contrôler — au client de se rabattre sur le modèle local.
 *
 * Un 422 (le moteur a refusé de regarder le lot) est un verdict : tout le lot
 * est refusé. C'est le seul cas où une erreur ne se traduit pas par `null`.
 */
export async function controlerPhotosServeur(dataUris: string[]): Promise<VerdictPhoto[] | null> {
  if (dataUris.length === 0) return []
  if (!(await controleServeurDisponible())) return null
  try {
    const petites = await Promise.all(dataUris.map((u) => reduirePourVision(u)))
    const r = await phpControlerPhotos(petites)
    if (!Array.isArray(r.verdicts) || r.verdicts.length !== dataUris.length) return null
    return r.verdicts
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return dataUris.map(() => ({ refusee: true, motif: 'refus' }))
    return null
  }
}
