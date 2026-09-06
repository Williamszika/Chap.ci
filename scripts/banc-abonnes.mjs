// =============================================================================
//  BANC DES ABONNÉS ET DES OFFRES D'EMPLOI DU COMPTE PROFESSIONNEL (06/09/2026)
//
//      npm run banc:abonnes
//
//  Demande du Patron : « que les entreprises, les ONG et autres structures
//  puissent être suivies, que leur page ait un espace pour les offres
//  d'emploi, avec lien de formulaire ou un formulaire qu'ils créent eux-mêmes,
//  et que les abonnés reçoivent une notification quand ils publient ».
//
//  Un serveur Chap.ci sur SQLite, une structure approuvée pro par SQL (la
//  validation humaine ne se rejoue pas ici), deux comptes ordinaires. Le banc
//  vérifie, dans l'ordre où un utilisateur les rencontre :
//    1. suivre : seulement un pro approuvé (403), jamais soi-même, une fois ;
//       le compteur monte et descend ; la page publique dit « abonné » au bon
//       visiteur ; /suivis liste ce qu'on suit ;
//    2. la notification « abonnement » arrive à l'abonné quand la structure
//       publie une ANNONCE, puis une OFFRE — et pas à celui qui a coupé ce type
//       dans ses réglages, ni à celui qui ne suit pas ;
//    3. les offres : réservées au pro approuvé ; titre, description, lien
//       https://, formulaire vérifiés ; sans lien ni formulaire, trois questions
//       de base ; la liste publique cache les fermées et les expirées ;
//    4. postuler : adresse confirmée (403), pas à sa propre offre, une seule
//       fois (409), réponse obligatoire (422), choix hors liste (422), e-mail
//       invalide (422) ; le compteur monte ; le pro reçoit « candidature » ;
//       lui seul lit les candidatures (403 pour un autre) ;
//    5. fermer une offre : 410 pour le public, toujours visible pour l'auteur ;
//       supprimer efface aussi les candidatures ;
//    6. supprimer le compte de l'abonné efface ses abonnements, celui de la
//       structure efface ses abonnés, ses offres et leurs candidatures.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-abonnes')
rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
const DB = join(D, 'banc.sqlite')
const PORT = 8213
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
const inscrire = async (nom, { verifie = true } = {}) => {
  const email = `${nom.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@banc.ci`
  const r = await appel('/auth/signup', { method: 'POST', body: { full_name: nom, email, password: 'motdepasse-du-banc-9', consent: true } })
  if (!r.corps?.token) { console.log('❌ inscription impossible :', JSON.stringify(r).slice(0, 200)); process.exit(1) }
  if (verifie) sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`)
  return { jeton: r.corps.token, id: r.corps.user?.id ?? sql(`SELECT id FROM users WHERE email = '${email}'`), email }
}
// Des photos JPEG dessinées par GD : POST /listings en exige trois vraies.
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
const notifs = async (qui, type) => { const r = await appel('/notifications', { jeton: qui.jeton }); return (Array.isArray(r.corps) ? r.corps : []).filter((n) => n.type === type) }
const suivre = (qui, id) => appel(`/suivre/${id}`, { method: 'POST', jeton: qui.jeton })
const offre = (qui, body) => appel('/offres', { method: 'POST', jeton: qui.jeton, body })
const DESCRIPTION = 'Nous cherchons une personne sérieuse pour tenir la boutique de Cocody : accueil, encaissement, rangement. Six jours sur sept.'

// La structure (Maison Koffi, approuvée), deux abonnés potentiels, un compte non confirmé.
const koffi = await inscrire('Koffi'), awa = await inscrire('Awa'), moussa = await inscrire('Moussa'), yao = await inscrire('Yao', { verifie: false })
sqlEcrire(`UPDATE users SET pro_status = 'approuve', pro_nom = 'Maison Koffi', pro_type = 'commerce', pro_secteur = 'Mode', pro_decide_at = '2026-08-01T00:00:00Z' WHERE id = '${koffi.id}'`)

console.log('── Suivre ' + '─'.repeat(62))
let r = await suivre(awa, moussa.id)
dire(r.code === 403, 'suivre un compte ordinaire : 403 (seul un pro approuvé se suit)', `HTTP ${r.code}`)
r = await suivre(koffi, koffi.id)
dire(r.code === 400, 'se suivre soi-même : refusé', `HTTP ${r.code}`)
r = await appel(`/suivre/${koffi.id}`, { method: 'POST' })
dire(r.code === 401, 'sans compte : 401', `HTTP ${r.code}`)
r = await suivre(awa, koffi.id)
dire(r.code === 200 && r.corps?.abonne === true && r.corps?.abonnes === 1, 'Awa suit Maison Koffi : abonné, 1 abonné', `HTTP ${r.code} ${JSON.stringify(r.corps)}`)
r = await suivre(awa, koffi.id)
dire(r.code === 200 && r.corps?.abonnes === 1, 'suivre deux fois ne compte qu’une fois', JSON.stringify(r.corps))
r = await suivre(moussa, koffi.id)
dire(r.code === 200 && r.corps?.abonnes === 2, 'Moussa suit aussi : 2 abonnés', JSON.stringify(r.corps))
r = await appel(`/profile/${koffi.id}`, { jeton: awa.jeton })
dire(r.code === 200 && r.corps?.abonne === true && r.corps?.pro?.abonnes === 2 && r.corps?.pro?.offres === 0, 'la page publique, vue par Awa : abonné, 2 abonnés, 0 offre', JSON.stringify({ abonne: r.corps?.abonne, abonnes: r.corps?.pro?.abonnes, offres: r.corps?.pro?.offres }))
r = await appel(`/profile/${koffi.id}`)
dire(r.code === 200 && r.corps?.abonne === false && r.corps?.pro?.abonnes === 2, 'vue sans compte : pas abonné, mais le compte des abonnés se voit', JSON.stringify({ abonne: r.corps?.abonne, abonnes: r.corps?.pro?.abonnes }))
r = await appel(`/suivre/${koffi.id}`, { jeton: moussa.jeton })
dire(r.code === 200 && r.corps?.abonne === true, 'GET /suivre/{id} dit si je suis', JSON.stringify(r.corps))
r = await appel('/suivis', { jeton: awa.jeton })
dire(r.code === 200 && Array.isArray(r.corps) && r.corps.length === 1 && r.corps[0].id === koffi.id && r.corps[0].nom === 'Maison Koffi', '/suivis liste Maison Koffi, sous son enseigne', JSON.stringify(r.corps).slice(0, 160))
r = await appel(`/suivre/${koffi.id}`, { method: 'DELETE', jeton: moussa.jeton })
dire(r.code === 200 && r.corps?.abonne === false && r.corps?.abonnes === 1, 'Moussa ne suit plus : 1 abonné', JSON.stringify(r.corps))

console.log('\n── Les abonnés sont prévenus ' + '─'.repeat(43))
// Moussa ne suit plus. Awa suit. Yao suit mais a coupé le type « abonnement ».
sqlEcrire(`UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE id = '${yao.id}'`) // le temps de ce bloc
await suivre(yao, koffi.id)
r = await appel('/notifications/prefs', { method: 'PUT', jeton: yao.jeton, body: { abonnement: false } })
dire(r.code === 200, 'Yao coupe les notifications « abonnement » dans ses réglages', `HTTP ${r.code}`)
r = await appel('/listings', { method: 'POST', jeton: koffi.jeton, body: {
  title: 'Robe wax taille 40', description: 'Neuve, jamais portée, à voir en boutique à Cocody.', price: 15000, negotiable: true,
  categoryId: 'mode', subcategory: 'Vêtements femme', condition: 'neuf', images: photos,
  regionId: 'abidjan', cityId: 'abidjan', commune: 'Cocody', sellerName: 'Maison Koffi', sellerPhone: '0700000001', delivery: false,
} })
dire(r.code === 200 && r.corps?.id, 'Maison Koffi publie une annonce', `HTTP ${r.code} ${JSON.stringify(r.corps).slice(0, 120)}`)
const annonceId = r.corps?.id
let n = await notifs(awa, 'abonnement')
dire(n.length === 1 && /Maison Koffi/.test(n[0].title) && /Robe wax/.test(n[0].body) && /15 000 FCFA/.test(n[0].body) && n[0].link === `#/annonce/${annonceId}`,
  'Awa reçoit « Nouveauté chez Maison Koffi » : le titre, le prix, le lien de l’annonce', JSON.stringify(n[0] ?? null))
