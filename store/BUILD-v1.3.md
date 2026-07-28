# 🔨 Livraison v1.3 — passe du Monteur, 28 juillet 2026

Construite dans l'environnement de session (SDK Android, Gradle et keystore présents),
à partir du commit `f5e15a7`.

---

## Verdict : CONSTRUIRE

Deux conditions de la routine sont remplies, et la première suffirait seule.

**(a) Une correction touche l'interface, et elle est grave.** Dans l'application, la
**grande photo d'une annonce ne s'affichait pas** — seules les miniatures apparaissaient.
Sur une place de marché d'occasion, c'est le cœur du produit : on n'achète pas ce qu'on ne
voit pas. Quatre autres écrans souffraient du même défaut (photo du vendeur, avatar du
compte, vignette d'une commande, et les photos déjà en ligne quand un vendeur **modifie**
son annonce).

**(c) Cinq fonctionnalités visibles se sont accumulées** depuis la v1.2 : visionneuse
plein écran avec balayage, pied de page réduit dans l'application, « Mes publicités »
dans le compte, cadrage des visuels publicitaires, et le cycle de vie complet des
publicités.

Le verdict vaut pour les deux boutiques — c'est le même code.

---

## Ce que les utilisateurs de l'application ne voient pas encore

C'est la liste qui dit le coût de l'attente. Aucun testeur n'a jamais reçu la v1.2 : ce
qui suit couvre donc **tout l'écart depuis la v1.0**.

| | |
|---|---|
| Photos d'annonces | **absentes** dans l'application (v1.2, jamais distribuée) |
| Grande photo + plein écran + balayage | v1.3 |
| Catégorie Santé & Bien-être | v1.2 |
| Page de suppression de compte (exigée par Google) | v1.2 |
| Téléphone du vendeur retiré de l'API publique | v1.2 |
| « Mes publicités » (audience, coût, prolongation) | v1.3 |

---

## Numéros de version

| | Android | iOS |
|---|---|---|
| Identifiant de build | `versionCode` **4** | `CFBundleVersion` **4** |
| Numéro affiché | `versionName` **1.3** | `CFBundleShortVersionString` **1.3** |

Le `versionCode` ne recule jamais et ne saute pas de numéro : Google refuse un numéro déjà
utilisé. Les deux boutiques gardent le même numéro affiché — sans cela, un utilisateur qui
signale un bug devient impossible à situer.

---

## Notes de version

### Google Play — « Nouveautés » · **418 / 500 caractères**

```
Vos photos s'affichent enfin en entier.

• Touchez une photo d'annonce : elle s'ouvre en plein écran. Balayez vers la gauche ou la droite pour voir les suivantes.
• La grande photo, celle du vendeur et votre photo de profil ne restent plus vides.
• Vos photos déjà en ligne réapparaissent quand vous modifiez une annonce.
• Publicité : suivez vos affichages et vos clics depuis votre compte, et prolongez sans coupure.
```

### App Store — « Nouveautés de cette version »

```
Vos photos s'affichent enfin en entier.

• Touchez une photo d'annonce : elle s'ouvre en plein écran. Balayez vers la gauche ou la droite pour passer à la suivante, comme dans votre galerie.
• La grande photo d'une annonce, la photo du vendeur et votre photo de profil ne restent plus vides.
• Vos photos déjà en ligne réapparaissent quand vous modifiez une annonce.
• Annonceurs : suivez vos affichages et vos clics depuis votre compte, et prolongez votre bannière sans coupure d'affichage.
```

---

## Vérifications avant build

| Point | Résultat |
|---|---|
| `capacitor.config.ts` — appId | `ci.chap.app` ✅ |
| `capacitor.config.ts` — clé `server.url` | **absente** ✅ (seul `androidScheme: 'https'`) |
| `src/lib/native.ts` — `SITE_ORIGIN` | `https://chap.ci` ✅ |
| `mediaUrl()` sur les photos d'annonces | ✅ — **c'est précisément l'objet de cette version** |
| `src/lib/marketing.ts` — garde `if (isNative) return` | intacte ✅ |
| `NativeShell.tsx` — `backButton` + StatusBar | présents ✅ |
| `cap:sync` / `cap:android` chaînent `android-slim.mjs` | ✅ |
| Plugins `@capacitor/*` | les 8 attendus, **aucun nouveau** ✅ |
| `npm run build` | passe, sans erreur TypeScript ✅ |
| Allègement | 35,0 Mo → **6,8 Mo** (−28,2 Mo) ✅ |
| Poids de l'AAB | **6,6 Mo** ✅ (alerte au-delà de 10 Mo) |
| Signature | `CN=Chap.ci, L=Abidjan, C=CI` — SHA-1 `0E:C0:95:D9:…:FE:33` ✅ |
| `jarsigner -verify` | *jar verified* ✅ |

---

## Captures d'écran

**Refaites** (l'écran a visiblement changé — bouton « Voir en grand » et repères de
position sur la galerie) :

- `telephone-02-annonce.png`
- `tablette7-02-annonce.png`
- `tablette10-02-annonce.png`

**Inchangées, à conserver :** accueil, explorer, vendeur, aide. Les refaire ne servirait
à rien — la règle est de ne remplacer que ce qui a bougé.

Pour l'App Store, Apple modifie régulièrement les tailles exigées : **lisez-les dans App
Store Connect le jour du dépôt**. L'ordre de grandeur (iPhone ~1290×2796, iPad ~2048×2732)
est donné **à confirmer**, pas comme une consigne.

---

## Marche à suivre — Google Play

L'AAB est **déjà construit et signé** : `chapci-v1.3-versionCode4.aab` (6,6 Mo).

1. Play Console → **Test interne** → *Créer une version*
2. Téléverser `chapci-v1.3-versionCode4.aab`
3. Coller les notes de version ci-dessus
4. Remplacer les **trois** captures « annonce » (téléphone, tablette 7, tablette 10)
5. *Enregistrer* → *Vérifier la version* → **Envoyer pour examen**

> ⚠️ L'étape 5 est celle qui a été oubliée pour la v1.1 : la release était restée en
> « Brouillon », et **aucun testeur n'a jamais rien reçu**. Tant que le bouton d'envoi
> n'est pas pressé, rien ne part.

Puis, et c'est le vrai chemin critique : **Test fermé** → promouvoir cette version →
**12 testeurs pendant 14 jours consécutifs**. Le test interne ne compte pas dans ce quota.

## Marche à suivre — iOS / App Store

**Bloqué** : la table de `APP-VERSIONS.md` indique « Mac + Xcode — non disponible ».
Débloquer suppose un Mac avec Xcode et un compte Apple Developer à 99 $/an. Aucune
instruction Xcode n'est écrite ici : elle ne servirait à personne cette semaine.
