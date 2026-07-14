// =============================================================================
//  Contrôle de santé du site Chap.ci — utilisé par la routine quotidienne.
//  Usage :  node monitoring/check-sante.mjs [https://chap.ci]
//  Vérifie : accueil, API, certificat SSL, sitemap, robots, temps de réponse.
//  Sortie : résumé lisible + JSON (dernière ligne) ; code retour 1 si problème.
//  Dépendances : AUCUNE (Node ≥ 18 + curl — curl respecte HTTPS_PROXY, contrairement
//  au fetch de Node, indispensable dans les environnements derrière un proxy).
// =============================================================================
import { connect } from 'node:tls'
import { execFileSync } from 'node:child_process'

const SITE = (process.argv[2] || 'https://chap.ci').replace(/\/$/, '')
const host = new URL(SITE).hostname
const checks = []
const add = (name, ok, detail, warn = false) => {
  checks.push({ name, ok, warn, detail })
  console.log(`${ok ? (warn ? '🟠' : '✅') : '❌'} ${name} — ${detail}`)
}

// HTTP via curl (suit les redirections, honore le proxy de l'environnement).
async function timedFetch(url) {
  const out = execFileSync('curl', ['-sS', '-L', '--max-time', '20', '-w', '\n__META__ %{http_code} %{time_total}', url], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const i = out.lastIndexOf('\n__META__ ')
  const [code, secs] = out.slice(i + 10).trim().split(' ')
  return { res: { status: parseInt(code, 10) || 0 }, text: out.slice(0, i), ms: Math.round(parseFloat(secs) * 1000) }
}

// 1) Page d'accueil
try {
  const { res, text, ms } = await timedFetch(SITE + '/')
  const okStatus = res.status === 200
  const okContent = /chap\.ci|Chap\.ci|id="root"/i.test(text)
  add('Accueil', okStatus && okContent, `HTTP ${res.status} en ${ms} ms${okContent ? '' : ' — contenu inattendu'}`, ms > 4000)
  const m = /src="\/(assets\/index-[A-Za-z0-9_-]+\.js)"/.exec(text)
  if (m) {
    const a = await timedFetch(SITE + '/' + m[1])
    add('Bundle JS', a.res.status === 200 && a.text.length > 10000, `${m[1]} — HTTP ${a.res.status}, ${Math.round(a.text.length / 1024)} Ko en ${a.ms} ms`)
  } else {
    add('Bundle JS', false, 'référence du bundle introuvable dans index.html')
  }
} catch (e) { add('Accueil', false, `inaccessible : ${e.message}`) }

// 2) API
try {
  const { res, text, ms } = await timedFetch(SITE + '/api/health')
  let ok = false, detail = `HTTP ${res.status} en ${ms} ms`
  try { const j = JSON.parse(text); ok = res.status === 200 && j.ok === true; if (j.php) detail += ` — PHP ${j.php}` } catch { detail += ' — réponse non-JSON' }
  add('API /health', ok, detail, ms > 3000)
} catch (e) { add('API /health', false, `inaccessible : ${e.message}`) }

// 3) API annonces (publique)
try {
  const { res, text, ms } = await timedFetch(SITE + '/api/listings')
  let n = -1
  try { const j = JSON.parse(text); n = Array.isArray(j) ? j.length : -1 } catch {}
  add('API /listings', res.status === 200 && n >= 0, `HTTP ${res.status}, ${n >= 0 ? n + ' annonce(s)' : 'réponse invalide'} en ${ms} ms`, ms > 4000)
} catch (e) { add('API /listings', false, `inaccessible : ${e.message}`) }

// 4) Certificat SSL (jours restants)
try {
  const days = await new Promise((resolve, reject) => {
    const sock = connect({ host, port: 443, servername: host, timeout: 15000 }, () => {
      const cert = sock.getPeerCertificate()
      sock.end()
      if (!cert || !cert.valid_to) return reject(new Error('certificat illisible'))
      resolve(Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / 86400000))
    })
    sock.on('error', reject)
    sock.on('timeout', () => { sock.destroy(); reject(new Error('timeout TLS')) })
  })
  add('Certificat SSL', days > 7, `expire dans ${days} jour(s)`, days <= 21)
} catch (e) { add('Certificat SSL', false, `vérification impossible : ${e.message}`) }

// 5) Sitemap + robots (référencement Google)
try {
  const s = await timedFetch(SITE + '/sitemap.xml')
  add('Sitemap', s.res.status === 200 && s.text.includes('<urlset'), `HTTP ${s.res.status}`)
} catch (e) { add('Sitemap', false, e.message) }
try {
  const r = await timedFetch(SITE + '/robots.txt')
  add('Robots.txt', r.res.status === 200, `HTTP ${r.res.status}`)
} catch (e) { add('Robots.txt', false, e.message) }

// ---- Verdict ----------------------------------------------------------------
const failed = checks.filter((c) => !c.ok)
const warns = checks.filter((c) => c.ok && c.warn)
console.log('')
if (failed.length) console.log(`🚨 PROBLÈME : ${failed.length} contrôle(s) en échec — ${failed.map((c) => c.name).join(', ')}`)
else if (warns.length) console.log(`🟠 OK avec avertissement(s) : ${warns.map((c) => `${c.name} (${c.detail})`).join(' · ')}`)
else console.log('✅ TOUT VA BIEN — site, API, SSL et référencement opérationnels.')
console.log(JSON.stringify({ site: SITE, ok: failed.length === 0, failed: failed.map((c) => ({ name: c.name, detail: c.detail })), warnings: warns.map((c) => c.name), checks: checks.length }))
process.exit(failed.length ? 1 : 0)
