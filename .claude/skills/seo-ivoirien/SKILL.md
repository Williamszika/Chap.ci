---
name: seo-ivoirien
description: SEO et visibilité pour une marketplace ivoirienne — faire voir le site ET l'app par tout le net. Recherche de mots-clés à partir des annonces réelles (français ivoirien + Nouchi + noms de communes/quartiers d'Abidjan et de CI), données structurées schema.org (Product/Offer, prix FCFA/XOF, dispo), sitemap.xml, robots.txt, balises Open Graph/Twitter, IndexNow (push instantané vers Bing/Yandex), Google Search Console, indexation Google, aperçus WhatsApp/Facebook. À utiliser dès qu'on veut améliorer le référencement de Chap.ci, pousser les mots-clés des annonces sur Google et partout, ou diagnostiquer un problème de visibilité.
---

# SEO ivoirien — être vu partout sur le net 📣

Objectif du bureau **Croissance (📣 Le Crieur)** : que **tout le net** — Google en
tête, mais aussi Bing, les réseaux, WhatsApp — voie **le site et l'application**
Chap.ci, et que chaque annonce publiée devienne une **porte d'entrée** indexée.

> Principe : chaque annonce est une page. Chaque page bien balisée est un vendeur
> silencieux qui travaille 24 h/24 sur Google. On transforme le catalogue en trafic.

Cette base s'appuie sur `design-ivoirien` (ton, vocabulaire) et `marketplace-design`
(le prix FCFA est central partout).

## 1. Les mots-clés viennent des annonces réelles

Ne pas inventer les mots-clés : les **extraire des vraies annonces** (titre,
catégorie, commune). Un Ivoirien ne cherche pas « smartphone d'occasion » mais
**« iPhone Cocody »**, **« terrain Bingerville »**, **« gbaka »**, **« groupe électrogène Yopougon »**.

Sources de mots-clés à croiser :
- **Catégorie + commune** : `canapé Angré`, `voiture Marcory`, `chambre Riviera`.
- **Marque + modèle** réels tirés des titres (Tecno, Infinix, iPhone, Toyota…).
- **Intention + prix** : `moins de 50000 FCFA`, `pas cher Abidjan`, `bon prix`.
- **Français ivoirien / Nouchi** utiles : `chap-chap`, `occas`, `enjaillé`, mais
  toujours **doublés d'un terme standard** (le robot indexe les deux).
- **Villes hors Abidjan** : Bouaké, Yamoussoukro, Daloa, San-Pédro, Korhogo.

Livrable type : une liste priorisée `mot-clé → volume estimé → annonces qui
peuvent le porter → page cible`. On **ne bourre jamais** : le mot-clé doit être
vrai dans la page (titre, description, `<h1>`), sinon Google pénalise.

## 2. Données structurées (schema.org) — les « rich results »

Chaque fiche annonce sert un **JSON-LD `Product`** (voir `web/seo.php` →
`render_page()`). Cela permet à Google d'afficher **prix, disponibilité, image**
directement dans les résultats → beaucoup plus de clics.

```json
{
  "@context": "https://schema.org", "@type": "Product",
  "name": "iPhone 12 — 180 000 FCFA",
  "offers": { "@type": "Offer", "price": 180000, "priceCurrency": "XOF",
              "availability": "https://schema.org/InStock", "areaServed": "CI" }
}
```

Règles :
- **`priceCurrency` = `XOF`** (le code ISO du franc CFA ; on affiche « FCFA » à l'humain).
- `availability` = `InStock` sinon `SoldOutOfStock` quand `sold`.
- Le prix du JSON-LD **doit égaler** le prix affiché (sinon « rich result » refusé).
- Vendeur → envisager `@type: Person`/`Organization` sur `/vendeur/{id}`.

## 3. Le trio d'indexation : sitemap · robots · canonical

- **`sitemap.xml`** (déjà servi par `web/seo.php`) : liste les annonces non masquées,
  `<lastmod>`, `<changefreq>daily</changefreq>`. À déclarer dans Search Console.
- **`robots.txt`** (racine) : autoriser le crawl + pointer le sitemap :
  ```
  User-agent: *
  Allow: /
  Sitemap: https://chap.ci/sitemap.xml
  ```
- **`<link rel="canonical">`** : sur chaque annonce, l'URL propre `/annonce/{id}`
  (pas la version `#/`, non indexable). Déjà en place.
- **`<meta name="robots" content="index, follow">`** sur les pages à indexer ;
  `noindex` sur les pages privées (compte, dashboard, admin).

## 4. IndexNow — pousser instantanément (Bing, Yandex…)

Pour que le net voie une annonce **dès sa création** (sans attendre le prochain
crawl), utiliser **IndexNow** : un simple `POST`/`GET` signale l'URL neuve.

- Générer **une clé** (fichier `https://chap.ci/<clé>.txt` contenant la clé).
- À chaque **création/mise à jour** d'annonce, pinger :
  ```
  https://api.indexnow.org/indexnow?url=https://chap.ci/annonce/{id}&key=<clé>
  ```
- Effet : Bing/Yandex indexent en minutes. Google ne consomme pas IndexNow mais
  suit le sitemap + les liens ; on garde donc le sitemap frais.

> Garde-fou : l'appel IndexNow est un **effet de bord réseau**. Le bureau le
> **propose** ; le Dev l'implémente côté serveur (création d'annonce) avec un
> `try/catch` silencieux pour ne jamais bloquer la publication.

## 5. Google Search Console & Google Business

- **Search Console** : prouver la propriété (balise `<meta name="google-site-verification">`
  ou fichier), soumettre le `sitemap.xml`, surveiller couverture + requêtes réelles.
- Les **requêtes** de Search Console alimentent la boucle du § 1 (vrais mots tapés).
- **Google Business Profile** pour la marque « Chap.ci » (renforce le knowledge panel).

## 6. Partage social (aperçus riches)

Open Graph + Twitter Card sont déjà servis par `web/seo.php`. Vérifier :
- `og:image` en **URL absolue** (la 1ʳᵉ photo de l'annonce), ratio large.
- `og:title` = titre + prix FCFA ; `og:description` = accroche courte.
- Tester avec les validateurs Facebook/Twitter/WhatsApp après tout changement.

## 7. L'application aussi doit être vue

- **PWA** : `manifest.webmanifest` (nom, icônes, couleur) → « Ajouter à l'écran d'accueil ».
- Balises `apple-touch-icon`, `theme-color`.
- Liens vers l'app (stores éventuels) + `og` sur la page d'accueil.
- Une page d'accueil indexable qui **décrit** l'app (Google indexe la marque).

## Checklist d'audit (le Crieur, tous les 2 jours)

- [ ] JSON-LD `Product` valide sur un échantillon d'annonces (test rich results).
- [ ] `sitemap.xml` se génère, `<lastmod>` récent, présent dans Search Console.
- [ ] `robots.txt` présent et pointe le sitemap.
- [ ] IndexNow pingé sur les dernières annonces (logs).
- [ ] 10 nouveaux mots-clés priorisés depuis les annonces récentes + page cible.
- [ ] Aperçus OG OK (WhatsApp/Facebook) sur 3 annonces test.
- [ ] Pages privées en `noindex` (aucune fuite compte/admin dans l'index).
- [ ] Rapport de propositions au Journal — **aucune modif de code par la routine**.

> Règle d'or : le Crieur **propose** (mots-clés, correctifs SEO prêts, `fichier:ligne`).
> Le Patron ordonne. Le Dev exécute (build + tests) avant tout déploiement.
