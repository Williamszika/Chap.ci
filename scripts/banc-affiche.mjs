// =============================================================================
//  BANC DE L'AFFICHE POUR LE STATUT WHATSAPP — `src/lib/affiche.ts`
//
//      npm run banc:affiche
//
//  Fabrique trois affiches dans Chromium, comme le téléphone le ferait : un
//  titre long avec promotion, une photo carrée avec titre court, et une
//  annonce SANS photo (le repli). Il vérifie que chacune sort en 1080 × 1920,
//  sans erreur de page, et les écrit dans le dossier de sortie pour qu'on les
//  REGARDE — un rendu qu'on n'a pas regardé n'est pas vérifié. Au premier
//  rendu, le 03/09/2026, le titre se coupait au milieu d'un mot (« batteri… »)
//  : aucune assertion ne l'aurait vu, l'œil l'a vu.
//
//  Il faut Chromium (CHROMIUM_PATH=/opt/pw-browsers/chromium) et playwright-core,
//  qui n'est pas une dépendance du projet : `npm i --no-save playwright-core`,
//  comme pour generate-og.mjs. Le module est empaqueté par esbuild, qui vient
//  avec Vite.
// =============================================================================
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const sortie = process.argv[2] ?? join(tmpdir(), 'chapci-banc-affiche')
mkdirSync(sortie, { recursive: true })

let chromium
try { ({ chromium } = await import(join(racine, 'node_modules/playwright-core/index.mjs'))) }
catch { console.error('❌ playwright-core manque : npm i --no-save playwright-core'); process.exit(1) }

// 1. Le module, empaqueté tel que le site l'embarque.
execFileSync('npx', ['esbuild', 'src/lib/affiche.ts', '--bundle', '--format=esm', `--outfile=${join(sortie, 'affiche.bundle.js')}`], { cwd: racine, stdio: 'pipe' })
copyFileSync(join(racine, 'node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2'), join(sortie, 'police.woff2'))
copyFileSync(join(racine, 'public/og/telephones.png'), join(sortie, 'photo-paysage.png'))
copyFileSync(join(racine, 'public/icons/icon-512.png'), join(sortie, 'photo-carree.png'))

// 2. Le harnais : trois cas, et les images rendues en base64 pour le script.
writeFileSync(join(sortie, 'harnais.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<style>@font-face{font-family:"Plus Jakarta Sans Variable";src:url(police.woff2) format("woff2");font-weight:200 800}</style></head><body>
<script type="module">
import { rendreAffiche } from './affiche.bundle.js'
const cas = [
  { nom: 'promo-titre-long', d: { id: 'a1b2c3d4', titre: 'iPhone 13 Pro Max 256 Go, état impeccable, batterie 91 %, avec chargeur et coque, à Cocody', prix: '385\\u00A0000\\u00A0FCFA', prixBarre: '420\\u00A0000\\u00A0FCFA', photo: 'photo-paysage.png', lieu: 'Cocody · Abidjan', etat: 'Occasion' } },
  { nom: 'carre-court', d: { id: 'zz99', titre: 'Table basse en bois', prix: '45\\u00A0000\\u00A0FCFA', photo: 'photo-carree.png', lieu: 'Yopougon · Abidjan', etat: 'Neuf' } },
  { nom: 'sans-photo', d: { id: 'q7', titre: 'Cours de soutien maths – terminale', prix: 'Gratuit', lieu: 'Bouaké', etat: 'Service' } },
]
window.__affiches = {}
for (const c of cas) {
  const t0 = performance.now()
  const blob = await rendreAffiche(c.d)
  const b64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob) })
  window.__affiches[c.nom] = { b64, octets: blob.size, ms: Math.round(performance.now() - t0) }
}
window.__fini = true
</script></body></html>`)

// 3. Un serveur minuscule : les data-URI et le canvas veulent une vraie origine.
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' }
const srv = createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return }
  const f = join(sortie, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'harnais.html')
  if (!existsSync(f)) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': types[extname(f)] ?? 'application/octet-stream' })
  res.end(readFileSync(f))
})
await new Promise((r) => srv.listen(0, '127.0.0.1', r))

// 4. Chromium rend, on mesure, on écrit.
const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const page = await navigateur.newPage()
const erreurs = []
page.on('pageerror', (e) => erreurs.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()) })
page.on('requestfailed', (q) => erreurs.push('échec ' + new URL(q.url()).pathname))
page.on('response', (r) => { if (r.status() >= 400) erreurs.push(`${r.status()} ${new URL(r.url()).pathname}`) })
await page.goto(`http://127.0.0.1:${srv.address().port}/harnais.html`)
await page.waitForFunction(() => window.__fini === true, null, { timeout: 30000 })
const affiches = await page.evaluate(() => window.__affiches)
await navigateur.close(); srv.close()

let rouges = 0
console.log(`  affiches écrites dans ${sortie}\n`)
for (const [nom, { b64, octets, ms }] of Object.entries(affiches)) {
  const png = Buffer.from(b64.split(',')[1], 'base64')
  writeFileSync(join(sortie, `${nom}.png`), png)
  const l = png.readUInt32BE(16), h = png.readUInt32BE(20) // IHDR
  const ok = l === 1080 && h === 1920 && octets > 50_000
  if (!ok) rouges++
  console.log(`  ${ok ? '✅' : '❌'} ${nom.padEnd(18)} ${l}×${h}  ${(octets / 1024).toFixed(0)} Ko  ${ms} ms`)
}
if (erreurs.length) { rouges++; console.log('  ❌ erreurs de page : ' + erreurs.join(' | ')) }
console.log()
console.log(rouges ? `❌ ${rouges} rouge(s)` : '✅ trois affiches en 1080×1920, sans erreur de page — maintenant, REGARDEZ-LES.')
process.exit(rouges ? 1 : 0)
