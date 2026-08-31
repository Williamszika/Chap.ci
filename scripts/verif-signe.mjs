// =============================================================================
//  EST-CE QUE TOUTES LES IMAGES DE CHAP.CI PORTENT LE SIGNE DU 30/08 ?
//
//      node scripts/verif-signe.mjs
//
//  Le 31/08/2026 le Patron a écrit : « tous les [visuels] de chap.ci doivent
//  avoir le nouveau logo ». Ils ne l'avaient pas. Ce qui a permis à l'ancien
//  repère en goutte d'eau de survivre trois semaines dans le filigrane des
//  photos, dans les bannières de partage et dans l'icône de Play, c'est qu'AUCUN
//  contrôle ne posait la question. On la pose ici.
//
//  ⚠️ CE CONTRÔLE NE LIT PAS UNE LISTE DE NOMS DE FICHIERS CONNUS. Il balaie
//  les dossiers ; toute image ajoutée à `public/og/` ou à `public/icons/`
//  demain sera jugée sans qu'on ait rien à écrire. Un contrôle qui ne connaît
//  que ce qu'on lui a dit rendra « propre » sur un dossier plein de traces.
//
//  ── COMMENT ON RECONNAÎT LE SIGNE, SANS LE COMPARER À UNE IMAGE ────────────
//  La couronne a une propriété qu'aucun autre élément des visuels n'a : des
//  feuilles ORANGE et des feuilles VERTES qui se touchent, en un amas compact
//  et à peu près carré. Ailleurs dans une bannière, l'orange (le bouton) et le
//  vert (la pastille, le « .ci ») sont à des centaines de pixels l'un de
//  l'autre. On cherche donc les cellules où les deux couleurs se côtoient, on
//  les REGROUPE EN AMAS, et on demande qu'un amas soit carré avec son orange à
//  GAUCHE : c'est le drapeau, et c'est ce que l'ancien logo n'avait pas.
//
//  ⚠️ DEUX ERREURS DE CE CONTRÔLE, PAYÉES AVANT QU'IL NE SERVE. La première
//  version prenait la boîte des cellules ORANGE seules : or l'orange d'une
//  couronne est un DEMI-anneau, une faucille deux fois plus haute que large —
//  elle déclarait « pas carré » sur des icônes parfaitement justes. La seconde
//  prenait la boîte de TOUTES les cellules retenues d'un coup : une seule
//  cellule à l'autre bout de l'image étirait la boîte sur 1 200 px. D'où les
//  amas. Les deux fois, c'est le contrôle qui avait tort, pas l'image.
//
//  Le filigrane, lui, est tout blanc : posé sur des photos inconnues, il ne
//  peut pas porter de couleur, donc pas de drapeau à mesurer. On y compte les
//  taches séparées. COMPTÉES, pas supposées : le filigrane à couronne en donne
//  21, l'ancien — le seul mot « Chap.ci » — en donne 8. Le seuil est posé à 15,
//  entre les deux mesures. (J'avais d'abord écrit 30, en raisonnant que la
//  couronne a 68 feuilles ; à cette taille elles se touchent et fusionnent. Le
//  chiffre juste est celui qu'on relève, pas celui qu'on déduit.)
// =============================================================================

