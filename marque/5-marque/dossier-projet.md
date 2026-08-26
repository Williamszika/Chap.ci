# Chap.ci — campagne de lancement

Livrables produits d'après le brief _Créa Chap.ci_ du 23/08/2026.
**38 fichiers, 7,4 Mo au total.**

---

## Vidéo motion — le livrable principal

| Fichier                                | Format      | Durée  | Poids  | Diffusion                             |
| -------------------------------------- | ----------- | ------ | ------ | ------------------------------------- |
| `chapci_video_campagne_9x16_court.mp4` | 1080 × 1920 | 13,7 s | 1,0 Mo | **TikTok** — la version à privilégier |
| `chapci_video_campagne_9x16.mp4`       | 1080 × 1920 | 23,4 s | 1,6 Mo | Reels, Shorts, statut WhatsApp        |
| `chapci_video_campagne_1x1.mp4`        | 1080 × 1080 | 20,1 s | 1,5 Mo | Fil Facebook et Instagram             |
| `chapci_video_campagne_16x9.mp4`       | 1920 × 1080 | 20,1 s | 1,5 Mo | Bandeau d'accueil du site, en boucle  |

### Deux durées, deux usages

Sur TikTok, la décision de rester se prend dans les toutes premières secondes :
le montage court garde une annonce et un argument plutôt que trois de chacun.
Mieux vaut une preuve lue que trois entrevues. La version longue sert là où l'on
dispose du temps — Reels, statut WhatsApp, bandeau du site.

### Correction apportée au montage

La première version passait ses trois plans d'arguments en 1,33 s chacun. Un
contrôle de rythme ajouté depuis — arrivée, pose d'une demi-seconde, puis
lecture à quinze signes par seconde — a montré qu'il en fallait 2,2 : ils
défilaient sans être lus. Les durées viennent maintenant d'une table calculée
dans `motion/scenes/Campagne.tsx`, plus d'une estimation à l'œil.

```bash
npm run sous-titres -- rythme -i dialogue.srt   # même contrôle sur des sous-titres
```

H.264, 30 i/s, `yuv420p`, `faststart` actif, piste audio silencieuse.

### Le déroulé, en six temps

1. **0 – 3 s** — « Vendre, ça doit être **gratuit** »
2. **3 – 5,8 s** — « Sur Chap.ci, c'est le cas. » — _Aucune commission sur une vente._
3. **5,8 – 13,3 s** — Trois annonces réelles : Chaussures Vans (10 000 FCFA, Cocody),
   Cahiers scolaires (4 000 FCFA, Koumassi), Huile rouge (2 000 FCFA, Bingerville)
4. **13,3 – 20,3 s** — Trois arguments vérifiés : `0 %` de commission · `2 min` pour
   publier · `Privé`, votre numéro
5. **20,3 – 22,3 s** — « Publiez votre annonce sur **chap.ci** »
6. **22,3 – 23,4 s** — Logo, une seconde, en fin de vidéo uniquement

Coupes franches entre chaque temps, jamais de fondu ni de clignotement.
Toute l'information passe par l'écrit : **la vidéo se lit intégralement sans le son.**

### Trois choses que cette vidéo ne fait pas, volontairement

- **Aucun écran d'application.** Le brief interdit de présenter une maquette
  comme le produit fini, et je n'ai pas accès au site ni à l'appli en production.
  La vidéo est donc entièrement typographique. Pour la vidéo « Publier chap-chap »
  (démo de publication), il faut des **captures d'écran réelles** — dites-le-moi
  et je monte dessus.
- **Aucune musique.** Le brief exige une piste libre de droits ou originale. Une
  piste que je génère, je ne peux pas l'écouter — je ne peux donc pas garantir
  qu'elle sonne juste. Les fichiers sortent avec une piste silencieuse, et la
  commande d'ajout est plus bas.
- **Aucune abondance suggérée.** Trois annonces montrées, pas trente. Les prix
  affichés sont ceux du catalogue réel, y compris les plus modestes (2 000 FCFA).

### Ajouter une musique quand vous l'aurez

```bash
npm run audio -- remplacer -i projets/chap-ci/video/chapci_video_campagne_9x16.mp4 \
  --piste musique.mp3 -o /tmp/avec-musique.mp4
npm run audio -- normaliser -i /tmp/avec-musique.mp4 \
  -o livrables/video/chapci_video_campagne_9x16.mp4 --cible tiktok
```

La normalisation cale la sonie à **−13 LUFS**, la cible TikTok. Sans elle, la
plateforme applique sa propre correction et la vidéo sort plus faible que les
autres du fil.

