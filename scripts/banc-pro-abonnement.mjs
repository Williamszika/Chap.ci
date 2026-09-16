// =============================================================================
//  BANC DE L'ABONNEMENT PRO PAYANT — /admin/pro/paiement, /pro/abonnement
//  (16/09/2026)
//
//      npm run banc:pro-abonnement
//
//  POURQUOI CE CHANTIER EXISTE
//
//  Le compte Pro était construit depuis longtemps — dossier, validation, badge,
//  page vendeur, console, stock, réponses automatiques — et il était GRATUIT.
//  Il ne manquait qu'un prix. Un conseil extérieur proposait de « construire un
//  abonnement Pro » : les trois quarts existaient déjà.
//
//  L'argent arrive par Mobile Money, HORS du site, comme pour l'écran
//  publicitaire : l'admin saisit ce qu'il a réellement encaissé. Pas de tarif
//  figé dans le code — il se négocie client par client, et un tarif en dur
//  deviendrait faux au deuxième client.
//
//  ⚠️ CE QUE CE BANC VÉRIFIE AVANT TOUT — ET QUI SE TROMPE FACILEMENT :
//
//  1. UN RENOUVELLEMENT ANTICIPÉ NE FAIT PAS PERDRE LES JOURS RESTANTS. Celui
//     qui repaie deux semaines avant l'échéance doit voir ses mois s'AJOUTER à
//     sa date de fin, pas repartir d'aujourd'hui. L'erreur inverse vole du temps
//     à un client qui paie en avance — c'est-à-dire au meilleur.
//
//  2. UN COMPTE QUI N'A JAMAIS PAYÉ N'EST PAS DÉGRADÉ. Au 16/09/2026, le site
//     compte UN vendeur professionnel réel. Aucune révocation automatique n'est
//     branchée, et ce banc le prouve : il exige que le compte non payant reste
//     intact. Le jour où l'on coupera, ce sera une décision, pas un effet de
//     bord — et ce banc passera au rouge pour le dire.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-pro-abo')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8234
const API = `http://127.0.0.1:${PORT}`
const PATRON = 'patron@banc.ci'   // déclaré propriétaire par l’environnement, comme les autres bancs
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: join(D, 'uploads'), CHAPCI_ADMIN_EMAILS: PATRON },
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
const appel = async (chemin, { method = 'GET', body, jeton, unlock } = {}) => {
  const r = await fetch(API + chemin, {
    method, headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}), ...(unlock ? { 'X-Admin-Unlock': unlock } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text(); let corps = null; try { corps = JSON.parse(t) } catch { corps = t }
  return { code: r.status, corps }
}
const inscrire = async (nom, email = null) => {
  // Le nom sert à fabriquer l'adresse : il faut le réduire à des lettres, sinon
  // « Kouamé Formation » donne une adresse AVEC UNE ESPACE, que le serveur
  // refuse — à juste titre. (C'est exactement ce qui est arrivé en écrivant ce
  // banc : l'erreur venait du banc, pas du serveur.)
  const slug = nom.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const mail = email ?? `${slug}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@banc.ci`
  const r = await appel('/auth/signup', { method: 'POST', body: { full_name: nom, email: mail, password: 'motdepasse-du-banc-9', consent: true } })
  if (!r.corps?.token) { console.log('❌ inscription impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }
  sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${mail}'`)
  return { jeton: r.corps.token, id: r.corps.user?.id ?? sql(`SELECT id FROM users WHERE email = '${mail}'`), email: mail }
}
const jour = (iso) => (iso ? String(iso).slice(0, 10) : null)
const dans = (jours) => new Date(Date.now() + jours * 86400000).toISOString().slice(0, 10)

console.log('\nBANC DE L’ABONNEMENT PRO PAYANT')
console.log('─'.repeat(72))

const patron = await inscrire('Patron', PATRON)
const kouame = await inscrire('Kouame Formation')
const yao = await inscrire('Yao Garage')
const simple = await inscrire('Simple Particulier')
// Deux comptes Pro approuvés. Kouamé paiera, Yao jamais — Yao est là POUR NE
// PAS PAYER, et pour prouver qu'on ne lui retire rien.
for (const p of [kouame, yao]) {
  sqlEcrire(`UPDATE users SET pro_status = 'approuve', pro_nom = 'Pro ${p.id.slice(0, 6)}', pro_type = 'formation' WHERE id = '${p.id}'`)
}

/* Les routes /admin/* réclament un déverrouillage à usage limité, en plus du
 * compte propriétaire : c'est la deuxième serrure du tableau de bord. Le banc
 * pose lui-même le code à usage unique dans le dossier des secrets. */
writeFileSync(join(D, '.admin_otp'), `123456|${Math.floor(Date.now() / 1000) + 300}`)
let r = await appel('/admin/unlock', { method: 'POST', jeton: patron.jeton, body: { code: '123456' } })
const unlock = r.corps?.token
if (!unlock) { console.log('❌ déverrouillage admin impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }

console.log('\n── Encaisser un premier abonnement')
r = await appel('/admin/pro/paiement', { method: 'POST', jeton: patron.jeton, unlock,
  body: { userId: kouame.id, montant: 12000, mois: 1, methode: 'Wave', numero: '0700000000' } })
dire(r.code === 200, 'l’encaissement est accepté', `HTTP ${r.code}`)
dire(jour(r.corps?.jusquAu) === dans(30) || jour(r.corps?.jusquAu) === dans(31) || jour(r.corps?.jusquAu) === dans(29),
  'l’échéance tombe environ un mois plus tard', jour(r.corps?.jusquAu))
dire(sql(`SELECT COUNT(*) FROM pro_paiements WHERE user_id = '${kouame.id}'`) === '1', 'une ligne au registre')
dire(sql(`SELECT enregistre_par FROM pro_paiements WHERE user_id = '${kouame.id}'`) === PATRON,
  'le registre porte l’e-mail de celui qui a saisi', sql(`SELECT enregistre_par FROM pro_paiements WHERE user_id = '${kouame.id}'`))

console.log('\n── ⚠️ UN RENOUVELLEMENT ANTICIPÉ NE VOLE PAS LES JOURS RESTANTS')
const avant = sql(`SELECT pro_paye_jusqu_au FROM users WHERE id = '${kouame.id}'`)
r = await appel('/admin/pro/paiement', { method: 'POST', jeton: patron.jeton, unlock,
  body: { userId: kouame.id, montant: 12000, mois: 1, methode: 'Orange Money' } })
const apres = r.corps?.jusquAu
const ecart = Math.round((new Date(apres) - new Date(avant)) / 86400000)
dire(ecart >= 28 && ecart <= 31, 'le mois acheté s’AJOUTE à l’échéance en cours', `+${ecart} jours après l’ancienne fin`)
dire(new Date(apres) - Date.now() > 55 * 86400000, 'il reste bien près de deux mois au total',
  `${Math.round((new Date(apres) - Date.now()) / 86400000)} jours`)

console.log('\n── Ce que le professionnel voit de son côté')
r = await appel('/pro/abonnement', { jeton: kouame.jeton })
dire(r.corps?.actif === true, 'son abonnement est actif')
dire(r.corps?.joursRestants > 55, 'il voit ses jours restants', `${r.corps?.joursRestants} jours`)
dire((r.corps?.paiements ?? []).length === 2, 'il voit ses deux paiements')

console.log('\n── ⚠️ CELUI QUI N’A JAMAIS PAYÉ N’EST PAS DÉGRADÉ')
r = await appel('/pro/abonnement', { jeton: yao.jeton })
dire(r.code === 200, 'la route répond même sans aucun paiement', `HTTP ${r.code}`)
dire(r.corps?.actif === false && r.corps?.jusquAu === null, 'elle dit clairement « pas d’abonnement »')
dire(r.corps?.pro === true, 'et son compte reste un compte Pro — RIEN ne lui est retiré',
  sql(`SELECT pro_status FROM users WHERE id = '${yao.id}'`))

console.log('\n── Ce que l’encaissement refuse')
const refus = async (corps, attendu, texte) => {
  const x = await appel('/admin/pro/paiement', { method: 'POST', jeton: patron.jeton, unlock, body: { userId: kouame.id, montant: 12000, mois: 1, methode: 'Wave', ...corps } })
  dire(x.code === attendu, texte, `HTTP ${x.code}`)
}
await refus({ montant: 0 }, 400, 'un montant nul')
await refus({ montant: -5000 }, 400, 'un montant négatif')
await refus({ mois: 0 }, 400, 'zéro mois')
await refus({ mois: 60 }, 400, 'soixante mois (faute de frappe bien plus souvent qu’une vente)')
await refus({ methode: '' }, 400, 'sans moyen de paiement')
await refus({ userId: simple.id }, 409, 'un compte qui n’est pas Pro approuvé')
r = await appel('/admin/pro/paiement', { method: 'POST', jeton: kouame.jeton,
  body: { userId: kouame.id, montant: 12000, mois: 1, methode: 'Wave' } })
dire(r.code === 403 || r.code === 401, 'un non-administrateur ne peut pas s’auto-encaisser', `HTTP ${r.code}`)

console.log('\n── La liste d’administration')
r = await appel('/admin/pro/abonnements', { jeton: patron.jeton, unlock })
dire(r.corps?.pros === 2, 'elle compte les deux comptes Pro', `${r.corps?.pros}`)
dire(r.corps?.abonnesActifs === 1, 'dont un seul abonné actif', `${r.corps?.abonnesActifs}`)
dire(r.corps?.totalEncaisse === 24000, 'et le total encaissé', `${r.corps?.totalEncaisse} FCFA`)
dire(r.corps?.liste?.[0]?.id === kouame.id, 'celui qui a une échéance vient en premier')
dire(r.corps?.liste?.[1]?.jusquAu === null, 'celui qui n’a jamais payé ferme la liste (c’est un prospect)')

console.log('\n' + '═'.repeat(72))
if (rouges) { console.log(`⛔ ${rouges} vérification(s) au rouge.`); process.exit(1) }
console.log('✅ Le compte Pro peut être facturé, suivi, et personne n’est coupé sans décision.')
