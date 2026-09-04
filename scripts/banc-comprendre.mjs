// =============================================================================
//  BANC DE LA RECHERCHE QUI COMPREND — chantier 3 du 04/09/2026.
//
//      npm run banc:comprendre
//
//  Les MÊMES questions posées aux deux jumeaux qu'on peut interroger d'ici :
//  le site (src/lib/recherche.ts, assemblé par esbuild) et le serveur
//  (recherche_*() de server/index.php, à travers GET /listings?q= sur SQLite).
//  Le jumeau Dart répond aux mêmes questions dans
//  flutter_app/test/recherche_test.dart. Si l'un des trois diverge, un
//  acheteur trouverait sur le site ce qu'il ne trouve pas dans l'application.
//
//  ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : la moitié des questions sont des
//  refus attendus — « iphone 14 » ne doit PAS trouver un iPhone 13, « moto »
//  ne doit pas trouver une voiture. Un moteur qui dirait oui à tout passerait
//  un banc qui ne compte que les oui.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-comprendre')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

// ── Les annonces du banc, et les questions ──────────────────────────────────
const ANNONCES = [
  { id: 'tv', title: 'Télévision Samsung 43 pouces', description: 'Écran plat, très bon état.', categoryId: 'electronique', subcategory: 'TV & Écrans', attributes: { marque: 'Samsung' } },
  { id: 'frigo', title: 'Réfrigérateur Hisense 2 portes', description: 'Froid ventilé.', categoryId: 'maison', subcategory: 'Électroménager', attributes: {} },
  { id: 'iphone', title: 'iPhone 13 – 128 Go', description: 'Batterie 91 %, avec chargeur.', categoryId: 'electronique', subcategory: 'Smartphones', attributes: { marque: 'Apple', stockage: '128 Go' } },
  { id: 'galaxy', title: 'Galaxy A15 comme neuf', description: 'Jamais tombé.', categoryId: 'electronique', subcategory: 'Smartphones', attributes: { marque: 'Samsung', stockage: '128 Go' } },
  { id: 'nike', title: 'Basket Nike Air taille 42', description: 'Portées deux fois.', categoryId: 'mode', subcategory: 'Chaussures', attributes: {} },
  { id: 'appart', title: 'Appartement 3 pièces à Cocody', description: 'Riviera 2, calme.', categoryId: 'immobilier', subcategory: 'Appartements', attributes: {} },
  { id: 'hiace', title: 'Minibus Toyota Hiace 18 places', description: 'Ligne Yopougon.', categoryId: 'vehicules', subcategory: 'Camions & Utilitaires', attributes: {} },
  { id: 'corolla', title: 'Toyota Corolla 2012', description: 'Climatisation OK.', categoryId: 'vehicules', subcategory: 'Voitures', attributes: {} },
  { id: 'jakarta', title: 'Moto Haojue 125', description: 'Papiers à jour.', categoryId: 'vehicules', subcategory: 'Motos & Scooters', attributes: {} },
  { id: 'nounou', title: 'Cherche nourrice à Marcory', description: 'Deux enfants, temps plein.', categoryId: 'emploi', subcategory: 'Emploi maison', attributes: {} },
  { id: 'clim', title: 'Split 1,5 CV Midea', description: 'Avec installation.', categoryId: 'maison', subcategory: 'Électroménager', attributes: {} },
  { id: 'gaz', title: 'Bouteille de gaz 12 kg pleine', description: 'Livraison possible.', categoryId: 'maison', subcategory: 'Cuisine', attributes: {} },
]
/** [requête, identifiants attendus] — l'ordre n'importe pas. */
const QUESTIONS = [
  ['télé', ['tv']],
  ['tv', ['tv']],
  ['television', ['tv']],
  ['telvision', ['tv']],
  ['televison samsung', ['tv']],
  ['frigo', ['frigo']],
  ['refrigirateur', ['frigo']],
  ['portable', ['iphone', 'galaxy']],
  ['smartphone 128', ['iphone', 'galaxy']],
  ['iphone 13', ['iphone']],
  ['iphone 14', []],
  ['samsung', ['tv', 'galaxy']],
  ['samsumg', ['tv', 'galaxy']],
  ['chaussures nike', ['nike']],
  ['basket', ['nike']],
  ['appart cocody', ['appart']],
  ['appartement 3 pièces', ['appart']],
  ['gbaka', ['hiace']],
  ['voiture', ['corolla']],
  ['moto', ['jakarta']],
  ['jakarta', ['jakarta']],
  ['nounou', ['nounou']],
  ['clim', ['clim']],
  ['climatiseur midea', ['clim']],
  ['gaz', ['gaz']],
  ['bouteille de gaz', ['gaz']],
  ['tv d’occasion', []],
  ['', ANNONCES.map((a) => a.id)],
]
const CATEGORIES = { electronique: 'Électronique', maison: 'Maison & Meubles', mode: 'Mode & Beauté', immobilier: 'Immobilier', vehicules: 'Véhicules', emploi: 'Emploi' }
const texte = (a) => `${a.title} ${a.description} ${a.subcategory} ${CATEGORIES[a.categoryId]} ${Object.values(a.attributes).join(' ')}`
const meme = (a, b) => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i])