---

## Graphismes

| Livrable                                | Format                | Qté | Poids unitaire |
| --------------------------------------- | --------------------- | --- | -------------- |
| Bannières OG — 18 catégories + accueil  | 1200 × 630 PNG        | 19  | 47 – 74 ko     |
| Posts carrés — une vraie annonce chacun | 1080 × 1080 JPG q85   | 6   | 70 – 90 ko     |
| Statuts WhatsApp / stories              | 1080 × 1920 JPG q85   | 6   | 108 – 135 ko   |
| Flyer A5 — RVB, CMJN presse, aperçu, QR | 148 × 210 mm, 300 dpi | 4   | —              |

Tous les visuels réseaux passent **largement sous les 200 ko** demandés. Les
bannières OG sont recompressées sans perte par oxipng : 1 032 ko → 744 ko sur
les dix-neuf, soit 28 % de moins à qualité identique.

### Contrôles passés

- **Contraste** — toutes les associations texte/fond sont au minimum AA. La plus
  serrée est 4,63:1 (encre sur orange foncé), la plus large 17,13:1.
- **Compression WhatsApp** — un statut ramené à 49 ko en qualité 35 reste
  parfaitement lisible. C'est la contrepartie du parti pris typographique :
  gros corps, aplats francs, aucun détail fin à perdre.
- **Prépresse du flyer** — séparation CMJN au profil FOGRA39, polices
  incorporées, images à 300 dpi, charge d'encre 298 % sous le plafond de 300 %.
  Verdict : **bon à tirer**.
- **Prix** — format `10 000 FCFA`, espace insécable, chasse fixe, jamais « XOF ».

### Une mesure qui a changé le design

**Du blanc sur l'orange #F77F00 ne donne que 2,63:1** — un échec AA même en très
grand corps. C'est l'erreur la plus facile à commettre avec cette palette, et
elle serait invisible en atelier mais criante en plein soleil sur un écran
d'entrée de gamme, exactement le public visé.

En conséquence : **tout aplat orange porte du texte encre** (6,62:1). Quand il
faut du texte blanc, il est posé sur le vert foncé #00784A (5,55:1) ou sur
l'encre (17,4:1). La table `TEXTE_SUR` dans `motion/tokens.ts` fige cette règle
pour que l'erreur ne revienne pas scène après scène.

---

## Visuel d'acquisition vendeurs

| Fichier                                   | Format      | Poids  | Usage                             |
| ----------------------------------------- | ----------- | ------ | --------------------------------- |
| `chapci_vendeur_commission_1080x1920.jpg` | 1080 × 1920 | 172 ko | **Statut WhatsApp**, story, Reels |
| `chapci_vendeur_commission_1080x1080.jpg` | 1080 × 1080 | 128 ko | Fil Facebook et Instagram         |
| `chapci_og_vendeur_1200x630.png`          | 1200 × 630  | 71 ko  | Aperçu du lien `/publier` partagé |

Un seul gabarit, trois rendus : la mise en page suit le ratio — empilée en
portrait et en carré, sur deux colonnes en paysage où la hauteur manque.

### Deux décisions qui le distinguent des visuels acheteurs

**Fond encre plutôt que crème.** Un fil de statuts WhatsApp est un mur de photos
claires et saturées ; un aplat sombre y fait un trou et arrête le pouce. Le
bénéfice est double : le texte crème sur encre donne **17,1:1**, le meilleur
contraste de toute la palette. Les neuf associations du visuel passent AA, sept
d'entre elles AAA — contre 4,63:1 au plus serré sur les visuels acheteurs.

**L'argument est un chiffre, pas une phrase.** « 0 FCFA » se lit avant d'être lu,
y compris à la taille d'une vignette de statut. C'est le seul argument que le
visuel demande de retenir ; les trois preuves qui suivent ne font que le rendre
crédible.

### L'argument de vente est la limite du catalogue

Le brief interdit de suggérer une abondance qui n'existe pas — et pour un
vendeur, c'est justement là que se trouve le meilleur argument :

> **2 718 visites en 30 jours · 29 annonces en ligne**
> _La vôtre ne sera pas noyée._

Sur une grande marketplace, une annonce nouvelle est enfouie en une heure. Ici
elle ne l'est pas. Les deux chiffres sont ceux du site, sans arrondi flatteur,
et ils sont posés côte à côte sans conclusion chiffrée : le rapport entre les
deux se lit tout seul, et rien n'est promis qui ne soit vérifiable.

