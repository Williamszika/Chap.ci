#!/usr/bin/env node
/* =============================================================================
 *  BANC DES FONDATEURS — la page que Google peut enfin lire (19/09/2026)
 *
 *      npm run banc:fondateurs
 *
 *  POURQUOI CE BANC EXISTE
 *
 *  Le Patron a tapé son nom dans Google : rien. Ce n'était pas un délai
 *  d'indexation, c'était une absence de porte. Deux causes cumulées :
 *
 *    · le site tourne en HashRouter. Dans `https://chap.ci/#/a-propos`, tout ce
 *      qui suit le `#` reste dans le navigateur — Google ne voit jamais que
 *      `https://chap.ci/`. La page « À propos » n'avait aucune adresse ;
 *    · web/seo.php ne connaissait que cinq formes d'adresses. Mesuré avant
 *      d'écrire quoi que ce soit : /a-propos, /conditions et /confidentialite
 *      renvoyaient un 302 vers l'accueil, Googlebot compris.
 *
 *  ⚠️ CE QUE CE BANC GARDE VRAIMENT : que les DEUX listes de fondateurs disent
 *  la même chose. Il y en a deux par nécessité — une en PHP pour les robots,
 *  une en TypeScript pour les visiteurs. Deux listes qui se recopient à la main
 *  finissent toujours par diverger, et le jour où elles divergent, c'est un nom
 *  de personne qui devient faux quelque part.
 *
 *  CE QU'IL NE VOIT PAS, et qu'il faut savoir avant de le croire :
 *    · il joue seo.php EN LOCAL, jamais la production — donc un zip non
 *      extrait le laisserait vert sur un site qui redirige encore ;
 *    · il ne dit RIEN du classement dans Google. Exister dans l'index et
 *      sortir en tête sur un nom propre sont deux choses différentes. Ce banc
 *      prouve qu'il y a une page à trouver, pas qu'on la trouvera.
 * ===========================================================================*/
import { spawn } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const D = join(tmpdir(), 'chapci-banc-fondateurs')
const PORT = 8241
const SITE = `http://127.0.0.1:${PORT}`
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

let rouges = 0
const dire = (ok, texte, detail = '') => {
  if (!ok) rouges++
  console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`)
}

rmSync(D, { recursive: true, force: true })
mkdirSync(join(D, 'api'), { recursive: true })
copyFileSync(join(racine, 'web/seo.php'), join(D, 'seo.php'))
writeFileSync(join(D, 'api/config.php'), `<?php
return ['db' => ['driver' => 'sqlite', 'sqlite_path' => ${JSON.stringify(join(D, 'vide.sqlite'))}],
        'site_url' => 'https://chap.ci', 'uploads_path' => '/uploads'];
`)

const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'seo.php'], { cwd: D, stdio: 'ignore', detached: true })
serveur.unref()
const fini = () => { try { process.kill(-serveur.pid) } catch { /* déjà parti */ } try { process.kill(serveur.pid) } catch { /* déjà parti */ } }
process.on('exit', fini)
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { fini(); process.exit(130) })

const demander = async (chemin) => {
  const r = await fetch(SITE + chemin, { headers: { 'User-Agent': GOOGLEBOT }, redirect: 'manual' })
  return { code: r.status, corps: await r.text(), vers: r.headers.get('location') ?? '' }
}
for (let i = 0; i < 40; i++) {
  try { if ((await demander('/a-propos')).code) break } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 250))
}

console.log('\nBANC DES FONDATEURS')
console.log('─'.repeat(72))

/* ── 1. Le banc sait-il voir une porte fermée ? ─────────────────────────────
 * Sans ces deux-là, un « ✅ /a-propos répond 200 » ne prouverait pas que le
 * banc sait distinguer un 200 d'une redirection. */
console.log('\n── ⚠️ Le banc sait-il voir une adresse qui n’existe pas ?')
const inventee = await demander('/cette-page-na-jamais-existe')
dire(inventee.code === 302, 'une adresse inconnue est bien renvoyée à l’accueil', `HTTP ${inventee.code}`)
const conditions = await demander('/conditions')
dire(conditions.code === 302, '/conditions reste derrière le `#` : toujours 302',
  'c’est voulu — cette page n’a pas vocation à être indexée')

