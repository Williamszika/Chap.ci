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
- 🗄️ **Backend PHP auto-hébergé** : annonces, comptes, messagerie et commandes
  **partagés entre tous les utilisateurs**, sur votre propre hébergement
- 👤 **Comptes utilisateurs** : création de compte et connexion (email / mot de passe)
- 📍 **Géolocalisation** : position GPS des annonces (ou commune), distance
  « à X km de vous » sur chaque annonce, et tri **« Près de moi »**
- 🛒 **Panier & demandes d'achat** : « Acheter » envoie une demande au vendeur
  via la messagerie (regroupée par vendeur) — les contacts ne sont jamais exposés
- ⭐ **Avis vérifiés** : seuls les acheteurs d'un article peuvent le noter
- 🏪 **Profils vendeurs publics** (note, avis, annonces) + **tableau de bord**
  (achats, ventes, annonces, paramètres)
- 💚 **Faire un don** : soutien du site par **Mobile Money** (Orange Money,
  MTN MoMo, Moov Money, Wave) — numéros faciles à renseigner
- ❤️ **Favoris** enregistrés
- 📱 **PWA** installable + configuration **Capacitor** pour les apps natives
- 🌍 **Interface 100 % en français**, adaptée au marché ivoirien (FCFA, Orange/MTN/Moov…)

---

## 🔗 Le site en ligne

**https://chap.ci**

C'est le site réel, en production. Ouvrez-le sur votre téléphone : il propose de
s'installer comme une application (PWA), sans passer par un magasin.

L'application Android est publiée séparément — voir [`store/APP-VERSIONS.md`](store/APP-VERSIONS.md)
pour la version en cours.

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

## 🗄️ Backend & base de données

Le backend est **auto-hébergé** : un seul fichier PHP 8, [`server/index.php`](server/index.php),
qui sert toute l'API sous `/api/*` — comptes, annonces, messagerie, commandes, avis,
photos, publicités et comptabilité. Aucun service tiers, aucune dépendance à installer :
un hébergement mutualisé cPanel suffit.

> Ce backend a **remplacé Supabase** en juillet 2026. Il n'en reste rien dans le code —
> ni client, ni clé, ni table distante.

**Base de données** — `mysql` ou `pgsql` en production, `sqlite` pour un essai local.
Le pilote se choisit dans [`server/config.php`](server/config.php) (`db.driver`).
**Les tables se créent toutes seules** au premier appel : il n'y a aucun script SQL à
exécuter à la main.

**Configuration** — tout tient dans `server/config.php` : identifiants de base, secret de
session, emails administrateurs, SMTP, identifiants OAuth. Ce fichier vit **uniquement sur
le serveur** : il n'est jamais dans un zip de déploiement, et jamais dans ce dépôt.

**Connexions** — mot de passe, Google, Facebook, téléphone par code SMS, et double
authentification. Les identifiants OAuth publics sont servis par `/api/config` ; le front
n'a rien à connaître à la compilation. Voir
[`server/GUIDE-CONNEXION-GOOGLE-TELEPHONE.md`](server/GUIDE-CONNEXION-GOOGLE-TELEPHONE.md)
pour le site, et [`store/CONNEXION-GOOGLE-APP.md`](store/CONNEXION-GOOGLE-APP.md) pour
l'application Android.

**Photos** — envoyées en `data:` URI, converties, filigranées et écrites dans
`public_html/uploads/`. Aucun stockage externe.

---

## 🌍 Déploiement

Le site se déploie en extrayant **un zip** dans `public_html` sur cPanel. La procédure
complète, pas à pas, est dans [`DEPLOIEMENT.md`](DEPLOIEMENT.md).

Trois fichiers vivent **uniquement** sur le serveur et ne sont jamais dans le zip :
`api/config.php`, `uploads/` (toutes les photos des annonces) et `api/data/`. Le
`api/.htaccess` qui les protège non plus.

Après chaque déploiement, `https://chap.ci/api/health` donne les trois empreintes à
comparer au dépôt :

```bash
md5sum server/index.php web/seo.php dist/index.html   # les 12 premiers caractères
```

Le workflow [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) publie en plus une
**prévisualisation** sur GitHub Pages à chaque push. C'est un aperçu de build, pas le
site : la production est sur chap.ci.

