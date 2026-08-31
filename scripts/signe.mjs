// La SOURCE du signe, lue là où elle vit : src/components/signeChapci.ts.
//
// ⚠️ POURQUOI CE FICHIER EXISTE. Les générateurs d'icônes lisaient un
// `signe-complet.txt` fabriqué à la main. Le 30/08 la ligne « Achat, Vente,
// Emplois, Chap » a été rendue au logo — et ce fichier-là, lui, ne l'a pas
// eue : les PNG de l'application sont sortis SANS la ligne, sans que rien ne
// proteste. Une copie d'un dessin est une copie qui se périme.
//
// Désormais tout le monde importe d'ici, et d'ici seulement.

import { readFileSync } from 'node:fs'

const TS = readFileSync(new URL('../src/components/signeChapci.ts', import.meta.url), 'utf8')

/** Extrait `export const NOM = '...'` (chaîne simple sur une ligne). */
function chaine(nom) {
  const m = TS.match(new RegExp(`export const ${nom}\\s*=\\s*\\n?\\s*'([^']*)'`))
  if (!m) throw new Error(`signeChapci.ts : ${nom} introuvable`)
  return m[1]
}
function nombre(nom) {
  const m = TS.match(new RegExp(`export const ${nom}\\s*=\\s*([0-9.]+)`))
  if (!m) throw new Error(`signeChapci.ts : ${nom} introuvable`)
  return parseFloat(m[1])
}

export const NOYAU = chaine('NOYAU')
export const MOT = chaine('MOT')
export const LIGNE = chaine('LIGNE')
export const MOT_X = nombre('MOT_X')
export const MOT_Y = nombre('MOT_Y')
export const LIGNE_X = nombre('LIGNE_X')
export const LIGNE_Y = nombre('LIGNE_Y')
export const SEUIL_LIGNE = nombre('SEUIL_LIGNE')

/** Les 68 feuilles : [tracé, rotation]. */
export const FEUILLES = (() => {
  const bloc = TS.match(/export const FEUILLES[^=]*=\s*\[([\s\S]*?)\n\]/)
  if (!bloc) throw new Error('signeChapci.ts : FEUILLES introuvable')
  const out = []
  for (const m of bloc[1].matchAll(/\['([^']+)',\s*'([^']+)'\]/g)) out.push([m[1], m[2]])
  if (out.length < 60) throw new Error(`FEUILLES : ${out.length} feuilles, attendu ~68`)
  return out
})()

export const VERT = '#009E60'
export const VERT_F = '#00734A'
export const VERT_P = '#005C3B' // vert PROFOND — le seul lisible sur l'orange
export const ORANGE = '#F77F00'
export const BLANC = '#FFFFFF'

/**
 * LES DEUX MOITIÉS DE LA COURONNE — c'est ce qui fait le drapeau.
 * Le côté se lit dans la rotation de chaque feuille, qui porte son centre.
 * 34 à gauche, 34 à droite : le partage tombe juste.
 */
const MOITIES = (() => {
  const g = [], d = []
  for (const f of FEUILLES) (Number(f[1].split(' ')[1]) < 100 ? g : d).push(f)
  return { gauche: g, droite: d }
})()

const groupe = (feuilles, fill) =>
  `<g fill="${fill}">` +
  feuilles.map(([d, r]) => `<path d="${d}" transform="rotate(${r})"/>`).join('') +
  `</g>`

/** La couronne : feuilles gauche + feuilles droite, en deux couleurs. */
export const couronne = (fillG, fillD = fillG) =>
  groupe(MOITIES.gauche, fillG) + groupe(MOITIES.droite, fillD)

/** Le cœur : la bande blanche du drapeau, cernée pour tenir sur le crème. */
export const coeur = (fill = BLANC, cerne = VERT_F) =>
  `<polygon points="${NOYAU}" fill="${fill}"/>` +
  `<polygon points="${NOYAU}" fill="none" stroke="${cerne}" stroke-width="3"/>`

/** Le nom « chap.ci » seul. `y` par défaut = sa place dans le signe complet. */
export const mot = (fill, y = MOT_Y) =>
  `<path fill="${fill}" transform="translate(${MOT_X} ${y})" d="${MOT}"/>`

/** La ligne « Achat, Vente, Emplois, Chap » seule. */
export const ligne = (fill) =>
  `<path fill="${fill}" fill-opacity="0.82" transform="translate(${LIGNE_X} ${LIGNE_Y})" d="${LIGNE}"/>`

/**
 * Le signe entier — proposition B, « le cœur blanc », retenue par le Patron
 * le 30/08 : « le logo peux avoir toutes les couleurs de la Côte d'Ivoire ».
 *
 * `blanc` = pour un fond COLORÉ (le bandeau orange). Les feuilles y passent
 * toutes au vert profond : mesuré sur #F77F00, le vert de marque ne rend que
 * 1,32:1 et le blanc 2,63:1 — la couronne s'effacerait. #005C3B rend 3,08:1.
 * L'orange n'est pas perdu : c'est le fond lui-même qui le porte.
 *
 * `avecLigne` = false rend la version compacte (nom recentré à y=110).
 */
export function signe({ blanc = false, avecLigne = true } = {}) {
  const g = blanc ? VERT_P : ORANGE
  const d = blanc ? VERT_P : VERT
  const t = blanc ? VERT_P : VERT_F
  return couronne(g, d) + coeur(BLANC, t) + mot(t, avecLigne ? MOT_Y : 110) +
    (avecLigne ? ligne(t) : '')
}

/** Enveloppe SVG complète, prête à écrire dans un fichier .svg. */
export const svg = (contenu, taille) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"` +
  (taille ? ` width="${taille}" height="${taille}"` : '') + `>${contenu}</svg>`
