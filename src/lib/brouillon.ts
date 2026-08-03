// =============================================================================
//  Brouillon local du formulaire de publication.
//
//  POURQUOI. Sur 30 jours, 60 visites de /publier par des comptes connectés
//  n'ont donné que 3 vendeurs. Huit comptes sur onze n'ont jamais rien publié.
//  Le formulaire tient sur un seul écran, mais il demande une douzaine de
//  champs — et tout vivait en mémoire React, donc rien ne survivait à un
//  rechargement. Un réseau qui tombe au mauvais moment à Abidjan, l'application
//  chassée de la mémoire parce qu'on a répondu à un message, un appel entrant :
//  et la saisie disparaît en entier, sans un mot.
//
//  On ne saura jamais combien des 57 tentatives perdues viennent de là. Mais
//  c'est le seul point du parcours où l'utilisateur peut perdre son travail, et
//  ça ne coûte presque rien de le lui rendre.
//
//  CE QU'ON NE SAUVEGARDE PAS : les photos. Elles arrivent en data:URI, trois
//  photos pèsent facilement plusieurs mégaoctets, et localStorage en accepte
//  environ cinq AU TOTAL pour tout le site. Les écrire ferait sauter le quota —
//  donc perdre le brouillon ET tout le reste. On garde le texte, qui est le
//  plus long à ressaisir, et on prévient honnêtement qu'il faut remettre les
//  photos.
// =============================================================================

const CLE = 'chapci.brouillon.publier.v1'

/** Ce qu'on retient. Volontairement plat : aucune photo, aucun objet imbriqué lourd. */
export interface Brouillon {
  title: string
  categoryId: string
  subcategory: string
  attrs: Record<string, string>
  condition: 'neuf' | 'occasion'
  price: string
  negotiable: boolean
  delivery: boolean
  description: string
  loc: { regionId?: string; cityId?: string; commune?: string }
  /** Horodatage d'écriture — sert à ne pas proposer un brouillon vieux de trois semaines. */
  le: number
}

/** Au-delà, on ne propose plus : l'annonce n'a plus de sens, le prix a bougé. */
const DUREE_MAX = 7 * 24 * 3600 * 1000

/**
 * Un brouillon vide ne vaut pas la peine d'être proposé.
 *
 * Ouvrir /publier, choisir une catégorie par curiosité et repartir ne doit pas
 * déclencher « voulez-vous reprendre ? » à la visite suivante. On exige donc un
 * vrai début de saisie : un titre, une description, ou un prix.
 */
function vautLaPeine(b: Brouillon): boolean {
  return b.title.trim().length >= 3 || b.description.trim().length >= 10 || b.price.trim() !== ''
}

export function ecrireBrouillon(b: Omit<Brouillon, 'le'>): void {
  try {
    const complet: Brouillon = { ...b, le: Date.now() }
    if (!vautLaPeine(complet)) { effacerBrouillon(); return }
    localStorage.setItem(CLE, JSON.stringify(complet))
  } catch { /* quota plein ou stockage refusé : on ne casse jamais la saisie pour ça */ }
}

export function lireBrouillon(): Brouillon | null {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return null
    const b = JSON.parse(brut) as Brouillon
    if (!b || typeof b !== 'object' || typeof b.le !== 'number') return null
    if (Date.now() - b.le > DUREE_MAX) { effacerBrouillon(); return null }
    return vautLaPeine(b) ? b : null
  } catch { return null }
}

export function effacerBrouillon(): void {
  try { localStorage.removeItem(CLE) } catch { /* rien à faire */ }
}

/** « il y a 3 minutes », « hier » — pour que la proposition situe le brouillon. */
export function ilYA(ms: number): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000))
  if (s < 90) return 'à l’instant'
  const m = Math.round(s / 60)
  if (m < 60) return `il y a ${m} minute${m > 1 ? 's' : ''}`
  const h = Math.round(m / 60)
  if (h < 24) return `il y a ${h} heure${h > 1 ? 's' : ''}`
  const j = Math.round(h / 24)
  return j === 1 ? 'hier' : `il y a ${j} jours`
}
