---
name: a11y-contraste
description: Accessibilité et contraste pour une marketplace mobile utilisée en plein soleil — ratios WCAG AA/AAA, lisibilité écran lavé par la lumière d'Abidjan, cibles tactiles ≥ 44 px, focus visible clavier, navigation lecteur d'écran (alt, aria, landmarks, ordre), formulaires accessibles (labels, erreurs), mouvement réduit (prefers-reduced-motion), taille de texte et zoom. À utiliser dès qu'on vérifie ou améliore l'accessibilité, le contraste ou la lisibilité de Chap.ci, surtout sur mobile en extérieur.
---

# Accessibilité & contraste — lisible par tous, même au soleil ♿

L'accessibilité n'est pas une case à cocher : sur Chap.ci, elle décide si une
personne **voit le prix en plein soleil à un carrefour d'Abidjan**. On conçoit
pour la vraie vie : luminosité écrasante, une main occupée, réseaux lents, tous
les âges. Ce qui aide les personnes en situation de handicap **aide tout le monde**.

> Principe : **contraste et taille d'abord.** Le joli gris clair sur blanc est
> invisible dehors. On préfère lisible à « esthétiquement subtil ».

## 1. Contraste (WCAG)

| Élément | Ratio minimum | Notes |
|---|---|---|
| Texte normal (< 18 px) | **4,5:1** (AA) | viser AAA 7:1 pour le prix/lecture |
| Texte large (≥ 18 px gras / 24 px) | **3:1** (AA) | titres, prix |
| Éléments d'UI (icônes, bordures d'input, focus) | **3:1** | sinon invisibles |
| Cible « plein soleil » | **viser 7:1** sur les infos clés | prix, CTA, statut |

Pièges fréquents :
- **Gris clair sur crème** (placeholder, méta, « il y a 2 h ») → souvent < 3:1. Assombrir.
- **Texte sur photo** (badges) → **fond semi-opaque** ou ombre, jamais texte nu sur image.
- **Orange marque (#F77F00) sur blanc** ≈ 2,9:1 → **insuffisant pour du texte** ;
  l'orange sert de **fond de bouton** (texte blanc dessus) ou de gros titre, pas de
  petit texte. Pour du texte orange lisible, foncer (ex. orange 700+).
- Le **vert ivoire (#009E60)** : vérifier chaque usage texte au ratio.

## 2. Cibles tactiles & gestes

- **≥ 44 × 44 px** pour tout ce qui se tape (bouton, cœur favori, lien, onglet).
- Espacement suffisant entre cibles (pas de favori collé au bouton « contacter »).
- Ne jamais **dépendre d'un seul geste** complexe : une alternative simple existe.
- Zone tactile ≥ la zone visuelle (padding invisible autour des petites icônes).

## 3. Focus clavier & navigation

- **Focus visible** partout (anneau net, contraste ≥ 3:1) — ne jamais `outline:none` sans remplacement.
- **Ordre de tabulation** logique (haut→bas, gauche→droite) ; pas de piège au clavier.
- **Landmarks** : `<header> <nav> <main> <footer>`, un seul `<h1>` par page, hiérarchie de titres correcte.
- **Skip link** « Aller au contenu » en tête de page.

## 4. Lecteurs d'écran (sémantique)

- **`alt`** utile sur chaque image d'annonce (« iPhone 12 noir, 128 Go » — pas « image1.jpg »).
- Boutons icône-seule → **`aria-label`** (« Ajouter aux favoris », « Partager »).
- États dynamiques → **`aria-live`** (annonce ajoutée, erreur de formulaire).
- Utiliser des **balises natives** (`<button>`, `<a>`, `<label>`) avant d'inventer des rôles ARIA.
- Contenu décoratif → `aria-hidden="true"` (motifs, icônes redondantes).

## 5. Formulaires (auth, publier, contact)

- **`<label>` lié** à chaque champ (pas juste un placeholder qui disparaît).
- Erreurs **explicites en « vous »** : « Veuillez saisir un prix » (pas « invalide »),
  liées au champ (`aria-describedby`), et **pas seulement par la couleur** (icône + texte).
- **Type de clavier** adapté (`inputmode="numeric"` pour le prix/téléphone).
- États `:focus`, `:invalid` visibles et contrastés.

## 6. Mouvement & confort

- Respecter **`prefers-reduced-motion`** : couper les animations non essentielles.
- Pas de clignotement rapide (> 3 flashs/s → risque épilepsie).
- **Zoom jusqu'à 200 %** sans casser la mise en page ; unités relatives (`rem`), pas de texte figé en `px` minuscule.
- Taille de texte de base **≥ 16 px** sur mobile (évite le zoom auto iOS et reste lisible).

## Checklist d'audit (avec le Design, tous les 3 j / à chaque UI)

- [ ] Contraste AA sur tout texte ; AAA visé sur prix/CTA (testé, pas à l'œil).
- [ ] Aucune info portée **par la couleur seule** (statut, erreur, promo).
- [ ] Cibles ≥ 44 px, bien espacées.
- [ ] Focus visible partout ; navigation clavier complète sans piège.
- [ ] `alt`/`aria-label` sur images et boutons-icônes ; hiérarchie de titres correcte.
- [ ] Formulaires : labels liés, erreurs claires en « vous », clavier adapté.
- [ ] `prefers-reduced-motion` respecté ; zoom 200 % OK.
- [ ] Rapport priorisé au Journal (`fichier:ligne`, Avant/Après, ratio mesuré).

> Règle d'or : ce bureau **propose** (audit + correctifs prêts, ratios chiffrés).
> Le Patron ordonne. Le Dev exécute avec build + tests. On ne casse jamais le design
> existant : on **renforce** la lisibilité dans le système déjà en place.
