# Journal des versions de l'application Android

**Ce fichier est le point de repère du bureau Livraison (🔨 Le Monteur).** Il lui
permet de savoir ce que les utilisateurs de l'application ont réellement entre les
mains, et donc ce qui leur manque.

Le dossier `android/` n'est pas dans le dépôt — il est régénéré par `dart run tool/preparer_plateformes.dart` (Flutter, depuis la v1.20) — et
l'AAB est signé sur la machine du Patron. **Rien dans le dépôt ne peut donc dire quelle
version tourne sur le Play Store.** D'où ce fichier, tenu à la main.

> ⚠️ **À mettre à jour par le Développement APRÈS CHAQUE BUILD**, avant même de
> téléverser l'AAB. Un fichier périmé fait raisonner tout le bureau à côté.

---

## Format

Une section par version, la plus récente en premier. Le champ **Commit** est le seul
qui compte vraiment : c'est lui qui permet de calculer ce qui a changé depuis.

> **Le champ Commit avait disparu des sept dernières versions** (v1.11 à v1.17), sans
> que rien ne le signale — jusqu'à ce que le Monteur bute dessus le 03/08 et parte
> d'un commit vieux de dix-sept builds. Les sept ont été reconstitués depuis
> `git log`. Pour les v1.11 à v1.13, `android/app/build.gradle` n'était pas encore
> suivi par Git : le commit indiqué est celui qui suit immédiatement l'heure du build.

**Gabarit à recopier à chaque nouvelle version.** Le champ Commit vient EN PREMIER,
parce que c'est celui qu'on oublie :

