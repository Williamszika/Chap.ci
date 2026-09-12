// =============================================================================
//  LE REGISTRE D'ACTIVITÉ — quand chaque chose a été faite, lu dans git.
//
//      npm run registre
//
//  POURQUOI IL SE GÉNÈRE, ET NE S'ÉCRIT PAS À LA MAIN.
//
//  Le Patron a demandé un registre des heures et des jours. Un registre tenu à
//  la main ment au bout d'une semaine : on oublie une journée, on arrondit une
//  heure, et il devient un document qu'on ne peut plus opposer à personne.
//
//  Or ce dépôt porte déjà la vérité horodatée : chaque commit a sa date, à la
//  seconde, et elle n'est pas réécrivable sans laisser de trace. Le registre
//  LIT cette source au lieu de la recopier. C'est la règle de `CLAUDE.md` —
//  « une vérification doit pouvoir échouer… faites-lui lire l'état réel ».
//
//  CE QU'IL NE SAIT PAS, ET QU'IL DIT :
//  le travail du Patron lui-même — un zip extrait, une clé changée dans cPanel,
//  un fichier téléversé — ne laisse aucune trace dans git. D'où la partie
//  MANUELLE, au-dessus des marques, que ce script ne touche jamais.
//
//  L'HEURE. Les commits sont horodatés en UTC, ce qui est exactement l'heure
//  d'Abidjan (UTC+0, sans heure d'été). On affiche aussi l'heure du Patron,
//  calculée par `Intl` : elle suit l'heure d'été toute seule, ce qu'un décalage
//  écrit en dur (« +2 h ») cesserait de faire fin octobre.
// =============================================================================
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const DEPOT = new URL('..', import.meta.url).pathname
const FICHIER = DEPOT + 'REGISTRE-ACTIVITE.md'
const FUSEAU_PATRON = 'Europe/Berlin'   // là où le Patron travaille aujourd'hui
const DEBUT = '<!-- DÉBUT REGISTRE AUTOMATIQUE — ne rien écrire entre ces deux marques -->'
const FIN   = '<!-- FIN REGISTRE AUTOMATIQUE -->'

// =============================================================================
//  GARDE-FOU : UN CLONE SUPERFICIEL FAIT MENTIR CE REGISTRE EN SILENCE.
//
//  Trouvé par 🛡️ Le Gardien le 12/09/2026, sur sa troisième ronde. Un clone fait
//  avec `--depth` ne contient qu'une tranche récente de l'histoire. `git log` n'y
//  voit AUCUNE anomalie : il ne renvoie pas d'erreur, il s'arrête simplement à la
//  limite du clone. Le registre produit est alors parfaitement bien formé, daté,
//  chiffré — et faux.
//
//  Ce jour-là, la session du Développement tournait sur un clone de 142 commits.
//  Le registre a été régénéré et commité HUIT FOIS en annonçant « du 27 août au
//  12 septembre, 141 livraisons ». La vérité : « du 11 juillet au 12 septembre,
//  856 livraisons ». Six semaines de travail effacées, sans un signe.
//
//  C'est exactement le défaut que ce script prétend corriger — un document qui
//  ment sans qu'on puisse le voir — reproduit à l'intérieur du remède. Et celui-ci
//  mentait avec l'autorité de l'automatique, ce qui est pire qu'un oubli à la main.
//
//  D'où ce refus net. On ne complète pas le dépôt en douce (`--unshallow` sur un
//  réseau lent, pendant qu'on croit lancer une commande de trois secondes) : on
//  s'arrête, on dit pourquoi, et on donne la commande à taper.
// =============================================================================
if (execFileSync('git', ['rev-parse', '--is-shallow-repository'],
  { cwd: DEPOT, encoding: 'utf8' }).trim() === 'true') {
  console.error(`
  ⛔ REGISTRE NON ÉCRIT — le dépôt est SUPERFICIEL (clone « --depth »).

     Seule une tranche récente de l'histoire est visible ici. Le registre
     produit aurait l'air juste et serait FAUX : il annoncerait quelques
     semaines de travail au lieu de toutes.

     Complétez le dépôt, puis relancez :

         git fetch --unshallow
         npm run registre
`)
  process.exit(1)
}