---

## 🗂️ Structure du projet

```
src/
├── data/            # Données figées : catégories, 101 schémas de sous-catégories,
│                    #   découpage district → région → ville → commune, Mobile Money
├── pages/           # 26 pages, une par route (HashRouter)
├── components/      # 40 composants partagés — ListingCard est le plus sollicité
├── lib/             # 38 modules sans JSX : api.ts, backend.ts, marketing.ts, native.ts…
├── store/           # État global
└── types.ts         # Types partagés

server/index.php     # TOUT le backend : 105 routes, 34 tables, PHP 8
server/config.php    # Configuration — jamais déployée, jamais commitée
web/seo.php          # Rendu serveur pour les robots (aperçus WhatsApp, Google)
store/               # Ce qui part sur Google Play
.claude/bureaux/     # Les onze bureaux d'agents et leur socle commun
```

Deux fichiers à lire avant de toucher au code : [`CLAUDE.md`](CLAUDE.md) pour les règles,
[`CONTEXT.md`](CONTEXT.md) pour la carte et le vocabulaire du domaine.

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
| Apps natives   | Capacitor 6 (Android ; iOS configuré) |
| Backend        | PHP 8 en un fichier (`server/`)      |
| Base de données| MySQL / PostgreSQL (SQLite en local) |
| Hébergement    | cPanel / LiteSpeed, derrière Cloudflare |

> ℹ️ Le site est **en production** sur chap.ci, avec de vraies annonces et de vrais
> comptes. Le front ne stocke plus rien d'important localement : tout passe par l'API.

---

## 🎨 Régénérer les images de marque

**Un seul dessin, un seul endroit : `src/components/signeChapci.ts`.** Tout ce
qui porte le logo en sort, personne ne le recopie. Quatre générateurs, et un
contrôle qui juge le résultat.

```bash
node scripts/generate-icons.mjs     # icônes carrées : PWA, application, boutiques, favicon.ico
node scripts/generate-marque.mjs    # filigrane des photos + les deux écrans d'ouverture
node scripts/poser-signe.mjs        # favicon.svg + le SVG de démarrage dans index.html
CHROMIUM_PATH=… node scripts/generate-og.mjs      # les 19 bannières de partage
CHROMIUM_PATH=… node scripts/generate-store.mjs   # les 2 bannières de Play

node scripts/verif-signe.mjs        # ⬅ c'est LUI qui dit si c'est bon
```

Les deux derniers composent du texte et des emoji en couleur : ils ont besoin
d'un Chromium (`npm i --no-save playwright-core`, puis `CHROMIUM_PATH`). Les
trois premiers se contentent de `sharp`.

`verif-signe.mjs` balaie les dossiers — il ne lit aucune liste de noms — et
vérifie sur les pixels que chaque image porte bien la couronne, orange à
gauche et verte à droite. Il finit par une contre-épreuve : deux logos périmés
du dossier `marque/` qu'il DOIT refuser. Un contrôle qui ne sait pas dire non
ne contrôle rien.

---

## 📌 Feuille de route

Fait ✅
- Backend PHP auto-hébergé — annonces, comptes, messagerie et commandes partagés
- Connexions : mot de passe, Google, Facebook, téléphone (code SMS), 2FA
- Messagerie acheteur ↔ vendeur, contacts jamais exposés
- Paiement Mobile Money manuel (numéro du vendeur + USSD Orange/MTN/Moov/Wave)
- Géolocalisation : distance « à X km de vous » + tri « Près de moi »
- Photos filigranées, envoyées et stockées sur le serveur
- Publicités payantes, avis vérifiés, profils vendeurs, tableau de bord
- Comptabilité complète pour les impôts (registres chronologiques, exports)
- Site en production sur **chap.ci** · application Android sur Google Play

À venir ⏳
- 💳 Paiement mobile **automatisé** via une passerelle (CinetPay / PayDunya) —
  confirmation automatique, nécessite un compte marchand
- 🔔 Notifications push (via Capacitor)
- ⭐ Boost d'annonces & comptes professionnels
- 🍎 Application iOS — nécessite un Mac et Xcode

---

Fait avec ❤️ pour la Côte d'Ivoire.
