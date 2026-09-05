// =============================================================================
//  BANC DES RÉSEAUX SOCIAUX DU PROFESSIONNEL — POST /pro/fiche {reseaux},
//  GET /profile/{id}, GET /pro/tableau (05/09/2026).
//
//      npm run banc:reseaux
//
//  Un serveur Chap.ci sur SQLite, un compte approuvé pro par SQL (la validation
//  humaine ne se rejoue pas ici), un compte ordinaire. Le banc vérifie :
//    1. un compte ordinaire n'a pas la porte (403) ;
//    2. un nom d'utilisateur devient l'adresse de la page, une adresse
//       complète est gardée, un site sans « https:// » le reçoit ;
//    3. la page publique montre exactement ces adresses ;
//    4. un « Facebook » qui pointe ailleurs est refusé, en nommant Facebook ;
//       un site « javascript: », un domaine nu, une adresse trop longue aussi ;
//    5. un réseau inconnu (WhatsApp) est ignoré — jamais publié ;
//    6. l'objet envoyé REMPLACE l'ensemble ;
//    7. envoyer les réseaux seuls ne vide ni le téléphone ni la description
//       (la régression que la route d'avant aurait produite) ;
//    8. un dossier plus approuvé ne montre plus rien.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-reseaux')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8208
const API = `http://127.0.0.1:${PORT}`
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
const sql = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $s = $p->query($argv[2]); $l = $s ? $s->fetch(PDO::FETCH_NUM) : false; echo $l === false ? '' : (string) $l[0];`, '--', DB, q], { encoding: 'utf8' }).trim()
const sqlEcrire = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', DB, q])
const appel = async (chemin, { method = 'GET', body, jeton } = {}) => {
  const r = await fetch(API + chemin, {
    method, headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text(); let corps = null; try { corps = JSON.parse(t) } catch { corps = t }
  return { code: r.status, corps }
}
const inscrire = async (nom) => {
  const email = `${nom.toLowerCase()}-${Date.now()}@banc.ci`
  const r = await appel('/auth/signup', { method: 'POST', body: { full_name: nom, email, password: 'motdepasse-du-banc-9', consent: true } })
  if (!r.corps?.token) { console.log('❌ inscription impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }
  sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`)
  return { jeton: r.corps.token, id: r.corps.user?.id ?? sql(`SELECT id FROM users WHERE email = '${email}'`) }
}
const fiche = (qui, body) => appel('/pro/fiche', { method: 'POST', jeton: qui.jeton, body })
const reseauxPublics = async (id) => { const r = await appel(`/profile/${id}`); return r.corps?.pro?.reseaux ?? null }

const awa = await inscrire('Awa'), koffi = await inscrire('Koffi')
sqlEcrire(`UPDATE users SET pro_status = 'approuve', pro_nom = 'Maison Koffi', pro_type = 'commerce', pro_secteur = 'Mode', pro_decide_at = '2026-08-01T00:00:00Z' WHERE id = '${awa.id}'`)

console.log('── La porte ' + '─'.repeat(60))
let r = await fiche(koffi, { reseaux: { facebook: '@koffi' } })
dire(r.code === 403, 'un compte ordinaire n’a pas de réseaux à montrer : 403', `HTTP ${r.code}`)
r = await appel('/pro/fiche', { method: 'POST', body: { reseaux: { facebook: '@koffi' } } })
dire(r.code === 401, 'sans compte : 401', `HTTP ${r.code}`)

console.log('\n── Les adresses ' + '─'.repeat(56))
r = await fiche(awa, { tel: '0700000001', description: 'Prêt-à-porter à Cocody.' })
dire(r.code === 200, 'la fiche classique (téléphone, description) s’enregistre', `HTTP ${r.code}`)
r = await fiche(awa, { reseaux: {
  facebook: '@maisonkoffi', instagram: 'maison.koffi', tiktok: '@maisonkoffi',
  youtube: 'https://youtube.com/@maisonkoffi', telegram: 'https://t.me/maisonkoffi',
  site: 'maisonkoffi.ci', snapchat: '', linkedin: '', x: '',
} })
dire(r.code === 200, 'six adresses passent', `HTTP ${r.code} ${JSON.stringify(r.corps).slice(0, 160)}`)
const attendu = {
  facebook: 'https://www.facebook.com/maisonkoffi', instagram: 'https://www.instagram.com/maison.koffi',
  tiktok: 'https://www.tiktok.com/@maisonkoffi', youtube: 'https://youtube.com/@maisonkoffi',
  telegram: 'https://t.me/maisonkoffi', site: 'https://maisonkoffi.ci',
}
dire(JSON.stringify(r.corps?.reseaux) === JSON.stringify(attendu), 'un nom d’utilisateur devient l’adresse de la page, une adresse complète est gardée, le site reçoit https://', JSON.stringify(r.corps?.reseaux))
let pub = await reseauxPublics(awa.id)
dire(JSON.stringify(pub) === JSON.stringify(attendu), 'la page publique montre exactement ces adresses')
r = await appel('/pro/tableau', { jeton: awa.jeton })
dire(r.code === 200 && JSON.stringify(r.corps?.pro?.reseaux) === JSON.stringify(attendu), 'le tableau de bord les rend aussi (pour préremplir l’écran)', `HTTP ${r.code}`)
dire(r.corps?.pro?.tel === '0700000001' && r.corps?.pro?.description === 'Prêt-à-porter à Cocody.', 'envoyer les réseaux seuls n’a effacé ni le téléphone ni la description', `tel=${r.corps?.pro?.tel} desc=${r.corps?.pro?.description}`)