/* ── 2. La porte est-elle ouverte ? ─────────────────────────────────────────*/
console.log('\n── La page que Google peut lire')
const page = await demander('/a-propos')
dire(page.code === 200, '/a-propos répond 200 à Googlebot', `HTTP ${page.code}`)
dire(/rel="canonical" href="https:\/\/chap\.ci\/a-propos"/.test(page.corps),
  'et déclare son adresse canonique, sans `#`')
dire(!/noindex/.test(page.corps), 'rien ne l’empêche d’être indexée')

/* ── 3. Le bloc que Google comprend ─────────────────────────────────────────
 * Un nom dans un paragraphe se lit ; un `founder` se COMPREND. C'est ce bloc
 * qui relie une personne à Chap.ci, pas le texte autour.
 *
 * ⚠️ ET C'EST LUI QU'ON PREND POUR VÉRITÉ. Première version de ce banc : elle
 * demandait à PHP la liste via `require web/seo.php`, ce qui aurait exécuté le
 * ROUTEUR entier — redirection comprise — au lieu de lire une fonction. On lit
 * donc la page RÉELLEMENT SERVIE : c'est la seule sortie qui prouve ce qu'un
 * robot reçoit, et elle ne peut pas mentir sur ce que le code fait. */
console.log('\n── Les données structurées (c’est elles qui relient un nom à Chap.ci)')
const m = page.corps.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
let ld = null
try { ld = m ? JSON.parse(m[1]) : null } catch { ld = null }
dire(!!ld, 'le bloc JSON-LD est présent et se lit sans erreur')
const servis = ld && Array.isArray(ld.founder) ? ld.founder.map((x) => x?.name).filter(Boolean) : []
if (ld) {
  dire(ld['@type'] === 'Organization', 'il déclare une Organization', String(ld['@type']))
  dire(ld.founder?.every?.((x) => x['@type'] === 'Person' && typeof x.name === 'string' && x.name) === true,
    'chaque fondateur est une Person nommée')
  dire(servis.length >= 2, `la page servie annonce ${servis.length} fondateur(s)`, servis.join(' · ') || '(aucun)')
}

/* ── 4. Les deux listes disent-elles la même chose ? ────────────────────────
 * LA VÉRIFICATION QUI COMPTE. Une liste en PHP pour les robots, une en
 * TypeScript pour les visiteurs : elles ne peuvent que diverger avec le temps
 * si personne ne les confronte. */
console.log('\n── ⚠️ Les deux listes de fondateurs, confrontées')
const ts = readFileSync(join(racine, 'src/data/fondateurs.ts'), 'utf8')
const tsNoms = [...ts.matchAll(/nom:\s*'([^']+)'/g)].map((x) => x[1])

// Sans ce garde-fou, deux listes VIDES se déclareraient « identiques » : le
// banc rendrait vert précisément parce qu'il n'a rien su lire.
dire(tsNoms.length >= 2, `la liste TypeScript porte ${tsNoms.length} fondateur(s)`,
  tsNoms.join(' · ') || 'RIEN LU — le motif de lecture a changé, ce banc ne prouve plus rien')
dire(tsNoms.length === servis.length && tsNoms.every((n, i) => n === servis[i]),
  'elle dit EXACTEMENT ce que la page sert aux robots',
  tsNoms.join(' · ') === servis.join(' · ') ? 'identiques' : `site: ${tsNoms.join(' · ')} ≠ robots: ${servis.join(' · ')}`)

