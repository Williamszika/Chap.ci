# Mettre l'application sur votre iPhone

**Pour le Patron, sur son Mac.** Aucune ligne de ce guide ne demande de secret :
le keystore Android n'est pas concerné, et aucun certificat n'est à envoyer à
qui que ce soit.

---

## ⚡ L'APPLICATION EST DÉJÀ SUR VOTRE IPHONE ? Six commandes suffisent.

Vous n'avez **rien** à refaire dans Xcode. Branchez l'iPhone, déverrouillez-le,
ouvrez le **Terminal**, et tapez ceci ligne par ligne :

```bash
cd ~/chapci-app
git checkout claude/ci-marketplace-mobile-app-bnllro
git pull
cd flutter_app
flutter pub get
dart run tool/preparer_plateformes.dart
flutter run --release
```

(Si votre dossier ne s'appelle pas `chapci-app`, remplacez la première ligne par
le chemin du vôtre. Si `flutter run` dit qu'il ne trouve pas d'appareil, faites
`flutter devices` d'abord et vérifiez que l'iPhone y figure.)

Comptez cinq à dix minutes. L'application se remplace toute seule sur le
téléphone ; vos données et votre session restent.

**Trois choses seulement peuvent vous arrêter :**

| Ce que vous voyez | Ce qu'il faut faire |
|---|---|
| Xcode réclame la **Team** / « Signing for Runner requires a development team » | Faites l'**étape 4** une fois, puis relancez `flutter run --release`. |
| L'iPhone dit **« Développeur non fiable »** | Faites l'**étape 7**. |
| `flutter devices` ne voit pas l'iPhone | Câble, déverrouillage, « Se fier » — **étape 5**. |

> **Rappel des 7 jours** : avec un identifiant Apple gratuit, l'application cesse
> de s'ouvrir au bout d'une semaine. Relancer `flutter run --release` repart pour
> 7 jours — et vous en profitez pour prendre les nouveautés au passage.

**Votre iPhone doit tourner sous iOS 15 ou plus récent.** C'est ce qu'exigent les
composants de l'application ; en dessous, l'installation refuse. Tout iPhone
depuis le 6s en est capable.

---

## Ce que la mise à jour du 4 septembre apporte — v1.25

Les quatre nouveautés mises en ligne sur le site le 3 septembre, dans
l'application, aux mêmes endroits :

- **L'affiche pour le statut WhatsApp.** Sur une annonce, le bouton Partager
  (en haut à droite) propose désormais « Affiche pour mon statut WhatsApp » :
  une image 1080 × 1920 avec la photo, le prix en pastille verte, la couronne
  et le lien, fabriquée dans le téléphone, remise à la feuille de partage.
- **« Ça vaut combien ? »** En publiant, sous le prix : « Sur Chap.ci, ce type
  d'objet se vend entre X et Y » et un mot sur le prix tapé. Sur une annonce,
  sous le prix : « dans la moyenne », « au-dessus », ou « bien en dessous —
  méfiance ». Rien ne s'affiche tant qu'il n'y a pas cinq annonces récentes
  dans la sous-catégorie.
- **Faire une offre.** Sur une annonce, le bouton « Faire une offre » sous le
  prix ; dans une conversation, l'étiquette à gauche du champ de saisie. L'offre
  arrive dans le fil avec Accepter / Refuser / Contre-proposer pour l'autre, et
  la liste des messages montre « Offre : 45 000 FCFA » tant qu'elle attend.
- **Chap.ci écrit l'annonce.** En publiant, dès la première photo : le titre,
  la catégorie, la sous-catégorie, l'état, la description et les
  caractéristiques (marque, modèle…) se remplissent tout seuls, avec une
  bannière « Relisez, corrigez, puis publiez ». **Uniquement si la clé du
  moteur est dans `config.php` sur le serveur** — sans elle, le formulaire
  reste celui d'hier, sans message. La vérification est la même que pour le
  site : `https://chap.ci/api/annonce/deviner` doit répondre
  `"disponible": true`.

