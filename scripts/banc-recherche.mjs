// =============================================================================
//  BANC DE LA RECHERCHE — la loupe part-elle vraiment ?
//
//      npm run build && CHROMIUM_PATH=… npm run banc:recherche
//
//  ⚠️ POURQUOI CE BANC EXISTE. Le 31/08/2026 le Patron a écrit : « dans la
//  barre de recherche, la loupe n'est pas activée, et cela ne recherche pas ».
//  Elle ne l'était nulle part : c'était un simple dessin `<Search/>` posé dans
//  le formulaire. La touche Entrée, elle, marchait — d'où trois semaines sans
//  que personne ne le voie, sur un site où l'on cherche avant d'acheter.
//
//  Et sur TÉLÉPHONE il n'y avait aucun bouton du tout : celui qui dit
//  « Rechercher » est en `hidden md:block`. Il fallait trouver la touche « OK »
//  du clavier virtuel. Sur la page d'accueil d'une marketplace.
//
//  Ce banc rejoue les deux gestes d'un utilisateur — appuyer sur la loupe,
//  appuyer sur Entrée — sur les quatre barres de recherche du site, et exige
//  que les deux mènent aux résultats.
//
//  ⚠️ IL VISE LA LOUPE PAR SES COORDONNÉES, à gauche du champ, et non « le
//  premier dessin à moins de 60 px ». La première version faisait ça et
//  attrapait parfois le « ✕ » d'effacement : elle aurait rendu rouge le mauvais
//  bouton, donc prouvé la mauvaise panne.
//
//  Il mesure aussi la ZONE TAPABLE (44 px : un pouce en marchant) et la
//  position du dessin, pour qu'un correctif ne déplace pas la barre en croyant
//  bien faire.
//
//  Les données viennent de chap.ci en lecture seule ; le front vient de dist/.
// =============================================================================
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'

const RACINE = new URL('..', import.meta.url).pathname
const DIST = join(RACINE, 'dist')
const AMONT = 'https://chap.ci'
const PORT = 8302
const MOT = 'vans'

if (!existsSync(join(DIST, 'index.html'))) {
  console.log('❌ dist/index.html manquant — lancez `npm run build` d’abord.')
  process.exit(1)
}

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
}
const serveur = createServer(async (req, res) => {
  const [chemin] = req.url.split('?')
  if (chemin.startsWith('/api/') || chemin.startsWith('/uploads/')) {
    // Lecture seule : un banc ne doit RIEN écrire sur le site du Patron, pas
    // même gonfler ses compteurs de visites.
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(204); return res.end() }
    try {
      const amont = await fetch(AMONT + req.url, {
        headers: { 'User-Agent': 'banc-recherche', Accept: '*/*', 'Cache-Control': 'no-cache' },
        redirect: 'follow',
      })
      const corps = Buffer.from(await amont.arrayBuffer())
      res.writeHead(amont.status, {
        'Content-Type': amont.headers.get('content-type') ?? 'application/octet-stream',
      })
      return res.end(corps)
    } catch (e) {
      res.writeHead(502); return res.end()
    }
  }
  let f = join(DIST, chemin === '/' ? 'index.html' : chemin.slice(1))
  if (!existsSync(f) || statSync(f).isDirectory()) f = join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'text/plain' })
  res.end(readFileSync(f))
})
await new Promise((ok) => serveur.listen(PORT, ok))

// Le premier chargement montre quatre écrans qui ne sont pas la page : le
// consentement, l'infolettre, la position, l'installation. On les répond.
const SEMENCE = () => {
  try {
    localStorage.setItem('chapci.consent', 'yes')   // 'yes' | 'no' — lib/consent.ts
    localStorage.setItem('chapci.nlPrompt.v1', '1')
    localStorage.setItem('chapci.geo.decided.v1', 'true')
    localStorage.setItem('chapci.pwa.dismissed.v1', '1')
    localStorage.setItem('chapci.fete.hide', '1')
  } catch (e) {}
}

// [nom lisible, route, largeur CSS]. L'en-tête d'ordinateur (TopNav) n'existe
// qu'au-dessus de 768 px.
const ENDROITS = [
  ['accueil, téléphone', '/', 360],
  ['accueil, ordinateur', '/', 1280],
  ['explorer, téléphone', '/#/explorer', 360],
  ['en-tête, ordinateur', '/#/explorer', 1280],
]

const nav = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
let rouges = 0

for (const [nom, route, largeur] of ENDROITS) {
  for (const geste of ['loupe', 'entrée']) {
    const ctx = await nav.newContext({
      viewport: { width: largeur, height: largeur < 700 ? 640 : 800 },
      isMobile: largeur < 700,
      hasTouch: largeur < 700,
      locale: 'fr-FR',
    })
    await ctx.addInitScript(SEMENCE)
    const p = await ctx.newPage()
    await p.goto(`http://127.0.0.1:${PORT}` + route, { waitUntil: 'networkidle', timeout: 60000 })
    await p.waitForTimeout(1500)

    const champ = p.locator('input[placeholder*="echerch" i]:visible').first()
    if (!(await champ.count())) {
      console.log(`  ❌ ${nom.padEnd(21)} ${geste.padEnd(6)} — AUCUN champ de recherche visible`)
      rouges++; await ctx.close(); continue
    }
    await champ.fill(MOT)
    await p.waitForTimeout(300)
    const avant = p.url()

    const loupe = await champ.evaluate((el) => {
      const b = el.getBoundingClientRect()
      const x = Math.round(b.left - 14), y = Math.round(b.top + b.height / 2)
      const cible = document.elementFromPoint(x, y)
      const bouton = cible?.closest('button')
      const bb = bouton?.getBoundingClientRect()
      return {
        x, y,
        estUnBouton: !!bouton,
        typeDuBouton: bouton?.getAttribute('type') ?? null,
        tapable: bb ? Math.round(Math.min(bb.width, bb.height)) : 0,
      }
    })

    if (geste === 'loupe') await p.mouse.click(loupe.x, loupe.y)
    else await champ.press('Enter')
    await p.waitForTimeout(1800)

    const partie = p.url() !== avant && /q=/.test(p.url())
    const trouve = await p.evaluate((m) =>
      [...document.querySelectorAll('h2,h3,a,p')].some((e) =>
        (e.textContent || '').toLowerCase().includes(m)), MOT)

    const ok = geste === 'loupe'
      ? partie && trouve && loupe.estUnBouton && loupe.typeDuBouton === 'submit' && loupe.tapable >= 44
      : partie && trouve
    if (!ok) rouges++
    console.log(
      `  ${ok ? '✅' : '❌'} ${nom.padEnd(21)} ${geste.padEnd(6)}` +
      (geste === 'loupe'
        ? ` · bouton ${loupe.estUnBouton ? 'oui(' + loupe.typeDuBouton + ')' : 'NON'}` +
          ` · tapable ${String(loupe.tapable).padStart(2)} px`
        : ' ·'.padEnd(31)) +
      ` · la recherche ${partie ? 'part  ' : 'NE PART PAS'}` +
      ` · « ${MOT} » ${trouve ? 'affiché' : 'ABSENT'}`)
    await ctx.close()
  }
}

await nav.close()
serveur.close()
console.log(rouges
  ? `\n❌ ${rouges} cas au rouge — une barre de recherche ne répond pas.`
  : '\n✅ les quatre barres partent, à la loupe comme à la touche Entrée.')
process.exit(rouges ? 1 : 0)
