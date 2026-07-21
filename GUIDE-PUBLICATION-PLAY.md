# Chap.ci — Publier sur Google Play (compte perso, pas à pas) 🤖

Ce guide te mène de zéro à l'app **en ligne sur le Play Store**, avec un
**compte personnel** (25 $ une fois). Tout le projet Android est déjà prêt
dans le dépôt (`android/`, icônes, splash). Il te reste 3 choses : **installer
Android Studio**, **générer l'AAB signé**, **remplir la fiche Play**.

> ⚠️ Compte **personnel** neuf : depuis 2023, Google impose un **test fermé**
> avant la production — **au moins 12 testeurs** qui restent inscrits **14 jours**.
> C'est incontournable. Un compte **organisation/entreprise** évite cette étape
> (mais demande une vérification D-U-N-S). On part sur le compte perso.

---

## Étape 0 — Créer le compte Play Console (1 fois)
1. Va sur **play.google.com/console** → « Créer un compte » → **Personnel**.
2. Paie les **25 $** (une seule fois, à vie).
3. Vérifie ton identité (pièce d'identité). La validation peut prendre 1–2 jours.

Pendant l'attente, tu peux déjà préparer l'AAB (étapes 1–2).

---

## Étape 1 — Installer les outils (sur ton ordinateur)
- **Node.js 18+** + le dépôt cloné, puis `npm install`.
- **Android Studio** : https://developer.android.com/studio
  (il installe le SDK + le JDK ; laisse-le télécharger ce qu'il propose).

---

## Étape 2 — Générer l'AAB signé (le fichier à publier)

### A. Construire et synchroniser
```bash
npm install
npm run build            # génère dist/ (l'app web à jour)
npx cap sync android     # copie le web + plugins natifs dans android/
npm run cap:android      # ouvre le projet dans Android Studio
```

### B. Créer le keystore (clé de signature) — À GARDER PRÉCIEUSEMENT
Dans Android Studio : **Build → Generate Signed Bundle / APK → Android App Bundle → Next**.
- Clique **Create new…** pour le keystore :
  - Chemin : ex. `chapci-release.jks` (range-le dans un dossier sûr, PAS dans le dépôt Git)
  - Mots de passe (keystore + clé) : note-les dans ton gestionnaire de mots de passe
  - Alias : `chapci`
  - Validité : 25+ ans ; renseigne ton nom / organisation
- ⚠️ **Sauvegarde ce fichier `.jks` + les mots de passe.** Perdu = tu ne pourras
  **plus jamais** mettre à jour l'app sous ce nom. Fais-en 2 copies (cloud privé + disque).

### C. Produire le fichier
- Sélectionne **release** → **Finish**.
- Android Studio génère : `android/app/release/app-release.aab` → **c'est ton AAB**.

> Mise à jour plus tard : augmente `versionCode` (2, 3, …) et `versionName`
> dans `android/app/build.gradle`, refais `npm run build && npx cap sync`, puis
> regénère l'AAB **avec le même keystore**.

---

## Étape 3 — Créer l'application dans la Play Console
1. **Créer une application** → Nom : **Chap.ci** · Langue par défaut : **Français**
   · Type : **Application** · Gratuite.
2. Accepte les déclarations (règles du programme, lois export US).

### Fiche du Play Store (onglet « Présence sur le Store »)
Colle les textes fournis dans **`STORE-LISTING.txt`** (livré avec ce guide) :
- **Nom** : Chap.ci
- **Description courte** (≤ 80 caractères)
- **Description complète** (≤ 4000 caractères)

Ressources graphiques (fournies dans le dossier `store/` livré) :
- **Icône** 512×512 (PNG) — depuis `assets/icon.png`
- **Image de la bannière (feature graphic)** 1024×500 → `store/feature-graphic-1024x500.png`
- **Captures d'écran téléphone** (min. 2, format portrait) → `store/01-…png` etc.

### Formulaires obligatoires (menu « Contenu de l'application »)
- **Politique de confidentialité** : `https://chap.ci/#/confidentialite`
- **Sécurité des données** : déclare ce que l'app collecte :
  - Compte : e-mail, nom (pour créer le compte) — chiffré en transit, suppression possible.
  - Localisation approximative : pour les annonces proches (facultatif, à la demande).
  - Photos : ajoutées par l'utilisateur à ses annonces.
  - Pas de partage à des tiers publicitaires.
- **Classification du contenu** : remplis le questionnaire → catégorie « **Shopping** ».
- **Public cible** : 18+ (petites annonces, transactions).
- **Annonce/pub** : l'app peut afficher des espaces publicitaires internes (écran pub).

---

## Étape 4 — Le TEST FERMÉ obligatoire (compte perso)
1. Menu **Tests → Test fermé** → **Créer une release**.
2. Téléverse ton **`app-release.aab`**.
3. Crée une **liste de testeurs** : ajoute **au moins 12 adresses Gmail**
   (amis, famille, collègues). Ils doivent **accepter l'invitation** et
   **installer l'app** via le lien de test.
4. Le test doit durer **14 jours** avec ces 12 testeurs actifs (garde-les inscrits).
5. Passé ce délai, un bouton propose de **passer en production**.

> Astuce : mobilise 12 personnes de confiance dès maintenant (WhatsApp), envoie-leur
> le lien d'opt-in, demande-leur d'installer et de laisser l'app installée 2 semaines.

---

## Étape 5 — Production 🚀
1. Menu **Production → Créer une release** → réutilise le même AAB (ou une version +1).
2. Renseigne les **notes de version** (ex. « Première version de Chap.ci 🇨🇮 »).
3. **Envoyer pour examen**. La revue Google prend en général **quelques jours**.
4. Une fois approuvée, l'app est **publique** sur le Play Store 🎉

---

## Checklist finale
- [ ] Compte Play Console créé + vérifié (25 $)
- [ ] `npm run build && npx cap sync android` sans erreur
- [ ] Keystore `.jks` créé + **sauvegardé** (2 copies) + mots de passe notés
- [ ] `app-release.aab` généré
- [ ] Fiche remplie (nom, descriptions, icône 512, bannière 1024×500, 2+ captures)
- [ ] Politique de confidentialité + Sécurité des données + Classification remplis
- [ ] 12+ testeurs invités → test fermé lancé (14 jours)
- [ ] Passage en production → envoyé pour examen
