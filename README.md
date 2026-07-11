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
  livraison, coordonnées
- 🗄️ **Backend Supabase** : annonces **partagées entre tous les utilisateurs**
  (avec repli local automatique si le backend n'est pas configuré)
- 👤 **Comptes utilisateurs** : création de compte et connexion (email / mot de passe)
- 💚 **Faire un don** : soutien du site par **Mobile Money** (Orange Money,
  MTN MoMo, Moov Money, Wave) — numéros faciles à renseigner
- ❤️ **Favoris** enregistrés
- 📱 **PWA** installable + configuration **Capacitor** pour les apps natives
- 🌍 **Interface 100 % en français**, adaptée au marché ivoirien (FCFA, Orange/MTN/Moov…)

---

## 🔗 Application en ligne (test)

Une fois GitHub Pages activé (voir plus bas), l'application est accessible à :

**https://williamszika.github.io/Chap.ci/**

Ouvrez cette adresse sur votre téléphone pour tester et installer l'app.

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

## 🗄️ Backend & base de données (Supabase)

Les annonces et les comptes sont gérés par **[Supabase](https://supabase.com)**.
Sans configuration, l'application fonctionne en **mode local** (démo + appareil).
Pour activer le **backend partagé** :

1. **Créer les tables** : ouvrez votre projet Supabase → **SQL Editor** →
   *New query* → collez tout le fichier [`supabase/schema.sql`](supabase/schema.sql)
   → **Run**. Cela crée les tables (profils, annonces, conversations, messages)
   et les règles de sécurité (RLS).
2. **Comptes utilisateurs** : dans Supabase → **Authentication** → *Sign In / Providers*
   → **Email**. Pour des inscriptions immédiates (recommandé au lancement),
   désactivez **« Confirm email »**. Sinon, les utilisateurs devront confirmer
   leur email avant de se connecter.
3. **Clés d'API** : l'URL et la clé publique (`anon` / `publishable`) sont lues
   depuis les variables d'environnement `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY` (voir `.env.example`), avec des valeurs par défaut
   dans `src/lib/supabaseClient.ts`.

> 🔒 La clé « publishable » est **publique par conception** : la sécurité repose
> sur les règles **RLS**. Les mots de passe / codes PIN ne transitent jamais par le site.

---

## 🌍 Déploiement (URL de test)

Le dépôt contient un workflow GitHub Actions
([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)) qui
construit et publie automatiquement l'application sur **GitHub Pages** à chaque
push.

**Activation (à faire une seule fois)** : dans GitHub → **Settings** → **Pages**
→ *Build and deployment* → **Source : « GitHub Actions »**. Le prochain
déploiement publiera le site sur **https://williamszika.github.io/Chap.ci/**.

Pour utiliser des clés Supabase différentes en production, ajoutez-les dans
**Settings → Secrets and variables → Actions → Variables** :
`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

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

## 📌 Feuille de route

Fait ✅
- Backend Supabase + annonces partagées entre tous les utilisateurs
- Comptes utilisateurs (email / mot de passe)
- Messagerie acheteur ↔ vendeur en temps réel
- Paiement Mobile Money manuel (numéro du vendeur + USSD Orange/MTN/Moov/Wave)
- Option de don par Mobile Money
- Déploiement web (GitHub Pages)

À venir ⏳
- 💳 Paiement mobile **automatisé** via une passerelle (CinetPay / PayDunya) —
  confirmation automatique, nécessite un compte marchand
- 🖼️ Photos via Supabase Storage (au lieu de l'encodage base64)
- 🔔 Notifications push (via Capacitor)
- 📍 Géolocalisation « autour de moi »
- ⭐ Boost d'annonces & comptes professionnels

---

Fait avec ❤️ pour la Côte d'Ivoire.
