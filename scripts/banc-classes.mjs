// =============================================================================
//  BANC DES CLASSES DE COULEUR — une classe Tailwind qui n'existe pas ne se
//  voit pas. (16/09/2026)
//
//      npm run banc:classes
//
//  POURQUOI CE BANC EXISTE
//
//  Le 16/09/2026 au matin, l'écran d'encaissement des abonnements Pro est parti
//  en production avec `bg-chap-orange` sur ses DEUX boutons. Cette couleur
//  n'existe pas : la palette du dépôt s'appelle `action`, pas `chap`. Tailwind
//  n'a donc généré AUCUNE règle, et les boutons étaient du texte blanc sur fond
//  blanc — invisibles. Y compris le bouton « Encaisser », c'est-à-dire la seule
//  raison d'être de tout l'écran.
//
//  ⚠️ CE QUI REND CETTE FAUTE SI FACILE : elle ne casse RIEN. Pas d'erreur de
//  compilation, pas d'avertissement, pas de test au rouge. `tsc` ne lit pas les
//  chaînes de caractères des `className`. Le serveur répondait juste, les 22
//  vérifications du banc d'abonnement étaient vertes — et l'écran était
//  inutilisable. Le banc testait la moitié de la route qui marchait, exactement
//  comme `banc:video` en son temps.
//
//  MÉTHODE : le banc ne DEVINE pas quels suffixes sont des couleurs — une
//  première version s'y est essayée et prenait `bg-gradient-to-br` pour une
//  faute. Il compare au CSS RÉELLEMENT COMPILÉ, c'est-à-dire à la preuve même
//  qui a servi à établir le bug : si Tailwind n'a émis aucune règle pour une
//  classe présente dans `src/`, cette classe ne peint rien.
//
//  Demande donc un `npm run build` préalable. C'est le prix d'une vérification
//  qui porte sur ce que le navigateur reçoit, et non sur ce qu'on croit avoir
//  écrit.
// =============================================================================
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const require_ = createRequire(import.meta.url)

// ── Les couleurs qui existent vraiment ──────────────────────────────────────
const config = (await import(join(racine, 'tailwind.config.js'))).default
const perso = Object.keys(config?.theme?.extend?.colors ?? {})
const defaut = Object.keys(require_('tailwindcss/colors'))
// Mots-clés toujours valides, qui ne sont pas des couleurs de palette.
const mots = ['transparent', 'current', 'inherit', 'white', 'black', 'auto', 'none']
const connues = new Set([...perso, ...defaut, ...mots])

// ── Le CSS réellement compilé : la seule preuve qui vaille ──────────────────
const cssDir = join(racine, 'dist/assets')
let css = ''
try {
  for (const f of readdirSync(cssDir)) if (f.endsWith('.css')) css += readFileSync(join(cssDir, f), 'utf8')
} catch { /* dist absent : traité juste en dessous */ }
if (!css) {
  console.error('⛔ Aucun CSS compilé dans dist/assets. Construisez d’abord : npm run build')
  console.error('   Ce banc compare au CSS que le navigateur reçoit ; sans lui il ne prouve rien.')
  process.exit(1)
}
/* ⚠️ UNE VARIANTE DÉPLACE LE POINT. `hover:bg-cream-50` s'écrit
 * `.hover\:bg-cream-50:hover` dans le CSS : le nom n'y est PAS précédé d'un
 * point mais d'un deux-points échappé. Une première version cherchait
 * « .bg-cream-50 » et déclarait fautives quatre classes parfaitement valides.
 * On accepte donc les deux amorces. */
const emise = (classe) => css.includes('.' + classe) || css.includes('\\:' + classe)

// ── Les préfixes de classe qui attendent une couleur ────────────────────────
const prefixes = ['bg', 'text', 'border', 'ring', 'from', 'to', 'via', 'fill', 'stroke',
                  'divide', 'outline', 'decoration', 'caret', 'accent', 'placeholder', 'shadow']
const motif = new RegExp(`\\b(?:${prefixes.join('|')})-[a-z0-9][a-z0-9-]*\\b`, 'g')

// ── Le balayage ─────────────────────────────────────────────────────────────
function fichiers(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) out.push(...fichiers(p))
    // Seuls les .tsx portent des `className`. `src/lib/` fabrique des SVG
    // (`stroke-width`, `text-anchor` y sont des ATTRIBUTS, pas des classes) et
    // `src/i18n/` contient de la prose où « to-hand » est un mot anglais.
    else if (/\.tsx$/.test(e) && !p.includes('/i18n/')) out.push(p)
  }
  return out
}

