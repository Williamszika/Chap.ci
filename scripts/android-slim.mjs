// =============================================================================
//  Allège l'app Android : retire du paquet natif les fichiers web jamais
//  utilisés DANS l'app. À lancer APRÈS `cap sync android`.
//
//  Ce qu'on retire (et pourquoi c'est sûr) :
//  • assets/ort*  (~24,5 Mo) — moteur du détourage photo (@imgly). L'app le
//    télécharge à la demande depuis https://chap.ci/imgly/ (publicPath dans
//    PhotoEditor.tsx) : les copies embarquées ne sont JAMAIS lues.
//  • og/  (~3,8 Mo) — bannières d'aperçu social, servies aux robots
//    WhatsApp/Facebook par le site web uniquement. Aucune utilité dans l'app.
//
//  On GARDE : nsfw-*.js (modération anti-nudité locale — sécurité du contenu).
// =============================================================================
import { rmSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const PUB = 'android/app/src/main/assets/public'

function dirSize(p) {
  let total = 0
  if (!existsSync(p)) return 0
  for (const f of readdirSync(p, { recursive: true })) {
    const full = join(p, String(f))
    try { const s = statSync(full); if (s.isFile()) total += s.size } catch { /* */ }
  }
  return total
}

if (!existsSync(PUB)) {
  console.error(`✗ ${PUB} introuvable — lancer d'abord : npx cap sync android`)
  process.exit(1)
}

const before = dirSize(PUB)
let removed = 0

// 1) Bannières sociales (web uniquement)
const og = join(PUB, 'og')
if (existsSync(og)) { removed += dirSize(og); rmSync(og, { recursive: true, force: true }); console.log('− og/ (bannières sociales)') }

// 2) Moteur ort/wasm du détourage (chargé depuis chap.ci/imgly/ à l'exécution)
const assets = join(PUB, 'assets')
if (existsSync(assets)) {
  for (const f of readdirSync(assets)) {
    if (/^ort[.-]/i.test(f)) {
      const full = join(assets, f)
      removed += statSync(full).size
      rmSync(full, { force: true })
      console.log(`− assets/${f}`)
    }
  }
}

const after = dirSize(PUB)
const mo = (n) => (n / 1024 / 1024).toFixed(1) + ' Mo'
console.log(`\nApp web embarquée : ${mo(before)} → ${mo(after)}  (−${mo(removed)})`)
