# 🇨🇮 Chap.ci — La marketplace des petites annonces en Côte d'Ivoire

**Chap.ci** est une place de marché de petites annonces inspirée d'**OLX** et **eBay**,
mais **100 % ivoirienne** : achetez et vendez partout en Côte d'Ivoire, organisé par
**district → région → ville → commune**.

Une seule base de code sert à la fois de **site web** et d'**application mobile**
installable sur **iPhone (iOS)** et **Android**.

---

## ✨ Fonctionnalités

- 🏠 **Accueil** : recherche, catégories, annonces à la une et récentes
- 🔎 **Explorer** : filtres puissants — catégorie, sous-catégorie, localisation,
  état (neuf / occasion), fourchette de prix, tri
- 📍 **Localisation ivoirienne complète** : 14 districts (dont les 2 districts
  autonomes d'Abidjan et Yamoussoukro), 31 régions, principales villes et les
  13 communes d'Abidjan
- 📦 **Fiche annonce** : galerie photos, prix (négociable), état, description,
  vendeur, contact direct par **appel** et **WhatsApp**, annonces similaires
- ➕ **Publier une annonce** : envoi de photos, catégorie, prix, localisation,
  livraison, coordonnées — persistées sur l'appareil
- ❤️ **Favoris** enregistrés localement
- 👤 **Compte** : mes annonces, statistiques, guide d'installation de l'app
- 📱 **PWA** installable + configuration **Capacitor** pour les apps natives
- 🌍 **Interface 100 % en français**, adaptée au marché ivoirien (FCFA, Orange/MTN/Moov…)

---

## 🚀 Démarrage (site web)

Prérequis : **Node.js 18+**.

```bash
npm install        # installer les dépendances
npm run dev        # serveur de développement -> http://localhost:5173
npm run build      # build de production dans dist/
npm run preview    # prévisualiser le build de production
```

---

## 📱 Applications mobiles (iPhone & Android)

Deux manières d'utiliser Chap.ci sur mobile :

### 1. En PWA (le plus simple, sans store)

Le site est une **Progressive Web App** : il s'installe directement depuis le navigateur.

- **iPhone** : ouvrir le site dans **Safari** → *Partager* → *Sur l'écran d'accueil*.
- **Android** : ouvrir dans **Chrome** → menu ⋮ → *Installer l'application*.

L'app s'ajoute alors à l'écran d'accueil, avec son icône et un affichage plein écran.

### 2. En applications natives (App Store & Play Store) via Capacitor

Le projet est déjà configuré avec **[Capacitor](https://capacitorjs.com/)**
(`capacitor.config.ts`) pour empaqueter **exactement le même code** dans de
vraies applications natives.

```bash
# 1. Installer les plateformes natives
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios          # nécessite macOS + Xcode

# 2. Construire le web puis synchroniser
npm run cap:android      # build + sync + ouvre Android Studio
npm run cap:ios          # build + sync + ouvre Xcode (macOS)
```

Ensuite, on génère l'APK/AAB (Android Studio) ou l'IPA (Xcode) pour publication
sur le **Google Play Store** et l'**App Store**.

- **App ID** : `ci.chap.app`
- **Nom** : `Chap.ci`

---

## 🗂️ Structure du projet

```
src/
├── data/
│   ├── locations.ts      # Districts, régions, villes et communes de Côte d'Ivoire
│   ├── categories.ts     # Catégories & sous-catégories d'annonces
│   └── seedListings.ts   # Annonces de démonstration
├── components/           # Header, BottomNav, cartes, feuilles modales, sélecteur de lieu…
├── pages/                # Home, Browse, ListingDetail, PostAd, Favorites, Profile
├── store/AppContext.tsx  # État global + persistance localStorage
├── lib/                  # Formatage, placeholders d'images, hooks
└── types.ts              # Types partagés
```

---

## 🛠️ Stack technique

| Élément        | Technologie                          |
| -------------- | ------------------------------------ |
| Framework      | React 18 + TypeScript                |
| Build          | Vite 5                               |
| Styles         | Tailwind CSS 3                       |
| Routage        | React Router 6                       |
| Icônes         | lucide-react                         |
| PWA            | vite-plugin-pwa (Workbox)            |
| Apps natives   | Capacitor 6 (iOS + Android)          |
| Données        | localStorage (démo, sans backend)    |

> ℹ️ Cette version fonctionne **entièrement côté client** (données de démonstration
> et annonces créées stockées sur l'appareil). Pour une mise en production réelle,
> il suffit de brancher un backend (API + base de données + authentification +
> upload d'images) au niveau de `src/store/AppContext.tsx`.

---

## 🎨 Régénérer les icônes

Les icônes de l'app sont générées à partir de `public/favicon.svg` :

```bash
npm i -D sharp
node scripts/generate-icons.mjs
```

---

## 📌 Feuille de route (idées d'évolution)

- Backend + authentification (téléphone / OTP)
- Messagerie intégrée acheteur ↔ vendeur
- Paiement mobile (Orange Money, MTN MoMo, Wave)
- Boost d'annonces & comptes professionnels
- Notifications push (via Capacitor)
- Géolocalisation « autour de moi »

---

Fait avec ❤️ pour la Côte d'Ivoire.
