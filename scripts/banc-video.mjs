// =============================================================================
//  BANC DE LA VIDÉO DE QUINZE SECONDES — POST/DELETE /listings/{id}/video
//  (chantier 6 du 04/09/2026, « c'est ainsi qu'on vend sur WhatsApp »).
//
//      npm run banc:video
//
//  Un serveur Chap.ci sur SQLite, avec un plafond de 4 Mo (réglage) et PHP
//  réglé plus haut (20 Mo) pour que ce soit bien LE RÉGLAGE qui borne. Le banc
//  vérifie :
//    1. /health dit le plafond réel (4) ;
//    2. sans compte 401, un autre compte 403, un fichier texte 415 ;
//    3. un MP4 de 3 Mo est rangé dans uploads/videos/, l'annonce le porte,
//       le public le voit ;
//    4. une deuxième vidéo (MOV) REMPLACE la première — l'ancien fichier part ;
//    5. modifier l'annonce (PUT) ne perd pas la vidéo ;
//    6. 5 Mo : 413, et la vidéo en place reste ;
//    7. retirer la vidéo : le fichier part, l'annonce n'en a plus ;
//    8. supprimer l'annonce emporte sa vidéo.
//  Les faux fichiers ne sont que des en-têtes (« ftyp ») suivis de zéros : le
//  serveur ne décode pas, il lit le type dans les premiers octets — comme en
//  production.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-video')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const VIDEOS = join(D, 'uploads', 'videos')
const PORT = 8207
const API = `http://127.0.0.1:${PORT}`
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

