# Chap.ci — la carte mentale

À lire **avant** d'explorer le code. Ce fichier donne le vocabulaire du domaine et la
carte des modules. Les règles de travail sont dans [`CLAUDE.md`](CLAUDE.md).

Chap.ci est une place de marché de petites annonces **100 % ivoirienne**. Une seule base
de code sert le site web, la PWA installable et les applications Android/iOS. Le site
tourne à **chap.ci**, sur un hébergement cPanel/LiteSpeed, derrière Cloudflare.

---

## La langue du domaine

Le vocabulaire ci-dessous est celui du code, des interfaces et des conversations avec le
Patron. Les *Éviter* ne sont pas des questions de style : ce sont des mots qui ont déjà
provoqué des erreurs.

**Annonce**
Ce qu'un particulier met en vente. Table `listings`, page `Browse.tsx` /
`ListingDetail.tsx`. En anglais dans le code : *listing*.
*Éviter* : « ad », « publication ».

**Publicité**
Un encart **payant** acheté par un annonceur, affiché en rotation sur le site. Table
`ads`, page `Advertise.tsx`, route publique `/api/ads/active`.
⚠️ **`listings` et `ads` sont deux choses différentes.** Les confondre est l'erreur la
plus fréquente dans ce dépôt : `ads` n'a jamais désigné les annonces.

**Don**
Une annonce de la catégorie `a-donner`, et rien d'autre : c'est une `listing` ordinaire
dont le prix vaut **zéro**, forcé par le formulaire et affiché « Gratuit ». Aucune
contrepartie n'y est admise, **pas même « les frais de transport »** — c'est l'arnaque du
rayon, et le schéma refuse la publication. L'argent, donné ou demandé, n'y a pas sa place
non plus : Chap.ci n'est pas une plateforme de collecte.

**Vendeur / Acheteur**
Deux rôles du même compte (`users`), jamais deux types de compte. Un vendeur est un
utilisateur qui a publié au moins une annonce.

**Demande d'achat**
Ce que déclenche le bouton « Acheter » : un message au vendeur via la messagerie, pas une
transaction. Tables `orders` / `order_items`. **Les contacts ne sont jamais exposés**
avant que le vendeur ne réponde — c'est un choix produit, pas un oubli.

**Exercice**
Une année comptable (`exercices`). Un exercice **clos** est en lecture seule : aucune
écriture ne s'y ajoute, aucun numéro ne s'y renumérote.

**Écriture**
Une ligne du grand livre (`compta`), recette ou dépense. Les écritures d'un exercice sont
numérotées **chronologiquement** (`date_op`, puis `cree_le`, puis `id`) : insérer une
écriture antidatée renumérote tout l'exercice. C'est la loi ivoirienne sur les registres
du régime de l'entreprenant, pas une préférence.

**Bureau**
Un agent autonome qui tourne en routine planifiée et rend un compte-rendu au Patron.
Onze bureaux, décrits dans `.claude/bureaux/`. Chacun a un nom propre — 🛡️ Le Gardien,
🔨 Le Monteur, 📣 Le Crieur…
*Éviter* : « cron », qui désigne les tâches serveur, pas les bureaux.

**Le Patron**
Le propriétaire du site. Toute communication lui est adressée en français, avec le
« vous » respectueux. Il n'est pas développeur : les instructions qu'on lui donne doivent
être exécutables sans interprétation.

**Empreinte**
Les 12 premiers caractères du md5 d'un fichier déployé, exposés par `/api/health`. C'est
la seule façon de savoir ce qui tourne réellement en production. Voir *le triangle* plus
bas.

**Le zip**
Le mode de déploiement du site : une archive **extraite** dans `public_html`. Extraire
écrase ; téléverser un fichier seul n'écrase que lui. Cette distinction a déjà coûté deux
pannes.

---

## La carte

### Le front — React 18 + TypeScript + Vite + Tailwind

