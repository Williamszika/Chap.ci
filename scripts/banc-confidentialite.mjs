#!/usr/bin/env node
/* =============================================================================
 *  BANC DE LA POLITIQUE DE CONFIDENTIALITÉ — le texte contre le code (19/09/2026)
 *
 *      npm run banc:confidentialite
 *
 *  POURQUOI CE BANC EXISTE
 *
 *  Le 01/08/2026, la politique de confidentialité annonçait, en gras, que
 *  l'analyse anti-nudité des photos avait lieu « entièrement sur votre
 *  appareil » et que la photo « n'est transmise à aucun service extérieur ».
 *  C'était VRAI ce jour-là.
 *
 *  Le 04/09/2026, le chantier « le poids sur 3G » a déplacé ce contrôle sur le
 *  serveur — qui envoie la photo à un prestataire d'analyse d'images — et l'a
 *  ajouté à l'application, qui n'en avait aucun. Le code a changé sous le
 *  texte. Le texte, lui, n'a pas bougé : il a continué d'affirmer le contraire
 *  de ce que faisait le programme, pendant QUINZE JOURS, sur une page publique
 *  que Google Play exige exacte.
 *
 *  Personne ne l'a vu. Ni le bureau qui a écrit le chantier, ni les bancs :
 *  aucun ne lisait le texte publié. ⚖️ Le Juriste a signalé l'écart le 01/09 —
 *  trois jours AVANT qu'il n'existe — en se trompant de raison : il croyait
 *  l'application dépourvue de tout filtre, alors que le filtre est là et qu'il
 *  est distant. Un signalement juste par accident ne protège de rien.
 *
 *  ⚠️ CE QUE CE BANC GARDE : que le texte ne fasse aucune promesse que le code
 *  dément. Il lit les DEUX et les confronte. Il ne juge pas la qualité
 *  juridique du texte — ça, c'est le travail d'un juriste humain.
 *
 *  CE QU'IL NE VOIT PAS, et qu'il faut savoir avant de le croire :
 *    · il lit le texte du DÉPÔT, pas celui qui est en ligne — un déploiement
 *      oublié le laisserait vert sur un site qui ment encore ;
 *    · il ne vérifie que les promesses liées aux PHOTOS ; les autres sections
 *      (localisation, cookies, messages) ne sont pas confrontées au code ;
 *    · une promesse formulée autrement que dans la liste ci-dessous lui
 *      échappe. Il attrape la récidive exacte, pas l'imagination.
 * ===========================================================================*/
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const lire = (p) => readFileSync(join(racine, p), 'utf8')

/** Les deux apostrophes, les guillemets ET LES ACCENTS se valent ici : le texte
 *  publié utilise la typographie française, les phrases cherchées ci-dessous
 *  sont écrites à plat. Comparer sans normaliser, c'est rater la phrase qu'on
 *  cherche.
 *
 *  ⚠️ La première version de ce banc oubliait les accents. Les quatre
 *  vérifications « la phrase interdite a disparu » passaient donc au vert
 *  QUOI QU'IL ARRIVE — « entièrement sur votre appareil » ne pouvait pas
 *  correspondre à `entierement sur votre appareil`. Un banc qui cherche une
 *  chaîne qu'il ne peut pas trouver ne dit pas « absente » : il ne dit rien,
 *  en vert. C'est la panne même qu'il est censé attraper, reproduite dans son
 *  propre code. La preuve qu'il voit maintenant est plus bas : on lui donne le
 *  texte d'avant correction et il doit le refuser. */
