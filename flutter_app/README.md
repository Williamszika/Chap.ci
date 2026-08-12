# Chap.ci — application Flutter

La version **Flutter** de l'application Chap.ci. Objectif : **reprendre à terme
tout ce que fait le site** (parité complète), puis remplacer l'application
actuelle (Capacitor / v1.18) par une **mise à jour** sur le même compte Play
Store.

> Elle parle au **même serveur** que le site — l'API PHP existante sur
> `https://chap.ci/api`. Il n'y a **pas** de nouveau backend : les comptes, les
> annonces et les messages sont les mêmes qu'aujourd'hui.

---

## Ce qui est déjà là (premier socle)

| Fichier | Rôle |
|---|---|
| `lib/theme.dart` | Les couleurs de marque (orange `#F77F00`, vert `#009E60`, crème), reprises du site |
| `lib/format.dart` | Prix en FCFA à la française (espaces insécables), temps écoulé |
| `lib/api/api_client.dart` | Client de l'API PHP : jeton « Bearer », garde de 15 s, messages d'erreur en français |
| `lib/api/auth_social.dart` | Connexion Google / Facebook (moitié serveur), même routes que le site |
| `lib/api/push_natif.dart` | Push **natif** (FCM) — moitié app câblée, en veille tant que la console n'est pas configurée (voir plus bas) |
| `lib/api/admin.dart` | Le **tableau de bord** côté client : contrôle admin, déverrouillage, statistiques |
| `lib/screens/admin/tableau_bord_screen.dart` | **Tableau de bord** (réservé au Patron) — verrou + aperçu (visiteurs, compteurs, parcours, 14 jours) |
| `lib/screens/admin/moderation_screen.dart` | **Modération** — la file des signalements ; classer / masquer / supprimer en un geste |
| `lib/screens/admin/utilisateurs_screen.dart` | **Utilisateurs** — chercher un compte, le restreindre ou le bloquer |
| `lib/screens/admin/annonces_screen.dart` | **Annonces** (admin) — toutes les annonces ; masquer / démasquer / retirer |
| `lib/screens/admin/sauvegardes_screen.dart` | **Sauvegardes** — liste des exports du serveur + « créer et partager » un export complet |
| `lib/screens/admin/newsletter_screen.dart` | **Newsletter** — les abonnés (combien, qui, depuis quand) + export **CSV** partageable |
| `lib/screens/admin/campagne_screen.dart` | **Campagne** — écrire un e-mail et l'envoyer à tous les abonnés, par lots, avec confirmation et barre de progression |
| `lib/screens/admin/moderateurs_screen.dart` | **Modérateurs** (propriétaire) — ajouter un modérateur, cocher ses permissions, le bloquer / retirer ; code d'accès affiché une seule fois |
| `lib/screens/admin/contact_screen.dart` | **Messages de contact** — la boîte du formulaire ; lire, répondre (avec brouillon proposé), marquer traité, supprimer |
| `lib/screens/admin/avis_screen.dart` | **Avis** — les avis sur les vendeurs ; filtre des notes basses, suppression d'un avis abusif |
| `lib/screens/admin/commandes_screen.dart` | **Commandes** — le suivi des ventes ; résumé (nombre + encaissé), filtres par statut, articles et parties |
| `lib/screens/admin/conversations_screen.dart` | **Conversations** — supervision des échanges ; parties, annonce, nombre de messages, dernier message, recherche |
| `lib/screens/admin/emails_screen.dart` | **E-mails / SMTP** (propriétaire) — régler l'envoi des e-mails du site + envoyer un e-mail de test |
| `lib/widgets/social_buttons.dart` | Boutons « Continuer avec Google / Facebook » |
| `lib/api/models.dart` | Le modèle `Listing` (mêmes clés JSON que le site) + résolution des images |
| `lib/widgets/listing_card.dart` | La carte d'annonce |
| `lib/screens/home_screen.dart` | **Accueil** — en-tête, recherche, **écran publicitaire** animé, dernières annonces |
| `lib/widgets/ecran_pub.dart` | **Écran publicitaire** — la bannière noire animée de l'accueil ; rotation des pubs, 5 styles, animations, comptage vues/clics, auto-promo |
| `lib/api/pub.dart` | Client de l'écran de pub (`GET /ads/active`, comptage `view`/`click`) |
| `lib/data/categories.dart` | Les 16 catégories (id + libellé + emoji), comme le site |
| `lib/screens/browse_screen.dart` | **Explorer** — recherche + filtres (catégorie, état, commune, tri) |
| `lib/screens/listing_detail_screen.dart` | **Fiche annonce** — photos, prix, description, vendeur, vue comptée |
| `lib/screens/account_screen.dart` | **Compte / Connexion** |
| `lib/screens/register_screen.dart` | **Inscription** — nom, e-mail, mot de passe ≥ 8, consentement |
| `lib/screens/mon_compte.dart` | **Mon compte** — identité + photo + mes annonces (état, vues, masquer/supprimer) |
| `lib/screens/modifier_profil_screen.dart` | **Modifier le profil** — nom, bio, photo |
| `lib/api/messaging.dart` | Conversations & messages (mêmes routes que le site) |
| `lib/screens/messages_screen.dart` | **Messages** — la liste des conversations |
| `lib/screens/conversation_screen.dart` | **Discussion** — le fil, envoi, relève toutes les 4 s |
| `lib/screens/publier_screen.dart` | **Publier** — photos (≥ 3), catégorie **et sous-catégorie**, prix, localisation, + le formulaire détaillé |
| `lib/screens/formulaire_dynamique.dart` | Le **moteur** qui affiche le formulaire d'une sous-catégorie (puces, bascules, alertes, blocage) |
| `lib/data/formulaires/` | Le **contrat** (`schema.dart`), les **couleurs** (`couleurs.dart` — pastilles + palettes du métier + variantes), les données par catégorie (`mode.dart`…) et le **registre** (`registre.dart`) |
| `lib/screens/verifier_email_screen.dart` | **Confirmer l'e-mail** — code à 6 chiffres (mur avant de publier) |
| `lib/screens/verifier_2fa_screen.dart` | **2FA — connexion** : le défi à 6 chiffres (ou code de secours) après le mot de passe |
| `lib/screens/securite_2fa_screen.dart` | **2FA — gestion** : activer (QR + clé + codes de secours), désactiver |
| `lib/favoris.dart` | Les favoris (local + synchro compte), un ChangeNotifier |
| `lib/widgets/bouton_favori.dart` | Le cœur sur la carte et la fiche |
| `lib/notifications.dart` | La **cloche** : modèle + client des notifications du compte, un ChangeNotifier (compteur, liste, lu, effacer) |
| `lib/screens/notifications_screen.dart` | **Notifications** — la liste, le point des non-lues, balayer pour effacer |
| `lib/widgets/cloche_notifs.dart` | La cloche de l'en-tête avec la pastille du nombre de non-lues |
| `lib/screens/favoris_screen.dart` | **Mes favoris** |
| `lib/data/locations.dart` | Tout le pays : 33 régions, les villes, les 13 communes d'Abidjan + les aides (`citiesByRegion`, `locationLabel`, rapprochement d'un nom capté) |
| `lib/data/coords.dart` | Coordonnées GPS approximatives des villes / communes — position de repli quand le vendeur n'active pas son GPS |
| `lib/api/geo.dart` | GPS (position précise, `geolocator`) + géocodage inversé (coordonnées → région / ville / commune) |
| `lib/widgets/selecteur_lieu.dart` | Le **sélecteur de lieu** : bouton GPS + choix manuel en cascade Région → Ville → Commune |
| `lib/main.dart` | La coquille + la barre du bas (Accueil · Explorer · Compte) |

