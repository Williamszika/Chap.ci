# v1.20 — versionCode 21 · téléversement Play Console

Fiche de livraison de la **refonte Flutter**. Elle sert deux fois : maintenant,
pour téléverser ; et dans six mois, pour se rappeler comment on avait fait.

| | |
|---|---|
| Fichier | `build/app/outputs/bundle/release/app-release.aab` — **50,3 Mo** |
| versionCode · versionName | **21** · **1.20** |
| Identifiant | `ci.chap.app` (mise à jour de l'app existante, pas une nouvelle app) |
| minSdk · targetSdk | 22 (Android 5.1) · 35 (Android 15) |
| Clé d'importation (NOUVELLE) | alias `chapci`, `CN=Chap.ci, OU=Mobile, O=Chap.ci, L=Abidjan, ST=Abidjan, C=CI` |
| SHA-1 de la clé d'importation | `84:98:BB:44:AF:0E:22:2B:F5:3F:1E:6B:C0:D7:18:EF:0F:C8:F4:84` |
| SHA-1 de la clé d'**application** (inchangée depuis v1.0) | `0E:C0:95:D9:70:92:F2:C0:19:A1:41:D1:35:DC:81:6A:73:28:FE:33` |
| Commit | `b9786a1` — build du 12 août 2026 |

> **Le poids de 50 Mo est NORMAL, pas un bug.** Ce n'est plus une WebView
> Capacitor (5 Mo) mais Flutter, qui embarque son propre moteur de rendu.
> L'utilisateur ne télécharge jamais 50 Mo : le Play Store découpe le bundle par
> appareil (ABI + densité) et n'envoie que la tranche utile.

---

## Avant de commencer : trois vérifications qui évitent un aller-retour

**1. La fenêtre d'importation est-elle ouverte ?**

La clé d'importation a été **réinitialisée** (l'ancien keystore Capacitor a été
perdu). La nouvelle clé ne prend effet qu'à partir du **14 août 2026, 15 h 10
UTC**. Nous sommes le 15 août : **la fenêtre est ouverte, vous pouvez téléverser.**
Aucun fichier signé avec l'ancienne clé ne serait accepté ; l'AAB du 12/08 est
déjà signé avec la **nouvelle** (SHA-1 `84:98:…:F4:84`).

**2. Quel numéro de version Google a-t-il déjà reçu ?**

Un `versionCode` déjà téléversé est **brûlé définitivement**, même resté en
brouillon. Ouvrez **Tester et publier → Versions et bundles les plus récents** :
cette page liste tous les codes réellement reçus, tous canaux confondus.

- Si **21** n'y figure pas → continuez.
- La dernière version réellement téléversée est la **v1.18 (code 19)**. Le code
  **20 (v1.19, jamais téléversé) est sauté** — c'est autorisé, les codes n'ont
  qu'à croître. **21 > 19** : il passera. La page ci-dessus est la seule à faire foi.

**3. Le compte de test des relecteurs marche-t-il encore ?**

La v1.20 apporte une **connexion plus sûre (2FA)**. Vérifiez que le compte de
test fourni aux relecteurs dans **Instructions d'accès** permet TOUJOURS de se
connecter — si la 2FA réclame un code que le relecteur ne peut pas recevoir, il
bloque à la connexion et l'examen échoue. Au besoin, fournissez un compte sans
2FA ou une procédure de contournement.

---

## La marche à suivre

### 1. Ouvrir la console

<https://play.google.com/console> → l'application **Chap.ci**.

### 2. Aller au bon canal

**Tester et publier → Tests → Test fermé → Gérer le canal**

Le test fermé, **pas** le test interne : seul le test fermé compte pour la règle
des 12 testeurs pendant 14 jours. C'est le **même canal que la v1.18**.

### 3. Créer la version

Onglet **Versions** → bouton **Créer une version** (en haut à droite).

### 4. Envoyer le fichier

**Importer** → choisissez `app-release.aab` (celui du 12/08, 50,3 Mo).

Attendez que la console affiche **« versionCode 21 »** : c'est la confirmation
qu'il a été accepté. Ne vous alarmez pas du poids ni d'un éventuel avertissement
sur la taille.

### 5. Coller les notes de version

Champ **Notes de version**, langue **Français (France) — fr-FR**. Le texte est
prêt dans **`store/notes-version-v1.20.md`** (champ « Nouveautés », ≤ 500
caractères) :

```
Chap.ci fait peau neuve : une application entièrement reconstruite, plus rapide et plus légère.

• Placez votre annonce à l’endroit exact avec le GPS
• Toute la Côte d’Ivoire, pas seulement Abidjan
• Couleur et variantes sur vos annonces
• Notifications quand un acheteur vous écrit
• Connexion plus sûre

Après la mise à jour, reconnectez-vous une fois : vos annonces et vos messages sont bien là. Bonne vente ! 🧡
```

### 6. Enregistrer, vérifier, DÉPLOYER

**Enregistrer** → **Suivant** → **Vérifier et déployer** → **Lancer le
déploiement**.

