// =============================================================================
//  BANC DE « FAIRE UNE OFFRE » — les routes /conversations/{id}/offre[/{msg}]
//
//      npm run banc:offres
//
//  Deux personnes réelles (inscrites par la route), une annonce, une
//  conversation. L'acheteur propose, le vendeur voit l'offre l'attendre dans
//  sa liste, accepte ; le fil garde une trace en clair ; l'acheteur est
//  notifié. Puis tout ce qui doit être REFUSÉ : l'auteur qui accepte sa propre
//  offre, un tiers qui répond, un montant nul, une offre déjà close. Une
//  nouvelle offre remplace la précédente. Un banc qui ne teste que le chemin
//  heureux ne vaut rien — la moitié des lignes ci-dessous sont des refus.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-offres')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8197
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
  const email = `${nom}-${Date.now()}@banc.ci`
  const r = await appel('/auth/signup', { method: 'POST', body: { full_name: nom, email, password: 'motdepasse-du-banc-9', consent: true } })
  if (!r.corps?.token) { console.log('❌ inscription impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }
  sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`)
  return { jeton: r.corps.token, id: r.corps.user?.id ?? sql(`SELECT id FROM users WHERE email = '${email}'`) }
}

// ── Mise en place : Awa vend, Koffi achète, Yao passe par là ─────────────────
const awa = await inscrire('Awa'), koffi = await inscrire('Koffi'), yao = await inscrire('Yao')
sqlEcrire(`INSERT INTO listings (id,user_id,title,description,price,negotiable,category_id,subcategory,condition_v,images,region_id,city_id,commune,seller_name,seller_phone,delivery,featured,created_at)
  VALUES ('ann-1','${awa.id}','Table basse','d',45000,1,'maison','meubles','occasion','[]','abidjan','abidjan','Cocody','Awa','0700000000',0,0,'${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}')`)
const conv = await appel('/conversations', { method: 'POST', jeton: koffi.jeton, body: { listingId: 'ann-1', sellerId: awa.id } })
const cid = conv.corps?.id
dire(!!cid, 'la conversation acheteur → vendeur existe', 'HTTP ' + conv.code)

// ── 1. Koffi propose ───────────────────────────────────────────────────────
console.log('\n── L’acheteur propose ' + '─'.repeat(50))
let r = await appel(`/conversations/${cid}/offre`, { method: 'POST', jeton: koffi.jeton, body: { montant: 38000 } })
dire(r.code === 200 && r.corps?.offre?.statut === 'proposee', 'l’offre part, à l’état « proposée »', `HTTP ${r.code}, ${JSON.stringify(r.corps?.offre)}`)
const offre1 = r.corps?.id
dire(/38 000 FCFA/.test(r.corps?.body ?? ''), 'son texte reste lisible par une vieille application', r.corps?.body)
let fil = await appel(`/conversations/${cid}/messages`, { jeton: awa.jeton })
dire(fil.corps?.some((m) => m.id === offre1 && m.offre?.montant === 38000), 'le vendeur voit l’offre dans le fil, avec son montant')
let liste = await appel('/conversations', { jeton: awa.jeton })
dire(liste.corps?.find((c) => c.id === cid)?.offreEnAttente === 38000, 'et sa liste de messages dit « une offre vous attend : 38 000 »', `offreEnAttente = ${liste.corps?.find((c) => c.id === cid)?.offreEnAttente}`)
liste = await appel('/conversations', { jeton: koffi.jeton })
dire(liste.corps?.find((c) => c.id === cid)?.offreEnAttente == null, 'rien n’attend l’acheteur : c’est SON offre', `offreEnAttente = ${liste.corps?.find((c) => c.id === cid)?.offreEnAttente}`)

// ── 2. Ce qui doit être refusé ─────────────────────────────────────────────
console.log('\n── Les refus ' + '─'.repeat(59))
r = await appel(`/conversations/${cid}/offre/${offre1}`, { method: 'POST', jeton: koffi.jeton, body: { action: 'accepter' } })
dire(r.code === 403, 'l’auteur ne peut pas accepter sa propre offre', 'HTTP ' + r.code)
r = await appel(`/conversations/${cid}/offre/${offre1}`, { method: 'POST', jeton: yao.jeton, body: { action: 'accepter' } })
dire(r.code === 403, 'un tiers ne peut pas répondre', 'HTTP ' + r.code)
r = await appel(`/conversations/${cid}/offre`, { method: 'POST', jeton: yao.jeton, body: { montant: 1000 } })
dire(r.code === 403, 'ni proposer dans une conversation qui n’est pas la sienne', 'HTTP ' + r.code)
r = await appel(`/conversations/${cid}/offre`, { method: 'POST', jeton: koffi.jeton, body: { montant: 0 } })
dire(r.code === 400, 'un montant nul est refusé', 'HTTP ' + r.code)
r = await appel(`/conversations/${cid}/offre/${offre1}`, { method: 'POST', jeton: awa.jeton, body: { action: 'danser' } })
dire(r.code === 400, 'une action inconnue est refusée', 'HTTP ' + r.code)

// ── 3. Une nouvelle offre remplace la précédente ───────────────────────────
console.log('\n── L’acheteur se ravise ' + '─'.repeat(48))
r = await appel(`/conversations/${cid}/offre`, { method: 'POST', jeton: koffi.jeton, body: { montant: 40000 } })
const offre2 = r.corps?.id
fil = await appel(`/conversations/${cid}/messages`, { jeton: awa.jeton })
dire(fil.corps?.find((m) => m.id === offre1)?.offre?.statut === 'remplacee', 'la première passe à « remplacée »')
dire(fil.corps?.find((m) => m.id === offre2)?.offre?.statut === 'proposee', 'la seconde est celle qui attend')
r = await appel(`/conversations/${cid}/offre/${offre1}`, { method: 'POST', jeton: awa.jeton, body: { action: 'accepter' } })
dire(r.code === 409, 'on ne peut plus accepter la première', 'HTTP ' + r.code)

// ── 4. Le vendeur accepte ──────────────────────────────────────────────────
console.log('\n── Le vendeur accepte ' + '─'.repeat(50))
r = await appel(`/conversations/${cid}/offre/${offre2}`, { method: 'POST', jeton: awa.jeton, body: { action: 'accepter' } })
dire(r.code === 200 && r.corps?.offre?.statut === 'acceptee', 'l’offre passe à « acceptée »', `HTTP ${r.code}`)
fil = await appel(`/conversations/${cid}/messages`, { jeton: koffi.jeton })
dire(fil.corps?.some((m) => /Offre acceptée : 40 000 FCFA/.test(m.body ?? '')), 'le fil garde une trace en clair', fil.corps?.at(-1)?.body)
const notif = sql(`SELECT COUNT(*) FROM notifications WHERE user_id = '${koffi.id}' AND title LIKE 'Offre accept%'`)
dire(notif === '1', 'l’acheteur est notifié', `${notif} notification`)
liste = await appel('/conversations', { jeton: awa.jeton })
dire(liste.corps?.find((c) => c.id === cid)?.offreEnAttente == null, 'plus rien n’attend le vendeur', `offreEnAttente = ${liste.corps?.find((c) => c.id === cid)?.offreEnAttente}`)
r = await appel(`/conversations/${cid}/offre/${offre2}`, { method: 'POST', jeton: awa.jeton, body: { action: 'refuser' } })
dire(r.code === 409, 'une offre acceptée ne se refuse plus', 'HTTP ' + r.code)
const prix = sql(`SELECT price FROM listings WHERE id = 'ann-1'`)
dire(prix === '45000', 'le prix affiché de l’annonce n’a pas bougé : accepter n’est pas vendre', prix + ' FCFA')

// ── 5. Le vendeur contre-propose, l'acheteur refuse ───────────────────────
console.log('\n── Contre-proposition, puis refus ' + '─'.repeat(38))
r = await appel(`/conversations/${cid}/offre`, { method: 'POST', jeton: awa.jeton, body: { montant: 43000 } })
const contre = r.corps?.id
liste = await appel('/conversations', { jeton: koffi.jeton })
dire(liste.corps?.find((c) => c.id === cid)?.offreEnAttente === 43000, 'la contre-offre attend l’acheteur, dans sa liste', `offreEnAttente = ${liste.corps?.find((c) => c.id === cid)?.offreEnAttente}`)
r = await appel(`/conversations/${cid}/offre/${contre}`, { method: 'POST', jeton: koffi.jeton, body: { action: 'refuser' } })
dire(r.code === 200 && r.corps?.offre?.statut === 'refusee', 'l’acheteur refuse', `HTTP ${r.code}`)

console.log()
console.log(rouges ? `❌ ${rouges} contrôle(s) au rouge` : '✅ proposer, remplacer, accepter, refuser, contre-proposer — et tout le reste est refusé')
fini()
process.exit(rouges ? 1 : 0)
