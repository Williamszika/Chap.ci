# 📱 Publier Chap.ci sur Google Play — guide pas à pas

Tout est prêt côté code : le projet **Android** est généré (`android/`), les icônes et
l'écran de démarrage aussi, et les visuels de la fiche sont fournis (dossier
`marketing/store/`). Il te reste : **créer le compte**, **construire l'app signée**,
**remplir la fiche**, **soumettre**. Compte ~1 à 2 h la première fois.

> Tu as un **Mac** → on utilise **Android Studio** (le plus simple, avec assistant graphique).

---

## Étape 1 — Créer le compte Google Play Console (25 $, une seule fois)

1. Va sur **https://play.google.com/console** → connecte-toi avec un compte Google.
2. Choisis un compte **« Développeur individuel »** (ou « organisation » si tu as une entreprise).
3. Paie les **25 $** (une fois, à vie).
4. Vérifie ton identité (pièce d'identité) — Google le demande maintenant. Peut prendre 1-2 jours.

---

## Étape 2 — Installer les outils sur ton Mac

1. **Android Studio** : https://developer.android.com/studio (inclut le SDK + le JDK).
2. Récupère et prépare le projet (le dossier `android/` se régénère — il n'est pas
   dans le dépôt car il est reconstruit à l'identique depuis la config) :
   ```bash
   git pull
   npm install
   npm run build
   npx cap add android      # crée le dossier android/ (la 1ʳᵉ fois seulement)
   npm run assets           # génère les icônes + l'écran de démarrage
   npx cap sync android     # copie le web + les plugins dans android/
   ```
3. Ouvre le projet Android dans Android Studio :
   ```bash
   npm run cap:android
   ```

---

## Étape 3 — Construire l'app signée (AAB) avec Android Studio

Google Play veut un fichier **`.aab`** (Android App Bundle) **signé**.

1. Dans Android Studio : menu **Build → Generate Signed Bundle / APK…**
2. Choisis **Android App Bundle** → *Next*.
3. **Créer la clé de signature** (la 1ʳᵉ fois) → *Create new…* :
   - **Key store path** : choisis un endroit sûr, ex. `~/chapci-upload-key.jks`
   - **Password** (keystore) + **Password** (key) : mets des mots de passe forts.
   - Alias : `chapci`
   - Validity : **25 ans** (minimum exigé par Google).
   - Remplis nom / organisation (peu importe le détail).
   - **⚠️ ULTRA IMPORTANT** : **sauvegarde ce fichier `.jks` ET ses mots de passe** dans un
     endroit sûr (cloud privé + copie). **Si tu les perds, tu ne pourras plus jamais mettre
     à jour ton app.** (Astuce : active **Play App Signing** à l'étape 5 — Google garde alors
     la clé maître, et ta clé `.jks` devient juste une « clé d'upload » réinitialisable.)
4. *Next* → choisis la variante **release** → *Finish*.
5. Android Studio produit le fichier, ex. :
   `android/app/release/app-release.aab` → c'est **lui** que tu enverras à Google Play.

> **En ligne de commande** (alternative) :
> ```bash
> cd android && ./gradlew bundleRelease
> # AAB dans android/app/build/outputs/bundle/release/app-release.aab
> # (nécessite d'avoir configuré la signature — l'assistant Android Studio est plus simple)
> ```

---

## Étape 4 — Créer l'application dans la Play Console

1. Play Console → **Créer une application**.
2. Nom : **Chap.ci** · Langue par défaut : **Français** · Type : **Application** · **Gratuite**.
3. Accepte les déclarations.

---

## Étape 5 — Remplir la fiche (les textes sont prêts ci-dessous)

Dans **Croissance → Présence sur le Play Store → Fiche principale du Store** :

**Nom de l'application** (30 car. max)
```
Chap.ci — Petites annonces
```

**Description courte** (80 car. max)
```
Achète et vends chap-chap partout en Côte d'Ivoire. Gratuit et près de toi.
```

**Description complète** (voir le texte prêt dans `marketing/store/description-play.txt`)

**Éléments graphiques** (dans `marketing/store/`) :
- **Icône** : 512×512 → utilise `assets/icon.png` (ou l'export 512 de Play).
- **Bannière (feature graphic)** : `store-feature-graphic.png` (1024×500).
- **Captures téléphone** (min. 2, idéal 4-8) : `store-1-accueil.png`, `store-2-annonces.png`,
  `store-3-fiche.png`, `store-4-explorer.png`.

---

## Étape 6 — Les questionnaires obligatoires

- **Politique de confidentialité** (URL) :
  ```
  https://chap.ci/#/confidentialite
  ```
- **Sécurité des données** : déclare que l'app collecte **email, téléphone, nom, position**
  (pour le compte et la géolocalisation des annonces), que les données sont **chiffrées en
  transit**, et que l'utilisateur peut **supprimer son compte** (l'app le permet). Aucune
  vente de données à des tiers.
- **Classification du contenu** : remplis le questionnaire → l'app est **« Tout public »**
  (petites annonces, pas de contenu sensible).
- **Public cible** : adultes (18+) recommandé (transactions entre particuliers).
- **Catégorie** : **Shopping** (ou « Style de vie »).
- **Coordonnées** : email **contact@chap.ci**.

---

## Étape 7 — Publier

1. **Production → Créer une release** → **téléverse le `.aab`**.
2. Note de version (ex. « Première version 🎉 »).
3. Vérifie qu'il n'y a **pas d'erreur bloquante** (Play te liste ce qui manque).
4. **Envoyer pour examen**. Délai : ~**1 à 3 jours** en général.

> **Conseil** : fais d'abord un **test interne** (onglet *Tests → Test interne*) pour installer
> l'app sur ton propre téléphone et vérifier que tout marche, **avant** de passer en Production.

---

## À chaque mise à jour ensuite
```bash
git pull && npm install
# augmente versionCode/versionName dans android/app/build.gradle
npm run build && npx cap sync android
# Build → Generate Signed Bundle (même clé .jks) → upload le nouvel .aab
```

## ⏭️ Et pour l'App Store (iPhone) ?
Tu as un Mac → une fois Play en ligne, on fera l'iOS : `npx cap add ios`, Xcode, compte
Apple Developer (99 $/an). Dis-le-moi quand tu veux, je te fais le même guide.