n = await notifs(moussa, 'abonnement')
dire(n.length === 0, 'Moussa, qui ne suit plus, ne reçoit rien')
n = await notifs(yao, 'abonnement')
dire(n.length === 0, 'Yao, qui a coupé ce type, ne reçoit rien')
n = await notifs(koffi, 'abonnement')
dire(n.length === 0, 'la structure elle-même ne se prévient pas')

console.log('\n── Publier une offre ' + '─'.repeat(51))
r = await offre(awa, { titre: 'Vendeuse en boutique', description: DESCRIPTION })
dire(r.code === 403, 'un compte ordinaire ne publie pas d’offre : 403', `HTTP ${r.code}`)
r = await offre(koffi, { titre: 'Ven', description: DESCRIPTION })
dire(r.code === 400, 'titre trop court : refusé', `HTTP ${r.code}`)
r = await offre(koffi, { titre: 'Vendeuse en boutique', description: 'Trop court.' })
dire(r.code === 400, 'description trop courte : refusée', `HTTP ${r.code}`)
r = await offre(koffi, { titre: 'Vendeuse en boutique', description: DESCRIPTION, lien: 'http://forms.gle/abc' })
dire(r.code === 400 && /https/.test(r.corps?.error ?? ''), 'un lien en http:// : refusé, en disant https://', `HTTP ${r.code} ${r.corps?.error}`)
r = await offre(koffi, { titre: 'Vendeuse en boutique', description: DESCRIPTION, formulaire: [{ label: '', type: 'texte' }] })
dire(r.code === 400, 'une question sans libellé : refusée', `HTTP ${r.code}`)
r = await offre(koffi, { titre: 'Vendeuse en boutique', description: DESCRIPTION, formulaire: [{ label: 'Âge', type: 'nombre' }] })
dire(r.code === 400, 'un type de question inconnu : refusé', `HTTP ${r.code}`)
r = await offre(koffi, { titre: 'Vendeuse en boutique', description: DESCRIPTION, formulaire: [{ label: 'Disponible ?', type: 'choix', options: ['Oui'] }] })
dire(r.code === 400, 'un choix à une seule option : refusé', `HTTP ${r.code}`)
r = await offre(koffi, { titre: 'Gagnez 500 000 FCFA sans rien faire, payez 5 000 FCFA de frais de dossier', description: DESCRIPTION + ' Envoyez les frais par Wave avant l’entretien.' })
dire(r.code === 422 && r.corps?.moderation === true, 'le Gardien lit les offres : « payez pour être recruté » est bloqué', `HTTP ${r.code}`)