const serveur = spawn('php', ['-d', 'upload_max_filesize=20M', '-d', 'post_max_size=25M', '-S', `127.0.0.1:${PORT}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: join(D, 'uploads'), CHAPCI_VIDEO_MAX_MO: '4' },
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
/** L'envoi multipart, tel que le site et l'application le font. */
const envoyer = async (id, fichier, nom, type, jeton) => {
  const fd = new FormData()
  if (fichier) fd.append('video', new Blob([fichier], { type }), nom)
  const r = await fetch(`${API}/listings/${id}/video`, { method: 'POST', headers: jeton ? { Authorization: `Bearer ${jeton}` } : {}, body: fd })
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
const annonce = (id, vendeuse) =>
  sqlEcrire(`INSERT INTO listings (id,user_id,title,description,price,negotiable,category_id,subcategory,condition_v,images,region_id,city_id,commune,seller_name,seller_phone,delivery,featured,created_at)
    VALUES ('${id}','${vendeuse}','Canapé trois places','Bon état.',50000,0,'maison','Meubles','occasion','["/uploads/canape.jpg"]','abidjan','abidjan','Cocody','Awa','',0,0,'${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}')`)
const corpsPut = () => ({
  title: 'Canapé trois places, comme neuf', description: 'Bon état.', price: 48000, negotiable: false,
  categoryId: 'maison', subcategory: 'Meubles', condition: 'occasion', images: ['/uploads/canape.jpg'],
  regionId: 'abidjan', cityId: 'abidjan', commune: 'Cocody', sellerName: 'Awa', sellerPhone: '', delivery: false,
})
// Les faux fichiers : l'en-tête ISO Media (« ftyp ») que finfo reconnaît, puis
// du remplissage jusqu'au poids voulu.
const mp4 = (mo) => Buffer.concat([Buffer.from('\x00\x00\x00\x18ftypisom\x00\x00\x02\x00isomiso2mp41', 'latin1'), Buffer.alloc(Math.round(mo * 1024 * 1024))])
const mov = (mo) => Buffer.concat([Buffer.from('\x00\x00\x00\x14ftypqt  \x00\x00\x00\x00qt  ', 'latin1'), Buffer.alloc(Math.round(mo * 1024 * 1024))])
const fichiers = () => (existsSync(VIDEOS) ? readdirSync(VIDEOS) : [])
const videoDe = async (id) => { const r = await appel(`/listings/${id}`); return r.corps?.video ?? null }

const awa = await inscrire('Awa'), koffi = await inscrire('Koffi')
annonce('a1', awa.id)

console.log('── Le plafond ' + '─'.repeat(58))
let r = await appel('/health')
dire(r.corps?.videoMaxMo === 4, '/health dit le plafond réel : 4 Mo (le réglage, PHP acceptant 20)', `videoMaxMo=${r.corps?.videoMaxMo}`)

console.log('\n── Les portes ' + '─'.repeat(58))
r = await envoyer('a1', mp4(0.5), 'v.mp4', 'video/mp4', null)
dire(r.code === 401, 'sans compte : 401', `HTTP ${r.code}`)
r = await envoyer('a1', mp4(0.5), 'v.mp4', 'video/mp4', koffi.jeton)
dire(r.code === 403, 'un autre compte : 403', `HTTP ${r.code}`)
r = await envoyer('inconnue', mp4(0.5), 'v.mp4', 'video/mp4', awa.jeton)
dire(r.code === 404, 'annonce inconnue : 404', `HTTP ${r.code}`)
r = await envoyer('a1', Buffer.from('<?php echo 1; ?>' + 'a'.repeat(3000)), 'v.mp4', 'video/mp4', awa.jeton)
dire(r.code === 415, 'un fichier qui n’est pas une vidéo, même nommé .mp4 : 415', `HTTP ${r.code} ${JSON.stringify(r.corps).slice(0, 100)}`)
r = await envoyer('a1', null, 'v.mp4', 'video/mp4', awa.jeton)
dire(r.code === 400, 'sans fichier : 400', `HTTP ${r.code}`)
dire(fichiers().length === 0 && (await videoDe('a1')) === null, 'rien n’a été écrit, l’annonce n’a pas de vidéo', `${fichiers().length} fichier(s)`)

console.log('\n── La vidéo ' + '─'.repeat(60))
r = await envoyer('a1', mp4(3), 'IMG_0421.MP4', 'video/mp4', awa.jeton)
dire(r.code === 200 && /^\/uploads\/videos\/\d{6}-[0-9a-f-]{36}\.mp4$/.test(r.corps?.video ?? ''), 'un MP4 de 3 Mo est accepté et nommé comme les photos', `HTTP ${r.code} ${r.corps?.video}`)
const premiere = r.corps?.video ?? ''
dire(fichiers().length === 1 && existsSync(join(VIDEOS, premiere.split('/').pop())), 'le fichier est dans uploads/videos/', fichiers().join(','))
dire((await videoDe('a1')) === premiere, 'l’annonce porte la vidéo (GET /listings/{id})')
r = await appel('/listings')
dire(Array.isArray(r.corps) && r.corps.find((l) => l.id === 'a1')?.video === premiere, 'le public la voit dans la liste')
r = await appel('/listings/mine', { jeton: awa.jeton })
dire(Array.isArray(r.corps) && r.corps.find((l) => l.id === 'a1')?.video === premiere, 'le vendeur la voit dans « mes annonces »')

r = await envoyer('a1', mov(1), 'IMG_0422.MOV', 'video/quicktime', awa.jeton)
dire(r.code === 200 && /\.mov$/.test(r.corps?.video ?? ''), 'une deuxième vidéo (MOV d’iPhone) est acceptée', `HTTP ${r.code} ${r.corps?.video}`)
const seconde = r.corps?.video ?? ''
dire(fichiers().length === 1 && !existsSync(join(VIDEOS, premiere.split('/').pop())), 'elle REMPLACE la première : l’ancien fichier est parti', fichiers().join(','))
dire((await videoDe('a1')) === seconde, 'l’annonce porte la nouvelle')

r = await appel('/listings/a1', { method: 'PUT', jeton: awa.jeton, body: corpsPut() })
dire(r.code === 200 && r.corps?.video === seconde, 'modifier l’annonce (PUT) garde la vidéo', `HTTP ${r.code} video=${r.corps?.video}`)

r = await envoyer('a1', mp4(5), 'lourde.mp4', 'video/mp4', awa.jeton)
dire(r.code === 413 && /4 Mo/.test(r.corps?.error ?? ''), '5 Mo : 413, et le message dit le plafond', `HTTP ${r.code} ${r.corps?.error}`)
dire(fichiers().length === 1 && (await videoDe('a1')) === seconde, 'la vidéo en place n’a pas bougé')

console.log('\n── Retirer ' + '─'.repeat(61))
r = await appel('/listings/a1/video', { method: 'DELETE', jeton: koffi.jeton })
dire(r.code === 403, 'un autre compte ne retire pas la vidéo : 403', `HTTP ${r.code}`)
r = await appel('/listings/a1/video', { method: 'DELETE', jeton: awa.jeton })
dire(r.code === 200 && fichiers().length === 0 && (await videoDe('a1')) === null, 'le vendeur la retire : fichier parti, annonce sans vidéo', `HTTP ${r.code} · ${fichiers().length} fichier(s)`)
r = await appel('/listings/a1/video', { method: 'DELETE', jeton: awa.jeton })
dire(r.code === 200, 'retirer deux fois ne casse rien', `HTTP ${r.code}`)

r = await envoyer('a1', mp4(2), 'v.mp4', 'video/mp4', awa.jeton)
dire(r.code === 200 && fichiers().length === 1, 'on en remet une pour la suite', `HTTP ${r.code}`)
r = await appel('/listings/a1', { method: 'DELETE', jeton: awa.jeton })
dire(r.code === 200 && fichiers().length === 0, 'supprimer l’annonce emporte sa vidéo', `HTTP ${r.code} · ${fichiers().length} fichier(s)`)

console.log()
if (rouges) { console.log(`❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log('✅ La vidéo d’une minute tient.')
process.exit(0)
