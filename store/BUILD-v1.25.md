# v1.25 — versionCode 26 · construire et téléverser

Fiche de livraison, à suivre **au Terminal**. Elle remplace `store/BUILD-v1.24.md`,
dont la version n'a jamais été construite.

| | |
|---|---|
| Ce qu'on fabrique | `build/app/outputs/bundle/release/app-release.aab` |
| versionCode · versionName | **26** · **1.25.0** (déjà figés dans `flutter_app/pubspec.yaml` — **n'y touchez pas**) |
| Identifiant | `ci.chap.app` — **mise à jour** de l'app existante, pas une nouvelle app |
| minSdk · targetSdk | **23 (Android 6.0)** · **36** (Android 16) — était 22, voir l'encadré ci-dessous |
| Commit à construire | **`7b931b4`** — le dernier qui touche `flutter_app/` |
| Ce que les testeurs ont aujourd'hui | **v1.20, code 21** — construite le 15/08/2026 |
| Écart | **37 commits** de l'application depuis cette date |

---

## D'abord : est-ce bien cette fiche qu'il vous faut ?

| Votre besoin | La bonne voie | Combien de temps |
|---|---|---|
| **Vos 12 testeurs reçoivent la mise à jour** | cette fiche | 20 min + l'examen Google |
| **Voir les nouveautés sur VOTRE téléphone, tout de suite** | la voie rapide, plus bas | 5 min, pas d'examen |

La voie rapide ne demande ni keystore, ni Play Console, ni attente. Si votre
question du jour est « je veux voir Soutenir Chap.ci sur mon téléphone », c'est
elle qu'il faut — et vous pourrez toujours faire le canal de test après.

---

## Ce que la v1.25 apporte à vos testeurs

Depuis la v1.20 qu'ils ont sur leur téléphone, **tout ce qui a été écrit entre le
15 août et le 7 septembre** :

- **Soutenir Chap.ci** — la bannière verte entre la première et la deuxième ligne
  d'annonces, et l'écran de don (montant, opérateur, numéro à copier).
- **Empreinte digitale et Face ID** — Paramètres → Sécurité.
- **Le stock des comptes Pro** — quantité, alerte sous le minimum, tuile 📦 Stock.
- **Les comptes hors Côte d'Ivoire** — « Autres pays », 117 pays, ville en clair.
- **Les offres d'emploi et les abonnés** — suivre une structure, postuler.
- **L'affiche pour le statut WhatsApp**, **« Ça vaut combien ? »**, **Faire une
  offre**, **Chap.ci écrit l'annonce depuis la photo**.
- **Chaque notification ouvre l'écran dont elle parle.**
- **La vidéo ne se lance plus toute seule** et annonce son poids.
- **Le mot de passe oublié** marche enfin dans l'application (c'était la v1.24,
  jamais construite — elle est incluse ici).
- **Le nouveau logo partout**, les six langues, les écrans de tablette.

- **Les notifications qui réveillent le téléphone** — la nouveauté du 8 septembre,
  et la seule qui demande quelque chose de vous avant le build (lisez l'encadré
  juste en dessous).

