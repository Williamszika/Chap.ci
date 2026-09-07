// =============================================================================
//  BANC DE COHÉRENCE — le site, l'application et le serveur disent-ils pareil ?
//  (07/09/2026)
//
//      npm run banc:coherence
//
//  Le Patron : « vérifie toutes les options, les recherches, les filtres et
//  tout du site, si tout concorde avec tout ». Les mêmes listes vivent à trois
//  endroits — `src/` pour le site, `flutter_app/lib/` pour l'application,
//  `server/index.php` pour ce qui s'enregistre — et rien ne les empêche de
//  diverger en silence : une sous-catégorie ajoutée d'un côté, un type de
//  structure renommé de l'autre, un réglage de notification que l'app propose
//  et que le site ignore. Ce banc LIT LES FICHIERS RÉELS et compare.
//
//  Ce qu'il croise :
//    1. les 16 catégories : identifiants et noms (site ↔ app ↔ traductions ↔
//       libellés serveur des e-mails) ;
//    2. les sous-catégories : mêmes noms, même ordre (site ↔ app), et chacune
//       traduite dans l'app ;
//    3. les types de structure professionnelle : identifiants, emoji, libellés,
//       secteurs, catégories rattachées, numéro demandé, mots par type
//       (site ↔ app ↔ serveur ↔ deux écrans d'administration) ;
//    4. les lieux : régions, villes, communes d'Abidjan, pays hors CI et zones ;
//    5. les réglages de notifications : chaque interrupteur du site existe dans
//       l'app, et chacun coupe un type que le serveur émet vraiment ;
//    6. les offres d'emploi : contrats et types de question ;
//    7. les permissions des modérateurs : serveur ↔ site ↔ app.
//
//  ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : le banc ne teste pas une liste
//  qu'il connaît, il lit les fichiers. Le jour où quelqu'un ajoute une ville
//  d'un seul côté, il passe au rouge.
// =============================================================================
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const lire = (p) => readFileSync(join(racine, p), 'utf8')
const tous = (texte, re) => [...texte.matchAll(re)]
const bloc = (texte, debut, fin = /\n\]|\n\}|\n\];|\n\};/) => {
  const i = texte.indexOf(debut)
  if (i < 0) throw new Error(`bloc introuvable : ${debut}`)
  const reste = texte.slice(i + debut.length)
  const m = reste.match(fin)
  return m ? reste.slice(0, m.index) : reste
}
let rouges = 0, verts = 0
const dire = (ok, texte, detail = '') => { if (ok) verts++; else rouges++; console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`) }
const info = (texte) => console.log(`  ⚪ ${texte}`)
const memes = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])
const diff = (a, b) => ({ manque: a.filter((x) => !b.includes(x)), enTrop: b.filter((x) => !a.includes(x)) })
const dirDiff = (a, b) => { const d = diff(a, b); return [d.manque.length ? `manque : ${d.manque.join(', ')}` : '', d.enTrop.length ? `en trop : ${d.enTrop.join(', ')}` : ''].filter(Boolean).join(' ; ') }
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(4, 68 - t.length))}`)

// ─── Les fichiers ─────────────────────────────────────────────────────────────
const F = {
  categoriesTs: lire('src/data/categories.ts'),
  nomsTs: lire('src/data/sous/noms.ts'),
  secteursTs: lire('src/data/secteursPro.ts'),
  locationsTs: lire('src/data/locations.ts'),
  paysTs: lire('src/data/pays.ts'),
  reglagesTsx: lire('src/components/ReglagesPro.tsx'),
  offresTsx: lire('src/components/Offres.tsx'),
  donationTs: lire('src/data/donation.ts'),
  donsDart: lire('flutter_app/lib/data/dons.dart'),
  adminTsx: lire('src/pages/AdminDashboard.tsx'),
  categoriesDart: lire('flutter_app/lib/data/categories.dart'),
  registreDart: lire('flutter_app/lib/data/formulaires/registre.dart'),
  i18nCatsDart: lire('flutter_app/lib/i18n/categories_i18n.dart'),
  devenirProDart: lire('flutter_app/lib/screens/devenir_pro_screen.dart'),
  demandesProDart: lire('flutter_app/lib/screens/admin/demandes_pro_screen.dart'),
  motsProDart: lire('flutter_app/lib/data/mots_pro.dart'),
  locationsDart: lire('flutter_app/lib/data/locations.dart'),
  paysDart: lire('flutter_app/lib/data/pays.dart'),
  parametresDart: lire('flutter_app/lib/screens/parametres_screen.dart'),
  offresProDart: lire('flutter_app/lib/screens/offres_pro_screen.dart'),
  shotsDart: lire('flutter_app/lib/main_shots.dart'),
  php: lire('server/index.php'),
}

