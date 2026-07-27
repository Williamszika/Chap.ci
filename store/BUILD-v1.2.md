# Fiche de build — v1.2 (versionCode 3)

Préparée le 27/07/2026. **Tout ce qui suit est vérifié ; il ne reste qu'à construire.**

> Une fois l'AAB téléversé, reportez la version dans `store/APP-VERSIONS.md` avec son
> commit. C'est ce fichier-là qui sert de repère au bureau Livraison.

---

## Verdict : CONSTRUIRE

Deux conditions sur quatre sont remplies, chacune suffisante à elle seule :

- **(a) confidentialité et interface** — le téléphone du vendeur ne sort plus de l'API
  publique, et les photos d'annonces étaient invisibles dans l'application ;
- **(b) exigence Play Store** — la page publique de suppression de compte, que Google
  réclame et dont un examinateur vérifie la présence **dans l'application**.

**13 commits** touchent l'application depuis la v1.1.

## Numéros à saisir AVANT de lancer le build

| | Valeur |
|---|---|
| versionCode | **3** |
| versionName | **1.2** |

## Ce que les utilisateurs de la v1.1 ne voient pas encore

- **Aucune photo d'annonce** — l'app est un catalogue d'images grises
- La catégorie **Santé & Bien-être**
- La page de **suppression de compte**
- Le **numéro du vendeur** encore exposé par l'API publique
- Les correctifs de lisibilité et le formulaire de publication guidé
- Les boutons sociaux fantômes sur l'écran de connexion

## Notes de version — à coller dans « Nouveautés » (369 caractères / 500)

```
Vos photos d'annonces s'affichent enfin dans l'application.

Nouvelle catégorie Santé & Bien-être : compléments, soins, matériel de bien-être.

Vous pouvez désormais supprimer votre compte depuis l'application.

Publier est plus simple : les champs vous guident et l'erreur est signalée au bon endroit.

Textes et boutons plus lisibles, notamment sur les petits écrans.
```

## Vérifications avant build — toutes passées

| Contrôle | Résultat |
|---|---|
| `appId` = `ci.chap.app` | OK |
| Aucune clé `server.url` dans capacitor.config.ts | OK |
| `SITE_ORIGIN` = `https://chap.ci` | OK |
| `mediaUrl()` appliquée (9 fichiers) | OK |
| Garde `if (isNative) return` dans marketing.ts | OK |
| `backButton` et `StatusBar` dans NativeShell | OK |
| `android-slim.mjs` chaîné dans cap:sync et cap:android | OK |
| Plugins `@capacitor/*` : 8 attendus, 8 présents, aucun nouveau | OK |
| `npm run lint` | OK |
| `npm run build` | OK |
| `npx cap sync android` puis android-slim | OK — **35,0 Mo → 6,7 Mo** |

Le poids attendu de l'AAB est donc bien dans la fourchette 6–7 Mo.

## Captures à remplacer sur la fiche Play

Quatre écrans sur cinq ont changé (catégorie Santé, correctifs de l'Atelier) :

| Écran | À refaire ? |
|---|---|
| accueil | **oui** — la grille de catégories a changé |
| explorer | **oui** — idem |
| annonce | **oui** — ListingDetail retouché |
| vendeur | **oui** — Profile retouché |
| aide | non — inchangée |

À refaire dans les trois formats : `telephone-*` (1080×1920), `tablette7-*` et
`tablette10-*` (1920×1080). Les fichiers actuels sont dans `store/captures/`.

## Marche à suivre

```
npm ci
npm run cap:sync
```

Puis dans **Android Studio** :

1. Renseignez **versionCode 3** et **versionName 1.2**.
2. `Build → Generate Signed Bundle / APK → Android App Bundle`, avec votre clé de
   signature habituelle.
3. Vérifiez le poids de l'AAB : **6 à 7 Mo**. **Au-delà de 10 Mo, ne téléversez pas** —
   cela signifie qu'`android-slim.mjs` n'a pas tourné.

Puis dans la **Play Console** :

4. Test interne → **Créer une version** → téléverser l'AAB.
5. Coller les notes de version ci-dessus.
6. Remplacer les quatre captures périmées, dans les trois formats.
7. **Envoyer pour examen.**

Enfin, mettez `store/APP-VERSIONS.md` à jour : v1.2, versionCode 3, le commit construit,
la date et le poids réel de l'AAB.

## Ce qui n'est PAS dans cette version, et c'est voulu

La **connexion Google native** dans l'application. Google refuse ses connexions OAuth
depuis une WebView ; la réparer impose de monter Capacitor de 6 à 7 ou 8 et d'ajouter un
plugin natif, qui ne se teste que sur un vrai téléphone. Ce sera la **v1.3**. Le dossier
complet est dans `store/CONNEXION-GOOGLE-APP.md`.

En attendant, l'email et le mot de passe fonctionnent dans l'application, et les boutons
sociaux fantômes y sont désormais masqués.
