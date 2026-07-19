---
name: perf-mobile-ci
description: Performance mobile pour le contexte ivoirien — réseaux 3G/4G instables, forfaits data chers, téléphones Android d'entrée de gamme (Tecno/Infinix, peu de RAM). Budget de performance, poids de page, images (WebP/AVIF, lazy-load, ratios réservés), Core Web Vitals (LCP/CLS/INP), bundle JS (code-split, tree-shaking Vite), cache et offline (PWA/service worker), coût en Mo pour l'utilisateur, plein soleil. À utiliser dès qu'on optimise la vitesse, le poids ou la fluidité de Chap.ci sur mobile, ou qu'on diagnostique une lenteur.
---

# Performance mobile ivoirienne — vite et léger ⚡

Bureau **Performance & Fiabilité (⚡ Le Mécanicien)**. Contexte réel de Chap.ci :
la plupart des visiteurs sont sur **Android d'entrée de gamme** (Tecno, Infinix,
Samsung A), en **3G/4G instable**, avec un **forfait data qui coûte cher**. Chaque
Mo économisé, c'est de l'argent rendu à l'utilisateur et un client qui reste.

> Principe : **le poids est une fonctionnalité**. Une page qui met 8 s à charger sur
> un forfait de 500 F, c'est une vente perdue. On optimise pour le téléphone du
> marché de Yopougon, pas pour un iPhone en fibre.

## 1. Budget de performance (cibles)

| Métrique | Cible (mobile 3G rapide) | Pourquoi |
|---|---|---|
| **LCP** (plus gros élément) | < 2,5 s | la photo/prix doit apparaître vite |
| **CLS** (décalage visuel) | < 0,1 | pas de saut quand la photo charge |
| **INP** (réactivité) | < 200 ms | le tap répond tout de suite |
| **Poids page d'accueil** | < 300 Ko (hors images) | data chère |
| **JS initial** | < 150 Ko gzip | Android faible = JS lent à parser |

## 2. Images — le premier poste de poids

Les photos d'annonces **font tout le poids**. Règles :
- **Format moderne** : WebP (AVIF si dispo), fallback JPEG.
- **Redimensionner côté serveur** : servir une vignette grille (~400 px) ≠ la full.
- **`loading="lazy"`** sous la ligne de flottaison ; `decoding="async"`.
- **Ratio réservé** (`aspect-ratio` / hauteur fixe) → **zéro CLS** quand l'image arrive.
- `object-cover` + fond gris pendant le chargement (skeleton).
- **`srcset`/`sizes`** pour envoyer la bonne taille selon l'écran.
- Compresser à l'upload (qualité ~72) — inutile de stocker du 4 Mo.

## 3. JavaScript — moins et plus tard

- **Code-split par route** (Vite / React.lazy) : ne pas charger l'admin pour un visiteur.
- **Tree-shaking** : importer `{ X } from 'lib'`, jamais tout le paquet.
- Éviter les grosses libs (moment, lodash entier) → alternatives légères / natif.
- **Différer** le non-critique (analytics, widgets) après le premier rendu.
- Vérifier le **bundle** (`vite build` + rapport de taille) à chaque grosse feature.

## 4. Réseau & cache

- **PWA / service worker** : cache de l'app-shell → 2ᵉ visite quasi instantanée,
  et **fonctionnement dégradé hors-ligne** (réseau qui coupe).
- **HTTP cache** : `Cache-Control` long sur les assets versionnés (hash Vite).
- **Précharger** ce qui est certain (`<link rel="preload">` police critique, LCP image).
- **Compression** serveur (gzip/brotli) activée sur cPanel.
- Limiter les **allers-retours** API : regrouper, paginer, ne pas surcharger l'accueil.

## 5. Fluidité perçue (même quand c'est lent)

- **Skeletons** plutôt que spinner : la page semble arriver.
- **Optimistic UI** sur le favori (cœur qui réagit avant la réponse serveur).
- Animations **transform/opacity** uniquement (60 fps ; jamais animer `width`/`top`).
- **Cibles ≥ 44 px**, feedback tactile immédiat.

## 6. Contexte terrain

- **Plein soleil** : voir `a11y-contraste` — un écran lavé de lumière ne pardonne
  pas les gris clairs ; la perf inclut la lisibilité réelle dehors.
- **Batterie/CPU** : éviter les boucles d'animation permanentes, les timers inutiles.
- **Data saver** : respecter `prefers-reduced-data` si présent (images plus légères).

## Checklist d'audit (le Mécanicien)

- [ ] Lighthouse mobile (3G lente) : LCP/CLS/INP dans les cibles.
- [ ] Poids accueil < 300 Ko hors images ; JS initial < 150 Ko gzip.
- [ ] Images en WebP, `lazy`, ratio réservé, tailles servies adaptées.
- [ ] Code-split effectif (admin/dashboard non chargés pour un visiteur).
- [ ] Service worker/PWA en place, 2ᵉ visite rapide, offline dégradé OK.
- [ ] Compression + cache assets activés côté serveur.
- [ ] Rapport priorisé au Journal (`fichier:ligne`, Avant/Après, gain en Ko/ms).

> Règle d'or : le Mécanicien **mesure et propose** (chiffres réels, correctifs prêts).
> Le Patron ordonne. Le Dev exécute avec build + tests avant déploiement.