// ── Le site ─────────────────────────────────────────────────────────────────
console.log('── Le site (src/lib/recherche.ts) ' + '─'.repeat(38))
execFileSync(join(racine, 'node_modules/.bin/esbuild'), [join(racine, 'src/lib/recherche.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${join(D, 'recherche.mjs')}`, '--log-level=error'])
const site = await import(pathToFileURL(join(D, 'recherche.mjs')).href)
const prepares = ANNONCES.map((a) => [a.id, site.preparer(texte(a))])
for (const [q, attendu] of QUESTIONS) {
  const trouve = prepares.filter(([, p]) => site.correspond(p, q)).map(([id]) => id)
  dire(meme(trouve, attendu), `« ${q || '(vide)'} » → ${attendu.length ? attendu.join(', ') : 'rien'}`, meme(trouve, attendu) ? '' : `trouvé : ${trouve.join(', ') || 'rien'}`)
}
dire(site.distance('samsumg', 'samsung') === 1 && site.distance('telvision', 'television') === 1 && site.distance('abc', 'acb') === 1, 'la distance compte une lettre changée, manquante ou deux voisines inversées')

// ── Le serveur ──────────────────────────────────────────────────────────────
console.log('\n── Le serveur (GET /listings?q=) ' + '─'.repeat(39))
const DB = join(D, 'banc.sqlite')
const PORT = 8201
const API = `http://127.0.0.1:${PORT}`
const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: join(D, 'uploads') },
})
serveur.unref() // sinon node attend le serveur détaché après le dernier « ✅ » (vu le 04/09/2026)
const fini = () => { try { process.kill(serveur.pid) } catch { /* déjà parti */ } try { process.kill(-serveur.pid) } catch { /* déjà parti */ } }
process.on('exit', fini)
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { fini(); process.exit(130) })
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(API + '/health')).ok) break } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 250))
}
const sqlEcrire = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', DB, q])
const esc = (s) => String(s).replace(/'/g, "''")
for (const a of ANNONCES) {
  sqlEcrire(`INSERT INTO listings (id,user_id,title,description,price,negotiable,category_id,subcategory,condition_v,images,region_id,city_id,commune,seller_name,seller_phone,delivery,featured,attributes,created_at)
    VALUES ('${a.id}','u','${esc(a.title)}','${esc(a.description)}',1000,0,'${a.categoryId}','${esc(a.subcategory)}','occasion','[]','abidjan','abidjan','Cocody','Banc','',0,0,'${esc(JSON.stringify(a.attributes))}','2026-09-01T10:00:00Z')`)
}
for (const [q, attendu] of QUESTIONS) {
  const r = await fetch(`${API}/listings?q=${encodeURIComponent(q)}`)
  const corps = await r.json().catch(() => null)
  const trouve = Array.isArray(corps) ? corps.map((l) => l.id) : []
  dire(r.ok && meme(trouve, attendu), `« ${q || '(vide)'} » → ${attendu.length ? attendu.join(', ') : 'rien'}`, meme(trouve, attendu) ? '' : `HTTP ${r.status}, trouvé : ${trouve.join(', ') || 'rien'}`)
}

console.log()
if (rouges) { console.log(`❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log('✅ Le site et le serveur comprennent les mêmes recherches.')
process.exit(0)