const SEP = '' // séparateur de champs : ne peut pas apparaître dans un titre
const brut = execFileSync('git', [
  'log', '--no-merges', `--format=%H${SEP}%aI${SEP}%s`,
], { cwd: DEPOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim()

const commits = brut ? brut.split('\n').map((l) => {
  const [sha, iso, titre] = l.split(SEP)
  return { sha: sha.slice(0, 7), d: new Date(iso), titre }
}) : []

const hAbidjan = (d) => d.toISOString().slice(11, 16)              // UTC = Abidjan
const jAbidjan = (d) => d.toISOString().slice(0, 10)
const hPatron = (d) => new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU_PATRON, hour: '2-digit', minute: '2-digit', hour12: false,
}).format(d)
const jourLong = (aaaammjj) => {
  const d = new Date(aaaammjj + 'T12:00:00Z')
  const s = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Regroupement par JOUR D'ABIDJAN. Un commit passé à 01 h du matin chez le
// Patron appartient à la journée ivoirienne de la veille — c'est le site qui
// donne le calendrier, pas le lieu où l'on tape.
const jours = new Map()
for (const c of commits) {
  const j = jAbidjan(c.d)
  if (!jours.has(j)) jours.set(j, [])
  jours.get(j).push(c)
}

const duree = (ms) => {
  const m = Math.round(ms / 60000)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}

const lignes = []
let totalCommits = 0
for (const [j, liste] of [...jours.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
  liste.sort((a, b) => a.d - b.d)
  totalCommits += liste.length
  const p = liste[0].d, dernier = liste[liste.length - 1].d
  const amplitude = liste.length > 1 ? duree(dernier - p) : '—'
  lignes.push('')
  lignes.push(`### ${jourLong(j)}`)
  lignes.push('')
  lignes.push(`**${liste.length} livraison(s)** · Abidjan ${hAbidjan(p)} → ${hAbidjan(dernier)}`
    + ` · chez le Patron ${hPatron(p)} → ${hPatron(dernier)} · amplitude ${amplitude}`)
  lignes.push('')
  for (const c of liste) lignes.push(`- \`${hAbidjan(c.d)}\` · ${c.titre}  <sub>\`${c.sha}\`</sub>`)
}

const entete = [
  '# Registre d’activité — Chap.ci',
  '',
  'Quand chaque chose a été faite. **Ce document se génère** : `npm run registre`.',
  '',
  '| | |',
  '|---|---|',
  `| Période couverte | du ${jourLong(jAbidjan(commits[commits.length - 1].d))} au ${jourLong(jAbidjan(commits[0].d))} |`,
  `| Livraisons | ${totalCommits} |`,
  `| Jours travaillés | ${jours.size} |`,
  `| Dernière mise à jour | ${jourLong(jAbidjan(new Date()))}, ${hAbidjan(new Date())} (Abidjan) |`,
  '',
  '**Les heures sont celles d’Abidjan** (UTC+0, sans heure d’été) — c’est le',
  'calendrier du site. L’heure du Patron est donnée à côté, calculée pour',
  `\`${FUSEAU_PATRON}\` : elle suit l’heure d’été toute seule.`,
  '',
  '⚠️ **« Amplitude » n’est pas « temps passé. »** C’est l’écart entre la première',
  'et la dernière livraison du jour. Elle ne dit ni les pauses, ni le travail qui',
  'n’a rien produit, ni les heures passées à chercher une panne qui n’existait',
  'pas. Ce registre dit **quand quelque chose a été livré**, et rien d’autre :',
  'c’est la seule chose qu’il puisse prouver.',
  '',
  '---',
  '',
  '## Ce que le Patron a fait lui-même',
  '',
  'Un zip extrait, une clé changée dans cPanel, un fichier téléversé, une',
  'application construite : **rien de tout cela ne laisse de trace dans git**, et',
  'le générateur ne peut pas l’inventer. Ces lignes-là s’ajoutent à la main,',
  'ici même — `npm run registre` ne touche jamais cette section.',
  '',
  '| Jour | Ce qui a été fait |',
  '|---|---|',
  '| 10/09/2026 | Demande d’accès en production déposée à la Play Console (01 h 04) |',
  '| 10/09/2026 | Clé Firebase `fcm.json` déposée, puis zips n° 21, 22 et 23 extraits |',
  '| 11/09/2026 | Clé cron et jeton de modération changés ; clés reportées dans les tâches cPanel |',
  '',
  '---',
  '',
  '## Les livraisons, lues dans git',
  '',
  DEBUT,
].join('\n')

// On préserve TOUT ce qui est écrit hors des marques : c'est la partie humaine.
let avant = entete, apres = '\n' + FIN + '\n'
if (existsSync(FICHIER)) {
  const ancien = readFileSync(FICHIER, 'utf8')
  const i = ancien.indexOf(DEBUT), f = ancien.indexOf(FIN)
  if (i !== -1 && f !== -1) {
    // Le fichier existe déjà : on ne réécrit QUE le bloc automatique, et on
    // garde l'en-tête tel que le Patron l'a peut-être amendé.
    avant = ancien.slice(0, i + DEBUT.length)
    apres = ancien.slice(f)
    // ... sauf les quatre chiffres du tableau, qui doivent rester vrais.
    avant = avant
      .replace(/\| Livraisons \| \d+ \|/, `| Livraisons | ${totalCommits} |`)
      .replace(/\| Jours travaillés \| \d+ \|/, `| Jours travaillés | ${jours.size} |`)
      .replace(/\| Dernière mise à jour \| [^|]+\|/,
        `| Dernière mise à jour | ${jourLong(jAbidjan(new Date()))}, ${hAbidjan(new Date())} (Abidjan) |`)
      .replace(/\| Période couverte \| [^|]+\|/,
        `| Période couverte | du ${jourLong(jAbidjan(commits[commits.length - 1].d))} au ${jourLong(jAbidjan(commits[0].d))} |`)
    apres = '\n' + FIN + apres.slice(FIN.length)
  }
}

writeFileSync(FICHIER, avant + '\n' + lignes.join('\n') + apres)
console.log(`  ✅ ${FICHIER.replace(DEPOT, '')} — ${totalCommits} livraisons sur ${jours.size} jours`)
console.log(`     du ${jAbidjan(commits[commits.length - 1].d)} au ${jAbidjan(commits[0].d)}`)