Les trois preuves qui l'accompagnent sont celles du brief, sans ajout :
2 minutes pour publier, le numéro qui reste privé, et l'encaissement direct en
Mobile Money, Wave ou espèces.

### Contrôles

- Neuf associations texte/fond mesurées, **toutes AA**, sept AAA.
- Compression WhatsApp : le statut ramené à **56 ko en qualité 30** reste
  parfaitement lisible.
- Les chiffres viennent de `marque.json`. Le jour où le catalogue passe à 60
  annonces, on met la fiche à jour et on relance — aucun chiffre n'est écrit en
  dur dans le gabarit.

```bash
npm run exporter -- --modele projets/chap-ci/modeles/vendeur \
  --marque projets/chap-ci/marque.json --sortie projets/chap-ci/exports/vendeur
npm run exporter -- --modele projets/chap-ci/modeles/vendeur \
  --marque projets/chap-ci/marque.json --sortie projets/chap-ci/exports/vendeur \
  --dimensions instagram-carre
```

---

## Visuel-clé — « De vrais prix »

| Fichier                               | Format      | Poids  | Usage                             |
| ------------------------------------- | ----------- | ------ | --------------------------------- |
| `chapci_cle_vrais-prix_1080x1920.jpg` | 1080 × 1920 | 162 ko | **Statut WhatsApp**, story, Reels |
| `chapci_cle_vrais-prix_1080x1080.jpg` | 1080 × 1080 | 115 ko | Fil Facebook et Instagram         |
| `chapci_og_vrais-prix_1200x630.png`   | 1200 × 630  | 81 ko  | Aperçu du lien chap.ci partagé    |

C'est l'image qui dit ce qu'est Chap.ci sans passer par une annonce en
particulier : **six vraies annonces, leurs vrais prix, leurs vraies communes**,
composées comme l'ardoise d'un étal. Une ligne par article, le prix calé à
droite en chasse fixe — la forme que tout le monde sait déjà lire.

### Pourquoi six lignes et pas trente

Le brief interdit de suggérer une abondance qui n'existe pas, et la modestie du
tableau est justement ce qui le rend crédible : un catalogue gonflé se repère au
premier coup d'œil. Les six annonces couvrent aussi tout l'écart réel du
catalogue, de 2 000 FCFA pour de l'huile rouge à 650 000 pour un lit — ce qui
dit mieux qu'une phrase que le site n'est pas réservé aux petites sommes.

Le surtitre annonce « six annonces en ligne aujourd'hui », pas « notre
catalogue ». Rien n'est promis qui ne soit vérifiable en ouvrant le site.

### Un défaut trouvé dans la palette du brief

Le brief désigne **`#D95F00` comme l'orange « texte / hover »**. Mesuré sur le
crème `#FFFDF9`, il ne donne que **3,7:1** : conforme AA seulement au-delà de
24 px, ou de 18,66 px en gras. En dessous, il échoue — alors que le brief exige
par ailleurs un contraste AA parce que les visuels se regardent en plein soleil
sur des écrans d'entrée de gamme.

Sur ce visuel, les prix sont assez gros pour que `#D95F00` passe. Le surtitre,
lui, descend à 18 px en bannière : il utilise donc **`#9A4D00`**, le niveau 700
de la même échelle OKLCH — même teinte, **6,02:1**, conforme à toute taille. La
ligne de commune passe de `#8A8071` (3,82:1, insuffisant en petit corps) à
`#6B6255` (5,9:1).

**Recommandation** : ajouter `#9A4D00` à la charte comme orange de petit corps,
et réserver `#D95F00` aux textes de 24 px et plus. Sans quoi la règle « contraste
minimum AA » du brief entre en conflit avec sa propre palette dès qu'un texte
orange descend sous cette taille — sur le site comme sur les visuels.

### Contrôles

- Six associations texte/fond mesurées **à leur taille réelle dans chacun des
  trois formats** : toutes conformes AA après correction. Trois échouaient avant.
- Compression WhatsApp : le statut ramené à **54 ko en qualité 30** reste
  parfaitement lisible.
- oxipng ne gagne que 0,4 % sur ce visuel — la trame géométrique en dégradé ne
  se compresse pas comme un aplat. Le gain est réel ailleurs (jusqu'à 47 % sur
  un logo), nul ici, et c'est dit plutôt que supposé.

```bash
npm run exporter -- --modele projets/chap-ci/modeles/cle \
  --marque projets/chap-ci/marque.json --donnees projets/chap-ci/annonces.json \
  --sortie projets/chap-ci/exports/cle
# puis --dimensions instagram-carre, --dimensions og-image
```