/* Une classe n'est retenue que si elle est écrite ENTIÈRE dans le source. Une
 * classe composée à l'exécution (`bg-${ton}-600`) n'est de toute façon pas vue
 * par Tailwind, mais elle ne se lit pas non plus ici : on ne la signale pas,
 * faute de pouvoir la distinguer d'un fragment. */
const candidates = (texte) => [...new Set((texte.match(motif) ?? []))]

/* ── DETTE DÉCLARÉE AU 16/09/2026 ────────────────────────────────────────────
 * Sept classes mortes trouvées en écrivant ce banc, toutes ANTÉRIEURES au bug
 * des boutons Pro. Elles ne peignent rien, sans erreur :
 *
 *   `bg-cream-50`   la palette `cream` n'a que DEFAULT, 100 et 200 — pas de 50.
 *                   Trois effets de survol ne se produisent donc jamais.
 *   `text-shadow`   n'est PAS une utilité Tailwind, et `plugins: []` est vide.
 *                   Trois ombres de texte n'existent pas.
 *   `ring-dashed`   n'existe pas non plus (`border-dashed` oui, `ring-` non).
 *
 * ⚠️ ELLES SONT ICI POUR ÊTRE CORRIGÉES, PAS POUR ÊTRE OUBLIÉES. Le remède
 * demande une décision de 🎨 L'Atelier — quelle nuance de crème, quelle ombre —
 * et non une supposition du Développement. Le banc les tolère pour pouvoir
 * garder le code NEUF dès aujourd'hui ; il refusera toute nouvelle venue.
 * Une ligne retirée de cette liste ne doit jamais l'être sans que la classe
 * ait disparu du code. */
const DETTE = new Set(['bg-cream-50', 'text-shadow', 'ring-dashed'])

let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

console.log('\nBANC DES CLASSES DE COULEUR')
console.log('─'.repeat(72))
console.log(`Palette du dépôt : ${perso.join(', ')}`)
console.log(`CSS compilé      : ${css.length} caractères`)
console.log()

console.log('── ⚠️ Le banc sait-il voir la faute ? (sinon il ne prouve rien)')
// Le témoin est la faute EXACTE du 16/09. Si ce bras passe au vert, le banc est
// cassé et son silence sur le reste ne vaut rien.
dire(!emise('bg-chap-orange'), 'aucune règle CSS pour « bg-chap-orange » (la faute du 16/09)')
dire(emise('bg-action-600'), 'mais il en existe une pour « bg-action-600 » (le correctif)')
dire(emise('bg-gradient-to-br') || emise('bg-gradient'),
  'et il ne prend pas « bg-gradient-to-br » pour une faute')

console.log('\n── Le code du dépôt')
const tous = fichiers(join(racine, 'src'))
const fautes = []
const dette = []
for (const f of tous) {
  for (const c of candidates(readFileSync(f, 'utf8'))) {
    if (emise(c)) continue
    if (DETTE.has(c)) { dette.push(`${f.replace(racine + '/', '')} → ${c}`); continue }
    fautes.push(`${f.replace(racine + '/', '')} → ${c}`)
  }
}
dire(fautes.length === 0, `${tous.length} fichiers balayés, aucune classe sans style NEUVE`,
  fautes.length ? `${fautes.length} trouvée(s)` : '')
fautes.slice(0, 25).forEach((x) => console.log('     ' + x))
if (dette.length) {
  console.log(`\n  ⚠️  ${dette.length} classe(s) mortes déjà connues, en attente d’une décision de 🎨 L’Atelier :`)
  dette.forEach((x) => console.log('     ' + x))
}

console.log('\n' + '═'.repeat(72))
if (rouges) {
  console.log('⛔ Une classe écrite dans src/ ne produit AUCUNE règle CSS : elle ne peint')
  console.log('   rien, sans la moindre erreur de compilation. C’est ainsi que les deux')
  console.log('   boutons « Encaisser » sont partis blancs sur blanc le 16/09.')
  console.log('   Corrigez le nom, ou déclarez la couleur dans tailwind.config.js.')
  process.exit(1)
}
console.log('✅ Toutes les classes écrites dans src/ produisent bien une règle CSS.')
