# Mettre l'application sur votre iPhone

**Pour le Patron, sur son Mac.** Aucune ligne de ce guide ne demande de secret :
le keystore Android n'est pas concerné, et aucun certificat n'est à envoyer à
qui que ce soit.

---

## Ce qu'il faut savoir avant de commencer

**Il n'existe aucune version iOS de Chap.ci.** Le dossier `ios/` n'a jamais été
généré sur une machine, et le compte Apple Developer (99 $/an) n'est pas ouvert.

**Bonne nouvelle : pour installer sur VOTRE PROPRE iPhone, le compte payant
n'est pas nécessaire.** Xcode sait installer une application sur un téléphone
que vous possédez, avec un simple identifiant Apple gratuit. C'est ce que fait
ce guide.

**Le prix à payer : l'application expire au bout de 7 jours.** Au 8ᵉ jour elle
refuse de s'ouvrir. Il suffit de refaire l'étape 6 pour repartir pour 7 jours.
C'est une limite d'Apple, pas un défaut de notre application.

Si vous voulez qu'elle dure — et qu'elle aille sur les iPhone de vos testeurs
comme la version Android va sur leurs Android — il faut ouvrir le compte
Apple Developer. Voir la dernière section.

---

## Ce que cette version contient, et ce qu'elle ne contient pas

**Elle contient** tout le travail Flutter fait depuis le 27 août : la vitrine
du professionnel (bannière et logo posés depuis son tableau de bord), le compte
entier tenant dans le tableau de bord, l'onglet Compte conforme aux maquettes,
et les boutons de vitrine agrandis ce matin.

**Elle ne contient PAS** les quatorze écrans de la console professionnelle
livrés sur le SITE du 26 au 28 août : ni les statistiques de vente, ni les
réponses automatiques, ni le détail des favoris, ni les écrans Sécurité et
Adresse, ni « qui a mis en favori ». L'application est en retard d'un chantier
entier sur le site. Ne les cherchez pas sur le téléphone, ils n'y sont pas.

---

## La marche à suivre

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
