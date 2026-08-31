// =============================================================================
//  LES DIX-NEUF CAPTURES D'ÉCRAN DES BOUTIQUES, refaites sur le site du dépôt.
//
//      CHROMIUM_PATH=/chemin/vers/chromium node scripts/captures-boutique.mjs
//
//  · store/captures/          — 5 écrans × 3 formats, pour Google Play
//  · marketing/store/store-*  — 4 écrans au format iPhone 15 Pro
//
//  ⚠️ POURQUOI CET OUTIL EST DANS LE DÉPÔT. Il a d'abord été écrit dans un
//  dossier d'essais, hors du dépôt — exactement comme `poser-signe.mjs`, que
//  ⚡ Le Mécanicien a cherché le 31/08 sans le trouver. Un outil que personne
//  ne peut relancer ne sert qu'une fois, et ces captures se périment à chaque
//  changement de marque : `verif-signe.mjs` le dit désormais, encore faut-il
//  pouvoir y répondre.
//
//  ── CE QU'IL MONTRE, ET D'OÙ VIENNENT LES DONNÉES ─────────────────────────
//  Le FRONT vient de `dist/` (construisez avant : `npm run build`). Les
//  DONNÉES et les PHOTOS viennent de chap.ci en direct — un banc vide donnerait
//  des rectangles gris, et des captures pires que celles qu'on remplace.
//
//  ⚠️ RIEN N'EST ÉCRIT SUR LE SITE. Seules les requêtes GET sont relayées ;
//  les autres reçoivent 204 sans partir. C'est délibéré : `/api/track` et
//  `/api/ads/…/view` sont les COMPTEURS du Patron, et une séance de captures
//  gonflerait ses chiffres de vues avec des visites qui n'existent pas.
//
//  ⚠️ CES CAPTURES MONTRENT DE VRAIES ANNONCES ET DE VRAIS VENDEURS, comme
//  celles qu'elles remplacent. Si vous préférez que la fiche Play ne montre
//  personne, il faut un jeu de démonstration — c'est un autre travail, et
//  c'est une décision du Patron.
//
//  ── RÉGLAGES ──────────────────────────────────────────────────────────────
//      ANNONCE=<id>  VENDEUR=<id>   les deux fiches à photographier
//      CAT=mode                     filtre la page « Explorer » sur une
//                                   catégorie (vitrine plus jolie, moins
//                                   d'annonces au compteur)
// =============================================================================
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'

const RACINE = new URL('..', import.meta.url).pathname
const DIST = join(RACINE, 'dist')
const AMONT = 'https://chap.ci'
const PORT = 8301

if (!existsSync(join(DIST, 'index.html'))) {
  console.log('❌ dist/index.html manquant — lancez `npm run build` d’abord.')
  process.exit(1)
}

// ── Le serveur : front local, données réelles, lecture seule ────────────────
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
}
const serveur = createServer(async (req, res) => {
  const [chemin] = req.url.split('?')
  if (chemin.startsWith('/api/') || chemin.startsWith('/uploads/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(204); return res.end() }
    try {
      const amont = await fetch(AMONT + req.url, {
        headers: { 'User-Agent': 'captures-boutique', Accept: '*/*', 'Cache-Control': 'no-cache' },
        redirect: 'follow',
      })
      const corps = Buffer.from(await amont.arrayBuffer())
      res.writeHead(amont.status, {
        'Content-Type': amont.headers.get('content-type') ?? 'application/octet-stream',
      })
      return res.end(corps)
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/plain' })
      return res.end('miroir : ' + e.message)
    }
  }
  let f = join(DIST, chemin === '/' ? 'index.html' : chemin.slice(1))
  if (!existsSync(f) || statSync(f).isDirectory()) f = join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'text/plain' })
  res.end(readFileSync(f))
})
await new Promise((ok) => serveur.listen(PORT, ok))
console.log(`  site neuf + données réelles sur http://127.0.0.1:${PORT}`)

// ── Les écrans ──────────────────────────────────────────────────────────────
// ⚠️ LES ROUTES SONT EN « #/ » : le site tourne en HashRouter. Servir
// « /explorer » rend index.html, qui ne voit aucun hash et affiche l'accueil.
// Premier essai : les cinq captures montraient la même page, sans qu'aucune
// erreur ne le signale.
const ANNONCE = process.env.ANNONCE ?? 'fb823bdc-3b71-4f6b-b3d0-20c3cb1eb672'
const VENDEUR = process.env.VENDEUR ?? '0b109569-6697-4b5a-aee0-d8cbd859aa1e'
const CAT = process.env.CAT ?? ''
const EXPLORER = '/#/explorer' + (CAT ? '?cat=' + CAT : '')