| Chemin | Ce qu'il contient |
|---|---|
| `src/pages/` | 26 pages, une par route. `HashRouter` — les URL portent un `#`. |
| `src/components/` | 40 composants partagés. `ListingCard` est le plus chaud : il est rendu des dizaines de fois par écran. |
| `src/lib/` | 38 modules sans JSX. `api.ts` et `backend.ts` parlent au serveur ; `marketing.ts` porte la garde `isNative` ; `native.ts` isole Capacitor. |
| `src/data/` | Les données figées : catégories, 101 schémas de sous-catégories, découpage district → région → ville → commune. |
| `src/store/` | L'état global. |

Le build produit `dist/`, qui devient la racine du site.

### Le back — un seul fichier PHP 8

`server/index.php`, ~464 000 octets, **105 routes**, **34 tables**, `strict_types=1`.

Les familles de routes, par volume :

| Famille | Routes | Ce qu'elle couvre |
|---|---|---|
| `admin/*` | 61 | tableau de bord, comptabilité, modérateurs, campagnes, réglages |
| `auth/*` | 15 | mot de passe, Google, Facebook, téléphone (OTP), 2FA |
| `cron/*` | 13 | tâches planifiées appelées par cPanel avec la clé cron |
| `notifications/*`, `mod/*`, `ads/*` | 15 | notifications, file de modération, publicités |
| le reste | ~30 | annonces, favoris, avis, commandes, messagerie, santé |

Le fichier est monolithique par choix : l'hébergement mutualisé n'offre ni composer ni
autoloader fiable. Il se lit par bandeaux de commentaires (`// ---- P1 · … ----`).

`server/config.php` porte les identifiants et n'est **jamais** déployé — voir `CLAUDE.md`.

### Le triangle du déploiement

Trois morceaux partent séparément, et chacun peut rester en arrière sans que les autres
le signalent. `/api/health` expose une empreinte par morceau :

| Dépôt | Production | Champ de `/api/health` |
|---|---|---|
| `server/index.php` | `public_html/api/index.php` | `empreinte` |
| `web/seo.php` | `public_html/seo.php` | `empreinteSeo` |
| `dist/index.html` | `public_html/index.html` | `empreinteSite` |

Elles se comparent en une commande :

```bash
md5sum server/index.php web/seo.php dist/index.html   # les 12 premiers caractères
```

**Chaque empreinte ne prouve que son propre fichier.** Un bureau a déjà écrit « correctif
`seo.php` confirmé déployé grâce à l'empreinte » en lisant `empreinte`, qui ne couvre que
l'API. Une vérification qui ne peut pas échouer ne vérifie rien.

### Les notifications

Trois voies, et il faut les distinguer avant de toucher à l'une d'elles :

| Voie | Où elle vit | Qui elle atteint |
|---|---|---|
| **La cloche** | table `notifications`, `NotificationBell.tsx` | seulement pendant qu'on regarde le site |
| **Le push** | table `push_subs`, `public/push-sw.js`, `src/lib/push.ts` | téléphone verrouillé, navigateur fermé — mais seulement les appareils abonnés |
| **L'e-mail de repli** | `push_repli_email()` dans `server/index.php` | tout le monde, avec le délai d'une boîte mail |

`notify()` écrit la cloche et **empile** dans `$GLOBALS['CHAPCI_PUSH']` ; le vidage a lieu
après la réponse (`register_shutdown_function` + `litespeed_finish_request`), pour que
personne n'attende les serveurs de Google au milieu d'une action. Si aucun appareil n'a
été touché, l'e-mail prend le relais — mais seulement pour `message` et `listing`, seulement
si la personne n'a pas été vue depuis 15 minutes, et au plus une fois par demi-heure.

La paire VAPID du site vit dans `api/data/push.json` (0600), **créée toute seule au premier
besoin**. Il n'y a rien à configurer, et rien à mettre dans `config.php`. En revanche
**perdre ce fichier casse tous les abonnements d'un coup** : chaque téléphone devrait
réactiver ses notifications à la main, et personne ne le ferait.

