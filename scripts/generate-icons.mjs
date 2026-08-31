// =============================================================================
//  TOUTES LES ICÔNES CARRÉES DE CHAP.CI, tirées du signe et de lui seul.
//
//      node scripts/generate-icons.mjs
//
//  ⚠️ POURQUOI CE FICHIER A ÉTÉ RÉÉCRIT LE 31/08/2026.
//  La version précédente ne dessinait rien : elle DÉCOUPAIT des PNG livrés
//  dans `marque/1-logo-nouveau/`, un dossier daté du 26/08. Le signe a changé
//  deux fois depuis — le 29 (vert), puis le 30 (le drapeau, retenu par le
//  Patron). Ce dossier, lui, porte encore le repère orange en goutte d'eau.
//
//  Autrement dit : les icônes du site étaient JUSTES, et lancer ce script les
//  aurait REMISES à l'ancienne marque, sans que rien ne proteste. Un générateur
//  qui recopie une image se périme ; un générateur qui redessine, non.
//
//  Désormais tout sort de `src/components/signeChapci.ts`, via `signe.mjs`,
//  comme les copies du splash (`poser-signe.mjs`) et les images de
//  l'application. Un seul dessin, un seul endroit.
//
//  Le rendu passe par `sharp`, présent dans node_modules : il rend le SVG au
//  pixel près (mesuré : 0,15 % d'écart avec Chromium sur icon-512, soit le
//  seul lissage des bords). Pas de navigateur à installer.
// =============================================================================

import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'node:fs'
import * as S from './signe.mjs'

const RACINE = new URL('..', import.meta.url).pathname
const CREME = '#FFFDF9' // le sol du site, de l'écran de démarrage et des icônes

/**
 * Les trois façons de poser le signe dans un carré. Elles ne diffèrent pas par
 * goût : chacune répare un comportement de système d'exploitation.
 *
 *  · `ronde`     — coins adoucis, fond transparent hors des coins. Le web.
 *  · `pleine`    — PLEIN CADRE, opaque. iOS pose SON masque par-dessus : des
 *                  coins transparents lui ressortent en NOIR sur l'écran
 *                  d'accueil. Play refuse aussi la transparence sur l'icône.
 *  · `masquable` — Android 12+ rogne jusqu'à un CERCLE des deux tiers du
 *                  cadre. Le signe est réduit à 66 % pour y tenir entier ;
 *                  aucun arrondi dessiné, le système ajoute le sien.
 */
const MODELES = {
  ronde: (px, rx = 42) =>
    `<rect width="200" height="200" rx="${rx}" fill="${CREME}"/>` + S.signe(),
  pleine: () => `<rect width="200" height="200" fill="${CREME}"/>` + S.signe(),
  masquable: () =>
    `<rect width="200" height="200" fill="${CREME}"/>` +
    `<g transform="translate(100,100) scale(0.66) translate(-100,-100)">${S.signe()}</g>`,
  // L'icône de l'application : le signe à 88 % du cadre, coins à peine adoucis.
  appli: () =>
    `<rect width="200" height="200" rx="21" fill="${CREME}"/>` +
    `<g transform="translate(100,100) scale(0.88) translate(-100,-100)">${S.signe()}</g>`,
}

/** [chemin, modèle, pixels, transparent hors du tracé]. */
const SORTIES = [
  // ── Le site (PWA) ───────────────────────────────────────────────────────
  ['public/icons/icon-192.png', 'ronde', 192, true],
  ['public/icons/icon-512.png', 'ronde', 512, true],
  ['public/icons/icon-maskable-192.png', 'masquable', 192, false],
  ['public/icons/icon-maskable-512.png', 'masquable', 512, false],
  ['public/apple-touch-icon.png', 'pleine', 180, false],
  // ── L'application ───────────────────────────────────────────────────────
  ['flutter_app/assets/icon/icon.png', 'appli', 1024, false],
  ['flutter_app/assets/icon/icon_maskable.png', 'masquable', 512, false],
  // ── Les boutiques : Play refuse l'alpha sur l'icône, d'où « pleine » ────
  ['store/app-icon-512.png', 'pleine', 512, false],
  ['marketing/store/icon-512.png', 'pleine', 512, false],
  // La « source » que citent GUIDE-STORES.md et GUIDE-PLAY-STORE.md.
  ['assets/icon.png', 'pleine', 1024, false],
]