// ─── 1. Les catégories ────────────────────────────────────────────────────────
titre('Les catégories')
const catsSite = tous(bloc(F.categoriesTs, 'export const categories: Category[] = [', /\n\]/), /id: '([a-z-]+)',\s*\n\s*name: '([^']+)'/g).map((m) => [m[1], m[2]])
const catsApp = tous(F.categoriesDart, /Categorie\('([a-z-]+)', '([^']+)'/g).map((m) => [m[1], m[2]])
const catsI18n = tous(bloc(F.i18nCatsDart, '_cats = {', /\n\};/), /^\s*'([a-z-]+)': \{/gm).map((m) => m[1])
const catsServeur = tous(bloc(F.php, 'function category_label', /\n\s*\];/), /'([a-z-]+)' => '([^']+)'/g).map((m) => [m[1], m[2]])
const ANCIENNES = ['telephones', 'agriculture'] // fondues le 02/08/2026, reclassées par fusion_categories
dire(catsSite.length === 16, 'seize catégories sur le site', `${catsSite.length}`)
dire(memes(catsSite.map((c) => c[0]), catsApp.map((c) => c[0])), 'mêmes identifiants, même ordre, dans l’application', dirDiff(catsSite.map((c) => c[0]), catsApp.map((c) => c[0])))
dire(catsSite.every(([id, nom]) => catsApp.find((c) => c[0] === id)?.[1] === nom), 'mêmes noms français dans l’application', catsSite.filter(([id, nom]) => catsApp.find((c) => c[0] === id)?.[1] !== nom).map((c) => c[0]).join(', '))
dire(!dirDiff(catsSite.map((c) => c[0]), catsI18n), 'chaque catégorie est traduite dans l’application (categories_i18n)', dirDiff(catsSite.map((c) => c[0]), catsI18n))
const serveurSansAnciennes = catsServeur.filter((c) => !ANCIENNES.includes(c[0]))
dire(!dirDiff(catsSite.map((c) => c[0]), serveurSansAnciennes.map((c) => c[0])), 'le serveur connaît les mêmes catégories pour ses e-mails (plus les deux anciennes, fondues)', dirDiff(catsSite.map((c) => c[0]), serveurSansAnciennes.map((c) => c[0])))
dire(catsSite.every(([id, nom]) => catsServeur.find((c) => c[0] === id)?.[1] === nom), 'et sous les mêmes noms', catsSite.filter(([id, nom]) => catsServeur.find((c) => c[0] === id)?.[1] !== nom).map(([id, nom]) => `${id} : « ${nom} » vs « ${catsServeur.find((c) => c[0] === id)?.[1]} »`).join(', '))