**Une annonce change ?** Modifiez `annonces.json` et relancez : le tableau se
recompose. Les prix ne sont écrits nulle part dans le gabarit.

---

## Logo

**23 fichiers dans `livrables/logo/`**, plus une planche de construction et
d'usage en 2 pages A4.

Le signe : un repère de lieu dont le contreforme dessine un C ouvert. Le concept
vient du brief, la construction est nouvelle — géométrie paramétrée, tangentes
calculées, proportions arrêtées après comparaison de cinq jeux rendus à 16, 24,
32 et 48 px.

Sont livrés : le signe en cinq couleurs, quatre verrouillages (textes en
courbes), le favicon (SVG, ICO, PNG 16 à 96), et les icônes d'application pour
Play Store, App Store, écran d'accueil iOS et PWA masquable.

**Une règle à retenir** : l'orange sur crème ne donne que 2,59:1. Un logotype est
formellement exempté des seuils WCAG, mais c'est faible en plein soleil sur un
écran d'entrée de gamme — les conditions que pose votre propre brief. Au-delà de
24 mm ou 64 px, l'orange passe ; en dessous, utiliser l'encre. C'est pourquoi le
favicon et l'icône d'application sont un **signe encre sur aplat orange**
(6,62:1) et non l'inverse.

Détail dans `logo/LISEZ-MOI.md`.

---

## Affiche promo — registre dense

| Fichier                                      | Format      | Poids  | Usage                         |
| -------------------------------------------- | ----------- | ------ | ----------------------------- |
| `chapci_promo_zero-commission_1080x1350.jpg` | 1080 × 1350 | 155 ko | Fil Facebook et Instagram     |
| `chapci_promo_zero-commission_1080x1920.jpg` | 1080 × 1920 | 178 ko | Statut WhatsApp, story, Reels |

Registre promotionnel dense, dans la grammaire des visuels fintech
ouest-africains : fond sombre et or, accroche encadrée, blocs chiffrés, bandeau
d'arguments, barre d'appel à l'action, badges de confiance, pied social. Cette
grammaire fonctionne parce qu'elle donne au lecteur **plusieurs points d'entrée**
au lieu d'un seul.

### Trois éléments du modèle n'ont pas été repris

Le visuel de référence tire une partie de sa force de mécaniques que Chap.ci
n'a pas. Les transposer aurait donné une affiche plus vendeuse et **fausse** —
exactement ce que le brief interdit depuis la correction de la fiche Google Play.

| Dans le modèle                           | Chez Chap.ci                                                                                           | Ce que j'ai mis à la place                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Code promo de parrainage encadré         | Aucun programme de parrainage                                                                          | Le même cadre, mais autour d'un fait vérifiable : **0 FCFA de commission**  |
| Deux blocs pays avec bonus d'inscription | Aucun bonus                                                                                            | Deux blocs par rôle : **0 %** pour qui vend, **2 000 FCFA** pour qui achète |
| Roue de la chance, codes de réduction    | N'existent pas                                                                                         | Les trois arguments vérifiés du brief                                       |
| Badges App Store **et** Google Play      | Fiche Google Play seule ; le brief dit « une fois l'appli publiée sur les deux boutiques — pas avant » | Emplacement réservé pour le seul badge Google Play                          |

Le badge Google Play est **à télécharger sur les ressources de marque de
Google** : c'est une marque déposée diffusée sous conditions, elle ne se
redessine pas. L'emplacement est réservé à la bonne dimension dans le gabarit.

Si vous voulez réellement un code promo ou un bonus d'inscription, c'est une
décision produit avant d'être une décision graphique — dites-le-moi et
l'affiche l'accueille sans retouche de structure.

### L'emplacement du portrait — et ce que la critique en a dit

Le modèle doit beaucoup à sa personne détourée qui montre l'application. Sans
photo réelle d'un vendeur Chap.ci — et le brief interdit la banque d'images — le
panneau de droite avait d'abord été laissé debout seul : aplat d'accent, signe en
grand, trame géométrique.

**C'était une erreur, et elle a été mesurée.** Au test du plissement, ce panneau
vide pesait **2,9 fois** l'accroche : l'œil s'y posait d'abord et n'y trouvait
rien. Le panneau est désormais conditionné à la présence d'une photo, et le bloc
d'accroche reprend toute la largeur quand elle manque :

```html
{{#si photo}} … {{/si}}
```

Le jour où la photo existe, la renseigner dans les données suffit : le panneau
revient et la mise en page se réorganise seule.