const ECRANS = [
  ['01-accueil', '/', null],
  ['02-annonce', '/#/annonce/' + ANNONCE, null],
  ['03-explorer', EXPLORER, null],
  ['04-vendeur', '/#/vendeur/' + VENDEUR, null],
  ['05-aide', '/#/aide', null],
]

// [dossier, préfixe, largeur px, hauteur px, densité]. La largeur CSS s'en
// déduit : c'est elle qui décide de la mise en page, pas la taille du fichier.
const APPAREILS = [
  ['store/captures/', 'telephone', 1080, 1920, 3],
  ['store/captures/', 'tablette7', 1920, 1080, 2],
  ['store/captures/', 'tablette10', 1920, 1080, 1.5],
]

// Ce que le premier chargement montre et qu'une capture ne doit pas garder :
// le bandeau de consentement, la proposition d'infolettre, la demande de
// position, l'invitation à installer. Quatre écrans à part, pas la page.
const SEMENCE = () => {
  try {
    localStorage.setItem('chapci.consent', 'yes')   // 'yes' | 'no' — voir lib/consent.ts
    localStorage.setItem('chapci.nlPrompt.v1', '1')
    localStorage.setItem('chapci.geo.decided.v1', 'true')
    localStorage.setItem('chapci.pwa.dismissed.v1', '1')
    localStorage.setItem('chapci.fete.hide', '1')
  } catch (e) { /* mode privé : tant pis, le bandeau sera là */ }
}

const nav = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)

async function tirer(ctx, sortie, route, defilerVers) {
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}` + route, { waitUntil: 'networkidle', timeout: 60000 })
  await p.waitForTimeout(2500) // les photos d'annonces arrivent après le rendu
  if (defilerVers) {
    const y = await p.evaluate((motif) => {
      const h = [...document.querySelectorAll('h2,h3')]
        .find((e) => new RegExp(motif, 'i').test(e.textContent || ''))
      if (!h) return -1
      const y = h.getBoundingClientRect().top + scrollY - 12
      scrollTo(0, y)
      return Math.round(y)
    }, defilerVers)
    if (y === -1) console.log(`     ⚠️ titre « ${defilerVers} » introuvable — capture non défilée`)
    await p.waitForTimeout(1200)
  }
  mkdirSync(join(RACINE, sortie.slice(0, sortie.lastIndexOf('/'))), { recursive: true })
  await p.screenshot({ path: join(RACINE, sortie) })
  console.log('  ✅', sortie)
  await p.close()
}

for (const [dossier, prefixe, L, H, densite] of APPAREILS) {
  const ctx = await nav.newContext({
    viewport: { width: Math.round(L / densite), height: Math.round(H / densite) },
    deviceScaleFactor: densite,
    isMobile: prefixe === 'telephone',
    hasTouch: true,
    locale: 'fr-FR',
  })
  await ctx.addInitScript(SEMENCE)
  for (const [nom, route, defiler] of ECRANS) {
    await tirer(ctx, `${dossier}${prefixe}-${nom}.png`, route, defiler)
  }
  await ctx.close()
}

// ── Les quatre du dossier marketing : format iPhone 15 Pro ──────────────────
{
  const ctx = await nav.newContext({
    viewport: { width: 393, height: 852 }, // 1179×2556 à la densité 3
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: 'fr-FR',
  })
  await ctx.addInitScript(SEMENCE)
  await tirer(ctx, 'marketing/store/store-1-accueil.png', '/', null)
  await tirer(ctx, 'marketing/store/store-2-annonces.png', '/', 'annonces r')
  await tirer(ctx, 'marketing/store/store-3-fiche.png', '/#/annonce/' + ANNONCE, null)
  await tirer(ctx, 'marketing/store/store-4-explorer.png', EXPLORER, null)
  await ctx.close()
}

await nav.close()
serveur.close()
console.log('\n  Commitez-les, puis `node scripts/verif-signe.mjs` :')
console.log('  c’est la date du commit qui prouve qu’elles sont postérieures au dessin.')
