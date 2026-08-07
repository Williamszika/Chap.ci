// =============================================================================
//  Banc d'essai du service worker des notifications.
//
//    node scripts/push-sw-banc.mjs
//
//  Ce que ce banc protège : le CONTRAT entre le PHP et le JavaScript. Le serveur
//  chiffre un objet `{titre, corps, lien, type, tag}` ; `public/push-sw.js` le
//  lit. Si l'un renomme un champ, rien n'échoue nulle part — la notification
//  arrive simplement vide, ou ne mène nulle part, et personne ne le découvre
//  avant qu'un vendeur se plaigne d'avoir raté une vente.
//
//  On ne lance pas de navigateur : on fabrique un faux `self` de service worker,
//  on y charge le vrai fichier, et on lui envoie un vrai événement `push`.
// =============================================================================
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const ici = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(ici, '..', 'public', 'push-sw.js'), 'utf8')

const vert = '\x1b[32m', rouge = '\x1b[31m', gris = '\x1b[90m', zero = '\x1b[0m'
let echecs = 0
function ok(quoi, obtenu, attendu = true) {
  const egal = JSON.stringify(obtenu) === JSON.stringify(attendu)
  if (egal) { console.log(`  ${vert}✓${zero} ${quoi}`); return }
  echecs++
  console.log(`  ${rouge}✗${zero} ${quoi}`)
  console.log(`     ${gris}attendu :${zero} ${JSON.stringify(attendu)}`)
  console.log(`     ${gris}obtenu  :${zero} ${JSON.stringify(obtenu)}`)
}

/** Un faux service worker : juste ce que `push-sw.js` touche réellement. */
function fauxWorker() {
  const ecouteurs = {}
  const montrees = []
  const ouvertes = []
  const fenetres = []
  const self = {
    addEventListener: (nom, fn) => { ecouteurs[nom] = fn },
    registration: {
      showNotification: (titre, options) => { montrees.push({ titre, options }); return Promise.resolve() },
      pushManager: { getSubscription: async () => null, subscribe: async () => ({}) },
    },
    clients: {
      matchAll: async () => fenetres,
      openWindow: async (url) => { ouvertes.push(url) },
    },
  }
  return { self, ecouteurs, montrees, ouvertes, fenetres }
}

async function declenche(ecouteurs, nom, evenement) {
  const attentes = []
  evenement.waitUntil = (p) => attentes.push(p)
  ecouteurs[nom](evenement)
  await Promise.all(attentes)
}

function charge(w) {
  const contexte = vm.createContext({ self: w.self, clients: w.self.clients, fetch: async () => ({}) })
  vm.runInContext(source, contexte)
  ok('les trois écouteurs sont posés', Object.keys(w.ecouteurs).sort(),
     ['notificationclick', 'push', 'pushsubscriptionchange'])
}

console.log('\nService worker des notifications — contrat avec le serveur PHP\n')

// ---- 1. La charge que le serveur envoie vraiment --------------------------
// Copiée telle quelle de push_vider() dans server/index.php.
{
  const w = fauxWorker(); charge(w)
  const duServeur = {
    titre: 'Nouveau message',
    corps: 'Yao Kouassi — « Le frigo est-il toujours disponible ? »',
    lien: 'https://chap.ci/#/messages/abc123',
    type: 'message',
    tag: 'message',
  }
  await declenche(w.ecouteurs, 'push', { data: { json: () => duServeur } })
  ok('une notification est affichée', w.montrees.length, 1)
  const n = w.montrees[0]
  ok('le titre vient du serveur', n.titre, 'Nouveau message')
  ok('le corps vient du serveur', n.options.body, duServeur.corps)
  ok('le lien est rangé pour le clic', n.options.data.lien, duServeur.lien)
  ok('l’étiquette regroupe les messages entre eux', n.options.tag, 'message')
  ok('la langue est le français', n.options.lang, 'fr')
  ok('une icône est fournie (sinon Android met la sienne, grise)',
     typeof n.options.icon === 'string' && n.options.icon.length > 0)
}

// ---- 2. Une charge illisible ne doit PAS rester muette --------------------
// Le navigateur exige une notification à chaque réveil. Sans elle, il affiche
// « Ce site a été mis à jour en arrière-plan », puis retire l'autorisation.
{
  const w = fauxWorker(); charge(w)
  await declenche(w.ecouteurs, 'push', { data: { json: () => { throw new Error('charge cassée') } } })
  ok('une charge cassée affiche quand même quelque chose', w.montrees.length, 1)
  ok('avec le nom du site à défaut de mieux', w.montrees[0].titre, 'Chap.ci')
  ok('et un corps non vide', w.montrees[0].options.body.length > 0)

  const w2 = fauxWorker(); charge(w2)
  await declenche(w2.ecouteurs, 'push', { data: null })
  ok('un réveil sans données affiche aussi quelque chose', w2.montrees.length, 1)
}

// ---- 3. Le clic ------------------------------------------------------------
{
  const w = fauxWorker(); charge(w)
  let fermee = false
  await declenche(w.ecouteurs, 'notificationclick', {
    notification: { close: () => { fermee = true }, data: { lien: 'https://chap.ci/#/messages/abc' } },
  })
  ok('la notification se ferme au clic', fermee)
  ok('aucune fenêtre ouverte → on en ouvre une', w.ouvertes, ['https://chap.ci/#/messages/abc'])
}
{
  const w = fauxWorker(); charge(w)
  let vise = false, allee = null
  w.fenetres.push({ url: 'https://chap.ci/', focus: async () => { vise = true }, navigate: async (u) => { allee = u } })
  await declenche(w.ecouteurs, 'notificationclick', {
    notification: { close: () => {}, data: { lien: 'https://chap.ci/#/messages/abc' } },
  })
  ok('une fenêtre déjà ouverte est reprise, pas doublée', vise && w.ouvertes.length === 0)
  ok('… et elle est amenée sur le bon écran', allee, 'https://chap.ci/#/messages/abc')
}
{
  // Certains navigateurs n'ont pas `navigate` : reprendre la fenêtre doit
  // quand même marcher, sans lever.
  const w = fauxWorker(); charge(w)
  let vise = false
  w.fenetres.push({ url: 'https://chap.ci/', focus: async () => { vise = true } })
  await declenche(w.ecouteurs, 'notificationclick', {
    notification: { close: () => {}, data: { lien: 'https://chap.ci/#/compte' } },
  })
  ok('sans `navigate`, la fenêtre est tout de même reprise', vise)
}

console.log('')
if (echecs === 0) { console.log(`${vert}Banc vert — le service worker et le serveur parlent la même langue.${zero}\n`); process.exit(0) }
console.log(`${rouge}${echecs} vérification(s) en échec.${zero}\n`); process.exit(1)
