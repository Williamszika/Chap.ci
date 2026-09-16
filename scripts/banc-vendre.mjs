// =============================================================================
//  BANC DES PAGES « VENDEZ À {VILLE} » — web/seo.php (16/09/2026)
//
//      npm run banc:vendre
//
//  POURQUOI CE BANC EXISTE
//
//  Le sitemap annonçait 16 catégories × (1 + 22 villes) = 368 pages, SANS AUCUNE
//  CONDITION, pour 46 annonces. Et la requête qui remplit ces pages ne filtrait
//  que sur `category_id` : les 22 pages ville d'une même catégorie affichaient
//  donc LES MÊMES annonces, et ne différaient que par le nom de la ville dans le
//  texte. La ville de l'URL était décorative. 368 pages quasi jumelles, c'est du
//  contenu dupliqué, et Google le fait payer AU DOMAINE ENTIER.
//
//  ⚠️ CE QUE CE BANC GARDE VRAIMENT : que deux pages ville de la même catégorie
//  ne se ressemblent PAS. C'est la panne d'origine, et c'est la seule chose
//  qu'un compteur de pages n'aurait jamais vue — 368 pages toutes justes une par
//  une, et fausses ensemble.
//
//  La base : une catégorie « maison » avec 4 annonces à Treichville et 1 à Man.
//  Ce découpage rend les quatre vérifications falsifiables d'un coup :
//    · Treichville (4 ≥ 3) → indexable, dans le sitemap, ET ne montre QUE ses 4 ;
//    · Man          (1 < 3) → `noindex`, hors sitemap, et ne montre QUE la sienne ;
//    · Abidjan              → doit TROUVER les 4 de Treichville (une annonce à
//      Treichville est à Abidjan — sans ce regroupement, la page la plus
//      recherchée du site serait vide alors que le stock existe) ;
//    · la page catégorie sans ville → indexable quoi qu'il arrive.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-vendre')
rmSync(D, { recursive: true, force: true })
mkdirSync(join(D, 'api'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8231
const SITE = `http://127.0.0.1:${PORT}`
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

copyFileSync(join(racine, 'web/seo.php'), join(D, 'seo.php'))
writeFileSync(join(D, 'api/config.php'), `<?php
return [
  'db' => ['driver' => 'sqlite', 'sqlite_path' => ${JSON.stringify(DB)}],
  'site_url' => 'https://chap.ci',
  'uploads_path' => '/uploads',
];
`)

const iso = (t) => new Date(t).toISOString().replace(/\.\d{3}Z$/, 'Z')
const sql = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', DB, q])
sql(`CREATE TABLE listings (
  id TEXT PRIMARY KEY, user_id TEXT, title TEXT, description TEXT, price INTEGER,
  category_id TEXT, subcategory TEXT, images TEXT, commune TEXT, city_id TEXT,
  promo_price INTEGER, promo_until TEXT, hidden INTEGER, sold INTEGER, created_at TEXT
)`)
sql('CREATE TABLE users (id TEXT PRIMARY KEY, verified INTEGER, pro_status TEXT, pro_nom TEXT)')
sql('CREATE TABLE profiles (id TEXT PRIMARY KEY, full_name TEXT, bio TEXT, avatar_url TEXT)')

const ANNONCES = [
  ['tre-1', 'Lit capitonné de Treichville', 'Treichville'],
  ['tre-2', 'Armoire trois portes de Treichville', 'Treichville'],
  ['tre-3', 'Table basse de Treichville', 'Treichville'],
  ['tre-4', 'Matelas neuf de Treichville', 'Treichville'],
  ['man-1', 'Canapé unique de Man', 'Man'],
  // Une annonce MASQUÉE et une VENDUE à Treichville : elles ne doivent compter
  // nulle part, ni dans la page, ni dans le seuil, ni dans le sitemap.
  ['tre-cache', 'Buffet masqué de Treichville', 'Treichville', 1, 0],
  ['tre-vendu', 'Commode vendue de Treichville', 'Treichville', 0, 1],
]
for (const [id, titre, commune, cache = 0, vendu = 0] of ANNONCES) {
  sql(`INSERT INTO listings (id,user_id,title,description,price,category_id,subcategory,images,commune,city_id,promo_price,promo_until,hidden,sold,created_at)
       VALUES ('${id}','u1','${titre}','Un meuble solide.',650000,'maison','Literie','[]','${commune}','abidjan-ville',NULL,NULL,${cache},${vendu},'${iso(Date.now())}')`)
}

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'seo.php'], { cwd: D, stdio: 'ignore', detached: true })
serveur.unref()
const fini = () => { try { process.kill(serveur.pid) } catch { /* déjà parti */ } try { process.kill(-serveur.pid) } catch { /* déjà parti */ } }
process.on('exit', fini)
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { fini(); process.exit(130) })

