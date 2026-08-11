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
| `lib/screens/publier_screen.dart` | **Publier** — photos (≥ 3), catégorie **et sous-catégorie**, prix, commune, + le formulaire détaillé |
| `lib/screens/formulaire_dynamique.dart` | Le **moteur** qui affiche le formulaire d'une sous-catégorie (puces, bascules, alertes, blocage) |
| `lib/data/formulaires/` | Le **contrat** (`schema.dart`), les données par catégorie (`mode.dart`…) et le **registre** (`registre.dart`) |
| `lib/screens/verifier_email_screen.dart` | **Confirmer l'e-mail** — code à 6 chiffres (mur avant de publier) |
| `lib/favoris.dart` | Les favoris (local + synchro compte), un ChangeNotifier |
| `lib/widgets/bouton_favori.dart` | Le cœur sur la carte et la fiche |
| `lib/screens/favoris_screen.dart` | **Mes favoris** |
| `lib/data/communes.dart` | Les 13 communes d'Abidjan |
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
   **refus de publication** exigé par la loi (éclaircissant, produit périmé).
   Voir `lib/data/formulaires/`. **« Mode & Beauté », « Électronique »,
   « Véhicules », « Maison » et « Alimentation » sont portées** (5 catégories
   sur 15) — avec, pour les véhicules, le **dossier administratif** (carte
   grise, CSA / non-gage) ; pour la maison, le bois qui gonfle à l'humidité, la
   facture CIE, et trois refus de publication ; pour l'alimentation, la **chaîne
   du froid**, la **date limite**, le **prix au kilo et pas “le tas”**, le bloc
   **cacao & café**, et trois refus de plus (produit périmé, poisson jamais
   réfrigéré, pesticide non homologué). Restent les **10 autres catégories**
   (mêmes données à porter, le moteur est là), la **géolocalisation GPS**, le
   **bloc couleurs/variantes** (tailles par coloris), et le reste du pays
   (régions/villes hors Abidjan).
4. ~~**Inscription**~~ ✅ + ~~**confirmation d'e-mail**~~ ✅ (code à 6 chiffres, mur
   avant publication, câblé dans Mon compte et Publier). Reste la **2FA** à la connexion.
5. ~~**Mon compte**~~ ✅ mes annonces (état, vues, masquer/afficher, supprimer),
   identité, **édition du profil (nom, bio, photo)**.
6. ~~**Messagerie** acheteur ↔ vendeur~~ ✅ fait (liste, fil, envoi, relève 4 s ;
   « Contacter » sur la fiche ouvre la conversation).
7. **Notifications natives** (Firebase Cloud Messaging) — c'est ici que l'app
   Flutter apporte ce que la coque WebView ne pouvait pas faire.
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

## Sécurité

- Le **keystore de signature ne quitte jamais la machine du Patron**. Aucun
  bureau, agent ou prestataire n'a de raison de le demander.
- Aucun secret dans le dépôt : `android/key.properties` et les dossiers de
  plateforme sont ignorés par Git (voir `.gitignore`).
- L'app n'utilise **aucun pixel marketing** (Meta/TikTok/Google) — comme la
  règle `isNative` du site.
