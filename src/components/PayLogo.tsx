import { BrandLogo, type BrandId } from './BrandLogo'

/**
 * Logo d'un moyen de paiement Mobile Money.
 *
 * Ce composant ne dessine plus rien lui-même : il délègue à BrandLogo, où
 * TOUTES les marques du site sont désormais réunies. Auparavant, Orange Money
 * y était représenté par un CERCLE orange traversé de deux flèches — un dessin
 * inventé, qui n'a jamais été la marque d'Orange (un carré orange portant son
 * nom en blanc). Sur un écran de paiement, un logo approximatif ressemble à
 * une contrefaçon : c'est exactement là que l'utilisateur cherche un repère
 * familier pour décider s'il peut payer en confiance.
 */
export function PayLogo({ id, className = 'h-6 w-6' }: { id: string; className?: string }) {
  const connu: BrandId[] = ['orange', 'wave', 'mtn', 'moov']
  const marque = (connu as string[]).includes(id) ? (id as BrandId) : 'orange'
  return <BrandLogo id={marque} className={className} />
}
