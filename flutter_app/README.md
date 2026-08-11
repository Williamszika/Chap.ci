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
| `lib/widgets/social_buttons.dart` | Boutons « Continuer avec Google / Facebook » |
| `lib/api/models.dart` | Le modèle `Listing` (mêmes clés JSON que le site) + résolution des images |
| `lib/widgets/listing_card.dart` | La carte d'annonce |
| `lib/screens/home_screen.dart` | **Accueil** — en-tête, recherche, dernières annonces |
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

### 2. Générer les dossiers de plateforme (une seule fois)

Le dépôt ne contient **que** le code Dart (`lib/`). Les dossiers `android/` et
`ios/` se régénèrent — comme pour le site. Depuis ce dossier `flutter_app/` :

```bash
flutter create --platforms=android,ios --org ci.chap .
flutter pub get
```

### 3. ⚠️ Point CRUCIAL — le bon identifiant d'application

Pour que cette app soit une **mise à jour** de l'actuelle (et non une app
différente), elle doit porter **exactement** le même identifiant :

```
applicationId = "ci.chap.app"
```

À vérifier / corriger dans `android/app/build.gradle` après le `flutter create`.
Si l'identifiant diffère, le Play Store la traitera comme une **nouvelle** app.

### 3 bis. Autorisations photos (pour « Publier »)

`image_picker` a besoin d'autorisations, à ajouter après le `flutter create` :

- **iOS** — dans `ios/Runner/Info.plist` : `NSPhotoLibraryUsageDescription`
  (« Pour choisir les photos de vos annonces ») et, si l'appareil photo est
  utilisé, `NSCameraUsageDescription`.
- **Android** — la galerie fonctionne sans permission (sélecteur système). Pour
  l'appareil photo, ajouter `<uses-permission android:name="android.permission.CAMERA"/>`
  dans `android/app/src/main/AndroidManifest.xml`.

### 3 ter. Autorisations de localisation (le bouton GPS de « Publier »)

`geolocator` a besoin d'autorisations, à ajouter après le `flutter create` :

- **Android** — dans `android/app/src/main/AndroidManifest.xml`, à l'intérieur
  de `<manifest>` : `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>`
  (et, en repli, `ACCESS_COARSE_LOCATION`).
- **iOS** — dans `ios/Runner/Info.plist` : `NSLocationWhenInUseUsageDescription`
  (« Pour placer votre annonce à l'endroit exact »).

Sans ces autorisations, le bouton GPS explique poliment qu'il est refusé et le
vendeur choisit son lieu à la main — l'app reste utilisable. La position n'est
JAMAIS suivie en arrière-plan : elle n'est lue qu'au moment où le vendeur tape
sur « Activer ma position ».

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
8. **Tableau de bord** (réservé au Patron).

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
