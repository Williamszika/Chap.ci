// =============================================================================
//  Le registre des formulaires par sous-catégorie, et leur traduction.
//
//  Douze catégories, quatre-vingt-deux sous-catégories. L'immobilier n'est pas
//  ici : il a son propre dossier foncier (`foncier.ts`, `FoncierDocs`), écrit
//  avant les autres et plus riche que ce contrat.
//
//  Ce fichier fait UNE chose : traduire le contrat court des schémas vers le
//  vocabulaire du reste de l'application, et résoudre tout ce qui dépend de ce
//  que le vendeur a déjà rempli — les options d'une liste qui découlent d'une
//  autre (marque → modèles), une aide qui change de ton, une couleur qui n'a
//  plus lieu d'être. Au-delà de cette frontière, plus personne ne voit `k`,
//  `l` ni `o`.
// =============================================================================
import { enregistrerCouleurs, type Couleur } from '../couleurs'
import type { AttrField, CategoryForm } from '../categoryForms'
import type { ChampCourt, DonneesCat, SchemaSous, Selon, Vals } from './contrat'

import { VEHICULES } from './vehicules'
import { MODE } from './mode'
import { ELECTRONIQUE } from './electronique'
import { MAISON } from './maison'
import { EMPLOI } from './emploi'
import { SERVICES } from './services'
import { MATERIEL } from './materiel'
import { ALIMENTATION } from './alimentation'
import { ANIMAUX } from './animaux'
import { LOISIRS } from './loisirs'
import { BEBE } from './bebe'
import { SANTE } from './sante'

/** Les données par identifiant de catégorie — les mêmes ids que `categories.ts`. */
export const DONNEES_SOUS: Record<string, DonneesCat> = {
  vehicules: VEHICULES,
  mode: MODE,
  electronique: ELECTRONIQUE,
  maison: MAISON,
  emploi: EMPLOI,
  services: SERVICES,
  // L'identifiant garde son tiret : c'est celui sous lequel les annonces
  // existantes sont enregistrées. Le renommer les orphelinerait toutes.
  'materiel-pro': MATERIEL,
  alimentation: ALIMENTATION,
  animaux: ANIMAUX,
  loisirs: LOISIRS,
  bebe: BEBE,
  sante: SANTE,
}

/** Toutes les couleurs que ces schémas peuvent proposer, toutes palettes confondues. */
export const COULEURS_DES_SOUS: Couleur[] = Object.values(DONNEES_SOUS).flatMap((d) => d.toutesCouleurs)

// Les palettes des métiers rejoignent le répertoire général dès que ce fichier
// est chargé. Sans cela, une annonce enregistrée en « Iroko » ou en « 1B ·
// Noir naturel » se relirait sans sa pastille, et disparaîtrait des filtres.
enregistrerCouleurs(COULEURS_DES_SOUS)

// -----------------------------------------------------------------------------
//  Résolution
// -----------------------------------------------------------------------------

function selon<T>(v: Selon<T> | undefined, S: Vals, defaut: T): T {
  if (v === undefined) return defaut
  return typeof v === 'function' ? (v as (s: Vals) => T)(S) : v
}

/**
 * Les réponses telles que les schémas les attendent.
 *
 * L'application range tout en texte — un choix multiple devient « A, B ». Les
 * schémas, eux, lisent `(S.metier || []).join(', ')`. On rend donc leur forme
 * de liste aux champs à choix multiple avant de leur passer la main, et on
 * ajoute `_sub` : plusieurs conditions dépendent de la sous-catégorie.
 */