// ─── 2. Les sous-catégories ───────────────────────────────────────────────────
titre('Les sous-catégories')
const sousSite = Object.fromEntries(tous(bloc(F.nomsTs, 'export const NOMS_SOUS: Record<string, string[]> = {', /\n\}/), /^\s{2}["']?([a-z-]+)["']?: \[([\s\S]*?)\],?(?:\n|$)/gm).map((m) => [m[1], tous(m[2], /"([^"]+)"/g).map((x) => x[1])]))
const immoSite = tous(F.categoriesTs.match(/id: 'immobilier',[\s\S]*?subcategories: \[([^\]]+)\]/)?.[1] ?? '', /'([^']+)'/g).map((m) => m[1])
if (immoSite.length && !sousSite.immobilier) sousSite.immobilier = immoSite
const sousApp = Object.fromEntries(tous(bloc(F.registreDart, 'const Map<String, List<String>> nomsSous = {', /\n\};/), /^\s{2}'([a-z-]+)': \[([\s\S]*?)\],?(?:\n|$)/gm).map((m) => [m[1], tous(m[2], /'([^']+)'/g).map((x) => x[1])]))
const sousI18n = tous(bloc(F.i18nCatsDart, '_sous = {', /\n\};/), /^\s*['"]([^'"]+)['"]: \{/gm).map((m) => m[1])
const totalSous = Object.values(sousSite).reduce((s, l) => s + l.length, 0)
dire(totalSous >= 100, `${totalSous} sous-catégories sur le site (immobilier compris)`)
dire(!dirDiff(Object.keys(sousSite), Object.keys(sousApp)), 'les mêmes catégories portent des sous-catégories dans l’application', dirDiff(Object.keys(sousSite), Object.keys(sousApp)))
for (const [cat, liste] of Object.entries(sousSite)) {
  if (!sousApp[cat]) continue
  dire(memes(liste, sousApp[cat]), `${cat} : ${liste.length} sous-catégories, mêmes noms, même ordre`, memes(liste, sousApp[cat]) ? '' : `site ${JSON.stringify(liste)} / app ${JSON.stringify(sousApp[cat])}`)
}
const nonTraduites = Object.values(sousSite).flat().filter((n) => !sousI18n.includes(n))
dire(nonTraduites.length === 0, 'chaque sous-catégorie est traduite dans l’application', nonTraduites.join(', '))
dire(catsSite.every(([id]) => sousSite[id]?.length), 'chaque catégorie a ses sous-catégories', catsSite.filter(([id]) => !sousSite[id]?.length).map((c) => c[0]).join(', '))

// ─── 3. Les types de structure professionnelle ────────────────────────────────
titre('Les types de structure professionnelle')
const typesSite = tous(bloc(F.secteursTs, 'export const TYPES_PRO: TypePro[] = [', /\n\]/), /id: '([a-z]+)', emoji: '([^']+)', label: '([^']+)',\s*\n\s*numero: '([^']+)',\s*\n\s*secteurs: \[([\s\S]*?)\],/g)
  .map((m) => ({ id: m[1], emoji: m[2], label: m[3], numero: m[4], secteurs: tous(m[5], /'([^']+)'/g).map((x) => x[1]) }))
const idsApp = tous(bloc(F.devenirProDart, 'static const _types = [', /\n\s*\];/), /'([a-z]+)'/g).map((m) => m[1])
const emojisApp = Object.fromEntries(tous(bloc(F.devenirProDart, 'static const _emojis = {', /\n\s*\};/), /'([a-z]+)': '([^']+)'/g).map((m) => [m[1], m[2]]))
const secteursApp = Object.fromEntries(tous(bloc(F.devenirProDart, '_secteursDuType = {', /\n\s*\};/), /'([a-z]+)': \[([\s\S]*?)\],/g).map((m) => [m[1], tous(m[2], /'([^']+)'/g).map((x) => x[1])]))
const categoriesDuType = Object.fromEntries(tous(bloc(F.devenirProDart, '_categoriesDuType = {', /\n\s*\};/), /'([a-z]+)': \[([^\]]*)\]/g).map((m) => [m[1], tous(m[2], /'([a-z-]+)'/g).map((x) => x[1])]))
const typesServeur = tous(F.php.match(/const PRO_TYPES = \[([\s\S]*?)\];/)?.[1] ?? '', /'([a-z]+)'/g).map((m) => m[1])
const adminSite = Object.fromEntries(tous(F.adminTsx.match(/const PRO_TYPES: Record<string, string> = \{([\s\S]*?)\n\}/)?.[1] ?? '', /([a-z]+): '([^']+)'/g).map((m) => [m[1], m[2]]))
const adminApp = Object.fromEntries(tous(F.demandesProDart.match(/static const Map<String, String> _types = \{([\s\S]*?)\n\s*\};/)?.[1] ?? '', /'([a-z]+)': '([^']+)'/g).map((m) => [m[1], m[2]]))
const ids = typesSite.map((t) => t.id)
dire(ids.length === 15, 'quinze types sur le site', `${ids.length}`)
dire(memes(ids, idsApp), 'mêmes identifiants, même ordre, dans l’application', dirDiff(ids, idsApp))
dire(typesSite.every((t) => emojisApp[t.id] === t.emoji), 'mêmes emoji', typesSite.filter((t) => emojisApp[t.id] !== t.emoji).map((t) => `${t.id} ${t.emoji}/${emojisApp[t.id]}`).join(', '))
for (const t of typesSite) {
  dire(memes(t.secteurs, secteursApp[t.id] ?? []), `${t.id} : ${t.secteurs.length} secteurs, mêmes noms, même ordre`, memes(t.secteurs, secteursApp[t.id] ?? []) ? '' : dirDiff(t.secteurs, secteursApp[t.id] ?? []))
}
dire(!dirDiff([...ids, 'commerce'], typesServeur), 'le serveur accepte ces quinze types, plus l’ancien « commerce »', dirDiff([...ids, 'commerce'], typesServeur))
dire(!dirDiff([...ids, 'commerce'], Object.keys(adminSite)), 'l’onglet Demandes Pro du site les nomme tous', dirDiff([...ids, 'commerce'], Object.keys(adminSite)))
dire(typesSite.every((t) => adminSite[t.id] === `${t.emoji} ${t.label}`), 'sous le même libellé que le formulaire', typesSite.filter((t) => adminSite[t.id] !== `${t.emoji} ${t.label}`).map((t) => t.id).join(', '))
dire(!dirDiff([...ids, 'commerce'], Object.keys(adminApp)), 'l’écran Demandes Pro de l’application aussi', dirDiff([...ids, 'commerce'], Object.keys(adminApp)))
dire(typesSite.every((t) => adminApp[t.id] === `${t.emoji} ${t.label}`), 'avec les mêmes libellés', typesSite.filter((t) => adminApp[t.id] !== `${t.emoji} ${t.label}`).map((t) => `${t.id} : « ${adminApp[t.id]} »`).join(', '))
const catIds = catsSite.map((c) => c[0])
const catsInconnues = Object.entries(categoriesDuType).flatMap(([t, l]) => l.filter((c) => !catIds.includes(c)).map((c) => `${t} → ${c}`))
dire(!dirDiff(ids, Object.keys(categoriesDuType)) && catsInconnues.length === 0, 'chaque type de l’application est rattaché à des catégories existantes', [dirDiff(ids, Object.keys(categoriesDuType)), catsInconnues.join(', ')].filter(Boolean).join(' ; '))
// Le numéro demandé et les mots par type.
const agrementSite = tous(F.secteursTs.match(/TYPES_A_AGREMENT = new Set\(\[([^\]]+)\]/)?.[1] ?? '', /'([a-z]+)'/g).map((m) => m[1])
const boutiqueSite = tous(F.secteursTs.match(/TYPES_BOUTIQUE = new Set\(\[([^\]]+)\]/)?.[1] ?? '', /'([a-z]*)'/g).map((m) => m[1]).filter(Boolean)
const agrementApp = tous(F.motsProDart.match(/bool aAgrement[\s\S]*?\{([^}]+)\}/)?.[1] ?? '', /'([a-z]+)'/g).map((m) => m[1])
const boutiqueApp = tous(F.motsProDart.match(/bool estBoutique[\s\S]*?const \{([^}]+)\}/)?.[1] ?? '', /'([a-z]+)'/g).map((m) => m[1])
dire(!dirDiff(agrementSite, agrementApp), 'les métiers « à agrément » sont les mêmes (mots par type)', dirDiff(agrementSite, agrementApp))
dire(!dirDiff(boutiqueSite, boutiqueApp), 'les types « boutique » sont les mêmes (mots par type)', dirDiff(boutiqueSite, boutiqueApp))
dire(typesSite.every((t) => (t.numero === 'Numéro d’agrément') === agrementSite.includes(t.id)), 'sur le site, un métier à agrément demande un numéro d’agrément, les autres un RCCM ou un récépissé', typesSite.filter((t) => (t.numero === 'Numéro d’agrément') !== agrementSite.includes(t.id)).map((t) => `${t.id} : ${t.numero}`).join(', '))
dire(typesSite.find((t) => t.id === 'association')?.numero === 'Numéro de récépissé', 'une association donne un récépissé')
const numeroFn = F.devenirProDart.match(/String _labelNumero\(\) \{([\s\S]*?)\n  \}/)?.[1] ?? ''
const casApp = {}; let attente = []
for (const m of numeroFn.matchAll(/case '([a-z]+)':|return tr\(context, '([^']+)'\)/g)) {
  if (m[1]) attente.push(m[1]); else { for (const c of attente) casApp[c] = m[2]; attente = [] }
}
const agrementAppNumero = Object.entries(casApp).filter(([, k]) => /agrement/.test(k)).map(([c]) => c)
dire(!dirDiff(agrementSite, agrementAppNumero), 'l’application demande l’agrément aux mêmes métiers', dirDiff(agrementSite, agrementAppNumero))
dire(/recepisse/.test(casApp.association ?? ''), 'et le récépissé à l’association')