```
## v1.X — versionCode N

| Champ | Valeur |
|---|---|
| **Commit** | `abc1234` |
| Date du build | **26 août 2026** — construite par le Patron sur son Mac. Premier essai en échec : `flutter_web_auth_2` 3.1.2 compilait l'ancienne API Android « Registrar », supprimée des Flutter récents (la v1.20 était passée avec un Flutter plus ancien) ; montée en `^5.1.0` (`b435eab`), second essai réussi. |
| Poids de l'AAB | non relevé — à compléter quand le Patron communique le chiffre (Finder → clic droit sur `app-release.aab` → « Lire les informations »). |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:…:FE:33` |
| État Play | à téléverser / téléversée le JJ/MM / envoyée à l'examen le JJ/MM |
```

Le commit à inscrire est celui qui contient le `versionCode` de ce build —
autrement dit `git log --oneline -1` juste après avoir commité la montée de version.

> **« État Play » est le seul champ que le Développement ne peut pas vérifier.**
> Tous les autres se lisent dans le dépôt ou dans le fichier produit ; celui-là ne
> vit que dans la Play Console, où seul le Patron entre. Il est donc écrit AVANT le
> téléversement, avec la valeur espérée — et il reste faux jusqu'à ce que le Patron
> confirme.
>
> **Aucun bureau ne doit affirmer l'état d'une version sur la foi de ce champ.**
> Le 03/08, une ronde a écrit que la v1.17 « attend toujours son premier
> téléversement » : elle ne faisait que relire une valeur posée deux jours plus tôt.
> La formulation juste est « d'après le journal, non confirmé par le Patron ».
> Quand l'état est inconnu, écris `NON VÉRIFIÉ` plutôt qu'une supposition.

---

## État des deux boutiques

| | Google Play | App Store |
|---|---|---|
| Version publiée | ✅ **v1.20 (code 21) — VERDICT REÇU, DISPONIBLE POUR LES TESTEURS** sur le canal fermé, confirmé dans la Play Console par le Patron le **24/08/2026** (« Dernière release : 21 (1.20.0) · Disponible pour certains testeurs · 177 pays/régions »). La refonte Flutter est donc passée l'examen (voir sa fiche plus bas) ; les testeurs peuvent mettre à jour vers la v1.20 (jusque-là ils avaient la **v1.18 (code 19)**, en ligne sur le canal de TEST FERMÉ depuis le 6 août 2026 — première mise en ligne réelle du projet (les v1.9, v1.16 et v1.17 étaient restées en brouillon). Google a notifié « Mise à jour de l'appli publiée », relevé par le Patron le 7 août, puis **confirmé dans la Play Console le 10/08/2026** : « Dernière release : 19 (1.18) », canal actif, 1 pays/région. ⚠️ **Ce n'est PAS la production** (production « Inactif », bloquée par l'exigence « 12 testeurs / 14 jours »). ✅ **LE SEUIL EST FRANCHI ET LE COMPTEUR TOURNE** — confirmé dans la Play Console par le Patron le **30/08/2026** : « 12 testeurs sont actuellement inscrits pour **3 jours sans interruption** », et les deux premiers critères sont barrés. Échéance autour du **10/09/2026**. Le bouton « Demander à publier en production » est grisé jusque-là. ⚠️ Le seul risque est qu'un testeur se désinscrive ou désinstalle : le compteur repart alors de zéro. Détail et écart de dates dans « Le chemin vers la production » plus bas. | **aucune** |
| Compte développeur | ouvert (personnel, 25 $ une fois) | **non ouvert** (99 $/an) |
| Machine nécessaire | Android Studio — disponible | **Mac + Xcode — non disponible** |
| Projet dans le dépôt | non (`/android` ignoré, régénéré par `dart run tool/preparer_plateformes.dart`) | non (`/ios` ignoré, régénéré de même) |

**Un seul binaire par boutique couvre tous les formats.** Il n'existe pas de « version
tablette » à part : le même AAB sert téléphones et tablettes Android, le même IPA sert
iPhone et iPad. Seules changent les **captures d'écran** de chaque fiche, et la capacité
de l'interface à s'adapter — ce que le responsive assure déjà.

**Tant que la ligne « Mac » reste à « non disponible », le bureau Livraison doit dire
que le volet iOS est bloqué, et ne pas produire d'instructions Xcode inutiles.** Mettez
cette table à jour le jour où la situation change.

## Validation des développeurs Android — RÉGLÉE, ne rien faire

Google a notifié le 6 août : « Enregistrez vos applications pour la validation des
développeurs Android d'ici le 30 septembre 2026 ». **Aucune action n'était requise.**

Relevé dans la console par le Patron le 7 août : `ci.chap.app` — **Enregistrée**,
depuis le **22 juillet 2026**, automatiquement (Google a enregistré 99 % des
applications déjà présentes sur Play).

L'exigence commence par le Brésil, l'Indonésie, Singapour et la Thaïlande ; le
déploiement mondial vient après 2027. La Côte d'Ivoire n'est pas dans la première
vague.

> **Ne rouvrez pas ce dossier** : il est clos, et la date d'enregistrement le prouve.

---

## Le chemin vers la production (compte personnel)

> **Ce paragraphe décrit l'état du 27 juillet, et il est dépassé depuis le 6 août.**
> Il est gardé parce qu'il explique pourquoi rien ne partait — pas parce qu'il décrit
> encore la situation. La v1.18 est publiée ; voir la table ci-dessus.

Constaté le 27/07 dans la Play Console : la release du 25 juillet était restée en
**« Brouillon / Non examinée »**, et la fiche affichait encore « Nom temporaire de
l'application : ci.chap.app (unreviewed) ». Aucune version n'avait alors atteint le
moindre testeur. Ce n'était ni un refus, ni un délai d'examen : le déploiement n'avait
pas été lancé. Ce qui a débloqué la situation le 6 août, c'est le bouton
**Publication → Vue d'ensemble de la publication → Envoyer les modifications pour
examen** — la dernière porte, celle qu'on oublie.

Le compte développeur étant **personnel**, Google impose avant la production :

**12 testeurs inscrits en continu pendant 14 jours, sur un test FERMÉ.**

Le test interne ne compte pas dans ce quota — il sert seulement à vérifier que
l'application fonctionne. L'ordre est donc : test interne (vérification) → test fermé
(12 testeurs, 14 jours) → demande d'accès à la production.

Les 14 jours ne commencent qu'une fois les 12 testeurs inscrits, et le compteur repart de
zéro si l'un d'eux se désinscrit. **C'est le seul délai du projet que personne ne peut
raccourcir** — d'où la priorité du recrutement des testeurs sur tout le reste.

### 🟢 LE COMPTEUR TOURNE — relevé du 30/08/2026

Capture de l'écran « Demander un accès en production » envoyée par le Patron le
**30/08/2026 à 11h43**. Les deux premiers critères sont **barrés** dans la console,
c'est-à-dire acquis :

| Critère | État au 30/08 |
|---|---|
| Publier une version de test fermé | ✅ barré |
| Avoir au moins 12 testeurs inscrits | ✅ barré |
| Tenir 14 jours avec ≥ 12 testeurs | ⏳ **« 12 testeurs sont actuellement inscrits pour 3 jours sans interruption »** |

Le bouton « Demander à publier en production » est **grisé**, et c'est normal : il
s'allumera au 14ᵉ jour. Échéance calculée : **autour du 10/09/2026**.

⚠️ **Un écart, noté sans le lisser.** La fiche v1.21 dit que le 12ᵉ testeur s'est
inscrit le 26/08 ; du 26 au 30 il y a quatre jours, la console en compte trois. Deux
explications possibles : le douzième s'est inscrit le 27, ou bien quelqu'un est sorti
puis rentré et le compteur est reparti de zéro une fois. **C'est la console qui fait
foi**, pas notre fiche — et dans les deux cas la conduite à tenir est la même.

**La seule chose qui peut faire perdre ces jours** : qu'un testeur se désinscrive ou
désinstalle. Le compteur repart alors à zéro, et onze jours d'attente redeviennent
quatorze. Rien d'autre ne le menace — en particulier, **téléverser une nouvelle version
sur le canal fermé ne le remet pas à zéro** : le décompte porte sur les inscrits, pas
sur les versions, et il a continué de tourner pendant l'examen de la v1.21 (téléversée
le 26/08, le jour même du seuil).

---

## v1.23 — versionCode 24

| Champ | Valeur |
|---|---|
| **Commit** | `À COMPLÉTER` — le commit de la montée de version (`git log --oneline -1` juste après). |
| Date du build | **NON CONSTRUITE** au moment où cette fiche est écrite. Préparée le 28/08 à la demande du Patron : « mettre l'application à jour sur l'iPhone ». |
| Poids de l'AAB | sans objet tant qu'elle n'est pas construite. |
| minSdk 22 · targetSdk 36 | même clé de signature que v1.20/v1.21/v1.22. |
| État Play | **NON VÉRIFIÉ** — rien n'est prévu côté Play pour celle-ci ; la v1.21 reste en examen, la v1.22 (code 23) a été construite le 27/08 mais jamais téléversée. Le code 23 est donc libre : il n'a jamais atteint la console. |
| État App Store | **AUCUN.** Voir « Ce que la v1.23 change pour iOS » ci-dessous. |
| Contenu | les commits Flutter posés depuis le build de la v1.22 (`48c5045`) : finitions du tableau Pro sur téléphone, onglet Compte conforme aux maquettes, **le compte entier tenant dans le tableau de bord**, **la vitrine du professionnel** (bannière + logo posés depuis le tableau), la bannière derrière tout le bandeau, la cible tactile des boutons de vitrine portée à 48 dp — et, le 29/08, **le rattrapage du site** : le nom de la boutique sur les cartes d'annonces, et **la vitrine côté acheteur** (en-tête de boutique, état ouvert/fermé, les quatre chiffres, description d'entreprise et registre vérifié, sept jours d'horaires). ; et, le **30/08**, **les annonces de nouveauté** : la notification « nouveauté » a son glyphe, l'appui ouvre enfin quelque chose (il ne faisait RIEN — `_ouvrir` ne savait traiter qu'un identifiant d'annonce), et l'écran « Devenir pro » propose le **guide en 5 étapes** en tête, servi par le site dans la vue web comme l'aide et les CGU. |

**Ce que la v1.23 ne contient PAS, et il faut le dire.** Le rattrapage du 29/08 porte
sur ce que voit l'ACHETEUR — les cartes et la vitrine. **La console du professionnel
reste en retard** : ni les statistiques de vente (entonnoir, heures, communes), ni les
réponses automatiques, ni le détail des favoris, ni les écrans Sécurité et Adresse, ni
« qui a mis en favori ». Vérifié par recherche dans `flutter_app/lib/` : aucune de ces
routes n'y est appelée. **L'aperçu de boutique** (quatre chiffres, ligne des
promotions, recherche et puces) n'est pas porté non plus.

> **Fichiers touchés le 30/08** : `screens/notifications_screen.dart` (glyphe +
> ouverture), `screens/devenir_pro_screen.dart` (le bouton du guide),
> `liens_site.dart` (la route `guide/pro` + un titre de barre explicite),
> `i18n/textes.dart` (3 clés × 6 langues). Ce qui A été prouvé, côté production :
> l'URL exacte que chargera la vue web — `https://chap.ci/#/guide/pro?lang=…` —
> affiche bien le guide entier, vérifié en `fr`, `en` et `ar`.
>
> ⚠️ **AUCUNE DE CES LIGNES DART N'A ÉTÉ COMPILÉE.** L'environnement de développement
> n'a ni `dart` ni `flutter`. La relecture s'est faite à la main, complétée par un
> contrôle mécanique de l'équilibre des parenthèses, accolades et crochets de chaque
> fichier touché, comparé à son état d'origine. **Le premier `flutter run` sur le Mac
> du Patron est le vrai test** ; s'il échoue, le texte du Terminal suffit à corriger.

**Ce que la v1.23 change pour iOS : rien, et c'est le sujet.** `tool/preparer_plateformes.dart`
génère déjà `ios/` entièrement configuré — bundle `ci.chap.app`, nom « Chap.ci »,
autorisations, schéma d'URL Google. Il n'a simplement jamais été exécuté sur un Mac
avec Xcode. Aucune version iOS n'a jamais existé, et **le compte Apple Developer
(99 $/an) n'est pas ouvert** — d'après ce fichier, non revérifié auprès du Patron.