import sharp from 'sharp'
import { readdirSync, existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const RACINE = new URL('..', import.meta.url).pathname
const ORANGE = [0xf7, 0x7f, 0x00]
const VERTS = [[0x00, 0x9e, 0x60], [0x00, 0x73, 0x4a], [0x00, 0x5c, 0x3b]]
const TOL = 30

const proche = (r, g, b, c) =>
  Math.abs(r - c[0]) <= TOL && Math.abs(g - c[1]) <= TOL && Math.abs(b - c[2]) <= TOL

/** Toutes les images d'un dossier, ou le fichier seul. Rien n'est nommé à la main. */
function balayer(chemin) {
  const abs = RACINE + chemin
  if (!existsSync(abs)) return []
  if (statSync(abs).isDirectory()) {
    return readdirSync(abs)
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort()
      .map((f) => chemin.replace(/\/$/, '') + '/' + f)
  }
  return [chemin]
}

/**
 * La couronne est-elle là, et est-elle bien au drapeau ?
 * Renvoie { trouve, partGauche, boite } — jamais une exception.
 */
async function couronne(chemin) {
  const { data, info } = await sharp(RACINE + chemin)
    .flatten({ background: '#FFFDF9' })
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: L, height: H, channels: C } = info

  // La grille suit la TAILLE de l'image, elle n'est pas fixe. Une maille de
  // 6 px va bien à une bannière de 1 200 px et ne veut rien dire sur un splash
  // de 2 732 : à maille fixe, deux feuilles voisines sont « collées » ici et
  // « éloignées » là, et le même dessin sort juste ou faux selon sa taille.
  const P = Math.min(40, Math.max(2, Math.round(Math.min(L, H) / 120)))
  const cl = Math.ceil(L / P), ch = Math.ceil(H / P)
  const orange = new Uint8Array(cl * ch)
  const vert = new Uint8Array(cl * ch)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < L; x++) {
      const i = (y * L + x) * C
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const c = Math.floor(y / P) * cl + Math.floor(x / P)
      if (proche(r, g, b, ORANGE)) orange[c] = 1
      else if (VERTS.some((v) => proche(r, g, b, v))) vert[c] = 1
    }
  }

  /** Les taches d'une couleur : cellules voisines à deux mailles près. */
  function amas(carte) {
    const vu = new Uint8Array(cl * ch)
    const pile = new Int32Array(cl * ch)
    const out = []
    for (let d0 = 0; d0 < cl * ch; d0++) {
      if (vu[d0] || !carte[d0]) continue
      let haut = 0, x0 = cl, y0 = ch, x1 = -1, y1 = -1, n = 0, sx = 0
      pile[haut++] = d0
      vu[d0] = 1
      while (haut) {
        const p = pile[--haut]
        const px = p % cl, py = (p / cl) | 0
        n++; sx += px
        if (px < x0) x0 = px
        if (py < y0) y0 = py
        if (px > x1) x1 = px
        if (py > y1) y1 = py
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = px + dx, ny = py + dy
            if (nx < 0 || ny < 0 || nx >= cl || ny >= ch) continue
            const q = ny * cl + nx
            if (vu[q] || !carte[q]) continue
            vu[q] = 1
            pile[haut++] = q
          }
        }
      }
      // Une tache qui couvre plus de la moitié de l'image est un FOND, pas une
      // moitié de couronne. Sans cette ligne, une bannière posée sur l'orange
      // de la marque donne une seule tache orange grande comme l'image, et la
      // couronne posée dessus devient introuvable.
      if (n >= 6 && n <= 0.5 * cl * ch) out.push({ n, x0, y0, x1, y1, cx: sx / n })
    }
    return out
  }

  // On cherche UNE tache orange et UNE tache verte qui forment ensemble un
  // anneau : même hauteur, même bande verticale, l'orange à gauche du vert.
  // C'est la couronne, et c'est intransportable ailleurs dans un visuel — le
  // bouton orange et la pastille verte d'une bannière n'ont ni la même hauteur
  // ni la même bande.
  const O = amas(orange), V = amas(vert)
  let meilleur = null
  for (const o of O) {
    for (const v of V) {
      const x0 = Math.min(o.x0, v.x0), x1 = Math.max(o.x1, v.x1)
      const y0 = Math.min(o.y0, v.y0), y1 = Math.max(o.y1, v.y1)
      const bl = x1 - x0 + 1, bh = y1 - y0 + 1
      const rapport = bl / bh
      if (rapport < 0.6 || rapport > 1.7) continue
      // Les deux moitiés d'un anneau font chacune presque toute sa hauteur.
      if ((o.y1 - o.y0 + 1) < 0.45 * bh || (v.y1 - v.y0 + 1) < 0.45 * bh) continue
      // Et elles se recouvrent verticalement.
      const chevauche = Math.min(o.y1, v.y1) - Math.max(o.y0, v.y0) + 1
      if (chevauche < 0.5 * bh) continue
      // Le drapeau : l'orange à gauche du vert.
      if (o.cx >= v.cx) continue
      let g = 0, dr = 0
      const milieu = (x0 + x1) / 2
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          if (!orange[cy * cl + cx]) continue
          if (cx <= milieu) g++; else dr++
        }
      }
      const cand = {
        trouve: true,
        partGauche: g + dr ? g / (g + dr) : 0,
        boite: [x0 * P, y0 * P, bl * P, bh * P],
        taille: [L, H],
      }
      if (!meilleur || cand.partGauche > meilleur.partGauche) meilleur = cand
    }
  }
  return meilleur ?? { trouve: false, taille: [L, H] }
}

/**
 * Le filigrane : combien de taches distinctes ? Soixante-huit feuilles, un
 * cerne et un mot en font largement plus de trente ; un mot seul en fait sept.
 */
