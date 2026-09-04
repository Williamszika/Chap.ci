// =============================================================================
//  BANC DU CONTRÔLE DES PHOTOS PAR LE MOTEUR — POST /photos/controle
//  (chantier 5 du 04/09/2026, « le poids sur 3G »).
//
//      npm run banc:controle
//
//  Un faux moteur de vision (le serveur reçoit un vrai appel HTTP, on lit ce
//  qu'il envoie et on lui répond ce qu'on veut), un serveur Chap.ci SANS clé,
//  un AVEC. Le banc vérifie :
//    1. sans clé, 503 — le site se rabat alors sur son modèle local ;
//    2. avec clé, un lot de trois photos part en UN appel, avec ses trois
//       images dans l'ordre, et le verdict revient photo par photo ;
//    3. une photo dont le moteur ne dit rien passe (verdict « ok ») ;
//    4. un refus du moteur de regarder le lot fait 422, pas 502 ;
//    5. neuf photos, ou une photo illisible : 400 sans appel au moteur ;
//    6. le quota du jour ferme la porte (429).
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

// ── Le faux moteur ───────────────────────────────────────────────────────────
let reponseSuivante = null
let derniereRequete = null
let appelsMoteur = 0
const moteur = createServer((req, res) => {
  let corps = ''
  req.on('data', (c) => { corps += c })
  req.on('end', () => {
    appelsMoteur++
    derniereRequete = { entetes: req.headers, corps: JSON.parse(corps) }
    const r = reponseSuivante ?? { status: 200, body: {} }
    res.writeHead(r.status, { 'content-type': 'application/json' })
    res.end(typeof r.body === 'string' ? r.body : JSON.stringify(r.body))
  })
})
await new Promise((r) => moteur.listen(0, '127.0.0.1', r))
const MOTEUR = `http://127.0.0.1:${moteur.address().port}/v1/messages`
const messageAPI = (obj, stop = 'end_turn') => ({
  status: 200,
  body: { id: 'msg_banc', model: 'claude-banc', stop_reason: stop, content: [{ type: 'text', text: JSON.stringify(obj) }] },
})

// ── Un serveur Chap.ci sur SQLite ────────────────────────────────────────────
const serveurs = []
const lancer = async (port, env) => {
  const D = join(tmpdir(), `chapci-banc-controle-${port}`)
  rmSync(D, { recursive: true, force: true }); mkdirSync(join(D, 'uploads'), { recursive: true })
  const p = spawn('php', ['-S', `127.0.0.1:${port}`, 'index.php'], {
    cwd: join(racine, 'server'), stdio: 'ignore', detached: true,
    env: { ...process.env, CHAPCI_DB_DRIVER: 'sqlite', CHAPCI_SQLITE: join(D, 'banc.sqlite'), CHAPCI_UPLOADS_DIR: join(D, 'uploads'), ...env },
  })
  p.unref(); serveurs.push(p)
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
  return { appel, inscrire }
}
const fini = () => { for (const p of serveurs) { try { process.kill(p.pid) } catch { /* déjà parti */ } try { process.kill(-p.pid) } catch { /* déjà parti */ } } moteur.close() }
process.on('exit', fini)
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { fini(); process.exit(130) })

// Un JPEG minuscule mais valide pour le motif du serveur (il ne décode pas).
const photo = (n) => `data:image/jpeg;base64,${Buffer.from(`photo-${n}-`.repeat(40)).toString('base64')}`

console.log('── Sans clé ' + '─'.repeat(60))
const sans = await lancer(8205, { CHAPCI_VISION_CLE: '' })
const jetonSans = await sans.inscrire()
let r = await sans.appel('/photos/controle', { method: 'POST', jeton: jetonSans, body: { images: [photo(1)] } })
dire(r.code === 503, 'sans clé, le contrôle répond 503 — le site garde son modèle local', `HTTP ${r.code}`)
r = await sans.appel('/photos/controle', { method: 'POST', body: { images: [photo(1)] } })
dire(r.code === 401, 'sans compte, 401', `HTTP ${r.code}`)

