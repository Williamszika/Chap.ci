#!/usr/bin/env node
/* BANC CSP — la CSP servie laisse-t-elle vivre les médias du site ?
 * ---------------------------------------------------------------------------
 * Pourquoi ce banc existe (15/09/2026)
 *
 * La vidéo d'annonce est partie le 04/09/2026. Elle n'a JAMAIS marché sur le
 * site. La CSP injectée dans index.html n'avait aucune directive `media-src` :
 * elle retombait donc sur `default-src 'self'`, qui n'autorise pas `blob:`.
 * « Publier » lit la durée de la vidéo choisie avec un <video src="blob:…"> ;
 * le navigateur refusait le chargement, `onerror` partait, `dureeVideo()`
 * renvoyait -1, et le vendeur lisait :
 *
 *     « Ce fichier n'est pas une vidéo lisible. »
 *
 * Un message qui accuse le fichier du vendeur quand la faute est chez nous.
 * Onze jours, et une seule violation remontée en sept jours — parce qu'une
 * seule personne a essayé, une fois, et a cru que sa vidéo était mauvaise.
 *
 * ⚠️ LA LEÇON, ET C'EST ELLE QUI COMPTE : la rareté d'un RAPPORT n'est pas la
 * rareté d'un IMPACT. Une fonction cassée à 100 % ne produit qu'un rapport si
 * une seule personne l'essaie. « Trop rare pour être un chantier » est un
 * jugement qu'on ne peut pas porter sur un compteur de rapports seul.
 *
 * ---------------------------------------------------------------------------
 * Ce que le banc fait
 *
 * Deux bras, avec la MÊME vidéo témoin — sinon rien n'est prouvé :
 *
 *   BRAS RÉEL   la CSP lue dans dist/index.html          -> DOIT passer
 *   BRAS TÉMOIN la même CSP, `media-src` retiré          -> DOIT échouer
 *
 * Le second bras n'est pas décoratif : il prouve que le banc SAIT VOIR la
 * panne. Un banc qui ne peut pas échouer ne vérifie rien. S'il passe au vert
 * alors que `media-src` a été retiré, c'est le banc qui est cassé, pas la CSP.
 *
 * La vidéo témoin est enregistrée par le navigateur lui-même (MediaRecorder
 * sur un canvas) : aucun fichier à versionner, et elle est décodable par
 * construction puisque c'est ce même navigateur qui l'a produite.
 *
 *   npm run banc:csp
 *
 * Demande Chromium (CHROMIUM_PATH) et playwright-core, comme `banc:front`.
 * Ne touche pas la production : tout se passe sur un serveur local.
 */
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'

const DEPOT = new URL('..', import.meta.url).pathname
const CHROMIUM = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'

let chromium
try {
  ({ chromium } = createRequire(import.meta.url)('playwright-core'))
} catch {
  console.error('⛔ playwright-core absent. Installez-le sans l’ajouter au dépôt :')
  console.error('   npm i --no-save playwright-core')
  process.exit(1)
}

// ── La CSP RÉELLE, lue dans le site construit — jamais recopiée à la main ────
let html
try {
  html = readFileSync(DEPOT + 'dist/index.html', 'utf8')
} catch {
  console.error('⛔ dist/index.html absent. Construisez d’abord le site : npm run build')
  process.exit(1)
}
const trouve = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)
if (!trouve) {
  console.error('⛔ Aucune CSP dans dist/index.html.')
  console.error('   Le plugin `chapci-csp` de vite.config.ts ne s’applique QU’au build de')
  console.error('   production. Un `dist/` produit autrement n’est pas ce que voient les visiteurs.')
  process.exit(1)
}
const CSP_REELLE = trouve[1]
// Le bras témoin : la même CSP, amputée de media-src. C'est l'état du 04/09.
const CSP_TEMOIN = CSP_REELLE.replace(/;?\s*media-src[^;]*/g, '')

console.log('BANC CSP — les médias du site face à la CSP servie')
console.log('─'.repeat(72))
console.log('CSP lue dans dist/index.html :', CSP_REELLE.length, 'caractères')
console.log('  default-src :', (CSP_REELLE.match(/default-src[^;]*/) || ['(aucun)'])[0])
console.log('  media-src   :', (CSP_REELLE.match(/media-src[^;]*/) || ['(AUCUN — c’est la panne du 04/09)'])[0])
console.log()