const svg = (corps, px) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" ` +
  `width="${px}" height="${px}">${corps}</svg>`

// ⚠️ Le `resize` final n'est pas une précaution de style. Premier essai, avec
// `{ density: 384 }` pour affiner le rendu : sharp a multiplié la taille par
// 384/72, et `icon-512.png` est sorti en 2731 px et 328 Ko au lieu de 512 px et
// 60 Ko. Rien dans les couleurs ne le disait — c'est la taille RELUE qui l'a
// dit. Elle est imposée ici, et vérifiée par `verif-signe.mjs`.
const rendu = async (corps, px) =>
  sharp(Buffer.from(svg(corps, px)))
    .resize(px, px, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer()

for (const [chemin, modele, px, alpha] of SORTIES) {
  mkdirSync(RACINE + chemin.slice(0, chemin.lastIndexOf('/')), { recursive: true })
  let buf = await rendu(MODELES[modele](px), px)
  // « Pleine » et « masquable » couvrent déjà tout le cadre ; on aplatit malgré
  // tout sur le crème, pour qu'aucun octet d'alpha ne subsiste : Play Console
  // REFUSE le téléversement d'une icône qui en contient, même inutile.
  if (!alpha) buf = await sharp(buf).flatten({ background: CREME }).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(RACINE + chemin, buf)
  console.log(`  ✅ ${chemin.padEnd(44)} ${String(px).padStart(4)} px  ${String(buf.length).padStart(7)} o`)
}

// ── favicon.ico ─────────────────────────────────────────────────────────────
// Les navigateurs modernes prennent le .svg. L'ancien .ico traîne dans les
// favoris, les raccourcis et l'index de Google : le laisser derrière, c'est
// laisser l'ancienne marque exactement là où personne ne regarde.
// À 16 px la ligne « Achat, Vente, Emplois, Chap » ne fait qu'une salissure
// grise — on sert donc la version compacte, nom recentré.
const compact = `<rect width="200" height="200" rx="42" fill="${CREME}"/>` +
  S.signe({ avecLigne: false })
const tailles = [16, 32, 48]
const images = []
for (const px of tailles) images.push({ px, png: await rendu(compact, px) })

// En-tête ICO : 6 octets, puis 16 par image, puis les PNG bruts. Un ICO accepte
// des PNG tels quels depuis Vista — pas besoin de repasser par un bitmap BMP.
const entete = Buffer.alloc(6 + 16 * images.length)
entete.writeUInt16LE(0, 0)
entete.writeUInt16LE(1, 2)
entete.writeUInt16LE(images.length, 4)
let decalage = entete.length
images.forEach(({ px, png }, i) => {
  const o = 6 + 16 * i
  entete.writeUInt8(px, o)         // largeur   (0 signifierait 256)
  entete.writeUInt8(px, o + 1)     // hauteur
  entete.writeUInt8(0, o + 2)      // couleurs de palette : aucune
  entete.writeUInt8(0, o + 3)      // réservé
  entete.writeUInt16LE(1, o + 4)   // plans
  entete.writeUInt16LE(32, o + 6)  // bits par pixel
  entete.writeUInt32LE(png.length, o + 8)
  entete.writeUInt32LE(decalage, o + 12)
  decalage += png.length
})
const ico = Buffer.concat([entete, ...images.map((i) => i.png)])
writeFileSync(RACINE + 'public/favicon.ico', ico)
console.log(`  ✅ ${'public/favicon.ico'.padEnd(44)} ${tailles.join('/')} px  ` +
            `${String(ico.length).padStart(7)} o`)

console.log('\n  Lancez `node scripts/verif-signe.mjs` : c’est lui qui juge.')