// Offre 1 : sans lien ni formulaire → trois questions de base.
r = await offre(koffi, { titre: 'Vendeuse en boutique', description: DESCRIPTION, contrat: 'CDI', lieu: 'Cocody', salaire: '120 000 FCFA' })
dire(r.code === 200 && r.corps?.id && r.corps?.statut === 'ouverte', 'l’offre « Vendeuse en boutique » est publiée', `HTTP ${r.code} ${JSON.stringify(r.corps).slice(0, 160)}`)
const o1 = r.corps
dire(Array.isArray(o1?.formulaire) && o1.formulaire.map((c) => c.id).join(',') === 'nom,tel,message' && o1.formulaire.every((c) => c.requis), 'sans lien ni formulaire : trois questions de base (nom, tel, message), obligatoires', JSON.stringify(o1?.formulaire))
dire(o1?.entreprise === 'Maison Koffi' && o1?.typeStructure === 'commerce' && o1?.candidatures === 0, 'l’offre porte l’enseigne, le type de structure, 0 candidature pour l’auteur', JSON.stringify({ e: o1?.entreprise, t: o1?.typeStructure, c: o1?.candidatures }))
dire(typeof o1?.expiresAt === 'number' && o1.expiresAt - o1.createdAt > 59 * 86400 * 1000 && o1.expiresAt - o1.createdAt < 61 * 86400 * 1000, 'elle expire dans soixante jours', `${Math.round((o1?.expiresAt - o1?.createdAt) / 86400000)} j`)
dire(o1?.abonnesPrevenus === 1, 'un seul abonné prévenu (Awa ; Yao a coupé, Moussa ne suit plus)', `abonnesPrevenus=${o1?.abonnesPrevenus}`)
n = await notifs(awa, 'abonnement')
dire(n.length === 2 && /Offre d’emploi : Maison Koffi/.test(n[0].title) && /Vendeuse en boutique — Cocody/.test(n[0].body) && n[0].link === `#/emploi/${o1?.id}`, 'Awa reçoit « Offre d’emploi : Maison Koffi » avec le titre, le lieu, le lien', JSON.stringify(n[0] ?? null))

