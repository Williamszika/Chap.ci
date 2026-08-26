# Chap.ci — le signe « chap-chap »

Un **losange fendu en deux moitiés qui glissent**, et un vide au centre qui ne
se referme jamais.

**35 fichiers**, dont le jeu complet pour l'application Flutter.

---

## D'où vient ce dessin

Je suis allé sur le site avant de dessiner. Le titre de la page d'accueil dit :

> Chap.ci est une place de marché **100 % ivoirienne** pour acheter et vendre
> _chap-chap_

**« Chap-chap » est du nouchi : vite, vite.** C'est de là que vient le nom, et
c'est le mot le plus important de la marque. Le logo précédent — une épingle de
carte avec un C — racontait la géolocalisation, ce que raconte n'importe quelle
place de marché. Il ne racontait pas le nom.

Quatre choses du site sont entrées dans le dessin :

| Ce que dit le site                                                        | Ce que fait le signe                                                          |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| « acheter et vendre **chap-chap** »                                       | Deux moitiés qui **glissent** — et un mot redoublé, un signe doublé           |
| « ne s'interpose **jamais** dans le paiement », aucune commission         | Le **vide au centre**. La plateforme n'est pas au milieu                      |
| Vendeur et acheteur se parlent, se voient, se remettent la main à la main | **Deux** moitiés, pas une forme unique                                        |
| 100 % ivoirienne                                                          | Le **losange**, motif de tissu ouest-africain déjà dans la trame de la charte |

Le creux est le sujet du dessin, pas son reste.

---

## Où prendre quel fichier

| Besoin                          | Fichier                                               |
| ------------------------------- | ----------------------------------------------------- |
| Site, en-tête                   | `verrouillages/chapci-horizontal-courbes.svg`         |
| Site, pied de page sombre       | `verrouillages/chapci-horizontal-reserve-courbes.svg` |
| Fiche de magasin d'applications | `verrouillages/chapci-signature-courbes.svg`          |
| Onglet de navigateur            | `favicon/favicon.svg` + `favicon.ico`                 |
| `public/apple-touch-icon.png`   | `application/apple-touch-icon.png` (180 px)           |
| Play Store                      | `application/app-icon-512.png`                        |
| App Store iOS                   | `application/app-icon-1024.png`                       |
| PWA, manifeste                  | `application/maskable-512.png`                        |
| Signe seul                      | `signe/chapci-signe-*.svg`                            |
| **Splash Flutter**              | `flutter/splash/` — voir plus bas                     |

Les verrouillages ont **leurs textes convertis en courbes**. Un SVG qui appelle
« Plus Jakarta Sans » par son nom s'affiche avec une police de substitution
partout où elle n'est pas installée. Les versions à texte vivant restent à côté,
sans suffixe, pour qui doit encore les modifier.

Ils sont aussi **recadrés sur leur dessin réel**, avec une zone de réserve égale
à la moitié de la hauteur du signe. Rien ne doit entrer dans cette bande.

---

## L'application Flutter

### 1. Le splash natif — celui que le système affiche

```bash
cp -r fichiers/flutter/splash <projet-flutter>/assets/marque/
cp flutter_native_splash.yaml <projet-flutter>/
cd <projet-flutter>
flutter pub add dev:flutter_native_splash
dart run flutter_native_splash:create
```

La configuration est déjà écrite et commentée. Ce qu'elle fait :

- **clair** : champ orange, signe encre — la combinaison de l'icône
  d'application, mesurée à **6,62:1** ;
- **sombre** : l'inverse, signe orange sur encre, même rapport ;
- **Android 12 et au-delà** passent par l'API de splash du système, qui rogne
  l'icône au **cercle central, soit les deux tiers du cadre**. Les fichiers
  `chapci_android12*.png` font 1152 px avec le signe inscrit dans le cercle de
  768 px, comme le demande le paquet. Une icône dessinée au bord serait coupée.

À relancer après chaque changement de logo : le paquet **recopie** les images
dans les dossiers natifs, il ne les lit pas au démarrage.

### 2. L'écran de démarrage Flutter — celui qui prend la suite

`ecran_demarrage.dart` à déposer dans `lib/`.

Le signe y est **peint et non chargé** : un `CustomPainter` suit n'importe quelle
densité d'écran sans jeu d'assets, et le tracé reste celui de la construction.
Le portage a été vérifié sommet par sommet contre `construire.mjs` — les douze
points coïncident.