// ─── 4. Les lieux ─────────────────────────────────────────────────────────────
titre('Les lieux')
const regSite = tous(F.locationsTs, /\{ id: (?:'([a-z-]+)'|REGION_AUTRES_PAYS), name: '([^']+)', district: '([^']+)'/g).map((m) => [m[1] ?? 'autres-pays', m[2], m[3]])
const regApp = tous(F.locationsDart, /Region\((?:'([a-z-]+)'|regionAutresPays), '([^']+)', '([^']+)'/g).map((m) => [m[1] ?? 'autres-pays', m[2], m[3]])
dire(regSite.length >= 34 && memes(regSite.map((r) => r.join('|')), regApp.map((r) => r.join('|'))), `${regSite.length} régions : mêmes identifiants, noms, districts et ordre dans l’application`, dirDiff(regSite.map((r) => r.join('|')), regApp.map((r) => r.join('|'))))
dire(regSite.some((r) => r[0] === 'autres-pays' && r[2] === 'Hors Côte d’Ivoire') && regApp.some((r) => r[0] === 'autres-pays'), 'la région « Autres pays » existe des deux côtés, sous « Hors Côte d’Ivoire »')
const villesSite = tous(F.locationsTs, /\{ id: '([a-z-]+)', name: '([^']+)', regionId: '([a-z-]+)'/g).map((m) => m.slice(1, 4).join('|'))
const villesApp = tous(F.locationsDart, /City\('([a-z-]+)', '([^']+)', '([a-z-]+)'/g).map((m) => m.slice(1, 4).join('|'))
dire(villesSite.length >= 40 && memes(villesSite, villesApp), `${villesSite.length} villes de Côte d’Ivoire : mêmes identifiants, noms, régions et ordre`, dirDiff(villesSite, villesApp))
const regIds = regSite.map((r) => r[0])
dire(villesSite.every((v) => regIds.includes(v.split('|')[2])), 'chaque ville pointe vers une région existante', villesSite.filter((v) => !regIds.includes(v.split('|')[2])).join(', '))
const comSite = tous(bloc(F.locationsTs, 'export const communesAbidjan = [', /\n\]/), /'([^']+)'/g).map((m) => m[1])
const comApp = tous(bloc(F.locationsDart, 'communesAbidjan = [', /\n\s*\];/), /'([^']+)'/g).map((m) => m[1])
dire(comSite.length === 13 && memes(comSite, comApp), 'les treize communes d’Abidjan, dans le même ordre', dirDiff(comSite, comApp))
const paysSite = tous(F.paysTs, /p\('([A-Z]{2})', '([^']+)', '([^']+)'\)/g).map((m) => m.slice(1, 4).join('|'))
const paysApp = tous(F.paysDart, /Pays\('([A-Z]{2})', '([^']+)', '([^']+)'\)/g).map((m) => m.slice(1, 4).join('|'))
dire(paysSite.length >= 100 && memes(paysSite, paysApp), `${paysSite.length} pays hors CI : mêmes codes, noms, zones et ordre`, dirDiff(paysSite, paysApp))
dire(paysSite.at(-1)?.startsWith('ZZ|Autre pays') && !paysSite.some((p) => p.startsWith('CI|')), '« Autre pays » ferme la liste, la Côte d’Ivoire n’y est pas')
dire(new Set(paysSite.map((p) => p.split('|')[0])).size === paysSite.length, 'aucun code de pays en double')
const zonesSite = tous(bloc(F.paysTs, 'export const ZONES = [', /\n\]/), /'([^']+)'/g).map((m) => m[1])
const zonesApp = tous(bloc(F.paysDart, 'const List<String> zones = [', /\n\];/), /'([^']+)'/g).map((m) => m[1])
dire(memes(zonesSite, zonesApp), 'les zones du monde, dans le même ordre', dirDiff(zonesSite, zonesApp))
dire(paysSite.every((p) => zonesSite.includes(p.split('|')[2])), 'chaque pays est dans une zone connue')