const plat = (s) => s
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’‘`]/g, "'").replace(/[«»"]/g, '').replace(/\s+/g, ' ').toLowerCase()

let rouges = 0
const dire = (ok, texte, detail = '') => {
  if (!ok) rouges++
  console.log(`  ${ok ? '✅' : '❌'} ${texte}${detail ? '  · ' + detail : ''}`)
}

/* ⚠️ ON RETIRE LES COMMENTAIRES AVANT DE LIRE. Le fichier explique, en
 * commentaire, quelles phrases sont interdites et pourquoi — en les citant.
 * Un banc qui lit le source brut retrouve donc « entièrement sur votre
 * appareil » dans la note qui raconte qu'on l'a SUPPRIMÉE, et condamne la
 * correction elle-même. Ce qui engage Chap.ci, c'est le texte que le visiteur
 * lit ; les commentaires ne sont pas publiés. */
const sansCommentaires = (s) => s.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ')
const confidentialite = plat(sansCommentaires(lire('src/pages/Privacy.tsx')))
const serveur = lire('server/index.php')

function fichiers(dir, ext) {
  const out = []
  for (const e of readdirSync(join(racine, dir))) {
    const p = join(dir, e)
    if (statSync(join(racine, p)).isDirectory()) out.push(...fichiers(p, ext))
    else if (ext.test(e)) out.push(p)
  }
  return out
}
const contenuDe = (dir, ext) => fichiers(dir, ext).map((p) => lire(p)).join('\n')

console.log('\nBANC DE LA POLITIQUE DE CONFIDENTIALITÉ')
console.log('─'.repeat(72))

/* ── 1. Le banc sait-il seulement lire ? ────────────────────────────────────
 * Sans ces trois-là, tous les « ✅ » qui suivent ne prouveraient qu'une chose :
 * que le banc n'a rien trouvé parce qu'il ne cherche nulle part. */
console.log('\n── ⚠️ Le banc sait-il voir une promesse ? (sinon il ne prouve rien)')
dire(!confidentialite.includes('cette phrase na jamais ete ecrite nulle part'),
  'une phrase inventée n’est PAS trouvée dans le texte')
dire(confidentialite.includes('analyse automatique des photos'),
  'mais le paragraphe sur les photos, lui, est bien trouvé')
dire(confidentialite.length > 5000, 'et le texte lu fait bien plusieurs milliers de caractères',
  `${confidentialite.length} caractères`)

/* LA VÉRIFICATION QUI DONNE SA VALEUR À TOUTES LES AUTRES : le texte tel qu'il
 * était du 01/08 au 19/09/2026, recopié ici mot pour mot. Le banc DOIT y
 * retrouver chacune des phrases qu'il interdit plus bas. Sans cela, un « ✅ la
 * phrase a disparu » ne voudrait rien dire — c'est très exactement l'erreur que
 * la première version de ce banc a commise. */
const TEXTE_DAVANT = plat(`
  Analyse automatique des photos, sur votre téléphone. Lorsque vous ajoutez une photo à
  une annonce, elle est examinée par un programme de reconnaissance d’images afin d’écarter les
  contenus à caractère sexuel, que nos règles interdisent. Cet examen a lieu entièrement sur
  votre appareil, avant tout envoi : la photo n’est transmise à aucun service extérieur pour
  être analysée, aucun résultat d’analyse n’est conservé, et rien n’en est déduit sur vous.
  Le programme de reconnaissance est livré avec l’application : il ne va rien chercher sur
  Internet, et il fonctionne même hors connexion.
  Vos données de compte, vos annonces, vos photos et vos messages, eux, ne quittent pas la
  Côte d’Ivoire.