r = await fiche(awa, { reseaux: { facebook: 'm.facebook.com/maisonkoffi?ref=x', x: 'twitter.com/maisonkoffi' } })
dire(r.code === 200 && r.corps?.reseaux?.facebook === 'https://m.facebook.com/maisonkoffi?ref=x' && r.corps?.reseaux?.x === 'https://twitter.com/maisonkoffi', 'une adresse sans https:// sur le bon domaine est complétée', JSON.stringify(r.corps?.reseaux))
pub = await reseauxPublics(awa.id)
dire(pub && Object.keys(pub).length === 2 && !pub.instagram, 'l’objet envoyé REMPLACE l’ensemble : Instagram et les autres ont disparu', JSON.stringify(pub))

console.log('\n── Les refus ' + '─'.repeat(59))
r = await fiche(awa, { reseaux: { facebook: 'https://instagram.com/pas-facebook' } })
dire(r.code === 422 && r.corps?.reseau === 'facebook' && /Facebook/.test(r.corps?.error ?? ''), 'un « Facebook » qui pointe ailleurs : 422, en nommant Facebook', `HTTP ${r.code} ${r.corps?.error}`)
r = await fiche(awa, { reseaux: { site: 'javascript:alert(1)' } })
dire(r.code === 422 && r.corps?.reseau === 'site', 'un site « javascript: » : 422', `HTTP ${r.code}`)
r = await fiche(awa, { reseaux: { site: 'maisonkoffi' } })
dire(r.code === 422, 'un site sans point (« maisonkoffi ») : 422', `HTTP ${r.code}`)
r = await fiche(awa, { reseaux: { instagram: 'https://www.instagram.com/' } })
dire(r.code === 422, 'le domaine nu, sans page : 422', `HTTP ${r.code}`)
r = await fiche(awa, { reseaux: { tiktok: 'nom avec espace' } })
dire(r.code === 422, 'un nom d’utilisateur avec une espace : 422', `HTTP ${r.code}`)
r = await fiche(awa, { reseaux: { site: 'https://a.ci/' + 'x'.repeat(220) } })
dire(r.code === 422, 'plus de 200 caractères : 422', `HTTP ${r.code}`)
r = await fiche(awa, { reseaux: { facebook: '@bon', instagram: 'https://tiktok.com/@faux' } })
dire(r.code === 422 && r.corps?.reseau === 'instagram', 'une adresse fautive bloque tout l’enregistrement, et dit laquelle', `HTTP ${r.code} reseau=${r.corps?.reseau}`)
pub = await reseauxPublics(awa.id)
dire(pub && Object.keys(pub).length === 2 && pub.facebook === 'https://m.facebook.com/maisonkoffi?ref=x', 'rien n’a bougé après les refus', JSON.stringify(pub))

console.log('\n── Les inconnus et le vide ' + '─'.repeat(45))
r = await fiche(awa, { reseaux: { whatsapp: '0700000001', facebook: '@maisonkoffi', autre: 'https://x.com/y' } })
pub = await reseauxPublics(awa.id)
dire(r.code === 200 && pub && Object.keys(pub).join(',') === 'facebook', 'WhatsApp et un réseau inconnu sont ignorés, jamais publiés', JSON.stringify(pub))
r = await fiche(awa, { reseaux: {} })
pub = await reseauxPublics(awa.id)
dire(r.code === 200 && pub && Object.keys(pub).length === 0, 'un objet vide efface tout — et la page rend un objet vide, pas une liste', JSON.stringify(pub))
r = await fiche(awa, {})
dire(r.code === 400, 'un corps sans rien à enregistrer : 400', `HTTP ${r.code}`)

console.log('\n── Le dossier retiré ' + '─'.repeat(51))
await fiche(awa, { reseaux: { facebook: '@maisonkoffi' } })
sqlEcrire(`UPDATE users SET pro_status = 'en_attente' WHERE id = '${awa.id}'`)
r = await appel(`/profile/${awa.id}`)
dire(r.code === 200 && r.corps?.pro == null, 'un dossier plus approuvé ne montre plus de vitrine, donc plus de réseaux', JSON.stringify(r.corps?.pro))
r = await fiche(awa, { reseaux: { facebook: '@maisonkoffi' } })
dire(r.code === 403, 'et ne peut plus en enregistrer : 403', `HTTP ${r.code}`)

console.log()
if (rouges) { console.log(`❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log('✅ Les réseaux sociaux du professionnel tiennent.')
process.exit(0)
