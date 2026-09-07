// =============================================================================
//  BANC DES COMPTES HORS CÔTE D'IVOIRE ET DE L'ONGLET « PAYS » (07/09/2026)
//
//      npm run banc:pays
//
//  Demande du Patron : « permettre aux gens d'autres pays de créer leur compte,
//  tu mets leur ville et leur pays, dans la catégorie Autres pays ; et dans le
//  compte des admins, une section qui montre, à part la Côte d'Ivoire, les pays
//  inscrits, leurs villes et le nombre d'inscrits ».
//
//  Un serveur Chap.ci sur SQLite. Awa s'inscrit à Dakar, Moussa à Paris, Fatou à
//  Bamako il y a quarante jours (par SQL : on ne rejoue pas le calendrier),
//  Koffi à Abidjan, Yao sans lieu. Awa publie une annonce depuis Dakar. Des
//  visites arrivent de France, du Sénégal et de Côte d'Ivoire. Le banc vérifie :
//    1. un compte hors CI s'enregistre sous region_id = 'autres-pays',
//       city_id = 'pays-xx', commune = la ville en clair, et se relit tel quel ;
//    2. une annonce publiée depuis Dakar porte le même lieu, et la recherche
//       enregistrée la retrouve par région, par pays, par ville ;
//    3. GET /admin/pays est fermé au membre (401/403) et au propriétaire non
//       déverrouillé (423) ; ouvert après le code ;
//    4. les comptes : total, hors CI, sur trente jours (Fatou exclue), sans lieu ;
//       les pays triés par inscrits puis annonces ; les villes sous chaque pays ;
//    5. douze mois, le mois courant à deux, celui de Fatou à un ;
//    6. les visiteurs hors CI par pays (le même visiteur compté une fois, la
//       Côte d'Ivoire à part).
//
//  ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : Fatou est là pour ne PAS compter
//  dans les trente jours, Yao pour compter dans « sans lieu » et pas ailleurs,
//  et le visiteur sénégalais revenu deux fois pour ne compter qu'une.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-pays')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8214
const API = `http://127.0.0.1:${PORT}`
const PATRON = 'patron@banc.ci'
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'index.php'], {
  cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
  env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: DB, CHAPCI_UPLOADS_DIR: join(D, 'uploads'), CHAPCI_ADMIN_EMAILS: PATRON, CHAPCI_CRON_KEY: 'cle-du-banc-pays-2026-09-07-longue' },
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
const appel = async (chemin, { method = 'GET', body, jeton, unlock, cron } = {}) => {
  const r = await fetch(API + chemin, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      ...(unlock ? { 'X-Admin-Unlock': unlock } : {}),
      ...(cron ? { 'X-Cron-Key': 'cle-du-banc-pays-2026-09-07-longue' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text(); let corps = null; try { corps = JSON.parse(t) } catch { corps = t }
  return { code: r.status, corps }
}
const inscrire = async (nom, email = `${nom.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@banc.ci`) => {
  const r = await appel('/auth/signup', { method: 'POST', body: { full_name: nom, email, password: 'motdepasse-du-banc-9', consent: true } })
  if (!r.corps?.token) { console.log('❌ inscription impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }
  sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`)
  return { jeton: r.corps.token, id: r.corps.user?.id ?? sql(`SELECT id FROM users WHERE email = '${email}'`), email }
}
const lieu = (qui, region_id, city_id, commune) => appel('/profile', { method: 'PUT', jeton: qui.jeton, body: { region_id, city_id, commune } })
const photo = (i) => {
  const f = join(D, `photo-${i}.jpg`)
  execFileSync('php', ['-r', `
    $im = imagecreatetruecolor(600, 450); mt_srand($argv[2]);
    imagefill($im, 0, 0, imagecolorallocate($im, mt_rand(60, 220), mt_rand(60, 220), mt_rand(60, 220)));
    for ($k = 0; $k < 20; $k++) { $c = imagecolorallocate($im, mt_rand(0, 255), mt_rand(0, 255), mt_rand(0, 255));
      imagefilledellipse($im, mt_rand(0, 600), mt_rand(0, 450), mt_rand(40, 200), mt_rand(40, 200), $c); }
    imagejpeg($im, $argv[1], 80);`, '--', f, String(i)])
  return 'data:image/jpeg;base64,' + readFileSync(f).toString('base64')
}
const photos = [1, 2, 3].map(photo)
const iso = (t) => new Date(t).toISOString().replace(/\.\d{3}Z$/, 'Z')
const ilYA = (jours) => iso(Date.now() - jours * 86400000)

const patron = await inscrire('Patron', PATRON)
const awa = await inscrire('Awa'), moussa = await inscrire('Moussa'), fatou = await inscrire('Fatou')
const koffi = await inscrire('Koffi'), yao = await inscrire('Yao')

console.log('── Un compte hors Côte d’Ivoire ' + '─'.repeat(40))
let r = await lieu(awa, 'autres-pays', 'pays-sn', 'Dakar')
dire(r.code === 200 && r.corps?.ok === true, 'Awa enregistre son lieu : Autres pays › Sénégal › Dakar', `HTTP ${r.code}`)
r = await appel('/profile', { jeton: awa.jeton })
dire(r.code === 200 && r.corps?.regionId === 'autres-pays' && r.corps?.cityId === 'pays-sn' && r.corps?.commune === 'Dakar',
  'elle se relit telle quelle sur GET /profile', JSON.stringify({ regionId: r.corps?.regionId, cityId: r.corps?.cityId, commune: r.corps?.commune }))
r = await appel(`/profile/${awa.id}`)
dire(r.code === 200 && r.corps?.id === awa.id && r.corps?.commune === undefined && r.corps?.regionId === undefined && r.corps?.cityId === undefined,
  'sa fiche publique ne dit ni sa ville ni son pays — le lieu d’une personne reste privé, seules ses annonces en portent un', Object.keys(r.corps ?? {}).join(','))
await lieu(moussa, 'autres-pays', 'pays-fr', 'Paris')
await lieu(fatou, 'autres-pays', 'pays-ml', 'Bamako')
await lieu(koffi, 'abidjan', 'abidjan-ville', 'Cocody')
// Fatou s'est inscrite il y a quarante jours : hors des « trente jours ».
sqlEcrire(`UPDATE profiles SET created_at = '${ilYA(40)}' WHERE id = '${fatou.id}'`)
sqlEcrire(`UPDATE users SET created_at = '${ilYA(40)}' WHERE id = '${fatou.id}'`)
dire(sql(`SELECT COUNT(*) FROM profiles WHERE region_id = 'autres-pays'`) === '3', 'trois profils hors CI en base (Awa, Moussa, Fatou)')

console.log('\n── Une annonce depuis Dakar ' + '─'.repeat(44))
// Les alertes de Koffi, posées AVANT l'annonce (une alerte ne prévient que des
// annonces publiées après elle) : « Autres pays », le Sénégal, Dakar — et deux
// qui ne doivent PAS sonner : Abidjan, et le Mali.
const alerte = (label, params) => appel('/searches', { method: 'POST', jeton: koffi.jeton, body: { label, params } })
r = await alerte('Boubous hors CI', 'q=boubou&region=autres-pays')
dire(r.code === 200 && r.corps?.id, 'Koffi enregistre une alerte « boubou » dans Autres pays', `HTTP ${r.code}`)
await alerte('Boubous au Sénégal', 'q=boubou&region=autres-pays&ville=pays-sn')
await alerte('Boubous à Dakar', 'q=boubou&region=autres-pays&ville=pays-sn&commune=Dakar')
await alerte('Boubous à Abidjan', 'q=boubou&region=abidjan')
await alerte('Boubous au Mali', 'q=boubou&region=autres-pays&ville=pays-ml')
await new Promise((res) => setTimeout(res, 1100)) // l'annonce doit être postérieure aux alertes, à la seconde près
r = await appel('/listings', { method: 'POST', jeton: awa.jeton, body: {
  title: 'Boubou brodé grande taille', description: 'Cousu à Dakar, tissu bazin riche, jamais porté. Envoi possible vers Abidjan.', price: 25000, negotiable: true,
  categoryId: 'mode', subcategory: 'Vêtements femme', condition: 'neuf', images: photos,
  regionId: 'autres-pays', cityId: 'pays-sn', commune: 'Dakar', sellerName: 'Awa', sellerPhone: '+221770000000', delivery: true,
} })
dire(r.code === 200 && r.corps?.id, 'Awa publie une annonce', `HTTP ${r.code} ${JSON.stringify(r.corps).slice(0, 120)}`)
const annonceId = r.corps?.id
r = await appel(`/listings/${annonceId}`)
dire(r.code === 200 && r.corps?.regionId === 'autres-pays' && r.corps?.cityId === 'pays-sn' && r.corps?.commune === 'Dakar',
  'l’annonce porte Autres pays › Sénégal › Dakar', JSON.stringify({ regionId: r.corps?.regionId, cityId: r.corps?.cityId, commune: r.corps?.commune }))
// Les alertes filtrent par région, par ville, par commune — donc par « Autres
// pays », par pays, par ville. Cinq alertes, trois doivent trouver l'annonce.
r = await appel('/cron/alerts', { cron: true })
dire(r.code === 200 && r.corps?.searches === 5 && r.corps?.matched === 3,
  'les alertes : Autres pays, Sénégal et Dakar trouvent l’annonce ; Abidjan et le Mali, non', `HTTP ${r.code} ${JSON.stringify(r.corps)}`)

console.log('\n── Des visites depuis l’étranger ' + '─'.repeat(39))
let n = 0
const visite = (visiteur, pays, jours = 1) =>
  sqlEcrire(`INSERT INTO visits (id,visitor_id,path,referrer,authed,country,created_at) VALUES ('v${++n}','${visiteur}','/','',0,'${pays}','${ilYA(jours)}')`)
visite('fr-1', 'FR'); visite('fr-2', 'FR'); visite('fr-3', 'FR')
visite('sn-1', 'SN'); visite('sn-1', 'SN', 2) // le même, deux fois
visite('ci-1', 'CI'); visite('ci-2', 'CI'); visite('ci-3', 'CI'); visite('ci-4', 'CI')
visite('de-vieux', 'DE', 45) // trop vieux pour compter
dire(sql('SELECT COUNT(*) FROM visits') === '10', 'dix visites en base')

console.log('\n── La porte de l’onglet « Pays » ' + '─'.repeat(38))
r = await appel('/admin/pays', { jeton: koffi.jeton })
dire(r.code === 401 || r.code === 403, 'un simple membre est refusé', `HTTP ${r.code}`)
r = await appel('/admin/pays', { jeton: patron.jeton })
dire(r.code === 423, 'le propriétaire sans déverrouillage reçoit 423, « verrouillé »', `HTTP ${r.code}`)
writeFileSync(join(D, '.admin_otp'), `123456|${Math.floor(Date.now() / 1000) + 300}`)
r = await appel('/admin/unlock', { method: 'POST', jeton: patron.jeton, body: { code: '123456' } })
const unlock = r.corps?.token
dire(!!unlock, 'le propriétaire déverrouille avec le code', `HTTP ${r.code}`)

console.log('\n── Ce que l’onglet dit ' + '─'.repeat(49))
r = await appel('/admin/pays', { jeton: patron.jeton, unlock })
const P = r.corps ?? {}
dire(r.code === 200 && typeof P.genereLe === 'string', 'GET /admin/pays répond', `HTTP ${r.code}`)
dire(P.total === 6, 'six membres au total', `${P.total}`)
dire(P.horsCi === 3, 'trois hors Côte d’Ivoire', `${P.horsCi}`)
dire(P.horsCiRecents === 2, 'deux sur trente jours — Fatou, inscrite il y a quarante jours, ne compte pas', `${P.horsCiRecents}`)
dire(P.sansLieu === 2, 'deux sans lieu : Yao et le Patron, ni CI ni ailleurs', `${P.sansLieu}`)
const codes = (P.pays ?? []).map((p) => p.code)
dire(codes.length === 3 && codes[0] === 'SN', 'trois pays, le Sénégal en tête (une inscrite ET une annonce)', codes.join(', '))
dire(codes.slice(1).sort().join(',') === 'FR,ML', 'puis la France et le Mali', codes.join(', '))
const sn = (P.pays ?? []).find((p) => p.code === 'SN') ?? {}
const ml = (P.pays ?? []).find((p) => p.code === 'ML') ?? {}
dire(sn.inscrits === 1 && sn.recents === 1 && sn.annonces === 1, 'Sénégal : 1 inscrite, 1 récente, 1 annonce', JSON.stringify(sn))
dire(Array.isArray(sn.villes) && sn.villes.length === 1 && sn.villes[0].ville === 'Dakar' && sn.villes[0].inscrits === 1, 'sa ville : Dakar, 1', JSON.stringify(sn.villes))
dire(ml.inscrits === 1 && ml.recents === 0 && ml.villes?.[0]?.ville === 'Bamako', 'Mali : 1 inscrite, 0 récente, Bamako', JSON.stringify(ml))
dire(!codes.includes('CI') && !codes.includes('ZZ'), 'ni la Côte d’Ivoire ni « Autre pays » dans la liste', codes.join(', '))

const mois = P.mois ?? []
const ceMois = new Date().toISOString().slice(0, 7)
const moisFatou = new Date(Date.now() - 40 * 86400000).toISOString().slice(0, 7)
dire(mois.length === 12 && mois[11]?.mois === ceMois, 'douze mois, le courant en dernier', `${mois.length} mois, dernier ${mois[11]?.mois}`)
dire(mois[11]?.inscrits === 2, 'ce mois-ci : deux inscrites hors CI (Awa, Moussa)', `${mois[11]?.inscrits}`)
dire(mois.find((m) => m.mois === moisFatou)?.inscrits === (moisFatou === ceMois ? 3 : 1), `le mois de Fatou (${moisFatou}) la compte`, JSON.stringify(mois.find((m) => m.mois === moisFatou)))
dire(mois.reduce((s, m) => s + m.inscrits, 0) === 3, 'trois inscriptions hors CI sur douze mois', `${mois.reduce((s, m) => s + m.inscrits, 0)}`)

const V = P.visites ?? []
dire(V.length === 2 && V[0].code === 'FR' && V[0].visiteurs === 3, 'visiteurs hors CI : la France en tête avec 3', JSON.stringify(V))
dire(V[1]?.code === 'SN' && V[1]?.visiteurs === 1, 'le Sénégal : 1 — le même visiteur revenu deux fois ne compte qu’une', JSON.stringify(V[1]))
dire(!V.some((v) => v.code === 'CI') && !V.some((v) => v.code === 'DE'), 'ni la Côte d’Ivoire ni la visite allemande de quarante-cinq jours', JSON.stringify(V))
dire(P.visiteursCi === 4, 'quatre visiteurs depuis la Côte d’Ivoire, à part', `${P.visiteursCi}`)

console.log('\n── Le lieu se corrige ' + '─'.repeat(50))
r = await lieu(awa, 'autres-pays', 'pays-fr', 'Lyon')
r = await appel('/admin/pays', { jeton: patron.jeton, unlock })
const fr = (r.corps?.pays ?? []).find((p) => p.code === 'FR') ?? {}
dire(fr.inscrits === 2 && (fr.villes ?? []).map((v) => v.ville).sort().join(',') === 'Lyon,Paris', 'Awa déménage à Lyon : la France a deux inscrites, Paris et Lyon', JSON.stringify(fr))
const sn2 = (r.corps?.pays ?? []).find((p) => p.code === 'SN') ?? {}
dire(sn2.inscrits === 0 && sn2.annonces === 1, 'le Sénégal garde son annonce, sans inscrit', JSON.stringify(sn2))
r = await lieu(awa, 'abidjan', 'abidjan-ville', 'Cocody')
r = await appel('/admin/pays', { jeton: patron.jeton, unlock })
dire(r.corps?.horsCi === 2, 'Awa rentre à Abidjan : deux hors CI', `${r.corps?.horsCi}`)

console.log(`\n${rouges === 0 ? '✅ Tout est vert' : `❌ ${rouges} vérification${rouges > 1 ? 's' : ''} en échec`}`)
process.exit(rouges === 0 ? 0 : 1)