// ─── 5. Les réglages de notifications ─────────────────────────────────────────
titre('Les réglages de notifications')
const casesCompte = tous(bloc(F.reglagesTsx, 'const CASES_COMPTE: [string, string, string][] = [', /\n\]/), /^\s*\['([a-z_]+)', '/gm).map((m) => m[1])
const casesPro = tous(bloc(F.reglagesTsx, 'const CASES_PRO: [string, string, string][] = [', /\n\]/), /^\s*\['([a-z_]+)', '/gm).map((m) => m[1])
const casesSite = [...casesCompte, ...casesPro]
const casesApp = [...new Set(tous(F.parametresDart, /d\['([a-z_]+)'\] != false/g).map((m) => m[1]))]
const typesServeurNotif = [...new Set(tous(F.php, /notify\(\$pdo, [^,]+, '([a-z_]+)'/g).map((m) => m[1]))]
const CANAUX = ['email'] // pas un type de notification : un canal
const SANS_INTERRUPTEUR = ['listing', 'pro_decision'] // la modération et la décision Pro : on ne les coupe pas
dire(!dirDiff(casesSite, casesApp), 'l’application propose les mêmes interrupteurs que le site', dirDiff(casesSite, casesApp))
const inutiles = casesSite.filter((k) => !CANAUX.includes(k) && !typesServeurNotif.includes(k))
dire(inutiles.length === 0, 'chaque interrupteur coupe un type que le serveur émet vraiment', inutiles.join(', '))
const sansBouton = typesServeurNotif.filter((t) => !casesSite.includes(t) && !SANS_INTERRUPTEUR.includes(t))
dire(sansBouton.length === 0, 'chaque type émis par le serveur a son interrupteur (sauf la modération et la décision Pro)', sansBouton.join(', '))
info(`types émis par le serveur : ${typesServeurNotif.join(', ')}`)

// ─── 6. Les offres d'emploi ───────────────────────────────────────────────────
titre('Les offres d’emploi')
const contratsSite = tous(F.offresTsx.match(/export const CONTRATS = \[([^\]]+)\]/)?.[1] ?? '', /'([^']+)'/g).map((m) => m[1])
const contratsApp = tous(F.offresProDart.match(/const contratsProposes = \[([^\]]+)\]/)?.[1] ?? '', /'([^']+)'/g).map((m) => m[1])
const champsSite = tous(bloc(F.offresTsx, 'export const TYPES_CHAMP: { id: TypeChamp; label: string }[] = [', /\n\]/), /id: '([a-z]+)'/g).map((m) => m[1])
const champsApp = tous(F.offresProDart.match(/const typesDeChamp = \[([^\]]+)\]/)?.[1] ?? '', /'([a-z]+)'/g).map((m) => m[1])
const champsServeur = tous(F.php.match(/const OFFRE_CHAMPS_TYPES = \[([^\]]+)\]/)?.[1] ?? '', /'([a-z]+)'/g).map((m) => m[1])
dire(contratsSite.length === 8 && memes(contratsSite, contratsApp), 'huit types de contrat, les mêmes, dans le même ordre', dirDiff(contratsSite, contratsApp))
dire(champsSite.length === 6 && memes(champsSite, champsApp) && memes(champsSite, champsServeur), 'six types de question, identiques sur le site, l’application et le serveur', [dirDiff(champsSite, champsApp), dirDiff(champsSite, champsServeur)].filter(Boolean).join(' ; '))

