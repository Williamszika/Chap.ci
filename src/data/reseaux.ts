/**
 * LES RÉSEAUX SOCIAUX DU PROFESSIONNEL (05/09/2026).
 *
 * Les neuf réseaux que le serveur accepte (`reseaux_definitions()` dans
 * server/index.php — même liste, même ordre), avec ce qu'il faut pour les
 * dessiner : la couleur de la marque, l'encre qui se lit dessus, et l'exemple
 * du champ de saisie. WhatsApp n'y est pas, à dessein : le numéro du vendeur
 * ne sort jamais du serveur, et un lien wa.me est un numéro.
 */
export type ReseauId =
  | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'snapchat'
  | 'linkedin' | 'x' | 'telegram' | 'site'

export interface DefReseau {
  id: ReseauId
  nom: string
  /** Le fond du bouton : la couleur de la marque (ou son dégradé). */
  fond: string
  /** L'encre qui se lit sur ce fond. */
  encre: string
  placeholder: string
}

export const RESEAUX: DefReseau[] = [
  { id: 'facebook',  nom: 'Facebook',  fond: '#1877F2', encre: '#FFFFFF', placeholder: '@maboutique ou facebook.com/maboutique' },
  { id: 'instagram', nom: 'Instagram', fond: 'linear-gradient(45deg, #F58529 0%, #DD2A7B 55%, #8134AF 100%)', encre: '#FFFFFF', placeholder: '@maboutique' },
  { id: 'tiktok',    nom: 'TikTok',    fond: '#111111', encre: '#FFFFFF', placeholder: '@maboutique' },
  { id: 'youtube',   nom: 'YouTube',   fond: '#FF0000', encre: '#FFFFFF', placeholder: '@machaine ou le lien de la chaîne' },
  { id: 'snapchat',  nom: 'Snapchat',  fond: '#FFFC00', encre: '#111111', placeholder: 'votre nom d’utilisateur' },
  { id: 'linkedin',  nom: 'LinkedIn',  fond: '#0A66C2', encre: '#FFFFFF', placeholder: 'le lien de votre page' },
  { id: 'x',         nom: 'X',         fond: '#000000', encre: '#FFFFFF', placeholder: '@compte' },
  { id: 'telegram',  nom: 'Telegram',  fond: '#26A5E4', encre: '#FFFFFF', placeholder: '@canal' },
  { id: 'site',      nom: 'Site web',  fond: '#1B1A17', encre: '#FFFFFF', placeholder: 'https://www.maboutique.ci' },
]

export type Reseaux = Partial<Record<ReseauId, string>>

/** « https://www.facebook.com/maisonkoffi/ » → « facebook.com/maisonkoffi » : ce que l'acheteur lit. */
export function lisible(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
}

/** Les réseaux renseignés, dans l'ordre de la liste, avec leur adresse. */
export function reseauxPresents(r?: Reseaux | null): [DefReseau, string][] {
  if (!r) return []
  const out: [DefReseau, string][] = []
  for (const d of RESEAUX) {
    const u = r[d.id]
    if (typeof u === 'string' && /^https:\/\//i.test(u)) out.push([d, u])
  }
  return out
}
