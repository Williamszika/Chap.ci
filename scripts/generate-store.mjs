// =============================================================================
//  LES DEUX BANNIÈRES DE BOUTIQUE (1024×500), celles que Play affiche en tête
//  de la fiche de l'application.
//
//      CHROMIUM_PATH=/chemin/vers/chromium node scripts/generate-store.mjs
//
//  ⚠️ POURQUOI DEUX FICHIERS POUR UNE SEULE IMAGE.
//  Deux guides du dépôt en désignent chacun un, et ils ne désignent pas le
//  même :
//      GUIDE-PUBLICATION-PLAY.md → store/feature-graphic-1024x500.png
//      GUIDE-PLAY-STORE.md       → marketing/store/store-feature-graphic.png
//  Tant que les deux guides existent, les deux fichiers doivent être à jour :
//  celui qu'on oublierait serait exactement celui que le Patron ouvrirait le
//  jour de la publication. Ils sont donc refaits ensemble, ici.
//
//  Comme les bannières sociales, elles portent du texte et des emoji en
//  couleur : Chromium les compose. `npm i --no-save playwright-core`.
// =============================================================================
import { chromium } from 'playwright-core'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import * as S from './signe.mjs'

const RACINE = new URL('..', import.meta.url).pathname
const POLICE = readFileSync(
  join(RACINE, 'node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2'),
).toString('base64')

/** Le signe, tiré de la source. Sans sa ligne : à 84 px elle ne se lit pas. */
const signe = (blanc) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">` +
  S.signe({ blanc, avecLigne: false }) + `</svg>`

const COMMUN = `
  @font-face { font-family:'Jakarta'; src:url(data:font/woff2;base64,${POLICE}) format('woff2-variations'); font-weight:200 800 }
  * { margin:0; padding:0; box-sizing:border-box }
  body { width:1024px; height:500px; position:relative; overflow:hidden;
         font-family:'Jakarta', sans-serif;
         /* Le bloc est CENTRÉ verticalement. Les deux anciennes bannières
            posaient leur texte en haut et laissaient un tiers de vide en bas :
            sur la fiche Play, où l'image est large et courte, ce vide se voit
            plus que le texte. */
         display:flex; flex-direction:column; justify-content:center }
  .logo { display:flex; align-items:center; gap:14px; font-size:38px; font-weight:800; letter-spacing:-.02em }
  .logo svg { width:64px; height:64px; display:block; flex:none }
  h1 { font-size:52px; font-weight:800; line-height:1.08; letter-spacing:-.03em; margin-top:26px }
  /* « chap-chap » ne doit JAMAIS se couper : l'ancienne bannière le cassait en
     « chap- » / « chap », ce qui donnait trois lignes au lieu de deux et un
     mot coupé en plein milieu du nom de la marque. */
  h1 .insec { white-space:nowrap }
  .drapeau { position:absolute; left:0; width:100%; height:12px; display:flex }
  .drapeau i { flex:1 }
`

// ── 1. La claire, sur le crème du site ──────────────────────────────────────
const CLAIRE = `
<style>${COMMUN}
  body { background:#FDEFDC; color:#1B1A17; padding:44px 56px }
  .halo { position:absolute; right:-150px; top:-230px; width:720px; height:720px;
          border-radius:50%; background:rgba(255,253,249,.55) }
  .w { position:relative }
  .logo .ci { color:#009E60 }
  h1 .chap { color:#B35700 }
  .emojis { margin-top:22px; display:flex; gap:26px; font-size:46px; line-height:1 }
  .bas { margin-top:24px; display:flex; align-items:center; gap:20px }
  .pastille { background:#009E60; color:#fff; font-size:22px; font-weight:800;
              border-radius:999px; padding:10px 22px }
  /* MESURÉ, pas estimé. Sur ce crème #FDEFDC : le gris #6B7280 de l'ancienne
     bannière rend 4,27:1 — sous les 4,5 exigés d'un texte courant. Le brun
     #5B4A32 rend 7,51:1 et garde le ton chaud. (Le premier chiffre que j'avais
     écrit ici, « 6,1 », était deviné et faux ; c'est la mesure qui reste.) */
  .mention { font-size:22px; font-weight:700; color:#5B4A32 }
  .drapeau { bottom:0 }
</style>
<div class="halo"></div>
<div class="w">
  <div class="logo">${signe(false)}<span>Chap<span class="ci">.ci</span></span></div>
  <h1>Achetez &amp; vendez <span class="insec chap">chap-chap</span><br>en Côte d’Ivoire 🇨🇮</h1>
  <div class="emojis">📱 🚗 🏠 👗 🛋️ 💻</div>
  <div class="bas">
    <div class="pastille">100 % ivoirien</div>
    <div class="mention">Gratuit · Mobile Money (Orange, Wave, MTN)</div>
  </div>
</div>
<div class="drapeau"><i style="background:#F77F00"></i><i style="background:#FFFDF9"></i><i style="background:#009E60"></i></div>
`

