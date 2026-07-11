# Chap.ci — Activer la connexion Google (Gmail) et Apple

> Le **code est déjà prêt** : les boutons « Continuer avec Google / Apple » existent
> et appellent Supabase. Il ne reste qu'à **activer les fournisseurs** dans Supabase
> et à créer les identifiants côté Google / Apple. Aucun code à modifier.

## Valeurs de ton projet (à copier-coller)

| Élément | Valeur |
|---|---|
| **URL de callback Supabase** | `https://rkrppimebpufinooshdu.supabase.co/auth/v1/callback` |
| **Origine JavaScript (ton site)** | `https://williamszika.github.io` |
| **Site URL (Supabase)** | `https://williamszika.github.io/Chap.ci/` |
| **Redirect URLs (Supabase)** | `https://williamszika.github.io/Chap.ci/**` |

---

## 0. D'abord (une seule fois) — régler les URL dans Supabase

1. Ouvre **https://supabase.com/dashboard** → ton projet **Chap.ci**.
2. Menu **Authentication** → **URL Configuration**.
3. **Site URL** : `https://williamszika.github.io/Chap.ci/`
4. **Redirect URLs** → *Add URL* : `https://williamszika.github.io/Chap.ci/**`
5. **Save**.

Sans ça, après la connexion Google/Apple l'utilisateur ne serait pas renvoyé vers l'app.

---

## 1. GOOGLE (Gmail) — gratuit, ~10 minutes ✅

### A. Google Cloud Console — créer l'identifiant OAuth

1. Va sur **https://console.cloud.google.com**.
2. En haut, **crée un projet** (ou sélectionne-en un). Nom : `Chap.ci`.
3. Menu ☰ → **APIs & Services** → **OAuth consent screen** (écran de consentement) :
   - **User Type : External** → *Create*.
   - **App name** : `Chap.ci` · **User support email** : ton email.
   - **Authorized domains** (facultatif au début) : tu peux laisser vide en mode test.
   - **Developer contact** : ton email → *Save and continue*.
   - **Scopes** : laisse par défaut (`email`, `profile`, `openid`) → *Save*.
   - **Test users** : ajoute ton adresse Gmail pour tester → *Save*.
   - > Ces scopes ne sont **pas sensibles** → tu peux plus tard cliquer **Publish app**
   >   pour ouvrir à tout le monde, **sans validation** de Google.
4. Menu → **APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth client ID** :
   - **Application type : Web application**.
   - **Name** : `Chap.ci Web`.
   - **Authorized JavaScript origins** → *Add URI* :
     - `https://williamszika.github.io`
   - **Authorized redirect URIs** → *Add URI* :
     - `https://rkrppimebpufinooshdu.supabase.co/auth/v1/callback`
   - **Create**.
5. Une fenêtre affiche le **Client ID** et le **Client Secret** → **copie les deux**.

### B. Supabase — activer Google

1. **Authentication** → **Providers** (Sign In / Providers) → **Google**.
2. Active **Enable Sign in with Google**.
3. **Client ID (for OAuth)** : colle le *Client ID*.
4. **Client Secret (for OAuth)** : colle le *Client Secret*.
5. **Save**.

### C. Tester

- Ouvre l'app → **Se connecter** → **Continuer avec Google**.
- Choisis ton compte → tu reviens connecté dans l'app. ✅
- (En mode « Testing », seuls les comptes ajoutés en *Test users* fonctionnent.)

---

## 2. APPLE — payant + plus complexe ⚠️

**Prérequis :** un compte **Apple Developer Program** (**99 $/an**).
À faire de préférence **après** avoir acheté le domaine `chap.ci` (voir la note plus bas).

### A. Apple Developer — https://developer.apple.com/account

1. **Certificates, Identifiers & Profiles** → **Identifiers** → **+** → **App IDs** → **App** :
   - Description : `Chap.ci` · Bundle ID (Explicit) : `ci.chap.app`.
   - Coche **Sign In with Apple** → *Continue* → *Register*.
2. **Identifiers** → **+** → **Services IDs** :
   - Description : `Chap.ci Web` · Identifier : `ci.chap.web`
     *(c'est ce « Services ID » qui sert de **Client ID** côté web)*.
   - Coche **Sign In with Apple** → **Configure** :
     - **Primary App ID** : `ci.chap.app`.
     - **Domains and Subdomains** : `rkrppimebpufinooshdu.supabase.co`
     - **Return URLs** : `https://rkrppimebpufinooshdu.supabase.co/auth/v1/callback`
   - *Save* → *Continue* → *Register*.
3. **Keys** → **+** :
   - Name : `Chap.ci SignIn` · coche **Sign In with Apple** → *Configure* → Primary App ID → *Save*.
   - *Continue* → *Register* → **Download** le fichier **`.p8`** (téléchargeable **une seule fois**).
   - Note le **Key ID** (10 caractères) et ton **Team ID** (en haut à droite du compte).

### B. Générer le « Client Secret » (jeton JWT signé)

Apple n'utilise pas un simple secret mais un **JWT** signé avec la clé `.p8`
(valide **6 mois max**). Utilise un générateur (ex. la doc Supabase « Login with Apple »
fournit un script Node). Tu as besoin de : **Team ID**, **Key ID**, **Services ID**
(`ci.chap.web`) et le fichier **`.p8`**.

### C. Supabase — activer Apple

1. **Authentication** → **Providers** → **Apple** → **Enable**.
2. **Client IDs** : `ci.chap.web` (le Services ID).
3. **Secret Key (for OAuth)** : colle le **JWT** généré.
4. **Save**, puis teste **Continuer avec Apple**.

> ⚠️ **Limite du domaine `github.io`.** « Sign in with Apple » exige de prouver la
> propriété du domaine. Comme ton app est sur un **sous-dossier** de `github.io`
> (que tu ne contrôles pas à la racine), Apple est **bien plus simple une fois que tu
> possèdes `chap.ci`**. Google, lui, fonctionne dès maintenant car la redirection
> passe par le domaine Supabase.

---

## Ordre conseillé

1. **Maintenant** : configure **Google** (gratuit, marche sur l'URL actuelle).
2. **Plus tard** : achète **`chap.ci`**, puis fais **Apple** (compte payant requis).

Rien à changer dans le code : dès que le fournisseur est activé dans Supabase,
le bouton correspondant fonctionne.
