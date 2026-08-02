# Journal des versions de l'application Android

**Ce fichier est le point de repère du bureau Livraison (🔨 Le Monteur).** Il lui
permet de savoir ce que les utilisateurs de l'application ont réellement entre les
mains, et donc ce qui leur manque.

Le dossier `android/` n'est pas dans le dépôt — il est régénéré par `cap sync` — et
l'AAB est signé sur la machine du Patron. **Rien dans le dépôt ne peut donc dire quelle
version tourne sur le Play Store.** D'où ce fichier, tenu à la main.

> ⚠️ **À mettre à jour par le Développement APRÈS CHAQUE BUILD**, avant même de
> téléverser l'AAB. Un fichier périmé fait raisonner tout le bureau à côté.

---

## Format

Une section par version, la plus récente en premier. Le champ **Commit** est le seul
qui compte vraiment : c'est lui qui permet de calculer ce qui a changé depuis.

---

## État des deux boutiques

| | Google Play | App Store |
|---|---|---|
| Version publiée | **v1.12 (code 13)** téléversée le 02/08 — 20 852 appareils · **v1.14 prête, à passer par le test interne** | **aucune** |
| Compte développeur | ouvert (personnel, 25 $ une fois) | **non ouvert** (99 $/an) |
| Machine nécessaire | Android Studio — disponible | **Mac + Xcode — non disponible** |
| Projet dans le dépôt | non (`/android` ignoré, régénéré par `cap sync`) | non (`/ios` ignoré) |

**Un seul binaire par boutique couvre tous les formats.** Il n'existe pas de « version
tablette » à part : le même AAB sert téléphones et tablettes Android, le même IPA sert
iPhone et iPad. Seules changent les **captures d'écran** de chaque fiche, et la capacité
de l'interface à s'adapter — ce que le responsive assure déjà.

**Tant que la ligne « Mac » reste à « non disponible », le bureau Livraison doit dire
que le volet iOS est bloqué, et ne pas produire d'instructions Xcode inutiles.** Mettez
cette table à jour le jour où la situation change.

## Le chemin vers la production (compte personnel)

Constaté le 27/07 dans la Play Console : la release du 25 juillet est restée en
**« Brouillon / Non examinée »**, et la fiche affiche encore « Nom temporaire de
l'application : ci.chap.app (unreviewed) ». **Aucune version n'a donc jamais atteint le
moindre testeur.** Ce n'était ni un refus, ni un délai d'examen : le déploiement n'a pas
été lancé.

Le compte développeur étant **personnel**, Google impose avant la production :

**12 testeurs inscrits en continu pendant 14 jours, sur un test FERMÉ.**

Le test interne ne compte pas dans ce quota — il sert seulement à vérifier que
l'application fonctionne. L'ordre est donc : test interne (vérification) → test fermé
(12 testeurs, 14 jours) → demande d'accès à la production.

Les 14 jours ne commencent qu'une fois les 12 testeurs inscrits, et le compteur repart de
zéro si l'un d'eux se désinscrit. **C'est le seul délai du projet que personne ne peut
raccourcir** — d'où la priorité du recrutement des testeurs sur tout le reste.

---

## v1.14 — versionCode 15

| Champ | Valeur |
|---|---|
| Date du build | 2 août 2026, 04h18 |
| Poids de l'AAB | **5,32 Mo** (6,63 avant) |
| minSdk 22 · targetSdk 35 | signature `CN=Chap.ci` — SHA-1 `0E:C0:95:D9:…:FE:33` |
| État Play | construite et signée — **à vérifier en TEST INTERNE avant le test fermé** |

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
