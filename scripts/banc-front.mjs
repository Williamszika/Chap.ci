// =============================================================================
//  LE BANC DU FRONT — ce que le téléphone télécharge, ce que les pages cassent
//  (06/09/2026, « voir ce qui fatigue le site »).
//
//      npm run banc:front
//
//  Il faut Chromium (CHROMIUM_PATH=/opt/pw-browsers/chromium) et playwright-core
//  (`npm i --no-save playwright-core`). Rien ne touche la production : un
//  serveur PHP sur SQLite avec douze annonces fabriquées, le site construit
//  (dist/) servi en local avec compression, et un Chromium réglé comme un
//  téléphone d'Abidjan en 3G (390 × 844, 1,6 Mbit/s, 150 ms d'aller-retour,
//  processeur quatre fois plus lent).
//
//  Pour chaque page : le nombre de requêtes et les kilo-octets réellement
//  transférés, les temps (DOM prêt, chargée, réseau calme, plus grand
//  élément peint), les décalages de mise en page (CLS), les erreurs de
//  console, les requêtes en échec, les images plus grandes que leur case,
//  les cibles tactiles sous 44 px, les images sans alt, et les scripts tiers
//  appelés. Une capture d'écran de chaque page est déposée dans le dossier
//  de travail.
//
//  ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : une erreur JavaScript ou une
//  requête vers notre propre serveur qui échoue rend le banc rouge.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { createServer, request as httpRequest } from 'node:http'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
let chromium
try { ({ chromium } = await import(join(racine, 'node_modules/playwright-core/index.mjs'))) }
catch { console.error('❌ playwright-core manque : npm i --no-save playwright-core'); process.exit(1) }
if (!existsSync(join(racine, 'dist/index.html'))) { console.error('❌ dist/ manque : npm run build d’abord'); process.exit(1) }

