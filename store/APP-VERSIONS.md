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
| Version publiée | v1.1 (versionCode 2) | **aucune** |
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

---

## v1.1 — versionCode 2

| Champ | Valeur |
|---|---|
| **Commit** | `b7868ec` |
| Date du build | 25 juillet 2026 |
| Poids de l'AAB | 6,4 Mo |
| minSdk | 22 (Android 5.1) |
| targetSdk | 35 |
| État Play | test interne — jamais passée en test fermé ni en production |

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
