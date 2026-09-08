// =============================================================================
//  BANC DU PUSH NATIF — le téléphone qui sonne quand l'application est fermée.
//
//      npm run banc:push-natif
//
//  POURQUOI CE BANC EXISTE. `PushNatif.enregistrer()` appelait `/push/native`
//  DEPUIS LE 04/09/2026. La route n'existait pas côté serveur. Le client
//  encaissait le 404 en silence — sa fonction est justement écrite pour ne
//  jamais gêner l'application — et rien, nulle part, ne pouvait le dire. Quatre
//  jours d'appels dans le vide.
//
//  Ce banc-ci existe pour que ça ne recommence pas : il frappe aux MÊMES
//  adresses que le code Dart, avec les MÊMES noms de champs.
//
//  ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER. Chaque règle est vérifiée avec
//  son contraire : le même jeton deux fois ne fait pas deux lignes, MAIS deux
//  jetons différents en font bien deux ; un compte ne voit que ses appareils,
//  MAIS le téléphone qui change de main suit son nouveau propriétaire.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-push-natif')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8211
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
  const email = `${nom.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@banc.ci`
  const r = await appel('/auth/signup', { method: 'POST', body: { full_name: nom, email, password: 'motdepasse-du-banc-9', consent: true } })
  if (!r.corps?.token) { console.log('❌ inscription impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }
  sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`)
  return { jeton: r.corps.token, id: r.corps.user?.id ?? sql(`SELECT id FROM users WHERE email = '${email}'`) }
}
/** Combien d'appareils en base, en tout ou pour une personne. */
const appareils = (userId) => Number(sql(
  userId ? `SELECT COUNT(*) FROM push_natifs WHERE user_id = '${userId}'`
         : 'SELECT COUNT(*) FROM push_natifs')) || 0

console.log('\n📱 Le push natif : l’application enregistre son téléphone\n')

const koffi = await inscrire('Koffi')
const awa = await inscrire('Awa')

// ── Les adresses que le code Dart appelle vraiment ───────────────────────────
console.log('── Les deux routes que `push_natif.dart` appelle ───────────────────────')

let r = await appel('/push/native', {
  method: 'POST', jeton: koffi.jeton,
  body: { token: 'jeton-fcm-du-telephone-de-koffi', platform: 'android', label: 'Tecno Spark' },
})
dire(r.code === 200 && r.corps?.ok === true, 'POST /push/native répond 200 — la route existe enfin', `HTTP ${r.code}`)
dire(appareils(koffi.id) === 1, 'le téléphone de Koffi est en base', `${appareils(koffi.id)} appareil(s)`)

// Le champ `actif` dit au client si le serveur peut RÉELLEMENT envoyer. Sans
// `api/data/fcm.json`, tout reste inerte — et le serveur le dit franchement
// plutôt que de laisser croire que ça marche.
dire(r.corps?.actif === false, 'sans la clé Firebase, le serveur annonce « pas encore actif »', JSON.stringify(r.corps))

// ── Le même téléphone qui rouvre l'application ──────────────────────────────
console.log('\n── Le même téléphone ne compte qu’une fois ─────────────────────────────')

await appel('/push/native', {
  method: 'POST', jeton: koffi.jeton,
  body: { token: 'jeton-fcm-du-telephone-de-koffi', platform: 'android', label: 'Tecno Spark' },
})
dire(appareils(koffi.id) === 1, 'rouvrir l’application ne crée pas un deuxième appareil', `${appareils(koffi.id)}`)

// …mais un SECOND téléphone, lui, doit bien s'ajouter. Sans ce contrôle-ci, un
// serveur qui refuserait tout enregistrement passerait le précédent au vert.
await appel('/push/native', {
  method: 'POST', jeton: koffi.jeton,
  body: { token: 'jeton-fcm-de-la-tablette-de-koffi', platform: 'android', label: 'Tablette' },
})
dire(appareils(koffi.id) === 2, 'un deuxième appareil du même compte s’ajoute', `${appareils(koffi.id)}`)

// ── Le téléphone qui change de main ────────────────────────────────────────
console.log('\n── Le téléphone qui change de main ─────────────────────────────────────')

await appel('/push/native', {
  method: 'POST', jeton: awa.jeton,
  body: { token: 'jeton-fcm-du-telephone-de-koffi', platform: 'android', label: 'Tecno Spark' },
})
dire(appareils(awa.id) === 1 && appareils(koffi.id) === 1,
  'le jeton suit son nouveau propriétaire — l’ancien cesse d’être notifié',
  `Koffi ${appareils(koffi.id)}, Awa ${appareils(awa.id)}`)

// ── Ce que le serveur doit refuser ─────────────────────────────────────────
console.log('\n── Ce qui doit être refusé ─────────────────────────────────────────────')

r = await appel('/push/native', { method: 'POST', jeton: koffi.jeton, body: { platform: 'android' } })
dire(r.code === 400, 'un enregistrement sans jeton est refusé', `HTTP ${r.code}`)

r = await appel('/push/native', { method: 'POST', body: { token: 'x'.repeat(40) } })
dire(r.code === 401, 'sans être connecté, on n’enregistre rien', `HTTP ${r.code}`)

r = await appel('/push/native', { method: 'POST', jeton: koffi.jeton, body: { token: 'x'.repeat(600) } })
dire(r.code === 400, 'un jeton de 600 caractères est refusé (la colonne en tient 500)', `HTTP ${r.code}`)

const avant = appareils()
r = await appel('/push/native/remove', {
  method: 'POST', jeton: koffi.jeton, body: { token: 'jeton-fcm-du-telephone-de-koffi' },
})
dire(r.code === 200 && appareils() === avant,
  'retirer l’appareil de QUELQU’UN D’AUTRE ne retire rien', `${avant} → ${appareils()}`)

// ── Retirer son propre appareil ────────────────────────────────────────────
console.log('\n── Se déconnecter retire l’appareil ────────────────────────────────────')

r = await appel('/push/native/remove', {
  method: 'POST', jeton: koffi.jeton, body: { token: 'jeton-fcm-de-la-tablette-de-koffi' },
})
dire(r.code === 200 && appareils(koffi.id) === 0, 'la tablette de Koffi est retirée', `${appareils(koffi.id)} restant(s)`)
dire(appareils(awa.id) === 1, 'celui d’Awa n’a pas bougé', `${appareils(awa.id)}`)

r = await appel('/push/native/remove', { method: 'POST', jeton: koffi.jeton, body: {} })
dire(r.code === 400, 'un retrait sans jeton est refusé', `HTTP ${r.code}`)

// ── Le reste du site ne bouge pas ──────────────────────────────────────────
console.log('\n── Le Web Push du navigateur continue comme avant ──────────────────────')

r = await appel('/push/key')
dire(r.code === 200 && typeof r.corps?.cle === 'string' && r.corps.cle.length > 20 && r.corps.actif === true,
  'la clé publique du Web Push est toujours servie', `HTTP ${r.code}, ${r.corps?.cle?.length ?? 0} caractères`)

r = await appel('/push/devices', { jeton: awa.jeton })
dire(r.code === 200, 'la liste des navigateurs abonnés répond toujours', `HTTP ${r.code}`)

console.log()
if (rouges) { console.log(`❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log('✅ L’application peut enregistrer son téléphone — il ne manque que la clé du Patron.')
process.exit(0)
