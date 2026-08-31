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
//  ⚠️ LES DIX-NEUF SONT DÉFINIES ICI DEPUIS LE 31/08/2026. Elles ne l'étaient
//  pas : seules les quatre du 16/08 figuraient dans ce fichier, les quinze de
//  juillet n'existaient que sous forme d'images. Le jour où le Patron a
//  demandé que « tout Chap.ci porte le nouveau logo », ces quinze-là n'ont
//  donc pas pu suivre le gabarit — il a fallu relire leurs textes sur les
//  images pour les remettre ici. Leurs mots sont recopiés tels quels ; seul le
//  gabarit change.
//
//  Usage : node scripts/generate-og.mjs voyage a-donner
//          node scripts/generate-og.mjs            (les dix-neuf)
//
//  Il faut Chromium — c'est lui qui compose l'image, parce qu'un rendu HTML
//  donne les emoji en couleur, ce qu'aucune bibliothèque SVG ne fait ici.
//  Playwright n'est pas une dépendance du projet : installez-le à part
//  (`npm i --no-save playwright-core`) et donnez le chemin du navigateur dans
//  CHROMIUM_PATH.
// =============================================================================
import { chromium } from 'playwright-core'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as S from './signe.mjs'

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
  // La bannière de l'ACCUEIL — la seule qui ne parle pas d'une catégorie.
  // Elle manquait : `index.html` servait l'apple-touch-icon (180×180, carrée),
  // si bien que le lien le plus partagé du site — « va voir chap.ci » sur
  // WhatsApp — arrivait en petite vignette, quand les pages de catégorie, elles,
  // avaient droit à une vraie image depuis juillet. Signalée le 16/08.
  accueil: {
    verbe: 'Achetez, vendez',
    titre: 'chap-chap',
    sous: 'Partout en Côte d’Ivoire —\ngratuit, sans commission.',
    emoji: '🛍️',
  },
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
  scolaire: {
    verbe: 'Vendez',
    titre: 'pour la rentrée',
    sous: 'Cahiers, cartables, manuels —\ngratuit, en 2 minutes.',
    emoji: '🎒',
  },
  'a-donner': {
    verbe: 'Donnez',
    titre: 'ce qui ne sert plus',
    sous: 'Vêtements, meubles, cahiers —\nà qui en a besoin.',
    emoji: '🎁',
  },

  // ── Les quinze de juillet 2026 ──────────────────────────────────────────
  // Textes RELUS SUR LES IMAGES, pas réinventés : le Patron a demandé le
  // nouveau logo, pas de nouvelles phrases. Elles gardent donc leur tournure
  // d'origine — « Vendez Agriculture », et non « Vendez vos produits
  // agricoles » comme les quatre du dessus. Le jour où on voudra les
  // harmoniser, ce sera une décision à part, et elle se prendra ici.
  agriculture: {
    verbe: 'Vendez',
    titre: 'Agriculture',
    sous: 'Publiez vos produits agricoles —\ngratuit, en 2 minutes.',
    emoji: '🌾',
  },
  alimentation: {
    verbe: 'Vendez',
    titre: 'Alimentation',
    sous: 'Publiez vos produits alimentaires —\ngratuit, en 2 minutes.',
    emoji: '🍲',
  },
  animaux: {
    verbe: 'Vendez',
    titre: 'Animaux',
    sous: 'Publiez vos animaux —\ngratuit, en 2 minutes.',
    emoji: '🐐',
  },
  bebe: {
    verbe: 'Vendez',
    titre: 'Bébé & Enfant',
    sous: 'Publiez vos articles bébé & enfant —\ngratuit, en 2 minutes.',
    emoji: '🍼',
  },
  electronique: {
    verbe: 'Vendez',
    titre: 'Électronique',
    sous: 'Publiez votre matériel électronique —\ngratuit, en 2 minutes.',
    emoji: '💻',
  },
  emploi: {
    verbe: 'Vendez',
    titre: 'Emploi',
    sous: 'Publiez une offre d’emploi —\ngratuit, en 2 minutes.',
    emoji: '💼',
  },
  immobilier: {
    verbe: 'Vendez',
    titre: 'Immobilier',
    sous: 'Publiez votre bien immobilier —\ngratuit, en 2 minutes.',
    emoji: '🏡',
  },
  loisirs: {
    verbe: 'Vendez',
    titre: 'Loisirs & Sport',
    sous: 'Publiez vos articles de sport —\ngratuit, en 2 minutes.',
    emoji: '⚽',
  },
  maison: {
    verbe: 'Vendez',
    titre: 'Maison & Meubles',
    sous: 'Publiez vos meubles —\ngratuit, en 2 minutes.',
    emoji: '🛋️',
  },
  'materiel-pro': {
    verbe: 'Vendez',
    titre: 'Matériel Pro',
    sous: 'Publiez votre matériel pro —\ngratuit, en 2 minutes.',
    emoji: '🏗️',
  },
  mode: {
    verbe: 'Vendez',
    titre: 'Mode & Beauté',
    sous: 'Publiez vos articles mode & beauté —\ngratuit, en 2 minutes.',
    emoji: '👗',
  },
  sante: {
    verbe: 'Vendez',
    titre: 'Santé',
    sous: 'Publiez vos produits bien-être —\ngratuit, en 2 minutes.',
    emoji: '🩺',
  },
  services: {
    verbe: 'Vendez',
    titre: 'Services',
    sous: 'Publiez vos services —\ngratuit, en 2 minutes.',
    emoji: '🛠️',
  },
  telephones: {
    verbe: 'Vendez',
    titre: 'Téléphones',
    sous: 'Publiez votre téléphone —\ngratuit, en 2 minutes.',
    emoji: '📱',
  },
  vehicules: {
    verbe: 'Vendez',
    titre: 'Véhicules',
    sous: 'Publiez votre voiture —\ngratuit, en 2 minutes.',
    emoji: '🚗',
  },
}

// Le signe, tiré de `src/components/signeChapci.ts` comme partout ailleurs —
// jamais recopié : une copie d'un dessin est une copie qui se périme.
const SIGNE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">` +
  S.signe({ avecLigne: false }) + `</svg>`

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
  /* LE VERROUILLAGE HORIZONTAL : la couronne, puis le nom.
     Pourquoi les deux et pas la couronne seule — une vignette WhatsApp fait
     trois cents pixels de large : la couronne y tombe à 19 px, où elle n'est
     plus qu'un rond. Le nom en gras, lui, se lit encore. Chacun tient à une
     taille où l'autre lâche. */
  .logo { display: flex; align-items: center; gap: 15px;
          font-size: 40px; font-weight: 800; letter-spacing: -.02em }
  .logo .ci { color: #009E60 }
  /* La couronne SANS sa ligne « Achat, Vente, Emplois, Chap » : à 76 px, elle
     ne mesurerait que 36 px de large — une salissure grise, pas un mot. */
  .logo svg { width: 76px; height: 76px; display: block; flex: none }
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
  <div class="logo">${SIGNE}<span>Chap<span class="ci">.ci</span></span></div>
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

// CHROMIUM_PATH permet d'utiliser un Chromium DÉJÀ présent sur la machine.
// Sans lui, Playwright exige la version exacte qu'il vient d'installer et
// refuse de démarrer sur celle d'à côté — ce qui bloquait la génération le
// 16/08 alors qu'un Chromium parfaitement utilisable était là.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/generate-og.mjs accueil
const navigateur = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
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
