// =============================================================================
//  BANC DES VIGNETTES — la taille servie et la taille affichée.
//
//      npm run banc:vignettes
//
//  POURQUOI. Le banc du front, rejoué pour la première fois sur un écran
//  d'ordinateur le 08/09/2026, a compté DOUZE vignettes sur douze plus grandes
//  que leur case : 480 px servis dans 205 à 294. Sur téléphone l'écart passait
//  inaperçu — la densité double le seuil — mais il était là aussi.
//
//  La largeur est passée à 360 px. Ce banc vérifie les deux moitiés de la
//  décision :
//    · une photo envoyée AUJOURD'HUI reçoit une vignette de 360 px ;
//    · une vignette de 480 px déjà sur le disque est REFAITE par le rattrapage
//      du cron, et une vignette déjà à la bonne taille ne l'est pas.
//
//  ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : le second point est vérifié avec
//  son contraire. Si le rattrapage refaisait tout à chaque passage, il
//  brûlerait le processeur du serveur toutes les nuits sur le dossier entier —
//  et le contrôle « il ne refait pas ce qui est déjà bon » deviendrait rouge.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-vignettes')
rmSync(D, { recursive: true, force: true })
const UP = join(D, 'uploads')
mkdirSync(UP, { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8213
const API = `http://127.0.0.1:${PORT}`
const CLE_CRON = 'cle-du-banc-vignettes-2026-09-08-longue'
const LARGEUR = 360
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: UP, CHAPCI_CRON_KEY: CLE_CRON },
})
serveur.unref()
const fini = () => { try { process.kill(serveur.pid) } catch { /* parti */ } try { process.kill(-serveur.pid) } catch { /* parti */ } }
process.on('exit', fini)
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { fini(); process.exit(130) })
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(API + '/health')).ok) break } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 250))
}