---

## Construire l'application (sur la machine du Patron)

Ces étapes se font **sur votre machine**, là où Flutter et la clé de signature
sont installés. Cet environnement de développement n'a ni Flutter ni le
keystore — et **c'est voulu** : la clé de signature ne quitte jamais votre poste.

### 1. Installer Flutter (une seule fois)

<https://docs.flutter.dev/get-started/install> — puis vérifier avec :

```bash
flutter doctor
```

### 2. Préparer `android/` et `ios/` — **une seule commande**

Le dépôt ne contient **que** le code Dart (`lib/`). Les dossiers `android/` et
`ios/` se régénèrent — comme pour le site. Un script fait tout, depuis ce dossier
`flutter_app/` :

```bash
dart run tool/preparer_plateformes.dart
```

Il régénère `android/` et `ios/` PUIS y applique toute la configuration Chap.ci,
sans qu'on ait à toucher un fichier à la main :

- **identifiant `ci.chap.app`** — le MÊME que l'app actuelle sur les stores, pour
  que ce soit une **mise à jour** et non une nouvelle app (applicationId Android
  ET bundle identifier iOS) ;
- **Android** : minSdk 22 · targetSdk 35 ; **iOS** : nom + permissions ;
- le **nom affiché « Chap.ci »** et les **autorisations** réellement utilisées sur
  les deux plateformes : Internet, appareil photo (`image_picker`), position fine
  et grossière (`geolocator`) ;
