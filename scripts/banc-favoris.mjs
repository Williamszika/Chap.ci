// =============================================================================
//  BANC DES FAVORIS QUI PRÉVIENNENT — chantier 4 du 04/09/2026.
//
//      npm run banc:favoris
//
//  Un serveur PHP sur SQLite, une vendeuse et deux acheteurs qui mettent son
//  annonce en favori. Puis les gestes qui doivent prévenir — et ceux qui ne
//  doivent PAS : une baisse de prix prévient, un prix égal ou plus haut se
//  tait, une promotion qui abaisse le prix effectif prévient, la personne qui
//  a coupé « Mes favoris » n'entend rien, la vendeuse n'est jamais prévenue de
//  ses propres gestes. Et l'expiration : une annonce de 85 jours prévient ses
//  favoris au passage du cron, une seule fois même si le cron repasse.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-favoris')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8203
const API = `http://127.0.0.1:${PORT}`
// Vingt-quatre caractères au moins, sinon le serveur remplace la clé par une
// clé générée (chapci_hardened_secret) et le banc frappe à la mauvaise porte.
const CLE_CRON = 'cle-du-banc-favoris-2026-09-04-longue'
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: join(D, 'uploads'), CHAPCI_CRON_KEY: CLE_CRON },
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
const appel = async (chemin, { method = 'GET', body, jeton, entetes = {} } = {}) => {
  const r = await fetch(API + chemin, {
    method, headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}), ...entetes },
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
const iso = (t) => new Date(t).toISOString().replace(/\.\d{3}Z$/, 'Z')
const annonce = (id, vendeuse, prix, quand) =>
  sqlEcrire(`INSERT INTO listings (id,user_id,title,description,price,negotiable,category_id,subcategory,condition_v,images,region_id,city_id,commune,seller_name,seller_phone,delivery,featured,created_at)
    VALUES ('${id}','${vendeuse}','Canapé trois places','Bon état.',${prix},0,'maison','Meubles','occasion','["/uploads/canape.jpg"]','abidjan','abidjan','Cocody','Awa','',0,0,'${iso(quand)}')`)
/** Le corps complet qu'exige PUT /listings/{id} — seul le prix (et la promo) change d'un appel à l'autre. */
const corpsPut = (prix, promo) => ({
  title: 'Canapé trois places', description: 'Bon état.', price: prix, negotiable: false,
  categoryId: 'maison', subcategory: 'Meubles', condition: 'occasion', images: ['/uploads/canape.jpg'],
  regionId: 'abidjan', cityId: 'abidjan', commune: 'Cocody', sellerName: 'Awa', sellerPhone: '', delivery: false,
  ...(promo ? { promoPrice: promo, promoUntil: Date.now() + 7 * 86400000 } : {}),
})
const suivis = async (qui) => {
  const r = await appel('/notifications', { jeton: qui.jeton })
  return (Array.isArray(r.corps) ? r.corps : []).filter((n) => n.type === 'favori_suivi')
}

const awa = await inscrire('Awa'), koffi = await inscrire('Koffi'), yao = await inscrire('Yao')
annonce('a1', awa.id, 50000, Date.now())
let r = await appel('/favorites/a1', { method: 'POST', jeton: koffi.jeton })
dire(r.code === 200, 'Koffi met le canapé en favori', `HTTP ${r.code}`)
r = await appel('/favorites/a1', { method: 'POST', jeton: yao.jeton })
dire(r.code === 200, 'Yao aussi', `HTTP ${r.code}`)

console.log('\n── La baisse de prix ' + '─'.repeat(51))
r = await appel('/listings/a1', { method: 'PUT', jeton: awa.jeton, body: corpsPut(45000) })
dire(r.code === 200, 'Awa baisse le prix de 50 000 à 45 000', `HTTP ${r.code} ${JSON.stringify(r.corps).slice(0, 120)}`)
let k = await suivis(koffi)
dire(k.length === 1 && /50\s?000/.test(k[0].body) && /45\s?000/.test(k[0].body), 'Koffi est prévenu, avec les deux prix', k[0]?.body ?? 'rien')
dire(k[0]?.link === '#/annonce/a1', 'la notification mène à l’annonce', k[0]?.link)
dire((await suivis(yao)).length === 1, 'Yao aussi')
dire((await suivis(awa)).length === 0, 'Awa, elle, n’est pas prévenue de son propre geste')