const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const page = async (chemin) => (await fetch(SITE + chemin, { headers: { 'User-Agent': GOOGLEBOT } })).text()
for (let i = 0; i < 40; i++) {
  try { if ((await page('/vendre/maison')).includes('Treichville')) break } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 250))
}

/** Titres des annonces réellement affichés dans la grille de la page. */
const vignettes = (html) => [...html.matchAll(/<div class="ti">([^<]*)<\/div>/g)].map((m) => m[1])
const indexable = (html) => !/content="noindex/.test(html)

console.log('\nBANC DES PAGES « VENDEZ À {VILLE} »')
console.log('─'.repeat(72))

console.log('\n── La ville filtre-t-elle enfin les annonces ?')
const tre = await page('/vendre/maison/treichville')
const man = await page('/vendre/maison/man')
const vTre = vignettes(tre), vMan = vignettes(man)
dire(vTre.length === 4, `Treichville montre ses 4 annonces`, `${vTre.length} vignette(s)`)
dire(vTre.every((t) => t.includes('Treichville')), 'et AUCUNE annonce d’ailleurs', vTre.join(' · ') || '(aucune)')
dire(vMan.length === 1, 'Man montre sa seule annonce', `${vMan.length} vignette(s)`)
dire(vMan.every((t) => t.includes('Man')), 'et pas celles de Treichville', vMan.join(' · ') || '(aucune)')

console.log('\n── ⚠️ LA PANNE D’ORIGINE : deux villes ne doivent PAS se ressembler')
// Avant le 16/09, ces deux listes étaient identiques : la requête ignorait la
// commune. C'est LA vérification qui compte ; les autres en découlent.
const memes = vTre.length === vMan.length && vTre.every((t, i) => t === vMan[i])
dire(!memes, 'les deux pages ville n’affichent pas les mêmes annonces',
  memes ? 'IDENTIQUES — la commune est de nouveau ignorée' : 'listes distinctes')

console.log('\n── Le seuil d’indexation')
dire(indexable(tre), 'Treichville (4 ≥ 3) reste indexable')
dire(!indexable(man), 'Man (1 < 3) passe en noindex')
dire(/content="noindex, follow"/.test(man), 'et en « follow » : la page sort de l’index, pas les liens')
dire(indexable(await page('/vendre/maison')), 'la page catégorie sans ville reste indexable')

console.log('\n── Abidjan couvre ses communes')
const abj = vignettes(await page('/vendre/maison/abidjan'))
dire(abj.length === 4, 'Abidjan trouve les 4 annonces de Treichville', `${abj.length} vignette(s)`)
dire(indexable(await page('/vendre/maison/abidjan')), 'et reste donc indexable')

console.log('\n── Masquées et vendues ne comptent nulle part')
dire(!tre.includes('Buffet masqué'), 'l’annonce masquée n’apparaît pas')
dire(!tre.includes('Commode vendue'), 'l’annonce vendue n’apparaît pas')

console.log('\n── Le sitemap ne propose que ce qui a du stock')
const sm = await page('/sitemap.xml')
const url = (u) => sm.includes(`<loc>https://chap.ci${u}</loc>`)
dire(url('/vendre/maison/treichville'), 'Treichville y est')
dire(!url('/vendre/maison/man'), 'Man n’y est pas')
dire(!url('/vendre/maison/bouake'), 'Bouaké (0 annonce) n’y est pas')
dire(url('/vendre/maison'), 'la page catégorie y est')
dire(url('/vendre/vehicules'), 'et celle d’une catégorie vide aussi (16 pages uniques, pas de doublon)')
const nbVendre = [...sm.matchAll(/<loc>https:\/\/chap\.ci\/vendre\//g)].length
dire(nbVendre < 30, `le sitemap est passé de 368 pages /vendre/ à ${nbVendre}`, `${nbVendre} page(s)`)

console.log('\n' + '═'.repeat(72))
if (rouges) {
  console.log(`⛔ ${rouges} vérification(s) au rouge.`)
  process.exit(1)
}
console.log('✅ Les pages ville portent enfin quelque chose qui leur soit propre.')
