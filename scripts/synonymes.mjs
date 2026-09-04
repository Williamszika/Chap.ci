// =============================================================================
//  LE GÉNÉRATEUR DU DICTIONNAIRE DE LA RECHERCHE — chantier 3 du 04/09/2026.
//
//      npm run synonymes        (lancé aussi avant chaque build)
//
//  Une seule source, src/data/synonymes.json ; trois sorties qui disent la
//  même chose, parce que la recherche se fait à TROIS endroits — le site
//  (TypeScript), l'application (Dart) et le serveur (PHP, pour les alertes) —
//  et qu'un dictionnaire recopié à la main diverge au premier mot ajouté :
//
//    src/data/synonymes.ts
//    flutter_app/lib/data/synonymes.dart
//    server/index.php  — entre les deux repères « SYNONYMES (généré) »
//
//  Chaque entrée est NORMALISÉE ici comme le sera le texte au moment de la
//  recherche (minuscules, sans accents, lettres et chiffres seulement) : la
//  clé d'un groupe est sa première entrée, soudée (« machine à laver » →
//  « machinealaver »), et une locution de plusieurs mots est remplacée par
//  cette clé dans le texte AVANT le découpage en mots — des deux côtés.
//
//  Le script refuse d'écrire si un mot appartient à deux groupes : une telle
//  ambiguïté rapprocherait deux familles sans qu'on l'ait voulu.
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = JSON.parse(readFileSync(join(racine, 'src/data/synonymes.json'), 'utf8'))

/** La même normalisation que src/lib/recherche.ts, lib/recherche.dart et recherche_normaliser(). */
const normaliser = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, ' ').trim()

const groupes = new Map() // mot normalisé -> clé du groupe
const locutions = []      // [locution normalisée, clé]
const origine = new Map() // mot -> première entrée du groupe (pour le message d'erreur)
for (const groupe of source.groupes) {
  const cle = normaliser(groupe[0]).replace(/ /g, '')
  if (!cle) throw new Error(`groupe vide : ${JSON.stringify(groupe)}`)
  for (const brut of groupe) {
    const n = normaliser(brut)
    if (!n) continue
    const mot = n.replace(/ /g, '')
    if (groupes.has(mot) && groupes.get(mot) !== cle) {
      throw new Error(`« ${brut} » est dans deux groupes : « ${origine.get(mot)} » et « ${groupe[0]} ». Choisissez.`)
    }
    groupes.set(mot, cle)
    origine.set(mot, groupe[0])
    if (n.includes(' ')) locutions.push([n, mot])
  }
}
// Les locutions les plus longues d'abord : « bouteille de gaz » avant « gaz ».
locutions.sort((a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0]))
const entrees = [...groupes.entries()].sort((a, b) => a[0].localeCompare(b[0]))

const entete = (c) => `${c} GÉNÉRÉ par scripts/synonymes.mjs depuis src/data/synonymes.json — NE PAS MODIFIER À LA MAIN.
${c} ${source.groupes.length} groupes, ${entrees.length} mots, ${locutions.length} locutions. Relancez : npm run synonymes`

// ── TypeScript ──────────────────────────────────────────────────────────────
const ts = `${entete('//')}

/** Locution normalisée → mot soudé, les plus longues d'abord. */
export const LOCUTIONS: readonly (readonly [string, string])[] = [
${locutions.map(([l, m]) => `  [${JSON.stringify(l)}, ${JSON.stringify(m)}],`).join('\n')}
]

/** Mot normalisé → clé de son groupe de synonymes. */
export const GROUPES: Readonly<Record<string, string>> = {
${entrees.map(([m, c]) => `  ${JSON.stringify(m)}: ${JSON.stringify(c)},`).join('\n')}
}
`
writeFileSync(join(racine, 'src/data/synonymes.ts'), ts)

// ── Dart ────────────────────────────────────────────────────────────────────
const dq = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$')}'`
const dart = `${entete('//')}

/// Locution normalisée → mot soudé, les plus longues d'abord.
const List<List<String>> locutionsRecherche = [
${locutions.map(([l, m]) => `  [${dq(l)}, ${dq(m)}],`).join('\n')}
];

/// Mot normalisé → clé de son groupe de synonymes.
const Map<String, String> groupesRecherche = {
${entrees.map(([m, c]) => `  ${dq(m)}: ${dq(c)},`).join('\n')}
};
`
writeFileSync(join(racine, 'flutter_app/lib/data/synonymes.dart'), dart)

// ── PHP, dans server/index.php entre les repères ────────────────────────────
const pq = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const php = `// ── SYNONYMES (généré) ── ${entete('//').split('\n')[0].slice(3)}
// ${entete('//').split('\n')[1].slice(3)}
const RECHERCHE_LOCUTIONS = [
${locutions.map(([l, m]) => `  [${pq(l)}, ${pq(m)}],`).join('\n')}
];
const RECHERCHE_GROUPES = [
${entrees.map(([m, c]) => `  ${pq(m)} => ${pq(c)},`).join('\n')}
];
// ── FIN SYNONYMES (généré) ──`
const cheminPhp = join(racine, 'server/index.php')
const avant = readFileSync(cheminPhp, 'utf8')
const debut = avant.indexOf('// ── SYNONYMES (généré) ──')
const fin = avant.indexOf('// ── FIN SYNONYMES (généré) ──')
if (debut === -1 || fin === -1 || fin < debut) throw new Error('repères SYNONYMES introuvables dans server/index.php')
const apres = avant.slice(0, debut) + php + avant.slice(fin + '// ── FIN SYNONYMES (généré) ──'.length)
if (apres !== avant) writeFileSync(cheminPhp, apres)

console.log(`✅ synonymes : ${source.groupes.length} groupes, ${entrees.length} mots, ${locutions.length} locutions → TypeScript, Dart, PHP`)
