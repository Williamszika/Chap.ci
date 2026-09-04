/**
 * LA RECHERCHE QUI COMPREND — chantier 3 du 04/09/2026.
 *
 * Jusqu'ici la recherche cherchait la phrase tapée, telle quelle, dans le titre
 * et la description : « télé », « TV » et « télévision » étaient trois
 * recherches différentes, une faute de frappe ne trouvait rien, et « iphone 13
 * 128 » ne trouvait pas « iPhone 13 – 128 Go ». Sur une place de marché, c'est
 * ce qui décide si un acheteur trouve ou repart.
 *
 * Ici, une requête est découpée en MOTS, et chaque mot doit se retrouver dans
 * l'annonce — par l'un de ces chemins, dans cet ordre :
 *
 *   1. le même groupe de synonymes (« télé » ⇔ « tv » ⇔ « téléviseur », le
 *      dictionnaire ivoirien de src/data/synonymes.json) ;
 *   2. un début de mot, dès quatre lettres (« appart » trouve « appartement ») ;
 *   3. une faute, dès cinq lettres (« samsumg » trouve « samsung ») — une lettre
 *      d'écart, deux à partir de neuf lettres.
 *
 * Un nombre ne se cherche qu'exactement : « iphone 14 » ne trouve pas
 * « iPhone 13 ». Les petits mots de liaison de la requête (« de », « pour »…)
 * sont ignorés : « tv d'occasion » trouve « TV occasion ».
 *
 * ⚠️ CE FICHIER A DEUX JUMEAUX : flutter_app/lib/recherche.dart et les
 * fonctions recherche_*() de server/index.php. Les trois lisent le MÊME
 * dictionnaire généré, et le banc (npm run banc:comprendre) leur pose les
 * mêmes questions. Une règle changée ici se change dans les deux autres.
 */
import { GROUPES, LOCUTIONS } from '../data/synonymes'

/** Minuscules, sans accents, lettres et chiffres seulement, un espace entre les mots. */
export function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** « bouteille de gaz » → « bouteilledegaz » : une locution devient un mot. */
function souderLocutions(texte: string): string {
  let t = ` ${texte} `
  for (const [locution, mot] of LOCUTIONS) {
    if (t.includes(` ${locution} `)) t = t.split(` ${locution} `).join(` ${mot} `)
  }
  return t.trim()
}

/** « chaussures » → « chaussure », « bijoux » → « bijou ». Trois lettres et moins : intouché. */
export function singulier(mot: string): string {
  if (mot.length > 3 && (mot.endsWith('s') || mot.endsWith('x'))) return mot.slice(0, -1)
  return mot
}

/** La clé du groupe de synonymes d'un mot, ou le mot lui-même au singulier. */
export function groupe(mot: string): string {
  return GROUPES[mot] ?? GROUPES[singulier(mot)] ?? singulier(mot)
}

/** Les mots d'un texte, locutions soudées. */
export function mots(texte: string): string[] {
  return souderLocutions(normaliser(texte)).split(' ').filter(Boolean)
}

/** Les mots de liaison qu'on ne cherche pas. */
const LIAISON = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'en', 'au', 'aux', 'et', 'ou', 'pour', 'avec', 'sur', 'dans', 'the', 'd', 'l'])

/**
 * Distance de Damerau-Levenshtein (alignement optimal) : lettres changées,
 * ajoutées, retirées ou deux voisines inversées, chacune comptant un.
 */
export function distance(a: string, b: string): number {
  const la = a.length, lb = b.length
  if (la === 0) return lb
  if (lb === 0) return la
  let avant2: number[] = []
  let avant: number[] = Array.from({ length: lb + 1 }, (_, j) => j)
  for (let i = 1; i <= la; i++) {
    const ligne: number[] = [i]
    for (let j = 1; j <= lb; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(avant[j] + 1, ligne[j - 1] + 1, avant[j - 1] + cout)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, avant2[j - 2] + 1)
      ligne.push(v)
    }
    avant2 = avant
    avant = ligne
  }
  return avant[lb]
}

/** Une annonce, préparée une fois pour toutes les recherches. */
export interface TextePrepare {
  mots: string[]
  groupes: Set<string>
}

export function preparer(texte: string): TextePrepare {
  const m = mots(texte)
  return { mots: m, groupes: new Set(m.map(groupe)) }
}

const NOMBRE = /^[0-9]+$/

/** Le mot est-il dans le dictionnaire des synonymes ? */
export function connu(mot: string): boolean {
  return mot in GROUPES || singulier(mot) in GROUPES
}

/**
 * Ce mot de la requête se retrouve-t-il dans l'annonce ?
 * Un mot du dictionnaire se cherche par son groupe, et par lui seul : « clim »
 * a un sens précis (le climatiseur), il ne doit pas rattraper par le début de
 * mot la « climatisation » d'une voiture. Les autres mots ont droit au début
 * de mot et à la faute.
 */
export function correspondMot(annonce: TextePrepare, mot: string): boolean {
  if (annonce.groupes.has(groupe(mot))) return true
  if (NOMBRE.test(mot) || connu(mot)) return false
  if (mot.length >= 4) {
    for (const t of annonce.mots) if (t.startsWith(mot)) return true
  }
  if (mot.length >= 5) {
    const tolerance = mot.length >= 9 ? 2 : 1
    for (const t of annonce.mots) {
      if (NOMBRE.test(t) || Math.abs(t.length - mot.length) > tolerance) continue
      if (distance(t, mot) <= tolerance) return true
    }
  }
  return false
}

/** Les mots qu'on cherche vraiment dans une requête. */
export function motsRequete(requete: string): string[] {
  return mots(requete).filter((m) => !LIAISON.has(m) && (m.length > 1 || NOMBRE.test(m)))
}

/** L'annonce répond-elle à la requête ? Chaque mot doit s'y retrouver. Une requête vide répond oui. */
export function correspond(annonce: TextePrepare, requete: string): boolean {
  for (const m of motsRequete(requete)) if (!correspondMot(annonce, m)) return false
  return true
}
