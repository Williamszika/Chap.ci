// =============================================================================
//  Vérification POST-DÉPLOIEMENT — à lancer après avoir extrait le zip sur cPanel.
//  Usage :  node monitoring/verifier-deploiement.mjs [https://chap.ci]
//  1. Le site en ligne sert-il exactement le bundle du dernier build (dist/) ?
//  2. La santé générale est-elle bonne (accueil, API, SSL…) ?
//  Dépendances : AUCUNE (Node ≥ 18 + curl).
// =============================================================================
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = (process.argv[2] || 'https://chap.ci').replace(/\/$/, '')

function curl(url) {
  const out = execFileSync('curl', ['-sS', '-L', '--max-time', '20', '-w', '\n__META__ %{http_code}', url], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const i = out.lastIndexOf('\n__META__ ')
  return { status: parseInt(out.slice(i + 10).trim(), 10) || 0, text: out.slice(0, i) }
}
const bundleOf = (html) => (/src="\/(assets\/index-[A-Za-z0-9_-]+\.js)"/.exec(html) || [])[1] || null

console.log(`🔎 Vérification du déploiement sur ${SITE}\n`)
let problems = 0

// 1) Bundle local (dernier build) vs bundle en ligne
const localIndex = join(ROOT, 'dist/index.html')
if (!existsSync(localIndex)) {
  console.log('🟠 dist/index.html absent — lancez d\'abord le build (npm run build). Comparaison de version impossible.')
} else {
  const localBundle = bundleOf(readFileSync(localIndex, 'utf8'))
  const live = curl(SITE + '/')
  const liveBundle = bundleOf(live.text)
  if (live.status !== 200) { console.log(`❌ Accueil : HTTP ${live.status}`); problems++ }
  else if (!liveBundle) { console.log('❌ Accueil : bundle introuvable dans le HTML en ligne'); problems++ }
  else if (liveBundle === localBundle) {
    console.log(`✅ Version : le site en ligne sert bien le DERNIER build (${liveBundle})`)
  } else {
    console.log(`❌ Version : le site en ligne sert ${liveBundle}\n            mais le dernier build est  ${localBundle}\n            → le zip n'a pas été déployé (ou extrait au mauvais endroit).`)
    problems++
  }
}

// 2) L'API expose-t-elle les endpoints récents ? (cron/stats répond 403 sans clé
//    quand il existe, 404 s'il n'est pas encore déployé)
const stats = curl(SITE + '/api/cron/stats')
if (stats.status === 403) console.log('✅ API : endpoint cron/stats présent (le backend est à jour)')
else if (stats.status === 404) { console.log('❌ API : endpoint cron/stats absent → api/index.php n\'est pas à jour sur le serveur.'); problems++ }
else console.log(`🟠 API : cron/stats répond HTTP ${stats.status} (inattendu)`)

// 3) Santé générale (réutilise le contrôle quotidien)
console.log('')
const r = spawnSync('node', [join(ROOT, 'monitoring/check-sante.mjs'), SITE], { encoding: 'utf8' })
process.stdout.write(r.stdout || '')
if (r.status !== 0) problems++

console.log('')
if (problems === 0) console.log('🎉 DÉPLOIEMENT VÉRIFIÉ — le site en ligne correspond au dernier build et tout fonctionne.')
else console.log(`🚨 ${problems} problème(s) détecté(s) — voir ci-dessus.`)
process.exit(problems ? 1 : 0)