Pour les prendre : l'encadré du haut, les six commandes. Une nouvelle
bibliothèque Dart (`image`, pure Dart, sans code natif) entre dans
`flutter pub get` ; Xcode n'a rien de plus à faire.

---

## Ce que la mise à jour du 1ᵉʳ septembre apporte

Onze changements de l'application depuis le 28 août :

- **Le mot de passe oublié marche enfin.** Jusqu'ici, appuyer sur « Mot de passe
  oublié ? » ouvrait un message disant d'écrire à `contact@chap.ci` — dans les
  six langues. Le site savait le faire depuis le 29/08. L'application fait
  maintenant la vraie procédure : code à six chiffres par e-mail, puis nouveau
  mot de passe. La double authentification reste exigée si le compte l'a activée.
- **Le nouveau logo partout** — la couronne de feuillage et le vert ivoirien dans
  l'icône, l'en-tête et l'écran de démarrage ; le drapeau entre dans le signe.
- **L'écran de démarrage devient une jauge de chargement** au lieu d'une simple
  animation : on voit où en est l'application.
- **Le filigrane des photos** porte lui aussi la couronne.
- **Sur tablette**, le contenu ne s'étire plus sur toute la largeur.
- **Les annonces de nouveauté** : la cloche a son glyphe, et l'appui ouvre enfin
  quelque chose — avant, il ne faisait rien du tout.
- **Le guide du compte professionnel** s'ouvre depuis l'écran « Devenir pro ».
- **Le nom de la boutique** sur les cartes d'annonces, et la **vitrine du
  vendeur** côté acheteur (en-tête, horaires, registre vérifié).

**Ce qu'elle ne contient toujours pas** : les réponses automatiques et les écrans
Sécurité et Adresse de la console professionnelle du SITE. Le tableau de bord
professionnel de l'application couvre en revanche les statistiques (7/30 jours),
la courbe des vues, les favoris, les contacts et les avis. Si vous cherchez un
écran que vous avez vu sur le site et pas sur le téléphone, dites-le-moi.

---

## La marche à suivre — PREMIÈRE installation seulement

Ces sept étapes servent la première fois, ou sur un Mac neuf. Si l'application
est déjà sur votre iPhone, vous n'en avez besoin que si l'encadré du haut vous y
renvoie.

**Le compte Apple Developer payant n'est pas nécessaire pour votre propre
iPhone.** Xcode sait installer une application sur un téléphone que vous
possédez avec un simple identifiant Apple gratuit. Le prix à payer : elle expire
au bout de 7 jours, et il suffit de refaire l'étape 6 pour repartir. Pour qu'elle
dure — et qu'elle aille sur les iPhone de vos testeurs — il faut le compte
payant : voir la dernière section.

### 1. Préparer le Mac (une seule fois)

Ouvrez le **Terminal** et tapez ces trois lignes, une par une, en attendant que
chacune finisse :

```
xcode-select --install
sudo gem install cocoapods
```

La première ouvre une fenêtre : cliquez « Installer ». Si elle répond
« command line tools are already installed », c'est déjà fait, passez à la
suivante. La seconde demande votre mot de passe de session — tapez-le, il ne
s'affiche pas à l'écran, c'est normal.

Il faut aussi **Xcode** installé depuis l'App Store du Mac, et **ouvert une
fois** pour qu'il accepte ses conditions.

### 2. Récupérer la dernière version du code

Dans le Terminal, placez-vous dans le dossier du projet, puis :

```
git checkout claude/ci-marketplace-mobile-app-bnllro
git pull
```

### 3. Générer le dossier iOS

```
cd flutter_app
dart run tool/preparer_plateformes.dart
```

Cette commande crée `ios/` et le configure entièrement toute seule :
identifiant `ci.chap.app`, nom « Chap.ci », autorisations (position, photos,
appareil photo), icône, écran de démarrage, et le schéma d'URL de la connexion
Google. **Vous n'avez rien à régler à la main dans Xcode à part la signature,
juste en dessous.**