// ─── 7. Les dons : DES NUMÉROS QUI REÇOIVENT DE L'ARGENT ──────────────────────
titre('Les dons (Mobile Money)')
const opsSite = tous(bloc(F.donationTs, 'export const donationOperators: DonationOperator[] = [', /\n\]/),
  /id: '([a-z]+)',\s*\n\s*name: '([^']+)',[\s\S]*?number: '([^']+)',\s*\n\s*accountName: '([^']+)',/g)
  .map((m) => ({ id: m[1], nom: m[2], numero: m[3], compte: m[4] }))
const opsApp = tous(F.donsDart, /id: '([a-z]+)',\s*\n\s*nom: '([^']+)',[\s\S]*?numero: '([^']+)',\s*\n\s*nomCompte: '([^']+)',/g)
  .map((m) => ({ id: m[1], nom: m[2], numero: m[3], compte: m[4] }))
const montantsSite = tous(F.donationTs.match(/export const suggestedAmounts = \[([^\]]+)\]/)?.[1] ?? '', /(\d+)/g).map((m) => m[1])
const montantsApp = tous(F.donsDart.match(/const List<int> montantsDon = \[([^\]]+)\]/)?.[1] ?? '', /(\d+)/g).map((m) => m[1])
dire(opsSite.length >= 1 && memes(opsSite.map((o) => o.id), opsApp.map((o) => o.id)), `${opsSite.length} opérateurs, mêmes identifiants et même ordre dans l’application`, dirDiff(opsSite.map((o) => o.id), opsApp.map((o) => o.id)))
// LE point : un chiffre qui diverge, et un don part chez quelqu'un d'autre —
// sans que personne ne s'en aperçoive, Chap.ci n'étant jamais dans le circuit.
const numerosFaux = opsSite.filter((o) => opsApp.find((x) => x.id === o.id)?.numero !== o.numero)
dire(numerosFaux.length === 0, 'CHAQUE NUMÉRO qui reçoit les dons est identique au caractère près', numerosFaux.map((o) => `${o.id} : site « ${o.numero} » vs app « ${opsApp.find((x) => x.id === o.id)?.numero} »`).join(' ; '))
dire(opsSite.every((o) => opsApp.find((x) => x.id === o.id)?.nom === o.nom && opsApp.find((x) => x.id === o.id)?.compte === o.compte), 'mêmes noms d’opérateur et mêmes noms de compte', opsSite.filter((o) => opsApp.find((x) => x.id === o.id)?.nom !== o.nom).map((o) => o.id).join(', '))
dire(montantsSite.length === 5 && memes(montantsSite, montantsApp), 'les cinq montants proposés, dans le même ordre', dirDiff(montantsSite, montantsApp))
dire(/montantDonDefaut = 2500/.test(F.donsDart) && /useState<number \| null>\(2500\)/.test(lire('src/pages/Donate.tsx')), 'le même montant est sélectionné à l’ouverture des deux côtés (2 500 FCFA)')

