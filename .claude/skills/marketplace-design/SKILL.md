---
name: marketplace-design
description: Design de marketplace / petites annonces — anatomie de la carte d'annonce, grilles d'annonces (colonnes, gouttières, densité), signaux de confiance (badges vérifié/neuf/livraison, avis vendeur, état vendu), recherche et filtres, catégories, états vides et squelettes de chargement, affichage des prix (FCFA, négociable, promo), et patterns de conversion (favori, contacter, partager). À utiliser dès qu'on conçoit ou revoit une grille d'annonces, une carte produit, une page catégorie/recherche, ou un flux d'achat sur Chap.ci.
---

# Design de marketplace 🛒

Une marketplace se juge sur **une chose** : est-ce que je trouve vite, je fais confiance, et je contacte facilement ? Tout le design sert ces 3 verbes : **trouver · faire confiance · agir**.

Voir `design-ivoirien` pour la palette/ton et `typographie` pour les prix.

## Anatomie d'une carte d'annonce (le composant roi)

Ordre de priorité visuelle (haut → bas) :

1. **Photo** — ratio constant **4:3**, `object-cover`, fond gris pendant le chargement. La photo vend.
2. **Prix** — l'élément le plus lourd : graisse forte, couleur marque, `tabular-nums`. « Gratuit » assumé si 0.
3. **Titre** — 2 lignes max (`line-clamp-2`), hauteur réservée pour aligner les cartes (évite le décalage).
4. **Lieu + distance** — icône 📍 + commune ; distance seulement si pertinente (< quelques km).
5. **Badges** — en surimpression sur la photo, discrets : `À la une`, `Neuf`, `Livraison`, `−30 %`, `Vendu`.

Règles de confiance sur la carte :
- **État « Vendu »** = voile sombre + pastille → on ne clique pas pour rien.
- **Favori** (cœur) toujours accessible au pouce, en haut à droite, zone de clic ≥ 44 px.
- Cohérence absolue : **toutes les cartes identiques** (même ratio, même gouttière). L'irrégularité = « pas sérieux ».

> Chap.ci fait déjà tout ça correctement dans `ListingCard.tsx`. Améliorations possibles : pop du cœur au favori, léger stagger à l'arrivée de la grille (voir audit).

## Grille d'annonces

| Décision | Reco mobile-first | Pourquoi |
| --- | --- | --- |
| Colonnes | **2** sur mobile (l'app fait ça) | Densité + photos assez grandes |
| Gouttière | 8–12 px | Assez d'air sans gâcher l'espace |
| Largeur max | ~560 px (`max-w-app`) centré | Confort de lecture, tenue sur desktop |
| Hauteur des cartes | **égalisée** (titre à hauteur fixe) | Grille propre, pas de dents de scie |
| Densité | Prix + titre + lieu, pas plus | Le scan doit être instantané |

Alternative « masonry » (hauteurs variables) : **à éviter** ici — casse l'alignement et complique le scan des prix. La grille régulière gagne pour les annonces.

## Recherche & filtres

- **Barre de recherche** visible en haut, avec **suggestions en direct** (catégories, sous-catégories, titres) — déjà en place sur `Home`.
- **Filtres = chips** horizontales défilantes (`.chip`, `no-scrollbar`) : catégorie, prix, état, livraison, localisation. Chip active = pleine couleur marque.
- **Chip de localisation effaçable** (× pour réinitialiser) — déjà fait sur `Browse`.
- **Cohérence catégorie → annonces** : une catégorie ne doit afficher que ses annonces (le haystack de recherche inclut le nom de catégorie). Rien de plus frustrant qu'une catégorie « non liée ».

## Catégories

- **Icône + libellé** clairs, grille scannable. Icônes cohérentes (même style de trait).
- Sous-catégories accessibles en 1 tap.
- Ordre : les plus populaires en premier (téléphones, mode, immobilier, véhicules… selon l'usage réel).

## États vides & chargement (souvent négligés = grande valeur)

- **Squelettes** (skeleton) plutôt que spinner plein écran : cartes grises avec pouls doux → le contenu semble arriver plus vite (performance perçue).
- **État vide utile** : illustration + phrase claire + **action** (« Aucune annonce ici pour le moment. Sois le premier à publier ! » + bouton).
- **Erreur réseau** : message rassurant + bouton « Réessayer » (les connexions ivoiriennes coupent — prévoir le cas).

## Affichage des prix

- Format FCFA propre : `1 500 FCFA` (séparateur espace, insécable — voir `typographie`).
- **Négociable** en petite mention grise à côté.
- **Promo** : prix rouge + prix barré gris + badge `−X %`.
- **Gratuit** : le mot « Gratuit » (vert), pas « 0 FCFA ».

## Conversion : les 4 actions clés

| Action | Règle |
| --- | --- |
| **Voir** | La carte entière est cliquable (`active:scale-[0.98]` pour le feedback) |
| **Favori** | 1 tap, réversible, feedback immédiat (cœur qui se remplit + micro-pop) |
| **Contacter** | Bouton clair et **rapide** (messagerie interne — contacts vendeur masqués pour la sécurité) |
| **Partager** | Vers WhatsApp/Facebook en priorité (usage n°1 en Côte d'Ivoire) |

## Confiance (le nerf d'une marketplace)
- **Avis** réservés aux vrais acheteurs (étoiles).
- **Profil vendeur public** avec historique.
- **Badges** vérifié / pro.
- **Contacts masqués** + messagerie interne = protège acheteur et vendeur.
- Politique claire (confidentialité, signalement).

## Checklist marketplace
- [ ] Cartes 100 % homogènes (ratio 4:3, hauteurs égalisées)
- [ ] Prix = élément dominant, FCFA propre, `tabular-nums`
- [ ] Badges confiance discrets (neuf/livraison/vendu/promo)
- [ ] Favori/Contacter/Partager au pouce (≥ 44 px)
- [ ] Recherche + suggestions + filtres chips ; catégorie ↔ annonces cohérent
- [ ] Squelettes de chargement + états vides avec action + gestion erreur réseau
- [ ] Partage WhatsApp/Facebook prioritaire
