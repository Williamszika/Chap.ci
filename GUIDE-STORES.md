# Chap.ci — Mettre l'application sur Google Play et l'App Store

> Chap.ci est aujourd'hui une **PWA** (site installable). Les stores ne distribuent pas des sites : ils distribuent des **paquets signés**. Il faut donc **emballer** ta PWA. Bonne nouvelle : aucun code à réécrire.

---

## 0. Avant tout — préparer la PWA (obligatoire pour Google)

Sans ça, l'emballage Android échoue.

| Élément | État requis |
|---|---|
| **HTTPS** | ✅ déjà bon (GitHub Pages) |
| **Manifeste** (`manifest.webmanifest`) | à publier — **fourni dans ce dossier** |
| **Service worker** avec gestionnaire `fetch` | requis (mode hors-ligne) |
| **Icônes 192 px et 512 px** + **maskable** | ✅ fournies dans `icons/` |
| **Nom de domaine à toi** | ⚠️ voir ci-dessous |

**Point important : le domaine.**
Ton app est sur `williamszika.github.io/Chap.ci/` — un **sous-dossier d'un domaine GitHub**. Or, pour l'Android (TWA), il faut déposer un fichier de preuve de propriété à la **racine du domaine** (`/.well-known/assetlinks.json`), ce que tu ne contrôles pas sur `github.io`.
→ **Achète `chap.ci`** (ou `chapci.com`) et fais-le pointer sur ton hébergement. C'est la première étape, non négociable pour un lancement propre. Ça règle aussi le cache et la crédibilité.

Ajoute dans le `<head>` :
```html
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/icons/icon-180.png">
<meta name="theme-color" content="#F77F00">
```

---

## 1. Google Play — **c'est possible et officiel** ✅

Google accepte les PWA via une **TWA** (Trusted Web Activity) : une coque Android qui affiche ton site en plein écran, sans barre de navigateur.

### Étapes

1. **Compte Google Play Console** — **25 $ une seule fois**.
   ⚠️ **Choisis un compte "organisation"** si tu peux. Un **compte personnel neuf** est soumis à une obligation de **test fermé (~12 testeurs pendant 14 jours)** avant de pouvoir publier — le compte organisation évite cette attente.

2. **Générer le paquet** — deux outils, aucun code :
   - **PWABuilder** (Microsoft, interface graphique) : tu colles ton URL → il génère le `.aab`. Le plus simple.
   - **Bubblewrap** (Google, ligne de commande) :
     ```bash
     npm i -g @bubblewrap/cli
     bubblewrap init --manifest https://chap.ci/manifest.webmanifest
     bubblewrap build
     ```
   Résultat : un **`.aab` signé** + un fichier **`assetlinks.json`**.

3. **Preuve de propriété** — dépose `assetlinks.json` sur ton site à :
   `https://chap.ci/.well-known/assetlinks.json`
   (sans ça, l'app s'ouvre avec une barre d'adresse visible → refus / mauvaise note).

4. **Garde ta clé de signature (keystore) en lieu sûr.**
   Perdue = tu ne peux **plus jamais** mettre à jour l'app sous ce nom de paquet. Sauvegarde-la.

5. **Fiche Play Store** : icône 512, bannière 1024×500, captures d'écran, description, **politique de confidentialité (URL obligatoire)**, formulaire « Sécurité des données », classification du contenu.

6. **Soumettre.** Validation généralement rapide (quelques jours).

### Ce qui fait refuser
- App jugée « site web repackagé » sans valeur ajoutée → ta PWA doit **vraiment fonctionner** (recherche, publication d'annonce, hors-ligne).
- Pas de politique de confidentialité.
- Cibler un niveau d'API trop ancien (**API 35 / Android 15** attendu pour les nouvelles apps) — les outils ci-dessus s'en chargent.

---

## 2. Apple App Store — **plus strict** ⚠️

Apple **refuse explicitement** les « sites web repackagés » (règle **4.2 — Minimum Functionality**). Une simple coque autour de `chap.ci` sera **rejetée**.

### La bonne méthode : **Capacitor**
Tu emballes ta PWA dans une vraie app iOS, **et tu ajoutes de vraies fonctions natives** pour justifier son existence :

```bash
npm i @capacitor/core @capacitor/cli
npx cap init "Chap.ci" ci.chap.app
npx cap add ios
npx cap open ios      # ouvre Xcode
```

**Ajoute au minimum 2–3 fonctions natives** (c'est ce qui fait passer la règle 4.2) :
- 🔔 **Notifications push** (nouvelle annonce dans ta commune, réponse d'un vendeur) — l'argument le plus fort
- 📷 **Appareil photo** natif pour publier une annonce
- 📍 **Géolocalisation** native (annonces près de moi)
- 🔗 **Deep links** / partage natif
- Écran d'accueil natif (pas juste la WebView qui charge)

### Étapes
1. **Apple Developer Program — 99 $/an.** ⚠️ La **vérification d'organisation peut prendre 2 à 4 semaines** : **commence par ça**, aujourd'hui.
2. Build dans **Xcode** (il te faut un **Mac** — ou un service de build cloud type Codemagic/Ionic Appflow si tu n'en as pas).
3. Envoi via **App Store Connect** : icône 1024, captures d'écran par taille d'écran, description, mots-clés, **politique de confidentialité**, « Privacy Nutrition Labels ».
4. Revue : généralement **24–72 h**, mais prévois 1–2 allers-retours.

---

## 3. Récapitulatif

| | Google Play | App Store |
|---|---|---|
| **PWA acceptée telle quelle ?** | ✅ oui (TWA) | ❌ non |
| **Coût** | 25 $ une fois | 99 $ / an |
| **Outil** | PWABuilder / Bubblewrap | Capacitor + Xcode |
| **Mac nécessaire ?** | Non | Oui (ou build cloud) |
| **Délai réaliste** | quelques jours (ou +14 j si compte perso) | 2–6 semaines (vérif. du compte incluse) |
| **Piège principal** | `assetlinks.json` + keystore | règle 4.2 « site repackagé » |

## 4. Ordre conseillé

1. **Acheter le domaine `chap.ci`** et y déplacer l'app.
2. Publier le **manifeste + icônes + service worker** (tout est dans ce dossier).
3. Rédiger la **politique de confidentialité** (obligatoire des deux côtés).
4. **Ouvrir le compte Apple maintenant** (la vérification est longue) — même si tu publies iOS en second.
5. **Sortir sur Google Play d'abord** (rapide, peu cher, ta PWA est déjà prête).
6. **Ajouter les fonctions natives** (push, caméra, géoloc) puis **soumettre à Apple**.

## 5. Ce qu'il te faut préparer dans les deux cas

- Icône **1024×1024** ✅ (fournie)
- **Captures d'écran** de l'app (téléphone, et tablette pour Apple)
- **Description** courte + longue, mots-clés
- **Politique de confidentialité** hébergée à une URL publique
- **Compte e-mail de contact** développeur
