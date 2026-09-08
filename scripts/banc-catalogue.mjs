// =============================================================================
//  BANC DU CATALOGUE — le plafond des 500 annonces.
//
//      npm run banc:catalogue
//
//  CE QUE CE BANC DÉMONTRE. La route `/listings`, appelée SANS paramètres,
//  renvoie au maximum 500 annonces (`$limit = 500` dans le code du serveur).
//  Le site l'appelait exactement comme ça. Passé la 500ᵉ annonce, les
//  suivantes n'existaient plus pour lui : pas de message, pas d'erreur, pas de
//  page vide — juste un vendeur dont l'annonce ne s'affiche nulle part et
//  personne pour s'en apercevoir.
//
//  On remplit donc la base de 520 annonces et on montre les deux : l'ancien
//  appel en perd 20, la lecture par pages les retrouve toutes.
//
//  ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : c'est le contrôle du plafond qui
//  garde ce banc honnête. Si un jour quelqu'un relève `$limit` à 10 000, le
//  premier contrôle passera au rouge et il faudra venir le lire — plutôt que
//  de croire sur parole que le problème est réglé.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-catalogue')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8212
const API = `http://127.0.0.1:${PORT}`
const TOTAL = 520          // 20 de plus que le plafond du serveur
const PAGE = 100           // la borne dure de `?limit=`
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: join(D, 'uploads') },
})
serveur.unref()
const fini = () => { try { process.kill(serveur.pid) } catch { /* déjà parti */ } try { process.kill(-serveur.pid) } catch { /* déjà parti */ } }
process.on('exit', fini)
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { fini(); process.exit(130) })
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(API + '/health')).ok) break } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 250))
}

const sqlEcrire = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', DB, q])
const lire = async (chemin) => {
  const r = await fetch(API + chemin)
  const t = await r.text(); let corps = null; try { corps = JSON.parse(t) } catch { corps = t }
  return { code: r.status, corps }
}

console.log('\n📚 Le catalogue : ce que le site voyait, et ce qu’il voit maintenant\n')

// ── 520 annonces, numérotées pour qu’on sache laquelle manque ────────────────
{
  const lignes = []
  for (let i = 1; i <= TOTAL; i++) {
    // La plus ANCIENNE porte le numéro 1 : la route trie du plus récent au plus
    // ancien, donc l'annonce n° 1 est la dernière de la liste — celle qu'un
    // plafond ampute en premier.
    const quand = new Date(Date.UTC(2026, 0, 1) + i * 3600000).toISOString().replace(/\.\d{3}Z$/, 'Z')
    lignes.push(`('a${String(i).padStart(4, '0')}','u1','Annonce ${i}','Bon état.',${1000 + i},0,'maison','Meubles','occasion','[]','abidjan','abidjan','Cocody','Awa','',0,0,'${quand}')`)
  }
  sqlEcrire(`INSERT INTO listings (id,user_id,title,description,price,negotiable,category_id,subcategory,condition_v,images,region_id,city_id,commune,seller_name,seller_phone,delivery,featured,created_at) VALUES ${lignes.join(',')}`)
}
console.log(`  ${TOTAL} annonces en base — 20 de plus que le plafond du serveur\n`)

// ── L’ancien appel : celui que le site faisait ──────────────────────────────
console.log('── L’appel d’hier : `/listings`, sans rien d’autre ─────────────────────')

let r = await lire('/listings')
dire(r.code === 200 && Array.isArray(r.corps), 'la route répond', `HTTP ${r.code}`)
dire(r.corps.length === 500, `elle en renvoie 500 — et s’arrête là`, `${r.corps.length} annonces sur ${TOTAL}`)

const vuesAncien = new Set(r.corps.map((l) => l.id))
dire(!vuesAncien.has('a0001') && !vuesAncien.has('a0020'),
  'les 20 plus anciennes n’existent PAS pour le site — sans un message',
  `« Annonce 1 » absente : ${!vuesAncien.has('a0001')}`)

// ── La lecture par pages : celle du site d’aujourd’hui ──────────────────────
console.log('\n── L’appel d’aujourd’hui : page après page ─────────────────────────────')

const toutes = new Map()
let offset = 0
let pages = 0
for (;;) {
  const p = await lire(`/listings?limit=${PAGE}&offset=${offset}`)
  if (p.code !== 200 || !Array.isArray(p.corps)) { dire(false, 'une page a échoué', `HTTP ${p.code}`); break }
  pages++
  for (const l of p.corps) toutes.set(l.id, l)
  if (p.corps.length < PAGE) break
  offset += PAGE
  if (offset > 10000) break   // garde-fou du banc lui-même
}
dire(toutes.size === TOTAL, `les ${TOTAL} annonces arrivent toutes`, `${toutes.size} reçues en ${pages} pages`)
dire(toutes.has('a0001') && toutes.has('a0020'),
  'y compris les 20 que l’ancien appel perdait', `« Annonce 1 » présente : ${toutes.has('a0001')}`)

// ── Ce qui doit rester vrai ────────────────────────────────────────────────
console.log('\n── Les bornes ──────────────────────────────────────────────────────────')

r = await lire(`/listings?limit=${PAGE}&offset=${TOTAL}`)
dire(r.code === 200 && r.corps.length === 0,
  'une page au-delà de la fin renvoie une liste vide — pas une erreur', `${r.corps.length} annonce(s)`)

r = await lire('/listings?limit=999&offset=0')
dire(r.corps.length === 100, 'demander 999 d’un coup en renvoie 100 : la borne tient', `${r.corps.length}`)

r = await lire('/listings?limit=100&offset=-50')
dire(r.code === 200 && r.corps.length === 100, 'un décalage négatif ne casse rien', `HTTP ${r.code}, ${r.corps?.length}`)

// Deux pages qui se suivent ne doivent jamais montrer la même annonce.
const p0 = (await lire('/listings?limit=100&offset=0')).corps.map((l) => l.id)
const p1 = (await lire('/listings?limit=100&offset=100')).corps.map((l) => l.id)
dire(p0.filter((id) => p1.includes(id)).length === 0,
  'deux pages qui se suivent ne partagent aucune annonce', `${p0.filter((id) => p1.includes(id)).length} en double`)

console.log()
if (rouges) { console.log(`❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log(`✅ Le catalogue n’a plus de plafond — les ${TOTAL} annonces arrivent, page après page.`)
process.exit(0)
