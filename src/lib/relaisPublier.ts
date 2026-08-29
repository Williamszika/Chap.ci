// =============================================================================
//  LE RELAIS — ce qui traverse l'aller-retour « je crée mon compte ».
//
//  POURQUOI. Le formulaire de publication s'affiche maintenant à tout le monde,
//  et le compte n'est demandé qu'au moment d'appuyer sur « Publier ». Ce moment
//  fait sortir le visiteur de l'écran : /inscription, puis retour. L'écran est
//  démonté entre les deux, et tout ce qui vivait en mémoire React disparaît.
//
//  Le TEXTE est déjà sauvé par src/lib/brouillon.ts, dans localStorage. Restent
//  les PHOTOS, que ce brouillon-là refuse volontairement de garder : elles
//  arrivent en data:URI, et localStorage n'accepte qu'environ cinq mégaoctets
//  POUR TOUT LE SITE — les y écrire ferait sauter le quota, donc perdre le
//  brouillon lui-même en plus des photos.
//
//  D'où ce second rangement, séparé et à durée de vie courte :
//
//  · sessionStorage, PAS localStorage. Son quota est distinct, et surtout son
//    contenu meurt avec l'onglet. Des photos oubliées pendant trois semaines
//    dans le téléphone de quelqu'un, ce serait notre faute ; ici elles vivent
//    le temps d'un aller-retour et pas une minute de plus.
//
//  · UN BUDGET, et l'aveu quand il est dépassé. Une photo d'annonce fait
//    150–400 Ko après compression, soit 200–550 Ko une fois encodée en texte :
//    cinq photos peuvent approcher les trois mégaoctets. Au-delà du budget, on
//    n'essaie même pas — et l'écran DIT que les photos seront à remettre, au
//    lieu de le laisser découvrir au retour.
//
//  Le relais porte aussi un simple repère de passage. C'est lui qui distingue
//  « je reviens de l'inscription, remets-moi tout en place » de « je repasse
//  ici trois jours plus tard » — le premier mérite une reprise automatique, le
//  second mérite qu'on demande d'abord.
// =============================================================================

const CLE = 'chapci.publier.relais.v1'

/**
 * Au-delà, on ne tente pas l'écriture.
 *
 * Trois millions de caractères ≈ 3 Mo. C'est large pour cinq photos ordinaires
 * et prudent face au quota de sessionStorage, qui varie selon les navigateurs
 * (Safari sur iPhone étant le plus avare).
 */
const BUDGET = 3_000_000

/** Ce que l'écran doit annoncer au sujet des photos, en une phrase honnête. */
export type EtatPhotos =
  | 'aucune'   // il n'y en avait pas : ne rien dire
  | 'gardees'  // elles seront là au retour
  | 'perdues'  // trop lourdes : à remettre, et on le dit AVANT

export interface Relais {
  images: string[]
  /**
   * Le sort des photos, DÉCIDÉ À L'ALLER et transporté jusqu'au retour.
   *
   * Sans lui, l'écran de retour ne saurait pas distinguer « il n'y avait pas de
   * photo » de « il y en avait, et elles n'ont pas tenu » : dans les deux cas il
   * ne retrouve qu'une liste vide. Or la première ne mérite aucune phrase, et
   * la seconde en mérite une.
   */
  sort: EtatPhotos
}

function ecrire(images: string[], sort: EtatPhotos): boolean {
  try {
    sessionStorage.setItem(CLE, JSON.stringify({ images, sort } satisfies Relais))
    return true
  } catch {
    // Quota plein, navigation privée, stockage refusé : jamais une erreur à
    // l'écran. On perd les photos, pas la publication.
    return false
  }
}

/**
 * Pose le relais avant de partir vers l'inscription, et dit ce qu'il advient
 * des photos. Le repère est posé DANS TOUS LES CAS, y compris quand les photos
 * ne tiennent pas : c'est lui qui déclenche la reprise automatique du texte au
 * retour, et le texte, lui, tient toujours.
 */
export function poserRelais(images: string[]): EtatPhotos {
  if (images.length === 0) { ecrire([], 'aucune'); return 'aucune' }
  const poids = images.reduce((n, s) => n + s.length, 0)
  if (poids <= BUDGET && ecrire(images, 'gardees')) return 'gardees'
  ecrire([], 'perdues')
  return 'perdues'
}

/** Le relais posé, s'il y en a un. Ne l'efface pas : voir `retirerRelais`. */
export function lireRelais(): Relais | null {
  try {
    const brut = sessionStorage.getItem(CLE)
    if (!brut) return null
    const r = JSON.parse(brut) as Relais
    if (!r || !Array.isArray(r.images)) return null
    // Une valeur bricolée à la main ne doit pas devenir une photo affichée.
    const images = r.images.filter((s) => typeof s === 'string' && s.length > 0)
    const sort: EtatPhotos =
      r.sort === 'gardees' || r.sort === 'perdues' ? r.sort : 'aucune'
    // Cohérence : un relais annoncé « gardees » mais vidé de ses photos (par un
    // nettoyage du navigateur, ou une main curieuse) ne doit pas promettre des
    // images qu'il n'a plus.
    return { images, sort: images.length ? sort : sort === 'perdues' ? 'perdues' : 'aucune' }
  } catch {
    return null
  }
}

/**
 * Retire le relais — à faire dès qu'il a servi, ou dès qu'on renonce à partir.
 * Laisser trois mégaoctets de photos derrière soi n'a aucun intérêt.
 */
export function retirerRelais(): void {
  try { sessionStorage.removeItem(CLE) } catch { /* rien à faire */ }
}