// Offre 2 : un lien Google Forms, pas de formulaire ici.
r = await offre(koffi, { titre: 'Stagiaire communication', description: DESCRIPTION, lien: 'https://forms.gle/abc123' })
dire(r.code === 200 && r.corps?.lien === 'https://forms.gle/abc123' && Array.isArray(r.corps?.formulaire) && r.corps.formulaire.length === 0, 'une offre avec un lien de formulaire n’a pas de formulaire maison', JSON.stringify({ lien: r.corps?.lien, f: r.corps?.formulaire }))
const o2 = r.corps

// Offre 3 : un formulaire dessiné par la structure.
r = await offre(koffi, { titre: 'Couturier expérimenté', description: DESCRIPTION, formulaire: [
  { id: 'nom', label: 'Votre nom', type: 'texte', requis: true },
  { id: 'email', label: 'Votre e-mail', type: 'email', requis: false },
  { id: 'Mauvais Id !', label: 'Années d’expérience', type: 'choix', options: ['Moins de 2 ans', '2 à 5 ans', 'Plus de 5 ans', ''], requis: true },
  { id: 'permis', label: 'Avez-vous un permis ?', type: 'ouinon' },
  { id: 'motiv', label: 'Pourquoi vous ?', type: 'long', requis: true },
] })
dire(r.code === 200 && r.corps?.formulaire?.length === 5, 'un formulaire de cinq questions est enregistré', `HTTP ${r.code} ${JSON.stringify(r.corps?.formulaire).slice(0, 200)}`)
const o3 = r.corps
dire(o3?.formulaire?.[2]?.id === 'q3' && o3.formulaire[2].options.length === 3, 'un identifiant fautif est renuméroté (q3), l’option vide est ôtée', JSON.stringify(o3?.formulaire?.[2]))
dire(o3?.formulaire?.[3]?.requis === false, '« requis » absent vaut facultatif')
r = await offre(koffi, { titre: 'Doublon d’identifiant', description: DESCRIPTION, formulaire: [{ id: 'a', label: 'Un', type: 'texte' }, { id: 'a', label: 'Deux', type: 'texte' }] })
dire(r.code === 400, 'deux questions avec le même identifiant : refusé', `HTTP ${r.code}`)