- l'**icône de lancement** (Android + iOS), générée depuis le logo
  (`assets/icon/` ; côté iOS, aplatie sur l'orange de la marque car iOS refuse
  toute transparence) ;
- **Android** : la **signature de production**, lue depuis `android/key.properties`
  (voir §3). **iOS** se signe dans Xcode, sur un Mac.

Le script est **ré-exécutable** sans risque (relancez-le après tout changement de
dépendances). Détails dans `tool/preparer_plateformes.dart`.

> La position n'est **jamais** suivie en arrière-plan : elle n'est lue qu'au
> moment où le vendeur tape sur « Activer ma position ». Autorisation refusée →
> le bouton GPS l'explique poliment et le vendeur choisit son lieu à la main.

### 3. Construire et publier l'app Android (sur VOTRE machine)

⚠️ **Le keystore ne quitte jamais votre machine.** Aucun bureau, aucun agent, aucun
prestataire n'a de raison de le demander — c'est le sujet de la section « Les
secrets » du `CLAUDE.md`.

1. **Le keystore.** Utilisez **le même** keystore que celui qui a signé la
   dernière version (v1.19). Le Play Store **refuse** une mise à jour signée par
   une autre clé. (N'en créez pas un nouveau, sauf à passer par la réinitialisation
   de clé de la Play Console — une autre histoire.)

2. **Le fichier `key.properties`.** Copiez le modèle et remplissez-le avec le
   chemin et les mots de passe de VOTRE keystore :

   ```bash
   cp tool/key.properties.exemple android/key.properties
   ```

   Ni ce fichier, ni le `.jks` n'entrent dans Git (`android/` est ignoré).

3. **Le versionCode.** Il DOIT dépasser le dernier publié (**20** pour la v1.19).
   Il se règle dans `pubspec.yaml`, champ `version` : `1.20.0+21` = versionName
   `1.20.0`, versionCode `21`. Puis mettez à jour `store/APP-VERSIONS.md`.

4. **L'AAB à déposer :**

   ```bash
   flutter build appbundle --release
   ```

   Il sort dans `build/app/outputs/bundle/release/app-release.aab`. C'est ce
   fichier qu'on téléverse dans la Play Console (production ou test fermé).

### 4. Construire et publier l'app iOS (sur un Mac)

iOS se construit **uniquement sur un Mac**, avec Xcode et un compte **Apple
Developer**. Les secrets Apple — certificats, profils de provisionnement,
identifiants App Store Connect — ne quittent jamais votre machine (même règle que
le keystore).