const page_html = (csp) => `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
</head><body><canvas id="c" width="320" height="240"></canvas></body></html>`

const serveur = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(page_html(req.url.startsWith('/temoin') ? CSP_TEMOIN : CSP_REELLE))
})
await new Promise((r) => serveur.listen(0, '127.0.0.1', r))
const port = serveur.address().port

/* La sonde reprend `dureeVideo()` de src/pages/PostAd.tsx à l'identique.
 * Si ce code change là-bas, il doit changer ici — c'est le prix d'un banc qui
 * teste ce que le vendeur vit vraiment, et non une approximation. */
const SONDE = `async () => {
  const c = document.getElementById('c'), ctx = c.getContext('2d')
  const bouts = []
  const rec = new MediaRecorder(c.captureStream(15), { mimeType: 'video/webm' })
  rec.ondataavailable = (e) => bouts.push(e.data)
  rec.start()
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = 'hsl(' + i * 12 + ',80%,50%)'
    ctx.fillRect(0, 0, 320, 240)
    await new Promise((r) => setTimeout(r, 33))
  }
  await new Promise((r) => { rec.onstop = r; rec.stop() })
  const blob = new Blob(bouts, { type: 'video/webm' })
  if (blob.size < 1000) return { erreur: 'vidéo témoin trop petite : ' + blob.size + ' octets' }

  const duree = await new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    const url = URL.createObjectURL(blob)
    const fin = (d) => { URL.revokeObjectURL(url); resolve(d) }
    v.onloadedmetadata = () => fin(Number.isFinite(v.duration) ? v.duration : 0)
    v.onerror = () => fin(-1)
    v.src = url
    setTimeout(() => fin(-2), 5000)
  })
  return { poids: blob.size, duree }
}`

const nav = await chromium.launch({ executablePath: CHROMIUM })

async function bras(nom, chemin) {
  const page = await nav.newPage()
  const refus = []
  page.on('console', (m) => {
    if (/Refused to load media|Content Security Policy/i.test(m.text())) refus.push(m.text().slice(0, 140))
  })
  const r = await page.goto(`http://127.0.0.1:${port}${chemin}`).then(() => page.evaluate(`(${SONDE})()`))
  await page.close()
  console.log('──', nom)
  if (r.erreur) { console.log('   ⚠️ ', r.erreur); return null }
  console.log(`   vidéo témoin : ${r.poids} octets · dureeVideo() : ${r.duree}`)
  refus.forEach((v) => console.log('   CSP →', v))
  const lisible = r.duree > 0
  console.log('   =>', lisible
    ? '✅ vidéo LISIBLE — le vendeur peut publier'
    : '❌ vidéo REFUSÉE — le vendeur lirait « Ce fichier n’est pas une vidéo lisible »')
  console.log()
  return lisible
}

const reel = await bras('BRAS RÉEL — la CSP que le site sert aujourd’hui', '/reel')
const temoin = await bras('BRAS TÉMOIN — la même CSP sans media-src (l’état du 04/09)', '/temoin')

await nav.close()
serveur.close()

console.log('═'.repeat(72))
if (reel === true && temoin === false) {
  console.log('✅ VERT. La CSP servie laisse passer la vidéo, et le banc sait voir la panne')
  console.log('   quand on retire media-src. Les deux moitiés du contrat sont tenues.')
  process.exit(0)
}
if (reel === false) {
  console.log('⛔ ROUGE. La CSP servie REFUSE la vidéo : « Publier » est cassé sur le site.')
  console.log('   Il manque `media-src \'self\' blob:` dans le tableau CSP de vite.config.ts,')
  console.log('   puis `npm run build`. C’est exactement la panne du 04/09 au 15/09.')
  process.exit(1)
}
console.log('⚠️  BANC CASSÉ, ET NON LA CSP. Le bras témoin aurait dû échouer et il a réussi :')
console.log('   ce banc ne peut donc plus détecter la panne qu’il est censé garder.')
console.log('   Ne tirez aucune conclusion verte du bras réel tant que ceci n’est pas réglé.')
process.exit(2)
