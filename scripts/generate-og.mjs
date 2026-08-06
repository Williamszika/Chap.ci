// =============================================================================
//  Bannières sociales 1200×630 — une par catégorie, servies aux robots.
//
//  `web/seo.php` publie <meta property="og:image" content="…/og/{cat}.png"> sur
//  chacune des pages /vendre/{cat}/{ville}. C'est cette image que WhatsApp et
//  Facebook affichent quand quelqu'un colle le lien. Sans fichier, l'aperçu
//  tombe sur un rectangle gris.
//
//  POURQUOI CE SCRIPT EXISTE MAINTENANT SEULEMENT.
//  Les quinze premières bannières ont été composées à la main, sans outil, en
//  juillet 2026 — et le gabarit n'existait donc nulle part. Ajouter une
//  catégorie obligeait à le retrouver de mémoire. Il est ici désormais.
//
//  ⚠️ Ce script ne réécrit QUE les catégories qu'on lui nomme. Les anciennes
//  bannières ne sont pas régénérées : elles sont antérieures à ce gabarit, et
//  les recomposer changerait quinze images en ligne pour rien.
//
//  Usage : node scripts/generate-og.mjs voyage a-donner
//          node scripts/generate-og.mjs            (toutes celles définies ici)
//
//  Il faut Playwright et son Chromium — c'est lui qui compose l'image, parce
//  qu'un rendu HTML donne les emoji en couleur, ce qu'aucune bibliothèque SVG
//  ne fait ici. Playwright n'est pas une dépendance du projet : installez-le à
//  part (`npm i --no-save playwright`) le jour où vous ajoutez une catégorie.
// =============================================================================
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ogDir = join(root, 'public', 'og')
mkdirSync(ogDir, { recursive: true })

// La police de l'application, embarquée en base64 : Chromium n'a pas accès au
// réseau ici, et une bannière rendue en police système ne ressemblerait à rien.
const POLICE = readFileSync(
  join(root, 'node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2'),
).toString('base64')

/**
 * Une bannière par catégorie.
 *   titre  — le mot en vert sous « Vendez » (ou sous le verbe choisi)
 *   verbe  — « Vendez » partout, sauf « À donner » qui ne vend rien
 *   sous   — la phrase d'accroche, deux lignes au plus
 *   emoji  — le pictogramme du carré blanc, à droite
 */
const BANNIERES = {
  // Le mot vert prolonge le verbe : « Vendez vos voyages », et non
  // « Vendez Voyage ». Les quinze bannières de juillet mettaient le nom de la
  // rubrique tel quel — cela passait sur « Vendez Véhicules », cela ne passe
  // pas sur « Donnez À donner ».
  voyage: {
    verbe: 'Vendez',
    titre: 'vos voyages',
    sous: 'Billets, séjours, agences —\ngratuit, en 2 minutes.',
    emoji: '✈️',
  },
  'a-donner': {
    verbe: 'Donnez',
    titre: 'ce qui ne sert plus',
    sous: 'Vêtements, meubles, cahiers —\nà qui en a besoin.',
    emoji: '🎁',
  },
}

const page_html = ({ verbe, titre, sous, emoji }) => `
<style>
  @font-face {
    font-family: 'Jakarta';
    src: url(data:font/woff2;base64,${POLICE}) format('woff2-variations');
    font-weight: 200 800;
  }
  * { margin: 0; padding: 0; box-sizing: border-box }
  body {
    width: 1200px; height: 630px; position: relative; overflow: hidden;
    background: #FFF6EA; font-family: 'Jakarta', sans-serif; color: #1B1A17;
  }
  /* La tache claire en haut à droite, et la bande du fond : c'est ce qui
     empêche l'aplat crème de paraître plat sur un fil WhatsApp. */
  .halo {
    position: absolute; right: -140px; top: -220px; width: 760px; height: 760px;
    border-radius: 50%; background: #FFFDF9;
  }
  .bande { position: absolute; right: 0; top: 0; width: 34%; height: 100%; background: rgba(255,253,249,.55) }
  .w { position: relative; padding: 46px 56px }
  .logo { font-size: 40px; font-weight: 800; letter-spacing: -.02em }
  .logo .ci { color: #009E60 }
  .pastille {
    position: absolute; right: 56px; top: 46px; display: flex; align-items: center; gap: 7px;
    background: #009E60; color: #fff; font-size: 16px; font-weight: 800;
    border-radius: 999px; padding: 9px 18px;
  }
  h1 { font-size: 76px; font-weight: 800; line-height: 1.03; letter-spacing: -.03em; margin-top: 44px }
  h1 .cat { display: block; color: #009E60 }
  .sous { margin-top: 26px; font-size: 27px; font-weight: 700; line-height: 1.35; white-space: pre-line; max-width: 640px }
  .bas { position: absolute; left: 56px; bottom: 74px; display: flex; align-items: center; gap: 22px }
  .cta {
    background: linear-gradient(135deg, #FFA243, #F77F00);
    color: #fff; font-size: 24px; font-weight: 800; border-radius: 14px; padding: 16px 28px;
  }
  .mention { font-size: 22px; font-weight: 700; color: #6b7280 }
  .carre {
    position: absolute; right: 78px; top: 168px; width: 236px; height: 236px;
    background: #fff; border-radius: 40px; display: flex; align-items: center; justify-content: center;
    font-size: 126px; line-height: 1;
  }
  /* Le drapeau, en pied : orange, blanc, vert. */
  .drapeau { position: absolute; left: 0; bottom: 0; width: 100%; height: 12px; display: flex }
  .drapeau i { flex: 1 }
  .drapeau i:nth-child(1) { background: #F77F00 }
  .drapeau i:nth-child(2) { background: #FFFDF9 }
  .drapeau i:nth-child(3) { background: #009E60 }
</style>
<div class="halo"></div><div class="bande"></div>
<div class="w">
  <div class="logo">Chap<span class="ci">.ci</span></div>
  <div class="pastille">100 % ivoirien 🇨🇮</div>
  <h1>${verbe}<span class="cat">${titre}</span></h1>
  <div class="sous">${sous}</div>
</div>
<div class="carre">${emoji}</div>
<div class="bas">
  <div class="cta">+ Publier gratuitement</div>
  <div class="mention">chap.ci · Mobile Money</div>
</div>
<div class="drapeau"><i></i><i></i><i></i></div>
`

const demandees = process.argv.slice(2)
const aFaire = demandees.length ? demandees : Object.keys(BANNIERES)

const navigateur = await chromium.launch()
const onglet = await navigateur.newPage({ viewport: { width: 1200, height: 630 } })
for (const id of aFaire) {
  const b = BANNIERES[id]
  if (!b) { console.log(`  !! ${id} : aucune bannière définie dans ce script`); continue }
  await onglet.setContent(page_html(b))
  await onglet.evaluate(() => document.fonts.ready)
  const out = join(ogDir, `${id}.png`)
  await onglet.screenshot({ path: out })
  console.log('✓', out)
}
await navigateur.close()
