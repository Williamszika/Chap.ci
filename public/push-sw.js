// =============================================================================
//  Le service worker des notifications push.
//
//  Ce fichier N'EST PAS le service worker : il y est importé. Workbox génère
//  `sw.js` à chaque build (cache des fichiers, mise à jour automatique) et
//  l'écraserait. `importScripts('push-sw.js')` — déclaré dans vite.config.ts —
//  y ajoute ces trois écouteurs sans que Workbox ait à les connaître.
//
//  Un service worker tourne SANS page ouverte. C'est ce qui permet à une
//  notification d'arriver téléphone verrouillé, navigateur fermé, application
//  jamais rouverte depuis trois jours.
//
//  Rien ici ne peut lire `localStorage` : ce code ne s'exécute pas dans la page.
//  La session voyage donc par le cookie (`credentials: 'include'`), ce qui
//  marche parce que le cookie de session de Chap.ci est un cookie HttpOnly posé
//  sur le même domaine.
// =============================================================================

/* global self, clients */

/**
 * Un message est arrivé.
 *
 * Le navigateur EXIGE qu'une notification soit affichée à chaque réveil : s'il
 * n'en voit pas, il affiche lui-même « Ce site a été mis à jour en arrière-plan »
 * et finit par retirer l'autorisation. On affiche donc toujours quelque chose,
 * même si la charge est illisible.
 */
self.addEventListener('push', (event) => {
  let d = {}
  try { d = event.data ? event.data.json() : {} } catch (e) { d = {} }

  const titre = d.titre || 'Chap.ci'
  const options = {
    body: d.corps || 'Vous avez du nouveau sur Chap.ci.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    lang: 'fr',
    // Même étiquette = la notification REMPLACE la précédente au lieu de
    // s'empiler. Dix messages du même acheteur font une ligne, pas dix.
    tag: d.tag || 'chapci',
    renotify: true,
    data: { lien: d.lien || '/' },
  }
  event.waitUntil(self.registration.showNotification(titre, options))
})

/**
 * On a cliqué dessus.
 *
 * Si une fenêtre Chap.ci est déjà ouverte, on la reprend et on la déplace — pas
 * de deuxième onglet. Sinon on en ouvre une.
 */
/**
 * Le lien d'une notification, RAMENÉ DE FORCE sur chap.ci.
 *
 * ⚠️ DEUXIÈME VERROU, ET IL SERT VRAIMENT. Le serveur refuse déjà les liens
 * qui sortent du domaine, mais il l'a mal fait un temps : « //evil.com » y
 * passait, parce qu'il commence bien par une barre. Un lien de ce genre, remis
 * tel quel à `openWindow()`, emmène l'utilisateur sur un autre site — avec une
 * notification signée Chap.ci. C'est la forme même de l'hameçonnage.
 *
 * Un correctif serveur protège l'avenir ; il ne nettoie pas les lignes déjà
 * enregistrées. Ce garde-fou-ci les couvre aussi : tout ce qui ne retombe pas
 * sur notre origine est ramené à l'accueil.
 */
function lienInterne(brut) {
  try {
    const u = new URL(brut, self.location.origin)
    return u.origin === self.location.origin ? u.pathname + u.search + u.hash : '/'
  } catch (e) {
    return '/'
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const lien = lienInterne(
    (event.notification.data && event.notification.data.lien) || '/')
  event.waitUntil((async () => {
    const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const f of fenetres) {
      if ('focus' in f) {
        await f.focus()
        // `navigate` échoue sur certains navigateurs (et dans la WebView) :
        // reprendre la fenêtre reste mieux que ne rien faire.
        if ('navigate' in f) { try { await f.navigate(lien) } catch (e) { /* tant pis */ } }
        return
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(lien)
  })())
})

/**
 * Le navigateur a changé l'abonnement dans notre dos.
 *
 * Chrome et Firefox renouvellent périodiquement l'adresse chez le relais. Sans
 * ce réabonnement, la personne cesse de recevoir des notifications du jour au
 * lendemain, sans rien avoir fait et sans que rien ne le signale — la panne la
 * plus difficile à voir qui soit.
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const ancienne = event.oldSubscription || await self.registration.pushManager.getSubscription()
      const cle = ancienne && ancienne.options && ancienne.options.applicationServerKey
      if (!cle) return
      const neuve = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: cle,
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(neuve),
      })
    } catch (e) { /* la page se réabonnera au prochain passage */ }
  })())
})