1. Ouvrez `ios/Runner.xcworkspace` dans Xcode → onglet **Signing & Capabilities**
   → choisissez votre **équipe (Team)**. Le *bundle identifier* est déjà
   `ci.chap.app` (posé par le script).
2. `flutter build ipa` → l'archive part vers **App Store Connect** via Xcode
   (Organizer) ou **Transporter**.
3. Même règle de version : le numéro de build doit dépasser le précédent
   (`pubspec.yaml`, champ `version`).

`url_launcher` (bouton « En savoir plus » de l'écran publicitaire) fonctionne
sur le web sans configuration. Sur Android/iOS, après le `flutter create`, il
ouvre le navigateur par défaut ; aucune autorisation particulière n'est requise
pour un lien `https`. Si l'écran de pub ne trouve pas de navigateur, il n'insiste
pas (le clic est simplement compté).

**Compatibilité des tailles d'écran.** L'accueil (et les grilles d'annonces) est
mesuré du petit téléphone d'entrée de gamme (largeur 360) à la tablette (800) :
la grille passe toute seule de 2 à 4 colonnes, la bannière et le titre animé se
replient sans débordement. Rien n'est figé en pixels ; tout est en unités
relatives.

### 4. Lancer en développement (téléphone branché ou émulateur)

```bash
flutter run
```

### 5. Construire l'AAB signé (pour le Play Store)

```bash
flutter build appbundle
```

- La **signature** utilise votre keystore, déclaré dans `android/key.properties`
  (fichier **local**, jamais dans le dépôt) et lu par `android/app/build.gradle`.
  Le keystore et son mot de passe **restent chez vous**.
- Le **versionCode** doit être **supérieur au dernier téléversé** (20 pour la
  v1.19). Il est fixé par le `+21` de `version:` dans `pubspec.yaml` — à
  augmenter à chaque nouvelle version.

Le `.aab` produit se trouve dans `build/app/outputs/bundle/release/`.

---

## La suite (vers la parité complète avec le site)

Dans l'ordre où on les construira, écran par écran :

1. ~~**Fiche annonce** (détail) + suivi des vues~~ ✅ fait.
2. ~~**Recherche & filtres** (mot-clé, catégorie, état, commune, tri)~~ ✅ fait.
3. ~~**Publier une annonce (v1)**~~ ✅ photos (≥ 3), titre, catégorie, état, prix,
   négociable, commune (Abidjan), description, téléphone, livraison.
   ~~**Publier v2 — le moteur de formulaires par sous-catégorie**~~ ✅ : choix de
   la sous-catégorie, puces (choix unique/multiple), bascules, saisie libre,
   champs conditionnels (`when`), options dépendantes, bandeau d'alerte, et le
   **refus de publication** exigé par la loi ou la sécurité. Voir
   `lib/data/formulaires/`.
   **Les 15 catégories sont portées** — Mode & Beauté, Électronique, Véhicules,
   Maison, Alimentation, Animaux, Services, Emploi, Santé, Bébé & Enfant,
   Voyage, Loisirs, Scolaire, Matériel Pro et « À donner » — avec, à chaque
   fois, les garde-fous du terrain (le dossier administratif d'un véhicule, la
   chaîne du froid d'un poisson, les espèces protégées CITES, la vaccination
   d'un animal, le contrat écrit avant un départ à l'étranger…).
   **Une trentaine de réponses interdisent la publication** à travers tout le
   formulaire : produit éclaircissant, verrou BIOS d'un ordinateur, ivoire /
   trophée, bouteille de gaz abîmée, matelas à punaises, produit alimentaire
   périmé, poisson jamais réfrigéré, pesticide non homologué, espèce sauvage
   protégée, combat d'animaux, médicament hors pharmacie, promesse de guérison,
   anabolisant, siège auto accidenté, lit à barreaux non conforme, faux
   recrutement (frais au candidat), travail domestique d'un mineur, « visa
   garanti », passeport confisqué, passage clandestin (traite), arme à feu, kit
   scolaire gratuit de l'État revendu, manuel photocopié, dispositif médical
   réservé aux soignants, don payant (« payez juste le transport ») et don
   d'argent. Un banc de test (`test/formulaire_test.dart`) prouve les points
   sensibles ; `flutter analyze` passe à zéro.
   **La localisation couvre tout le pays** : 33 régions, leurs villes et les 13
   communes d'Abidjan (`lib/data/locations.dart`), choisies par un bouton
   **GPS** (position précise + retour à la région / ville / commune connue) ou à
   la main en cascade Région → Ville → Commune. Faute de GPS, l'annonce part
   quand même avec la position approximative de sa commune / ville
   (`lib/data/coords.dart`), pour que la distance s'affiche.
   **Le bloc couleurs / variantes est porté** (`couleurs.dart` + le moteur) :
   pastilles de la palette du métier (les quinze teintes générales, ou les
   carnations d'un fond de teint, ou les numéros d'une mèche), et pour chaque
   coloris coché **sa photo, son prix, ses détails et les tailles / pointures /
   longueurs qui lui restent** (`var_<Couleur>_<champ>`, comme le site). La
   **les 15 catégories** sont câblées de bout en bout, chacune avec la palette
   de son métier : les carnations d'un fond de teint, les numéros d'une mèche,
   le « gris sidéral » d'un téléphone, les essences de bois d'un meuble (teck,
   iroko, wengé), les pastels d'un vêtement bébé, l'« écaille » d'une monture de
   lunettes, le « kaki » d'un uniforme. Ce qui n'a pas de couleur le dit et
   guide plutôt la photo utile (l'œil et les branchies d'un poisson, la plaque
   d'une machine, jamais le passeport d'un candidat). Le chantier « Publier »
   est complet.
4. ~~**Inscription**~~ ✅ + ~~**confirmation d'e-mail**~~ ✅ (code à 6 chiffres, mur
   avant publication, câblé dans Mon compte et Publier). ~~Reste la **2FA** à la
   connexion.~~ ✅ **La double authentification est faite** : le défi à la
   connexion (code à 6 chiffres ou code de secours), et sa gestion dans Mon
   compte (activer avec un QR à scanner + la clé à recopier, les codes de
   secours à conserver, désactiver). Branchée sur `/auth/2fa/*` et
   `/auth/login` (`mfa_required`). Voir `lib/screens/verifier_2fa_screen.dart`
   et `lib/screens/securite_2fa_screen.dart`.
5. ~~**Mon compte**~~ ✅ mes annonces (état, vues, masquer/afficher, supprimer),
   identité, **édition du profil (nom, bio, photo)**.
6. ~~**Messagerie** acheteur ↔ vendeur~~ ✅ fait (liste, fil, envoi, relève 4 s ;
   « Contacter » sur la fiche ouvre la conversation).
7. **Notifications.** La **cloche in-app** est faite ✅ : la liste des
   notifications du compte (nouveau message, favori, annonce publiée, rappel),
   le badge du nombre de non-lues dans l'en-tête, l'ouverture qui marque lu, le
   balayage pour effacer, le « tout effacer » — tout branché sur les routes
   existantes du serveur (`/notifications`, `/notifications/count`,
   `/notifications/read`, `DELETE /notifications`). Voir `lib/notifications.dart`,
   `lib/screens/notifications_screen.dart`, `lib/widgets/cloche_notifs.dart`.
   **Reste le push natif** (réveiller le téléphone quand l'app est fermée) — c'est
   ce que la coque WebView ne pouvait pas faire. Il demande **Firebase Cloud
   Messaging** : un projet Firebase et le `google-services.json` (à créer dans la
   console, chez le Patron), le paquet `firebase_messaging`, et côté serveur une
   route qui enregistre le jeton FCM de l'appareil + un envoi FCM (le serveur
   sait déjà faire le Web Push VAPID des navigateurs ; le natif est un second
   canal). Rien de tout cela ne touche au keystore.
8. ~~**Tableau de bord** (réservé au Patron).~~ ✅ **Un premier aperçu est là** :
   l'entrée n'apparaît, dans Mon compte, que pour un compte admin ; elle ouvre
   un écran **verrouillé** (le code d'accès du site — le propriétaire peut le
   recevoir par e-mail), puis l'**aperçu** : visiteurs uniques (jour / 7 jours /
   moyenne), les grands compteurs (comptes, annonces, conversations, commandes,
   avis, newsletter, ventes en FCFA, signalements), **le parcours** (arrivés →
   inscrits → ont publié → ont vendu, sur 7 j / 30 j / depuis le début) et les
   14 derniers jours. Branché sur `/admin/check`, `/admin/unlock*`,
   `/admin/stats` (le jeton de déverrouillage voyage dans l'en-tête
   `X-Admin-Unlock`). La **modération** est portée : un bouton mène à la file
   des signalements (`/admin/reports`) où, d'un seul geste, on décide ET on
   agit sur l'annonce — **classer**, **masquer** (le vendeur est prévenu et
   peut corriger), **supprimer** (`POST /admin/reports/<id>`). Suivent les
   **utilisateurs** (chercher, restreindre, bloquer), les **annonces** (masquer /
   démasquer / retirer), les **sauvegardes** (liste des exports + « créer et
   partager ») et la **newsletter** : combien d'abonnés, qui, depuis quand, avec
   un export **CSV** partageable (`GET /newsletter`). Les **campagnes** ferment
   la boucle : écrire un e-mail et l'envoyer à tous les abonnés
   (`GET /admin/campaign/count`, `POST /admin/campaign/send`) — l'envoi part
   **par lots** (l'app boucle avec un décalage croissant, montre l'avancement et
   sait **reprendre** après une coupure), derrière une **confirmation** puisqu'on
   ne rappelle pas un e-mail parti. Les **modérateurs** (réservés au
   propriétaire) sont portés : ajouter quelqu'un, **cocher ses permissions**
   (annonces, utilisateurs, signalements, campagnes…), le bloquer ou le retirer
   (`GET`/`POST`/`DELETE /admin/moderators`, `POST /admin/moderators/block`) —
   c'est la seule façon prévue de créer un administrateur : le serveur tient à
   jour l'empreinte d'intégrité de la table `admins`, qu'une insertion directe
   ferait mentir (`admins_tampered`). Le code d'accès du modérateur n'est
   **affiché qu'une seule fois**, à sa création. Les **messages de contact**
   sont portés : la boîte du formulaire (non traités d'abord), qu'on lit et à
   laquelle on **répond** — l'e-mail part de `contact@chap.ci`, avec un
   **brouillon proposé** par le serveur selon le contenu du message
   (`GET`/`POST /admin/contact-messages`, `…/{id}/reply`, `…/{id}/suggest`) —
   avant de marquer traité ou de supprimer. Les **e-mails / SMTP**
   (réservés au propriétaire) sont portés : régler l'hôte, le port, SSL/TLS, la
   boîte d'envoi, puis **envoyer un e-mail de test** (`GET`/`POST /admin/smtp`,
   `POST /admin/test-email`) — le mot de passe est un secret, le serveur ne le
   renvoie jamais et l'app ne le garde pas. Les **avis** sur les vendeurs sont
   portés : les lire, mettre en avant les **notes basses** (≤ 2), et **supprimer**
   un avis abusif (`GET`/`DELETE /admin/reviews`). Les **commandes** sont portées
   (lecture seule, comme le site) : un résumé (nombre + montant **encaissé**, qui
   ne compte que les commandes finalisées), des filtres par statut, et pour
   chaque commande les articles, le total et les parties acheteur / vendeur
   (`GET /admin/orders`). Les **conversations** sont portées (supervision, en
   lecture seule) : qui parle à qui, sur quelle annonce, le nombre de messages
   et le dernier message, avec une recherche (`GET /admin/conversations`). Le
   tableau de bord de l'app fait désormais **tout ce que fait celui du site** ;
   ne reste, côté serveur, que l'idée d'un **journal de sécurité** détaillé (qui
   demanderait une nouvelle route). Voir
   `lib/screens/admin/tableau_bord_screen.dart`,
   `lib/screens/admin/moderation_screen.dart`,
   `lib/screens/admin/avis_screen.dart`,
   `lib/screens/admin/commandes_screen.dart`,
   `lib/screens/admin/conversations_screen.dart`,
   `lib/screens/admin/emails_screen.dart` et `lib/api/admin.dart`.