> ⚠️ **C'est ici que ça s'est déjà mal passé.** La v1.1 puis la v1.16 sont
> restées en « Brouillon / Non examinée » parce que la dernière porte —
> **Publication → Vue d'ensemble de la publication → Envoyer les modifications
> pour examen** — n'avait pas été franchie. Le fichier était bien téléversé,
> mais aucun testeur ne l'a jamais reçu. Tant que le bandeau n'affiche pas
> **« En cours d'examen »** ou **« Disponible pour les testeurs »**, **rien n'est
> parti.**

---

## Ce qui bloque le déploiement s'il manque

La v1.18 étant déjà passée, ces déclarations (**Contenu de l'application →
Attention requise**) sont normalement déjà remplies. Ne les rouvrez que si la
console signale un point en attente.

| Déclaration | Réponse pour Chap.ci |
|---|---|
| **Sécurité des données** | compte, localisation, photos, messages ; chiffré en transit ; compte supprimable depuis l'app. |
| **Classification du contenu** | questionnaire rempli. |
| **Politique de confidentialité** | `https://chap.ci/#/confidentialite` |
| **Publicités** | **Oui** — le bandeau promotionnel interne en affiche. |
| **Public cible** | 18 ans et plus. |
| **Instructions d'accès** | compte de test pour les relecteurs — **revoir avec la 2FA** (voir vérification n°3). |

---

## Faut-il téléverser MAINTENANT ou attendre les 12 testeurs ?

**Téléversez maintenant.** Le compte à rebours des 14 jours n'a pas démarré (10
testeurs sur 12) : autant que les testeurs passent ces 14 jours sur la **vraie**
application Flutter — celle qui ira en production — plutôt que sur la v1.18
Capacitor. Déposer une nouvelle version **ne remet pas à zéro** le compte des
testeurs (seul un testeur qui se désinscrit le fait). La v1.18 reste disponible
tant que la v1.20 n'est pas approuvée ; une fois l'examen passé, la v1.20 la
remplace sur le canal.

---

## Après le déploiement

- Vérifiez sur le canal fermé : **« Dernière release : 21 (1.20) »**.
- **Les 12 testeurs, pendant 14 jours consécutifs.** Le compteur démarre quand
  douze personnes sont **réellement inscrites** (pas douze invitations), et
  repart à zéro sous douze. Visez **13-14 inscrits** pour absorber un départ.
- **Le SHA-1 pour la connexion Google** ne change pas : Play App Signing resigne
  chaque installation avec la clé d'application d'origine (`0E:C0:…:FE:33`).
  L'empreinte à déclarer dans Google Cloud se lit dans **Configuration →
  Intégrité de l'application → Certificat de signature d'application**, jamais en
  manipulant le fichier de clé.

---

## Si l'AAB du 12/08 n'est plus sur le Mac : reconstruire

Le `.aab` est un produit de build (50 Mo, signé) : il **ne vit pas dans Git** et
personne d'autre que votre Mac ne peut le fabriquer — le keystore et son mot de
passe y vivent, et **nulle part ailleurs**. On le reconstruit à l'identique. Le
guide pas-à-pas complet est **`flutter_app/GUIDE-CONSTRUIRE-MAC.md`** ; la version
courte, une fois tout déjà installé (ce qui est le cas depuis le 12/08) :

```bash
cd ~/chap && git pull && cd flutter_app && flutter pub get
dart run tool/preparer_plateformes.dart
flutter build appbundle --release
open build/app/outputs/bundle/release/
```

> **Le fichier reconstruit sera un peu plus récent que celui du 12/08 — et c'est
> tant mieux.** Depuis ce build, l'app a gagné la connexion Google/Facebook, la
> page vendeur complète, la fiche d'annonce détaillée et — utile pour l'examen —
> la **suppression de compte + les pages légales + l'aide**. Le `versionCode`
> reste **21** (déjà figé dans `pubspec.yaml : version: 1.20.0+21`) : **n'y
> touchez pas**, 21 n'a jamais été téléversé.

> ⚠️ **Si le build échoue sur la signature** (« key.properties » manquant, build
> non signé) : recréez le fichier de signature avec **le même keystore** que la
> v1.18/v1.19, puis relancez le build —
> `cp tool/key.properties.exemple android/key.properties`, `open -e
> android/key.properties`, remplissez les quatre valeurs (alias, mot de passe de
> la clé, chemin du `.jks`, mot de passe du keystore), enregistrez, puis
> `flutter build appbundle --release`.

---

## À faire avant le PROCHAIN build (pas maintenant)

- [ ] **`targetSdk 36`** — `tool/preparer_plateformes.dart` fige `targetSdk = 35`.
      Accepté jusqu'au **30 août 2026** ; tout build produit à partir du **31 août
      sera refusé**. Faire monter le script (et le `build.gradle.kts` qu'il écrit)
      à 36, comme la v1.19 l'avait fait côté Capacitor.
- [ ] **Captures d'écran** — celles de `store/captures/` montrent l'ancienne app
      Capacitor. Les écrans Flutter méritent d'être refaits.