function valeurs(schema: SchemaSous, attrs: Record<string, string>, sous: string): Vals {
  const S: Vals = { ...attrs, _sub: sous }
  for (const c of schema.champs) {
    if (c.multi) {
      S[c.k] = (attrs[c.k] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    }
  }
  return S
}

/** Le schéma d'une sous-catégorie, ou celui de la première si aucune n'est choisie. */
function schemaDe(categoryId: string, sous: string): { data: DonneesCat; schema: SchemaSous; sous: string } | null {
  const data = DONNEES_SOUS[categoryId]
  if (!data) return null
  // « Toutes » (ou rien) : on prend la première sous-catégorie. C'est la plus
  // courante, et cela vaut mieux qu'un formulaire vide — le vendeur voit
  // aussitôt de quoi on va lui parler, et affinera en choisissant.
  const nom = data.schemas[sous] ? sous : data.sous[0]
  return { data, schema: data.schemas[nom], sous: nom }
}

/** Le champ, traduit et résolu pour l'état actuel du formulaire. */
function traduire(c: ChampCourt, S: Vals, schema: SchemaSous, sous: string): AttrField {
  // Les options d'une liste qui découle d'une autre : la marque commande les
  // modèles. Tant que la marque n'est pas choisie, la liste est vide — et le
  // champ ne s'affiche pas (voir `when` plus bas).
  const options = c.dependDe && c.table ? (c.table[String(S[c.dependDe] ?? '')] ?? []) : c.o

  const aide = selon(c.h, S, '')
  // Un `!` en tête : ce n'est plus un conseil, c'est un avertissement.
  const rouge = aide.startsWith('!')

  return {
    key: c.k,
    label: c.l,
    type: c.t === 'num' ? 'number' : c.t === 'toggle' ? 'toggle' : c.multi ? 'multi' : options ? 'chips' : 'text',
    options,
    placeholder: c.ph,
    unit: c.unite,
    help: rouge ? aide.slice(1) : aide || undefined,
    helpRouge: rouge,
    required: c.req,
    varOK: c.varOK,
    labelVar: c.lVar,
    when: (a) => {
      const V = valeurs(schema, a, sous)
      if (c.dependDe && c.table && !(c.table[String(V[c.dependDe] ?? '')] ?? []).length) return false
      return c.when ? c.when(V) : true
    },
  }
}

/** Ce que la fiche affiche en tête : la réponse qui change la décision. */
export interface Bandeau {
  /** Vrai = la réponse rassure ; faux = elle appelle une vérification. */
  bon: boolean
  texte: string
}

/** Un formulaire de sous-catégorie, résolu pour l'état courant. */
export interface FormSous extends CategoryForm {
  /** Proposer le bloc couleurs ? Un bijou, non : son métal le dit déjà. */
  couleurs: boolean
  /** La palette du métier : essences de bois, carnations, numéros de mèches. */
  palette: Couleur[]
  /** Le mot juste : « Couleurs », « Coloris », « Teintes », « Essences ». */
  labCouleurs: string
  aideCouleurs?: string
  /** Ce qu'on dit à la place, quand il n'y a pas de couleur à choisir. */
  sansCouleur?: string
  aideCoulChamp?: string
  /** Les bandeaux, l'alerte avant la réassurance. Vide tant qu'on n'a pas répondu. */
  bandeaux: Bandeau[]
  /** Les raisons qui interdisent de publier — vide dans le cas normal. */
  blocages: string[]
}

/**
 * Les bandeaux : les réponses qui changent la décision de l'acheteur.
 *
 * La règle est une question par sous-catégorie, et elle tient presque partout.
 * Onze font exception, toujours pour la même raison : une SECONDE question
 * n'apparaît que dans un cas précis, et devient alors la plus importante. Sur
 * une voiture, la carte grise décide — sauf si la voiture est électrique, où
 * la santé de la batterie EST la valeur du véhicule. Sur une poussette, le
 * rappel fabricant décide — sauf sur un siège auto, où la norme le fait.
 *
 * N'en garder qu'une revenait à faire disparaître un avertissement en
 * silence. On les affiche donc toutes, l'alerte avant la réassurance : ce qui
 * inquiète doit se lire en premier, jamais être masqué par un feu vert.
 *
 * Un champ à choix multiple ne peut pas porter de bandeau — sa valeur est une
 * liste, jamais la réponse unique qu'on compare. Le cas est écarté ici plutôt
 * que laissé produire un bandeau éternellement rouge.
 */
function bandeauxDe(schema: SchemaSous, S: Vals): Bandeau[] {
  const trouves: Bandeau[] = []
  for (const c of schema.champs) {
    if (!c.alerte || c.multi) continue
    // Une question invisible n'a pas d'avis à donner : la batterie ne dit rien
    // d'une voiture à essence.
    if (c.when && !c.when(S)) continue
    const val = String(S[c.k] ?? '')
    if (!val) continue
    const a = c.alerte
    const bon = val === a.bon || (a.ok ?? []).includes(val)
    const texte = (a.textes && a.textes[val]) || (bon ? a.texteBon : a.texteMauvais) || ''
    if (texte) trouves.push({ bon, texte })
  }
  return trouves.sort((x, y) => Number(x.bon) - Number(y.bon))
}

/** Les réponses qui interdisent la publication, avec ce qu'il faut faire à la place. */
function blocagesDe(schema: SchemaSous, S: Vals): string[] {
  return schema.champs
    .filter((c) => c.bloque && c.bloque.includes(String(S[c.k] ?? '')))
    .map((c) => c.motifBloc || `« ${c.l} » interdit la publication.`)
}

/**
 * Le formulaire complet d'une sous-catégorie, résolu pour ce qui est déjà
 * rempli. Renvoie `null` pour les catégories qui n'ont pas de schéma détaillé
 * (l'immobilier, qui a mieux).
 */
export function formSous(
  categoryId: string,
  sous: string,
  attrs: Record<string, string>,
): FormSous | null {
  const trouve = schemaDe(categoryId, sous)
  if (!trouve) return null
  const { data, schema } = trouve
  const S = valeurs(schema, attrs, trouve.sous)

  const couleurs = selon(schema.couleurs, S, false)
  const fields = schema.champs.map((c) => traduire(c, S, schema, trouve.sous))
  // Le bloc couleurs vient après les questions du métier : on décrit d'abord
  // ce qu'on vend, on décline ensuite.
  if (couleurs) {
    fields.push({
      key: 'couleurs',
      type: 'colors',
      label: selon(schema.labCouleurs, S, 'Couleurs'),
      help: selon(schema.aideCouleurs, S, '') || undefined,
    })
  }

  return {
    condition: selon(schema.etat, S, false),
    delivery: !!schema.livraison,
    priceLabel: schema.prixLabel,
    titlePlaceholder: schema.titre ? schema.titre(S) || undefined : undefined,
    fields,
    couleurs,
    palette: selon(schema.palette, S, data.paletteBase),
    labCouleurs: selon(schema.labCouleurs, S, 'Couleurs'),
    aideCouleurs: selon(schema.aideCouleurs, S, '') || undefined,
    sansCouleur: selon(schema.sansCouleur, S, '') || undefined,
    aideCoulChamp: selon(schema.aideCoulChamp, S, '') || undefined,
    bandeaux: bandeauxDe(schema, S),
    blocages: blocagesDe(schema, S),
  }
}

/** Les sous-catégories d'une catégorie, dans l'ordre des schémas. */
export function sousDe(categoryId: string): string[] {
  return DONNEES_SOUS[categoryId]?.sous ?? []
}