Tant que la parité n'est pas atteinte, **ne pas remplacer** l'app Play Store
actuelle : on ne livre en production que quand l'app Flutter fait au moins tout
ce que fait l'actuelle.

---

## Connexion Google & Facebook

Le **serveur sait déjà** les gérer (routes `POST /auth/google` avec
`{credential}` et `POST /auth/facebook` avec `{accessToken}` — les mêmes que le
site). Dans l'app, les boutons sont déjà là (`lib/widgets/social_buttons.dart`)
et la moitié serveur est câblée (`lib/api/auth_social.dart`). Il reste la moitié
**téléphone** — obtenir le jeton — qui demande une configuration console.

Pour activer, une fois les dossiers de plateforme générés :

1. **Paquets** : ajouter `google_sign_in` et `flutter_facebook_auth` à
   `pubspec.yaml`, puis `flutter pub get`.
2. **Google** : dans Google Cloud Console, créer un **client OAuth Android**
   avec le **SHA-1 de l'application** — lu dans la **Play Console → Intégrité de
   l'application**, JAMAIS dans le keystore — et un **client OAuth Web** dont
   l'ID sert de `serverClientId` (c'est lui que le serveur vérifie via
   `google_client_id`). Déposer le `google-services.json` dans `android/app/`.
3. **Facebook** : dans Facebook Developers, créer une app, y enregistrer le
   **key hash** de l'application, et mettre `facebook_app_id` +
   `facebook_client_token` dans `android/app/src/main/res/values/strings.xml`.
   ⚠️ Tant que ces valeurs manquent, l'app **ne construit pas** — n'ajoutez ce
   paquet qu'une fois la valeur en main.