// ── 2. L'orange, celle du dossier marketing ─────────────────────────────────
// APLAT #F77F00, ET NON PLUS UN DÉGRADÉ. Sur un dégradé, chaque couleur posée
// dessus a deux contrastes — un à chaque bout — et c'est toujours le plus
// mauvais qui décide. Mesures sur l'ancien : le beige #FFDCA8, qui portait
// « chap-chap » et le « .ci », ne rendait que 1,85:1 en haut du dégradé. Il
// était illisible, et personne ne l'avait mesuré.
//
// Sur l'aplat orange de la marque, tout est connu et tout tient :
//   encre #1B1A17 .... 6,62:1  → le titre et le nom
//   vert profond ..... 3,08:1  → l'accent « chap-chap » (52 px, texte large)
//   blanc ............ 2,63:1  → écarté, c'est ce qui rendait le titre pâle
// Ce sont exactement les couleurs du bandeau d'accueil du site : la bannière
// de Play et la page d'accueil se ressemblent enfin.
//
// ⚠️ LA COURONNE, ELLE, GARDE SES COULEURS — sur une pastille crème.
// Posée à même l'orange, elle devrait passer tout entière en vert profond
// (c'est ce que fait `signe({ blanc: true })`, et c'est justifié), mais elle y
// perdrait l'orange : sur la seule image que Play met en tête de la fiche, le
// logo n'aurait plus les trois couleurs du pays, ce que le Patron a justement
// demandé le 30/08. La réserve crème coûte un disque et rend tout : orange,
// blanc, vert. C'est aussi ce qui rend l'image contrôlable — `verif-signe.mjs`
// reconnaît une couronne au drapeau, pas une couronne monochrome.
const ORANGE = `
<style>${COMMUN}
  body { background:#F77F00; color:#1B1A17; padding:60px 56px 44px }
  .w { position:relative }
  .logo .ci { color:#005C3B }
  h1 .chap { color:#005C3B }
  .sous { margin-top:24px; font-size:24px; font-weight:700; line-height:1.4;
          max-width:760px; color:rgba(27,26,23,.78) }
  /* LE VERROUILLAGE EN RÉSERVE — le signe ET le nom sur une plaque crème.
     Première tentative : le signe sur une simple pastille ronde, à même
     l'orange. Elle a échoué au contrôle, et le contrôle avait raison : le fond
     de cette bannière EST l'orange de la couronne, à sept pixels de ses
     feuilles. Ce que la machine n'arrivait pas à séparer, un œil ne le sépare
     pas mieux — un logo dont la moitié se confond avec son fond n'est pas posé,
     il est noyé. La plaque met une vraie marge entre les deux, et donne au nom
     un fond où il rend 15,4:1 au lieu de 6,6. C'est le « verrouillage en
     réserve » du kit de marque, et c'est exactement le cas qu'il sert. */
  .logo { background:#FFFDF9; border-radius:999px; padding:11px 28px 11px 13px;
          align-self:flex-start; gap:13px }
  /* 76 px comme sur les bannières sociales, et non 58. À 58 px les feuilles
     n'ont plus que deux pixels de large : lissées contre le crème, il ne reste
     presque aucun pixel de l'orange de marque. Le contrôle ne les voyait plus,
     et il avait encore raison — ce qui n'a plus deux pixels francs n'a plus
     de couleur du tout, à l'écran comme à la mesure. */
  .logo svg { width:76px; height:76px }
  .drapeau { top:0 }
</style>
<div class="w">
  <div class="logo">${signe(false)}<span>Chap<span class="ci">.ci</span></span></div>
  <h1>Achète &amp; vends <span class="insec chap">chap-chap</span> 🇨🇮</h1>
  <div class="sous">La marketplace 100 % ivoirienne · des milliers d’annonces près de chez vous</div>
</div>
<div class="drapeau"><i style="background:#F77F00"></i><i style="background:#FFFDF9"></i><i style="background:#009E60"></i></div>
`

const SORTIES = [
  ['store/feature-graphic-1024x500.png', CLAIRE],
  ['marketing/store/store-feature-graphic.png', ORANGE],
]

const nav = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
const onglet = await nav.newPage({ viewport: { width: 1024, height: 500 } })
for (const [chemin, html] of SORTIES) {
  mkdirSync(join(RACINE, dirname(chemin)), { recursive: true })
  await onglet.setContent(html)
  await onglet.evaluate(() => document.fonts.ready)
  await onglet.screenshot({ path: join(RACINE, chemin) })
  console.log('  ✅', chemin)
}
await nav.close()
console.log('\n  Lancez `node scripts/verif-signe.mjs` : c’est lui qui juge.')
