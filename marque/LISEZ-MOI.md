# Chap.ci — dossier de remise

> ## ⚠️ ARCHIVE — AUCUN LOGO DE CE DOSSIER N'EST CELUI DU SITE (31/08/2026)
>
> Ce dossier est la livraison du bureau de design du **26/08/2026**. Le logo a
> changé deux fois depuis : le 29/08 (tout vert), puis le **30/08**, où le
> Patron a retenu la **couronne aux trois couleurs du pays** — orange à gauche,
> cœur blanc, vert à droite.
>
> **Les deux dossiers de logo ci-dessous sont donc périmés, y compris celui qui
> s'appelle « nouveau ».** Les noms datent du 26/08 ; ils n'ont pas été changés
> pour ne pas réécrire la remise d'un prestataire, mais ils mentent désormais.
>
> Le logo en vigueur ne vit dans aucun fichier d'image : il est dessiné dans
> **`src/components/signeChapci.ts`**, et toutes les images du site, de
> l'application et des boutiques en sont générées (voir « Régénérer les images
> de marque » dans le `README.md` à la racine). Ne recopiez rien d'ici.
>
> Ce dossier garde deux usages, et deux seulement :
> · la mémoire du travail livré ;
> · les visuels de `3-visuels/` (affiches, posts, stories, flyer), qui restent
>   utilisables tant qu'on accepte qu'ils portent l'ancienne marque.
>
> `scripts/verif-signe.mjs` se sert d'ailleurs de deux images d'ici comme
> contre-épreuve : il DOIT les refuser. Si un jour il les accepte, c'est le
> contrôle qui est cassé.

115 fichiers, 12 Mo. Tout ce qui a été fabriqué pour Chap.ci, prêt à poser.

| Dossier             | Quoi                                                     |
| ------------------- | -------------------------------------------------------- |
| `1-logo-nouveau/`   | Le signe « chap-chap » et le nécessaire Flutter — 40 fichiers |
| `2-logo-actuel/`    | L'épingle de carte, celle qui est en ligne aujourd'hui — 23 fichiers |
| `3-visuels/`        | Affiches, posts, stories, images de partage, flyer — 43 fichiers |
| `4-video/`          | La vidéo de campagne en quatre formats                   |
| `5-marque/`         | La fiche de marque, les annonces, les design tokens      |

---

## Par où commencer

### Si vous montez l'application Flutter

Tout est dans `1-logo-nouveau/`. Deux étages, et le premier suffit à démarrer.

```bash
cp -r 1-logo-nouveau/fichiers/flutter/splash <projet>/assets/marque/
cp 1-logo-nouveau/flutter_native_splash.yaml <projet>/
cd <projet>
flutter pub add dev:flutter_native_splash
dart run flutter_native_splash:create
```

Puis, si vous voulez l'animation d'entrée, `ecran_demarrage.dart` va dans `lib/`.
Le signe y est **peint et non chargé** : il suit n'importe quelle densité
d'écran sans jeu d'assets.

Les icônes d'application sont dans `1-logo-nouveau/fichiers/application/` :
512 px pour le Play Store, 1024 px pour l'App Store, `maskable-512.png` pour le
manifeste.

**Le détail qui coûte cher si on le rate :** Android 12 et au-delà rognent
l'icône de démarrage à son **cercle central, deux tiers du cadre**. Les fichiers
`chapci_android12*.png` sont déjà dessinés pour ça — 1152 px avec le signe
inscrit dans le cercle de 768 px. Ne les remplacez pas par une icône plein cadre,
elle serait coupée.

### Si vous mettez à jour le site

`1-logo-nouveau/fichiers/verrouillages/` pour l'en-tête et le pied de page,
`favicon/` pour l'onglet, `application/apple-touch-icon.png` pour iOS.

Prenez les fichiers **`-courbes.svg`** : leurs textes sont vectorisés. Un SVG qui
appelle « Plus Jakarta Sans » par son nom s'affiche avec une police de
substitution partout où elle n'est pas installée.

### Si vous publiez

`3-visuels/` est classé par usage. Les noms portent les dimensions.

`4-video/` : 16:9 et 1:1 en 20 s, 9:16 en 23 s, plus une version courte de 14 s
pour TikTok, toutes en 30 images/s.

**Les vidéos sont muettes.** La piste audio existe mais elle est vide — mesurée
à −91 dB sur toute la durée. Aucune musique n'a été posée : le brief interdit la
banque d'images et la même règle vaut pour la musique, dont la licence est un
sujet juridique avant d'être un sujet de montage. Le jour où vous fournissez une
musique ou une voix, la normalisation se fait en une commande, aux cibles
d'usage : −14 LUFS sur YouTube et Instagram, −13 sur TikTok.

