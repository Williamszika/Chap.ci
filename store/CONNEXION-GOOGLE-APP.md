# Connexion Google dans l'application — diagnostic et chantier

Constat du 27/07/2026 : sur le site, « Continuer avec Google » fonctionne. **Dans
l'application Android, le bouton n'apparaît pas du tout** — il ne reste qu'un blanc suivi
d'un séparateur « ou » orphelin, au-dessus du formulaire email.

---

## Ce n'est pas un réglage oublié

Google **interdit délibérément** ses connexions OAuth depuis un navigateur embarqué
(WebView) — la politique est entrée en vigueur le **30 septembre 2021**. La raison est
défendable : une application qui héberge une WebView peut lire ce qui s'y tape, injecter
du script et récupérer les cookies de session. Google refuse donc de laisser passer un
mot de passe dans un conteneur qu'elle ne contrôle pas.

L'application Chap.ci est exactement ce cas : Capacitor sert la page depuis
`https://localhost`, dans une WebView Android. Le script Google Identity Services y est
donc sans effet.

**Conséquence pratique : aucun réglage de la Google Cloud Console ne réparera cela.**
Ajouter `https://localhost` aux origines autorisées ne change rien — ce n'est pas
l'origine qui est refusée, c'est le type de navigateur.

Sources :
- [Google Developers Blog — changements de sécurité pour OAuth 2.0 dans les webviews embarquées](https://developers.googleblog.com/upcoming-security-changes-to-googles-oauth-20-authorization-endpoint-in-embedded-webviews/)
- [Auth0 — Google Blocks OAuth Requests Made Via Embedded Browsers](https://auth0.com/blog/google-blocks-oauth-requests-from-embedded-browsers/)

---

## Ce qui est fait (livré dans le prochain build)

Les boutons Google et Facebook sont **masqués dans l'application native**
(`src/pages/Login.tsx`, `src/pages/Register.tsx`). L'écran de connexion y présente
directement l'email et le mot de passe, sans blanc ni séparateur orphelin. Sur le site,
rien ne change.

Ce n'est pas la solution — c'est le fait d'arrêter de montrer une porte qui n'existe pas.

---

## Ce que coûterait la vraie solution

Il faut une connexion **native** : le téléphone ouvre le sélecteur de comptes d'Android,
hors WebView, et rend un jeton d'identité à l'application.

### 1. Le serveur n'a rien à changer

`POST /api/auth/google` reçoit un jeton d'identité Google et vérifie que son `aud` vaut
notre **identifiant client Web**. Un plugin natif configuré avec ce même identifiant Web
(`serverClientId`) produit un jeton au `aud` identique. **Le backend fonctionne tel quel** —
c'est la bonne nouvelle de ce dossier.

### 2. Le plugin impose une montée de version de Capacitor

Le plugin retenu est [`@capgo/capacitor-social-login`](https://github.com/Cap-go/capacitor-social-login),
successeur de `@codetrix-studio/capacitor-google-auth` (ce dernier est de fait abandonné et
s'appuie sur une bibliothèque GMS en fin de vie).

| Version du plugin | Capacitor | État |
|---|---|---|
| 8.x | 8.x | activement maintenu |
| 7.x | 7.x | maintenu à la demande |
| **6.x** | **6.x** | **abandonné** — une seule publication, en avril 2025 |

Le projet est sur **Capacitor 6**. Rester dessus signifierait installer une version
publiée une fois et jamais corrigée depuis. Faire les choses proprement suppose donc de
**monter Capacitor de 6 à 7 ou 8**, ce qui touche `minSdkVersion` (22 → 23 au minimum,
soit l'abandon d'Android 5.1), la version de Java attendue par Android Studio, et
l'ensemble des plugins `@capacitor/*`.

### 3. Deux identifiants à créer dans la Google Cloud Console

- l'identifiant client **Web** existe déjà (c'est celui de `/api/config`) ;
- il faut en créer un de type **Android**, avec le nom de paquet `ci.chap.app` et
  l'empreinte **SHA-1** du certificat de signature.

⚠️ **L'empreinte SHA-1 n'est pas un secret et ne s'obtient PAS en manipulant le keystore.**
Elle se lit dans la **Play Console → Configuration → Intégrité de l'application**, section
« Certificat de signature d'application ». Comme la signature d'application Play est
active, c'est le certificat de Google qui signe l'APK installé : c'est **son** SHA-1 qu'il
faut déclarer. Ajoutez aussi celui du certificat d'importation, et celui de la clé de
débogage si vous testez depuis Android Studio.

### 4. Une modification native fragile à surveiller

Le plugin demande de modifier `MainActivity.java` pour relayer le résultat du sélecteur de
comptes. Or **`android/` n'est pas dans le dépôt** (`.gitignore`). Tant qu'on se contente
de `cap sync`, la modification survit ; mais le jour où le dossier est régénéré par
`cap add android`, **elle disparaît sans aucun message** et la connexion Google cesse de
fonctionner sans que rien ne l'explique.

À trancher avant de commencer : soit on verse `android/` au dépôt, soit on consigne le
correctif dans un fichier que le bureau Livraison vérifie avant chaque build.

### 5. Un test sur un vrai téléphone est obligatoire

Rien de tout cela ne se vérifie ici : ni SDK Android, ni appareil. Un plugin
d'authentification mal câblé casse **l'écran de connexion entier** — c'est-à-dire la porte
d'entrée de la marketplace.

---

## Recommandation de séquence

**Ne pas mettre ce chantier dans le même build que les correctifs en attente.**

1. **v1.2, maintenant** — photos d'annonces, catégorie Santé, page de suppression de
   compte, corrections d'interface, boutons sociaux masqués dans l'app. Tout est prêt,
   tout est testable, et deux de ces points sont exigés par Google.
2. **v1.3, ensuite** — montée de Capacitor, plugin natif, identifiants Console, test sur
   téléphone. Un build dédié, une chose à la fois.

Ce n'est pas de la prudence de principe : aujourd'hui, l'email et le mot de passe
fonctionnent dans l'application. La connexion Google est un **confort**, pas un verrou.
Retarder la v1.2 pour l'obtenir reviendrait à laisser les utilisateurs sans photos
d'annonces — ce qui, sur une marketplace, est autrement plus grave.