const D = process.env.BANC_FRONT_DIR || join(tmpdir(), 'chapci-banc-front')
rmSync(D, { recursive: true, force: true })
mkdirSync(join(D, 'uploads'), { recursive: true }); mkdirSync(join(D, 'captures'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT_API = 8211, PORT_SITE = 8212
const API = `http://127.0.0.1:${PORT_API}`
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }
const ko = (n) => `${(n / 1024).toFixed(0)} Ko`

// ── Le serveur PHP ───────────────────────────────────────────────────────────
const php = spawn('php', ['-S', `127.0.0.1:${PORT_API}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: join(D, 'uploads'), CHAPCI_COOKIE_SECURE: '0' },
})
php.unref()
let site, navigateur
const fini = () => {
  try { process.kill(php.pid) } catch { /* parti */ } try { process.kill(-php.pid) } catch { /* parti */ }
  try { site?.close() } catch { /* fermé */ }
}
process.on('exit', fini)
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { fini(); process.exit(130) })
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(API + '/health')).ok) break } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 250))
}
const sqlEcrire = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', DB, q])
const appel = async (chemin, { method = 'GET', body, jeton } = {}) => {
  const r = await fetch(API + chemin, {
    method, headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text(); let corps = null; try { corps = JSON.parse(t) } catch { corps = t }
  return { code: r.status, corps }
}

// ── Les données : une vendeuse pro, un acheteur, douze annonces avec photos ──
const inscrire = async (nom) => {
  const email = `${nom.toLowerCase()}-${Date.now()}@banc.ci`
  const r = await appel('/auth/signup', { method: 'POST', body: { full_name: nom, email, password: 'motdepasse-du-banc-9', consent: true } })
  if (!r.corps?.token) { console.log('❌ inscription impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }
  sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`)
  return { jeton: r.corps.token, id: r.corps.user?.id, email }
}
// Des photos JPEG de 900 × 700 dessinées par GD : un aplat, un rectangle, un
// disque — de quoi peser comme une vraie photo compressée, sans en être une.
const photo = (i) => {
  const f = join(D, `photo-${i}.jpg`)
  execFileSync('php', ['-r', `
    $im = imagecreatetruecolor(900, 700); mt_srand($argv[2]);
    imagefill($im, 0, 0, imagecolorallocate($im, mt_rand(60, 220), mt_rand(60, 220), mt_rand(60, 220)));
    for ($k = 0; $k < 40; $k++) { $c = imagecolorallocate($im, mt_rand(0, 255), mt_rand(0, 255), mt_rand(0, 255));
      imagefilledellipse($im, mt_rand(0, 900), mt_rand(0, 700), mt_rand(40, 300), mt_rand(40, 300), $c); }
    imagejpeg($im, $argv[1], 82);`, '--', f, String(i)])
  return 'data:image/jpeg;base64,' + readFileSync(f).toString('base64')
}
const photos = [1, 2, 3, 4, 5, 6].map(photo)
const awa = await inscrire('Awa'), koffi = await inscrire('Koffi')
sqlEcrire(`UPDATE users SET pro_status = 'approuve', pro_nom = 'Maison Koffi', pro_type = 'commerce', pro_secteur = 'Mode', pro_decide_at = '2026-08-01T00:00:00Z',
  pro_description = 'Prêt-à-porter et chaussures à Cocody, livraison partout à Abidjan.',
  pro_reseaux = '{"whatsapp":"https://wa.me/2250700000001","facebook":"https://www.facebook.com/maisonkoffi","tiktok":"https://www.tiktok.com/@maisonkoffi"}' WHERE id = '${awa.id}'`)
const ANNONCES = [
  ['Canapé trois places, tissu gris, très bon état', 'maison', 'Meubles', 85000, 'Cocody'],
  ['Samsung Galaxy A15, 128 Go, comme neuf', 'electronique', 'Smartphones', 95000, 'Yopougon'],
  ['Chaussures Vans authentiques, pointure 42', 'mode', 'Chaussures', 25000, 'Cocody'],
  ['Réfrigérateur Hisense 200 L, garantie 6 mois', 'maison', 'Électroménager', 150000, 'Abobo'],
  ['Robe de soirée en wax, taille M', 'mode', 'Vêtements femme', 18000, 'Marcory'],
  ['Téléviseur LG 43 pouces, smart TV', 'electronique', 'TV & Home cinéma', 120000, 'Koumassi'],
  ['Table à manger 6 places en bois massif', 'maison', 'Meubles', 140000, 'Treichville'],
  ['Sac à main en cuir, neuf', 'mode', 'Sacs & accessoires', 12000, 'Plateau'],
  ['Ordinateur portable HP, 8 Go, SSD 256', 'electronique', 'Ordinateurs', 230000, 'Cocody'],
  ['Ventilateur sur pied, silencieux', 'maison', 'Électroménager', 22000, 'Adjamé'],
  ['Baskets Nike Air, pointure 41', 'mode', 'Chaussures', 35000, 'Port-Bouët'],
  ['Écouteurs Bluetooth, boîte scellée', 'electronique', 'Accessoires', 9000, 'Bingerville'],
]
const ids = []
for (let i = 0; i < ANNONCES.length; i++) {
  const [title, categoryId, subcategory, price, commune] = ANNONCES[i]
  const r = await appel('/listings', { method: 'POST', jeton: awa.jeton, body: {
    title, description: 'Disponible tout de suite, à voir sur place. Prix légèrement négociable.',
    price, negotiable: true, categoryId, subcategory, condition: i % 3 === 0 ? 'neuf' : 'occasion',
    images: [photos[i % 6], photos[(i + 1) % 6], photos[(i + 2) % 6]],
    regionId: 'abidjan', cityId: 'abidjan', commune, sellerName: 'Awa', sellerPhone: '0700000001', delivery: i % 2 === 0,
  } })
  if (r.code !== 200) { console.log(`❌ annonce ${i + 1} refusée : ${JSON.stringify(r.corps).slice(0, 160)}`); process.exit(1) }
  ids.push(r.corps.id)
}
console.log(`  ${ids.length} annonces en base, photos et vignettes écrites dans ${join(D, 'uploads')}`)

// ── Le site construit, servi comme en production (compressé), avec l'API ─────
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml' }
const gzippable = (ct) => /^(text\/|application\/(json|javascript|manifest|xml)|image\/svg)/.test(ct)
site = createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  if (url.pathname.startsWith('/api/')) {
    const p = httpRequest({ host: '127.0.0.1', port: PORT_API, path: url.pathname.slice(4) + url.search, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${PORT_API}` } },
      (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res) })
    p.on('error', () => { res.writeHead(502); res.end() })
    req.pipe(p)
    return
  }
  let fichier = url.pathname.startsWith('/uploads/') ? join(D, url.pathname) : join(racine, 'dist', url.pathname)
  if (!existsSync(fichier) || statSync(fichier).isDirectory()) fichier = join(racine, 'dist/index.html')
  const ct = TYPES[extname(fichier)] ?? 'application/octet-stream'
  let corps = readFileSync(fichier)
  const entetes = { 'content-type': ct, 'cache-control': 'no-store' }
  if (gzippable(ct) && /gzip/.test(req.headers['accept-encoding'] ?? '')) { corps = gzipSync(corps); entetes['content-encoding'] = 'gzip' }
  entetes['content-length'] = corps.length
  res.writeHead(200, entetes); res.end(corps)
})
await new Promise((r) => site.listen(PORT_SITE, '127.0.0.1', r))
const SITE = `http://127.0.0.1:${PORT_SITE}`

// Ce que le service worker précache pour CHAQUE nouveau visiteur, en arrière-plan.
try {
  const sw = readFileSync(join(racine, 'dist/sw.js'), 'utf8')
  const urls = [...sw.matchAll(/\burl:"([^"]+)"/g)].map((m) => m[1].split('?')[0])
  let brut = 0, gz = 0
  for (const u of urls) { const f = join(racine, 'dist', u); if (!existsSync(f)) continue; const b = readFileSync(f); brut += b.length; gz += gzippable(TYPES[extname(f)] ?? '') ? gzipSync(b).length : b.length }
  console.log(`  précache du service worker : ${urls.length} fichiers, ${ko(brut)} bruts, ≈ ${ko(gz)} sur le réseau — téléchargés par chaque nouveau visiteur après la première page`)
} catch { /* pas de sw */ }

// ── Le téléphone ─────────────────────────────────────────────────────────────
navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' })
const UA = 'Mozilla/5.0 (Linux; Android 12; TECNO KG5j) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
const RESEAU = { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 } // « 3G rapide » de Chrome
const PAGES = [
  { nom: 'Accueil', url: '/' },
  { nom: 'Explorer', url: '/#/explorer' },
  { nom: 'Annonce', url: `/#/annonce/${ids[0]}` },
  { nom: 'Vendeur (pro)', url: `/#/vendeur/${awa.id}` },
  { nom: 'Connexion', url: '/#/connexion' },
  { nom: 'Aide', url: '/#/aide' },
  { nom: 'Publier (connecté)', url: '/#/publier', jeton: koffi.jeton },
  { nom: 'Mon compte (connecté)', url: '/#/compte', jeton: koffi.jeton },
  { nom: 'Messages (connecté)', url: '/#/messages', jeton: koffi.jeton },
]
const resultats = []
for (const p of PAGES) {
  const ctx = await navigateur.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA, locale: 'fr-FR',
    serviceWorkers: 'block', // un visiteur froid : chaque page est une première visite
  })
  await ctx.addInitScript(() => {
    window.__m = { lcp: 0, lcpElement: '', cls: 0, decalages: [] }
    const decrire = (n) => {
      if (!n || !n.tagName) return '?'
      const id = n.id ? '#' + n.id : ''
      const cls = typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/).slice(0, 3).join('.') : ''
      const txt = (n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
      return `${n.tagName.toLowerCase()}${id}${cls}${txt ? ' « ' + txt + ' »' : ''}`
    }
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.lcp = e.startTime; window.__m.lcpElement = decrire(e.element) } }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.hadRecentInput) continue
          window.__m.cls += e.value
          // Qui a bougé, et de combien : les cinq plus gros décalages suffisent.
          window.__m.decalages.push({ t: Math.round(e.startTime), v: +e.value.toFixed(3),
            qui: (e.sources || []).slice(0, 3).map((s) => `${decrire(s.node)} [y ${Math.round(s.previousRect.y)}→${Math.round(s.currentRect.y)}, h ${Math.round(s.previousRect.height)}→${Math.round(s.currentRect.height)}]`) })
          window.__m.decalages.sort((a, b) => b.v - a.v); window.__m.decalages.length = Math.min(window.__m.decalages.length, 5)
        }
      }).observe({ type: 'layout-shift', buffered: true })
    } catch { /* navigateur sans ces observateurs */ }
  })
  if (p.jeton) await ctx.addInitScript((j) => { localStorage.setItem('chapci.php.token', j) }, p.jeton)
  const tiers = new Set()
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => { tiers.add(new URL(route.request().url()).host); route.abort() })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', RESEAU); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const erreurs = [], echecs = [], liste = []
  let requetes = 0, octets = 0
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erreurs.push(`${m.type()} : ${m.text().slice(0, 160)}`) })
  page.on('pageerror', (e) => erreurs.push(`exception : ${String(e.message ?? e).slice(0, 160)}`))
  page.on('requestfailed', (r) => { if (r.url().startsWith(SITE)) echecs.push(`${r.method()} ${r.url().replace(SITE, '')} · ${r.failure()?.errorText}`) })
  page.on('response', async (r) => {
    if (!r.url().startsWith(SITE)) return
    requetes++
    if (r.status() >= 400) echecs.push(`${r.status()} ${r.request().method()} ${r.url().replace(SITE, '')}`)
    let taille = Number(r.headers()['content-length'] ?? 0)
    if (!taille) { try { taille = (await r.body()).length } catch { /* redirection */ } }
    octets += taille
    liste.push({ url: r.url().replace(SITE, ''), taille, type: r.request().resourceType() })
  })
  const t0 = Date.now()
  let tDom = 0, tLoad = 0
  page.once('domcontentloaded', () => { tDom = Date.now() - t0 })
  try { await page.goto(SITE + p.url, { waitUntil: 'load', timeout: 120000 }); tLoad = Date.now() - t0 } catch (e) { erreurs.push(`chargement : ${String(e.message).slice(0, 100)}`) }
  try { await page.waitForLoadState('networkidle', { timeout: 30000 }) } catch { /* jamais calme */ }
  const tCalme = Date.now() - t0
  await page.waitForTimeout(500)
  const mesures = await page.evaluate(() => {
    const dpr = window.devicePixelRatio || 1
    const imgs = [...document.images]
    const surdim = imgs.filter((i) => i.naturalWidth > 0 && i.clientWidth > 0 && i.naturalWidth > i.clientWidth * dpr * 1.6).length
    const sansAlt = imgs.filter((i) => !i.hasAttribute('alt')).length
    // Les cibles tactiles sous 44 px de HAUT (un lien large mais bas se rate
    // autant qu'un petit bouton) — hors les liens dans une phrase, que le
    // pouce ne vise pas isolément.
    const petites = [...document.querySelectorAll('a[href], button, [role="button"], input, select, textarea')].filter((el) => {
      const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
      if (!(r.width > 0 && r.height > 0) || st.visibility === 'hidden') return false
      if (st.display === 'inline' && el.parentElement && (el.parentElement.textContent || '').trim().length > (el.textContent || '').trim().length + 12) return false
      return r.height < 44 || r.width < 44
    })
    const cibles = petites.length
    const ciblesListe = petites.slice(0, 10).map((el) => { const r = el.getBoundingClientRect(); return `${el.tagName.toLowerCase()} ${Math.round(r.width)}×${Math.round(r.height)} « ${(el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28)} »` })
    const sansNom = [...document.querySelectorAll('button, a[href]')].filter((el) => {
      const r = el.getBoundingClientRect(); if (r.width === 0) return false
      const nom = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim()
      return !nom && !el.querySelector('img[alt]:not([alt=""])') && !el.querySelector('[aria-label]')
    }).length
    return { ...window.__m, images: imgs.length, surdim, sansAlt, cibles, ciblesListe, sansNom, texte: document.body.innerText.length }
  })
  try { await page.screenshot({ path: join(D, 'captures', p.nom.replace(/[^a-z]+/gi, '-').toLowerCase() + '.png') }) } catch { /* tant pis */ }
  resultats.push({ ...p, requetes, octets, tDom, tLoad, tCalme, ...mesures, erreurs, echecs, tiers: [...tiers], liste })
  await ctx.close()
}
await navigateur.close()

