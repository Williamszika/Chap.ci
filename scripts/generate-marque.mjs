// =============================================================================
//  LES IMAGES DE MARQUE QUI NE SONT PAS DES ICÔNES, tirées du même signe.
//
//      node scripts/generate-marque.mjs
//
//  · server/watermark.png  — le filigrane posé sur CHAQUE photo d'annonce ;
//  · assets/splash.png     — l'écran d'ouverture clair, 2732 px ;
//  · assets/splash-dark.png — le même sur fond sombre.
//
//  Les icônes carrées sont dans `generate-icons.mjs`, les bannières sociales
//  dans `generate-og.mjs`. Le partage n'est pas thématique : ces trois-là se
//  passent de police d'écriture, `sharp` suffit. Les bannières, elles, portent
//  du texte et réclament un navigateur.
//
//  ⚠️ LE FILIGRANE EST LE PLUS EXPOSÉ DE TOUS. Il est estampé au centre de
//  chaque photo téléversée (`apply_watermark`, server/index.php), à 42 % de la
//  largeur, et il y reste : les photos déjà en ligne gardent l'ancien. Ce
//  fichier ne change donc que l'AVENIR — c'est voulu, réécrire les photos des
//  annonceurs serait bien pire.
// =============================================================================

import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import * as S from './signe.mjs'

const RACINE = new URL('..', import.meta.url).pathname
const CREME = '#FFFDF9'
const ENCRE = '#1B1A17' // le fond sombre, relevé sur l'ancien splash

const ecrire = async (chemin, svg, l, h, fond) => {
  let img = sharp(Buffer.from(svg)).resize(l, h, { fit: 'fill' })
  if (fond) img = img.flatten({ background: fond })
  const buf = await img.png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(RACINE + chemin, buf)
  console.log(`  ✅ ${chemin.padEnd(26)} ${l}×${h}  ${String(buf.length).padStart(7)} o`)
  return buf
}

// ── 1. LE FILIGRANE ─────────────────────────────────────────────────────────
// Mêmes dimensions qu'avant (1376×396) : `apply_watermark` dérive la hauteur du
// rapport de l'image, changer le format changerait la taille du tampon sur
// toutes les photos à venir. On garde le format, on remplace le dessin.
//
// TOUT EN BLANC, ET LE CŒUR VIDE. Un filigrane se pose sur une photo inconnue :
// le noyau reste transparent — cerné de blanc — pour que la photo passe au
// travers au lieu d'être masquée par une pastille pleine.
//
// L'opacité est celle de l'ancien, relevée au pixel : alpha maximum 107 sur
// 255, soit 42 %. Ce n'est pas un chiffre choisi, c'est le chiffre en place —
// un filigrane plus appuyé rendrait les photos moins vendeuses.
const BLANC = '#FFFFFF'
const ALPHA_FILIGRANE = 107 / 255

// La couronne SEULE, sans le nom à l'intérieur : il est déjà écrit en grand à
// côté. Premier essai avec les deux, regardé sur une photo : le petit
// « chap.ci » du cœur, à 380 px de couronne, ne fait qu'une tache — deux fois
// le même mot dont un illisible.
const signeBlanc =
  S.couronne(BLANC) +
  `<polygon points="${S.NOYAU}" fill="none" stroke="${BLANC}" stroke-width="3"/>`

// Verrouillage horizontal : la couronne, puis le nom en grand à côté.
// Le mot mesure 90 × 37,5 unités et part de (3 ; −26) par rapport à son ancre.
const K = 7.2                       // agrandissement du mot
const MOT_L = 90 * K                // 648
const filigrane =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1376 396" width="1376" height="396">` +
  `<g transform="translate(144 8) scale(1.9)">${signeBlanc}</g>` +
  `<g transform="translate(${562.4} ${250.2}) scale(${K})">` +
  `<path fill="${BLANC}" d="${S.MOT}"/></g>` +
  `</svg>`

{
  const plein = await sharp(Buffer.from(filigrane))
    .resize(1376, 396, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  for (let i = 3; i < plein.data.length; i += 4) {
    plein.data[i] = Math.round(plein.data[i] * ALPHA_FILIGRANE)
  }
  const buf = await sharp(plein.data, {
    raw: { width: plein.info.width, height: plein.info.height, channels: 4 },
  }).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(RACINE + 'server/watermark.png', buf)
  console.log(`  ✅ ${'server/watermark.png'.padEnd(26)} 1376×396  ${String(buf.length).padStart(7)} o` +
              `  alpha max ${Math.round(255 * ALPHA_FILIGRANE)}`)
}

// ── 2. LES DEUX ÉCRANS D'OUVERTURE ──────────────────────────────────────────
// Le signe porte déjà son nom ET sa ligne : l'ancien splash y ajoutait un
// « Chap.ci » et un sous-titre en police système, deux textes de plus à tenir
// à jour. On ne garde que le signe — il dit la même chose, sans dépendre
// d'aucune police.
const splash = (fond) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="2732" height="2732">` +
  `<rect width="200" height="200" fill="${fond}"/>` +
  `<g transform="translate(100,100) scale(0.62) translate(-100,-100)">${S.signe()}</g></svg>`

await ecrire('assets/splash.png', splash(CREME), 2732, 2732, CREME)
await ecrire('assets/splash-dark.png', splash(ENCRE), 2732, 2732, ENCRE)

console.log('\n  Lancez `node scripts/verif-signe.mjs` : c’est lui qui juge.')