L'entrée est animée : les deux moitiés arrivent écartées et se rejoignent en
**620 ms**, courbe de sortie, le texte suivant à 42 % du parcours. Assez pour se
voir, assez court pour ne pas se faire attendre.

Aperçu : `fichiers/flutter/demarrage/chapci_entree.gif` et la pellicule à côté.

Si vous préférez une image toute faite plutôt que du code, les écrans complets
sont dans `fichiers/flutter/demarrage/` en 1080×1920, 1284×2778 et 1200×1200.

---

## Ce qui a été mesuré, pas estimé

**La tenue en petit corps.** Deux valeurs décident, et elles jouent l'une contre
l'autre : la fente se bouche la première, le trait disparaît juste après.

| Taille | Fente   | Trait   |
| ------ | ------- | ------- |
| 16 px  | 2,33 px | 1,83 px |
| 32 px  | 4,67 px | 3,67 px |

Sous 2,5 px, la fente se ferme et le signe redevient un losange ordinaire. D'où
une **variante épaisse** pour le favicon 16, 32 et 48 px : trait 14, fente 20 au
lieu de 11 et 14. Le signe est le même, il est seulement dit plus fort.

**Le masque d'icône.** Le rayon d'encombrement vaut **32,39** sur une grille de
96, pour un cercle masqué de 32. Le signe est donc réduit à **0,44 du cadre**
dans `maskable-512.png` — pas 0,66, pour garder de la marge sous le masque le
plus agressif.

**Le contraste.**

| Association      | Ratio      | Où                           |
| ---------------- | ---------- | ---------------------------- |
| Encre sur orange | 6,62:1     | favicon, icône, splash clair |
| Orange sur encre | 6,62:1     | réserve, splash sombre       |
| Orange sur crème | **2,40:1** | grand format uniquement      |

Un logotype est formellement exempté des seuils WCAG. Mais 2,40:1 reste faible
en plein soleil sur un écran d'entrée de gamme — c'est pourquoi ni le favicon ni
le splash n'utilisent cette combinaison.

---

## Trois erreurs corrigées en route

Elles sont notées parce qu'elles se reproduiraient sans ça.

1. **Les extrémités coupées à la verticale soudaient les deux moitiés.** Les dos
   se touchaient en haut et en bas, la fente disparaissait et le signe se
   refermait en losange ordinaire. Les terminaux sont coupés **d'équerre au
   flanc**.

2. **Le « .ci » orange sur champ orange était invisible.** J'avais produit la
   version claire du bandeau en remplaçant des couleurs dans le SVG déjà
   vectorisé ; Inkscape les réécrit à sa façon et le remplacement a échoué en
   silence. Les deux versions sont maintenant tracées depuis la source. Seule
   l'épreuve à l'écran l'a montré.

3. **L'animation sortait du cadre.** À pleine amplitude, la moitié gauche
   passait en coordonnée négative — donc rognée par le `CustomPaint`.
   L'écartement est borné à la moitié du rayon, valeur calculée et non choisie.

---

## Ce que la critique automatique en dit

`npm run critique` sur l'écran de démarrage rend deux lectures qu'il faut savoir
interpréter :

- **« deux foyers se disputent la lecture », 1,04×.** L'outil détecte des
  composantes connexes : la fente sépare le signe en deux, il compte donc deux
  foyers. Ils sont contigus et lus comme un seul objet. C'est une limite de
  l'outil sur une marque en deux parties, pas un défaut du dessin.
- **« structure 6,5 » en vignette**, sous le seuil de 25. Ce seuil a été
  étalonné sur une **affiche dense**. Un écran de démarrage est minimal par
  construction : un signe, un mot, du vide. La mesure est une moyenne sur tout
  le cadre, donc le vide la tire vers le bas. **Le seuil ne s'applique pas à ce
  registre** — la vignette a été regardée, le signe y est parfaitement lisible.

---

## Ce logo ne remplace rien pour l'instant

L'épingle de carte reste en place dans `projets/chap-ci/logo/`, et c'est elle
qui est câblée sur le site. Ce dossier-ci est une **proposition complète**, pas
une substitution : remplacer des fichiers déjà en ligne est votre décision, pas
la mienne.

Pour basculer, il suffit de copier le contenu de `fichiers/` par-dessus
`projets/chap-ci/livrables/logo/` et de régénérer les visuels qui appellent le
signe. Dites-le-moi et je le fais d'un trait.

```bash
node projets/chap-ci/logo-losange/generer.mjs
```