### Contrôles

- Neuf associations mesurées à leur taille réelle : **toutes conformes AA**.
  APCA signale deux mentions encore serrées pour leur contraste ; les remonter
  davantage casserait la composition, et elles restent conformes à la norme
  opposable.
- Compression : **134 ko** en 4:5 et **155 ko** en story, qualité 78, sous les
  200 ko du brief.
- Composition : `npm run critique` rend **tient la route** sur les deux formats
  — aucun aplat dominant, 73 mots sur 75, vignette lisible à 120 px.
- Zones de sécurité en vertical : le contenu s'arrête à **490 px du bas**, au-delà
  des 480 px de la règle du studio. Un premier tirage s'arrêtait à 301 px et
  mordait sur la zone d'interface d'Instagram — trouvé en mesurant, pas à l'œil.

```bash
node projets/chap-ci/modeles/affiche-promo/generer.mjs
```

Le script rend les deux formats, écrit les JPEG et lance la critique dans la
foulée. Il sort en erreur si un contrôle bloque.

Une version A5 imprimable demanderait une passe dédiée : les espacements sont en
pixels, pas en millimètres, et il faudrait ajouter le fond perdu.

---

## Ce qu'il manque, et qui vient de vous

1. **Les photos de produit.** Le brief demande le produit réel, détouré si
   possible. Les cartes d'annonce sont conçues pour tenir debout sans photo —
   elles ne montrent aucun produit qui n'existe pas — mais elles gagneront à
   recevoir la vraie image. Il suffit de poser un `background-image` sur le bloc
   `.visuel` du gabarit.
2. ~~Le logo officiel.~~ **Fait.** Le signe a été dessiné : repère de lieu dont
   le contreforme forme un C ouvert, comme le décrivait le brief. Il remplace le
   substitut dans tous les gabarits et dans la composition motion. Voir
   `logo/LISEZ-MOI.md` et la planche `chapci-logo-planche.pdf`.
   Si un `public/favicon.svg` existait déjà de votre côté, dites-le-moi : il
   faudra trancher entre les deux plutôt que d'en laisser deux en circulation.
3. **La musique**, voir plus haut.
4. **Les captures d'écran de production**, si vous voulez la vidéo de démo.

---

## Regénérer

```bash
# Bannières OG — accueil puis les 18 catégories
npm run serie -- -m projets/chap-ci/modeles/og -d projets/chap-ci/annonces.json \
  -k categories --marque projets/chap-ci/marque.json \
  -o projets/chap-ci/exports/og -n 'chapci_og_{cle}_{l}x{h}' --poidsMax 200

# Posts et statuts
npm run serie -- -m projets/chap-ci/modeles/post  -d projets/chap-ci/annonces.json -k annonces \
  --marque projets/chap-ci/marque.json -o projets/chap-ci/exports/posts \
  -n 'chapci_post_{cle}_{l}x{h}' --format jpg --poidsMax 200
npm run serie -- -m projets/chap-ci/modeles/story -d projets/chap-ci/annonces.json -k annonces \
  --marque projets/chap-ci/marque.json -o projets/chap-ci/exports/stories \
  -n 'chapci_story_{cle}_{l}x{h}' --format jpg --poidsMax 200

# Flyer, puis passage presse
npm run exporter -- --modele projets/chap-ci/modeles/flyer \
  --marque projets/chap-ci/marque.json --donnees projets/chap-ci/annonces.json \
  --sortie projets/chap-ci/exports/flyer
npm run presse -- projets/chap-ci/exports/flyer/flyer.pdf --format a5

# Vidéos
npm run motion:rendu -- campagne-tiktok --entree projets/chap-ci/motion/index.ts \
  --marque projets/chap-ci/marque.json -o projets/chap-ci/video/chapci_video_campagne_9x16.mp4

# Prévisualiser et retoucher le motion en direct
npx remotion studio projets/chap-ci/motion/index.ts
```

**Une annonce change de prix ?** Modifiez `annonces.json` et relancez : les
visuels et la vidéo repartent des mêmes données. Aucun prix n'est écrit en dur
dans un gabarit.

---

## Fichiers de travail

```
marque.json          palette, typographie, arguments vérifiés
annonces.json        les 6 annonces réelles + les 18 catégories
modeles/_commun/     CSS de marque, logo, trame géométrique
modeles/og|post|story|flyer|vendeur|cle/   les six gabarits
motion/              compositions Remotion de la campagne
sources/             QR code vers chap.ci
exports/             sorties de travail
livrables/           ce qui part au client
```
