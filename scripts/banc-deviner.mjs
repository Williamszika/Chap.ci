// =============================================================================
//  BANC DE « CHAP.CI ÉCRIT L'ANNONCE » — la route /annonce/deviner
//
//      npm run banc:deviner
//
//  Le vrai moteur coûte de l'argent et répond ce qu'il veut. Le banc lance un
//  FAUX moteur local, qui rend exactement la réponse qu'on lui dit de rendre,
//  dans la forme de l'API Messages. Ce qu'on vérifie, c'est donc le SERVEUR :
//
//   1. sans clé : GET dit « pas disponible », POST répond 503 ;
//   2. avec clé : une réponse propre est relue et rendue au client ;
//   3. une catégorie inventée par le moteur est effacée — jamais montrée ;
//   4. un refus du moteur (stop_reason = refusal) fait un 422, pas un plantage ;
//   5. du charabia (pas du JSON) fait un 502 propre ;
//   6. le quota par jour tient : au-delà, 429 ;
//   7. la requête envoyée au moteur porte bien la photo, le catalogue, le
//      schéma et l'en-tête de repli — lus dans ce que le faux moteur a reçu.
//
//  Pas un jeton dépensé.
// =============================================================================
import { execFileSync, spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

// ── Le faux moteur : il rend ce qu'on lui a dit, et garde ce qu'il a reçu ────
let reponseSuivante = null
let derniereRequete = null
const moteur = createServer((req, res) => {
  let corps = ''
  req.on('data', (c) => { corps += c })
  req.on('end', () => {
    derniereRequete = { entetes: req.headers, corps: JSON.parse(corps) }
    const r = reponseSuivante ?? { status: 200, body: {} }
    res.writeHead(r.status, { 'content-type': 'application/json' })
    res.end(typeof r.body === 'string' ? r.body : JSON.stringify(r.body))
  })
})
await new Promise((r) => moteur.listen(0, '127.0.0.1', r))
const MOTEUR = `http://127.0.0.1:${moteur.address().port}/v1/messages`
const messageAPI = (texte, stop = 'end_turn') => ({
  status: 200,
  body: { id: 'msg_banc', model: 'claude-banc', stop_reason: stop, content: [{ type: 'text', text: texte }] },
})

// ── Un serveur Chap.ci sur SQLite, lancé avec ou sans clé ───────────────────
const lancer = async (port, env) => {
  const D = join(tmpdir(), `chapci-banc-deviner-${port}`)
  rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
  const p = spawn('php', ['-S', `127.0.0.1:${port}`, 'index.php'], {
    cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
    env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: join(D, 'banc.sqlite'), CHAPCI_UPLOADS_DIR: join(D, 'uploads'), ...env },
  })
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) break } catch { /* pas encore */ }
    await new Promise((r) => setTimeout(r, 250))
  }
  const appel = async (chemin, { method = 'GET', body, jeton } = {}) => {
    const r = await fetch(`http://127.0.0.1:${port}${chemin}`, {
      method, headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const t = await r.text(); let corps = null; try { corps = JSON.parse(t) } catch { corps = t }
    return { code: r.status, corps }
  }
  const inscrire = async () => {
    const email = `vendeur-${Date.now()}-${port}@banc.ci`
    const r = await appel('/auth/signup', { method: 'POST', body: { full_name: 'Awa Banc', email, password: 'motdepasse-du-banc-9', consent: true } })
    execFileSync('php', ['-r', `$p = new PDO('sqlite:' . $argv[1]); $p->exec($argv[2]);`, '--', join(D, 'banc.sqlite'),
      `UPDATE users SET email_verified_at = '2026-09-01T00:00:00Z' WHERE email = '${email}'`])
    return r.corps?.token
  }
  return { appel, inscrire, fini: () => { try { process.kill(-p.pid) } catch { /* déjà parti */ } } }
}
// Un PNG 1×1 valide, en data-URI : ce que le client enverrait, en miniature.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const CATALOGUE = [
  { id: 'electronique', label: 'Électronique', sous: [{ id: 'telephones', label: 'Téléphones' }, { id: 'tablettes', label: 'Tablettes' }] },
  { id: 'maison', label: 'Maison', sous: [{ id: 'meubles', label: 'Meubles' }] },
]

// ── 1. Sans clé ─────────────────────────────────────────────────────────────
console.log('── Sans clé configurée ' + '─'.repeat(50))
const sans = await lancer(8196, { CHAPCI_VISION_CLE: '' })
let r = await sans.appel('/annonce/deviner')
dire(r.corps?.disponible === false, 'GET dit « pas disponible »', JSON.stringify(r.corps))
const jetonSans = await sans.inscrire()
r = await sans.appel('/annonce/deviner', { method: 'POST', jeton: jetonSans, body: { image: PNG, catalogue: CATALOGUE } })
dire(r.code === 503, 'POST répond 503, sans appeler quoi que ce soit', 'HTTP ' + r.code)
sans.fini()