### 4. Dire à Xcode qui vous êtes

```
open ios/Runner.xcworkspace
```

Xcode s'ouvre (comptez une minute la première fois).

1. Dans la colonne de gauche, cliquez sur **Runner** tout en haut (l'icône
   bleue).
2. Au centre, choisissez la cible **Runner** puis l'onglet
   **Signing & Capabilities**.
3. Cochez **Automatically manage signing**.
4. Dans **Team**, déroulez et choisissez votre nom. S'il n'y a rien :
   **Add an Account…** → entrez votre identifiant Apple habituel (le même que
   sur votre iPhone) → il apparaît ensuite dans la liste sous la forme
   « Votre Nom (Personal Team) ».

Si Xcode affiche une erreur rouge sur le **Bundle Identifier**, c'est que
`ci.chap.app` est déjà pris chez Apple par quelqu'un d'autre. Dans ce cas
seulement, remplacez-le par `ci.chap.app.test` — cela ne gêne en rien, c'est
une installation personnelle.

### 5. Préparer l'iPhone

1. Branchez l'iPhone au Mac **avec le câble**.
2. Déverrouillez-le. Il demande « Faire confiance à cet ordinateur ? » →
   **Se fier**, puis votre code.
3. Sur l'iPhone : **Réglages → Confidentialité et sécurité → Mode
   développeur** → activez-le. L'iPhone redémarre et demande confirmation au
   déverrouillage.

Le « Mode développeur » n'apparaît dans les Réglages qu'après avoir été branché
à un Mac au moins une fois. Si vous ne le voyez pas, refaites l'étape 1 puis
lancez l'étape 6 une fois : il apparaîtra.

### 6. Installer l'application

De retour dans le Terminal, toujours dans `flutter_app` :

```
flutter devices
```

Votre iPhone doit apparaître dans la liste avec un identifiant. Puis :

```
flutter run --release -d "iPhone"
```

(Remplacez `iPhone` par le nom exact affiché par la commande précédente s'il
diffère.) Comptez cinq à dix minutes la première fois.

### 7. Autoriser le développeur — l'étape qu'on oublie

Au premier lancement, l'iPhone affiche **« Développeur non fiable »** et refuse
d'ouvrir l'application. C'est normal, ce n'est pas une panne.

Sur l'iPhone : **Réglages → Général → VPN et gestion de l'appareil** → sous
« App de développeur », touchez votre identifiant Apple → **Faire confiance**.

Rouvrez l'application. Elle s'ouvre.

---

## Les 7 jours

L'application cesse de s'ouvrir au bout d'une semaine. Pour repartir pour
7 jours : rebranchez l'iPhone et refaites **l'étape 6** uniquement. Les étapes 1
à 5 et 7 ne se refont pas.

---

## Si vous voulez que ça dure

Il faut ouvrir le **Apple Developer Program**, 99 $ par an, sur
developer.apple.com. Ce que ça change :

- l'application ne périme plus au bout de 7 jours ;
- vous pouvez la mettre sur **TestFlight**, l'équivalent Apple du canal de test
  fermé de Google — vos testeurs l'installent depuis leur iPhone, sans câble et
  sans votre Mac ;
- et c'est le seul chemin vers l'App Store.

Le jour où vous le décidez, dites-le-moi : le dossier `ios/` est déjà configuré
pour ça, et la commande de publication (`flutter build ipa`) est écrite dans
`tool/preparer_plateformes.dart`.

---

## En cas de blocage

Envoyez-moi **le texte exact affiché par le Terminal**, en entier, y compris
les lignes qui précèdent l'erreur. C'est ce qui permet de trouver la cause en
une fois plutôt qu'en dix allers-retours — c'est comme ça que le build Android
du 26 août a été débloqué en un essai.
