// =============================================================================
//  BANC DE L'ENTONNOIR HEBDOMADAIRE — GET /admin/entonnoir (04/09/2026).
//
//      npm run banc:entonnoir
//
//  Un serveur PHP sur SQLite, un propriétaire qui se connecte et déverrouille
//  le tableau de bord comme dans la vraie vie (code à six chiffres, ici écrit
//  dans le fichier que le serveur relit), puis des semaines fabriquées :
//  visites publiques et visites d'équipe, vues de fiches, conversations,
//  annonces — cette semaine, la semaine dernière, et une semaine trop vieille
//  pour figurer. Le banc dit ce qu'il attend AVANT de lire la réponse.
//
//  ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : le banc compte aussi une visite
//  d'équipe (authed = 1) qui ne doit PAS apparaître, et un même visiteur venu
//  deux fois qui ne doit compter qu'une.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-entonnoir')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8199
const API = `http://127.0.0.1:${PORT}`
const PATRON = 'patron@banc.ci'
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: join(D, 'uploads'), CHAPCI_ADMIN_EMAILS: PATRON },
})
// Le serveur se tue par son PID ET par son groupe, à la sortie comme sur un
// signal : le 04/09/2026, un serveur survivant d'un banc précédent a gardé le
// port, et le banc suivant a parlé à un serveur dont la base avait été effacée
// — il a attendu sans fin. (Jamais `pkill -f` avec un motif : il tue le shell
// qui le lance, exit 144.)
const fini = () => {
  try { process.kill(serveur.pid) } catch { /* déjà parti */ }
  try { process.kill(-serveur.pid) } catch { /* déjà parti */ }
}
process.on('exit', fini)
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { fini(); process.exit(130) })
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(API + '/health')).ok) break } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 250))
}
const sqlEcrire = (q) => execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', DB, q])
const appel = async (chemin, { method = 'GET', body, jeton, unlock } = {}) => {
  const r = await fetch(API + chemin, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      ...(unlock ? { 'X-Admin-Unlock': unlock } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text(); let corps = null; try { corps = JSON.parse(t) } catch { corps = t }
  return { code: r.status, corps }
}
const inscrire = async (nom, email) => {
  const r = await appel('/auth/signup', { method: 'POST', body: { full_name: nom, email, password: 'motdepasse-du-banc-9', consent: true } })
  if (!r.corps?.token) { console.log('❌ inscription impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }
  sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`)
  return { jeton: r.corps.token }
}

// ── Les semaines ─────────────────────────────────────────────────────────────
// Le lundi de la semaine courante, en UTC — même arithmétique que le serveur.
const auj = new Date(); auj.setUTCHours(0, 0, 0, 0)
const lundi = new Date(auj.getTime() - ((auj.getUTCDay() + 6) % 7) * 86400000)
const iso = (t) => new Date(t).toISOString().replace(/\.\d{3}Z$/, 'Z')
const jour = (t) => new Date(t).toISOString().slice(0, 10)
// Un instant DANS la semaine : le lundi + 1 jour + 10 h, pour ne jamais tomber
// sur une borne — sauf pour la semaine en cours si on est lundi : on prend
// alors « maintenant moins une heure ».
const dans = (semainesAvant) => {
  const t = lundi.getTime() - semainesAvant * 7 * 86400000 + 86400000 + 10 * 3600000
  return semainesAvant === 0 ? Math.min(t, Date.now() - 3600000) : t
}

const patron = await inscrire('Patron', PATRON)
const koffi = await inscrire('Koffi', `koffi-${Date.now()}@banc.ci`)
let n = 0
const visite = (visiteur, quand, authed = 0) =>
  sqlEcrire(`INSERT INTO visits (id,visitor_id,path,referrer,authed,created_at) VALUES ('v${++n}','${visiteur}','/','',${authed},'${iso(quand)}')`)
const vues = (annonce, quand, nb) =>
  sqlEcrire(`INSERT INTO listing_view_days (listing_id,day,n) VALUES ('${annonce}','${jour(quand)}',${nb})`)
const annonce = (id, quand) =>
  sqlEcrire(`INSERT INTO listings (id,user_id,title,description,price,negotiable,category_id,subcategory,condition_v,images,region_id,city_id,commune,seller_name,seller_phone,delivery,featured,created_at)
    VALUES ('${id}','koffi','Objet','d',1000,0,'maison','Meubles','occasion','[]','abidjan','abidjan','Cocody','Koffi','',0,0,'${iso(quand)}')`)
const contact = (id, quand) =>
  sqlEcrire(`INSERT INTO conversations (id,listing_id,buyer_id,seller_id,created_at) VALUES ('${id}','a1','x','koffi','${iso(quand)}')`)

// Cette semaine (en cours) : 2 visiteurs publics (dont un venu deux fois), 1 d'équipe.
visite('pub-a', dans(0)); visite('pub-a', dans(0) + 60000); visite('pub-b', dans(0)); visite('equipe', dans(0), 1)
vues('a1', dans(0), 7); vues('a2', dans(0), 3)
contact('c1', dans(0))
annonce('a1', dans(0)); annonce('a2', dans(0))
// La semaine dernière : 5 visiteurs, 40 vues sur deux jours, 4 contacts, 3 annonces.
for (const v of ['p1', 'p2', 'p3', 'p4', 'p5']) visite(v, dans(1))
vues('a3', dans(1), 25); vues('a3', dans(1) + 86400000, 15)
for (const c of ['c2', 'c3', 'c4', 'c5']) contact(c, dans(1))
annonce('a3', dans(1)); annonce('a4', dans(1)); annonce('a5', dans(1))
// Il y a neuf semaines : hors fenêtre, ne doit apparaître nulle part.
visite('vieux', dans(9)); vues('a6', dans(9), 99); contact('c9', dans(9)); annonce('a6', dans(9))

console.log('── La porte ' + '─'.repeat(60))
let r = await appel('/admin/entonnoir', { jeton: koffi.jeton })
dire(r.code === 401 || r.code === 403, 'un simple membre est refusé', `HTTP ${r.code}`)
// 423 (« verrouillé ») : c'est ainsi que le serveur dit « déverrouillez d'abord »
// au tableau de bord, qui affiche alors l'écran du code. Pas un 401 : la session
// est bonne, c'est la seconde serrure qui manque.
r = await appel('/admin/entonnoir', { jeton: patron.jeton })
dire(r.code === 423, 'le propriétaire sans déverrouillage reçoit 423, « verrouillé »', `HTTP ${r.code}`)
// Le code à six chiffres, écrit là où le serveur le relit (à côté de la base).
writeFileSync(join(D, '.admin_otp'), `123456|${Math.floor(Date.now() / 1000) + 300}`)
r = await appel('/admin/unlock', { method: 'POST', jeton: patron.jeton, body: { code: '123456' } })
const unlock = r.corps?.token
dire(!!unlock, 'le propriétaire déverrouille avec le code', `HTTP ${r.code}`)

console.log('\n── Les semaines ' + '─'.repeat(56))
r = await appel('/admin/entonnoir', { jeton: patron.jeton, unlock })
dire(r.code === 200 && Array.isArray(r.corps?.semaines) && r.corps.semaines.length === 8, 'huit semaines, la plus ancienne en premier', `HTTP ${r.code}, ${r.corps?.semaines?.length} semaines`)
const S = r.corps?.semaines ?? []
const courante = S[7] ?? {}, derniere = S[6] ?? {}, lointaine = S[0] ?? {}
dire(courante.enCours === true && derniere.enCours === false, 'seule la dernière ligne est « en cours »')
dire(courante.debut === jour(lundi), 'la semaine en cours commence ce lundi', `${courante.debut} vs ${jour(lundi)}`)
dire(courante.visiteurs === 2, 'cette semaine : 2 visiteurs — le même compté une fois, l’équipe exclue', `${courante.visiteurs}`)
dire(courante.fichesVues === 10, 'cette semaine : 10 fiches vues (7 + 3)', `${courante.fichesVues}`)
dire(courante.contacts === 1 && courante.annonces === 2, 'cette semaine : 1 contact, 2 annonces', `${courante.contacts} / ${courante.annonces}`)
dire(derniere.visiteurs === 5, 'la semaine dernière : 5 visiteurs', `${derniere.visiteurs}`)
dire(derniere.fichesVues === 40, 'la semaine dernière : 40 fiches vues sur deux jours', `${derniere.fichesVues}`)
dire(derniere.contacts === 4 && derniere.annonces === 3, 'la semaine dernière : 4 contacts, 3 annonces', `${derniere.contacts} / ${derniere.annonces}`)
dire(lointaine.visiteurs === 0 && lointaine.fichesVues === 0 && lointaine.contacts === 0 && lointaine.annonces === 0, 'il y a sept semaines : rien — la neuvième semaine est hors fenêtre')
dire(S.every((s, i) => i === 0 || s.debut > S[i - 1].debut), 'les semaines sont dans l’ordre, sans doublon')

console.log()
if (rouges) { console.log(`❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log('✅ L’entonnoir compte juste, semaine par semaine.')
