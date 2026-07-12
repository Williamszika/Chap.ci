# Chap.ci — Publier l'app sur Google Play et l'App Store

> Chap.ci est prête pour les stores : le projet est configuré avec **Capacitor**,
> qui empaquette exactement le même code web dans de **vraies applications natives**
> Android et iOS. Ce guide donne les commandes exactes et la checklist des stores.

---

## 0. Ce qui est déjà prêt dans le dépôt ✅

| Élément | État |
|---|---|
| Config Capacitor (`capacitor.config.ts`) | ✅ appId `ci.chap.app`, nom « Chap.ci » |
| Paquets natifs (`@capacitor/android`, `@capacitor/ios`) | ✅ installés |
| Sources d'icône & splash (`assets/icon.png`, `assets/splash.png`) | ✅ fournies |
| Écran de démarrage (SplashScreen) | ✅ configuré (fond crème) |
| **Politique de confidentialité** (obligatoire pour les 2 stores) | ✅ page en ligne |
| PWA (manifeste, service worker, icônes) | ✅ déjà en place |

**URL de la politique de confidentialité** (à coller dans les 2 stores) :
`https://williamszika.github.io/Chap.ci/#/confidentialite`
*(après achat du domaine : `https://chap.ci/#/confidentialite`)*

---

## 1. Prérequis (sur ton Mac)

- **Node.js 18+** et le dépôt cloné (`npm install`).
- **Android** : [Android Studio](https://developer.android.com/studio) (inclut le SDK + JDK).
- **iOS** : **macOS** + **Xcode** (App Store) + **CocoaPods** (`sudo gem install cocoapods`).
- **Comptes développeur** :
  - **Google Play Console** — 25 $ une seule fois.
  - **Apple Developer Program** — 99 $/an.

---

## 2. Générer les projets natifs (une seule fois)

```bash
npm install
npm run build                 # génère dist/
npx cap add android           # crée le dossier android/
npx cap add ios               # crée le dossier ios/  (macOS)
npm run assets                # génère toutes les icônes + splash depuis assets/
npx cap sync                  # copie le web + plugins dans les projets natifs
```

> `npm run assets` utilise `@capacitor/assets` (installe `sharp` automatiquement sur
> macOS) pour produire toutes les tailles d'icônes et de splash à partir de
> `assets/icon.png` (1024×1024) et `assets/splash.png` (2732×2732).

À chaque modification du code web ensuite : `npm run build && npx cap sync`.

---

## 3. Android — Google Play 🤖

### A. Ouvrir et configurer
```bash
npm run cap:android           # build + sync + ouvre Android Studio
```
- Dans Android Studio : laisse-le télécharger le SDK/Gradle si demandé.
- Vérifie le **version code** (entier, +1 à chaque mise à jour) et le **version name**
  dans `android/app/build.gradle`.

### B. Générer le paquet signé (.aab)
1. **Build → Generate Signed Bundle / APK → Android App Bundle**.
2. **Crée un keystore** (fichier `.jks`) et **garde-le précieusement + son mot de passe**.
   > ⚠️ Keystore perdu = impossible de mettre à jour l'app sous ce nom. Sauvegarde-le.
3. Choisis **release** → tu obtiens un fichier **`.aab`**.

### C. Publier sur la Play Console
1. **Créer une application** → nom « Chap.ci », langue français.
2. Téléverse le **`.aab`** dans un canal (test interne d'abord, puis production).
3. Remplis la fiche : icône 512, bannière 1024×500, **captures d'écran** (min. 2),
   description courte + longue, **URL de politique de confidentialité** (voir §0),
   catégorie « Shopping », classification du contenu, formulaire **Sécurité des données**.
4. ⚠️ **Compte perso neuf** : Google impose un **test fermé (~12 testeurs, 14 jours)**
   avant la production. Un **compte organisation** évite cette attente.

---

## 4. iOS — App Store 🍎 (macOS requis)

### A. Ouvrir Xcode
```bash
npm run cap:ios               # build + sync + ouvre Xcode
```

### B. Signer
- Onglet **Signing & Capabilities** → connecte ton **compte Apple Developer** (Team).
- **Bundle Identifier** : `ci.chap.app` (doit correspondre à un App ID créé sur
  developer.apple.com).
- Renseigne les **permissions** dans `ios/App/App/Info.plist` :
  - `NSLocationWhenInUseUsageDescription` = « Chap.ci utilise votre position pour vous
    montrer les annonces proches. »
  - `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` = « Pour ajouter des
    photos à vos annonces. »

### C. Envoyer
1. **Product → Archive** → **Distribute App → App Store Connect**.
2. Sur **appstoreconnect.apple.com** : crée l'app (Bundle ID `ci.chap.app`), remplis la
   fiche (nom, sous-titre, description, mots-clés, **captures d'écran** par taille
   d'iPhone requise), **URL de politique de confidentialité** (§0), catégorie, âge.
3. Remplis **App Privacy** (données collectées : compte, localisation, contenu
   utilisateur) et soumets pour **review** (souvent 24–48 h).

---

## 5. Le domaine `chap.ci` (fortement recommandé)

Ton app est sur `williamszika.github.io/Chap.ci/`. Acheter **`chap.ci`** apporte :
- une **URL de confidentialité** propre et crédible (obligatoire pour les stores),
- la possibilité d'**App Links / Universal Links** (ouvrir l'app depuis un lien web),
- une meilleure image de marque.
Non bloquant pour publier, mais recommandé avant le lancement public.

---

## 6. Checklist avant soumission

- [ ] `npm run build && npx cap sync` sans erreur
- [ ] Icônes + splash générés (`npm run assets`)
- [ ] App testée sur un vrai téléphone (recherche, publier une annonce, messagerie)
- [ ] Politique de confidentialité en ligne (§0)
- [ ] Captures d'écran préparées (Android + chaque taille d'iPhone)
- [ ] Description courte + longue rédigées
- [ ] Keystore Android sauvegardé / compte Apple Developer actif
- [ ] Formulaires « Sécurité des données » (Google) et « App Privacy » (Apple) remplis
