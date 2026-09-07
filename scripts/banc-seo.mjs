// =============================================================================
//  BANC DES PAGES POUR LES ROBOTS ET LES PARTAGES — web/seo.php (07/09/2026)
//
//      npm run banc:seo
//
//  Trouvé par 📣 Le Crieur le 07/09/2026 : l'annonce « Un Lit capitonné »
//  affichait 585 000 FCFA à Google et à WhatsApp quinze jours APRÈS la fin de
//  sa promotion, alors que le site montrait bien 650 000 FCFA à un visiteur.
//  `seo.php` lisait `promo_price ?: price` sans jamais regarder `promo_until` —
//  à trois endroits, et la requête de la page catégorie ne ramenait même pas
//  la colonne. Un prix faux sur un partage WhatsApp, c'est l'acheteur qui
//  arrive avec un chiffre en tête et repart fâché.
//
//  Le banc sert `seo.php` sur un serveur PHP local, avec une base SQLite qui
//  contient quatre annonces :
//    · promo EN COURS      → le prix promo partout ;
//    · promo EXPIRÉE       → le prix normal partout (c'était le bug) ;
//    · promo SANS DATE     → le prix promo (une promo sans fin reste active) ;
//    · sans promo          → le prix normal.
//  Il vérifie les trois endroits : le titre et la description de la fiche,
//  le JSON-LD que Google lit, et les cartes de la page catégorie.
//
//  ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : l'annonce à promo en cours est là
//  pour montrer que la garde ne casse pas les promotions vivantes.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-seo')
rmSync(D, { recursive: true, force: true })
mkdirSync(join(D, 'api'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8219
const SITE = `http://127.0.0.1:${PORT}`
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

// `seo.php` charge `__DIR__ . '/api/config.php'` : on lui en pose un, sur SQLite.
copyFileSync(join(racine, 'web/seo.php'), join(D, 'seo.php'))
writeFileSync(join(D, 'api/config.php'), `<?php
return [
  'db' => ['driver' => 'sqlite', 'sqlite_path' => ${JSON.stringify(DB)}],
  'site_url' => 'https://chap.ci',
  'uploads_path' => '/uploads',
];
`)

// La base : le strict nécessaire que seo.php lit sur une annonce.
const iso = (t) => new Date(t).toISOString().replace(/\.\d{3}Z$/, 'Z')
const dans = (jours) => iso(Date.now() + jours * 86400000)
const sql = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', DB, q])
sql(`CREATE TABLE listings (
  id TEXT PRIMARY KEY, user_id TEXT, title TEXT, description TEXT, price INTEGER,
  category_id TEXT, subcategory TEXT, images TEXT, commune TEXT, city_id TEXT,
  promo_price INTEGER, promo_until TEXT, hidden INTEGER, sold INTEGER, created_at TEXT
)`)
sql('CREATE TABLE users (id TEXT PRIMARY KEY, verified INTEGER, pro_status TEXT, pro_nom TEXT)')
sql('CREATE TABLE profiles (id TEXT PRIMARY KEY, full_name TEXT, bio TEXT, avatar_url TEXT)')
// Quatre annonces de la même catégorie, pour qu'elles se retrouvent toutes sur
// la page « /vendre/maison ».
const ANNONCES = [
  // id, titre, prix, promo, fin de promo
  ['en-cours', 'Lit capitonné promo en cours', 650000, 585000, dans(7)],
  ['expiree', 'Lit capitonné promo expirée', 650000, 585000, dans(-15)],
  ['sans-fin', 'Lit capitonné promo sans fin', 650000, 585000, null],
  ['sans-promo', 'Lit capitonné sans promotion', 650000, null, null],
]
for (const [id, titre, prix, promo, fin] of ANNONCES) {
  sql(`INSERT INTO listings (id,user_id,title,description,price,category_id,subcategory,images,commune,city_id,promo_price,promo_until,hidden,sold,created_at)
       VALUES ('${id}','u1','${titre}','Un lit solide, à voir sur place à Treichville.',${prix},'maison','Literie','[]','Treichville','abidjan-ville',
               ${promo === null ? 'NULL' : promo}, ${fin === null ? 'NULL' : `'${fin}'`}, 0, 0, '${iso(Date.now())}')`)
}

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'seo.php'], { cwd: D, stdio: 'ignore', detached: true })
serveur.unref()
const fini = () => { try { process.kill(serveur.pid) } catch { /* déjà parti */ } try { process.kill(-serveur.pid) } catch { /* déjà parti */ } }
process.on('exit', fini)
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { fini(); process.exit(130) })
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const FACEBOOK = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
const page = async (chemin, ua = GOOGLEBOT) => {
  const r = await fetch(SITE + chemin, { headers: { 'User-Agent': ua } })
  return r.text()
}
for (let i = 0; i < 40; i++) {
  try { const t = await page('/annonce/sans-promo'); if (t.includes('650')) break } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 250))
}