// ─── 8. Les permissions des modérateurs ───────────────────────────────────────
titre('Les permissions des modérateurs')
const permServeur = tous(F.php.match(/function admin_grantable_features\(\): array \{\s*return \[([^\]]+)\]/)?.[1] ?? '', /'([a-z]+)'/g).map((m) => m[1])
const permLabels = tous(bloc(F.php, 'function admin_feature_labels(): array {', /\n\s*\];/), /'([a-z]+)' => '/g).map((m) => m[1])
const permSite = tous(F.adminTsx.match(/const PERM_LABELS: Record<string, string> = \{([\s\S]*?)\n\}/)?.[1] ?? '', /\b([a-z]+): '/g).map((m) => m[1])
const permApp = tous(F.shotsDart, /FonctionMod\('([a-z]+)', '/g).map((m) => m[1])
dire(!dirDiff(permServeur, permLabels), 'chaque permission délégable a son libellé sur le serveur', dirDiff(permServeur, permLabels))
dire(!dirDiff(permServeur, permSite), 'le site nomme les mêmes permissions (note de bienvenue du modérateur)', dirDiff(permServeur, permSite))
dire(!dirDiff(permServeur, permApp), 'l’application coche les mêmes permissions', dirDiff(permServeur, permApp))
const ongletsSite = tous(F.adminTsx.match(/\(\[\['overview','Aperçu'\][\s\S]*?\] as \[Tab,string\]\[\]\)/)?.[0] ?? '', /\['([a-z]+)','/g).map((m) => m[1])
const ONGLETS_HORS_PERMISSION = ['overview', 'pro', 'pays', 'comptabilite', 'moderators', 'emails', 'backup', 'automation']
const ongletsSansPerm = ongletsSite.filter((o) => !ONGLETS_HORS_PERMISSION.includes(o) && !permServeur.includes(o))
dire(ongletsSite.length >= 18 && ongletsSansPerm.length === 0, 'chaque onglet du tableau de bord est couvert par une permission (ou réservé au propriétaire)', ongletsSansPerm.join(', '))
dire(F.php.includes("$path === 'admin/pays') return 'visitors'") && F.adminTsx.includes("id === 'pays' ? canSee('visitors')"), 'l’onglet « Pays » suit la permission « Visiteurs » sur le serveur ET sur le site')

console.log(`\n${rouges === 0 ? `✅ Tout concorde (${verts} vérifications)` : `❌ ${rouges} vérification${rouges > 1 ? 's' : ''} en échec sur ${verts + rouges}`}`)
process.exit(rouges === 0 ? 0 : 1)