4. **Brancher** : passer `AuthSocial.disponible` à `true` et, dans
   `SocialButtons._appui`, appeler la connexion native puis `avecGoogle(idToken)`
   / `avecFacebook(accessToken)`.

Tant que ce n'est pas fait, les boutons expliquent poliment qu'ils sont à
activer — l'app reste utilisable avec l'inscription par e-mail.

## Notifications push natives (FCM)

La **cloche in-app** est déjà là (voir plus haut). Ce qui reste, c'est le push
**natif** : réveiller le téléphone **quand l'app est fermée**. C'est le vrai
gain de Flutter sur l'ancienne coque WebView. Il passe par **Firebase Cloud
Messaging (FCM)**.

Le code de l'app est déjà écrit et **branché** (`lib/api/push_natif.dart`,
appelé au démarrage) : il enregistre le jeton de l'appareil auprès du serveur.
Il est simplement **en veille** (`PushNatif.disponible = false`) tant que les
quatre étapes ci-dessous ne sont pas faites — exactement comme la connexion
sociale. **Aucune** ne touche au keystore.

### 1. Le projet Firebase (console, chez le Patron)

1. Sur <https://console.firebase.google.com>, créez un projet (ou réutilisez
   celui d'un éventuel autre service).
2. Ajoutez une **application Android** avec le package **`ci.chap.app`** (le
   même `applicationId` que l'app — sinon FCM ne la reconnaît pas).
3. Téléchargez le **`google-services.json`** et déposez-le dans
   **`android/app/google-services.json`** (jamais dans le dépôt — il est ignoré
   par Git).
4. Pour iOS le jour venu : une app iOS `ci.chap.app`, le
   `GoogleService-Info.plist`, et une **clé APNs** dans Firebase.

### 2. Les paquets (une fois le `google-services.json` en main)

⚠️ N'ajoutez ces paquets **qu'après** avoir le `google-services.json` : sans
lui, le greffon Gradle de Google **fait échouer la construction**.

```bash
flutter pub add firebase_core firebase_messaging
```

Puis, après `flutter create`, ajoutez le greffon Google à
`android/app/build.gradle` (`apply plugin: 'com.google.gms.google-services'`)
et sa dépendance de classpath, comme l'exige la doc FlutterFire.

### 3. Brancher l'app

- Autorisation Android 13+ : ajouter
  `<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>`
  au `AndroidManifest.xml`.
- Dans `PushNatif.demarrer()` (ou un petit fichier `push_natif_firebase.dart`),
  coller :

```dart
await Firebase.initializeApp();
final fm = FirebaseMessaging.instance;
await fm.requestPermission();                 // iOS + Android 13+
final jeton = await fm.getToken();
if (jeton != null) await enregistrer(jeton, plateforme: 'android');
fm.onTokenRefresh.listen((t) => enregistrer(t, plateforme: 'android'));
FirebaseMessaging.onMessage.listen((_) => Notifications.instance.rafraichirCompte());
```

  puis passer `PushNatif.disponible` à `true`. À la déconnexion, appeler
  `PushNatif.instance.retirer()`.

### 4. Le serveur (deux petits ajouts)

Le serveur sait déjà faire le **Web Push** des navigateurs (VAPID / RFC 8291,
table `push_subs`). Le natif est un **second canal**, à côté :

1. **Stocker le jeton.** Une table `push_native (id, user_id, token, platform,
   label, created_at, last_ok_at, fails)` et deux routes :
   `POST /push/native` (enregistre `{token, platform, label?}` pour le compte
   connecté) et `POST /push/native/remove` (`{token}`). L'app les appelle déjà.
2. **Envoyer.** Dans le vidage de la file de `notify()`, en plus de
   `push_envoyer()` (Web Push), envoyer aux jetons natifs du compte via l'API
   **FCM HTTP v1** (`POST https://fcm.googleapis.com/v1/projects/<projet>/messages:send`).
   L'en-tête `Authorization: Bearer <jeton OAuth>` se signe avec un **compte de
   service** Firebase : un JSON à déposer en **`api/data/fcm-service-account.json`**
   (en 0600, dans le dossier refusé au web — **jamais** dans le dépôt), lu comme
   les autres secrets (`smtp.json`, `push.json`). Le marqueur du prompt est
   `COMPTE_SERVICE_FCM_ICI`. Un jeton qui répond `404`/`UNREGISTERED` se retire
   de la table, comme un abonné Web Push périmé.

### Sécurité (rappel)

Le push natif n'utilise **ni le keystore, ni un mot de passe de signature**.
Le seul secret nouveau est le **compte de service Firebase**, qui vit sur le
serveur (`api/data/`, 0600), au même titre que la clé VAPID — jamais dans le
zip de déploiement, jamais dans le dépôt.

## Sécurité

- Le **keystore de signature ne quitte jamais la machine du Patron**. Aucun
  bureau, agent ou prestataire n'a de raison de le demander.
- Aucun secret dans le dépôt : `android/key.properties` et les dossiers de
  plateforme sont ignorés par Git (voir `.gitignore`).
- L'app n'utilise **aucun pixel marketing** (Meta/TikTok/Google) — comme la
  règle `isNative` du site.
