/**
 * Réécrit les DEUX endroits où le signe Chap.ci est recopié en clair :
 *
 *   · public/favicon.svg
 *   · index.html — le SVG de l'écran de démarrage
 *
 *     node scripts/poser-signe.mjs
 *
 * ⚠️ POURQUOI CE SCRIPT EXISTE, ET POURQUOI IL EST DANS LE DÉPÔT.
 * Ces deux copies datent d'avant `scripts/signe.mjs`. Chaque fois que le
 * dessin change, elles restent en arrière SANS QUE RIEN NE PROTESTE : le
 * 30/08, l'icône de l'application est sortie sans la ligne du logo pour
 * exactement cette raison. Une copie d'un dessin est une copie qui se périme.
 *
 * Il a d'abord vécu dans un dossier d'essais, hors du dépôt — ⚡ Le Mécanicien
 * l'a cherché le 31/08 et ne l'a pas trouvé. Un outil que personne ne peut
 * lancer ne sert qu'une fois.
 *
 * ⚠️ L'ARRONDI NE VAUT QUE POUR LE SPLASH. Les coordonnées du dessin ont une
 * décimale. Dans `index.html`, qui n'est JAMAIS mis en cache long, ce poids
 * se repaie à chaque visite — et le splash s'affiche à 92 px, où une demi-
 * unité de la grille 200 vaut moins d'un quart de pixel. On arrondit donc là,
 * et LÀ SEULEMENT : les icônes sont rendues jusqu'à 512 px, où la même
 * demi-unité vaut plus d'un pixel et se verrait.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import * as S from './signe.mjs'

const RACINE = new URL('..', import.meta.url)
const chemin = (r) => new URL(r, RACINE)
let fautes = 0

/** Les nombres du tracé, ramenés à l'entier. Ne touche pas aux couleurs. */
const arrondir = (svg) =>
  svg.replace(/-?\d+\.\d+/g, (n) => String(Math.round(parseFloat(n))))

// ── 1. public/favicon.svg — version COMPACTE, sur le crème ────────────────
// Un onglet fait seize pixels : la ligne « Achat, Vente, Emplois, Chap » n'y
// serait qu'une salissure grise, et l'arrondi y est sans conséquence.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- ⚠️ FICHIER GÉNÉRÉ — ne pas modifier à la main.
       Produit par scripts/poser-signe.mjs depuis
       src/components/signeChapci.ts. Toute retouche ici sera écrasée. -->
  <rect width="200" height="200" fill="#FFFDF9"/>
  ${arrondir(S.signe({ avecLigne: false }))}
</svg>
`
writeFileSync(chemin('public/favicon.svg'), favicon)
console.log(`  ✅ public/favicon.svg  (${favicon.length} octets)`)

// ── 2. index.html — le signe de l'écran de démarrage ──────────────────────
const OUVRE = '<svg viewBox="0 0 200 200" role="img" aria-label="Chap.ci">'
const FERME = '</svg>'
const html = readFileSync(chemin('index.html'), 'utf8')
const i = html.indexOf(OUVRE)
if (i < 0) {
  console.log('  ❌ index.html : le SVG du démarrage est introuvable — rien changé')
  fautes++
} else {
  const j = html.indexOf(FERME, i)
  const signe = arrondir(S.signe())
  const neuf = html.slice(0, i + OUVRE.length) + '\n        ' + signe +
               '\n      ' + html.slice(j)
  writeFileSync(chemin('index.html'), neuf)
  const brut = S.signe().length
  console.log(`  ✅ index.html  (signe arrondi : ${brut} → ${signe.length} octets, ` +
              `${Math.round((1 - signe.length / brut) * 100)} % de moins)`)
}

// ── Contrôle : on RELIT les fichiers, on ne se fie pas au « c'est passé » ──
console.log('\n── Relecture ' + '─'.repeat(54))
const drapeau = [['orange', S.ORANGE], ['cœur blanc', S.BLANC], ['vert', S.VERT]]
for (const f of ['public/favicon.svg', 'index.html']) {
  const src = readFileSync(chemin(f), 'utf8')
  for (const [nom, hex] of drapeau) {
    const dedans = src.includes(hex)
    console.log((dedans ? '  ✅ ' : '  ❌ ') + `${f} — ${nom} ${hex}`)
    if (!dedans) fautes++
  }
  // Le tracé doit être là, et arrondi : plus aucune décimale dans les points.
  const bloc = src.slice(src.indexOf('<polygon'), src.indexOf('</svg>'))
  const decimales = (bloc.match(/\d+\.\d+/g) || []).length
  console.log((decimales === 0 ? '  ✅ ' : '  ❌ ') +
              `${f} — ${decimales} coordonnée(s) à décimale (attendu 0)`)
  if (decimales !== 0) fautes++
}

console.log()
if (fautes) { console.log(`❌ ${fautes} contrôle(s) au rouge`); process.exit(1) }
console.log('✅ les deux copies sortent de src/components/signeChapci.ts')
