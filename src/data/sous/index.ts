// =============================================================================
//  Le registre des formulaires par sous-catégorie, et leur traduction.
//
//  Quatorze catégories, quatre-vingt-quinze sous-catégories. L'immobilier n'est
//  pas ici : il a son propre dossier foncier (`foncier.ts`, `FoncierDocs`),
//  écrit avant les autres et plus riche que ce contrat.
//
//  Ce fichier fait UNE chose : traduire le contrat court des schémas vers le
//  vocabulaire du reste de l'application, et résoudre tout ce qui dépend de ce
//  que le vendeur a déjà rempli — les options d'une liste qui découlent d'une
//  autre (marque → modèles), une aide qui change de ton, une couleur qui n'a
//  plus lieu d'être. Au-delà de cette frontière, plus personne ne voit `k`,
//  `l` ni `o`.
// =============================================================================
import { useEffect, useState } from 'react'
import type { Couleur } from '../couleurs'
import type { AttrField, CategoryForm } from '../categoryForms'
import type { ChampCourt, DonneesCat, SchemaSous, Selon, Vals } from './contrat'

/**
 * Un chargeur par catégorie — et PAS un import statique.
 *
 * `import()` demande à Vite de découper : chaque catégorie devient un fichier
 * à part, téléchargé seulement quand quelqu'un ouvre une annonce ou un
 * formulaire de cette catégorie-là. Le paquet de démarrage n'en porte aucun.
 *
 * Écrire les chemins EN CLAIR est obligatoire : `import('./' + id)` empêcherait
 * Vite de savoir quoi découper, et il embarquerait tout par sécurité — le
 * problème qu'on vient précisément de corriger.
 *
 * L'identifiant `materiel-pro` garde son tiret : c'est celui sous lequel les
 * annonces existantes sont enregistrées. Le renommer les orphelinerait toutes.
 */
const CHARGEURS: Record<string, () => Promise<Record<string, DonneesCat>>> = {
  vehicules: () => import('./vehicules'),
  mode: () => import('./mode'),
  electronique: () => import('./electronique'),
  maison: () => import('./maison'),
  emploi: () => import('./emploi'),
  services: () => import('./services'),
  'materiel-pro': () => import('./materiel'),
  alimentation: () => import('./alimentation'),
  animaux: () => import('./animaux'),
  loisirs: () => import('./loisirs'),
  bebe: () => import('./bebe'),
  sante: () => import('./sante'),
  voyage: () => import('./voyage'),
  'a-donner': () => import('./donner'),
}

/** Les catégories qui possèdent un formulaire détaillé. */
export const CATEGORIES_A_SCHEMA = Object.keys(CHARGEURS)

// Une fois chargée, une catégorie reste en mémoire : rouvrir une annonce de la
// même catégorie ne redemande rien, et le formulaire s'affiche du premier coup.
const charges = new Map<string, DonneesCat>()
const enCours = new Map<string, Promise<DonneesCat | null>>()

/** Le schéma d'une catégorie s'il est déjà en mémoire, sinon `null`. */
export function schemaCharge(categoryId: string): DonneesCat | null {
  return charges.get(categoryId) ?? null
}

/** Charge le schéma d'une catégorie. Deux appels simultanés ne téléchargent qu'une fois. */
export function chargerSchema(categoryId: string): Promise<DonneesCat | null> {
  const deja = charges.get(categoryId)
  if (deja) return Promise.resolve(deja)
  const encours = enCours.get(categoryId)
  if (encours) return encours
  const chargeur = CHARGEURS[categoryId]
  if (!chargeur) return Promise.resolve(null)
  const p = chargeur()
    .then((mod) => {
      // Le module exporte sa catégorie sous un nom en majuscules (VEHICULES,
      // MODE…). On prend la première valeur qui ressemble à un jeu de schémas
      // plutôt que de maintenir une seconde table de correspondance.
      const data = Object.values(mod).find((v) => v && typeof v === 'object' && 'schemas' in v)
      if (data) charges.set(categoryId, data)
      return data ?? null
    })
    .catch(() => null) // réseau coupé : la fiche s'affiche sans ses attributs
    .finally(() => { enCours.delete(categoryId) })
  enCours.set(categoryId, p)
  return p
}

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
  const data = charges.get(categoryId)
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

// `sousDe` et `NOMS_SOUS` vivent dans `noms.ts` : ce sont les seules données
// dont l'accueil et l'explorateur ont besoin, et elles doivent rester
// disponibles sans télécharger le moindre schéma.
export { sousDe, NOMS_SOUS } from './noms'

/**
 * Le formulaire d'une sous-catégorie, chargé à la demande.
 *
 * Rend `null` le temps que le schéma de la catégorie arrive — quelques
 * dizaines de millisecondes la première fois, zéro ensuite (il reste en
 * mémoire). Les deux écrans qui l'utilisent savent déjà quoi faire d'un
 * `null` : ils retombent sur le formulaire générique de `categoryForms.ts`.
 * L'annonce s'affiche donc tout de suite, ses attributs détaillés arrivent
 * juste après — plutôt qu'un écran vide le temps du téléchargement.
 */
export function useFormSous(
  categoryId: string,
  sous: string,
  attrs: Record<string, string>,
): FormSous | null {
  const [pret, setPret] = useState(() => !!schemaCharge(categoryId))

  useEffect(() => {
    if (!categoryId) return
    if (schemaCharge(categoryId)) { setPret(true); return }
    setPret(false)
    let vivant = true
    chargerSchema(categoryId).then(() => { if (vivant) setPret(true) })
    return () => { vivant = false }
  }, [categoryId])

  // `pret` ne sert qu'à provoquer un nouveau rendu : c'est `formSous` qui lit
  // le cache. Le lire ici garantit qu'on ne rend jamais un schéma périmé.
  void pret
  return formSous(categoryId, sous, attrs)
}