---

## Les deux logos, et pourquoi il y en a deux

`2-logo-actuel/` est l'épingle de carte. C'est elle qui est **câblée sur le site
aujourd'hui** — ne la supprimez pas avant d'avoir basculé.

`1-logo-nouveau/` est le signe « chap-chap ». Il est né d'une lecture du site :
votre page d'accueil dit « acheter et vendre **chap-chap** », et chap-chap est du
nouchi — vite, vite. C'est de là que vient le nom de la marque, et l'épingle ne
le racontait pas : elle racontait la géolocalisation, comme n'importe quelle
place de marché.

Le nouveau signe est un losange — motif de tissu ouest-africain déjà présent dans
votre trame — fendu en deux moitiés qui glissent. Le vide au centre ne se referme
jamais : « Chap.ci ne prend aucune commission et ne s'interpose jamais dans le
paiement ». La plateforme n'est pas au milieu.

**Le choix vous appartient.** Les deux jeux sont complets et interchangeables :
mêmes noms de fichiers, mêmes formats, mêmes tailles.

---

## Ce qui reste à faire, et qui ne dépend pas de moi

Ces trois manques sont volontaires. Les combler aurait demandé d'inventer.

1. **Le badge Google Play.** C'est une marque déposée, diffusée sous conditions,
   elle ne se redessine pas. L'emplacement est réservé à la bonne dimension dans
   les gabarits — le badge officiel se télécharge sur les ressources de marque de
   Google.

2. **Les photos de vendeurs et de produits.** Le brief interdit la banque
   d'images, et il a raison : une photo de stock sur une place de marché
   ivoirienne se voit tout de suite. Les gabarits tiennent debout sans photo ;
   le jour où elles existent, il suffit de les renseigner dans les données.

3. **Les captures d'écran de l'application.** Elles n'existeront qu'une fois
   l'application faite. Rien n'a été simulé.

---

## Ce qui a été mesuré

Le studio ne livre pas un rendu sans l'avoir contrôlé. Les valeurs qui comptent :

- **Contraste.** Encre sur orange : 6,62:1, conforme AA. C'est la combinaison de
  l'icône et du splash. L'orange sur crème ne fait que 2,40:1 — réservé au grand
  format, jamais pour du texte courant ni un favicon.
- **Charge d'encre du flyer print.** 284 % brut, 273 % au profil FOGRA39, sous
  le plafond de 300 %. Le PDF est en **PDF/X-3**, profil incorporé.
- **Zones de sécurité.** Sur les verticales, rien de signifiant à moins de
  480 px du bas : c'est là que l'interface des applications recouvre l'écran.
- **Composition.** L'affiche promo, le visuel clé, le visuel vendeur et les
  19 images de partage passent `npm run critique` sans réserve. Les posts, les
  stories et le flyer y sont signalés — voir juste en dessous.

Le détail chiffré est dans `1-logo-nouveau/LISEZ-MOI.md` pour le signe, et dans
`5-marque/dossier-projet.md` pour l'ensemble du projet.

### Une limite de mon propre contrôle, trouvée en préparant ce dossier

Le contrôle de composition signale « aplat décoratif » sur les 6 posts, les
6 stories et le flyer. **En les regardant, la plupart de ces signalements sont
faux**, et la raison est mécanique : quand du texte est posé *à l'intérieur*
d'un panneau de couleur, l'outil réunit le panneau et son texte en une seule
région, puis moyenne le niveau de détail. Le vide autour du texte tire la
moyenne vers le bas, et la région passe pour un aplat vide.

Sur le flyer, la zone signalée est le bandeau orange **qui porte l'accroche**.
Le signalement est à jeter.

Sur les posts et les stories, il reste un reproche réel mais plus léger que ce
que dit l'outil : le bas de la carte d'annonce est vide sur une bonne hauteur.
C'est resserrable, ce n'est pas un défaut bloquant.

Je n'ai pas aujourd'hui de mesure qui sépare « panneau vide » de « panneau qui
porte du texte » — il faudrait regarder la distribution du détail à l'intérieur
de chaque région au lieu de sa moyenne. Dites-le-moi si vous voulez que je le
corrige.

---

## Régénérer

Rien ici n'est un fichier orphelin : tout se recalcule depuis la fiche de marque
et les design tokens. Le dossier `1-logo-nouveau/source/` contient la
construction géométrique du signe et son générateur.

```bash
node generer.mjs
```

Changer une couleur dans `5-marque/marque.json` et relancer met à jour la carte,
l'affiche, le post et le générique vidéo d'un seul coup. C'est le principe du
studio : une seule source, plusieurs sorties.