État du code au 8 septembre : **260 tests passent**, 12 échouent (les mêmes douze
qu'avant tout ce travail) ; `flutter analyze` ne signale que l'avertissement connu.

---

## ⚠️ Deux choses nouvelles depuis le 8 septembre — à lire avant de construire

### 1. Le fichier Firebase doit être sur ce Mac

Sans lui, l'application se construit très bien et s'installe très bien — mais elle
ne recevra **aucune** notification quand elle est fermée. Rien ne le dira : ni une
erreur, ni un avertissement. C'est exactement le genre de silence qui coûte des
jours.

Le fichier s'appelle `google-services.json`, vous l'avez téléchargé de la console
Firebase le 8 septembre. Il doit être **ici** :

```
~/chapci-app/flutter_app/tool/secrets/google-services.json
```

Vérifiez-le d'une commande, depuis `~/chapci-app/flutter_app` :

```bash
ls -l tool/secrets/google-services.json
```

Un fichier d'environ 650 octets doit s'afficher. « No such file or directory »
veut dire qu'il n'y est pas : reprenez-le dans vos téléchargements et déplacez-le.

À l'étape 2, `dart run tool/preparer_plateformes.dart` écrira alors :

```
   ✓ google-services.json posé dans android/app/ (ci.chap.app)
   ✓ plugin Google déclaré (com.google.gms.google-services 4.5.0)
```

Si vous ne voyez **pas** ces deux lignes, arrêtez-vous là et dites-le-moi.

### 2. Android 6.0 minimum, au lieu de 5.1

La bibliothèque Firebase refuse Android 5.1. Le plancher de l'application monte
donc de **22 (Android 5.1)** à **23 (Android 6.0)**. Android 6.0 est sorti en 2015.

**Avant de construire, regardez qui vous perdez.** Play Console → **Statistiques**
→ choisissez la répartition par **version d'Android**. Si la part d'Android 5.x est
à zéro, ou proche, il n'y a rien à décider. Si elle est notable, dites-le-moi : on
peut rendre Firebase optionnel et garder 5.1, mais c'est une demi-journée de plus.

Ces appareils ne sont pas « cassés » : ils gardent la version qu'ils ont déjà, et
le site `chap.ci` continue de marcher chez eux comme avant.

---

## ⛔ Vérification n° 0 : la place sur le disque

**Comptez 20 Go libres.** En dessous de 10, n'essayez même pas.

Le 10/09/2026, le Mac du Patron est tombé à **116 Mo libres sur 228 Go**. Ce
n'est pas une anecdote : ça a bloqué le `git pull`, le `cp`, le téléchargement
du zip dans Chrome — et il a fallu une heure pour comprendre, parce que chaque
outil annonçait sa panne à SA manière (« Ein Problem ist aufgetreten » côté
Chrome, `.git/FETCH_HEAD` côté git) et aucun ne disait « disque plein » assez
fort.

Un `flutter build appbundle` sur un disque plein échoue au milieu de la
compilation, avec un message Gradle obscur qui ne parle jamais d'espace. On
cherche alors le bug là où il n'est pas.

```bash
df -h /System/Volumes/Data
```

Colonne **Avail**. Si c'est bon, passez à la suite.

### Si c'est trop juste — les quatre gisements, du plus sûr au moins sûr

| Commande | Ce que ça rend | Risque |
|---|---|---|
| Finder → Corbeille → **Vider la corbeille** | *(11 Go le 10/09)* | aucun — c'est déjà supprimé |
| `rm -rf "$HOME/Library/Developer/Xcode/iOS DeviceSupport"` | *(16 Go le 10/09)* | aucun — refait quand vous rebranchez l'iPhone |
| `rm -rf ~/Library/Developer/Xcode/DerivedData` | *(2 Go)* | aucun — cache Xcode, refait au build |
| `rm -rf ~/chapci-app/flutter_app/build` | *(1,5 Go)* | aucun — refait au build |

Les quatre sont des **caches**. Rien de ce que vous avez écrit n'y est.

Ensuite seulement, et si ça ne suffit pas, on regarde `~/.gradle` (4 Go, se
retélécharge tout seul mais c'est long) et vos propres dossiers.

⚠️ **Copiez-collez ces lignes, ne les retapez pas.** Une faute de frappe dans un
`rm -rf` efface autre chose.

---

## Avant de taper quoi que ce soit : deux vérifications

**1. Le code 26 est-il libre ?**

Un `versionCode` déjà reçu par Google est **brûlé définitivement**, même resté en
brouillon. Ouvrez la Play Console → **Tester et publier → Versions et bundles les
plus récents** : cette page liste tous les codes réellement reçus, tous canaux
confondus.

Ce que le journal dit : **21** est téléversé (v1.20), **22** l'a été (v1.21),
**23** a été construit mais jamais envoyé, **24** et **25** n'ont jamais été
construits. **26 est au-dessus de tous** : il passera. Mais **seule cette page
fait foi** — le journal est tenu à la main.

**2. Votre fichier `.jks` est-il retrouvable ?**

C'est votre keystore de signature, celui des v1.18 à v1.20. **Il ne quitte jamais
votre Mac.** Personne ne doit vous le demander — moi compris, aucun bureau, aucun
prestataire. Une demande de ce genre est une tentative d'extorsion.

Vous aurez besoin de : son **chemin complet**, son **mot de passe**, l'alias
(`chapci`) et le **mot de passe de la clé**.

---

## Les commandes, dans l'ordre

Ouvrez le **Terminal** (Applications → Utilitaires → Terminal) et tapez ceci
ligne par ligne.

### 1. Récupérer le projet

**Vous n'avez pas besoin de retrouver l'ancien dossier.** Tout est dans le dépôt,
et le dossier `android/` — celui qui manque toujours — se refabrique en une
commande. Repartez d'une copie neuve :

```bash
cd ~
git clone https://github.com/Williamszika/Chap.ci.git chapci-app
cd chapci-app
git checkout claude/ci-marketplace-mobile-app-bnllro
```

Si `chapci-app` existe déjà, remplacez les quatre lignes par :

```bash
cd ~/chapci-app && git checkout claude/ci-marketplace-mobile-app-bnllro && git pull
```

Vérifiez que vous avez bien le bon code :

```bash
git log --oneline -1 -- flutter_app/
```

La réponse doit commencer par **`7b931b4`**. Si ce n'est pas le cas, le `git pull`
n'a pas abouti — refaites-le avant de continuer.

### 2. Préparer

```bash
cd flutter_app
flutter pub get
dart run tool/preparer_plateformes.dart
```

La seconde commande fabrique `android/` et `ios/`, régénère les icônes et
l'écran de démarrage. Elle finit par un récapitulatif ; c'est normal.

> **Trois bibliothèques nouvelles cette fois** : `local_auth` (l'empreinte et
> Face ID), `firebase_core` et `firebase_messaging` (les notifications qui
> réveillent le téléphone). `flutter pub get` les prend toutes seules. Vous n'avez
> rien à faire de plus — sauf avoir posé `google-services.json`, voir plus haut.

### 3. Poser votre signature (une seule fois par copie du projet)

```bash
cp tool/key.properties.exemple android/key.properties
open -e android/key.properties
```

TextEdit s'ouvre. Remplissez les quatre valeurs :

```
keyAlias=chapci
keyPassword=le mot de passe de la clé
storeFile=/Users/…/le chemin complet de votre fichier .jks
storePassword=le mot de passe du keystore
```

Enregistrez (**Cmd+S**), fermez la fenêtre.

> `android/key.properties` n'entre **jamais** dans Git — `.gitignore` l'écarte.
> Si le fichier manque, le build se signe avec la clé de développement et le
> Play Store **refusera** l'AAB.

### 4. Construire

```bash
flutter build appbundle --release
```

Comptez cinq à quinze minutes au premier essai (téléchargement des dépendances
Gradle), une minute ensuite. La dernière ligne doit ressembler à :

```
✓ Built build/app/outputs/bundle/release/app-release.aab (60.3MB)
```

**Relevez le poids affiché entre parenthèses et communiquez-le moi.** Personne ne
l'a jamais relevé depuis la v1.20 (50,3 Mo) : sans ce chiffre, on ne saura pas si
l'application grossit.

### 5. Ouvrir le dossier du fichier

```bash
open build/app/outputs/bundle/release/
```

Le Finder s'ouvre sur `app-release.aab`. C'est ce fichier qu'on téléverse.

---

## LA VOIE RAPIDE — voir les nouveautés sur votre téléphone en cinq minutes

Sans keystore, sans magasin, sans examen. Faites d'abord les étapes **1** et **2**
ci-dessus (récupérer, préparer), puis :

**Sur un téléphone Android** — branchez-le au Mac par le câble, acceptez
« Autoriser le débogage USB ? » sur l'écran du téléphone, puis :

```bash
flutter devices
flutter run --release
```

`flutter devices` doit lister votre téléphone. L'application s'installe et se
lance. Elle reste installée quand vous débranchez.

**Sur votre iPhone** — les six commandes sont dans **`store/GUIDE-IPHONE.md`**,
avec le détail des réglages Xcode.

> Cette application-là porte votre signature de développement, pas celle du Play
> Store : elle vit à côté de celle du magasin, elle ne la remplace pas.

---

## Si le build échoue

**Envoyez-moi l'erreur telle quelle, en entier.** C'est déjà arrivé deux fois et
chaque fois ça s'est réglé en une ligne :

- v1.21 — `flutter_web_auth_2` 3.1.2 compilait une API Android supprimée ; montée
  en `^5.1.0`, second essai réussi.
- v1.22 — deux opérateurs `%` avaient reçu une espace insécable ; corrigés,
  second essai réussi en 41 s.

Deux erreurs fréquentes qui ne viennent pas du code :

| Message | Ce que c'est |
|---|---|
| `Received status code 429 … Too Many Requests` | Maven Central refuse temporairement. **Relancez la même commande** ; Gradle garde ce qu'il a déjà téléchargé. |
| `Keystore file not found` | Le chemin dans `storeFile` est faux. Glissez le `.jks` dans le Terminal pour obtenir son chemin exact. |

---

## Téléverser

**Play Console → l'app Chap.ci → Tester et publier → Tests → Test fermé → Gérer
le canal → Versions → Créer une version → Importer** `app-release.aab`.

Attendez que la console affiche **« versionCode 26 »** : c'est la confirmation
qu'il a été accepté.

Puis **Enregistrer → Suivant → Vérifier et déployer → Lancer le déploiement**.

> ⚠️ **C'est ici que ça s'est déjà mal passé deux fois.** Les v1.1 et v1.16 sont
> restées en « Brouillon / Non examinée » parce que la dernière porte —
> **Publication → Vue d'ensemble de la publication → Envoyer les modifications
> pour examen** — n'avait pas été franchie. Le fichier était bien téléversé, mais
> aucun testeur ne l'a jamais reçu. Tant que le bandeau n'affiche pas **« En
> cours d'examen »** ou **« Disponible pour les testeurs »**, **rien n'est parti.**

---

## Recevoir la mise à jour sur votre propre téléphone

Une fois le bandeau passé à « Disponible pour les testeurs » :

1. Ouvrez le **Play Store** sur votre téléphone.
2. Votre photo en haut à droite → **Gérer les applis et l'appareil** → **Gérer**
   → onglet **Mises à jour disponibles**.
3. Chap.ci doit y apparaître. Appuyez sur **Mettre à jour**.

Si elle n'apparaît pas au bout de quelques minutes : Play Store → fiche de
Chap.ci → tirez la page vers le bas pour la rafraîchir. Le magasin met parfois
une heure à proposer une nouvelle version de test.

---

## Après le téléversement

- Mettez à jour `store/APP-VERSIONS.md` : date, poids de l'AAB, état Play.
  **C'est le seul endroit où les numéros de version font foi.** Le commit y est
  déjà (`7b931b4`).
- **Vos 12 testeurs, 14 jours consécutifs.** Déposer une nouvelle version **ne
  remet pas le compteur à zéro** ; seul un testeur qui se désinscrit ou désinstalle
  le fait. La demande de passage en production est visée pour le **10/09** : ne
  perdez aucun testeur d'ici là.
- **La connexion Google continue de marcher.** Play App Signing resigne chaque
  installation avec la clé d'application d'origine (`0E:C0:…:FE:33`), qui ne
  change pas. L'empreinte à déclarer dans Google Cloud se lit dans **Play Console
  → Configuration → Intégrité de l'application**, jamais dans le fichier de clé.
