// =============================================================================
//  LE CATALOGUE PART AVANT REACT.
//
//  Mesuré au banc du front le 08/09/2026 : le DOM est prêt à 1,7 s, mais la
//  première carte n'apparaît qu'à 3,0-3,3 s sur Explorer, sur une annonce et
//  sur une boutique. Entre les deux, le téléphone télécharge 152 Ko de
//  JavaScript, les exécute sur un processeur d'entrée de gamme — ET SEULEMENT
//  ENSUITE demande les annonces au serveur. Sur une 3G d'Abidjan, cet
//  aller-retour ajouté à la fin se paie en écran vide.
//
//  Ce fichier lance la demande pendant que le JavaScript se télécharge. Quand
//  React démarre, la réponse est là ou presque.
//
//  ⚠️ POURQUOI UN FICHIER, ET PAS TROIS LIGNES DANS index.html : la politique
//  de sécurité que Vite grave dans la page interdit les scripts en ligne
//  (`script-src 'self'`, sans `'unsafe-inline'`). Un premier essai les avait
//  mis dans le HTML : le navigateur a refusé de les exécuter, silencieusement
//  pour l'utilisateur — c'est le banc qui l'a vu, en comptant une erreur de
//  plus sur chaque page.
//
//  Trois précautions :
//    · la route est PUBLIQUE et en lecture seule ; `credentials` reprend le
//      cookie de session s'il existe, comme le fait `req()` dans lib/php.ts ;
//    · un échec ne casse rien — on rend null, et le site refait l'appel
//      normalement, exactement comme avant ce fichier ;
//    · la promesse se consomme UNE fois (AppContext la remet à null), pour
//      qu'un rechargement volontaire reparte bien vers le serveur.
//
//  Si vous changez la taille de page ici, changez-la aussi dans
//  `AppContext.refresh` : les deux doivent demander la MÊME adresse, sinon le
//  travail est fait deux fois.
// =============================================================================
try {
  window.__chapciAnnonces = fetch('/api/listings?limit=100&offset=0', { credentials: 'include' })
    .then(function (r) { return r.ok ? r.json() : null })
    .catch(function () { return null })
} catch (e) {
  window.__chapciAnnonces = null
}
