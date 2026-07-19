---
name: typographie
description: Expertise typographique pour interfaces et visuels — qualités d'une police (x-height, contraste, graisses, chasse, optical sizing, polices variables), hiérarchie (échelle, graisse, interlignage, interlettrage), lisibilité mobile, chiffres tabulaires pour les prix, ET les règles de typographie FRANÇAISE (espaces insécables avant ; : ! ?, guillemets « », apostrophe typographique, format FCFA « 1 500 FCFA », accents sur capitales). À utiliser dès qu'on choisit/associe des polices, règle une hiérarchie de texte, ou compose du texte français propre pour Chap.ci.
---

# Typographie 🅰️

La typo est **90 % du design d'une interface** : c'est surtout du texte. Bien réglée, elle passe inaperçue (c'est le but) ; mal réglée, tout semble « amateur » sans qu'on sache pourquoi.

Voir aussi `design-ivoirien` pour le ton, et `affiche-design` pour la typo grand format.

## Les polices de Chap.ci (déjà en place)

| Rôle | Police | Pourquoi c'est un bon choix |
| --- | --- | --- |
| Corps / UI | **Inter** (variable) | Grande hauteur d'x, très lisible en petit, neutre, gratuite |
| Titres / display | **Plus Jakarta Sans** (variable) | Un peu plus de personnalité géométrique, chaleureuse, s'accorde à Inter |

C'est un **appariement display + texte** classique et solide. **Ne pas ajouter une 3ᵉ famille** sans raison forte (règle : 2 familles max).

## Qualités d'une police (quoi regarder)

| Qualité | Ce que ça change | Viser |
| --- | --- | --- |
| **Hauteur d'x** (x-height) | Lisibilité en petit corps | Élevée pour l'UI mobile (Inter ✅) |
| **Contraste** (plein/délié) | Ambiance & lisibilité | Faible/modéré pour l'écran ; fort = éditorial/luxe |
| **Chasse** (largeur) | Densité du texte | Normale pour le corps ; condensé pour titres serrés |
| **Plage de graisses** | Richesse de la hiérarchie | ≥ 4 graisses (400/500/600/700/800) |
| **Optical sizing** | Netteté selon la taille | Polices variables avec `opsz` = bonus |
| **Chiffres tabulaires** | Alignement des prix/montants | Indispensable pour listes de prix |
| **Support des accents** | Français correct (é è à ç ï…) | Obligatoire — tester « Côte d'Ivoire » |

**Polices variables** (Inter Variable, Plus Jakarta variable) : un seul fichier couvre toutes les graisses → **moins de requêtes, plus léger** (crucial pour les connexions mobiles ivoiriennes). Toujours `font-display: swap` et sous-ensemble latin.

## Hiérarchie : 4 leviers, dans l'ordre

1. **Taille** — échelle cohérente (≈ ratio 1.2–1.25). Ex. Chap.ci : 11 · 13 · 15(base) · 16 · 20 · 24.
2. **Graisse** — souvent plus efficace que la taille pour hiérarchiser. Prix en `font-black` (800), titre `font-bold`, méta `font-medium`.
3. **Couleur / contraste** — `text-gray-900` (fort) → `text-gray-500` (secondaire) → `text-gray-400` (tertiaire). Déjà bien fait sur `ListingCard`.
4. **Interlettrage (tracking)** — resserrer les **gros titres** (`tracking-tight`), **espacer** les petites capitales (`tracking-wide` sur les badges « À LA UNE »).

Règles :
- **Interlignage (leading)** : serré pour les titres (`leading-snug`/`leading-tight`), aéré pour les paragraphes (`leading-relaxed`, ~1.5).
- **Longueur de ligne** : 45–75 caractères en lecture (les pages Confidentialité/CGU doivent limiter la largeur).
- **Pas de texte gris clair sur crème** pour du contenu important (contraste plein soleil).

## Chiffres & prix (spécifique marketplace)

- **`font-variant-numeric: tabular-nums`** sur les prix et montants → les colonnes s'alignent, les chiffres ne « dansent » pas quand le prix change.
- Prix = élément le plus lourd visuellement de la carte : graisse forte + couleur marque (`text-primary-600`) ou rouge promo.
- Prix barré (promo) : `line-through` + gris + plus petit.

```css
.prix { font-variant-numeric: tabular-nums; font-weight: 800; }
```

## ⚠️ Règles de typographie FRANÇAISE (souvent oubliées — grande valeur)

Le français a des règles d'espacement que l'anglais n'a pas. Les respecter = texte instantanément « pro ».

| Signe | Règle | Exemple correct |
| --- | --- | --- |
| `; ! ?` | **espace fine insécable AVANT** | `Bonjour !` `Prêt ?` |
| `:` | **espace insécable AVANT** | `Prix : 1 500 FCFA` |
| `« »` | guillemets français + insécable **à l'intérieur** | `« Neuf »` (pas `"Neuf"`) |
| `,` `.` | pas d'espace avant, espace après | `Neuf, livré.` |
| Milliers | **espace** comme séparateur (pas la virgule) | `1 500` `250 000` |
| Monnaie | espace insécable avant l'unité | `1 500 FCFA` (pas `1500FCFA`) |
| Apostrophe | **typographique** `’` de préférence | `d’Ivoire`, `l’annonce` |
| Capitales | **gardent leurs accents** | `À LA UNE`, `ÉCONOMIE` |
| % | espace insécable avant | `−30 %` |

Astuce implémentation : insécable = ` ` (ou `&nbsp;`), fine insécable = ` `. Pour les prix : formater avec séparateur espace (`Intl.NumberFormat('fr-FR')` → `1 500`) puis suffixer ` FCFA`.

```js
// FCFA propre, séparateur espace, insécable avant l'unité
const fcfa = (n) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`
// fcfa(250000) -> "250 000 FCFA"
```

## 📚 Bibliothèque de polices recommandées (toutes gratuites, accents français OK)

Toutes ces familles sont **gratuites** (Google Fonts ou Fontshare, usage commercial OK), **variables** pour la plupart, et **couvrent les accents français** (é è à ç ï î ô œ ù). **Toujours tester** avec `Côte d’Ivoire — À LA UNE — 250 000 FCFA` avant d'adopter.

### Corps & interface (lisibilité maximale, petit corps)
| Police | Caractère | Quand la choisir |
| --- | --- | --- |
| **Inter** ⭐ (actuelle) | Neutre, hauteur d'x élevée | Le choix par défaut UI — garder |
| **Manrope** | Géométrique, chaleureuse | Alt à Inter, un peu plus « friendly » |
| **IBM Plex Sans** | Humaniste, sérieuse | Ton plus institutionnel/confiance |
| **Work Sans** | Sobre, polyvalente | Passe-partout fiable |

### Titres & display (personnalité, moyen/grand corps)
| Police | Caractère | Quand la choisir |
| --- | --- | --- |
| **Plus Jakarta Sans** ⭐ (actuelle) | Géométrique chaleureuse | Titres UI — garder, s'accorde à Inter |
| **Sora** | Moderne, tech | Look plus « produit tech » |
| **Bricolage Grotesque** | Caractère, tendance | Titres avec du peps, marque affirmée |
| **Space Grotesk** | Rétro-moderne | Accent graphique distinctif |
| **Fraunces** | Sérif à optical sizing | Touche éditoriale/premium (soldes chic) |

### Affiches & impact (gros titres, promos) — voir `affiche-design`
| Police | Caractère | Attention |
| --- | --- | --- |
| **Anton** | Ultra-gras condensé | Parfait accroche d'affiche ; MAJUSCULES |
| **Archivo / Archivo Black** | Grotesque robuste | Titres promo puissants |
| **Clash Display** (Fontshare) | Display moderne | Très « marque », gratuit |
| **Bebas Neue** | Condensé capitales | ⚠️ **accents français incomplets** — vérifier é/à/ç avant usage |

### Chiffres / prix
La plupart ci-dessus ont des **chiffres tabulaires** (`tabular-nums`). Pour des prix très présents, **Inter** et **IBM Plex** ont d'excellents chiffres alignés. Toujours activer `font-variant-numeric: tabular-nums`.

### ⚠️ À éviter
- **Pas de fausses polices « tribales / africaines »** (lettres en « bois », faux masques) : c'est un **cliché** qui décrédibilise. L'ivoirité vient de la **couleur et des motifs** (voir `design-ivoirien`), **pas** d'une police gadget.
- Pas de Comic Sans, Papyrus, ni police système par défaut non chargée.
- Pas plus de **2 familles** à l'écran en même temps.

### Où récupérer des polices gratuites (sources autorisées)

Les bureaux **Design (🎨 L'Atelier)** et **Croissance/Marketing (📣 Le Crieur)** peuvent
puiser dans **toutes** ces bibliothèques gratuites. **Règle non négociable : vérifier la
LICENCE de chaque police avant de l'utiliser** (Chap.ci est un site **commercial**).

| Source | Lien | Licence typique | À vérifier |
| --- | --- | --- | --- |
| **Google Fonts** ⭐ | fonts.google.com | OFL / Apache 2.0 | ✅ usage commercial OK par défaut |
| **Fontshare** ⭐ | fontshare.com | Licence Fontshare (gratuite) | ✅ commercial OK (lire la licence) |
| **Font Squirrel** ⭐ | fontsquirrel.com | 100 % « commercial-use » filtré | ✅ filtre déjà sur usage commercial |
| **The League of Moveable Type** ⭐ | theleagueofmoveabletype.com | OFL (open-source) | ✅ libre, commercial OK |
| **Open Foundry** ⭐ | open-foundry.com | Open-source (OFL/MIT) | ✅ libre, commercial OK |
| **1001 Fonts** | 1001fonts.com | **mixte** | ⚠️ filtrer « Commercial Use » + lire la licence |
| **FontSpace** | fontspace.com | **mixte** | ⚠️ beaucoup « personal use only » — vérifier chaque police |
| **DaFont** | dafont.com | **mixte** | ⚠️ souvent « free for personal use » — **vérifier avant tout usage commercial** |

**Priorité d'usage** (du plus sûr au plus prudent) :
1. **Google Fonts / Fontshare / Font Squirrel / The League / Open Foundry** → licences
   claires (OFL, Apache, MIT) : commercial autorisé, on peut adopter directement.
2. **1001 Fonts / FontSpace / DaFont** → **cas par cas** : n'utiliser qu'une police
   dont la licence dit **explicitement** « free for commercial use » (ou OFL/Apache/MIT).
   Dans le doute → ne pas l'utiliser, ou prévoir l'achat de la licence commerciale.

### Procédure d'intégration (pour l'Atelier et le Crieur)

1. **Choisir** la police et **noter sa licence** (copier le texte de licence + l'URL source).
2. **Vérifier les accents français** avec `Côte d’Ivoire — À LA UNE — 250 000 FCFA`
   (é è à ç ï î ô œ ù) — écarter toute police au jeu de glyphes incomplet.
3. **Auto-héberger** : télécharger les fichiers, convertir en **woff2**, **sous-ensembler**
   au latin (perf mobile ivoirienne), servir en local. **Ne jamais hotlinker** un CDN
   externe (perf + RGPD : le hotlink Google Fonts expose l'IP du visiteur à un tiers).
4. Déclarer en `@font-face` avec **`font-display: swap`**.
5. Garder la **règle des 2 familles max** à l'écran (voir plus haut) : une bibliothèque
   riche sert à **choisir mieux**, pas à empiler les polices.
6. Conserver une trace des licences dans le dépôt (ex. `public/fonts/LICENSES.md`).

> ⚠️ La **proposition** de nouvelles polices reste une **proposition** : l'Atelier/le
> Crieur les recommandent (avec la preuve de licence) ; le **Dev** les intègre après
> validation du Patron, avec build + tests. Aucun changement de police en production
> sans passer par cette validation.

## Checklist typo
- [ ] 2 familles max (Inter + Plus Jakarta) — pas de 3ᵉ
- [ ] Hiérarchie par graisse + couleur, pas seulement par taille
- [ ] Prix en `tabular-nums`, graisse forte, couleur marque
- [ ] Espaces insécables avant `; : ! ?` et dans `« »`
- [ ] Milliers avec espace (`1 500`), FCFA insécable
- [ ] Apostrophe `’`, accents sur capitales
- [ ] `font-display: swap`, sous-ensemble latin, variable si possible
- [ ] Contraste lisible en plein soleil (voir `design-ivoirien`)