// Le prix, tel qu'il apparaît dans le titre, l'aperçu de partage, et le JSON-LD.
const NBSP = /[   ]/g
const prixEcrits = (html) => {
  const t = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? ''
  const og = (html.match(/property="og:title" content="([^"]*)"/) ?? [])[1] ?? ''
  const desc = (html.match(/name="description" content="([^"]*)"/) ?? [])[1] ?? ''
  const ld = (html.match(/"price":(\d+)/) ?? [])[1] ?? ''
  return { titre: t.replace(NBSP, ' '), og: og.replace(NBSP, ' '), desc: desc.replace(NBSP, ' '), ld }
}

console.log('── La fiche d’une annonce, vue par Google et par WhatsApp ' + '─'.repeat(14))
let p = prixEcrits(await page('/annonce/expiree'))
dire(/650 000 FCFA/.test(p.titre) && !/585/.test(p.titre), 'promo EXPIRÉE : le titre dit le prix normal, 650 000 FCFA', p.titre.slice(0, 80))
dire(p.ld === '650000', 'et le JSON-LD que Google lit aussi', `"price":${p.ld}`)
dire(/650 000/.test(p.og) && !/585/.test(p.og), 'et l’aperçu de partage (og:title)', p.og.slice(0, 70))
p = prixEcrits(await page('/annonce/expiree', FACEBOOK))
dire(/650 000/.test(p.titre) && p.ld === '650000', 'vu par Facebook : le même prix normal', `${p.titre.slice(0, 50)} · ${p.ld}`)

p = prixEcrits(await page('/annonce/en-cours'))
dire(/585 000 FCFA/.test(p.titre) && p.ld === '585000', 'promo EN COURS : le prix promotionnel, 585 000 FCFA — la garde ne casse pas les promos vivantes', `${p.titre.slice(0, 50)} · ${p.ld}`)
p = prixEcrits(await page('/annonce/sans-fin'))
dire(/585 000 FCFA/.test(p.titre) && p.ld === '585000', 'promo SANS DATE de fin : le prix promotionnel (une promo sans fin reste active)', p.ld)
p = prixEcrits(await page('/annonce/sans-promo'))
dire(/650 000 FCFA/.test(p.titre) && p.ld === '650000', 'sans promotion : le prix normal', p.ld)

console.log('\n── Les cartes de la page catégorie ' + '─'.repeat(37))
const cat = await page('/vendre/maison')
// UNE carte, et pas ce qui la suit : on s'arrête au </a> qui la ferme. Une
// fenêtre de 400 caractères débordait sur la carte voisine — et « 585 » y
// apparaissait, ce qui faisait échouer une vérification pourtant bonne.
const carte = (id) => {
  const i = cat.indexOf(`/annonce/${id}"`)
  if (i < 0) return ''
  const fin = cat.indexOf('</a>', i)
  return cat.slice(i, fin < 0 ? i + 400 : fin).replace(NBSP, ' ')
}
dire(cat.includes('/annonce/expiree'), 'la page catégorie liste bien les quatre annonces', `${(cat.match(/class="card"/g) ?? []).length} cartes`)
dire(/650 000 FCFA/.test(carte('expiree')) && !/585/.test(carte('expiree')), 'promo expirée : la carte affiche 650 000 FCFA', (carte('expiree').match(/class="pr">([^<]*)/) ?? [])[1])
dire(/585 000 FCFA/.test(carte('en-cours')), 'promo en cours : la carte affiche 585 000 FCFA', (carte('en-cours').match(/class="pr">([^<]*)/) ?? [])[1])
dire(/585 000 FCFA/.test(carte('sans-fin')), 'promo sans date de fin : 585 000 FCFA', (carte('sans-fin').match(/class="pr">([^<]*)/) ?? [])[1])
dire(/650 000 FCFA/.test(carte('sans-promo')), 'sans promotion : 650 000 FCFA', (carte('sans-promo').match(/class="pr">([^<]*)/) ?? [])[1])

console.log('\n── Ce qui ne doit pas bouger ' + '─'.repeat(43))
const sitemap = await page('/sitemap.xml')
dire(sitemap.includes('<urlset') && sitemap.includes('/annonce/expiree'), 'le sitemap liste toujours les annonces', `${(sitemap.match(/<url>/g) ?? []).length} URLs`)
const fiche = await page('/annonce/sans-promo')
dire(/"@type": *"Product"/.test(fiche) && /"priceCurrency": *"XOF"/.test(fiche), 'le JSON-LD reste un Product en XOF')
dire(/rel="canonical"/.test(fiche) && /name="robots" content="index, follow"/.test(fiche), 'canonical et robots index,follow toujours là')

console.log(`\n${rouges === 0 ? '✅ Tout est vert' : `❌ ${rouges} vérification${rouges > 1 ? 's' : ''} en échec`}`)
process.exit(rouges === 0 ? 0 : 1)
