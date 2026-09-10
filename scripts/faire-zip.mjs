// =============================================================================
//  LE ZIP DE LIVRAISON — et le contrôle qui REFUSE de le fabriquer s'il
//  contient une seule des quatre choses qui vivent sur le serveur, et nulle
//  part ailleurs.
//
//      node scripts/faire-zip.mjs [dossier de sortie] [--leger]
//
//  `--leger` retire du zip les gros fichiers QUI SONT DÉJÀ EN LIGNE, à l'octet
//  près. Voir « LE ZIP ALLÉGÉ » plus bas. Le 10/09/2026, le zip de 11 Mo n'a
//  pas pu être téléchargé par le Patron ; allégé, il tombe sous les 3 Mo.
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
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { createHash } from 'node:crypto'

const DEPOT = new URL('..', import.meta.url).pathname
const LEGER = process.argv.includes('--leger')
const L = (process.argv.slice(2).find((a) => !a.startsWith('--')) ?? DEPOT + 'livraison').replace(/\/?$/, '/')
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

// ── LE ZIP ALLÉGÉ (10/09/2026) ─────────────────────────────────────────────
//
//  POURQUOI. Le 10/09, le Patron n'a pas réussi à télécharger le zip : 11 Mo,
//  et « on me dit qu'il y a un souci ». Or 30 des 35 Mo décompressés sont DEUX
//  fichiers — le moteur de reconnaissance d'image (`ort-wasm-*.wasm`, 23,9 Mo)
//  et son modèle (`nsfw-*.js`, 5,6 Mo). Ces deux-là ne changent JAMAIS : leur
//  nom EST l'empreinte de leur contenu, donc un fichier différent porterait un
//  autre nom. Les renvoyer à chaque livraison, c'est faire porter au Patron
//  trois quarts du poids pour zéro octet de nouveauté.
//
//  CE QUI REND CETTE OPTION SÛRE, ET RIEN D'AUTRE. On ne retire pas un fichier
//  parce qu'on CROIT qu'il est en ligne : on le DEMANDE au serveur, et on
//  compare la taille à l'octet près. Une taille qui diffère, un 404, un 403,
//  un réseau coupé — dans tous ces cas le fichier RESTE dans le zip. La
//  vérification peut échouer, et quand elle échoue elle coûte des méga-octets,
//  jamais un site cassé.
//
//  ⚠️ L'ANTI-ROBOT. Cinq requêtes au plus, trois secondes entre deux
//  (`CLAUDE.md`). Au-delà d'une quinzaine en trente secondes, LiteSpeed sert
//  une page « Bot Verification » à la place de TOUTE réponse, et ce sont les
//  visiteurs qui voient des 403. Un outil de livraison ne doit pas faire
//  tomber le site qu'il livre.
const SEUIL = 2 * 1024 * 1024   // en dessous, ça ne vaut pas une requête
const MAX_SONDES = 5

function fichiers(dir, base = '') {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const chemin = dir + e.name
    if (e.isDirectory()) out.push(...fichiers(chemin + '/', base + e.name + '/'))
    else out.push({ abs: chemin, rel: base + e.name, taille: statSync(chemin).size })
  }
  return out
}

if (LEGER) {
  const gros = fichiers(ETAGE).filter((f) => f.taille > SEUIL).sort((a, b) => b.taille - a.taille)
  if (!gros.length) console.log('  (allégé demandé, mais aucun fichier au-dessus du seuil)')
  let sondes = 0
  for (const f of gros) {
    if (sondes >= MAX_SONDES) { console.log(`  · ${f.rel} — gardé (budget de sondes épuisé)`); continue }
    if (sondes) execFileSync('sleep', ['3'])
    sondes++
    let enLigne = null
    try {
      // Pas d'en-tête Range : le pare-feu du serveur répond 403 aux requêtes
      // partielles, ce qui ferait croire à tort que le fichier manque (vu le
      // 10/09/2026, et pris pour une panne du site pendant deux minutes).
      const sortie = execFileSync('curl', ['-sS', '-o', '/dev/null', '-w', '%{http_code} %{size_download}',
        '--max-time', '180', 'https://chap.ci/' + f.rel], { encoding: 'utf8' })
      const [code, octets] = sortie.trim().split(/\s+/)
      if (code === '200') enLigne = Number(octets)
    } catch { /* réseau : on garde le fichier */ }
    if (enLigne === f.taille) {
      unlinkSync(f.abs)
      console.log(`  − ${f.rel} — retiré : déjà en ligne, ${enLigne} octets identiques`)
    } else {
      console.log(`  · ${f.rel} — GARDÉ : le serveur répond ${enLigne === null ? 'autre chose que 200' : enLigne + ' octets'}, attendu ${f.taille}`)
    }
  }
  console.log()
}

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
