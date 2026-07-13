# Chap.ci — Backend PHP (MySQL **ou PostgreSQL**) auto-hébergé sur cPanel / TPE Cloud

Ce dossier `server/` est un **backend complet en PHP** qui remplace Supabase.
Il tourne sur un **hébergement mutualisé classique** (cPanel, PHP 8+, base **MySQL
_ou_ PostgreSQL**) — donc compatible avec l'offre **TPE Cloud à 50 000 FCFA/an**.
Aucun Docker, Node.js ou service externe requis. Choisissez le moteur proposé par
votre cPanel via `driver` (`mysql` ou `pgsql`) — le reste est identique.

Il gère : **comptes** (email + mot de passe, JWT), **annonces partagées**,
**messagerie**, **commandes**, **avis** (réservés aux acheteurs), **profils**, et le
**stockage des photos en fichiers** (pas de base64 en base).

> ℹ️ En mode PHP, l'app n'utilise PAS : connexion Google/Apple, SMS, 2FA (ces options
> nécessitent des services externes mal adaptés au mutualisé). L'email + mot de passe
> couvre l'essentiel. La messagerie « temps réel » fonctionne par **rafraîchissement
> automatique** (polling) au lieu des websockets.

---

## Déploiement sur cPanel (TPE Cloud) — pas à pas

### 1. Base de données (MySQL **ou** PostgreSQL)
Dans cPanel → **Bases de données MySQL** _ou_ **Bases de données PostgreSQL** (selon
ce que propose votre hébergeur) :
- Créez une base (ex. `monuser_chapci`)
- Créez un utilisateur + mot de passe, et **ajoutez-le à la base avec TOUS les privilèges**.
- Notez : nom de la base, utilisateur, mot de passe, hôte (souvent `localhost`).

Les tables se créent **automatiquement** au premier appel de l'API (pas de SQL à
importer, quel que soit le moteur).

### 2. Configurer
Éditez `server/config.php` (ou définissez les variables d'environnement). Mettez
`mysql` ou `pgsql` selon votre base :
```php
'driver' => 'pgsql',   // ou 'mysql'
'host'   => 'localhost',
'port'   => '',        // laissez vide (5432 pgsql / 3306 mysql) ou précisez
'name'   => 'monuser_chapci',
'user'   => 'monuser_chapci',
'pass'   => 'VOTRE_MOT_DE_PASSE',
```
Et surtout, mettez un **`jwt_secret`** long et aléatoire (ex. 40+ caractères).

### 3. Téléverser les fichiers
Via le **Gestionnaire de fichiers** cPanel, dans `public_html/` :
```
public_html/
├── index.html, assets/…      ← le SITE (contenu de dist/, voir plus bas)
├── api/                       ← tout le contenu de ce dossier server/
│   ├── index.php
│   ├── config.php
│   └── .htaccess
└── uploads/                   ← créé automatiquement (photos), sécurisé
```

### 4. Construire et téléverser le site (frontend)
Sur votre machine :
```bash
# Le site parle au backend PHP situé sous /api sur le même domaine
VITE_BACKEND=php VITE_API_URL=/api npm run build
```
Puis téléversez le contenu de `dist/` dans `public_html/`.

### 5. Tester
Ouvrez `https://votre-domaine/api/health` → doit répondre `{"ok":true,...}`.
Puis ouvrez `https://votre-domaine/` → créez un compte, publiez une annonce.

---

## Test en local (avant de déployer)
```bash
# SQLite, aucun MySQL requis
CHAPCI_DB_DRIVER=sqlite CHAPCI_SQLITE=./server/data/dev.sqlite \
CHAPCI_JWT_SECRET=dev CHAPCI_UPLOADS_DIR=./server/uploads CHAPCI_UPLOADS_PATH=/uploads \
php -S 127.0.0.1:8099 -t . server-router.php
```

## Endpoints (résumé)
`POST /api/auth/signup|login` · `GET /api/auth/me` · `POST /api/auth/password|delete`
`GET|POST /api/listings` · `DELETE /api/listings/{id}`
`GET|POST /api/conversations` · `GET|POST /api/conversations/{id}/messages`
`GET|POST /api/orders` · `PATCH /api/orders/{id}` · `GET /api/purchased`
`GET|POST /api/reviews` · `GET /api/profile/{id}` · `PUT /api/profile`
