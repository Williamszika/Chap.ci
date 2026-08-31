// =============================================================================
//  LE ZIP DE LIVRAISON — et le contrôle qui REFUSE de le fabriquer s'il
//  contient une seule des quatre choses qui vivent sur le serveur, et nulle
//  part ailleurs.
//
//      node scripts/faire-zip.mjs [dossier de sortie]
//
//  La règle vient d'une panne réelle : le 2 août 2026, un `.htaccess` à la
//  racine du zip a écrasé `api/.htaccess` et coupé l'API. Un contrôle qui se
//  contente de « je n'ai rien mis dedans » ne vaut rien — celui-ci relit le
//  zip FINI, entrée par entrée.
//
//  ⚠️ Cet outil vivait dans un dossier d'essais, hors du dépôt. Il fabrique
//  pourtant la seule chose que le Patron reçoit. Il est ici désormais.
// =============================================================================

import { execFileSync } from 'node:child_process'
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const DEPOT = new URL('..', import.meta.url).pathname
const L = (process.argv[2] ?? DEPOT + 'livraison') .replace(/\/?$/, '/')
const ETAGE = L + 'etage/'
const ZIP = 'chapci-logo.zip'

mkdirSync(L, { recursive: true })
rmSync(ETAGE, { recursive: true, force: true })
mkdirSync(ETAGE, { recursive: true })
rmSync(L + ZIP, { force: true })

// 1. Le site construit.
cpSync(DEPOT + 'dist/', ETAGE, { recursive: true })
// 2. L'API — `server/index.php` devient `api/index.php`, et le filigrane part
//    avec lui : `apply_watermark` le lit dans __DIR__.
mkdirSync(ETAGE + 'api', { recursive: true })
cpSync(DEPOT + 'server/index.php', ETAGE + 'api/index.php')
cpSync(DEPOT + 'server/watermark.png', ETAGE + 'api/watermark.png')
// 3. Le SEO — il vit à la RACINE de public_html, un étage au-dessus d'api/.
cpSync(DEPOT + 'web/seo.php', ETAGE + 'seo.php')

// ── L'INTERDIT, relu sur le zip FINI ───────────────────────────────────────
const INTERDIT = [
  [/(^|\/)\.htaccess$/, '.htaccess (à quelque niveau que ce soit)'],
  [/(^|\/)config\.php$/, 'api/config.php — identifiants de base et secret de session'],
  [/(^|\/)uploads\//, 'uploads/ — TOUTES les photos des annonces'],
  [/(^|\/)data\//, 'api/data/ — dont push.json, la clé des notifications'],
]

execFileSync('zip', ['-rq', L + ZIP, '.'], { cwd: ETAGE })

const liste = execFileSync('unzip', ['-Z1', L + ZIP], { encoding: 'utf8' })
  .split('\n').filter(Boolean)
let fautes = 0
for (const entree of liste) {
  for (const [motif, quoi] of INTERDIT) {
    if (motif.test(entree)) {
      console.log(`  ❌ LE ZIP CONTIENT « ${entree} » → ${quoi}`)
      fautes++
    }
  }
}
if (fautes) {
  rmSync(L + ZIP, { force: true })
  console.log('\n❌ Zip DÉTRUIT. Un zip qui contient un seul de ces quatre est un zip à refaire.')
  process.exit(1)
}
console.log(`  ✅ ${liste.length} entrées, aucune interdite`)

// ── Les trois empreintes, celles que /api/health renverra ──────────────────
const md5 = (f) => createHash('md5').update(readFileSync(f)).digest('hex').slice(0, 12)
console.log('\n  empreinte     :', md5(DEPOT + 'server/index.php'))
console.log('  empreinteSeo  :', md5(DEPOT + 'web/seo.php'))
console.log('  empreinteSite :', md5(DEPOT + 'dist/index.html'))

// ── La preuve rouge/vert : le fichier qui n'existe QUE dans ce zip ─────────
const html = readFileSync(DEPOT + 'dist/index.html', 'utf8')
const principal = html.match(/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0]
console.log('\n  fichier témoin (doit s’ouvrir après extraction) :')
console.log('    https://chap.ci/' + principal)

const taille = execFileSync('du', ['-h', L + ZIP], { encoding: 'utf8' }).split('\t')[0]
console.log(`\n  ${ZIP} — ${taille}`)
if (!existsSync(L + 'A-LIRE-DABORD.txt')) console.log('  ⚠️  il manque le A-LIRE-DABORD.txt')