// ── 2. Avec clé : le faux moteur ────────────────────────────────────────────
console.log('\n── Avec clé, moteur simulé ' + '─'.repeat(45))
const avec = await lancer(8195, { CHAPCI_VISION_CLE: 'cle-du-banc', CHAPCI_VISION_URL: MOTEUR, CHAPCI_VISION_QUOTA: '4' })
r = await avec.appel('/annonce/deviner')
dire(r.corps?.disponible === true, 'GET dit « disponible »')
const jeton = await avec.inscrire()
r = await avec.appel('/annonce/deviner', { method: 'POST', body: { image: PNG, catalogue: CATALOGUE } })
dire(r.code === 401 || r.code === 403, 'sans compte, refusé', 'HTTP ' + r.code)

reponseSuivante = messageAPI(JSON.stringify({
  titre: 'iPhone 13 Pro Max 256 Go', description: 'Très bon état, avec chargeur.', categoryId: 'electronique',
  subcategory: 'telephones', etat: 'occasion', caracteristiques: [{ cle: 'Marque', valeur: 'Apple' }, { cle: 'modele', valeur: 'iPhone 13 Pro Max' }], confiance: 92,
}))
r = await avec.appel('/annonce/deviner', { method: 'POST', jeton, body: { image: PNG, catalogue: CATALOGUE } })
dire(r.code === 200 && r.corps?.titre === 'iPhone 13 Pro Max 256 Go' && r.corps?.subcategory === 'telephones',
  'une réponse propre est rendue au client', `HTTP ${r.code} · ${r.corps?.titre} · ${r.corps?.categoryId}/${r.corps?.subcategory}`)
dire(r.corps?.caracteristiques?.marque === 'Apple', 'les clés des caractéristiques sont mises en minuscules', JSON.stringify(r.corps?.caracteristiques))
// 7. Ce que le moteur a reçu
const q = derniereRequete
dire(q?.entetes['x-api-key'] === 'cle-du-banc' && q?.entetes['anthropic-beta'] === 'server-side-fallback-2026-07-01',
  'la clé et l’en-tête de repli sont envoyés au moteur')
dire(q?.corps?.fallbacks === 'default' && q?.corps?.output_config?.format?.type === 'json_schema' && q?.corps?.output_config?.effort === 'low',
  'repli « default », schéma JSON, effort bas', JSON.stringify(q?.corps?.output_config?.effort))
dire(q?.corps?.messages?.[0]?.content?.[0]?.type === 'image' && q?.corps?.messages?.[0]?.content?.[0]?.source?.media_type === 'image/png',
  'la photo part en base64 avec son type')
dire(/telephones \(Téléphones\)/.test(q?.corps?.system ?? '') && /N'indique JAMAIS de prix/.test(q?.corps?.system ?? ''),
  'le catalogue est dans la consigne, et le prix en est banni')

// 3. Une catégorie inventée
reponseSuivante = messageAPI(JSON.stringify({ titre: 'Truc', description: 'd', categoryId: 'licornes', subcategory: 'roses', etat: 'neuf', caracteristiques: [], confiance: 80 }))
r = await avec.appel('/annonce/deviner', { method: 'POST', jeton, body: { image: PNG, catalogue: CATALOGUE } })
dire(r.code === 200 && r.corps?.categoryId === '' && r.corps?.subcategory === '', 'une catégorie inventée est effacée, le titre reste', `${r.corps?.categoryId}/${r.corps?.subcategory} · ${r.corps?.titre}`)

// 4. Un refus
reponseSuivante = messageAPI('', 'refusal')
r = await avec.appel('/annonce/deviner', { method: 'POST', jeton, body: { image: PNG, catalogue: CATALOGUE } })
dire(r.code === 422, 'un refus du moteur fait un 422 propre', 'HTTP ' + r.code)

// 5. Du charabia
reponseSuivante = messageAPI('voici votre annonce : blablabla')
r = await avec.appel('/annonce/deviner', { method: 'POST', jeton, body: { image: PNG, catalogue: CATALOGUE } })
dire(r.code === 502, 'du charabia fait un 502 propre', 'HTTP ' + r.code)

// 6. Le quota : 4 par jour ici — deux réussites ont déjà compté
console.log('\n── Le quota par jour ' + '─'.repeat(52))
reponseSuivante = messageAPI(JSON.stringify({ titre: 'x', description: 'd', categoryId: 'maison', subcategory: 'meubles', etat: 'neuf', caracteristiques: [], confiance: 50 }))
const codes = []
for (let i = 0; i < 4; i++) { r = await avec.appel('/annonce/deviner', { method: 'POST', jeton, body: { image: PNG, catalogue: CATALOGUE } }); codes.push(r.code) }
dire(codes.slice(0, 2).every((c) => c === 200) && codes.slice(2).every((c) => c === 429), 'deux passent encore, puis 429', codes.join(' '))

// ── Contre-épreuve : une « photo » qui n'en est pas une ─────────────────────
console.log('\n── Contre-épreuve ' + '─'.repeat(54))
r = await avec.appel('/annonce/deviner', { method: 'POST', jeton, body: { image: 'data:text/html;base64,PHNjcmlwdD4=', catalogue: CATALOGUE } })
dire(r.code === 400, 'un fichier qui n’est pas une image est refusé avant tout appel', 'HTTP ' + r.code)
avec.fini(); moteur.close()

console.log()
console.log(rouges ? `❌ ${rouges} contrôle(s) au rouge` : '✅ le serveur relit, vérifie, refuse et plafonne — sans un jeton dépensé')
process.exit(rouges ? 1 : 0)
