# Construire l'AAB sur votre Mac — pas à pas

Pour le Patron. Vous ne codez rien : vous **copiez-collez** des commandes dans le
**Terminal**, une ligne à la fois, en appuyant sur Entrée après chacune.

> La première installation (étapes 1 à 4) prend un moment et télécharge plusieurs
> centaines de Mo — c'est normal, et c'est **une seule fois**. Ensuite, refaire un
> AAB tient en trois commandes (étape 6).

---

## Ouvrir le Terminal

Loupe **Spotlight** (en haut à droite de l'écran, ou `⌘ + Espace`) → tapez
**Terminal** → Entrée. Une fenêtre noire ou blanche s'ouvre : c'est là qu'on
colle les commandes.

---

## Étape 1 — Voir ce qui est déjà installé

```
flutter --version
```

- Si ça affiche des numéros de version → Flutter est déjà là, **passez à l'étape 4**.
- Si ça dit `command not found` → continuez à l'étape 2.

---

## Étape 2 — Installer Flutter (s'il manque)

```
git clone https://github.com/flutter/flutter.git -b stable ~/flutter
echo 'export PATH="$HOME/flutter/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
flutter --version
```

La dernière ligne doit maintenant afficher une version. (Si elle dit encore
`command not found`, **fermez** la fenêtre du Terminal, rouvrez-en une, et
retapez `flutter --version`.)

---

## Étape 3 — Android Studio (pour le SDK Android)

C'est lui qui apporte les outils Android. **Vous l'avez peut-être déjà** de
l'ancienne application.

1. S'il n'est pas installé : allez sur **developer.android.com/studio**,
   téléchargez, ouvrez le fichier `.dmg`, glissez **Android Studio** dans
   **Applications**, puis **ouvrez-le une fois** (il installe le SDK tout seul —
   acceptez les écrans par défaut).
2. De retour dans le Terminal, acceptez les licences :

```
flutter doctor --android-licenses
```

Tapez `y` puis Entrée à chaque question, jusqu'au bout.

3. Vérifiez :

```
flutter doctor
```

Vous voulez une **coche verte ✓** en face de « Android toolchain ». Si une ligne
reste rouge, elle vous dit quoi faire ; refaites `flutter doctor` après.

---

## Étape 4 — Récupérer le code de l'app

```
git clone https://github.com/Williamszika/Chap.ci.git ~/chap
cd ~/chap
git checkout claude/ci-marketplace-mobile-app-bnllro
cd flutter_app
flutter pub get
```

(Si Git demande votre identifiant, utilisez votre compte **GitHub**.)

> Les fois suivantes, pour récupérer les dernières nouveautés, il suffira de :
> `cd ~/chap && git pull && cd flutter_app && flutter pub get`

---

## Étape 5 — Préparer le dossier Android (une commande)

```
dart run tool/preparer_plateformes.dart
```

Il génère et configure `android/` (identifiant `ci.chap.app`, icône,
autorisations…). Rien à toucher.

---

## Étape 6 — Votre signature (le keystore)

1. Créez votre fichier de signature à partir du modèle :

```
cp tool/key.properties.exemple android/key.properties
open -e android/key.properties
```

2. TextEdit s'ouvre. Remplacez les valeurs par **les vôtres** :

   - `keyAlias` — l'alias de votre clé (le même que pour la v1.19) ;
   - `keyPassword` — le mot de passe de la clé ;
   - `storeFile` — le **chemin** vers votre keystore, ex. `/Users/vous/chapci.jks` ;
   - `storePassword` — le mot de passe du keystore.

   **Enregistrez** (`⌘ + S`) et fermez.

> ⚠️ Utilisez **le même keystore** que la dernière version publiée. Le Play Store
> refuse une mise à jour signée par une autre clé. Ce fichier et le keystore
> restent sur votre Mac — ils n'entrent jamais dans Git.

---

## Étape 7 — Construire l'AAB

```
flutter build appbundle --release
```

À la fin, le fichier est ici :

```
build/app/outputs/bundle/release/app-release.aab
```

Pour l'ouvrir dans le Finder :

```
open build/app/outputs/bundle/release/
```

C'est **ce fichier `.aab`** que vous téléversez dans la **Play Console** (piste de
test fermé pour l'instant ; puis « Promouvoir la version » vers la production le
jour où le test est validé — sans reconstruire).

---

## Refaire un AAB plus tard

Une fois tout installé, une nouvelle version se construit en trois lignes :

```
cd ~/chap && git pull && cd flutter_app && flutter pub get
dart run tool/preparer_plateformes.dart
flutter build appbundle --release
```

(Pensez à monter le `versionCode` dans `pubspec.yaml` — champ `version` — s'il
n'a pas déjà été monté, et à mettre à jour `store/APP-VERSIONS.md`.)