> ⚠️ **La table « État des deux boutiques » de ce fichier dit « Mac + Xcode — non
> disponible ». C'EST PÉRIMÉ** : le Patron a construit la v1.20 puis la v1.22 sur son
> Mac (fiches ci-dessous, dates du 26 et 27/08). La ligne a été laissée telle quelle
> pour ne pas réécrire un état que seul le Patron peut confirmer, mais aucun bureau ne
> doit en conclure que le volet iOS est bloqué faute de machine. Ce qui manque est le
> compte Apple, pas l'ordinateur — et pour une installation sur SON PROPRE iPhone,
> même le compte payant n'est pas nécessaire (provisionnement gratuit d'Xcode,
> application valable 7 jours).

---

## v1.22 — versionCode 23

| Champ | Valeur |
|---|---|
| **Commit** | `48c5045` (le build réel du 27/08 — rebranding, « la croisée », espace pro, tableau de bord professionnel façon CRM, et le correctif des deux espaces insécables qui avaient cassé le premier essai) |
| Date du build | **27 août 2026** — construite par le Patron sur son Mac. Premier essai en échec : deux opérateurs `%` du panneau pro avaient reçu une espace insécable (remplacement typographique trop large, mes excuses au compilateur) ; corrigé (`48c5045`), second essai réussi en 41 s. Icônes et splash du nouveau logo régénérés par `preparer_plateformes` au passage. |
| Poids de l'AAB | **60,3 Mo** (lu dans le Terminal du Patron : « ✓ Built …/app-release.aab (60.3MB) »). |
| **minSdk 22 · targetSdk 36** | même clé de signature que v1.20/v1.21. |
| État Play | construite le 27/08, **PAS téléversée** — le Patron a précisé : « c'est juste pour l'app de test de mon téléphone d'abord ». Il l'essaie via `flutter run --release` sur son téléphone ; **la v1.21 reste seule en examen**. L'AAB de 60,3 Mo est prêt : le jour du feu vert, il ne reste que les étapes Play Console (Tests fermés → Créer une release), sans reconstruire. |
| Contenu | nouveau logo « chap-chap » partout (icônes, splash, en-tête), animation d'ouverture « la croisée », espace professionnel complet (demande, fiches admin, notifications à lien direct), **tableau de bord professionnel façon CRM** (périodes 7/30 j, tendances, courbe des vues, messages en attente, top annonces avec photos, activité — 27 clés ×6 langues). |

**Ce qu'elle apportera — le rebranding « chap-chap »** : le losange fendu remplace l'épingle
partout — icône d'application (champ orange, signe encre, contraste 6,62:1 conforme AA),
splash natif clair/sombre + variantes Android 12 (`flutter_native_splash`, relancé
automatiquement par `tool/preparer_plateformes.dart`), et l'entrée « la croisée », choisie par le Patron sur aperçu animé
(`lib/ecran_demarrage.dart`) : les deux bords arrivent des côtés opposés et se croisent,
une lumière jaillit à la rencontre, une couleur coule et écrit le nom, tout bat une seule
fois — 1,8 s, puis fondu vers l'accueil. Le signe est aussi posé dans l'en-tête de
l'accueil (widget `SigneChap`). Le site bascule en même temps (composant `Logo.tsx`, favicons, icônes PWA,
splash de `index.html`) — kit de marque complet versionné dans `marque/`.

## v1.21 — versionCode 22

| Champ | Valeur |
|---|---|
| **Commit** | `936dcc1` — montée de version (`1.21.0+22`) + `targetSdk 36`. Le build du 26/08 embarque tous les commits Flutter jusqu'à `b435eab` inclus (montée de `flutter_web_auth_2` en 5.x, sans laquelle le build échouait — voir Date du build). |
| Date du build | **26 août 2026** — construction lancée par le Patron (procédure donnée par le Développement) ; poids à relever après le build. |
| Poids de l'AAB | — (inconnu tant que non construite) |
| **minSdk 22 · targetSdk 36** | signature d'import `chapci` — `CN=Chap.ci, OU=Mobile, O=Chap.ci, L=Abidjan, ST=Abidjan, C=CI`, SHA-1 `84:98:BB:44:AF:0E:22:2B:F5:3F:1E:6B:C0:D7:18:EF:0F:C8:F4:84` (même clé que la v1.20). |
| État Play | **Téléversée et envoyée à l'examen le 26/08/2026** — confirmé par le Patron (capture « Vue d'ensemble de la publication » : *Tests fermés — 22 (1.21.0), modifications en cours d'examen*, publication gérée désactivée → diffusion automatique aux testeurs au verdict). Échéance `targetSdk 36` du 30/08 : **tenue**. Le décompte des 14 jours (12ᵉ testeur inscrit le 26/08) court indépendamment. Verdict : NON VÉRIFIÉ tant que le Patron ne l'a pas relevé. |

**Ce qu'elle apporte depuis la v1.20** (commits Flutter du 14/08 au 25/08, jusqu'à `04711d2`) :

- **Six langues** (français, anglais, espagnol, portugais, arabe, chinois) : toute l'app bascule
  instantanément, catalogue des 16 catégories et 101 sous-catégories compris ; l'arabe passe en
  droite-à-gauche. Les annonces elles-mêmes se traduisent dans l'app (bouton « Traduire »,
  moteurs gratuits en relais côté serveur + cache — route `/traduire` déjà en ligne).
