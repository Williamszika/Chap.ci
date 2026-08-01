// =============================================================================
//  Couleurs proposées dans les formulaires d'annonce.
//
//  Une liste FERMÉE, et courte à dessein : « bleu alpin », « graphite sidéral »
//  et autres noms marketing vont dans le titre ou la description. Ici, il
//  s'agit de cocher vite et de filtrer juste — quinze teintes suffisent à
//  décrire ce qui se vend sur le marché.
//
//  `css` sert à peindre la pastille (formulaire ET fiche) : montrer la couleur
//  vaut mieux que l'écrire. Les teintes claires portent `clair` pour recevoir
//  un liseré, sans quoi « Blanc » disparaît sur fond blanc.
// =============================================================================

export interface Couleur {
  nom: string
  css: string
  /** Teinte claire : la pastille reçoit un liseré pour rester visible. */
  clair?: boolean
}

export const COULEURS: Couleur[] = [
  { nom: 'Noir', css: '#1B1A17' },
  { nom: 'Blanc', css: '#FFFFFF', clair: true },
  { nom: 'Gris', css: '#9CA3AF' },
  { nom: 'Argenté', css: 'linear-gradient(135deg, #F3F4F6, #9CA3AF)', clair: true },
  { nom: 'Doré', css: 'linear-gradient(135deg, #F5D882, #D4AF37)', clair: true },
  { nom: 'Bleu', css: '#2563EB' },
  { nom: 'Vert', css: '#16A34A' },
  { nom: 'Rouge', css: '#DC2626' },
  { nom: 'Orange', css: '#F97316' },
  { nom: 'Jaune', css: '#FACC15', clair: true },
  { nom: 'Rose', css: '#EC4899' },
  { nom: 'Violet', css: '#8B5CF6' },
  { nom: 'Marron', css: '#92400E' },
  { nom: 'Beige', css: '#E8D8C3', clair: true },
  { nom: 'Multicolore', css: 'conic-gradient(#F77F00, #FACC15, #16A34A, #2563EB, #8B5CF6, #EC4899, #F77F00)' },
]

/**
 * Le répertoire des couleurs connues — celui qui permet de relire une annonce.
 *
 * Les quinze teintes ci-dessus ne suffisent plus : chaque sous-catégorie
 * propose la palette de son métier. Un meuble se décline en iroko, teck et
 * wengé ; un fond de teint en carnations ; une mèche en numéros (1B, 27, 613).
 * Une annonce enregistrée avec « Iroko » doit pouvoir se relire des mois plus
 * tard — sur la fiche, dans les filtres — sans qu'on sache de quelle
 * sous-catégorie elle vient. Il faut donc les connaître toutes.
 */
const PAR_NOM: Record<string, Couleur> = Object.fromEntries(COULEURS.map((c) => [c.nom, c]))

/**
 * Ajoute les palettes des métiers au répertoire.
 *
 * Pourquoi un enregistrement, et non un simple `import` : ce fichier ne doit
 * RIEN emprunter à `data/sous/`, qui lui emprunte déjà `COULEURS`. Les deux
 * s'important l'un l'autre, celui qui démarre le second trouve le premier à
 * moitié construit — `COULEURS` vaut `undefined` au moment où on le parcourt,
 * et l'application ne s'ouvre plus. Le sens de lecture est donc à sens
 * unique : `sous/` connaît les couleurs, les couleurs ne connaissent pas
 * `sous/` et attendent qu'on vienne les compléter.
 *
 * Un nom déjà connu n'est pas remplacé : les quinze teintes générales font foi.
 */
export function enregistrerCouleurs(liste: Couleur[]): void {
  for (const c of liste) if (!PAR_NOM[c.nom]) PAR_NOM[c.nom] = c
}

/** La couleur portant ce nom, ou null pour une valeur libre / inconnue. */
export function couleurParNom(nom: string): Couleur | null {
  return PAR_NOM[nom.trim()] ?? null
}

/** « Noir, Bleu » → [Couleur, Couleur] — les noms inconnus sont ignorés sans bruit. */
export function lireCouleurs(v?: string): Couleur[] {
  return (v ?? '')
    .split(',')
    .map((s) => couleurParNom(s))
    .filter((c): c is Couleur => c !== null)
}

// -----------------------------------------------------------------------------
//  Variantes par couleur.
//
//  Une couleur cochée peut porter SA photo, SON prix et SES détails — le
//  vendeur qui a le même téléphone en noir et en bleu ne publie qu'une
//  annonce, mais l'acheteur voit chaque version.
//
//  Le stockage réutilise les attributs texte de l'annonce, sur le modèle des
//  numéros de documents fonciers (`num_<doc>`) :
//    var_Noir_photo = "2"        → index dans les photos de l'annonce
//    var_Noir_prix  = "85000"    → prix propre à cette couleur (sinon le prix principal)
//    var_Noir_note  = "128 Go"   → détails propres à cette couleur
//  Rien à changer côté serveur : ce sont des paires clé/valeur comme les autres.
// -----------------------------------------------------------------------------

export type ChampVariante = 'photo' | 'prix' | 'note'

export function cleVariante(nom: string, champ: ChampVariante): string {
  return `var_${nom}_${champ}`
}

export interface Variante {
  couleur: Couleur
  /** Index de la photo dans `images`, ou null si aucune photo n'est liée. */
  photo: number | null
  prix: number | null
  note: string
}

/** Les variantes déclarées, dans l'ordre des couleurs cochées. */
export function lireVariantes(attrs: Record<string, string>, nbPhotos: number): Variante[] {
  return lireCouleurs(attrs.couleurs).map((c) => {
    const rawPhoto = attrs[cleVariante(c.nom, 'photo')] ?? ''
    const photo = /^\d+$/.test(rawPhoto) && Number(rawPhoto) < nbPhotos ? Number(rawPhoto) : null
    const rawPrix = (attrs[cleVariante(c.nom, 'prix')] ?? '').replace(/\D/g, '')
    return {
      couleur: c,
      photo,
      prix: rawPrix !== '' ? Number(rawPrix) : null,
      note: (attrs[cleVariante(c.nom, 'note')] ?? '').trim(),
    }
  })
}

/** Au moins une couleur porte une photo, un prix ou une note. */
export function aDesVariantes(attrs: Record<string, string>, nbPhotos: number): boolean {
  return lireVariantes(attrs, nbPhotos).some((v) => v.photo !== null || v.prix !== null || v.note !== '')
}
