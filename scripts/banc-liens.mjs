#!/usr/bin/env node
/* BANC DES LIENS INTERNES — un lien qui ne mène nulle part (19/09/2026)
 * ---------------------------------------------------------------------------
 * Demandé par le Patron : « répare les liens cassés ».
 *
 * ⚠️ CE BANC NE TOUCHE PAS AU SERVEUR, ET C'EST DÉLIBÉRÉ. Parcourir le site en
 * ligne pour suivre chaque lien, c'est des centaines de requêtes — précisément
 * ce que l'anti-robot de LiteSpeed punit, et il nous a déjà refusé une requête
 * le 18/09. On compare donc les liens ÉCRITS dans `src/` aux routes DÉCLARÉES
 * dans `App.tsx`. C'est local, instantané, et ça attrape la faute la plus
 * fréquente : un lien vers une page qui n'existe pas (ou plus).
 *
 * CE QUE CE BANC NE VOIT PAS, et qu'il faut savoir avant de le croire :
 *   · les liens EXTERNES (vers un autre site) — il faudrait les appeler ;
 *   · les liens construits à l'exécution (`to={'/annonce/' + id}`) — ils ne
 *     sont pas écrits en entier dans le code, donc illisibles ici ;
 *   · une page qui existe mais affiche une erreur — c'est le travail de
 *     `banc:front`, pas celui-ci.
 *
 * Un banc qui ne dit pas ce qu'il ignore laisse croire qu'il a tout vu.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')

// ── Les routes qui existent vraiment ────────────────────────────────────────
const app = readFileSync(join(racine, 'src/App.tsx'), 'utf8')
const routes = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1])
if (routes.length < 10) {
  console.error('⛔ Moins de dix routes trouvées dans App.tsx : le motif de lecture a changé.')
  console.error('   Ce banc ne peut rien affirmer dans cet état — corrigez-le avant de le croire.')
  process.exit(1)
}

/** Une route `/messages/:id` accepte `/messages/n-importe-quoi`. */
const motifRoute = (r) =>
  new RegExp('^' + r.split('/').map((s) => (s.startsWith(':') ? '[^/]+' : s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('/') + '$')
const connues = routes.filter((r) => r !== '*').map(motifRoute)
const existe = (chemin) => connues.some((re) => re.test(chemin))

// ── Les liens écrits dans le code ───────────────────────────────────────────
function fichiers(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) out.push(...fichiers(p))
    else if (/\.(tsx?|ts)$/.test(e)) out.push(p)
  }
  return out
}

/* DEUX FORMES, et oublier la seconde rendait ce banc aveugle là où ça compte.
 *
 *   1. `to="/x"` / `href="/x"`   — dans le JSX des composants ;
 *   2. `to: '/x'`                — dans les fichiers de DONNÉES, notamment
 *      `src/data/footerLinks.ts`, la source unique du pied de page ET de la
 *      page « Plan du site ».
 *
 * La première version de ce banc ne lisait que la forme 1 et annonçait
 * fièrement « 67 liens, tous valides » — sans avoir regardé une seule ligne du
 * pied de page, qui est pourtant sur TOUTES les pages du site. Un motif qui a
 * l'air complet peut n'en couvrir que la moitié.
 *
 * On ne retient que les chaînes ENTIÈRES : `to={'/annonce/' + id}` n'est pas
 * lisible ici, et le signaler serait une fausse alerte. */
const motifLien = /\b(?:to|href)\s*[=:]\s*["'](\/[^"'{}\s]*)["']/g

let rouges = 0
const dire = (ok, texte, detail = '') => { if (!ok) rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }

console.log('\nBANC DES LIENS INTERNES')
console.log('─'.repeat(72))
console.log(`${routes.length} routes déclarées dans App.tsx`)

console.log('\n── ⚠️ Le banc sait-il voir un lien mort ? (sinon il ne prouve rien)')
dire(!existe('/cette-page-nexiste-pas'), 'une adresse inventée est bien signalée comme inconnue')
dire(existe('/explorer'), 'et une vraie route est bien reconnue')
dire(existe('/annonce/abc-123'), 'y compris une route à paramètre (/annonce/:id)')

console.log('\n── Les liens écrits dans src/')
const morts = []
let total = 0
for (const f of fichiers(join(racine, 'src'))) {
  const t = readFileSync(f, 'utf8')
  for (const m of t.matchAll(motifLien)) {
    // On ignore l'ancre pure (#…) et les ressources (.png, .js…), qui ne sont
    // pas des routes de l'application.
    const lien = m[1].split('?')[0].split('#')[0]
    if (lien === '' || /\.[a-z0-9]{2,5}$/i.test(lien)) continue
    total++
    if (!existe(lien)) {
      morts.push(`${f.replace(racine + '/', '')} → ${lien}`)
    }
  }
}
dire(morts.length === 0, `${total} liens internes écrits en clair, tous vers une route existante`,
  morts.length ? `${morts.length} mort(s)` : '')
;[...new Set(morts)].forEach((x) => console.log('     ' + x))

console.log('\n' + '═'.repeat(72))
console.log('Non couvert par ce banc : les liens externes, ceux construits à')
console.log('l’exécution, et les pages qui existent mais affichent une erreur.')
if (rouges) {
  console.log('\n⛔ Un lien mène vers une page qui n’existe pas. Depuis le 18/09 elle')
  console.log('   affiche « Cette page n’existe pas » — honnête, mais c’est une')
  console.log('   impasse : corrigez le lien, ou déclarez la route.')
  process.exit(1)
}
console.log('\n✅ Aucun lien interne écrit en clair ne mène dans le vide.')