const sqlEcrire = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', DB, q])
const appel = async (chemin, { method = 'GET', body, jeton, entetes = {} } = {}) => {
  const r = await fetch(API + chemin, {
    method, headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}), ...entetes },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text(); let corps = null; try { corps = JSON.parse(t) } catch { corps = t }
  return { code: r.status, corps }
}
/** La largeur réelle d'un fichier image sur le disque. */
const largeur = (f) => {
  if (!existsSync(f)) return 0
  const s = execFileSync('php', ['-r', '$t = @getimagesize($argv[1]); echo $t ? (int) $t[0] : 0;', '--', f], { encoding: 'utf8' })
  return Number(s.trim()) || 0
}
/** Une photo JPEG large, en data URI — comme celles qu'envoie un vendeur. */
const photoLarge = (graine, px = 1200) => {
  const f = join(D, `src-${graine}.jpg`)
  execFileSync('php', ['-r', `
    $w = (int) $argv[3]; $im = imagecreatetruecolor($w, (int) round($w * 0.75)); mt_srand((int) $argv[2]);
    imagefill($im, 0, 0, imagecolorallocate($im, mt_rand(60,220), mt_rand(60,220), mt_rand(60,220)));
    for ($k = 0; $k < 30; $k++) { $c = imagecolorallocate($im, mt_rand(0,255), mt_rand(0,255), mt_rand(0,255));
      imagefilledellipse($im, mt_rand(0,$w), mt_rand(0,$w), mt_rand(40,300), mt_rand(40,300), $c); }
    imagejpeg($im, $argv[1], 82);`, '--', f, String(graine), String(px)])
  return 'data:image/jpeg;base64,' + readFileSync(f).toString('base64')
}
const inscrire = async (nom) => {
  const email = `${nom.toLowerCase()}-${Date.now()}@banc.ci`
  const r = await appel('/auth/signup', { method: 'POST', body: { full_name: nom, email, password: 'motdepasse-du-banc-9', consent: true } })
  if (!r.corps?.token) { console.log('❌ inscription impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }
  sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`)
  return { jeton: r.corps.token, id: r.corps.user?.id }
}

console.log('\n🖼️  Les vignettes : ce qu’on envoie, ce qu’on affiche\n')

const awa = await inscrire('Awa')

// ── Une photo envoyée aujourd’hui ───────────────────────────────────────────
console.log('── Une photo envoyée aujourd’hui ───────────────────────────────────────')

const r = await appel('/listings', { method: 'POST', jeton: awa.jeton, body: {
  title: 'Canapé trois places', description: 'Bon état, à voir sur place.', price: 85000,
  negotiable: true, categoryId: 'maison', subcategory: 'Meubles', condition: 'occasion',
  images: [photoLarge(1), photoLarge(2), photoLarge(3)],
  regionId: 'abidjan', cityId: 'abidjan', commune: 'Cocody', sellerName: 'Awa', sellerPhone: '0700000001',
} })
dire(r.code === 200 || r.code === 201, 'l’annonce est publiée', `HTTP ${r.code}`)

const chemins = (r.corps?.images ?? []).filter((u) => typeof u === 'string' && u.includes('/uploads/'))
dire(chemins.length === 3, 'les trois photos sont enregistrées', `${chemins.length}`)
if (chemins.length < 2) { console.log('\n❌ publication refusée :', JSON.stringify(r.corps).slice(0, 200)); process.exit(1) }

const fichier = (u) => join(UP, u.split('/').pop())
const vignette = (u) => fichier(u).replace(/\.(jpe?g|png|webp|gif)$/i, '_min.jpg')

const lPhoto = largeur(fichier(chemins[0]))
const lVign = largeur(vignette(chemins[0]))
dire(lVign === LARGEUR, `sa vignette fait ${LARGEUR} px de large`, `${lVign} px`)
dire(lPhoto > LARGEUR, 'la photo pleine, elle, garde sa taille — on ne dégrade rien', `${lPhoto} px`)

// La vignette doit peser NETTEMENT moins que la photo : c'est tout l'objet.
const poids = (f) => { try { return execFileSync('php', ['-r', 'echo filesize($argv[1]);', '--', f], { encoding: 'utf8' }).trim() } catch { return '0' } }
const pv = Number(poids(vignette(chemins[0]))), pp = Number(poids(fichier(chemins[0])))
dire(pv > 0 && pv < pp / 2, 'elle pèse moins de la moitié de la photo', `${Math.round(pv / 1024)} Ko contre ${Math.round(pp / 1024)} Ko`)

// ── Une vignette d’hier, trop large ────────────────────────────────────────
console.log('\n── Une vignette d’avant le 08/09, restée à 480 px ──────────────────────')

// On refabrique la vignette EN 480 px, comme le serveur le faisait hier.
execFileSync('php', ['-r', `
  $src = imagecreatefromjpeg($argv[1]); $iw = imagesx($src); $ih = imagesy($src);
  $tw = 480; $th = (int) round($ih * $tw / $iw);
  $dst = imagecreatetruecolor($tw, $th);
  imagecopyresampled($dst, $src, 0,0,0,0, $tw, $th, $iw, $ih);
  imagejpeg($dst, $argv[2], 72);`, '--', fichier(chemins[0]), vignette(chemins[0])])
dire(largeur(vignette(chemins[0])) === 480, 'la voilà remise à 480 px, comme hier', `${largeur(vignette(chemins[0]))} px`)

// La seconde photo garde SA bonne vignette : c'est le témoin.
const avantTemoin = largeur(vignette(chemins[1]))
const dateTemoin = execFileSync('php', ['-r', 'echo (int) filemtime($argv[1]);', '--', vignette(chemins[1])], { encoding: 'utf8' }).trim()

await new Promise((r) => setTimeout(r, 1100))   // pour que la date de fichier puisse changer
const c = await appel('/cron/cleanup', { entetes: { 'X-Cron-Key': CLE_CRON } })
dire(c.code === 200, 'le cron de ménage passe', `HTTP ${c.code}`)

dire(largeur(vignette(chemins[0])) === LARGEUR,
  `il refait la vignette trop large : 480 → ${LARGEUR} px`, `${largeur(vignette(chemins[0]))} px`)

const apresTemoin = execFileSync('php', ['-r', 'echo (int) filemtime($argv[1]);', '--', vignette(chemins[1])], { encoding: 'utf8' }).trim()
dire(largeur(vignette(chemins[1])) === avantTemoin && apresTemoin === dateTemoin,
  'et il NE TOUCHE PAS celle qui est déjà à la bonne taille',
  `${apresTemoin === dateTemoin ? 'pas rouverte' : 'REFAITE INUTILEMENT'}`)

// ── Une vignette manquante ─────────────────────────────────────────────────
console.log('\n── Une photo d’avant les vignettes ─────────────────────────────────────')

execFileSync('php', ['-r', 'unlink($argv[1]);', '--', vignette(chemins[0])])
dire(largeur(vignette(chemins[0])) === 0, 'sa vignette est effacée', 'absente')
const c2 = await appel('/cron/cleanup', { entetes: { 'X-Cron-Key': CLE_CRON } })
dire(c2.code === 200 && largeur(vignette(chemins[0])) === LARGEUR,
  'le cron la refabrique', `${largeur(vignette(chemins[0]))} px`)

console.log()
if (rouges) { console.log(`❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log(`✅ Les vignettes font ${LARGEUR} px — et les anciennes se rattrapent toutes seules.`)
process.exit(0)
