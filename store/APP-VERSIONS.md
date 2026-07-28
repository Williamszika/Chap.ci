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
| Version publiée | **aucune** — la v1.1 est restée en BROUILLON | **aucune** |
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