`)

/* ── 2. Ce que le CODE fait vraiment ────────────────────────────────────────
 * Lu dans les fichiers, pas supposé. Si l'un de ces faits change, les
 * exigences de la section 3 changent avec — et le banc le dira. */
console.log('\n── Ce que le code fait vraiment aujourd’hui')
const sortiesVision = [...serveur.matchAll(/\$config\['vision_url'\]/g)].length
dire(sortiesVision >= 1, `le serveur envoie bien des images à un prestataire extérieur`,
  `${sortiesVision} appel(s) à vision_url`)

const siteControleServeur = contenuDe('src', /\.tsx?$/).includes('/photos/controle')
dire(siteControleServeur, 'le SITE peut faire contrôler ses photos par le serveur')

const appControleServeur = contenuDe('flutter_app/lib', /\.dart$/).includes('/photos/controle')
dire(appControleServeur, 'l’APPLICATION aussi')

/* Le modèle local (5,4 Mo, NSFW.js) n'existe que sur le site : il est importé
 * par des fichiers TypeScript. Si un jour l'application en embarque un, cette
 * ligne passe au rouge et le texte pourra de nouveau promettre du hors-ligne. */
const appModeleLocal = /nsfw|tflite|mlkit|tensorflow/i.test(lire('flutter_app/pubspec.yaml'))
dire(!appModeleLocal, 'l’application n’embarque AUCUN modèle d’analyse local',
  appModeleLocal ? 'une dépendance d’analyse est apparue : le texte peut changer' : 'donc pas d’analyse hors connexion')

/* ── 3. Les promesses que le code dément ────────────────────────────────────
 * Chacune a été VRAIE le 01/08/2026. C'est ce qui les rend dangereuses : elles
 * ne se signalent pas, elles vieillissent. */
console.log('\n── Le texte ne promet rien que le code dément')
const interdites = [
  ['entierement sur votre appareil',
   'le contrôle passe par le serveur : il n’est plus « entièrement » local',
   siteControleServeur || appControleServeur],
  ["n'est transmise a aucun service exterieur",
   'la photo EST transmise quand le moteur est allumé',
   sortiesVision >= 1],
  ["livre avec l'application",
   'l’application n’embarque aucun modèle',
   !appModeleLocal],
  ['fonctionne meme hors connexion',
   'sans réseau, l’application ne contrôle rien du tout',
   !appModeleLocal],
  ['vos photos et vos messages, eux, ne quittent pas',
   'promesse catégorique qu’un simple réglage dément',
   sortiesVision >= 1],
]
for (const [phrase, pourquoi, applicable] of interdites) {
  if (!applicable) { console.log(`  ➖ « ${phrase} » — sans objet aujourd’hui`); continue }
  // D'ABORD : le banc sait-il trouver cette phrase quand elle EST là ? On la
  // lui donne dans le texte d'avant. S'il ne l'y voit pas, son verdict sur le
  // texte d'aujourd'hui ne vaut rien, et on le dit au lieu de rendre un vert.
  if (!TEXTE_DAVANT.includes(phrase)) {
    rouges++
    console.log(`  ❌ « ${phrase} » — LE BANC NE SAIT PAS CHERCHER CETTE PHRASE`)
    console.log('       (introuvable même dans le texte d’avant, où elle figurait :')
    console.log('        son verdict sur le texte actuel ne prouve rien)')
    continue
  }
  dire(!confidentialite.includes(phrase), `« ${phrase} » a disparu du texte`, pourquoi)
}

/* ── 4. Ce que le texte DOIT dire ───────────────────────────────────────────
 * Retirer une phrase fausse ne suffit pas : la loi n° 2013-450, que la page
 * cite elle-même, demande que la personne sache À QUI ses données vont. */
console.log('\n── Le texte dit ce que la loi demande qu’il dise')
dire(confidentialite.includes('analyse d\'images'),
  'le prestataire d’analyse d’images est nommé parmi les destinataires')
dire(confidentialite.includes('chap.ci ecrit l\'annonce'),
  '« Chap.ci écrit l’annonce » est déclaré : il envoie la photo au même endroit')
dire(confidentialite.includes("n'est pas examinee automatiquement"),
  'le cas où la photo n’est PAS examinée est dit, au lieu d’être promis')
dire(confidentialite.includes('aucun resultat d\'analyse n\'est conserve'),
  'et ce qui reste vrai — aucun résultat conservé — est toujours dit')

console.log('\n' + '═'.repeat(72))
console.log('Non couvert : le texte EN LIGNE (ce banc lit le dépôt), les sections')
console.log('autres que les photos, et la valeur juridique — à faire relire par un')
console.log('juriste humain avant publication.')
if (rouges) {
  console.log(`\n⛔ ${rouges} écart(s) entre ce que le site promet et ce qu’il fait.`)
  console.log('   Une page publique que Google Play exige exacte ne se corrige pas')
  console.log('   « quand on aura le temps » : c’est elle qui engage.')
  process.exit(1)
}
console.log('\n✅ Le texte publié et le code disent la même chose.')