console.log('\n── La liste publique ' + '─'.repeat(51))
r = await appel(`/offres?user_id=${koffi.id}`)
dire(r.code === 200 && r.corps?.length === 3 && [o1.id, o2.id, o3.id].every((id) => r.corps.some((o) => o.id === id)) && r.corps.every((o) => o.candidatures === null), 'les trois offres ouvertes, sans le compteur de candidatures', `${r.corps?.length} offres`)
r = await appel('/offres')
dire(r.code === 200 && r.corps?.length === 3, 'sans user_id : toutes les offres ouvertes du site', `${r.corps?.length}`)
r = await appel(`/profile/${koffi.id}`)
dire(r.corps?.pro?.offres === 3, 'la page publique compte 3 offres', `offres=${r.corps?.pro?.offres}`)
r = await appel(`/offres/${o1.id}`, { jeton: awa.jeton })
dire(r.code === 200 && r.corps?.dejaCandidate === false && r.corps?.candidatures === null, 'une offre, vue par Awa : pas encore candidate, pas de compteur', JSON.stringify({ d: r.corps?.dejaCandidate, c: r.corps?.candidatures }))
r = await appel('/offres/mine', { jeton: koffi.jeton })
dire(r.code === 200 && r.corps?.length === 3 && r.corps.every((o) => typeof o.candidatures === 'number'), '/offres/mine : les miennes avec le compteur', `${r.corps?.length}`)
r = await appel('/offres/mine', { jeton: awa.jeton })
dire(r.code === 200 && r.corps?.length === 0, 'Awa n’a aucune offre à elle')

console.log('\n── Postuler ' + '─'.repeat(60))
const candidater = (qui, id, body) => appel(`/offres/${id}/candidater`, { method: 'POST', jeton: qui.jeton, body })
sqlEcrire(`UPDATE users SET email_verified_at = NULL WHERE id = '${yao.id}'`)
r = await candidater(yao, o1.id, { reponses: { nom: 'Yao', tel: '0700000002', message: 'Je suis disponible.' } })
dire(r.code === 403 && r.corps?.emailUnverified === true, 'adresse non confirmée : 403 emailUnverified', `HTTP ${r.code}`)
r = await candidater(koffi, o1.id, { reponses: { nom: 'Koffi', tel: '0700000001', message: 'Moi-même.' } })
dire(r.code === 400, 'postuler à sa propre offre : refusé', `HTTP ${r.code}`)
r = await candidater(awa, o2.id, { reponses: {} })
dire(r.code === 400 && /lien/.test(r.corps?.error ?? ''), 'une offre à lien externe ne se postule pas ici', `HTTP ${r.code} ${r.corps?.error}`)
r = await candidater(awa, o1.id, { reponses: { nom: 'Awa', tel: '' } })
dire(r.code === 422 && /téléphone/.test(r.corps?.error ?? ''), 'une question obligatoire sans réponse : 422, en la nommant', `HTTP ${r.code} ${r.corps?.error}`)
r = await candidater(awa, o3.id, { reponses: { nom: 'Awa', q3: '10 ans', motiv: 'Parce que.' } })
dire(r.code === 422 && /expérience/.test(r.corps?.error ?? ''), 'un choix hors des options : 422', `HTTP ${r.code} ${r.corps?.error}`)
r = await candidater(awa, o3.id, { reponses: { nom: 'Awa', email: 'pas-un-email', q3: '2 à 5 ans', motiv: 'Parce que.' } })
dire(r.code === 422 && /e-mail/.test(r.corps?.error ?? ''), 'un e-mail mal formé : 422', `HTTP ${r.code} ${r.corps?.error}`)
r = await candidater(awa, o1.id, { nom: 'Awa Koné', tel: '0700000003', reponses: { nom: 'Awa Koné', tel: '0700000003', message: 'Trois ans en boutique à Yopougon.' } })
dire(r.code === 200 && r.corps?.id, 'Awa postule à « Vendeuse en boutique »', `HTTP ${r.code} ${JSON.stringify(r.corps)}`)
r = await candidater(awa, o1.id, { reponses: { nom: 'Awa', tel: '0700000003', message: 'Encore.' } })
dire(r.code === 409, 'une seconde fois : 409', `HTTP ${r.code}`)
r = await candidater(moussa, o3.id, { reponses: { nom: 'Moussa', q3: 'Plus de 5 ans', permis: true, motiv: 'Quinze ans chez un maître tailleur.' } })
dire(r.code === 200, 'Moussa postule à « Couturier » avec un oui/non à vrai', `HTTP ${r.code} ${JSON.stringify(r.corps)}`)
r = await appel(`/offres/${o1.id}`, { jeton: awa.jeton })
dire(r.corps?.dejaCandidate === true, 'l’offre, revue par Awa : déjà candidate')
r = await appel(`/offres/${o1.id}`, { jeton: koffi.jeton })
dire(r.corps?.candidatures === 1, 'l’auteur voit 1 candidature', `candidatures=${r.corps?.candidatures}`)
n = await notifs(koffi, 'candidature')
dire(n.length === 2 && n.some((x) => /Awa Koné/.test(x.body) && /Vendeuse en boutique/.test(x.body) && x.link === `#/emploi/${o1.id}`), 'Maison Koffi reçoit « Nouvelle candidature » : le nom, l’offre, le lien', JSON.stringify(n.map((x) => x.body)))
r = await appel(`/offres/${o1.id}/candidatures`, { jeton: awa.jeton })
dire(r.code === 403, 'les candidatures ne se lisent pas par un autre compte : 403', `HTTP ${r.code}`)
r = await appel(`/offres/${o1.id}/candidatures`, { jeton: koffi.jeton })
dire(r.code === 200 && r.corps?.candidatures?.length === 1 && r.corps.candidatures[0].nom === 'Awa Koné' && r.corps.candidatures[0].email === awa.email
  && r.corps.candidatures[0].tel === '0700000003' && r.corps.candidatures[0].reponses?.message === 'Trois ans en boutique à Yopougon.' && r.corps.formulaire?.length === 3,
  'l’auteur lit la candidature : nom, e-mail, téléphone, réponses, et le formulaire pour les libellés', JSON.stringify(r.corps).slice(0, 220))
