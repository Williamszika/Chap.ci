/**
 * « CHAP.CI ÉCRIT L'ANNONCE » — côté téléphone.
 *
 * Nouveauté n° 1 du 03/09/2026. Le vendeur prend la photo ; le titre, la
 * catégorie, la sous-catégorie, l'état et les caractéristiques se remplissent.
 * Ce fichier prépare ce qui part au serveur (`/annonce/deviner`) :
 *
 *  · la photo, RÉDUITE à 768 px : le moteur n'a pas besoin de plus pour
 *    reconnaître un téléphone, et chaque pixel envoyé coûte des jetons et du
 *    forfait — la photo pleine (1280 px) reste pour l'annonce ;
 *  · le catalogue des catégories, tel que le site le connaît. C'est le client
 *    qui le tient (`data/categories.ts`), pas le serveur : une seconde copie
 *    en PHP divergerait à la première catégorie ajoutée.
 *
 * Les sous-catégories n'ont pas d'identifiant à part : leur nom EST leur
 * identifiant dans les annonces (`listing.subcategory`). Le catalogue les
 * envoie donc telles quelles, et le serveur vérifie que la réponse du moteur
 * en fait partie.
 */
import { categories } from '../data/categories'
import { phpDeviner, phpDevinerDisponible, type CatalogueDeviner, type Devine } from './php'

export type { Devine }

export const devinerDisponible = phpDevinerDisponible

/** Le catalogue que le moteur lira — et contre lequel le serveur vérifiera sa réponse. */
export function catalogueDeviner(): CatalogueDeviner[] {
  return categories.map((c) => ({
    id: c.id,
    label: c.name,
    sous: c.subcategories.map((s) => ({ id: s, label: s })),
  }))
}

/** La photo réduite pour le moteur : 768 px de côté au plus, JPEG. */
export function reduirePourVision(dataUri: string, max = 768): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
      const l = Math.max(1, Math.round(img.naturalWidth * k))
      const h = Math.max(1, Math.round(img.naturalHeight * k))
      const canvas = document.createElement('canvas')
      canvas.width = l
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas indisponible')); return }
      ctx.drawImage(img, 0, 0, l, h)
      try { resolve(canvas.toDataURL('image/jpeg', 0.8)) }
      catch (e) { reject(e instanceof Error ? e : new Error(String(e))) }
    }
    img.onerror = () => reject(new Error('photo illisible'))
    img.src = dataUri
  })
}

/** Demande au moteur de rédiger l'annonce à partir d'une photo (déjà en data-URI). */
export async function deviner(photo: string): Promise<Devine> {
  const petite = await reduirePourVision(photo)
  return phpDeviner(petite, catalogueDeviner())
}
