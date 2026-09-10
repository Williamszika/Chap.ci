// =============================================================================
//  APERÇU DU BANDEAU COOKIES — trois captures, sur le site RÉELLEMENT construit.
//
//      node scripts/apercu-cookies.mjs [dossier de sortie]
//
//  Pourquoi un script plutôt qu'un coup d'œil : le 10/09/2026, la première
//  version de la barre a été jugée correcte à la lecture du code. En capture,
//  sur un écran de 390 px, elle faisait HUIT lignes et recouvrait 40 % de la
//  page. On ne juge pas une mise en page en lisant du JSX.
//
//  Ne touche pas la production : il sert `dist/` par un serveur PHP local, comme
//  `banc:front` et `banc:affiche`.
// =============================================================================
import { spawn } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const DEPOT = new URL('..', import.meta.url).pathname
const SORTIE = (process.argv[2] ?? '/tmp/chapci-apercu-cookies').replace(/\/?$/, '')
const PORT = 8215
const SITE = `http://127.0.0.1:${PORT}`

if (!existsSync(join(DEPOT, 'dist', 'index.html'))) {
  console.log('❌ `dist/` est absent — lancez `npm run build` d’abord.')
  process.exit(1)
}
mkdirSync(SORTIE, { recursive: true })

// `dist/` servi tel quel, avec le repli SPA sur index.html.
const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', join(DEPOT, 'dist')], {
  stdio: 'ignore',
})
const attendre = (ms) => new Promise((r) => setTimeout(r, ms))
await attendre(700)

const navigateur = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
})

const ECRANS = [
  { nom: 'telephone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { nom: 'ordinateur', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
]

for (const e of ECRANS) {
  const { nom, ...opts } = e
  const ctx = await navigateur.newContext({ ...opts, locale: 'fr-FR', serviceWorkers: 'block' })
  const page = await ctx.newPage()
  await page.goto(SITE + '/', { waitUntil: 'load' })
  // La barre s'arme à 3 s après l'hydratation (voir `CookieConsent`).
  await page.waitForSelector('[aria-label="Consentement aux cookies"]', { timeout: 15000 })
  await attendre(400) // l'animation `animate-fadeup`

  const barre = await page.$('[aria-label="Consentement aux cookies"]')
  const boite = await barre.boundingBox()
  const part = Math.round((boite.height / opts.viewport.height) * 100)
  console.log(`  ${nom.padEnd(11)} barre ${Math.round(boite.height)} px de haut — ${part} % de l’écran`)

  await page.screenshot({ path: `${SORTIE}/barre-${nom}.png` })

  // Le panneau : personne ne le voit jamais autrement, ni le banc ni un humain
  // pressé. C'est exactement le genre d'écran où une faute survit des mois.
  await page.getByRole('button', { name: /Régler/ }).click()
  await page.waitForSelector('[aria-label="Réglages des cookies"]', { timeout: 5000 })
  await attendre(300)
  await page.screenshot({ path: `${SORTIE}/panneau-${nom}.png` })

  await ctx.close()
}

await navigateur.close()
serveur.kill()
console.log(`\n  captures : ${SORTIE}`)