r = await appel(`/offres/${o3.id}/candidatures`, { jeton: koffi.jeton })
dire(r.corps?.candidatures?.[0]?.reponses?.permis === 'oui', 'un oui/non à vrai est rangé comme « oui »', JSON.stringify(r.corps?.candidatures?.[0]?.reponses))

console.log('\n── Modifier, fermer, supprimer ' + '─'.repeat(41))
r = await appel(`/offres/${o1.id}`, { method: 'PUT', jeton: awa.jeton, body: { titre: 'Piratée' } })
dire(r.code === 403, 'modifier l’offre d’un autre : 403', `HTTP ${r.code}`)
r = await appel(`/offres/${o1.id}`, { method: 'PUT', jeton: koffi.jeton, body: { salaire: '150 000 FCFA' } })
dire(r.code === 200 && r.corps?.salaire === '150 000 FCFA' && r.corps?.titre === 'Vendeuse en boutique', 'modifier le salaire seul garde le reste', JSON.stringify({ s: r.corps?.salaire, t: r.corps?.titre }))
r = await appel(`/offres/${o1.id}`, { method: 'PUT', jeton: koffi.jeton, body: { statut: 'fermee' } })
dire(r.code === 200 && r.corps?.statut === 'fermee', 'l’offre est fermée', `statut=${r.corps?.statut}`)
r = await appel(`/offres/${o1.id}`)
dire(r.code === 410, 'pour le public, une offre fermée : 410', `HTTP ${r.code}`)
r = await appel(`/offres/${o1.id}`, { jeton: koffi.jeton })
dire(r.code === 200 && r.corps?.candidatures === 1, 'pour l’auteur, toujours lisible, avec ses candidatures', `HTTP ${r.code}`)
r = await appel(`/offres?user_id=${koffi.id}`)
dire(r.corps?.length === 2, 'la liste publique n’en montre plus que 2', `${r.corps?.length}`)
r = await candidater(moussa, o1.id, { reponses: { nom: 'Moussa', tel: '0700000004', message: 'Trop tard.' } })
dire(r.code === 410, 'postuler à une offre fermée : 410', `HTTP ${r.code}`)
sqlEcrire(`UPDATE offres SET expires_at = '2026-01-01T00:00:00Z' WHERE id = '${o2.id}'`)
r = await appel(`/offres?user_id=${koffi.id}`)
dire(r.corps?.length === 1 && r.corps[0].id === o3.id, 'une offre expirée disparaît aussi de la liste', `${r.corps?.length}`)
r = await appel(`/profile/${koffi.id}`)
dire(r.corps?.pro?.offres === 1, 'la page publique compte 1 offre', `offres=${r.corps?.pro?.offres}`)
r = await appel(`/offres/${o1.id}`, { method: 'PUT', jeton: koffi.jeton, body: { statut: 'ouverte' } })
dire(r.code === 200 && r.corps?.statut === 'ouverte', 'et se rouvre', `statut=${r.corps?.statut}`)
r = await appel(`/offres/${o3.id}`, { method: 'DELETE', jeton: moussa.jeton })
dire(r.code === 403, 'supprimer l’offre d’un autre : 403', `HTTP ${r.code}`)
r = await appel(`/offres/${o3.id}`, { method: 'DELETE', jeton: koffi.jeton })
dire(r.code === 200 && sql(`SELECT COUNT(*) FROM candidatures WHERE offre_id = '${o3.id}'`) === '0', 'supprimer une offre efface ses candidatures', `HTTP ${r.code}`)
r = await appel(`/offres/${o3.id}`)
dire(r.code === 404, 'et elle n’existe plus : 404', `HTTP ${r.code}`)