- **Comptes professionnels** : demande PRO (10 types d'organisation, 59 secteurs propres),
  suivi du dossier (en attente / approuvé / refusé + motif), badge 💼 PRO sur annonces et
  profils, écran admin « Demandes Pro » (approuver / refuser, rappel RCCM).
- **Écran Paramètres complet** : Mes favoris, Partager, Noter l'app, Langue, notifications,
  e-mail / mot de passe / 2FA, zone sensible.
- **Pages du site dans la langue choisie** : la vue web passe `?lang=` au site et les titres de
  barre sont localisés (contenus traduits servis par le site depuis le déploiement du 25/08).
- Défilement infini de l'accueil (pagination serveur `/listings?limit=&offset=`), tri « Près de
  moi », messagerie glissable (épingler — 5 max —, archiver, bloquer, supprimer), onglets au
  doigt, en-tête de conversation cliquable vers le profil public, pages légales dans l'app.
- **Correctifs** : la vue web n'ouvre que les schémas `https/http/tel/mailto/sms` (sécurité) ;
  cible tactile du bouton « Traduire » portée à 48×48 dp (accessibilité, verdict Atelier).

> ⚠️ **`targetSdk` monté de 35 à 36** dans `tool/preparer_plateformes.dart` (qui le figeait
> à 35) : Google refuse `targetSdk 35` pour tout dépôt **à partir du 31/08/2026**. C'est
> exactement la correction annoncée sur la fiche v1.20. `compileSdk` vient de Flutter (36
> depuis le `flutter upgrade` du 24/08) et reste ≥ `targetSdk`.

> ⚠️ **iOS reste bloqué côté boutique** (pas de compte App Store, pas de Mac en CI) : l'app
> tourne sur l'iPhone du Patron en local depuis le 24/08, mais aucun IPA n'est déposé.

---

## v1.20 — versionCode 21

| Champ | Valeur |
|---|---|
| **Commit** | `617edc8` — corrigé le 18/08 sur signalement du Monteur : le champ portait `b9786a1` (build du 12/08, perdu), mais l'AAB **réellement téléversé le 15/08** a été reconstruit et embarque tous les commits jusqu'à `617edc8` (14/08, le correctif anti-CSRF Facebook — dernier commit touchant `flutter_app/`). Vérifié : `git log 617edc8..HEAD -- flutter_app/ server/` est vide. |
| Date du build | 15 août 2026 (reconstruction — le fichier du build du 12/08 avait été perdu) |
| Poids de l'AAB | **50,3 Mo** — dix fois la v1.19 (5,42 Mo), et c'est NORMAL : ce n'est plus une WebView Capacitor, c'est Flutter, qui embarque son propre moteur de rendu. L'utilisateur ne télécharge pas 50 Mo : le Play Store découpe le bundle par appareil (ABI + densité) et n'envoie que la tranche utile. |
| **minSdk 22 · targetSdk 35** | signée avec la **NOUVELLE clé d'importation** — alias `chapci`, `CN=Chap.ci, OU=Mobile, O=Chap.ci, L=Abidjan, ST=Abidjan, C=CI`, SHA-1 `84:98:BB:44:AF:0E:22:2B:F5:3F:1E:6B:C0:D7:18:EF:0F:C8:F4:84` |
| État Play | ✅ **TÉLÉVERSÉE ET ENVOYÉE À L'EXAMEN le 15/08/2026** sur le canal de **test fermé** (même canal que la v1.18) — **vu dans la console par le Patron** : « 21 (1.20.0) — Tests fermés – Test fermé Chap.ci », puis « **Modifications en cours d'examen** ». Déploiement réglé sur « Lancer le déploiement complet », **publication gérée désactivée** (la version part aux testeurs dès l'examen validé, sans autre clic). ✅ **VERDICT REÇU — DISPONIBLE POUR LES TESTEURS**, confirmé dans la Play Console par le Patron le **24/08/2026** : « Dernière release : 21 (1.20.0) · Disponible pour certains testeurs · 177 pays/régions ». La v1.20 est donc en ligne sur le canal fermé. Marche à suivre : **`store/BUILD-v1.20.md`**. |

> ⚠️ **Échéance Google — `targetSdk 35` n'est accepté que jusqu'au 30/08/2026**
> (signalé par le Monteur le 17/08). La v1.20 en examen n'est pas concernée : ne
> touchez à rien tant que le verdict n'est pas tombé. Mais **tout build
> postérieur au 30/08 devra passer à `targetSdk 36`** dans
> `tool/preparer_plateformes.dart` (qui fige `targetSdk = 35` dans
> `android/build.gradle.kts`), sans quoi Google refusera le dépôt de l'AAB.

**C'est la refonte Flutter — le plus gros changement depuis la v1.0.** L'application
n'est plus le site enveloppé dans une WebView Capacitor : c'est une application
Flutter native, reconstruite écran par écran, qui parle au **même** backend PHP
(`chap.ci/api`) — aucun changement serveur. L'`applicationId` reste `ci.chap.app` :
pour le Play Store, c'est une **mise à jour** de l'app existante, pas une nouvelle app.

**Le dossier `android/` n'est plus régénéré par `cap sync` mais par
`dart run tool/preparer_plateformes.dart`** (équivalent Flutter : il recrée
`android/` ET `ios/`, applique l'identifiant, l'icône, les permissions et la config
de signature). Le keystore et son mot de passe **vivent uniquement sur le Mac du
Patron**, sauvegardés hors machine — jamais dans le dépôt.

> ⚠️ **La clé d'importation a changé — l'ancien keystore Capacitor a été perdu.**
> Google a accepté une **réinitialisation de la clé d'importation** (Play App
> Signing) : la nouvelle clé (SHA-1 `84:98:…:F4:84`) prend effet le **14 août 2026
> à 15 h 10 UTC**. AUCUN téléversement n'est possible avant cette heure.
> **Ce que voient les utilisateurs ne change pas** : grâce à Play App Signing,
> Google resigne chaque installation avec la clé d'application d'origine
> (SHA-1 `0E:C0:95:D9:…:FE:33`, inchangée depuis la v1.0). Seule la clé qui sert
> à *déposer* le fichier a été renouvelée.

> ⚠️ **`targetSdk 35` — accepté jusqu'au 30 août 2026 seulement.** Ce build passe
> s'il est déposé avant cette date (il l'est : upload prévu le 14/08). Mais
> `tool/preparer_plateformes.dart` fige `targetSdk = 35` : **tout build produit
> à partir du 31 août sera refusé** tant que le script (et le `build.gradle.kts`
> qu'il écrit) ne montent pas à `targetSdk 36`, comme la v1.19 l'avait fait côté
> Capacitor. À corriger dans le script avant la prochaine version.

**Ce que la refonte apporte** (repris des notes de version, `store/notes-version-v1.20.md`) :
placement GPS de l'annonce à l'endroit exact ; couverture de toute la Côte d'Ivoire ;
couleurs et variantes ; notifications quand un acheteur écrit ; connexion plus sûre.
Côté administration, l'app couvre désormais aperçu, modération, utilisateurs, annonces,
sauvegardes, newsletter, campagnes, e-mails/SMTP, modérateurs, messages de contact,
avis, commandes et conversations. La ligne « reconnectez-vous une fois » des notes
est volontaire : l'ancienne app et la nouvelle ne rangent pas la session au même
endroit (rien n'est perdu, tout est sur le serveur).

---

## v1.19 — versionCode 20

| Champ | Valeur |
|---|---|
| **Commit** | `5ae60ed` |
| Date du build | 7 août 2026 |
| Poids de l'AAB | 5,42 Mo (5 422 602 octets) |
| **minSdk 22 · targetSdk 36** | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:70:92:F2:C0:19:A1:41:D1:35:DC:81:6A:73:28:FE:33` |
| État Play | **PRÊTE, PAS ENCORE TÉLÉVERSÉE** — à ne pousser QU'APRÈS la mise en ligne de la v1.18. NON VÉRIFIÉ. |

**C'est le build de l'API 36.** Google a écrit au Patron le 7 août à 03 h 39
(« [Action requise] Votre appli est concernée par les exigences liées au niveau
d'API cible »). La règle : **à partir du 31 août 2026**, toute nouvelle appli et
toute mise à jour doivent cibler **Android 16 (API 36)**. Une prolongation est
possible jusqu'au 1<sup>er</sup> novembre — elle n'a pas lieu d'être, ce build
existe.

`android/variables.gradle` passe de 35 à 36, en `compileSdk` comme en
`targetSdk`. **Ce fichier est désormais SUIVI PAR GIT** (`git add -f`, le dossier
`android/` étant ignoré) : sans cela, la montée d'API disparaissait au premier
clone, exactement comme le `versionCode` avant que `app/build.gradle` ne soit
suivi.

> ⚠️ **Compilé avec un avertissement, et il est assumé.** L'AGP 8.2.1 de ce
> projet n'a été testé par Google que jusqu'à `compileSdk = 34` ; il accepte 36
> et produit un bundle valide — vérifié sur le fichier — mais l'avertissement
> reste. Il n'est **pas** supprimé volontairement : le jour où l'application
> sera stable en test fermé, il faudra monter AGP et Gradle. Masquer
> l'avertissement maintenant reviendrait à s'assurer de l'oublier.

**Ce qu'elle apporte en plus de la v1.19 côté API :** la rubrique
**École & Fournitures** (six sous-catégories, 101 schémas au total), livrée sur
le site le 6 août au soir. La rentrée ivoirienne tombe le 14 septembre — cette
version doit être en ligne avant.

**ORDRE À RESPECTER, et il n'est pas négociable :**
1. la v1.18 (code 19) termine son examen et passe en ligne ;
2. les testeurs s'inscrivent et installent — le compte à rebours des 14 jours
   démarre ;
3. **seulement ensuite**, la v1.19 est téléversée sur le même canal fermé.
Remplacer une version en cours d'examen relance l'examen à zéro et retarde tout.

---

## v1.18 — versionCode 19

| Champ | Valeur |
|---|---|
| **Commit** | `f1b59c2` |
| Date du build | 6 août 2026 |
| Poids de l'AAB | 5,40 Mo (5 404 994 octets) — v1.17 en faisait 5,38 |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:70:92:F2:C0:19:A1:41:D1:35:DC:81:6A:73:28:FE:33`, valide jusqu'au 6 décembre 2053 |
| État Play | **TÉLÉVERSÉE EN TEST FERMÉ (code 19)** — vérifiée dans la console par le Patron le 10/08/2026 : « Dernière release : 19 (1.18) », canal de test fermé actif, 1 pays/région. **Pas en production** (production « Inactif »). Test fermé ouvert : **10 testeurs inscrits sur les 12 requis** — confirmé dans la console par le Patron le 15/08/2026 (« 10 testeurs actuellement inscrits »). Il ne manque plus que **2 inscrits** ; le compte à rebours des 14 jours (test tournant avec ≥ 12 testeurs) n'a pas encore démarré. |

**Le code 18 est brûlé.** La v1.17 a bien été reçue par Google le 02/08, même
restée en brouillon : un `versionCode` déjà téléversé ne se réutilise jamais.
D'où le saut à 19.

**Ce que cette version apporte par rapport à la v1.17 :**

- deux rubriques neuves, **Voyage** et **À donner**, avec leurs treize schémas de
  sous-catégories — c'est l'essentiel du poids ajouté, et il est découpé : le
  paquet de démarrage ne les porte pas, chaque catégorie se charge à l'ouverture ;
- l'animation d'indépendance : feux d'artifice la nuit, décompte « J-… » puis
  « Jour J », et le message d'encouragement qui change avec l'heure. **La v1.17
  ne l'avait pas** — c'est la version installée sur les téléphones qui expliquait
  que l'animation ne se faisait pas dans l'application ;
- le temps de réponse habituel du vendeur, sur la fiche et sur le profil ;
- la barre de recherche sans contours, et six gris remontés à la norme
  d'accessibilité ;
- le dossier foncier : numéro du document et IDUFCI devenus facultatifs.

> ⚠️ **`targetSdk 35` est accepté jusqu'au 30 août 2026.** À partir du 31, Google
> exigera l'API 36 pour tout nouveau téléversement. Ce build passe ; le suivant,
> non — il faudra monter `targetSdkVersion` dans `variables.gradle` et rebâtir.
> C'est dans **24 jours**.

---

## v1.17 — versionCode 18

| Champ | Valeur |
|---|---|
| **Commit** | `057db9d` |
| Date du build | 2 août 2026 |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` |
| État Play | **TÉLÉVERSÉE**, vérifiée dans la console le 03/08 par le Patron : « Release sans nom · Brouillon · 18 (1.17) · Pas encore envoyé pour examen ». Le fichier est bien monté ; la release n'a jamais quitté l'état de brouillon. |

**Contient tout ce qu'apportaient la v1.15 et la v1.16.** Aucune des deux n'a été
envoyée à l'examen : il n'y a qu'un seul fichier à téléverser, celui-ci.

**L'application s'ouvre une seconde plus tôt.** L'écran d'accueil imposait un
plancher de 900 ms plus 400 ms de fondu ; mesuré au navigateur, le contenu était
prêt à 320 ms et l'écran ne partait qu'à 1 531 ms. Plancher ramené à 120 ms,
fondu à 180 ms, et le retrait déclenché une fois la page réellement peinte —
385 ms au lieu de 1 531. Sur une connexion lente, l'animation se déroule
entièrement comme avant : elle garde son temps là où elle sert vraiment.

**Polices allégées** : sept alphabets embarqués (latin, latin-ext, grec, grec
étendu, cyrillique, cyrillique étendu, vietnamien) ramenés au seul latin, qui
couvre le français en entier. 288 Ko → 76 Ko dans le paquet.

Côté serveur, cette version profite aussi de PHP 8.5, de la comptabilité et des
dix-sept colonnes de base manquantes — mais tout cela vient de l'API, pas du
paquet : l'application en bénéficiait déjà.

---

## v1.16 — versionCode 17

| Champ | Valeur |
|---|---|
| **Commit** | `b7709d1` |
| Date du build | 2 août 2026 |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | **téléversée le 02/08** en test fermé — « Dernière release : 17 (1.16) », canal actif, 1 pays. ⛔ **« Pas encore envoyé pour examen »** |

> ⚠️ **Téléverser n'est pas publier.** Créer la release la laisse en brouillon dans la
> console ; tant que les modifications ne sont pas *envoyées pour examen* depuis la
> **Vue d'ensemble de la publication**, aucun testeur ne reçoit rien. La fiche affiche
> encore « Nom temporaire de l'application : ci.chap.app (unreviewed) » — l'application
> n'a jamais passé d'examen Google. C'est ce qui bloque depuis la v1.1.

**Contient tout ce qu'apportait la v1.15** (correction de la page blanche sur un lien
d'annonce ouvert à froid). La v1.15 n'ayant jamais été téléversée, il n'y a qu'un seul
fichier à envoyer : celui-ci.

**Nouveauté : la comptabilité du site**, réservée au propriétaire. L'onglet *Recettes*
disparaît ; tout est désormais rassemblé sous **Comptabilité** — un grand livre à deux
registres chronologiques (recettes, achats et dépenses), le rapprochement avec les
relevés Mobile Money, le régime fiscal calculé sur le chiffre d'affaires, et trois
documents téléchargeables à remettre aux Impôts : les deux registres au format CSV et
l'état financier de fin d'exercice au **Système Minimal de Trésorerie** (SYSCOHADA
révisé), prêt à imprimer.

Les recettes déjà saisies dans l'ancien onglet et les publicités encaissées sont
reprises automatiquement au grand livre, sans doublon possible.

---

## v1.15 — versionCode 16

| Champ | Valeur |
|---|---|
| **Commit** | `ccb4191` |
| Date du build | 2 août 2026, 04h36 |
| Poids de l'AAB | 5,32 Mo |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | construite et signée — **corrige une page blanche introduite en v1.14** |

**Un lien d'annonce ouvert à froid donnait une page entièrement blanche.**
Erreur React #310 : le crochet `useFormSous` avait été placé APRÈS le `return`
d'annonce introuvable. Au premier rendu l'annonce n'est pas encore chargée, la
fonction sortait avant le crochet ; au rendu suivant elle l'appelait — React
compte les crochets et s'arrête net.

Le chemin touché est le pire possible : **le lien qu'on partage sur WhatsApp**.
Naviguer depuis l'accueil fonctionnait, ce qui rend le défaut invisible quand
on essaie soi-même. Trouvé en vérifiant le déploiement, pas avant.

Le crochet est remonté au-dessus du `return`, avec le commentaire qui dit
pourquoi il ne doit jamais redescendre. Vérifié au navigateur sur les huit
annonces réelles, chargées à froid : 18 détails sur 18 affichés.

---

## v1.14 — versionCode 15

| Champ | Valeur |
|---|---|
| **Commit** | `0911311` |
| Date du build | 2 août 2026, 04h18 |
| Poids de l'AAB | **5,32 Mo** (6,63 avant) |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | construite, **remplacée par la v1.15** (page blanche sur lien direct) |

**R8 activé.** La Play Console notait « Optimisation : Faible » et le proposait.
Le code compilé passe de **6 770 à 1 120 Ko (−83 %)**, l'AAB de 6,63 à 5,32 Mo.
Le fichier de désobscurcissement part avec le paquet, ce qui referme aussi le
troisième avertissement de la console.

Ce qui rend l'opération tenable : Capacitor livre ses propres règles de
conservation (`consumerProguardFiles`), qui protègent les greffons trouvés par
réflexion. Vérifié dans le paquet produit, pas déduit : les quatre greffons
que Capacitor cherche PAR CHAÎNE au démarrage gardent leur nom d'origine,
`@CapacitorPlugin`, `@Permission`, `@PluginMethod` et `@JavascriptInterface`
sont toujours là, `MainActivity` aussi, et les 17 ressources de l'écran de
démarrage ont survécu au réducteur (`res/raw/keep.xml`).

> ⚠️ **Passer par le test INTERNE d'abord.** R8 supprime ce qu'il croit
> inutilisé ; ce type de défaut ne se voit qu'une fois installé sur un vrai
> téléphone. Le test interne ne compte pas dans les 12 testeurs : c'est
> exactement ce à quoi il sert.

**L'écran de démarrage s'anime.** La goutte se pose, le nom monte, la baseline
suit, le logo respire une fois. Jusqu'ici l'application montrait une image
FIXE pendant 1,2 s puis sautait au contenu : le geste n'existait que sur le
site. L'image native est ramenée à 350 ms — le temps que la WebView peigne
`index.html` — et c'est l'écran animé qui fait l'entrée, comme sur le site.
`prefers-reduced-motion` respecté.

---

## v1.13 — versionCode 14

| Champ | Valeur |
|---|---|
| **Commit** | `6d6835c` — reconstitué : build.gradle n’était pas encore suivi par Git |
| Date du build | 2 août 2026, 04h05 |
| Poids de l'AAB | 6,7 Mo |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | construite, **dépassée par la v1.14** |

**Les annonces publiées avant les nouveaux formulaires avaient perdu tous
leurs détails.** Les 82 schémas n'emploient pas les mêmes clés que l'ancien
formulaire générique : le schéma « Chaussures » attend des `pointures`,
l'annonce de juillet portait une `taille`. Aucun champ ne réclamait plus les
anciennes valeurs, et les huit annonces en ligne n'affichaient plus rien —
sans le moindre message.

La fiche affiche désormais aussi ce qu'aucun champ ne réclame, avec son
libellé d'origine (repris de `categoryForms.ts`, qui existe toujours).
Vérifié sur les huit annonces réelles de production : 18 détails sur 18
récupérés.

> Cette correction se joue surtout **côté site** : elle est dans le zip et agit
> dès l'extraction. L'AAB n'est utile qu'au prochain envoi.

---

## v1.12 — versionCode 13

| Champ | Valeur |
|---|---|
| **Commit** | `9ac4d76` — reconstitué : build.gradle n’était pas encore suivi par Git |
| Date du build | 2 août 2026, 03h54 |
| Poids de l'AAB | 6,7 Mo |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | **TÉLÉVERSÉE le 02/08** — la console annonce 20 852 appareils pris en charge, les 7 exclus de la v1.10 sont bien récupérés |

**Le démarrage divisé par deux.** Paquet initial : 221 → 133 Ko compressés
(−40 %), sous le budget de 150 Ko que le projet s'est fixé.

Les 82 formulaires par sous-catégorie partaient au démarrage, sur toutes les
pages, alors que l'accueil et l'explorateur n'ont besoin que d'une liste de
noms. Ils sont désormais découpés en douze fichiers chargés à la demande —
seulement celui de la catégorie regardée. Vérifié au navigateur : zéro schéma
téléchargé au démarrage, douze fichiers séparés bien produits. « Mon compte »
passe aussi en chargement différé (−14 Ko).

**Aussi :** neuf textes remontés au-dessus de la norme de contraste, et sept
survols du menu du haut qui restaient collés au doigt sur tablette.

> Les versions 10, 11 et 12 sont dépassées et ne doivent pas être téléversées.
> Sauter des numéros est autorisé par Google — seule compte la croissance.

---

## v1.11 — versionCode 12

| Champ | Valeur |
|---|---|
| **Commit** | `a753aad` — reconstitué : build.gradle n’était pas encore suivi par Git |
| Date du build | 2 août 2026, 03h40 |
| Poids de l'AAB | 6,7 Mo |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | construite, **dépassée par la v1.12** avant tout téléversement |

**Une correction, trouvée par la Play Console elle-même.** En prévisualisant la
v1.10, la console a averti : *« cette version ne prend plus en charge
7 appareils »* — 1 téléphone et 6 tablettes.

La cause n'est écrite nulle part dans notre manifeste : **Android ajoute tout
seul `<uses-feature android:name="android.hardware.location.gps">` dès qu'on
déclare `ACCESS_FINE_LOCATION`**, et en `required="true"` par défaut. Ne pas
écrire la ligne ne suffit donc pas — il faut la réécrire explicitement en
`required="false"` pour écraser la valeur implicite. Les trois lignes
(`location`, `location.gps`, `location.network`) y sont maintenant, avec le
commentaire qui explique pourquoi il ne faut jamais les supprimer.

Sept appareils sur 20 739, c'est 0,03 % — mais le correctif coûtait deux
minutes, et personne n'était encore installé.

**Aussi :** la FAQ promettait encore des photos libres alors que le serveur en
exige trois depuis la v1.10. Relevé par le bureau Support le 2 août.

---

## v1.10 — versionCode 11

| Champ | Valeur |
|---|---|
| **Commit** | `e1a07b7` |
| Date du build | 1ᵉʳ août 2026, soir |
| Poids de l'AAB | 6,7 Mo |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | téléversée le 02/08, **non déployée** — remplacée par la v1.11 avant confirmation (7 appareils exclus, voir ci-dessus). Le code 11 est brûlé. |

**Une seule raison, et elle suffit : la géolocalisation ne pouvait pas
fonctionner.** La v1.9 est partie en test fermé avec `INTERNET` pour unique
permission. Quand l'accueil demandait la position au premier rendu, Android
refusait **sans afficher la moindre boîte de dialogue**, et l'application se
rabattait en silence sur une estimation par adresse IP — qui place à peu près
tout le monde à Abidjan-Plateau. « Les annonces près de chez vous » ne voulait
donc rien dire, et rien ne permettait de s'en apercevoir.

`ACCESS_COARSE_LOCATION` et `ACCESS_FINE_LOCATION` sont désormais déclarées.
Et le manifeste Android est **versionné** (`.gitignore` porte une exception) :
il vivait hors du dépôt, où une permission ajoutée un soir disparaissait sans
bruit à la première régénération.

**Aussi : trois photos au minimum pour publier.** Une annonce sans photo ne se
vend pas — l'acheteur qui doit traverser Abidjan veut voir avant de se
déplacer. La règle est posée dans le formulaire (« encore 2 photos », avant
qu'on ne remplisse quoi que ce soit) ET dans la route du serveur. Les annonces
déjà en ligne ne sont pas piégées : celle qui n'a qu'une photo reste
modifiable, on demande seulement de ne pas descendre plus bas.

**Aussi :** le délai de garde des envois. Capacitor route les `POST`, `PUT` et
`DELETE` par le pont natif, qui abandonne le signal d'annulation — sur un
réseau qui décroche, « Se connecter » et « Publier » tournaient indéfiniment,
sans message et sans moyen d'annuler. L'écran rend maintenant la main au bout
de quinze secondes quoi qu'il arrive.

> ⚠️ Le troisième défaut trouvé en même temps — les comptes ouverts avec Google
> qui ne pouvaient pas entrer dans l'application — se corrige **côté serveur**,
> pas ici. Il part avec le zip, et n'attend pas cette version.

---

## v1.9 — versionCode 10

| Champ | Valeur |
|---|---|
| **Commit** | `54f3a9e` |
| Date du build | 1ᵉʳ août 2026 |
| Poids de l'AAB | 6,7 Mo |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | **DÉPLOYÉE** — active sur le canal « Test fermé Chap.ci », relevé dans la console le 01/08/2026 (« Versions actives · Release : 10 (1.9) ») |

> 🎉 **Première version de Chap.ci à atteindre réellement des testeurs.** Les v1.1 à v1.3
> étaient restées en brouillon faute d'avoir cliqué « Lancer le déploiement » ; la v1.4 avait
> été envoyée mais n'a jamais compté de testeur inscrit vérifié. C'est donc ici que commence
> le vrai compteur : 12 testeurs inscrits, 14 jours consécutifs.

**Le changement le plus lourd depuis le début.** Les quatre-vingt-deux formulaires
par sous-catégorie, préparés semaine après semaine sous forme d'aperçus, entrent
enfin dans l'application : 937 champs, 641 obligatoires, 84 bandeaux d'alerte et
49 réponses qui interdisent la publication. Un vendeur de poulets et un vendeur
de terrains ne remplissent plus le même formulaire.

**Quinze catégories deviennent treize** — « Téléphones » rejoint Électronique,
« Agriculture » se répartit entre Alimentation, Animaux et Matériel Pro. Les
annonces déjà publiées sont reclassées côté serveur au premier chargement ;
l'application, elle, n'a plus qu'à afficher les treize.

Aussi : le contraste de l'ocre porté à la norme AA, l'analyse locale des photos
annoncée dans la politique de confidentialité (exigence Google Play), et deux
survols qui restaient collés au doigt sur mobile.

**Cet AAB est indispensable.** L'application embarque sa propre copie du site :
déposer le zip sur chap.ci ne lui apporte rien. Sans ce téléversement, les
utilisateurs de l'application continueraient de voir l'ancien formulaire unique.

---

## v1.8 — versionCode 9

| Champ | Valeur |
|---|---|
| **Commit** | `d75467e` |
| Date du build | 30 juillet 2026 |
| Poids de l'AAB | 6,6 Mo |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | construite et signée — **remplace la v1.7, jamais envoyée en examen** |

**En plus de la v1.7 :** les couleurs en pastilles peintes (quinze teintes,
choix multiple) sur sept catégories ; et surtout les **variantes** — chaque
couleur cochée peut porter sa photo (désignée parmi celles de l'annonce), son
prix et ses détails. Un vendeur qui a le même téléphone en noir et en bleu ne
publie plus deux annonces. Sur la fiche, toucher une couleur fait défiler la
galerie jusqu'à sa photo.

---

## v1.7 — versionCode 8

| Champ | Valeur |
|---|---|
| **Commit** | `6badb5d` |
| Date du build | 29 juillet 2026, soir |
| Poids de l'AAB | 6,6 Mo |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | construite et signée — **remplace la v1.6, jamais envoyée en examen** |

**Pourquoi une v1.7 deux heures après la v1.6.** La v1.6 attendait encore son
envoi en examen quand le formulaire Téléphones a été refait : rien n'était donc
engagé, et remplacer la release ne coûte qu'un téléversement. Les douze testeurs
partiront avec la version complète — même raisonnement que pour la v1.5.

**En plus de la v1.6 :** le formulaire Téléphones suit la sous-catégorie
(smartphone, fixe, accessoire, réparation n'affichent plus les mêmes champs) ;
la question « Comptes iCloud / Google » obligatoire — l'arnaque n° 1 de
l'occasion, posée avant l'appel ; provenance, santé de la batterie, « Fournis
avec » ; l'exemple de titre du champ Titre adapté à la catégorie.

---

## v1.6 — versionCode 7

| Champ | Valeur |
|---|---|
| **Commit** | `5b9df6f` |
| Date du build | 29 juillet 2026, soir |
| Poids de l'AAB | 6,6 Mo |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | construite et signée — **à téléverser sur le canal de test fermé** |

**Pourquoi cette version est nécessaire, et pas seulement souhaitable.**

L'application embarque sa propre copie du site (`webDir: 'dist'`, aucun
`server.url`) : une extraction de zip sur chap.ci ne l'atteint donc PAS. Le
serveur, lui, est commun aux deux.

Le 29/07 au soir, le serveur s'est mis à refuser toute vente immobilière dont le
dossier foncier est incomplet. La v1.5 porte l'ANCIEN formulaire, qui n'a pas
les champs correspondants : un testeur qui tenterait de publier un terrain
depuis l'application recevrait un refus qu'il n'aurait aucun moyen de corriger.

La v1.6 apporte le formulaire qui va avec la règle.

**En plus de la v1.5 :** le dossier foncier (neuf documents à cocher, numéros,
IDUFCI, bornage, engagements) ; le bandeau de verdict et le guide dépliant sous
chaque annonce de vente ; l'exemple de titre adapté à chaque catégorie ; la
sous-catégorie immobilière qui décide seule du type d'offre ; le lien « Mes
annonces » qui n'envoie plus une annonce masquée vers une page introuvable.

---

## v1.5 — versionCode 6

| Champ | Valeur |
|---|---|
| **Commit** | `928585a` |
| Date du build | 29 juillet 2026 |
| Poids de l'AAB | 6,6 Mo |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | construite et signée — **destinée au canal de TEST FERMÉ** |

**Pourquoi une v1.5 le lendemain.** Le canal de test fermé n'avait toujours pas
de release au 29/07 à 14 h : rien n'était donc en examen, et rien n'empêchait de
livrer la version complète. Or ce canal engage douze personnes pendant quatorze
jours — autant qu'elles gardent la meilleure version, pas une déjà en retard de
trois correctifs.

**En plus de la v1.4 :** glissement gauche/droite entre les onglets ; sept
correctifs d'ergonomie (boutons portés à 44 px, contraste des libellés porté de
2,6:1 à 4,83:1) ; correction de la phrase « publier avec ou sans compte », qui
était fausse.

---

## v1.4 — versionCode 5

| Champ | Valeur |
|---|---|
| **Commit** | `5878041` |
| Date du build | 28 juillet 2026 |
| Poids de l'AAB | 6,6 Mo |
| minSdk | 22 (Android 5.1) · targetSdk 35 |
| Signature | `CN=Chap.ci, L=Abidjan, C=CI` — SHA-1 `0E:C0:95:D9:70:92:F2:C0:19:A1:41:D1:35:DC:81:6A:73:28:FE:33` |
| État Play | construite et signée — **destinée au TEST FERMÉ** |

**Pourquoi si vite après la v1.3 :** la v1.3 était partie en test interne le matin
même, mais le canal de test **fermé** n'avait pas encore été créé. Or c'est lui qui
engage douze testeurs pendant quatorze jours consécutifs. Autant qu'ils gardent la
version la plus complète, plutôt qu'une version dont on sait déjà qu'elle porte des
logos faux. Un build de plus coûte quelques minutes ; quatorze jours sur une version
périmée, non.

**Contenu, en plus de la v1.3 :** les vrais logos (WhatsApp et Facebook n'étaient
qu'un émoji et une lettre ; Orange Money était dessiné en cercle alors que sa marque
est un carré) ; Facebook et TikTok dans le pied de page et le plan du site ; retrait
de la mention « Paiement sécurisé · reçu envoyé par SMS » de la page de don, qui était
fausse dans ses deux moitiés.

Détail de la v1.3 : voir `store/BUILD-v1.3.md`.

---

## v1.3 — versionCode 4

| Champ | Valeur |
|---|---|
| **Commit** | `f5e15a7` |
| Date du build | 28 juillet 2026 |
| Poids de l'AAB | 6,6 Mo |
| minSdk | 22 (Android 5.1) |
| targetSdk | 35 |
| Signature | `CN=Chap.ci, L=Abidjan, C=CI` — SHA-1 `0E:C0:95:D9:70:92:F2:C0:19:A1:41:D1:35:DC:81:6A:73:28:FE:33` |
| État Play | construite et signée — **en attente de téléversement** |

**Contenu :** la **grande photo d'une annonce ne s'affichait pas** dans l'application —
seules les miniatures apparaissaient, parce qu'elle seule n'appelait pas `mediaUrl()`.
Même oubli corrigé sur la photo du vendeur, l'avatar du compte, la vignette d'une commande
et les photos déjà en ligne quand on **modifie** une annonce. Nouvelle **visionneuse plein
écran** : on touche la photo, elle s'affiche entière, on balaie vers la gauche ou la droite
(le bouton retour d'Android la referme au lieu de quitter l'annonce). Ajouts venus du site :
« Mes publicités » dans le compte (audience, coût, prolongation), cycle de vie complet des
publicités, pied de page réduit à un lien dans l'application.

Détail : voir `store/BUILD-v1.3.md`.

---

## v1.2 — versionCode 3

| Champ | Valeur |
|---|---|
| **Commit** | `a993629` |
| Date du build | 27 juillet 2026 |
| Poids de l'AAB | 6,5 Mo |
| minSdk | 22 (Android 5.1) |
| targetSdk | 35 |
| Signature | `CN=Chap.ci, L=Abidjan, C=CI` — SHA-1 `0E:C0:95:D9:70:92:F2:C0:19:A1:41:D1:35:DC:81:6A:73:28:FE:33` |
| État Play | construite — **en attente de téléversement** |

**Contenu :** les photos d'annonces s'affichent enfin dans l'application (`mediaUrl()` :
l'app est servie depuis `https://localhost`, où un chemin relatif ne pointe nulle part) ;
catégorie **Santé & Bien-être** ; page publique de **suppression de compte** exigée par
Google ; le téléphone du vendeur ne sort plus de l'API publique ; formulaire de publication
guidé ; correctifs d'accessibilité ; boutons sociaux masqués dans l'app (Google refuse
l'OAuth en WebView) ; le site ne promet plus « des milliers d'annonces ».

**Construite dans l'environnement de session**, pas sur un poste : le SDK Android, Gradle
et le keystore y sont présents — c'était déjà le cas pour la v1.1.

---

## v1.1 — versionCode 2

| Champ | Valeur |
|---|---|
| **Commit** | `b7868ec` |
| Date du build | 25 juillet 2026 |
| Poids de l'AAB | 6,4 Mo |
| minSdk | 22 (Android 5.1) |
| targetSdk | 35 |
| État Play | **jamais déployée** — release restée « Brouillon / Non examinée » |

**Contenu :** allègement du paquet natif par `scripts/android-slim.mjs` (retrait du
moteur de détourage `ort/wasm` et des bannières `og/`), qui fait passer l'application
de 16,7 Mo à 6,4 Mo.

---

## v1.0 — versionCode 1

| Champ | Valeur |
|---|---|
| Commit | non consigné |
| Date du build | vers le 21 juillet 2026 |
| État Play | remplacée par la v1.1 |

Première version empaquetée avec Capacitor. Aucun relevé précis n'a été conservé —
c'est précisément pour ne plus retomber dans ce cas que ce fichier existe.