Deux bancs, à relancer après toute retouche :

```bash
npm run banc:push   # vecteur d'essai RFC 8291 §5 + contrat serveur ↔ service worker
```

Le premier compare octet pour octet au vecteur publié par la RFC ; le second charge le vrai
`push-sw.js` dans un faux service worker et lui envoie un vrai événement `push`. Sans eux,
une erreur d'un seul bit donne une notification que le navigateur rejette **en silence**.

**L'application Android n'a pas le push.** La WebView d'Android n'implémente pas l'API
Push : le push marche sur chap.ci dans Chrome, pas dans l'application empaquetée. L'y
amener demande Firebase (`google-services.json`, `@capacitor/push-notifications`, une clé
de service dans `api/data/`) et une nouvelle version sur le Play Store. L'écran de réglage
le dit à la personne au lieu de lui montrer un bouton qui ne ferait rien.

### L'application

`capacitor.config.ts` (appId `ci.chap.app`), `android/`, et `scripts/android-slim.mjs`
chaîné dans `cap:sync` / `cap:android`. Les numéros de version vivent **uniquement** dans
`store/APP-VERSIONS.md` — les figer ailleurs a déjà fait raisonner six bureaux sur une
application vieille de quinze builds.

### Les bureaux

`.claude/bureaux/` : un `routine-*.md` par bureau, plus `BUREAUX.md` (l'annuaire) et
`JOURNAL.md` (le registre chronologique). Les compétences qu'ils utilisent sont dans
`.claude/skills/`.

---

## Les pièges qui coûtent cher

**`strict_types=1` est déclaré ligne 8.** Un réglage sans valeur par défaut dans le bloc
`$config += [...]` devient `null`, et `rtrim(null)` est une erreur fatale — sur **toutes**
les versions de PHP 8, pas seulement les récentes. Tout nouveau réglage prend une valeur
par défaut dans le même mouvement.

**Les photos sont dans `public_html/uploads/`**, à la racine — pas dans `api/uploads/`.
`uploads_dir` vaut `__DIR__ . '/../uploads'`.

**Cloudflare est devant le site.** Une tâche cPanel qui appelle `https://chap.ci` sort sur
Internet et revient par le CDN : elle n'est **pas** vue comme locale. Toute logique qui
distingue « local » de « externe » sur la base de l'adresse IP se trompe.

**cPGuard surveille l'hébergement.** L'antivirus de l'hébergeur met en quarantaine tout
fichier PHP qui correspond à la signature `{HEX}Malware.Expert.php.file.put.contents.php`.
Le 3 août 2026, il a supprimé `api/index.php` à chaque installation pendant onze heures.
Le code n'écrit plus jamais de fichier exécutable à l'exécution — voir `CLAUDE.md`.

**Les administrateurs ne s'ajoutent pas en base.** Une insertion directe dans `admins`
déclenche l'alerte d'intégrité `admins_tampered`. Ils se créent par l'interface.

**Une catégorie se déclare à cinq endroits, et il n'y a pas de raccourci.** En oublier un
donne une catégorie qui s'affiche mais dont le formulaire est générique, ou dont l'aperçu
WhatsApp est un rectangle gris :

| | |
|---|---|
| `src/data/categories.ts` | l'entrée : identifiant, nom, icône *(qui doit exister dans `CategoryIcon.tsx`)*, couleur |
| `src/data/sous/noms.ts` | les noms des sous-catégories — c'est tout ce que l'accueil télécharge |
| `src/data/sous/<fichier>.ts` + `sous/index.ts` | le schéma des formulaires, chargé à la demande |
| `server/index.php` | `seo_category_labels()` **et** `category_label()` |
| `web/seo.php` + `public/og/<id>.png` | les pages `/vendre/…` (23 URL de plus au sitemap) et la bannière de partage, que `scripts/generate-og.mjs` compose |

`npm run banc` refuse de passer si `noms.ts` et les schémas divergent. Il ne voit rien des
trois derniers points — c'est à vous de les faire.
