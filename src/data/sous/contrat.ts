// =============================================================================
//  Le contrat des formulaires par sous-catégorie.
//
//  Chap.ci ne pose plus les mêmes questions à qui vend un terrain et à qui
//  vend un poulet. Chaque sous-catégorie — quatre-vingt-deux au total — a son
//  propre formulaire, écrit à partir de ce qui se passe réellement sur le
//  marché ivoirien : ce que l'acheteur regarde avant de payer, et l'arnaque
//  précise qu'il faut lui éviter.
//
//  POURQUOI CE CONTRAT EST SI COURT (`k`, `l`, `o`, `h`…)
//  Ces quatre-vingt-deux schémas font plus de quatre mille lignes. Écrits avec
//  des noms longs — `key`, `label`, `options`, `help` — ils en feraient six
//  mille, et deviendraient illisibles : on ne verrait plus les questions, on ne
//  verrait plus que la plomberie. Le contrat court est donc volontaire, et il
//  s'arrête ici : `adapter.ts` le traduit une fois pour toutes vers le
//  vocabulaire complet du reste de l'application, qui ne le connaît pas.
//
//  Ces schémas ont d'abord vécu comme aperçus autonomes (`maquettes/`), où
//  chaque sous-catégorie a été ouverte, remplie et relue au navigateur avant
//  d'arriver ici. C'est de là que vient la forme.
// =============================================================================
import type { Couleur } from '../couleurs'

/**
 * Les réponses déjà saisies, telles que le formulaire les tient en mémoire.
 *
 * `any` est assumé : une valeur est tantôt un texte (« Toyota »), tantôt une
 * liste (les tailles cochées), et les schémas la manipulent des deux façons
 * — `S.marque === 'Toyota'` d'un côté, `(S.tailles || []).join(', ')` de
 * l'autre. Typer cela finement obligerait à annoter quatre mille lignes de
 * données pour ne rien gagner : ce qui protège vraiment ces schémas, c'est le
 * banc d'essai qui les ouvre un par un au navigateur, coche chaque puce et
 * relit chaque bandeau (`maquettes/formulaires/verif.mjs`). Le reste de
 * l'application, lui, reste entièrement typé — la frontière est `adapter.ts`.
 */
export type Vals = Record<string, any>

/** Une valeur qui peut se calculer à partir de ce qui est déjà rempli. */
export type Selon<T> = T | ((S: Vals) => T)

/**
 * Le bandeau de la fiche : UNE question par sous-catégorie, celle dont la
 * réponse change la décision de l'acheteur. La carte grise pour une voiture,
 * l'IMEI pour un téléphone, les frais demandés pour une offre d'emploi.
 *
 * Elle ne juge pas le vendeur : ce qui est refusé, c'est le silence, jamais le
 * défaut. « Vendu pour pièces », « copie assumée », « en panne » passent en
 * vert — ce sont des réponses honnêtes.
 */
export interface Alerte {
  /** La réponse qui fait passer le bandeau au vert. */
  bon?: string
  /** Les autres réponses acceptables (vert également). */
  ok?: string[]
  /** Le texte affiché quand la réponse est bonne. */
  texteBon?: string
  /** Le texte affiché sinon — sauf si `textes` en prévoit un plus précis. */
  texteMauvais?: string
  /** Un texte par réponse, quand la nuance mérite mieux qu'un message unique. */
  textes?: Record<string, string>
}

/** Un champ du formulaire, dans le contrat court. */
export interface ChampCourt {
  /** Clé de stockage dans les attributs de l'annonce. */
  k: string
  /** Libellé affiché. */
  l: string
  /** Les choix proposés (puces). Absent = champ de saisie. */
  o?: string[]
  /** `text` par défaut ; `num` pour un nombre ; `toggle` pour un oui/non. */
  t?: 'text' | 'num' | 'toggle'
  /** Plusieurs réponses possibles. */
  multi?: boolean
  /** Exigé pour publier. */
  req?: boolean
  /** Ce champ peut être précisé couleur par couleur (tailles par coloris). */
  varOK?: boolean
  /** Le libellé abrégé du champ dans le bloc « variantes ». */
  lVar?: string
  /** Les options dépendent d'un autre champ (marque → modèles). */
  dependDe?: string
  /** La table de correspondance de `dependDe`. */
  table?: Record<string, string[]>
  /**
   * Autorise une réponse libre en plus des puces. Une chaîne donne son
   * libellé au choix qui l'ouvre (« Autre », « Autre marque »…) — aucune
   * liste ne couvre tout un marché, et un vendeur bloqué s'en va.
   */
  libre?: boolean | string
  /** Le champ ne s'affiche que si… */
  when?: (S: Vals) => boolean
  /** Aide sous le champ. Un `!` en tête la passe en rouge. */
  h?: Selon<string>
  /** Unité affichée dans le champ (km, m², W…). */
  unite?: string
  /** Exemple en filigrane. */
  ph?: string
  /** Fait de ce champ le bandeau de la fiche. Un seul par sous-catégorie. */
  alerte?: Alerte
  /** Les réponses qui interdisent la publication. */
  bloque?: string[]
  /** Pourquoi la publication est refusée, et quoi faire à la place. */
  motifBloc?: string
}

/** Le formulaire d'une sous-catégorie. */
export interface SchemaSous {
  /** Proposer le bloc couleurs — souvent conditionnel (un bijou, non). */
  couleurs?: Selon<boolean>
  /** La palette du métier : teintes de bois, carnations, numéros de mèches… */
  palette?: Selon<Couleur[]>
  /** Proposer « occasion / neuf ». Un emploi, non. */
  etat?: Selon<boolean>
  /** Proposer « livraison possible ». */
  livraison?: boolean
  /**
   * On vend un savoir-faire, pas un objet : réparation, cours, chantier,
   * couture. La galerie se fait discrète — un carré de photo vide au-dessus
   * d'une offre de service n'est pas une absence de photo, c'est un trou.
   */
  service?: boolean
  /** Le libellé du prix : « Salaire mensuel », « Tarif à partir de »… */
  prixLabel?: string
  /** Un exemple de titre composé à partir de ce qui est rempli. */
  titre?: (S: Vals) => string
  champs: ChampCourt[]
  /** Ce qu'on dit à la place du bloc couleurs quand il n'y en a pas. */
  sansCouleur?: Selon<string>
  /** L'aide au-dessus des pastilles. */
  aideCouleurs?: Selon<string>
  /** Le mot juste : « Couleurs », « Coloris », « Teintes », « Essences ». */
  labCouleurs?: Selon<string>
  /** L'aide du champ déclinable par couleur. */
  aideCoulChamp?: Selon<string>
}

/** Tout ce qu'une catégorie apporte. */
export interface DonneesCat {
  /** Les sous-catégories, dans l'ordre où elles s'affichent. */
  sous: string[]
  /** La palette par défaut de la catégorie. */
  paletteBase: Couleur[]
  /** Toutes les couleurs que la catégorie peut produire, palettes comprises. */
  toutesCouleurs: Couleur[]
  /** Un schéma par sous-catégorie. */
  schemas: Record<string, SchemaSous>
}
