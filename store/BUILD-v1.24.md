# v1.24 — versionCode 25 · construire et téléverser

Fiche de livraison, à suivre **au Terminal**. Elle remplace `CONSTRUIRE-L-APP.txt`.

| | |
|---|---|
| Ce qu'on fabrique | `build/app/outputs/bundle/release/app-release.aab` |
| versionCode · versionName | **25** · **1.24.0** (figés dans `flutter_app/pubspec.yaml`) |
| Identifiant | `ci.chap.app` — **mise à jour** de l'app existante, pas une nouvelle app |
| minSdk · targetSdk | 22 (Android 5.1) · **36** (Android 16) |
| Commit | `À COMPLÉTER après le build` (`git log --oneline -1`) |
| Ce que les testeurs ont aujourd'hui | **v1.20, code 21** — construite le 15/08 |
| Écart | **61 commits** de l'application depuis cette v1.20 |

---

## Xcode ne sert pas ici

Vos testeurs et votre téléphone de test sont sous **Android**. Ce build se fait
**au Terminal seul**, et il a besoin d'**Android Studio** (pour le SDK Android),
pas de Xcode.

Xcode ne sert que le jour où vous voudrez une version **iPhone** : c'est un autre
chantier, avec un compte Apple Developer à 99 $/an et une fiche App Store à
remplir. Le volet iOS est décrit dans `store/GUIDE-IPHONE.md` ; il n'a **aucun
lien** avec la mise à jour de l'app de test.

---

## Ce que la v1.24 apporte à vos testeurs

Depuis la v1.20 qu'ils ont sur leur téléphone :

- **Le mot de passe oublié marche enfin.** Jusqu'ici, appuyer sur « Mot de passe
  oublié ? » ouvrait un message disant d'écrire à `contact@chap.ci`. Le site
  savait le faire depuis le 29/08. Maintenant l'application aussi : code à six
  chiffres par e-mail, puis nouveau mot de passe. La double authentification
  reste exigée quand le compte l'a activée.
- **Le nouveau logo partout** — icône, écran de démarrage, en-tête, filigrane des
  photos. Vos testeurs voient encore l'ancienne épingle.
- **L'espace professionnel au complet** — demande, tableau de bord façon CRM,
  vitrine (bannière, logo, horaires, registre vérifié).
- **Les six langues** sur tout le parcours, y compris les 101 sous-catégories.
- **Les écrans de tablette** qui ne s'étirent plus sur toute la largeur.

---

## Avant de taper quoi que ce soit : deux vérifications

**1. Le code 25 est-il libre ?**

Un `versionCode` déjà reçu par Google est **brûlé définitivement**, même resté en
brouillon. Ouvrez la Play Console → **Tester et publier → Versions et bundles les
plus récents** : cette page liste tous les codes réellement reçus, tous canaux
confondus.

Ce que le journal dit : **21** est téléversé (v1.20), **22** l'a été (v1.21),
**23** a été construit mais jamais envoyé, **24** n'a jamais été construit.
**25 > 22** : il passera. Mais **seule cette page fait foi** — le journal est
tenu à la main.

**2. Votre fichier `.jks` est-il retrouvable ?**

C'est votre keystore de signature, celui des v1.18 à v1.23. **Il ne quitte jamais
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

### 2. Préparer

```bash
cd flutter_app
flutter pub get
dart run tool/preparer_plateformes.dart
```

La seconde commande fabrique `android/` et `ios/`, régénère les icônes et
l'écran de démarrage. Elle finit par un récapitulatif ; c'est normal.

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

**Relevez le poids affiché entre parenthèses** et communiquez-le moi : il entre
dans `store/APP-VERSIONS.md`.

### 5. Ouvrir le dossier du fichier

```bash
open build/app/outputs/bundle/release/
```

Le Finder s'ouvre sur `app-release.aab`. C'est ce fichier qu'on téléverse.

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

Attendez que la console affiche **« versionCode 25 »** : c'est la confirmation
qu'il a été accepté.

Puis **Enregistrer → Suivant → Vérifier et déployer → Lancer le déploiement**.

> ⚠️ **C'est ici que ça s'est déjà mal passé deux fois.** Les v1.1 et v1.16 sont
> restées en « Brouillon / Non examinée » parce que la dernière porte —
> **Publication → Vue d'ensemble de la publication → Envoyer les modifications
> pour examen** — n'avait pas été franchie. Le fichier était bien téléversé, mais
> aucun testeur ne l'a jamais reçu. Tant que le bandeau n'affiche pas **« En
> cours d'examen »** ou **« Disponible pour les testeurs »**, **rien n'est parti.**

---

## Après le téléversement

- Mettez à jour `store/APP-VERSIONS.md` : commit, date, poids de l'AAB, état Play.
  **C'est le seul endroit où les numéros de version font foi.**
- **Vos 12 testeurs, 14 jours consécutifs.** Déposer une nouvelle version ne
  remet pas le compteur à zéro ; seul un testeur qui se désinscrit le fait. La
  demande de passage en production est visée pour le **10/09** : ne perdez aucun
  testeur d'ici là.
- **La connexion Google continue de marcher.** Play App Signing resigne chaque
  installation avec la clé d'application d'origine (`0E:C0:…:FE:33`), qui ne
  change pas. L'empreinte à déclarer dans Google Cloud se lit dans **Play Console
  → Configuration → Intégrité de l'application**, jamais dans le fichier de clé.