console.log('\n── Avec clé ' + '─'.repeat(60))
const avec = await lancer(8206, { CHAPCI_VISION_CLE: 'cle-du-banc', CHAPCI_VISION_URL: MOTEUR, CHAPCI_VISION_QUOTA: '4' })
const jeton = await avec.inscrire()
reponseSuivante = messageAPI({ photos: [{ index: 0, refusee: false, motif: 'ok' }, { index: 1, refusee: true, motif: 'nudite' }] })
r = await avec.appel('/photos/controle', { method: 'POST', jeton, body: { images: [photo(1), photo(2), photo(3)] } })
dire(r.code === 200, 'un lot de trois photos part et revient', `HTTP ${r.code} ${JSON.stringify(r.corps).slice(0, 160)}`)
const v = r.corps?.verdicts ?? []
dire(v.length === 3 && v[0]?.refusee === false && v[1]?.refusee === true && v[1]?.motif === 'nudite', 'le verdict revient photo par photo, dans l’ordre', JSON.stringify(v))
dire(v[2]?.refusee === false && v[2]?.motif === 'ok', 'une photo dont le moteur ne dit rien passe', JSON.stringify(v[2]))
dire(appelsMoteur === 1, 'UN seul appel au moteur pour les trois photos', `${appelsMoteur}`)
const contenu = derniereRequete?.corps?.messages?.[0]?.content ?? []
const images = contenu.filter((b) => b.type === 'image')
dire(images.length === 3 && images[0].source?.data === photo(1).split(',')[1], 'les trois images sont dans l’appel, la première en premier', `${images.length} images`)
dire(derniereRequete?.corps?.output_config?.format?.type === 'json_schema' && derniereRequete?.entetes['x-api-key'] === 'cle-du-banc', 'schéma JSON exigé, clé transmise')
dire(/maillot de bain/i.test(derniereRequete?.corps?.system ?? '') && /mineur/i.test(derniereRequete?.corps?.system ?? ''), 'la consigne dit ce qui passe (mode) et ce qui ne passe pas (mineur)')

reponseSuivante = { status: 200, body: { id: 'x', model: 'claude-banc', stop_reason: 'refusal', content: [] } }
r = await avec.appel('/photos/controle', { method: 'POST', jeton, body: { images: [photo(4)] } })
dire(r.code === 422, 'le moteur refuse de regarder : 422, le lot est refusé', `HTTP ${r.code}`)

r = await avec.appel('/photos/controle', { method: 'POST', jeton, body: { images: Array.from({ length: 9 }, (_, i) => photo(i)) } })
dire(r.code === 400, 'neuf photos : 400', `HTTP ${r.code}`)
r = await avec.appel('/photos/controle', { method: 'POST', jeton, body: { images: [photo(1), 'data:text/plain;base64,QUJD'] } })
dire(r.code === 400, 'une photo illisible : 400', `HTTP ${r.code}`)
r = await avec.appel('/photos/controle', { method: 'POST', jeton, body: { images: [] } })
dire(r.code === 400, 'aucune photo : 400', `HTTP ${r.code}`)
const appelsAvant = appelsMoteur
dire(appelsAvant === 2, 'les refus de forme n’ont pas appelé le moteur', `${appelsAvant} appels`)

reponseSuivante = messageAPI({ photos: [] })
r = await avec.appel('/photos/controle', { method: 'POST', jeton, body: { images: [photo(5)] } })
dire(r.code === 200 && r.corps?.verdicts?.[0]?.refusee === false, 'une réponse vide du moteur laisse passer', `HTTP ${r.code}`)
reponseSuivante = { status: 500, body: 'panne' }
r = await avec.appel('/photos/controle', { method: 'POST', jeton, body: { images: [photo(6)] } })
dire(r.code === 502, 'le moteur en panne : 502 — le site se rabat sur son modèle local', `HTTP ${r.code}`)
reponseSuivante = messageAPI({ photos: [] })
r = await avec.appel('/photos/controle', { method: 'POST', jeton, body: { images: [photo(7)] } })
dire(r.code === 429, 'le quota du jour (4) ferme la porte : 429', `HTTP ${r.code}`)

console.log()
if (rouges) { console.log(`❌ ${rouges} contrôle(s) rouge(s).`); process.exit(1) }
console.log('✅ Le contrôle des photos par le moteur tient.')
process.exit(0)