console.log('\n── Le dossier retiré, les comptes supprimés ' + '─'.repeat(28))
sqlEcrire(`UPDATE users SET pro_status = 'en_attente' WHERE id = '${koffi.id}'`)
r = await suivre(moussa, koffi.id)
dire(r.code === 403, 'un dossier plus approuvé ne se suit plus : 403', `HTTP ${r.code}`)
r = await offre(koffi, { titre: 'Encore une', description: DESCRIPTION })
dire(r.code === 403, 'et ne publie plus d’offre : 403', `HTTP ${r.code}`)
sqlEcrire(`UPDATE users SET pro_status = 'approuve' WHERE id = '${koffi.id}'`)
r = await appel('/auth/delete', { method: 'POST', jeton: awa.jeton, body: { password: 'motdepasse-du-banc-9' } })
dire(r.code === 200 && sql(`SELECT COUNT(*) FROM follows WHERE user_id = '${awa.id}'`) === '0' && sql(`SELECT COUNT(*) FROM candidatures WHERE user_id = '${awa.id}'`) === '0',
  'Awa supprime son compte : ses abonnements et ses candidatures partent avec', `HTTP ${r.code} ${JSON.stringify(r.corps).slice(0, 80)}`)
r = await appel(`/profile/${koffi.id}`)
dire(r.corps?.pro?.abonnes === 1, 'Maison Koffi n’a plus que Yao', `abonnes=${r.corps?.pro?.abonnes}`)
r = await appel('/auth/delete', { method: 'POST', jeton: koffi.jeton, body: { password: 'motdepasse-du-banc-9' } })
dire(r.code === 200 && sql(`SELECT COUNT(*) FROM follows WHERE pro_id = '${koffi.id}'`) === '0' && sql(`SELECT COUNT(*) FROM offres WHERE user_id = '${koffi.id}'`) === '0' && sql('SELECT COUNT(*) FROM candidatures') === '0',
  'Maison Koffi supprime son compte : ses abonnés, ses offres et leurs candidatures partent avec', `HTTP ${r.code}`)
r = await appel('/suivis', { jeton: yao.jeton })
dire(r.code === 200 && r.corps?.length === 0, 'Yao ne suit plus personne')

console.log()
if (rouges) { console.log(`❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log('✅ Les abonnés et les offres d’emploi tiennent.')
process.exit(0)