console.log('\n── Les noms arrivent-ils jusque dans le texte lisible ?')
for (const nom of servis) {
  // Hors du bloc JSON-LD : un nom qui ne serait QUE dans les données
  // structurées ne serait lu par aucun humain.
  const texte = page.corps.replace(/<script[\s\S]*?<\/script>/g, '')
  dire(texte.includes(nom), `« ${nom} » est écrit dans la page elle-même`)
}
dire(!page.corps.includes('Jean Dupont'),
  'et un nom qui n’est pas fondateur n’y est pas', 'le banc ne dit pas oui à tout')

/* ── 5. LA PORTE EST-ELLE OUVERTE CÔTÉ SERVEUR ? ────────────────────────────
 *
 * ⚠️ LA VÉRIFICATION QUI MANQUAIT, ET QUI A COÛTÉ UNE LIVRAISON POUR RIEN.
 *
 * Le 19/09/2026, tout ce qui précède était vert, le zip a été extrait… et
 * https://chap.ci/a-propos répondait toujours 301 vers /#/a-propos. La page
 * était bonne ; elle n'était simplement jamais appelée.
 *
 * La raison tient à la façon dont ce banc s'y prend : il lance
 * `php -S … seo.php`, et dans ce mode TOUTES les adresses arrivent dans
 * seo.php. En production, c'est le `.htaccess` qui décide lesquelles y vont —
 * et il n'en envoie qu'une poignée. Un banc qui ne lit pas cette liste croit
 * une porte ouverte parce qu'il est entré par la fenêtre.
 *
 * On lit donc le `.htaccess` de référence. Il ne voyage jamais dans un zip
 * (il vit sur le serveur, le Patron l'édite à la main), mais `web/htaccess-root`
 * en est la copie de référence : si elle est fausse, ce qu'on lui demandera de
 * recopier le sera aussi. */
console.log('\n── ⚠️ Le serveur envoie-t-il vraiment /a-propos à seo.php ?')
const ht = readFileSync(join(racine, 'web/htaccess-root'), 'utf8')
  .split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n')

dire(/RewriteRule\s+\^a-propos[^\n]*seo\.php/.test(ht),
  'le .htaccess route /a-propos vers seo.php',
  'sans cette ligne, la page existe mais personne ne l’appelle')

// Et la redirection vers le dièse ne doit plus l'intercepter : elle arrive
// après, mais un `a-propos` resté dans sa liste reprendrait la main si on
// déplaçait les règles.
const redirDiese = ht.match(/RewriteRule\s+\^\(([^)]*)\)\/\?\$\s+\/#\//)
dire(!!redirDiese, 'la redirection vers le dièse est bien trouvée',
  redirDiese ? '' : 'le motif a changé — cette vérification ne prouve plus rien')
if (redirDiese) {
  dire(!redirDiese[1].split('|').includes('a-propos'),
    '/a-propos n’y figure plus',
    'c’est elle qui l’envoyait derrière le dièse, hors de portée des robots')
  dire(redirDiese[1].split('|').includes('conditions'),
    'mais les autres pages y sont toujours', 'on n’a retiré que celle qui a une version serveur')
}

console.log('\n── Le sitemap propose-t-il cette adresse ?')
const sm = (await demander('/sitemap.xml')).corps
dire(sm.includes('<loc>https://chap.ci/a-propos</loc>'), '/a-propos est dans le sitemap',
  'sinon la page existe sans que personne ne sache l’aller chercher')
dire(!sm.includes('/#/'), 'et aucune adresse à `#` n’y est proposée',
  'Google ne les distingue pas de l’accueil')

console.log('\n' + '═'.repeat(72))
console.log('Non couvert : la PRODUCTION (ce banc joue seo.php en local), et le')
console.log('classement dans Google — exister dans l’index et sortir en tête sur')
console.log('un nom propre sont deux choses différentes.')
if (rouges) {
  console.log(`\n⛔ ${rouges} vérification(s) au rouge.`)
  process.exit(1)
}
console.log('\n✅ Les fondateurs ont une adresse, et les deux listes s’accordent.')