// `source` est un chemin OU un tampon SVG : `sharp` prend les deux, ce qui
// évite d'écrire un fichier temporaire pour la contre-épreuve.
async function taches(source) {
  const { data, info } = await sharp(source).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true })
  const { width: L, height: H, channels: C } = info
  const vu = new Uint8Array(L * H)
  const plein = (i) => data[i * C + 3] > 20
  let n = 0, alphaMax = 0
  for (let i = 0; i < L * H; i++) if (data[i * C + 3] > alphaMax) alphaMax = data[i * C + 3]
  const pile = new Int32Array(L * H)
  for (let d = 0; d < L * H; d++) {
    if (vu[d] || !plein(d)) continue
    let taille = 0, haut = 0
    pile[haut++] = d
    vu[d] = 1
    while (haut) {
      const p = pile[--haut]
      taille++
      const px = p % L, py = (p / L) | 0
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = px + dx, ny = py + dy
        if (nx < 0 || ny < 0 || nx >= L || ny >= H) continue
        const q = ny * L + nx
        if (vu[q] || !plein(q)) continue
        vu[q] = 1
        pile[haut++] = q
      }
    }
    if (taille > 40) n++ // on ignore les miettes de lissage
  }
  return { n, alphaMax, taille: [L, H] }
}

// ── Ce qui doit porter le signe ─────────────────────────────────────────────
const DOSSIERS = [
  'public/icons',
  'public/og',
  'public/apple-touch-icon.png',
  'flutter_app/assets/icon',
  'flutter_app/assets/marque/splash',
  'assets/icon.png',
  'assets/splash.png',
  'assets/splash-dark.png',
  'store/app-icon-512.png',
  'store/feature-graphic-1024x500.png',
  'marketing/store/icon-512.png',
  'marketing/store/store-feature-graphic.png',
]

let rouges = 0
console.log('── La couronne, et l’orange à gauche ' + '─'.repeat(46))
for (const dossier of DOSSIERS) {
  for (const f of balayer(dossier)) {
    let r
    try { r = await couronne(f) } catch (e) { r = { erreur: e.message } }
    if (r.erreur) { console.log(`  ❌ ${f.padEnd(52)} illisible : ${r.erreur}`); rouges++; continue }
    if (!r.trouve) {
      console.log(`  ❌ ${f.padEnd(52)} AUCUNE couronne` +
                  (r.rapport ? ` (amas de rapport ${r.rapport.toFixed(2)}, pas carré)` : ''))
      rouges++
      continue
    }
    const ok = r.partGauche >= 0.85
    console.log(`  ${ok ? '✅' : '❌'} ${f.padEnd(52)} ${String(r.taille[0]) + '×' + r.taille[1]}` +
                `  couronne ${r.boite[2]}×${r.boite[3]} px` +
                `  orange à gauche : ${Math.round(r.partGauche * 100)} %`)
    if (!ok) rouges++
  }
}

console.log('\n── Le filigrane des photos ' + '─'.repeat(55))
{
  const f = 'server/watermark.png'
  const { n, alphaMax, taille } = await taches(RACINE + f)
  // La taille est vérifiée elle aussi : `apply_watermark` dérive la hauteur du
  // tampon de ce rapport-là. Un filigrane sorti à la mauvaise taille marquerait
  // toutes les photos de travers, et aucune couleur ne le dirait.
  const ok = n >= 15 && taille[0] === 1376 && taille[1] === 396 && alphaMax <= 120
  console.log(`  ${ok ? '✅' : '❌'} ${f.padEnd(52)} ${taille[0]}×${taille[1]}` +
              `  ${n} taches (≥ 15 ; mot seul = 8)  alpha max ${alphaMax} (≤ 120)`)
  if (!ok) rouges++
}