r = await appel('/listings/a1', { method: 'PUT', jeton: awa.jeton, body: corpsPut(45000) })
dire(r.code === 200 && (await suivis(koffi)).length === 1, 'le même prix enregistré à nouveau ne prévient personne')
r = await appel('/listings/a1', { method: 'PUT', jeton: awa.jeton, body: corpsPut(60000) })
dire(r.code === 200 && (await suivis(koffi)).length === 1, 'une hausse (60 000) ne prévient personne')

console.log('\n── Le réglage « Mes favoris » ' + '─'.repeat(42))
r = await appel('/notifications/prefs', { method: 'PUT', jeton: yao.jeton, body: { favori_suivi: false } })
dire(r.code === 200, 'Yao coupe « Mes favoris »', `HTTP ${r.code}`)
r = await appel('/listings/a1', { method: 'PUT', jeton: awa.jeton, body: corpsPut(40000) })
k = await suivis(koffi)
dire(k.length === 2, 'Awa baisse à 40 000 : Koffi est prévenu une deuxième fois', `${k.length}`)
dire((await suivis(yao)).length === 1, 'Yao, qui a coupé, n’entend rien de plus')

console.log('\n── La promotion ' + '─'.repeat(56))
r = await appel('/listings/a1', { method: 'PUT', jeton: awa.jeton, body: corpsPut(40000, 35000) })
k = await suivis(koffi)
// Les notifications d'une même seconde reviennent dans un ordre quelconque :
// on cherche CELLE de la promotion, on ne prend pas la première.
const promo = k.find((n) => /35\s?000/.test(n.body))
dire(r.code === 200 && k.length === 3 && !!promo && /40\s?000/.test(promo.body), 'une promotion à 35 000 sur un prix de 40 000 prévient', promo?.body ?? `HTTP ${r.code}, ${k.length} notifications`)
r = await appel('/listings/a1', { method: 'PUT', jeton: awa.jeton, body: corpsPut(40000, 35000) })
dire((await suivis(koffi)).length === 3, 'la même promotion renvoyée ne prévient pas deux fois')

console.log('\n── L’expiration ' + '─'.repeat(56))
annonce('a2', awa.id, 20000, Date.now() - 85 * 86400000)
annonce('a3', awa.id, 20000, Date.now() - 30 * 86400000)
await appel('/favorites/a2', { method: 'POST', jeton: koffi.jeton })
await appel('/favorites/a3', { method: 'POST', jeton: koffi.jeton })
r = await appel('/cron/cleanup', { entetes: { 'X-Cron-Key': CLE_CRON } })
dire(r.code === 200 && r.corps?.nettoyage?.favoris_prevenus_expiration === 1, 'le cron prévient les favoris de l’annonce de 85 jours — et pas de celle de 30', `HTTP ${r.code}, ${JSON.stringify(r.corps?.nettoyage?.favoris_prevenus_expiration)}`)
k = await suivis(koffi)
const expire = k.filter((n) => /se termine/.test(n.title))
dire(expire.length === 1 && expire[0].link === '#/annonce/a2' && /7 jours/.test(expire[0].body), 'Koffi lit « se termine bientôt », avec le lien', expire[0]?.body ?? 'rien')
r = await appel('/cron/cleanup', { entetes: { 'X-Cron-Key': CLE_CRON } })
dire(r.corps?.nettoyage?.favoris_prevenus_expiration === 0 && (await suivis(koffi)).filter((n) => /se termine/.test(n.title)).length === 1, 'le cron repasse : personne n’est prévenu deux fois')
r = await appel('/cron/cleanup', { entetes: { 'X-Cron-Key': 'mauvaise' } })
dire(r.code === 403, 'sans la clé, le cron refuse', `HTTP ${r.code}`)

console.log()
if (rouges) { console.log(`❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log('✅ Les favoris préviennent — et se taisent quand il faut.')
process.exit(0)
