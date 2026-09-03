// =============================================================================
//  BANC DE « ÇA VAUT COMBIEN ? » — la route /listings/prix-marche
//
//      npm run banc:prix
//
//  Lance le serveur sur SQLite, pose des annonces aux prix CONNUS, et vérifie
//  que la route rend exactement les percentiles qu'on recalcule ici à la main.
//  Un chiffre faux, un rouge — c'est ce qui rend ce banc digne de confiance.
//
//  Ce qu'il établit :
//   1. médiane, p25, p75 exacts sur 8 prix (rang le plus proche) ;
//   2. sous 5 annonces, un compte mais AUCUNE fourchette ;
//   3. la marque resserre la fourchette quand elle réunit assez d'annonces,
//      et ne fait rien sinon ;
//   4. l'annonce qu'on modifie (`sauf`) ne se compare pas à elle-même ;
//   5. une annonce masquée ou vieille de plus de 180 jours ne compte pas.
//
//  ⚠️ AU PREMIER PASSAGE, CE BANC S'ACCUSAIT LUI-MÊME. Il posait la marque
//  dans une variable et l'oubliait dans l'INSERT : la colonne `attributes`
//  restait vide, la route ne trouvait aucune annonce Apple, et le banc
//  déclarait la route fausse. La route était juste. C'est la règle de la
//  maison : une vérification qui échoue se relit d'abord elle-même.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-prix')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8198
const API = `http://127.0.0.1:${PORT}`

let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: join(D, 'uploads') },
})
const fini = () => { try { process.kill(-serveur.pid) } catch { /* déjà parti */ } }
process.on('exit', fini)
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(API + '/health')).ok) break } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 250))
}

const sqlEcrire = (requete) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', DB, requete])
const iso = (joursAvant) => new Date(Date.now() - joursAvant * 86400000).toISOString().replace(/\.\d{3}Z$/, 'Z')
let k = 0
const poser = ({ prix, cat = 'electronique', sous = 'telephones', etat = 'occasion', marque = null, jours = 3, hidden = 0, id = null }) => {
  const lid = id ?? `banc-${++k}`
  const attrs = marque ? JSON.stringify({ marque }).replace(/'/g, "''") : null
  sqlEcrire(`INSERT INTO listings (id,user_id,title,description,price,negotiable,category_id,subcategory,condition_v,images,
      region_id,city_id,commune,seller_name,seller_phone,delivery,featured,created_at,hidden,attributes)
    VALUES ('${lid}','u1','t','d',${prix},0,'${cat}','${sous}','${etat}','[]','abidjan','abidjan','Cocody','Banc','0700000000',0,0,'${iso(jours)}',${hidden},${attrs ? "'" + attrs + "'" : "NULL"})`)
  return lid
}
const lire = async (q) => (await fetch(API + '/listings/prix-marche?' + new URLSearchParams(q))).json()

// ── 1. Huit prix connus → percentiles exacts ─────────────────────────────────
console.log('── Huit annonces aux prix connus ' + '─'.repeat(40))
const prix8 = [30000, 45000, 50000, 60000, 65000, 80000, 90000, 120000]
for (const p of prix8) poser({ prix: p })
// rang le plus proche : index = floor(q·(n−1)) sur la liste triée
const attendu = (q) => prix8[Math.floor(q * (prix8.length - 1))]
let f = await lire({ categoryId: 'electronique', subcategory: 'telephones' })
dire(f.n === 8, 'la route compte les huit', `n = ${f.n}`)
dire(f.mediane === attendu(0.5), `médiane exacte`, `${f.mediane} attendu ${attendu(0.5)}`)
dire(f.p25 === attendu(0.25) && f.p75 === attendu(0.75), `p25 / p75 exacts`, `${f.p25} / ${f.p75} attendu ${attendu(0.25)} / ${attendu(0.75)}`)
dire(f.base === 'sous-catégorie', 'base = sous-catégorie sans marque', f.base)

// ── 2. Sous cinq annonces : un compte, pas de fourchette ────────────────────
console.log('\n── Une sous-catégorie presque vide ' + '─'.repeat(38))
for (const p of [10000, 12000, 15000]) poser({ prix: p, sous: 'tablettes' })
f = await lire({ categoryId: 'electronique', subcategory: 'tablettes' })
dire(f.n === 3 && f.mediane === null && f.p25 === null && f.p75 === null,
  'trois annonces : le compte, mais AUCUNE fourchette', `n = ${f.n}, médiane = ${f.mediane}`)

// ── 3. La marque resserre quand elle a assez d'annonces ─────────────────────
console.log('\n── La marque ' + '─'.repeat(60))
for (const p of [200000, 220000, 250000, 260000, 300000]) poser({ prix: p, marque: 'Apple' })
f = await lire({ categoryId: 'electronique', subcategory: 'telephones', marque: 'apple' })
dire(f.base === 'marque' && f.n === 5, 'cinq annonces Apple : la fourchette se resserre sur la marque', `base = ${f.base}, n = ${f.n}`)
dire(f.mediane === 250000, 'médiane de la marque exacte', `${f.mediane}`)
f = await lire({ categoryId: 'electronique', subcategory: 'telephones', marque: 'itel' })
dire(f.base === 'sous-catégorie' && f.n === 13, 'une marque absente : on retombe sur la sous-catégorie entière', `base = ${f.base}, n = ${f.n}`)

// ── 4. « sauf » : l'annonce qu'on modifie ne compte pas ─────────────────────
console.log('\n── L’annonce qu’on modifie ' + '─'.repeat(46))
const moi = poser({ prix: 1000000 }) // un prix aberrant, à exclure
f = await lire({ categoryId: 'electronique', subcategory: 'telephones', sauf: moi })
dire(f.n === 13, 'elle est écartée du calcul', `n = ${f.n}`)
f = await lire({ categoryId: 'electronique', subcategory: 'telephones' })
dire(f.n === 14, 'et comptée quand on ne l’écarte pas', `n = ${f.n}`)

// ── 5. Masquée ou trop vieille : hors marché ────────────────────────────────
console.log('\n── Masquée, ou vieille de plus de 180 jours ' + '─'.repeat(29))
poser({ prix: 5, hidden: 1 }); poser({ prix: 5, jours: 200 })
f = await lire({ categoryId: 'electronique', subcategory: 'telephones' })
dire(f.n === 14 && f.p25 > 5, 'ni l’une ni l’autre ne compte', `n = ${f.n}, p25 = ${f.p25}`)

// ── 6. Contre-épreuve : la route refuse une demande sans sous-catégorie ─────
console.log('\n── Contre-épreuve ' + '─'.repeat(54))
const r = await fetch(API + '/listings/prix-marche?categoryId=electronique')
dire(r.status === 400, 'sans sous-catégorie, 400 — pas une fourchette du vide', 'HTTP ' + r.status)

console.log()
console.log(rouges ? `❌ ${rouges} contrôle(s) au rouge` : '✅ la fourchette est exacte, prudente sous cinq annonces, et ignore ce qu’elle doit ignorer')
fini()
process.exit(rouges ? 1 : 0)