// ── Le tableau ───────────────────────────────────────────────────────────────
console.log('\n  Téléphone d’entrée de gamme, 3G rapide (1,6 Mbit/s, 150 ms), processeur ×4 plus lent, visite à froid :\n')
const col = (s, n) => String(s).padEnd(n)
console.log('  ' + col('page', 22) + col('req.', 6) + col('réseau', 9) + col('DOM', 8) + col('chargée', 9) + col('calme', 8) + col('LCP', 8) + col('CLS', 7) + col('err.', 6) + col('échecs', 8) + col('img>case', 9) + col('<44px', 7) + 'tiers')
for (const r of resultats) {
  console.log('  ' + col(r.nom, 22) + col(r.requetes, 6) + col(ko(r.octets), 9) + col(`${(r.tDom / 1000).toFixed(1)} s`, 8) + col(`${(r.tLoad / 1000).toFixed(1)} s`, 9)
    + col(`${(r.tCalme / 1000).toFixed(1)} s`, 8) + col(`${(r.lcp / 1000).toFixed(1)} s`, 8) + col(r.cls.toFixed(3), 7) + col(r.erreurs.length, 6) + col(r.echecs.length, 8) + col(`${r.surdim}/${r.images}`, 9) + col(r.cibles, 7) + r.tiers.length)
}
console.log()
for (const r of resultats) {
  console.log(`  ── ${r.nom} ──`)
  for (const e of [...new Set(r.erreurs)].filter((e) => !/Service Worker registration blocked/.test(e))) console.log(`     ⚠️  ${e}`)
  for (const e of [...new Set(r.echecs)]) console.log(`     ❌ ${e}`)
  if (r.tiers.length) console.log(`     🌐 scripts tiers appelés : ${r.tiers.join(', ')}`)
  if (r.sansAlt) console.log(`     ♿ ${r.sansAlt} image(s) sans attribut alt`)
  if (r.sansNom) console.log(`     ♿ ${r.sansNom} bouton(s)/lien(s) sans nom accessible`)
  if (r.lcpElement) console.log(`     🖼  LCP : ${r.lcpElement}`)
  for (const d of r.decalages ?? []) console.log(`     ↕  décalage ${d.v} à ${d.t} ms : ${d.qui.join(' ; ')}`)
  if (r.ciblesListe?.length) console.log(`     👆 cibles < 44 px : ${r.ciblesListe.join(' · ')}`)
  // Les six requêtes les plus lourdes, et celles qui partent plusieurs fois.
  const lourdes = [...r.liste].sort((a, b) => b.taille - a.taille).slice(0, 6)
  for (const q of lourdes) console.log(`     ⬇  ${ko(q.taille).padStart(7)}  ${q.url.split('?')[0].slice(0, 70)}`)
  const compte = new Map()
  for (const q of r.liste) { const u = q.url.split('?')[0]; compte.set(u, (compte.get(u) ?? 0) + 1) }
  const api = r.liste.filter((q) => q.url.startsWith('/api/')).map((q) => q.url.split('?')[0])
  console.log(`     🔁 ${api.length} appel(s) API : ${[...new Set(api)].join(', ').slice(0, 300)}`)
  for (const [u, n] of compte) if (n > 1) console.log(`     🔁 ${n} × ${u}`)
}
console.log(`\n  captures : ${join(D, 'captures')}`)
writeFileSync(join(D, 'resultats.json'), JSON.stringify(resultats, null, 1))

console.log()
const exceptions = resultats.flatMap((r) => r.erreurs.filter((e) => e.startsWith('exception') || e.startsWith('chargement')))
const echecsNotres = resultats.flatMap((r) => r.echecs)
dire(exceptions.length === 0, 'aucune exception JavaScript sur les neuf pages', exceptions.slice(0, 3).join(' | '))
dire(echecsNotres.length === 0, 'aucune requête vers notre serveur en échec', echecsNotres.slice(0, 3).join(' | '))
// 120 : la page de connexion, volontairement sobre, fait 184 caractères.
dire(resultats.every((r) => r.texte > 120), 'chaque page a rendu du contenu (pas d’écran blanc)', resultats.filter((r) => r.texte <= 120).map((r) => `${r.nom} : ${r.texte}`).join(', '))
if (rouges) { console.log(`\n❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log('\n✅ Le front tient ; les chiffres ci-dessus disent ce qui pèse.')
process.exit(0)
