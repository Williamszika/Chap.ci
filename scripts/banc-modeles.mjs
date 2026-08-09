// Banc léger des modèles de message : le tableau est de la donnée pure
// (fonctions fléchées + gabarits), on l'extrait de AdminDashboard.tsx et on
// l'exécute. On vérifie qu'aucun modèle n'est cassé et que le nouveau tient.
import { readFileSync } from 'node:fs'
const src = readFileSync('src/pages/AdminDashboard.tsx', 'utf8')

// Découpe du littéral, de « = [ » jusqu'au « ] » de même niveau.
const start = src.indexOf('const MODELES_MESSAGE')
const eq = src.indexOf('= [', start); const open = src.indexOf('[', eq)
let depth = 0, end = -1
for (let i = open; i < src.length; i++) {
  const c = src[i]
  if (c === '[') depth++
  else if (c === ']') { depth--; if (depth === 0) { end = i; break } }
}
const literal = src.slice(open, end + 1)
const MODELES = eval('(' + literal + ')')   // données pures, pas de JSX

const vert = '\x1b[32m', rouge = '\x1b[31m', zero = '\x1b[0m'
let echecs = 0
const ok = (q, v) => { if (v) console.log(`  ${vert}✓${zero} ${q}`); else { echecs++; console.log(`  ${rouge}✗${zero} ${q}`) } }

console.log('\nModèles de « Écrire à ce membre »\n')
ok(`les ${MODELES.length} modèles sont chargés`, MODELES.length >= 8)
ok('aucun identifiant en double', new Set(MODELES.map(m => m.id)).size === MODELES.length)

for (const m of MODELES) {
  const avec = m.texte('Awa'), sans = m.texte('')
  const bon = m.id && m.nom && m.sujet && typeof m.texte === 'function'
    && avec.includes('Awa') && !sans.includes('undefined') && !avec.includes('undefined')
    && avec.length > 40
  ok(`« ${m.nom} » : complet, prénom injecté, pas d'« undefined »`, bon)
}

const t = MODELES.find(m => m.id === 'titre')
ok('le NOUVEAU modèle « titre » existe', !!t)
if (t) {
  const txt = t.texte('Yao')
  ok('il parle bien du TITRE et de la DESCRIPTION', /TITRE/.test(txt) && /DESCRIPTION/.test(txt))
  ok('il dit de NE PAS supprimer (l’URL Google)', /rien à supprimer/i.test(txt) && /Google/.test(txt))
  ok('il donne le chemin exact Mon compte → Mes annonces → Modifier', /Mes annonces → Modifier/.test(txt))
}

console.log('')
if (echecs === 0) { console.log(`${vert}Banc vert — les modèles tiennent.${zero}\n`); process.exit(0) }
console.log(`${rouge}${echecs} en échec.${zero}\n`); process.exit(1)
