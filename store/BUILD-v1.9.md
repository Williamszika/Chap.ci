# v1.9 — versionCode 10 · téléversement Play Console

Fiche de livraison. Elle sert deux fois : maintenant, pour téléverser ; et dans
six mois, pour se rappeler comment on avait fait.

| | |
|---|---|
| Fichier | `chapci-v1.9.aab` — 6,7 Mo |
| versionCode · versionName | **10** · **1.9** |
| Identifiant | `ci.chap.app` |
| minSdk · targetSdk | 22 (Android 5.1) · 35 (Android 15) |
| Signature | `CN=Chap.ci, L=Abidjan, C=CI` |
| SHA-1 du certificat d'importation | `0E:C0:95:D9:70:92:F2:C0:19:A1:41:D1:35:DC:81:6A:73:28:FE:33` |
| Expiration du certificat | 6 décembre 2053 — bien au-delà du 22 octobre 2033 exigé |
| Commit | `54f3a9e` |

---

## Avant de commencer : deux vérifications qui évitent un aller-retour

**1. Quel numéro de version Google a-t-il déjà reçu ?**

Un `versionCode` déjà téléversé est **brûlé définitivement**, même si la version
est restée en brouillon et n'a jamais été publiée. Le téléversement est refusé
avec « *Vous devez utiliser un code de version différent* ».

Ouvrez **Tester et publier → Versions et bundles les plus récents**. Cette page
liste tous les codes réellement reçus par Google, tous canaux confondus.

- Si **10** n'y figure pas → tout va bien, continuez.
- Si **10** y figure déjà → il faut reconstruire avec un numéro plus grand.
  Sauter des numéros est autorisé : passer directement à **15** est plus sûr que
  de tenter 11, puis 12, puis 13.

D'après le journal, la dernière version réellement téléversée est la **v1.4
(code 5)**, le 28/07 en test fermé. Le code 10 devrait donc passer — mais la
page ci-dessus est la seule à faire foi.

**2. Le niveau d'API — il reste trente jours**

`targetSdk 35` est accepté **jusqu'au 30 août 2026**. À partir du **31 août
2026**, Google exigera **API 36 (Android 16)** pour tout nouveau téléversement.
Ce n'est pas un problème aujourd'hui ; ç'en sera un au prochain build.

---

## La marche à suivre

### 1. Ouvrir la console

<https://play.google.com/console> → l'application **Chap.ci**.

### 2. Aller au bon canal

**Tester et publier → Tests → Test fermé → Gérer le canal**

Le test fermé, et pas le test interne : **seul le test fermé compte** pour la
règle des 12 testeurs pendant 14 jours qu'impose un compte personnel.

### 3. Créer la version

Onglet **Versions** → bouton **Créer une version** (en haut à droite).

Si c'est le premier téléversement de ce compte, la console propose d'activer la
**signature d'application Play**. Acceptez : Google génère alors sa propre clé
de signature, définitive pour toute la vie de l'application. Votre `.jks` reste
la **clé de téléversement** — les deux sont différentes, et c'est normal.

### 4. Envoyer le fichier

**Importer** → choisissez `chapci-v1.9.aab`.

Attendez que la console affiche « versionCode 10 » : c'est la confirmation
qu'il a été accepté.

### 5. Coller les notes de version

Champ **Notes de version**, langue **Français (France)** — 446 caractères sur
les 500 autorisés :

```
Chaque catégorie a désormais son propre formulaire. Vendre une voiture, un terrain, un poulet ou une offre d'emploi ne pose plus les mêmes questions — et l'acheteur lit en tête de l'annonce la réponse qui décide : carte grise, dossier foncier, vaccination, frais demandés au candidat.

Les couleurs suivent le produit : essences de bois pour un meuble, carnations pour un fond de teint.

Quinze rayons deviennent treize, plus simples à parcourir.
```

Ces notes parlent de ce que l'utilisateur gagne, jamais de technique. « Refonte
du moteur de formulaires » ne dit rien à personne.

### 6. Enregistrer, vérifier, DÉPLOYER

**Enregistrer** → **Suivant** → **Vérifier et déployer** → **Lancer le
déploiement**.

> ⚠️ **C'est ici que ça s'est déjà mal passé.** La v1.1 est restée en
> « Brouillon / Non examinée » parce que l'étape *Lancer le déploiement* n'avait
> pas été faite. Le fichier était bien téléversé, mais aucun testeur ne l'a
> jamais reçu. Tant que le bandeau n'affiche pas « En cours d'examen » ou
> « Disponible pour les testeurs », **rien n'est parti**.

---

## Ce qui bloque le déploiement s'il manque

Ces déclarations se trouvent dans **Contenu de l'application**, onglet
**Attention requise**. Sans elles, le bouton *Lancer le déploiement* refuse de
partir — ce sont elles, et non l'AAB, qui bloquent le plus souvent.

| Déclaration | Ce qu'il faut répondre pour Chap.ci |
|---|---|
| **Sécurité des données** | Obligatoire en test fermé (pas en test interne). Déclarez : compte, localisation, photos, messages. Tout est chiffré en transit, et le compte est supprimable depuis l'application. |
| **Classification du contenu** | Questionnaire à remplir. Une application sans classification est retirée du Store. |
| **Politique de confidentialité** | `https://chap.ci/#/confidentialite` |
| **Publicités** | **Oui, mon application contient des annonces** — le bandeau promotionnel interne en affiche. Le nier serait une non-conformité. |
| **Public cible** | 18 ans et plus. |
| **Instructions d'accès** | Fournissez un compte de test aux relecteurs : l'inscription exige une confirmation par e-mail ou SMS, et sans identifiants un relecteur bloque à la première page. |

---

## Après le déploiement

**Les 12 testeurs, pendant 14 jours consécutifs.** Le compteur ne démarre qu'une
fois la version approuvée **et** douze personnes réellement inscrites — pas
douze invitations envoyées, douze inscriptions acceptées. Il **repart à zéro**
si l'on descend sous douze. Des émulateurs ou des comptes fabriqués sont
détectés et ne comptent pas : il faut douze comptes Google distincts sur de
vrais téléphones.

C'est le seul délai du projet que personne ne peut raccourcir. Tout le reste
peut attendre ; le recrutement des testeurs, non.

**Le SHA-1 pour la connexion Google.** Une fois la signature d'application Play
active, l'empreinte à déclarer dans Google Cloud n'est **plus** celle du
certificat ci-dessus, mais celle de **Google**. Elle se lit dans
**Configuration → Intégrité de l'application → Certificat de signature
d'application**. Ne la cherchez jamais en manipulant le fichier de clé.

---

## À faire avant le PROCHAIN build

- [ ] **`targetSdk 36`** — obligatoire pour tout téléversement à partir du
      31 août 2026. Un mois pour relever `variables.gradle` et retester les
      changements de comportement d'Android 16.
- [ ] **Sauvegarder la clé de téléversement ailleurs.** Elle vit aujourd'hui
      dans l'environnement de travail, qui est temporaire. La perdre n'est pas
      définitif — Google sait réinitialiser une clé de téléversement — mais
      c'est une démarche, et elle prend des jours.
- [ ] **Captures d'écran** — celles de `store/captures/` montrent l'ancien
      formulaire unique. Les nouvelles fiches de vente méritent d'être vues.