// ── LES CAPTURES D'ÉCRAN DES BOUTIQUES : UNE AUTRE QUESTION ─────────────────
// On ne peut PAS leur appliquer la règle du drapeau, et c'est un fait du
// dessin, pas une paresse : sur le bandeau orange de l'accueil la couronne est
// volontairement monochrome (voir `Mark`, variante « white » — le vert de
// marque n'y rend que 1,32:1), et sur un téléphone les pages internes n'ont
// tout simplement pas d'en-tête, donc pas de logo du tout. Une capture juste
// serait déclarée fausse.
//
// La question qui les concerne est autre : SONT-ELLES PLUS VIEILLES QUE LE
// DESSIN ? Une capture prise avant le dernier changement de marque montre
// l'ancien logo à tous les visiteurs de Play, et rien ne le signale. On
// compare donc les dates de commit, ce que git sait dire exactement.
console.log('\n── Les captures des boutiques sont-elles postérieures au dessin ? ' + '─'.repeat(17))
{
  const dateDe = (chemin) => {
    try {
      const s = execFileSync('git', ['log', '-1', '--format=%ct', '--', chemin],
        { cwd: RACINE, encoding: 'utf8' }).trim()
      return s ? Number(s) * 1000 : 0
    } catch (e) { return 0 }
  }
  const SOURCE = 'src/components/signeChapci.ts'
  const dessin = dateDe(SOURCE)
  const jour = (t) => (t ? new Date(t).toISOString().slice(0, 10) : 'jamais commité')
  console.log(`  le dessin (${SOURCE}) : ${jour(dessin)}`)
  const captures = [...balayer('store/captures'), ...balayer('marketing/store')]
    .filter((f) => !/icon-512|feature-graphic/.test(f))
  for (const f of captures) {
    const t = dateDe(f)
    // Une capture jamais commitée vient d'être faite : elle est à jour.
    const ok = t === 0 || t >= dessin
    console.log(`  ${ok ? '✅' : '❌'} ${f.padEnd(52)} ${jour(t)}` +
                (ok ? '' : '  ← ANTÉRIEURE au dessin, elle montre l’ancien logo'))
    if (!ok) rouges++
  }
}

// ── LA CONTRE-ÉPREUVE ───────────────────────────────────────────────────────
// Un contrôle qui ne peut pas échouer ne contrôle rien. Le 30/08, un premier
// contrôle de la couronne a été écrit qui rejouait ses propres chiffres : on a
// cassé le dessin exprès, il est resté vert. Depuis, tout contrôle de ce dépôt
// doit prouver qu'il sait dire non.
//
// Le dépôt garde deux logos périmés — c'est le corpus idéal, il ne bougera
// plus : `marque/2-logo-actuel/` et `marque/1-logo-nouveau/` portent tous deux
// le repère orange en goutte d'eau d'avant le 30/08. Aucun n'a de couronne.
// Si l'un des deux passait au vert, c'est le contrôle qu'il faudrait réparer.
console.log('\n── Contre-épreuve : ces trois-là DOIVENT être refusés ' + '─'.repeat(29))
const PERIMES = [
  'marque/2-logo-actuel/application/app-icon-512.png',
  'marque/1-logo-nouveau/fichiers/application/app-icon-512.png',
]
for (const f of PERIMES) {
  if (!existsSync(RACINE + f)) { console.log(`  ·  ${f} — absent, contre-épreuve sautée`); continue }
  const r = await couronne(f)
  const refuse = !r.trouve || r.partGauche < 0.85
  console.log(`  ${refuse ? '✅' : '❌'} ${f.padEnd(52)} ` +
              (refuse ? 'refusé, comme attendu' : 'ACCEPTÉ À TORT — le contrôle est cassé'))
  if (!refuse) rouges++
}
// Et le filigrane d'avant : le mot « Chap.ci » seul, refabriqué ici même.
{
  const { MOT } = await import('./signe.mjs')
  const motSeul = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1376 396" width="1376" height="396">` +
    `<g transform="translate(300 300) scale(8)"><path fill="#FFFFFF" d="${MOT}"/></g></svg>`
  const { n } = await taches(Buffer.from(motSeul))
  const refuse = n < 15
  console.log(`  ${refuse ? '✅' : '❌'} ${'un filigrane sans couronne (mot seul)'.padEnd(52)} ` +
              `${n} taches — ${refuse ? 'refusé, comme attendu' : 'ACCEPTÉ À TORT'}`)
  if (!refuse) rouges++
}

console.log()
if (rouges) {
  console.log(`❌ ${rouges} image(s) au rouge. Relancez les générateurs :`)
  console.log('   node scripts/generate-icons.mjs')
  console.log('   node scripts/generate-marque.mjs')
  console.log('   CHROMIUM_PATH=… node scripts/generate-og.mjs')
  console.log('   CHROMIUM_PATH=… node scripts/generate-store.mjs')
  console.log('   CHROMIUM_PATH=… node scripts/captures-boutique.mjs   ← les captures')
  console.log('\n   Une capture n’est reconnue à jour qu’une fois COMMITÉE :')
  console.log('   c’est la date du commit qui la compare au dessin.')
  process.exit(1)
}
console.log('✅ Toutes les images portent la couronne au drapeau.')
