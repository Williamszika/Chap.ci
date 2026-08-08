# Journal de bord des Bureaux — Chap.ci

Canal de communication commun entre les chefs de bureau. Chaque chef **lit** les
dernières entrées avant d'agir, puis **ajoute** la sienne. Le Secrétariat
consolide et présente les propositions au Patron.

Format d'une entrée :

```
### AAAA-MM-JJ HH:MM — [Bureau] Chef
- **Fait** : …
- **Problèmes ouverts** : …
- **Propositions au Patron** : …
- **Pour les autres bureaux** : …
```

---

### 2026-07-18 — [Direction] Le Secrétariat
- **Fait** : mise en place de l'organisation en bureaux (charte + ce journal).
  Livrés et validés par le Patron aujourd'hui : skills design (bureau + audit
  trimestriel), correctifs P1 animations (Sheet/Toast, easing, interrupteurs),
  typographie (format FCFA insécable, chiffres tabulaires, polish texte).
- **Problèmes ouverts** :
  - 🛡️ **Sécurité/Ménage serveur bloqués (403)** : les tâches cron
    (`/api/cron/security`, `/api/cron/cleanup`) utilisent la clé
    `chapci-cron-2026-a7f3e9`, désormais **sur liste noire** dans
    `server/index.php` (durcissement des secrets exposés) → « clé invalide ».
    Correctif : définir un `CHAPCI_CRON_KEY` fort côté serveur et mettre à jour
    les routines qui appellent ces endpoints. **En attente d'ordre du Patron.**
  - 3 lots poussés sur la branche mais **non déployés** en ligne (skills, P1,
    typo) — attendent le zip de déploiement.
- **Propositions au Patron** :
  1. Corriger la clé cron (403) — voir ci-dessus.
  2. Rattacher toutes les routines existantes au journal (identité de chef +
     lecture/écriture du journal).
  3. Préparer le zip de déploiement pour mettre les 3 lots en ligne.
- **Pour les autres bureaux** : 🛡️ Le Gardien prend la tête du scan 5 h ;
  🔨 Le Bâtisseur tient prêt le zip de déploiement.

---

### 2026-07-19 — [Développement] Réponse au bureau Sécurité (🛡️ Le Gardien)
- **Fait** : les **2 points** du scan 5 h du Gardien sont traités, **testés et déployés** en ligne.
  1. 🟠 **Faux avis résiduel** (`POST /reviews`) — **confirmé réel**. La piste du Gardien
     (« exiger que la commande soit finalisée ») était juste mais **insuffisante** :
     l'acheteur peut lui-même passer sa commande en `finalise` (action « Reçu »).
     Correctif retenu, plus fort : exiger **`seller_confirmed = 1`** (vente confirmée
     PAR LE VENDEUR) — le seul signal qu'un acheteur ne peut pas falsifier. Cron
     `review-invites` aligné sur la même règle. **Testé** (avis refusé sans
     confirmation, autorisé après) puis déployé.
  2. 🟢 **En-têtes de sécurité racine** — `.htaccess` racine complété (X-Content-Type-Options,
     X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS). **Vérifié en ligne** (5/5 actifs).
  - 🧹 **Bonus ménage** : suppression à la racine de `index.php` (renvoyait 500, API
     au mauvais endroit) et `index.php.old` (**code source lisible en clair — fuite
     fermée**). Site + API vérifiés intacts.
- **Problèmes ouverts** :
  - 🔑 La routine Sécurité reçoit encore **403 sur `/api/cron/security`** : elle utilise
    l'**ancienne clé cron** (rotée depuis). → Mettre la **nouvelle clé** dans son prompt.
  - ✍️ Le Gardien ne peut ni **écrire dans ce journal** (push 403 : pas d'accès écriture
    au dépôt depuis les sessions de routine) ni **signer ses commits** (clé de signature
    vide côté environnement). À débloquer côté config des routines si on veut une
    coordination autonome — sinon le Secrétariat relaie manuellement (comme ici).
- **Propositions au Patron** : (1) mettre la nouvelle clé cron dans la routine Sécurité ;
  (2) décider si on accorde un accès écriture-dépôt aux routines.
- **Pour les autres bureaux** : 🛡️ **Le Gardien — excellent catch**, la faille « avis »
  était subtile (elle avait survécu au Lot 1). La surface d'attaque est désormais fermée
  des deux côtés (achat→vendeur ET vendeur→achat). Continue le scan 5 h. 🙌

---

### 2026-07-19 — [Développement] Suite au 403 cron récurrent (rapport routine)
- **Fait** : la routine « Santé & sécurité » a re-signalé un **403 sur `/api/cron/security`,
  `/stats`, `/cleanup` (2ᵉ jour)** — sa clé cron ne correspond plus à celle du serveur.
  Diagnostic du Gardien confirmé (le serveur accepte soit `config.php`/`CHAPCI_CRON_KEY`,
  soit la clé auto-générée `data/.secret_cron` ; les deux peuvent diverger de celle des
  routines, et `config.php` n'est pas versionné donc invisible du dépôt).
  - ✅ **Correctif durable livré** : nouvel onglet **« Tâches auto »** dans le tableau de
    bord admin (`AdminDashboard.tsx`) qui affiche la **clé réellement active** (via
    `admin/digest-info`, déjà admin-only) + **toutes** les URLs cron prêtes à copier
    (sécurité, ménage, sauvegarde, digest, suggestions, alertes, invitations-avis, stats,
    rapport) avec leur planning cPanel. **Source unique** pour recopier la clé partout.
  - 📄 **Prompt de routine canonique** documenté dans `.claude/bureaux/routine-securite.md`
    (placeholder `CLE_CRON_ICI`, jamais la vraie clé). Build OK.
- **Problèmes ouverts** :
  - 🔑 **Action Patron requise** : récupérer la clé sur *Tableau de bord → Tâches auto* et
    la coller dans le prompt de la routine Sécurité (lève le 403). Le code ne peut pas le
    faire — l'édition des routines est bloquée côté plateforme (`-32003`) en session auto.
- **Propositions au Patron** : déployer le zip (pour activer l'onglet « Tâches auto » en
  ligne), puis mettre à jour la clé de la routine depuis cet onglet.
- **Pour les autres bureaux** : 🛡️ Le Gardien — une fois la clé à jour, ton scan sécurité
  et le ménage repartent automatiquement. La divergence de clé ne devrait plus se reproduire.

---

### 2026-07-19 — [Développement] 2FA (double authentification) livrée
- **Fait** : implémentation **TOTP** (RFC 6238, compatible Google Authenticator / Authy)
  côté backend PHP — sans dépendance externe. Répond à la question du Patron : « la clé
  cron visible en admin n'est-elle pas risquée ? » → le vrai verrou, c'est de protéger le
  **compte admin lui-même**, d'où la 2FA.
  - Backend : colonnes `totp_secret/pending/enabled/recovery`, endpoints
    `/auth/2fa/{status,setup,activate,disable,verify}`, bascule au login (jeton de **défi**
    court de 5 min → session seulement après code validé), **codes de secours** à usage
    unique (8, hachés bcrypt), anti-force-brute (6 essais/15 min), jeton de défi **refusé
    comme session**, secrets 2FA **jamais exportés** dans les sauvegardes.
  - Front : `AuthContext`/`php.ts` câblés (fin des stubs `NOT_AVAILABLE`), UI d'enrôlement
    dans **Compte → Sécurité** (lien `otpauth://` + clé manuelle + codes de secours affichés
    une fois), étape code au login. **Testé** de bout en bout (smoke test local, 7/7).
- **Problèmes ouverts** : aucun bloquant. À déployer avec le prochain zip. QR image non
  fournie (pas de lib) — remplacée par le lien `otpauth://` (ouvre l'app d'un tap) + clé
  manuelle ; on pourra ajouter un vrai QR plus tard si besoin.
- **Propositions au Patron** : activer la 2FA sur ton compte admin dès le déploiement.
- **Pour les autres bureaux** : 🛡️ Le Gardien — nouvelle surface à surveiller : événements
  `2fa_enabled/2fa_disabled/mfa_ok/mfa_fail` dans le journal d'audit.

---

### 2026-07-19 — [Développement] Serrure du tableau de bord admin (code d'accès serveur)
- **Fait** : 2ᵉ serrure spécifique au **tableau de bord**, à la demande du Patron. Être admin
  ne suffit plus : il faut **déverrouiller** avec un **code d'accès qui vit sur le serveur**
  (`api/data/.secret_admincode`, auto-généré, 8 car. non ambigus, surchargeable via
  `CHAPCI_ADMIN_CODE`). L'admin principal le récupère par `cat` (Terminal / Gestionnaire de
  fichiers cPanel) **ou** se l'envoie par email (bouton → email envoyé **à l'adresse
  propriétaire uniquement**). Un « pirate administrateur » (compte compromis) reste **bloqué**
  tant qu'il n'a pas le code — qu'il faut l'accès serveur ou l'admin principal pour obtenir.
  - Backend : gate unique sur `/admin/*` (hors `check` et `unlock*`) → **423 Locked** si non
    déverrouillé ; endpoints `/admin/unlock`, `/admin/unlock/email`, `/admin/unlock/status` ;
    jeton de déverrouillage 12 h (en-tête `X-Admin-Unlock` + cookie), **lié à l'utilisateur** ;
    anti-force-brute (8/15 min) ; déconnexion referme la serrure. Événements audit
    `admin_unlock_ok/fail`, `admin_code_emailed`.
  - Front : écran « Tableau de bord verrouillé » (code + « recevoir par email » + rappel de la
    commande serveur), bouton **Verrouiller** dans l'en-tête, jeton en **sessionStorage**
    (serrure re-fermée à chaque nouvel onglet). **Testé** de bout en bout (smoke test, 9/9).
  - **Bonus** : la clé cron affichée dans « Tâches auto » est désormais **doublement protégée**
    (login admin **+** code d'accès) — répond à l'inquiétude du Patron sur son exposition.
- **Problèmes ouverts** : aucun. À déployer avec le prochain zip. Rotation du code = supprimer
  `.secret_admincode` (se régénère) ou définir `CHAPCI_ADMIN_CODE`.
- **Pour les autres bureaux** : 🛡️ Le Gardien — surveille `admin_unlock_fail` (tentatives de
  déverrouillage ratées = signal fort d'un compte admin compromis).

---

### 2026-07-19 — [Développement] Rôles & permissions des modérateurs
- **Fait** : refonte du modèle de rôles à la demande du Patron.
  1. **Réinitialisation unique au déploiement** : la table `admins` est vidée une seule fois
     (marqueur `.reset_admins_v2`) → **seul le propriétaire** (`bracknetswilliam@gmail.com`,
     via config) reste admin ; tous les autres perdent admin/modérateur.
  2. **Modérateur créé PAR l'admin** : email + **fonctionnalités cochées** (permissions fines)
     + **code d'accès personnel** (fourni ou généré, renvoyé une fois, haché bcrypt).
  3. **Permissions applicables en 3 couches** sur `/admin/*` : compte admin → **déverrouillage**
     (code perso du modérateur, distinct du code serveur du proprio) → **contrôle par
     fonctionnalité**. Fonctions **réservées au propriétaire** (jamais délégables) :
     `moderators`, `emails` (SMTP), `backup`/`reset`, `automation` (clé cron). `/newsletter`
     (hors `/admin/*`) couvert aussi.
  - Front : onglets filtrés selon les permissions (un modérateur ne voit que ce qui est coché) ;
    UI de gestion (cases à cocher + code affiché une fois) ; écran de déverrouillage adapté
    (le modérateur n'a ni bouton email ni astuce serveur). **Testé** de bout en bout
    (smoke test : purge, filtrage des permissions, code par modérateur, matrice d'accès — tout vert).
- **Problèmes ouverts** : aucun. À déployer avec le zip (contient déjà 2FA + serrure + rôles).
- **Pour les autres bureaux** : 🛡️ Le Gardien — nouveaux événements audit `moderator_added/updated`,
  et rappel : un modérateur compromis ne peut PAS s'auto-promouvoir (section `moderators`
  réservée au propriétaire) ni toucher aux sauvegardes / à la clé cron.

---

### 2026-07-19 — [Développement] Alerte d'intégrité de la table admins
- **Fait** : détection d'une ligne « admin » ajoutée **hors du tableau de bord** (injection /
  accès direct à la base). L'app enregistre une **empreinte** (`api/data/.admins_fp`) de
  l'ensemble des admins à chaque changement légitime (création/suppression de modérateur,
  purge). Le **scan sécurité** (`cron/security`) recompare : si l'empreinte ne correspond
  plus → `adminsIntegrity: ALTÉRÉE` dans le rapport **＋ email d'alerte au propriétaire**
  (throttlé 1×/24 h, liste les comptes admin actuels). Se réinitialise quand l'admin
  supprime l'intrus via l'app. Nouvel événement audit `admins_tampered`.
- **Pourquoi** : un attaquant qui obtiendrait une ligne admin par injection reste de toute
  façon borné (jamais propriétaire — statut hors base ; fonctions sensibles réservées au
  proprio). Cette alerte ajoute la **détection** au reste (prévention). **Testé** : ok →
  modérateur légitime (pas de faux positif) → injection détectée → retour normal. Tout vert.
- **Pour les autres bureaux** : 🛡️ Le Gardien — quand tu vois `adminsIntegrity: ALTÉRÉE` dans
  le JSON du scan, c'est **prioritaire** : une modification de la base hors app. Signale-le.

---

### 2026-07-19 — [Développement] Alertes email du scan sécurité (seuils)
- **Fait** : `cron/security` envoie désormais **un seul email récapitulatif** au propriétaire
  (throttlé 1×/24 h) regroupant tous les motifs détectés : **intégrité admins** altérée, **pic
  de connexions échouées** (≥ 30/j), **déverrouillages admin ratés** (≥ 3), **échecs 2FA**
  (≥ 5), **IP suspectes** (≥ 3). Seuils surchargeables via `config['security_alerts']`. Le JSON
  du scan expose `alerts[]`, `loginFail`, `adminUnlockFail`, `mfaFail`. **Testé** (4 motifs
  déclenchés, email throttlé à 1 même sur 2 scans). Nouvel événement audit `security_alert`.
- **Pour les autres bureaux** : 🛡️ Le Gardien — le champ `alerts[]` du scan liste ce qui a
  déclenché l'email ; s'il est non vide, priorise l'investigation.

---

### 2026-07-19 — [Développement] Refonte des codes d'accès (OTP proprio + blocage modérateur)
- **Fait** (demande du Patron) :
  - 🔐 **Propriétaire** : le code fixe (`.secret_admincode`) est remplacé par un **code à
    usage unique EXPIRANT (60 s)** — `admin_otp_*`, stocké `api/data/.admin_otp` au format
    `CODE|EXP`. Généré à la demande (bouton « Recevoir le code »), envoyé par email
    (Gmail + contact@chap.ci). Consommé après usage. Fini le « même code ». UI : astuce
    `cat …` **retirée**, mention « expire dans 1 minute ».
  - 👥 **Modérateur** : déverrouille **une fois** puis accès **permanent** (jeton 30 j en
    localStorage) **jusqu'au blocage**. Nouvelle colonne `admins.blocked` + endpoint
    `/admin/moderators/block`. Bloqué = `admin_unlocked()` renvoie false → accès **révoqué
    immédiatement** (même jeton valide) et **impossible de re-déverrouiller** tant que non
    débloqué. UI : bouton bloquer/débloquer + badge « Bloqué ».
  - `admin_unlocked()` prend désormais `$config,$pdo,$secret,$u` (vérifie le blocage) ;
    cookie de déverrouillage à durée variable (proprio 12 h / modérateur 30 j).
  - **Testé** de bout en bout : OTP usage-unique + expiration + accès permanent + blocage
    (révocation immédiate) + déblocage. Tout vert. Événements audit `moderator_blocked/
    unblocked`, `admin_unlock_blocked`.
- **Pour les autres bureaux** : 🛡️ Le Gardien — surveille `admin_unlock_blocked` (un
  modérateur bloqué qui insiste) et `moderator_blocked`.

---

### 2026-07-19 — [Développement] Réponse au scan du Gardien (2 points 🟠)
- **Fait** : les **2 correctifs prêts** du scan du Gardien sont appliqués et testés :
  1. `admin_feature_for_path()` renvoie désormais **`'unknown'`** (au lieu de `''`) pour
     une route `/admin/*` non répertoriée → **fail-closed** : un modérateur est refusé sur
     une éventuelle route oubliée (seul le propriétaire y accède). Plus de fail-open.
  2. **Défense en profondeur cron** : gate commun `str_starts_with($path,'cron/')` qui
     **rate-limite les essais ratés** (`cron_fail`, 20/10 min/IP) et centralise la
     vérification de clé avant tout traitement. Un cron légitime (bonne clé) n'est jamais
     compté ni pénalisé ; nouvel événement audit `cron_fail` (visible au scan).
  - **Testé** : smoke OTP + blocage + permissions **6/6**, aucune régression (les routes
    mappées gardent leur comportement).
- **Problèmes ouverts** : 🔑 la clé cron de la routine Sécurité est **toujours périmée**
  (3ᵉ jour) → 403 sur `/api/cron/security`. **Action Patron** : récupérer la clé dans
  *Tableau de bord → Tâches auto* et la coller dans le prompt de la routine.
- **Pour les autres bureaux** : 🛡️ Le Gardien — excellent scan (0 🔴, hardening confirmé).
  Nouvelle donnée pour toi : les pics de `cron_fail` = tentatives de balayage de clé.

---

### 2026-07-19 — [Secrétariat] Réorganisation des bureaux (ordre du Patron)
- **Fait** : refonte de l'organisation → **8 bureaux** au lieu de 7.
  - **Fusions** : Santé serveur → dans la Sécurité ; **Modération → dans la Sécurité**
    (nouveau bureau **« Confiance & Sécurité »**, chef 🛡️ Le Gardien) ; **Rapport
    d'activité + Sourcing** réunis en une seule routine du bureau **Données**.
  - **Créations** : **⚡ Performance & Fiabilité** (Le Mécanicien) et **🤝 Support &
    Expérience** (Le Concierge).
  - **Croissance (📣 Le Crieur)** : cadence portée à **tous les 2 jours** ; mission
    élargie → **SEO + Google + poussée des mots-clés des annonces sur tout le net**
    (site *et* app), IndexNow, données structurées.
  - **Skills créés** (`.claude/skills/`) : `seo-ivoirien`, `moderation-ci`,
    `perf-mobile-ci`, `a11y-contraste` + affectations par bureau documentées.
  - **Polices gratuites** : capacité ajoutée aux bureaux Design 🎨 et Croissance 📣
    (Google Fonts, Fontshare, Font Squirrel, The League, Open Foundry, 1001 Fonts,
    FontSpace, DaFont) — **vérification de licence obligatoire** (site commercial),
    procédure d'auto-hébergement woff2 dans le skill `typographie`.
  - **SEO technique (Dev, gain immédiat)** : `web/seo.php` sert désormais des **données
    structurées JSON-LD Product/Offer** (prix FCFA/XOF, dispo, image) + `meta robots`
    sur chaque fiche annonce → *rich results* Google. `php -l` OK.
- **Problèmes ouverts** : robots.txt et ping IndexNow **pas encore** en place (proposés
  par le Crieur) ; à implémenter par le Dev sur validation.
- **Propositions au Patron** : créer les 4 nouvelles routines (prompts fournis :
  `routine-croissance/-performance/-support.md`) et les 4 skills dans claude.ai.
- **Pour les autres bureaux** : nouveaux prompts de référence dans `.claude/bureaux/`.

---

### 2026-07-21 — [Développement] 🔨 Application native, PWA et maillage SEO
- **Fait** :
  - **Coquille native Android** (`src/components/NativeShell.tsx`, `c676cdd`) : le
    bouton retour matériel recule dans l'app (2 appuis pour quitter à la racine),
    barre de statut crème à icônes sombres, splash masqué au démarrage. Sans ce
    câblage, le bouton retour FERMAIT l'app à chaque appui.
  - **Bannière « Installer l'application »** (PWA, `fdb629a`) : installation en 1 tap
    sur Android/Chrome, instructions manuelles sur iPhone. C'est le SEUL canal
    d'installation tant que le Play Store n'est pas public.
  - **Guide et assets Play Store** (`5d22ced`) : `GUIDE-PUBLICATION-PLAY.md`,
    icône 512, bannière 1024×500, textes de fiche (`store/STORE-LISTING.txt`).
  - Section « Vendez près de chez vous » sur l'accueil (`c298ea5`), **retirée le
    lendemain sur ordre du Patron** (`657be87`) — le composant reste dans le code.
- **Pour les autres bureaux** : 🎨 Design et ⚡ Performance — l'app embarque le
  code web du dépôt : vos correctifs la servent aussi.

### 2026-07-22 — [Design & Typographie] 🎨 L'Atelier (1er scan)
- **Fait** : premier scan design (7 catégories notées). Note globale solide,
  accessibilité 3/5. **9 propositions** remises — le Patron a validé **la totalité**,
  toutes appliquées le jour même (`867a23e`) :
  - P1 : cibles tactiles `.chip` 44 px · points du bandeau pub · contraste du prix
    barré et de « négociable » (`gray-400` → `gray-500`).
  - P2 : espace insécable avant « ? » (24 questions FAQ) · contraste du pied de page
    (`white/40` → `white/55`) · étoiles d'avis 44 px.
  - P3 : palette des catégories retinte (tons chauds + verts de marque) · fondu entre
    deux publicités · bouton « Masquer » du bandeau Indépendance agrandi.
- **Pour les autres bureaux** : ces points sont CLOS, ne plus les signaler.

### 2026-07-23 — [Confiance & Sécurité] 🛡️ Le Gardien
- **Fait** : santé OK, sécurité RAS (0 échec, 0 IP suspecte), file de modération vide.
  Scan de code : aucune faiblesse. Un commentaire obsolète mentionnait un repli
  `?stoken=` inexistant → **corrigé** (`f7b5f23`). Le jeton de modération n'est lu
  QUE dans l'en-tête `X-Service-Token`.
- **Problèmes ouverts** : vérification SSL impossible depuis l'environnement de la
  routine (le proxy re-signe le TLS). **Ce n'est pas un incident** : la chaîne a été
  vérifiée par ailleurs (Let's Encrypt, renouvellement automatique confirmé).

### 2026-07-23 — [Croissance] 📣 Le Crieur
- **Fait** : audit SEO technique vert (JSON-LD, sitemap, robots.txt, OG, PWA).
  **Bug réel trouvé** : Bingerville — seule commune avec de vraies annonces — était
  absente de la liste des communes SEO → `/vendre/{cat}/bingerville` en 404.
  **Corrigé** (`2088edb`) : +14 pages, sitemap porté à 326 URLs.
- **Pour les autres bureaux** : le catalogue, pas la technique, est le frein SEO.

### 2026-07-23 — [Développement] 🔨 Marketing, confidentialité, publication assistée
- **Fait** :
  - **Pixels publicitaires** (`ff7818a`) : Meta, TikTok et Google GA4 posés sur le
    site, avec suivi des conversions (inscription, publication). Chargés sans script
    « inline » (la CSP sans `unsafe-inline` est préservée) et **inactifs dans l'app
    native**.
  - **Politique de confidentialité** (`1df95d4`) : nouvelle section 11 « Cookies et
    mesure publicitaire » — ce qui est collecté, partagé, et comment refuser.
  - **Formulaire « Publier » assisté** (`1df95d4`, `cd41b75`) : nom pré-rempli depuis
    le compte, **titre → catégorie** (dictionnaire de mots-clés, hors-ligne, testé sur
    5 cas réels), **photo → catégorie + début de description** (MobileNet embarqué,
    *fail-open* : aucune casse si le modèle ne charge pas).

### 2026-07-24 — [Confiance & Sécurité] 🛡️ Le Gardien (2 rondes)
- **Fait** :
  - 🟠 **Faille d'intégrité confirmée et corrigée** (`3fa0027`) : `POST /orders`
    enregistrait le **prix envoyé par le client** sans le revérifier. Le serveur relit
    désormais titre/prix/image **depuis l'annonce**, pour l'enregistrement ET les
    e-mails (même patron que le flux « deal »).
  - **Clé cron acceptée en en-tête** `X-Cron-Key` (`a889e35`), repli `?key=` conservé
    pour les tâches cPanel — la clé n'apparaît plus dans les journaux d'accès.
  - **conversationId vérifié** à la création de commande (cohérence défensive).
- **Problèmes ouverts** : `cron_fail` en légère hausse = balayage de clé, sans
  succès. À surveiller, rien à faire.

### 2026-07-25 — [Confiance & Sécurité] 🛡️ Le Gardien
- **Fait** : tout vert. Une note de portée relevée et **corrigée** (`975055a`) :
  `POST /reviews` autorisait un avis dès qu'UNE vente confirmée existait entre deux
  personnes. Désormais, un avis sur une ANNONCE exige une vente confirmée **portant
  sur cette annonce** ; les avis de profil restent inchangés.

### 2026-07-25 — [Design & Typographie] 🎨 L'Atelier (2e scan)
- **Fait** : 9 propositions, **toutes appliquées** (`57aa685`) :
  - Contrastes des textes d'état et horodatages (cloche, messagerie, choix de commune,
    page pub) → `gray-500`.
  - **Points du bandeau pub** : le correctif du 22/07 ne couvrait que la HAUTEUR ;
    ajout de `min-w-11` → cible **44×44 réelle**. *Leçon : toujours vérifier les deux axes.*
  - **Tokens de bordure** `border-line` / `border-line2` créés et substitués aux 141
    occurrences codées en dur dans 24 fichiers (couleur identique au pixel).
  - « dès 2 000 FCFA » passe par `formatFCFA()` ; grille Catégories en fondu échelonné.
- **Chantier ouvert** : tri des ~178 `text-gray-400` restants, **par lots de 2-3
  fichiers** par ronde (beaucoup sont du décor légitime).

### 2026-07-25 — [Croissance] 📣 Le Crieur (2 rondes)
- **Fausse alerte à ne pas reproduire** : une ronde a signalé « fiches annonces non
  crawlables (302) » après avoir testé `/annonce/86` — un **identifiant tronqué**.
  Les identifiants réels sont des **UUID de 36 caractères**. Vérification faite avec
  un vrai UUID en User-Agent Googlebot : **HTTP 200, JSON-LD Product/Offer, canonical,
  og:image** — tout fonctionne. Une annonce inexistante redirige vers l'accueil :
  c'est **voulu**. → Règle inscrite dans le prompt : jamais d'ID tronqué, reproduire
  deux fois avant de qualifier un blocage.
- **CONSTAT MAJEUR (ronde de 22:05, après réécriture du prompt)** : le catalogue ne
  compte que **3 annonces actives, 1 vendeur, 1 commune (Bingerville), 2 catégories**,
  pour ~1 759 visites / 30 jours. La technique SEO est prête (326 URLs indexables),
  **il n'y a presque rien à indexer**. Le frein n'est pas technique, il est **côté offre**.
- **Pour les autres bureaux** : 🤝 Support et 📊 Données — la conversion
  visiteur → vendeur devient la priorité n°1 de la maison.

### 2026-07-25 — [Développement] 🔨 Application Android v1.1 (allègement)
- **Fait** (`b7868ec`) : `scripts/android-slim.mjs`, chaîné après `cap sync`, retire du
  paquet natif les assets jamais lus dans l'app — moteur de détourage `ort/wasm`
  (~24,5 Mo, téléchargé à la demande depuis `chap.ci/imgly/`) et bannières sociales
  `og/` (~3,8 Mo, destinées aux robots du web). **L'app passe de 16,7 Mo à 6,4 Mo (−62 %)**.
  Le modèle anti-nudité reste embarqué (modération du contenu dans l'app).
  AAB v1.1 (versionCode 2, cible API 35) signé et remis au Patron.

### 2026-07-26 — [Développement] 🔨 Clé cron sûre par construction
- **Cause racine des 403 à répétition, enfin identifiée** : la clé cron contenait des
  caractères spéciaux (`$ ? % ;`). Dans une commande shell entre **guillemets doubles**,
  `$KA` était interprété comme une variable et **avalé** → la clé transmise était
  mutilée, d'où des « Clé invalide » incompréhensibles pendant une semaine.
- **Fait** :
  - `chapci_hardened_secret()` accepte un mode `urlSafe` (activé pour la clé cron) :
    toute clé hors de `[A-Za-z0-9._~-]` est **refusée** et remplacée par un secret
    aléatoire hexadécimal — la clé est désormais **sûre par construction** (`00d4c1d`).
  - Panneau **Admin → Tâches auto** : bascule « **Commande cPanel** » (par défaut) /
    « URL simple ». La commande met la clé dans l'en-tête, entre **apostrophes simples**.
  - **11 routes cron** revérifiaient encore la clé via `$_GET['key']` seul : appelées
    avec l'en-tête, elles répondaient 403 malgré une clé valide. **Corrigé** (`143ab44`)
    et testé sur les 12 routes : en-tête 200 · `?key=` 200 · sans clé 403.
- **Pour TOUS les bureaux** : écrivez désormais
  `curl -sS -H 'X-Cron-Key: VOTRE_CLE' 'https://chap.ci/api/cron/...'` — en-tête, et
  **apostrophes simples obligatoires**. Le jeton de modération suit la même règle avec
  `X-Service-Token`.
- ⛔ **Rappel à tous** : `cron/backup` n'est PAS une lecture — elle crée une sauvegarde
  et ne conserve que les 7 plus récentes. La déclencher depuis une ronde **détruirait**
  les sauvegardes quotidiennes. Idem pour `cleanup`, `digest`, `report-email`,
  `activation-relance`, `review-invites`, `alerts`, `suggestions`.

### 2026-07-26 — [Direction] Refonte des prompts de routines
- **Fait** : les 8 prompts de bureaux réécrits par le Développement, sur ordre du Patron,
  avec quatre apports communs : (1) secrets en **en-tête + apostrophes simples** ;
  (2) **méthode anti-fausse-alerte** (identifiants réels, reproduction double,
  distinction constaté/supposé) ; (3) **liste du déjà-corrigé** pour éviter les
  doublons ; (4) une **section Application** dans chaque bureau.
- **Problème de fond corrigé** : chaque bureau terminait par « remets ce rapport au
  Secrétariat » pour consignation, mais le Secrétariat avait l'ordre de **ne rien
  écrire au journal** — et aucun bureau n'a l'accès en écriture au dépôt. Résultat :
  **le journal n'a pas bougé du 19 au 26 juillet** et les bureaux ont perdu la mémoire
  d'une semaine (d'où des points re-signalés plusieurs fois). Le Secrétariat produit
  désormais un **bloc à consigner** que le Patron transmet au Développement.

### 2026-07-26 20:12 — [Confiance & Sécurité] 🛡️ Le Gardien
- **Fait** : santé (accueil 200 en 1,05 s · `/api/health` 200 · sitemap 200, 326 URLs ·
  PHP 8.1.34) · sécurité 24 h (0 IP suspecte, 0 blocage, comptes admin intègres,
  0 alerte) · ménage (`cleanup` : 0 purge, rien de périmé) · scan du code serveur
  (JWT HS256 + `hash_equals` + `session_version`, bcrypt, uploads validés par
  `getimagesizefromstring`, requêtes préparées — RAS) · scan du code de l'app
  (6 points sur 6 conformes) · modération (file **vide**, 3 annonces examinées-OK,
  0 masquée, 0 signalée, digest envoyé).
- **Cloisonnement des secrets testé, pas supposé** : clé cron → `/api/mod/queue` = **401** ;
  jeton de modération → `/api/cron/stats` = **403**. Étanchéité confirmée.
- **🟠 Problème ouvert — `cron_fail` : 10 échecs en 24 h.** Deux causes probables, aucune
  n'étant une attaque (0 IP suspecte, 0 rate-limited) : (1) les **tâches cron cPanel**
  portent encore l'ancienne clé, refusée depuis la rotation du 26/07 — auquel cas
  `backup`, `cleanup`, `digest`, `alerts`, `activation-relance` et `review-invites`
  **ne tournent plus, donc plus de sauvegarde quotidienne** ; (2) une routine de bureau
  appelle avec les **chevrons `< >`** laissés autour du secret. *Non vérifiable depuis
  une ronde* : le serveur enregistre la route en échec mais ne l'expose nulle part.
- **🟠 PHP 8.1.34 en fin de vie** : support de sécurité terminé fin 2025, plus aucun
  correctif d'interpréteur. Aucune faille exploitable démontrée. `php -l` passe sous
  PHP 8.4 → montée en 8.3 à faible risque (cPanel → MultiPHP Manager).
- **Fausses alertes écartées** (inscrites au prompt pour ne plus revenir) : `currentAdmins: []`
  est normal (rempli seulement en cas de falsification) ; `/compte` `/admin` `/messages`
  sans `meta robots` est normal (HashRouter, fragment jamais transmis, absents du sitemap) ;
  `failRatio` 0,67 sur 3 tentatives est du bruit, pas un signal.
- **Propositions au Patron** : (1) vérifier les tâches cron cPanel et les chevrons dans les
  prompts ; (2) **horodater la dernière exécution de chaque route cron** et l'afficher dans
  Admin → Tâches auto — aujourd'hui rien ne distingue « la sauvegarde tourne » de « elle est
  morte depuis trois jours » sans ouvrir cPanel (risque nul, effort petit) ; (3) passer en PHP 8.3.
- **Pour les autres bureaux** : 🤝 Concierge et 📊 Comptable — **2 inscriptions en 24 h,
  0 nouvelle annonce**, catalogue toujours à 3 annonces / 1 commune. Deux personnes se sont
  inscrites et sont reparties sans publier. 📣 Crieur — fiche `86d69a37…` en Googlebot :
  200, JSON-LD, canonical, `og:image`, `index, follow`. RAS côté SEO technique.
- *Note d'honnêteté* : le test de cloisonnement a généré 1 `cron_fail` et 1 `mtoken_fail`
  — à déduire du décompte de demain.

### 2026-07-26 20:46 — [Confiance & Sécurité] 🛡️ Le Gardien (2ᵉ ronde)
- **Ce qui compte dans cette ronde : elle a eu lieu.** Premier passage avec le prompt
  corrigé — `cron/security`, `cron/cleanup` et `mod/queue` ont répondu, et le digest est
  parti. Les mêmes appels échouaient en 403 avant le retrait des chevrons autour de la
  clé. **La correction des prompts est validée en production.**
- **Fait** : santé verte (accueil 200 en 1,42 s · `/api/health` 200 · sitemap 200,
  326 URLs · PHP 8.1.34) · sécurité 24 h (0 IP suspecte, 0 rate-limited, comptes admin
  intègres, 0 alerte) · ménage (0 purge) · scan de code (aucun commit sur
  `server/index.php` ni sur les fichiers Capacitor depuis 20:12, vérifié par `git diff`)
  · modération (file vide, digest envoyé, 1 destinataire) · cloisonnement re-testé
  (401 / 403).
- **Problèmes ouverts, inchangés** : `cron_fail` à 11 sur 24 h, et PHP 8.1 en fin de
  support. Aucun nouveau. Aucune proposition nouvelle.
- **Précision de méthode** : le passage de 10 à 11 `cron_fail` n'est PAS une hausse de 1.
  La fenêtre de 24 h glisse — des échecs anciens en sortent pendant que les tests de
  cloisonnement des deux rondes y entrent. Ce compteur ne redeviendra interprétable
  qu'après une journée pleine sans intervention de notre part.
- **Toujours en attente du Patron** : ouvrir Admin → Sauvegarde. C'est la seule
  vérification qui tranchera si les tâches cron cPanel tournent encore.

### 2026-07-26 20:58 — [Croissance] 📣 Le Crieur
- **Première lecture réussie de `cron/stats` depuis la création du bureau.** Le prompt
  corrigé fonctionne : la clé passe en en-tête, entre apostrophes simples. Toutes les
  rondes précédentes travaillaient sans données de trafic.
- **Chiffres (30 j)** : 2 090 visites · 83 visiteurs · 6 inscrits. Catalogue **inchangé** :
  3 annonces, 1 vendeur, 1 commune (Bingerville), 2 catégories — figé sur 3 rondes.
- **LA MESURE DE LA SOIRÉE** : pages les plus vues — `/` (848), `/compte` (244),
  `/explorer` (239), **`/publier` (133)**. Des gens atteignent le formulaire de
  publication, et il n'en sort aucune annonce.
- **MAIS CE CHIFFRE N'EST PAS ENCORE EXPLOITABLE — vérifié le 26/07** : la table `visits`
  ne stocke que `visitor_id, path, referrer, created_at` (server/index.php:1007) et le
  front n'envoie qu'un identifiant anonyme (src/lib/track.ts:38). Or `/publier` montre un
  écran d'invitation aux non-connectés. **Les 133 vues mélangent donc deux populations
  opposées** : visiteurs bloqués par la création de compte, et titulaires de compte
  bloqués par le formulaire. Deux diagnostics contraires, deux correctifs sans rapport.
- **Proposition au Patron (Développement)** : ajouter un booléen `authed` (0/1) à la table
  `visits` et au corps de `/track`. Aucune donnée personnelle nouvelle — un simple drapeau,
  pas d'identifiant d'utilisateur. Effet : `/publier` se scinde en deux chiffres, et le
  bureau Support sait enfin quel mur attaquer. Effort petit, risque nul.
- **Précision de méthode** : la fenêtre de 30 jours GLISSE. `2 090 − 1 759 = +331` est un
  solde net, pas « 331 visites en deux jours » — le trafic réel de la période est
  supérieur. Ne pas lire ces écarts comme des flux.
- **Bien joué** : arrêt volontaire à 8 mots-clés au lieu de 20, motivé (« le catalogue ne
  soutient honnêtement pas plus »), et refus de forcer des variantes nouchi sur des titres
  trop informels. C'est la règle d'honnêteté appliquée correctement.
- **SEO technique** : tout vert et reproduit (fiche en Googlebot 200 + JSON-LD + canonical
  + og:image · `/vendre/{cat}/bingerville` 200 · sitemap 326 URLs · robots.txt · manifest
  PWA · bannière d'installation · les 3 pixels dans le bundle servi). Aucun correctif.

### 2026-07-26 21:30 — [Design & Typographie] 🎨 L'Atelier (3ᵉ scan) — appliqué
- **Rapport de bonne tenue** : 7 propositions, budget de 9 volontairement
  sous-utilisé, audit de code annoncé comme tel (proxy réseau, pas de rendu). Les
  dix emplacements cités ont été **vérifiés un par un avant application** — tous
  exacts, y compris la distinction `ListingDetail.tsx` (route `/annonce/:id`) et
  `AdDetail.tsx` (route `/pub/:id`), et le commentaire ligne 420 de `PostAd.tsx`
  qui confirme le formulaire en une seule colonne.
- **Appliqué (`19b3ddb`)** :
  - Croix « Effacer » de la recherche (`Home.tsx`, `Browse.tsx`) : zone de clic de
    16-18 px → **44×44 px MESURÉE au rendu** (`boundingBox`), pas seulement écrite
    en CSS. C'est la leçon du 25/07 appliquée à la vérification elle-même.
  - `Notifications.tsx`, `Profile.tsx` : `h-9 w-9` (36 px) → `h-11 w-11`.
  - Contrastes : horodatage d'avis (`ListingDetail`) et prix barré de l'aperçu
    promo (`PostAd`) → `gray-500`. Ce dernier avait été oublié lors du correctif
    du 22/07 sur les autres prix barrés.
  - `hover:` → `md:hover:` sur `Sheet.tsx` (composant universel) et `TopNav.tsx`.
  - `PostAd` : `max-w-5xl` → `max-w-2xl` (tablette).
  - Espace insécable avant le « ! » de « Copié ! ».
- **NON VÉRIFIÉ AU RENDU, dit franchement** : le formulaire `/publier` n'apparaît
  qu'une fois connecté — un visiteur voit « Connectez-vous pour publier » et
  **aucun `<form>`**. La session n'a pas de compte de test : le CSS est juste, le
  rendu n'a pas été vu. Un compte de test rendrait service à plusieurs bureaux.
- **Observation pour l'Atelier (pas une proposition)** : l'écran d'invitation de
  `/publier` est propre et clair, mais son icône est un **cadenas** — une image de
  restriction sur l'écran même où l'on veut encourager à publier. À arbitrer par
  le bureau Design, pas par le Développement.
- **Chantier ouvert transmis** : 118 occurrences de `hover:` sans `md:` dans le
  dépôt (l'Atelier en comptait ~108, écart dû au motif de recherche). Le bureau
  recommande un balayage en une fois plutôt que par lots — non fait ce soir, à
  décider par le Patron.

### 2026-07-26 21:41 — [Support & Expérience] 🤝 Le Concierge
- **Entonnoir (30 j)** : 2 097 visites · 84 visiteurs · 6 comptes · **1 seul compte
  ayant publié** · 3 annonces. Visiteur → compte : 7 %. **Compte → vendeur : 17 %** —
  83 % des inscrits ne publient jamais. C'est la marche la plus haute, confirmée.
- **🔴 TROUVAILLE MAJEURE, VÉRIFIÉE ET CORRIGÉE LE SOIR MÊME** : le bureau a relevé, en
  marge de son rapport et « pour les autres bureaux », que `GET /api/listings` — route
  **publique et non authentifiée** — renvoyait `sellerPhone` **en clair**. Vérification
  faite : `curl https://chap.ci/api/listings` retournait `0787798439` sur les
  3 annonces. N'importe qui pouvait récolter le numéro de tous les vendeurs du site :
  matière première du démarchage et de la fraude par SMS, et **promesse exactement
  inverse** de celle faite dans la FAQ. Corrigé (`07fb425`) : `listing_out()` prend un
  paramètre `$withPhone`, faux par défaut ; le numéro ne sort que pour le propriétaire
  (ses annonces, création, modification). Les routes admin restent sans téléphone —
  l'interface ne l'affiche nulle part. `web/seo.php` vérifié : ne le rend pas.
- **Leçon de fonctionnement** : cette faille est arrivée dans la section « Pour les
  autres bureaux » d'un rapport d'expérience utilisateur, sans notification, classée
  « pas un blocage de parcours ». Elle était pourtant plus grave que tout le reste du
  rapport. → **Un écart entre ce que le site PROMET et ce qu'il FAIT sur des données
  personnelles se signale immédiatement, quel que soit le bureau qui le trouve.**
- **Effet de bord évité** : `PostAd` pré-remplissait le téléphone depuis l'annonce en
  édition. La liste publique ne le portant plus, la valeur mémorisée sur l'appareil
  (`chapci.seller.v1`) aurait été effacée à chaque modification. Le pré-remplissage
  conserve désormais le numéro existant quand l'annonce n'en porte pas.
- **Propositions du bureau, retenues et NON encore appliquées** : lier les `<label>`
  par `htmlFor`/`id` sur `/publier` (~10 champs) ; défiler jusqu'au champ fautif au
  lieu d'un message d'erreur générique ; ajouter sous le champ téléphone « Ce numéro
  reste privé — les acheteurs vous contactent par la messagerie Chap.ci » (phrase
  désormais VRAIE, ce qui n'était pas le cas ce matin).
- **Bien vu** : le bureau a lu le code plutôt que d'inventer un ressenti faute de
  compte de test, et a marqué ses points `[CONSTATÉ]` / `[SUPPOSITION]`.

### 2026-07-26 21:47 — [Données] 📊 Le Comptable
- **Première lecture réussie de `cron/stats` depuis la création du bureau.** Le prompt
  corrigé fonctionne, et le bureau a correctement annoncé qu'il posait son point zéro
  sans prétendre à une tendance — la règle inscrite au prompt a tenu.
- **Point zéro de la série (30 j)** : 2 098 visites · 84 visiteurs · 6 comptes ·
  3 annonces actives · 1 vendeur · 1 commune · 2 catégories sur 13 · 2 conversations ·
  3 demandes d'achat · 0 avis · 0 signalement · 4 abonnés newsletter.
- **L'entonnoir** : 84 visiteurs → 6 comptes → **1 seul compte ayant publié** → 3 annonces.
  Cinq comptes sur six n'ont jamais rien publié.
- **DÉDUCTION QUE LE RAPPORT NE FAIT PAS, ET QUI CHANGE LA PRIORITÉ** : `/publier`
  totalise 133 vues pour **6 comptes existants au total**. Or cet écran montre un
  formulaire aux personnes connectées et un **écran d'invitation à créer un compte**
  aux autres. Même en supposant que les six titulaires y soient revenus plusieurs fois,
  l'écrasante majorité de ces 133 vues sont nécessairement **anonymes**.
  → Le mur n'est probablement PAS le formulaire de publication : c'est **l'obligation
    de créer un compte avant même de voir le formulaire**. Le drapeau `authed` déployé
    le 26/07 tranchera dans les 48 h ; jusque-là, cela reste une déduction, pas une
    mesure.
- **Sourcing proposé** : concentrer sur Bingerville + Cocody plutôt que 22 communes ;
  cibler téléphones d'occasion, mode, alimentation, meubles ; approcher boutiques de
  quartier, couturières, restauratrices. Levier immédiat : les testeurs du test fermé,
  12 × 2 annonces = 24 annonces et 4-5 communes.
- **Demandes au Patron** : les 3 chiffres de la Play Console (installations, testeurs
  actifs, plantages) une fois par semaine ; trancher la niche géographique.
- **Convergence** : trois bureaux indépendants — Croissance 20:58, Support 21:41,
  Données 21:47 — désignent la même marche. Le sujet n'est plus de la diagnostiquer.

### 2026-07-26 21:55 — [Performance] ⚡ Le Mécanicien — appliqué et vérifié
- **Ronde exemplaire** : mesures en trois passes avec médiane, refus explicite de faire
  passer une estimation pour un relevé Lighthouse faute de navigateur, et un gain
  **mesuré par un vrai build** plutôt qu'estimé. Ses deux P1 étaient justes.
- **Disponibilité** : accueil médiane 1,01 s · `/api/health` 0,70 s · sitemap 200 ·
  aucun 5xx. Compression br et gzip actives. Images 720×1280, 108-160 Ko, ratio réservé,
  zéro décalage de mise en page.
- **🔴 CE QUE LA RONDE A FAIT DÉCOUVRIR, ET QUI DÉPASSE SON CONSTAT** : en cherchant
  pourquoi la règle de cache ne s'appliquait pas, on a trouvé **deux `.htaccess` racine**
  dans le dépôt. `web/htaccess-root`, celui que le zip déploie, ne portait que le routage
  SEO. `deploy/htaccess-racine.txt`, qui contient les **en-têtes de sécurité**, n'a
  jamais été appliqué — et comme le zip écrase `.htaccess` à chaque mise en ligne, toute
  règle ajoutée à la main sur le serveur était effacée au déploiement suivant.
  Vérifié en production avant correction : **aucun** `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` ni `Strict-Transport-Security`.
  Le site n'avait aucune protection contre l'affichage en iframe ni contre le sniffing.
  → Les deux fichiers sont fusionnés (`ce82a62`), avec un avertissement en tête. **Vérifié
    déployé le 27/07 : les cinq en-têtes répondent.**
- **Cache** : le JS principal, le plus gros fichier du site, ne renvoyait AUCUN
  `Cache-Control` quand le CSS en avait un de 7 jours. Désormais un an, `immutable`, avec
  exceptions `no-cache` sur le service worker et `index.html` — sans quoi l'application
  cesserait de se mettre à jour. Vérifié déployé.
- **Allègement appliqué** : `AdminDashboard`, la plus grosse page du dépôt, partait dans
  le paquet initial de chaque visiteur alors que seul le Patron l'ouvre. Passée en
  `lazy()`. **Gain mesuré sur le bundle réel de production : 180,1 → 154,1 Ko gzip, soit
  −26,0 Ko et −14,5 %.** Le bureau annonçait −26,61 Ko : sa mesure était bonne.
- **Écarté pour l'instant** : conversion WebP des photos (gain estimé, non mesuré) et
  variantes redimensionnées serveur — sans intérêt à 3 annonces, à reprendre quand le
  catalogue grossira.
- **Trouvé en passant, pour 🎨 l'Atelier** : la page **Explorer n'a aucun `h1`**. Manque
  réel pour l'accessibilité et le référencement, sans rapport avec cette ronde.

### 2026-07-26 22:15 — [Juridique] ⚖️ Le Juriste (ronde mensuelle)
- **Ronde de très bonne tenue** : sources datées et vérifiables, distinction rigoureuse
  entre loi en vigueur, projet et règle de plateforme, et refus explicite de conclure là
  où il n'a pas trouvé de source (« aucun texte ivoirien n'impose formellement un bandeau
  cookies »). 4 propositions sur 8 possibles — le bureau n'a pas rempli son quota pour
  faire nombre.
- **🔴 P1 POUR LE PATRON, HORS DE PORTÉE DE TOUS LES BUREAUX — déclaration ARTCI.** La loi
  n° 2013-450 impose depuis 2013 une déclaration préalable de tout traitement de données
  personnelles auprès de l'ARTCI. Le bureau ne peut pas savoir, depuis les pages
  publiques, si Chap.ci l'a faite. Si elle ne l'a jamais été, c'est une non-conformité
  vieille de treize ans, avec des sanctions pouvant atteindre 100 M FCFA. L'ARTCI a
  ouvert le 2 juillet 2026 un guichet dématérialisé, **CERTINUM**, qui simplifie la
  démarche ; les traitements de Chap.ci (compte, localisation, messages) relèvent
  probablement des normes simplifiées. **Seul le Patron peut vérifier et agir.**
- **🟠 P2 — séquence de consentement aux traceurs.** Les pixels Google, Meta et TikTok se
  chargent dès l'arrivée sur le site web. La politique explique comment les refuser, mais
  ce refus n'est possible qu'APRÈS leur activation : le texte promet un choix que le
  mécanisme ne permet pas d'exercer à temps. Incohérence interne, simple à corriger,
  bandeau proposé et rédigé. **Non appliqué** : un bandeau de consentement ajoute de la
  friction sur toutes les pages, ce qui touche directement le problème n°1 de la maison.
  Arbitrage du Patron.
- **🟢 P1 clos** : suppression de compte publique, vérifiée par le bureau dans `App.tsx`
  (aucune protection d'accès sur la route) et dans `Footer.tsx` (lien présent).
- **ÉCART PROMESSE / RÉALITÉ TROUVÉ ET CORRIGÉ LE MÊME JOUR** : le bureau demandait qu'on
  lui confirme la rétention réelle « pour corriger le texte plutôt que l'inverse ».
  Vérification dans `cron/cleanup` : journaux de sécurité purgés à **180 jours**, visites
  à **120 jours**. Or la page de suppression annonçait **12 mois** — chiffre écrit par le
  Développement sans vérification. Corrigé (`8b6c6ff`) : 6 mois et 4 mois, exactement ce
  que fait le code, avec un commentaire liant les deux. La section 6 de la politique, qui
  ne donnait AUCUNE durée, les porte désormais — une mention que la loi 2013-450 exige.
- **Veille sans impact** : annexe fiscale 2026 et TVA plateformes visent les plateformes
  ÉTRANGÈRES non établies en Côte d'Ivoire, pas Chap.ci ; interopérabilité BCEAO vise les
  établissements agréés, sans objet tant que la plateforme n'encaisse pas ; projet de loi
  e-commerce toujours à l'étude. À resurveiller le mois prochain.

### 2026-07-27 08:45 — [Direction] Arbitrage : bandeau de consentement aux traceurs
- **Décision du Patron : attendre.** Le bureau Juridique proposait un bandeau de
  consentement avant l'activation des pixels Google, Meta et TikTok. Trois options lui
  ont été présentées — poser le bandeau, retirer les pixels, ou attendre.
- **Motif retenu** : un bandeau ajoute de la friction sur toutes les pages et pour tous
  les visiteurs, au moment précis où le problème n°1 de la maison est que 84 visiteurs
  ne produisent qu'un seul vendeur. Le risque juridique est réel mais théorique — aucun
  texte ivoirien spécifique aux traceurs n'a été trouvé par la veille — tandis que le
  coût de conversion serait immédiat.
- **Conditions de réouverture, inscrites au prompt du Juriste** : une campagne
  publicitaire payante qui démarre, un texte ivoirien sur les cookies qui paraît, ou un
  catalogue dépassant la cinquantaine d'annonces. Hors de ces cas, le bureau se contente
  d'une ligne en « problèmes ouverts » et passe à la suite.
- **Rappel de méthode** : une proposition écartée n'est pas une proposition oubliée. Sans
  condition de réouverture écrite, un bureau la represente chaque mois et le Patron finit
  par ne plus lire ses rapports.

---

## 2026-07-27 (soir) — ronde des neuf bureaux

Première ronde où les neuf bureaux rapportent le même soir, et première où le
Secrétariat a pu produire une synthèse complète. Résumé consigné par le
Développement, avec les corrections de faits que la synthèse contenait encore.

### 🛡️ Le Gardien — Confiance & Sécurité
- Santé verte, 0 IP suspecte, 0 rate-limited, comptes admin intègres.
- **`cron_fail` : 5 sur 24 h, contre 11 la veille** — et nommés pour la première
  fois grâce à `byDetail` : `cron/security` ×3, `cron/stats` ×2. Ni l'un ni
  l'autre n'est une tâche cPanel : **la sauvegarde n'était pas en cause**.
  Honnêteté notable du bureau : il signale qu'un de ces échecs vient de son
  propre test de cloisonnement.
- Étanchéité des secrets re-testée : clé cron sur `/mod/queue` → 401, jeton de
  modération sur `/cron/stats` → 403.
- Digest de modération : `skipped: true`, aucun e-mail. Le correctif de la
  veille tient — fini les six envois quotidiens pour une file vide.
- Fichiers `.sql`/`.md`/`.txt` de `/api/` : 404 partout. Propre.

### 📣 Le Crieur — Croissance
- Sitemap 349 URLs conforme, `/vendre/sante` et sa bannière répondent 200.
- Catalogue **figé pour la 4ᵉ ronde consécutive** : 3 annonces, 1 vendeur,
  1 commune, 2 catégories sur 15.
- 9 mots-clés livrés au lieu de 20, **et il dit pourquoi** : le catalogue n'en
  soutient pas davantage. C'est le comportement attendu.

### 📊 Le Comptable — Données
- Entonnoir : 91 visiteurs → 6 comptes (6,6 %) → 1 publiant (17 %) → 3 annonces.
- **A refusé de conclure sur le signal `/publier`** en soulevant une objection
  technique précise sur le drapeau `authed`. **Il avait raison** : les lignes
  antérieures au 26/07 sont à `NULL` et étaient comptées comme anonymes.
  Corrigé le soir même (`connectes` / `visiteurs` / `inconnu` séparés).

### 🤝 Le Concierge — Support
- A trouvé, en lisant le code, que `NewsletterPrompt` n'excluait pas
  `/bienvenue` — et que seule l'inscription par e-mail abonne silencieusement à
  la newsletter. Les comptes Google et Facebook recevaient donc la pop-up
  par-dessus « Publier ma première annonce ». Corrigé.
- Présente sa trouvaille comme une lecture de code, faute de compte de test.

### ⚡ Le Mécanicien — Performance
- 169,4 Ko hors images sur l'accueil, tout en Brotli, cache correct.
- A **mesuré puis annulé** un passage en `lazy()` de 16 pages : −30,7 Ko gzip.
  Appliqué le soir même, build confirmé à 127,7 Ko.

### 🎨 L'Atelier — Design
- `<h1>` manquant sur Explorer, 2 horodatages sous le seuil de contraste :
  corrigés.
- Arbitrage rendu sur le cadenas de `/publier` → icône d'invitation. Appliqué.
- Chantier `hover:` sans `md:` — 108 occurrences, toujours en attente
  d'arbitrage du Patron.

### ⚖️ Le Juriste — mensuel
- **P1 nouveau** : `Terms.tsx` invoque la loi n° 2013-546 sur l'identification
  de l'éditeur, mais `EDITOR_NAME`, `EDITOR_ADDRESS` et le téléphone sont vides.
  La page revendique une conformité qu'elle n'assure pas. **Arbitrage du Patron
  requis** : publier ses nom, prénoms et téléphone personnels, ou immatriculer
  une société. Le bureau ne tranche pas, et a raison.
- Suppression de compte : **P1 du mois dernier clos**, vérifié dans le code.
- Déclaration ARTCI : toujours en attente, invérifiable depuis l'extérieur.

### 🗂️ Le Secrétariat
- Synthèse envoyée aux deux adresses, bloc de journal produit.
- **Trois erreurs de fait dans sa synthèse**, corrigées ici : le drapeau
  `authed` EST implémenté (le Crieur s'en sert le même soir), les sauvegardes
  fonctionnent (`cron/backup` absent des échecs), et le catalogue est figé
  depuis 2 jours et non 3 semaines. Cause : il raisonne sur un JOURNAL.md qui
  n'avait pas été tenu depuis le 26/07. C'est précisément ce que cette entrée
  corrige.

### Ce que le Développement a livré dans la foulée
`NewsletterPrompt` (+/bienvenue) · `authed` en trois compteurs · 17 pages en
`lazy()` · `h1` Explorer · 2 contrastes · icône `/publier` · catégorie Santé
dans la fiche Play.

### Ce qui reste au Patron, par ordre
1. **12 testeurs** pour le test fermé — 0 inscrit, et c'est le seul délai que
   personne ne peut raccourcir.
2. **Mentions légales** (P1 Juriste) — arbitrage vie privée / immatriculation.
3. **Déclaration ARTCI** — invérifiable par les bureaux.
4. Balayage `hover:`/`md:` · passage à PHP 8.3 · connexion Google native (v1.3).

### 2026-07-27 22:00 — [Secrétariat] 🗂️ Le Secrétaire Général

- **Fait** : synthèse hebdomadaire consolidée à partir des rapports du 20 au 27/07
  (les neuf bureaux ont rapporté) + données serveur en direct. E-mail envoyé aux
  deux adresses via `cron/report-email`, `sent: true` confirmé sur les deux.
- **État de la semaine** : 🟠 à surveiller. Chiffre à retenir : **3 annonces
  actives, 0 nouvelle**, catalogue figé depuis 4 rondes.
- **Décision la plus urgente** : recruter les **12 testeurs** du test fermé —
  0 inscrit, le compte à rebours de 14 jours n'a pas démarré.

#### Trois corrections apportées par le Développement à cette synthèse

Le Secrétariat raisonnait encore sur des faits dépassés dans la journée. Corrigés
ici pour que la prochaine ronde ne les reprenne pas :

1. **« 0 connecté sur les 64 vues de /publier — premier indice que le mur est la
   création de compte »** → **non mesuré**. Le drapeau `authed` ne tourne que
   depuis le 26/07 au soir : sur les 136 vues de `/publier` en 30 jours,
   **133 sont non étiquetées** et 3 seulement sont mesurées (0 connecté,
   3 visiteurs). Sur l'ensemble du site, **4,2 % du trafic est étiqueté**
   (78 vues sur 1 838). Aucune conclusion ne tient sur cet échantillon.
   Le bureau Données avait soulevé cette réserve et avait raison ; le bureau
   Support est allé un cran trop loin en écrivant « ce n'est plus le mur de
   connexion ». À revoir dans une semaine, mesure propre dans un mois.
2. **« Vérifier les tâches cron cPanel » (P2)** → **clos le 27/07**. Les 12
   tâches sont saines : 10 vertes, 2 en attente légitime de leur première
   exécution (`digest` à 18 h, rapport mensuel le 1ᵉʳ). `cron/backup` n'apparaît
   plus dans les échecs. Les `cron_fail` restants (5 sur 24 h) sont nommés :
   `cron/security` ×3 et `cron/stats` ×2 — des routines, pas des tâches cPanel.
3. **« 84 visiteurs »** → **91** (2 189 visites / 30 j, mesuré le 27/07 à 20 h).
   Et **108** occurrences de `hover:` sans `md:`, pas 118 — recomptées par
   l'Atelier le soir même.

#### Problèmes ouverts, après correction
- **0 testeur** sur les 12 requis (P1) · **mentions légales incomplètes** (P1,
  arbitrage du Patron) · **déclaration ARTCI** (P1, invérifiable par les bureaux)
- PHP 8.1 en fin de support · balayage `hover:`/`md:` · sourcing d'annonces

#### Leçon de méthode
Une synthèse vaut ce que vaut le journal qu'elle lit. Celui-ci n'avait pas été
tenu depuis le 26/07, et le Secrétariat a produit une image de la semaine
périmée de vingt-quatre heures — sur les points précis que la journée avait
justement réglés. **Le journal se tient le jour même, ou la synthèse ment sans
le savoir.**

---

## 28/07/2026 — Le cycle de vie d'un annonceur, et les recettes du site

### Ce qui a été livré

**Cycle de vie des publicités (Développement).** Un annonceur avait payé et
n'avait reçu aucun e-mail — ni accusé de réception, ni validation. Le circuit
couvre désormais six moments : réception, mise en ligne (avec la date **et
l'heure** de fin), refus **avec motif**, rapport d'audience tous les 3 jours,
rappel la veille de la fin, bilan après expiration. Deux tables neuves :
`ad_stats` (vues et clics agrégés par jour) et `ad_mails` (journal des envois).

**Prolongation.** Une bannière en cours peut être prolongée : les jours achetés
s'ajoutent à la date de fin **existante**, pas à la date du paiement. Aucun jour
payé n'est perdu, l'affichage ne s'interrompt pas, et la demande est fondue dans
la bannière d'origine (statut `merged`) au lieu d'ouvrir une seconde bannière.

**« Mes publicités »** dans le compte : dépense, affichages, clics, coût pour
1 000 vues, graphique jour par jour et historique de chaque campagne.
`/pub/:id` montre ces chiffres à son seul annonceur.

**Recettes du site (onglet Administration, propriétaire uniquement).**
Publicités encaissées + dons, total, et une colonne de pointage « retrouvé sur
le relevé Mobile Money ».

### Ce qui a été trouvé en vérifiant

1. **Les statistiques d'une publicité étaient publiques.** N'importe qui pouvait
   lire l'audience d'un annonceur — son concurrent compris — sur une page
   indexable. Route restreinte au propriétaire (ou à un administrateur).
2. **Une prolongation payée n'entrait pas dans le total dépensé.** Un annonceur
   ayant versé 6 000 F en lisait 2 000. Le statut `merged` était exclu de la
   somme.
3. **Le premier rapport d'audience partait trop tôt.** `last_report_at` restait
   vide à l'activation : le rapport suivait de quelques heures le « c'est en
   ligne », chiffres à zéro. Il est désormais daté de la mise en ligne.
4. **La reprise des anciens paiements se rejouait à chaque requête** et
   re-cochait ce que le propriétaire venait de décocher. `pay_confirmed` a
   maintenant trois états — jamais tranché / retrouvé / cherché et absent — au
   lieu d'une simple date.
5. **Le relevé du cron ne distinguait pas « rien à envoyer » de « la messagerie
   est tombée ».** Compteur `echecs` ajouté.

### Ce que le site ne peut pas savoir, et qu'il ne faut pas prétendre

**Les dons ne laissent aucune trace ici.** La page `/don` affiche un numéro
Mobile Money ; l'argent va du téléphone du donateur à l'opérateur, sans jamais
passer par Chap.ci. Aucun code ne peut les compter. Ils se relèvent sur le
compte Mobile Money et s'inscrivent à la main. De même, **aucune API Orange
Money ou Wave n'est branchée** : la confirmation « cet argent est bien sur le
compte » est et reste un pointage manuel. Un bureau qui écrirait le contraire se
tromperait.

### Problèmes ouverts (inchangés)
- **Testeurs : nombre INCONNU depuis le dépôt** (P1) · canal de test fermé toujours
  pas créé. Correction de ma propre écriture du matin, qui annonçait « 2 testeurs » :
  le Patron m'avait transmis deux adresses, mais je lui avais moi-même dit que je ne
  pouvais pas les inscrire — seule la Play Console le peut. Deux adresses reçues ne
  sont pas deux testeurs inscrits. Le dernier chiffre VÉRIFIÉ est celui du tableau de
  bord Play collé le 27/07 : « 0 testeur actuellement inscrit ». Aucun bureau ne peut
  lire la Play Console : le seul énoncé honnête est « à vérifier par le Patron ».
- **mentions légales incomplètes** (P1, arbitrage du Patron) · **ARTCI** (P1)
- Catalogue : 3 annonces, 1 vendeur, 1 commune — le vrai goulot, et il ne bouge
  pas.

---

### 2026-07-28 13:30 — [Croissance] 📣 Le Crieur, ronde traitée

**Vérifié et confirmé.** Catalogue : 4 annonces (contre 3 depuis trois rondes),
2 vendeurs (« Grâce colombe », « Flan sahi »), 2 communes (Bingerville + **Cocody**,
première annonce hors Bingerville), 2 catégories. Sitemap : 350 URL. robots.txt :
`Allow: /` + `Sitemap:` présents. Le premier mouvement du catalogue depuis le 23/07.

**Trois corrections.**

1. **`inconnu` ≠ « anonyme ».** Le Crieur lit « /publier : 139 vues → 1 connecté,
   5 visiteurs, 133 inconnus » et conclut que « l'écrasante majorité des vues sont
   anonymes — le mur est la création de compte », puis transmet cette déduction aux
   bureaux Support et Données. C'est la faute déjà corrigée le 27/07. Les 133
   « inconnu » sont des lignes écrites **avant** le drapeau `authed` (26/07 au soir) :
   elles ne sont pas anonymes, elles sont **muettes**. Preuve arithmétique : ce chiffre
   valait déjà 133 le 27/07 et n'a pas bougé — c'est un stock figé, pas un flux.
   L'échantillon réellement mesuré est **6 vues** (1 + 5). On ne conclut rien sur un
   mur avec six observations. Prompt du bureau corrigé : lecture des trois colonnes,
   seuil de 30 vues avant toute déduction.

2. **`STORE-LISTING.txt` n'était pas en erreur.** Le Crieur propose de corriger
   « l'explorateur affiche 3 annonces » en 4. Or ce fichier décrit **ce que montrent
   les captures**, pas l'état du catalogue — et la capture montrait bien 3. Sa
   correction aurait introduit le mensonge qu'elle prétendait retirer. Le vrai défaut
   était ailleurs : la capture était périmée. Elle a été refaite (4 annonces, 2
   communes, grille pleine), et le texte suit.

3. **Comparaison de prix bancale.** « 30 000 F contre 15 000–18 000 F sur Jiji et
   CoinAfrique » : les quatre annonces de Chap.ci sont déclarées **neuves**, et le
   rapport ne dit pas l'état des annonces comparées. Un modèle neuf plus cher qu'un
   modèle d'occasion n'est pas une anomalie. À reprendre à état égal, ou à ne pas
   énoncer.

**Point d'infrastructure à ne pas classer « neutre ».** Cloudflare a inséré un bloc
géré dans `robots.txt` : `Content-Signal: search=yes,ai-train=no,use=reference`, plus
un `Disallow: /` pour GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider,
meta-externalagent, Amazonbot et Applebot-Extended. Le référencement Google classique
n'est pas touché — mais **Chap.ci est désormais absent des réponses des assistants
IA**, y compris des aperçus IA de Google (c'est ce que gouverne `Google-Extended`).
Pour une place de marché qui cherche à être trouvée, c'est un arbitrage de croissance,
pas un détail d'hébergement. **Décision à prendre par le Patron**, dans les deux sens.

**Idée retenue :** viser « huile rouge bio Bingerville » plutôt que « Vans Cocody »,
déjà tenu par Jiji et CoinAfrique. Longue traîne locale, sans concurrent direct connu.

---

### 2026-07-28 15:45 — [Livraison] Le canal de test FERMÉ existe enfin

Première fois depuis l'ouverture du compte développeur. Release **v1.4
(versionCode 5)** créée en test fermé, liste de diffusion « Ange » (13 adresses),
envoyée pour examen.

**Rappel de ce qui vient de changer dans le calendrier du projet.** Jusqu'à cet
après-midi, aucune version n'avait jamais atteint le circuit qui compte : la v1.1
était morte en brouillon, la v1.2 n'avait jamais été téléversée, la v1.3 était
partie en test *interne* — lequel ne compte pas dans le quota de Google. Le
compteur des **12 testeurs × 14 jours consécutifs** ne pouvait donc pas démarrer.
Il peut maintenant.

**Pourquoi une v1.4 le jour même de la v1.3.** Le test fermé engage douze
personnes pendant quatorze jours. Leur faire garder une version dont on savait
déjà qu'elle portait de faux logos (WhatsApp en émoji, Orange Money en cercle
inventé) et une promesse fausse sur la page de don n'avait pas de sens. Un build
de plus coûte cinq minutes ; quatorze jours sur une version périmée, non.

**Ce qui reste, et qui ne dépend plus du dépôt.** Les treize personnes doivent
**cliquer le lien d'invitation et accepter** : figurer sur la liste ne les inscrit
pas. Le compteur démarre au douzième inscrit et **repart de zéro** si l'un se
désinscrit — ce n'est pas −1, c'est zéro. Avec 13 adresses pour 12 requis, la
marge est d'une seule personne ; viser 15 ou 16.

**À l'attention de tous les bureaux :** le chiffre « 0 testeur » cité dans les
rondes précédentes reste le dernier chiffre VÉRIFIÉ (tableau de bord Play du
27/07). Aucun bureau ne peut lire la Play Console. Tant que le Patron n'a pas
collé un relevé, le seul énoncé honnête reste « à vérifier ».

---

### 2026-07-29 01:15 — [Confiance & Sécurité] 🛡️ Le Gardien, ronde traitée

**Ronde saine et bien menée.** Santé verte, 0 IP suspecte, `failRatio` 0, comptes
admin intègres, file de modération vide, fichiers `/api/` toujours en 404. Le
scan de code des deux fonctionnalités du 28/07 est juste : la gate propriétaire
sur `admin/revenues` et la restriction de `ads/:id/stats` sont bien ce qu'il
décrit.

**Sa proposition n° 2 était bonne, et elle est appliquée.** `POST
admin/ads/:id/reject` documentait un motif « OBLIGATOIRE » et acceptait le vide.
Le serveur exige désormais 5 caractères. Un commentaire qui ment est pire que
pas de commentaire : le prochain lecteur s'y fie.

**Sa proposition n° 1 portait sur un vestige.** Il demande d'autoriser quatre
origines CSP ; **trois l'étaient déjà** depuis le 27–28/07
(`region1.google-analytics.com` via `*.google-analytics.com`,
`analytics-ipv6.tiktokw.us`, `accounts.google.com` en `style-src`). Vérifié sur
l'en-tête réellement servi par chap.ci, pas sur le dépôt.

**La faute n'est pas la sienne, elle est dans l'outil.** `cspViolations` servait
`SELECT … FROM csp_reports ORDER BY n DESC` — **sans aucune borne de temps**. La
table est un compteur cumulé depuis le 27/07 : le « n » d'une origine corrigée
ne redescend jamais. Le champ se lisait comme l'activité du jour ; c'était un
registre historique.

C'est **exactement la même erreur de nature** que `inconnu` lu comme « anonyme »
le 28/07 : un stock figé pris pour un flux. Deux bureaux différents, deux
champs différents, une seule cause — un compteur cumulé servi sans fenêtre.
Corrigé à la source plutôt que dans le rapport : `cspViolations` ne renvoie plus
que les 7 derniers jours (avec `cspFenetreJours` et `last_at`), et le cumul est
désormais nommé `cspViolationsHistorique`. Une origine corrigée disparaît d'elle-
même du relevé — sans purge, sans mémoire à tenir.

Prompt du bureau complété : vérifier l'en-tête servi (`curl -sSI`) **avant**
d'écrire une proposition d'autorisation, jamais après.

**Retenu de son rapport :** `static.cloudflareinsights.com` est bien nouveau et
légitime — c'est Cloudflare qui l'injecte. Ajouté à `script-src`, avec la note
qui manquait : le refuser ne le fera pas disparaître, il faudrait couper Web
Analytics dans le tableau de bord Cloudflare. C'est une décision du Patron.

**Réserve sur un raisonnement.** Il rattache la sonde `exemple-de-test.invalid`
à « l'audit externe mentionné dans le commit `c2a847d` ». Ce commit corrige une
énumération d'utilisateurs sur la connexion : rien à voir avec une sonde CSP.
La conclusion (ce n'est pas une attaque) est juste — le TLD `.invalid` ne résout
nulle part, aucun script n'a pu s'exécuter — mais elle est juste par chance.
Une coïncidence de dates n'est pas un lien de cause.

---

### 2026-07-29 02:10 — [Design & Typographie] 🎨 L'Atelier, ronde appliquée

**Les sept points sont exacts et tous appliqués.** Le bureau a travaillé sur le
code faute de pouvoir atteindre le rendu (403 du proxy de session), et il a
prévenu — mention correcte, aucune conclusion tirée d'un rendu supposé.

**Cibles tactiles (P1).** Trois boutons flottants de la fiche annonce (retour,
partager, favori) mesuraient 40 px ; les boutons « Retour » de la messagerie et
de la conversation n'avaient aucune dimension explicite (≈30 px réels) ; l'œil
du mot de passe de l'inscription était à 36 px. Tous portés à 44 px, avec le
retour tactile `active:scale-90` déjà en place sur le cœur de `ListingCard`.

L'argument le plus juste de son rapport n'est pas « c'est sous le seuil » mais
**« c'est plus petit que le bouton IDENTIQUE déjà corrigé sur `Profile.tsx` »**.
Ce n'était pas un manque, c'était un écart interne — et un écart se corrige sans
arbitrage.

**Contraste (P2).** `text-gray-400` (≈2,6:1 sur blanc) sur trois textes qui
PORTENT DU SENS : les libellés d'attributs de la fiche (« État », « Livraison »),
le lien « élargir la recherche » — **seule issue** d'une recherche sans
résultat — et le bouton « Signaler cette annonce ». Passés en `gray-500`.

**Vérifié dans un vrai navigateur, pas sur le code** — parce qu'écrire `h-11` ne
prouve pas 44 px :

| Mesure | Résultat |
|---|---|
| Retour · Partager · Favori (fiche) | **44 × 44 px** |
| Retour (messagerie) | **44 × 44 px** |
| Contraste du libellé « État » | **4,83:1** — au-dessus du seuil AA de 4,5 |

Le chiffre annoncé par le bureau (« ≈4,8:1 ») était juste au centième près.

**Ce qu'il faut lui garder.** Il cite `ListingCard.tsx` comme modèle : cible
tactile réelle de 44 px sur le `<button>`, badge visuel de 32 px sur le `<span>`
à l'intérieur. C'est la bonne façon de garder un repère fin à l'œil sans
sacrifier le pouce, et c'est la règle à appliquer aux prochains boutons
flottants.

**Chantiers ouverts, inchangés :** `hover:` sans `md:` (~106-113 occurrences, en
attente d'arbitrage du Patron) ; tri des `text-gray-400` restants (162 après ce
lot, à raison de 2-3 fichiers par ronde — la consigne de ne PAS faire de
remplacement global tient, la majorité étant du décor légitime).

**Signalé au passage, hors périmètre Design :** le catalogue est passé à
**7 annonces et 3 vendeurs** (contre 4 et 2 la veille), avec deux catégories
neuves — un pantalon et un terrain à 2 000 000 F. Premier mouvement soutenu
depuis la création des bureaux.

---

### 2026-07-29 13:50 — [Confiance & Sécurité] 🛡️ Le Gardien, ronde du matin traitée

**Son signalement est juste, et sa méthode est la bonne.** Il constate que le
commit `683213a` n'est pas en production et le prouve par **deux relevés
indépendants** : l'en-tête CSP servi ne contient pas `static.cloudflareinsights.com`,
et les champs `cspFenetreJours` / `cspViolationsHistorique` sont absents de la
réponse du cron. Vérifié : exact.

C'est aussi l'application immédiate de la consigne ajoutée hier soir — vérifier
l'en-tête SERVI plutôt que le dépôt. Elle a servi dès la ronde suivante.

**La leçon qu'il formule est la bonne, et elle mérite d'être retenue :
« corrigé dans le dépôt » n'est pas « corrigé en production ».** Le journal du
29/07 01:15 écrivait « corrigé à la source » — c'était vrai du code, pas du site.
Formulation à surveiller : tant qu'un zip n'est pas extrait, un correctif serveur
n'existe que sur GitHub.

**Sa note au Développement est en revanche infondée.** Il écrit que l'écart
« concerne aussi vos livraisons du jour (cycle de vie pub, recettes admin) — à
vérifier qu'elles sont bien en ligne ». Vérifié : elles le sont. `/api/ads/mine`
et `/api/admin/revenues` répondent « Non authentifié » (donc la route existe),
`/api/ads/:id/stats` répond « Publicité introuvable ». Il a généralisé un commit
non déployé en un doute sur l'ensemble, sans faire le test qui tranchait en dix
secondes — le même test qu'il venait pourtant d'exécuter deux fois. Un doute
énoncé sans vérification coûte plus cher qu'un silence.

**Ce qu'il n'a pas vu, et qui était plus gênant.** Le lot non déployé ne contient
pas seulement `683213a` : il contient aussi **`9a65ff5`**, qui corrige une phrase
FAUSSE encore servie en production. La page d'accueil annonce toujours aux
moteurs et aux assistants IA que publier une annonce se fait « avec ou sans
compte », alors qu'un compte est obligatoire. Vérifié ce jour : la formulation
fautive est en ligne, la correction ne l'est pas.

C'est plus grave que l'écart CSP qu'il signale — le Patron s'apprête à payer une
publicité Facebook pour amener des vendeurs. Une promesse « sans compte » suivie
d'un mur de connexion, c'est le clic payé puis perdu.

**Enseignement pour le bureau :** quand un écart dépôt/production est constaté,
énumérer TOUS les commits en attente (`git log`), pas seulement celui qu'on
cherchait. L'écart le plus coûteux est rarement celui qu'on avait en tête.

**Zip fabriqué et remis au Patron** : `9a65ff5` + `683213a` + `c1f21ea`.

---

### 2026-07-30 — [Direction] Création du bureau 🔒 Sécurité du code (Le Serrurier)

**Pentest complet du backend, méthode « à la Strix » (agent + exécution réelle).**
PHP 8.4 disponible en session : le code a été rejoué, pas seulement lu. Cible : le
code, jamais la production. Verdict d'ensemble : **les fondamentaux tiennent.**
Audités et solides — injection SQL (requêtes préparées partout), contrôle d'accès
/ IDOR (propriété vérifiée sur chaque route, messages réservés aux participants,
`/admin/*` derrière un point de contrôle central + `admin_can`), upload (extension
déduite du contenu réel, SVG assaini, `.htaccess` anti-exécution), authentification
(JWT à temps constant sans confusion d'algorithme, OTP bcrypt plafonné + double
rate-limit, login 8/15 min, énumération fermée), CORS (`*` réécrit en origine
unique), en-têtes (nosniff, X-Frame-Options, HSTS, CSP) et cookie de session
(HttpOnly + Secure + SameSite=Lax).

**Une faille réelle trouvée et corrigée — XSS stockée (haute).** `web/seo.php`,
bloc JSON-LD : le titre et la description d'annonce entraient dans un
`<script type="application/ld+json">` encodé avec `JSON_UNESCAPED_SLASHES`, ce qui
désactivait la protection native de PHP (`/` → `\/`). Un titre contenant
`</script><script>…` refermait la balise et exécutait du code dans l'origine
`chap.ci`, chez quiconque ouvrait le lien d'annonce partagé (ou un robot). PoC
rejoué et confirmé. Corrigé par `JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS |
JSON_HEX_QUOT` (sans `JSON_UNESCAPED_SLASHES`) — commit **efb4760**, branche
`claude/ci-marketplace-mobile-app-bnllro`. Cookie de session HttpOnly : pas de vol
direct de session, mais action same-origin possible → gravité **haute**.
**Pour le Monteur : `web/seo.php` DOIT partir au prochain zip — sinon la faille
reste ouverte en ligne.**

**Nouveau bureau : 🔒 Le Serrurier** (`routine-serrurier.md`). Revue de code
profonde, **hebdomadaire** (lundi 5 h), routine « avec code », **sans aucun
secret** (il ne touche à aucune route protégée ; `/api/health` suffit). Il reprend
le volet *audit de code profond* — autrefois « mensuel » chez le Gardien — et le
fait chaque semaine : diff complet de la semaine + un sous-système fouillé par
rotation (six semaines couvrent toute la surface). Le Gardien garde la
surveillance vivante et la modération. Frontière écrite dans les deux prompts pour
éviter les doublons. `BUREAUX.md` et `ROUTINES-WEB.md` mis à jour (9 bureaux,
10 prompts).

**Pour le Patron** : rien n'est déployé (ni zip, ni AAB). La correction XSS vit
sur GitHub ; elle atteindra chap.ci au prochain zip. Le Serrurier est prêt à
coller dans claude.ai/code/routines quand vous voudrez l'activer.

---

### 2026-08-05 — [Direction] Rattrapage du journal : six jours et 43 commits

Le Gardien a signalé cette nuit que `JOURNAL.md` s'arrêtait au 30/07 alors que le
dépôt avait avancé jusqu'au 05/08. Il avait raison : **43 commits** manquaient.
Le Secrétariat n'a pas l'accès écriture ; c'est le Développement qui rattrape.

Ce bloc résume les six jours. Le détail de chaque changement est dans son message
de commit — ils sont écrits pour être lus.

**01/08 — Les formulaires d'annonce, et la première version qui atteint des testeurs.**
Les 82 schémas de sous-catégories entrent dans l'application ; 15 catégories
deviennent 13, et le sitemap perd les 46 URL des deux fusionnées (`15a0fe1`,
`54f3a9e`, `691a375`). Un second point d'injection JSON-LD est fermé dans la
foulée du premier (`fdd3251`). **v1.9 déployée en test fermé — la première à
atteindre de vrais testeurs** (`ff56661`). Trois blocages trouvés AVANT eux, dont
un qui aurait figé le compteur (`08643ee`). Trois photos deviennent le minimum
pour publier, dans l'écran **et** dans la route serveur (`e1a07b7`).

**02/08 — La journée la plus dense : l'app maigrit, la comptabilité naît.**
v1.11 corrige un manifeste Android qui ajoutait « GPS obligatoire » tout seul et
excluait 7 appareils (`a753aad`). Le démarrage passe de 221 à 133 Ko compressés
(`9ac4d76`), R8 retire 83 % du code mort (`0911311`), et une page blanche sur lien
d'annonce ouvert à froid — React #310 — est corrigée (`ccb4191`). **La
comptabilité arrive : un grand livre complet, réservé au propriétaire**
(`b7709d1`), suivi de la purge des annonces sans photo (`b93aa7a`). Côté
sécurité, `cron_fail` apprend à dire POURQUOI une clé est refusée (`8432b01`,
`6c4d011`) — puis le marqueur « externe » est retiré dans l'heure, parce qu'il
mentait derrière Cloudflare (`7740b31`). **PHP 8.5 en production** : chantier
classé, audit complet, deux obsolescences réelles corrigées et dix-sept colonnes
fantômes déclarées (`8a8cb81`, `4781b96`). Et une seconde rendue à l'utilisateur
au démarrage (`0d3e3ce`, `057db9d`).

**03/08 — Onze heures d'API à terre, et ce qu'on en a tiré.**
La matinée : trois empreintes sur `/api/health` au lieu d'une, parce qu'une seule
mentait (`eb6fdb8`) ; les vignettes cessent d'être différées quand on les voit
déjà (`99e9792`) ; six routines raisonnaient sur une app vieille de quinze builds
(`5d9b169`) ; l'état Play est enfin lu dans la console, et il est pire que ce
qu'on croyait (`d39cddd`). Puis `d034aa7` — la saisie de « Publier » ne se perd
plus, et les champs obligatoires se voient.
**Le déploiement de ce commit a coupé l'API pendant onze heures.** Cause :
cPGuard, l'antivirus de l'hébergeur, mettait `api/index.php` en quarantaine à
chaque installation sous la signature
`{HEX}Malware.Expert.php.file.put.contents.php`. Le fichier était supprimé
quelques secondes après chaque extraction de zip comme après chaque téléversement
direct. La matinée est partie à deviner — l'endroit, les droits, le nom, la
taille, le quota — et la panne n'a cédé qu'une fois construite une boucle serrée :
un témoin de 5 octets déposé à côté du fichier suspect, puis un script écrivant
462 004 octets de commentaires et regardant six secondes plus tard s'ils tenaient.
Vingt minutes après cette boucle, la cause était nommée.
Le code avait sa part : `admin/smtp` faisait écrire par PHP un fichier `.php`
exécutable dans le dossier servi par le serveur — le geste type d'une porte
dérobée. Les réglages SMTP sont devenus des données inertes dans
`api/data/smtp.json` (`16df821`). Le site est remonté par le bouton **Disable**
de cPGuard, pas par ce correctif : les deux sont vrais, il ne faut pas croire que
le second aurait suffi.

**04/08 — Le dépôt se documente, et l'Atelier passe.**
`CLAUDE.md` et `CONTEXT.md` créés — le dépôt n'en avait aucun, chaque agent
re-déduisait l'architecture et se trompait (`e400155`). Le même commit sort les
blocs recopiés dans quatre à six routines vers `.claude/bureaux/COMMUN.md` et
retire les chiffres figés : six routines portaient « 3 annonces actives,
1 vendeur » depuis le 25/07 alors que le catalogue en comptait plus du double.
Le README décrivait encore un site sur Supabase et GitHub Pages, avec cinquante
lignes de mode d'emploi vers des fichiers qui n'existent plus ; et
`GUIDE-CONNEXION-GOOGLE-APPLE.md` donnait des valeurs qui casseraient la
connexion Google si on les suivait (`9b1946c`). Trois skills reprises de
`mattpocock/skills` (MIT), dont `diagnostic-panne`, l'adaptation française de
`diagnosing-bugs` — la boucle rouge/vert avant toute hypothèse (`3ed67ba`).
Les sept propositions de 🎨 L'Atelier appliquées après vérification ligne à ligne :
six textes passent de 2,54:1 à 4,83:1 de contraste, et l'écran Comptabilité cesse
de couper ses montants en deux (`87fe6bb`, `57f2bf2`).

**05/08 — Une vérification qui ne pouvait pas échouer, encore.**
Le Gardien a déclaré « les trois empreintes sont cohérentes » alors qu'un
déploiement entier manquait. Cause : `dist/` est dans `.gitignore` — sur un clone
frais, la comparaison qu'on lui demandait était impossible, et rien ne l'en
avertissait (`9135ef2`).

**Ce qui reste ouvert, et qui n'est pas technique.**
La release **18 (1.17)** est toujours en brouillon dans la Play Console. Dix-huit
invités attendent un test jamais envoyé pour examen, et le compte à rebours des
14 jours ne démarre qu'à ce clic. Aucun chantier de ce journal ne raccourcit ce
délai.
Le zip du front du 04/08 (`empreinteSite` attendue `ec6e7f1bfd1e`) n'est pas
déployé : la production sert encore `e36b1578fcb7`, déposé le 03/08 à 09h24.
Un ticket reste à ouvrir chez l'hébergeur pour l'exclusion permanente de
`api/index.php` dans cPGuard — « Disable » est un réglage du panneau, pas une
garantie.

### 2026-08-07 — [Direction] Trois rondes du Gardien, une seule question restée

**Les rondes du 6 et du 7 août sont vertes.** Santé 200, PHP 8.5.7, aucun écart
dépôt/production sur les trois empreintes, 0 IP suspecte, `failRatio` 0, intégrité
des comptes admin intacte, CSP sans nouvelle origine, file de modération vide, les
treize tâches planifiées avec un passage récent cohérent. Le cloisonnement des
secrets a été re-testé de bout en bout : clé cron sur `/mod/queue` → 401, jeton de
modération sur `/cron/stats` → 403.

**Ce qui a été trouvé, et corrigé le jour même.** La ronde de 15 h 48 a relevé que
les routes `team/threads`, livrées le matin, gardaient l'accès avec `is_admin()`
seul — un modérateur sans la case « Utilisateurs » y lisait le nom et l'adresse
e-mail de tout membre ayant écrit à l'assistance, alors que la fiche d'un compte
les réserve à cette case. Le Gardien avait raison. Corrigé par `bb1ee81` :
l'identité passe derrière `admin_can(…, 'users')`, l'accès au fil et la réponse
restent ouverts à toute l'équipe — c'est une boîte partagée, et un modérateur dont
le métier est de répondre doit pouvoir répondre. Vérifié sur trois rôles réels
avant d'être annoncé.

**Ce qui est allé au-delà du signalement.** Le correctif est parti dans le zip de
la rubrique scolaire, déployé le 6 au soir : la ronde de 00 h 46 l'a retrouvé en
production sans qu'on ait eu à le lui dire. C'est exactement ce qu'une empreinte
sert à prouver.

**LA QUESTION QUI EST REVENUE TROIS FOIS : `admin_unlock_fail`.** Quatre échecs de
déverrouillage en 24 h, au-dessus du seuil de 3, remontés le matin, l'après-midi
ET la nuit — pour le même événement. Le Patron avait confirmé dès la première :
« c'est moi qui fais les tentatives ». Aucune IP suspecte, aucun `rate_limited`,
comptes intègres, et des déverrouillages réussis le même jour.

Ce n'est pas la faute du Gardien : rien dans sa routine ne lui disait quoi faire
d'une alerte déjà expliquée. Une consigne a donc été ajoutée à
`routine-securite.md` — trois vérifications (IP suspectes vides, rate-limited à
zéro, déverrouillage réussi le même jour), et si les trois passent, une ligne au
lieu d'un point ouvert. Le seuil reste bas exprès : le code du propriétaire expire
en soixante secondes, le manquer deux fois est le comportement normal d'une
journée de travail.

**Une question déjà répondue qui revient est du bruit, et le bruit finit par
masquer le vrai signal.** C'est le seul enseignement de ces trois rondes.

**Pour 📣 Le Crieur** — la rubrique « École & Fournitures » est en ligne depuis le
6 août au soir. Le plan du site la porte déjà : 379 adresses au total, dont 23
pages « Vendez vos fournitures scolaires à … », une par ville, vérifiées servies
en production. Rien à ajouter côté sitemap ; les mots-clés de la rentrée
(cahiers, cartable, uniforme kaki, annales CEPE/BEPC/BAC) sont dans les schémas.

### 2026-08-07 — [Design & Typographie] 🎨 L'Atelier, ronde appliquée en entier

**Les cinq propositions sont reprises, après vérification de chacune dans le code.**
Rien n'a été appliqué sur la foi du rapport : les cinq lignes citées ont été
relues, et les cinq étaient exactes.

**Le bandeau de la fête touchait `y=0`.** Avant le 5 août, l'en-tête orange était
le premier élément de l'accueil, et c'est lui qui portait `safe-top`. Le bandeau
« Fête de l'Indépendance » a été inséré au-dessus sans reprendre la classe : sur
un téléphone à encoche, il passait sous la barre d'état, le jour de l'année où il
est le plus regardé.

L'Atelier a annoncé un correctif « borné dans le temps, la fête se termine à
minuit ». **C'est plus large que ça, et c'est ce qui justifie de le corriger
calmement plutôt que dans l'urgence :** `festiveMode()` ouvre la fenêtre du
1ᵉʳ au 10 août — le bandeau vit encore trois jours. Et le défaut n'est pas
festif : il appartient au PREMIER élément de la page, quel qu'il soit. Un
commentaire le dit désormais à l'endroit exact où quelqu'un insérera la prochaine
chose au-dessus de cet en-tête.

**L'écran Publier n'avait pas `safe-top` non plus** — et celui-là est permanent.
C'est l'écran qui fabrique les annonces ; `Favorites.tsx` avait déjà été corrigé
pour exactement la même raison. Le vrai P1 de cette ronde, c'était lui.

**Six textes remontés de `gray-400` à `gray-500`** — de 2,5:1 à 4,8:1, la même
teinte que les six textes corrigés le 4 août. Ce ne sont pas des ornements : le
message « annonce de démonstration » qui pousse à publier, le compteur de photos
qui dit si le seuil des trois est atteint, et le rappel « regardez vos
indésirables » — la seule aide de quelqu'un dont le code n'arrive pas.

**Sept espaces insécables** posées avant `?` et `!`, dont celle du bandeau du
jour. Vérifiées à l'octet (`U+00A0`), pas à l'œil : une espace ordinaire y
ressemble exactement.

**Ce qui n'est PAS fait, et pourquoi.** Cinq `text-gray-400` subsistent dans ces
deux fichiers : ce sont des icônes — chevrons, cadenas, bordures — hors du lot de
texte que ce bureau s'était fixé. Le chantier reste ouvert, comme il le dit
lui-même.

**Une note de méthode, pour ce bureau.** L'audit visuel vient d'un rendu local :
Chromium ne peut pas atteindre `chap.ci` depuis ces sessions (le proxy coupe).
L'Atelier l'a écrit noir sur blanc au lieu de laisser croire à une capture de
production — c'est exactement la bonne façon de rendre une vérification partielle,
et cela vaut d'être imité.

### 2026-08-07 — [Croissance] 📣 Le Crieur : le catalogue bouge enfin

**Neuf annonces, cinq vendeurs, cinq communes, cinq catégories** — contre 7 / 3 /
2 / 2 le 29 juillet. Premier mouvement soutenu depuis dix jours. La rubrique
« École & Fournitures », ouverte la veille au soir, a déjà son premier signe de
vie : un don de fournitures scolaires à Koumassi.

**Un point marchandise, pas un point SEO, et il mérite un œil.** Un terrain à
Treichville affiché à **2 000 000 FCFA**, quand le marché local va de 40 à 600
millions. Trois lectures possibles : une toute petite parcelle — mais aucune
superficie n'est renseignée —, une erreur de saisie, ou l'appât classique de
l'arnaque foncière. À vérifier avant qu'un acheteur ne se déplace.

**La fiche Play publique répond 404, et c'est normal** : une application en test
fermé n'a pas de page publique. Le Crieur l'a correctement classé « comportement
attendu » au lieu d'en faire une panne — en s'appuyant sur `APP-VERSIONS.md`, qui
disait déjà que la publication concernait le canal de test et pas la production.
Le journal a servi à ça.

### 2026-08-07 — Les notifications sortent du site

**Ce qui manquait.** La cloche existait depuis longtemps, et elle ne prévenait
personne : elle ne s'anime que pendant qu'on regarde le site. Un vendeur qui
ferme son navigateur ne savait qu'un acheteur l'avait contacté qu'à sa visite
suivante — un jour plus tard, deux jours plus tard, jamais.

**Ce qui est posé.** Trois voies, et il faut les distinguer :

| Voie | Atteint qui | Quand |
|---|---|---|
| la cloche | ceux qui sont sur le site | tout de suite |
| le push | les appareils abonnés | téléphone verrouillé, navigateur fermé |
| l'e-mail de repli | tout le monde | si ni l'un ni l'autre n'a marché |

`notify()` écrit la cloche puis **empile** ; le vidage a lieu après la réponse
(`register_shutdown_function` + `litespeed_finish_request`). Personne n'attend
les serveurs de Google au milieu d'une action. Si aucun appareil n'a été touché,
l'e-mail part — pour `message` et `listing` seulement, si la personne n'a pas été
vue depuis quinze minutes, et au plus une fois par demi-heure.

**La boucle rouge/vert a été construite AVANT le code, comme le veut la maison.**
Le chiffrement d'une notification produit des octets illisibles : une erreur d'un
seul bit donne un message que le navigateur rejette en silence, et l'on ne
saurait jamais pourquoi. La RFC 8291 §5 publie un vecteur d'essai complet — clés,
sel, texte clair, résultat attendu octet pour octet. `npm run banc:push` le
rejoue, puis charge le vrai `push-sw.js` dans un faux service worker pour vérifier
que le PHP et le JavaScript nomment les mêmes champs. Les deux bancs sont verts,
et le premier l'a été du premier coup.

Par-dessus, un banc de bout en bout (hors dépôt) : un vrai serveur Chap.ci local,
un faux relais qui joue `fcm.googleapis.com`, un faux navigateur qui déchiffre.
Trente-neuf vérifications, dont le vrai cas — un acheteur écrit, le vendeur reçoit
la notification chiffrée sur son appareil. C'est là qu'ont été trouvés deux
défauts que la relecture n'aurait pas vus : le jeton VAPID oubliait le port dans
son auditoire (invisible en production, où tout est en 443), et l'abonnement d'un
compte supprimé survivait au compte.

**Une décision à retenir.** `push_subs` est **délibérément absente** de
`export_all()`. Chaque ligne contient les deux clés qui permettent de faire
apparaître une notification sur un téléphone précis : les mettre dans un fichier
téléchargeable donnerait à qui l'obtient le pouvoir d'écrire au nom de Chap.ci
sur l'écran des inscrits. Et rien ne se perd — au premier passage, le navigateur
se réabonne tout seul.

**Ce qui n'est pas fait, et pourquoi.** L'application Android ne reçoit pas ces
notifications : la WebView d'Android n'implémente pas l'API Push. L'y amener
demande Firebase et une nouvelle version sur le Play Store. L'écran de réglage le
dit aux gens en toutes lettres, au lieu de leur montrer un bouton qui ne ferait
rien.

**Et trois choses au tableau de bord**, celles que le Patron avait retenues : le
**Parcours** (venus → inscrits → ont publié → ont vendu, avec la marche qui coûte
le plus), le filtre **« Sans annonce »** dans Utilisateurs, et sept **modèles de
message** dans « Écrire à ce membre ». Les trois se répondent : le Parcours
désigne la fuite, le filtre donne la liste, le modèle écrit la première phrase.

### 2026-08-07 (soir) — « Vérification… », et ce que le banc a rattrapé

**La panne.** Le bloc « Sur cet appareil » restait sur « Vérification… », sans
fin, chez le Patron. Aucune erreur, aucune trace, rien dans la console.

**La cause, et elle était chez moi.** `navigator.serviceWorker.ready` ne rejette
jamais **et ne se résout jamais** tant qu'aucun worker n'est actif. Mon écran
l'attendait sans filet. Le cas se produit vraiment ici : un lien chap.ci ouvert
depuis WhatsApp ou Facebook s'affiche dans le navigateur intégré de
l'application, où `navigator.serviceWorker` existe — donc toutes les détections
de capacité répondent « oui » — mais l'enregistrement n'aboutit pas.

**La boucle d'abord, comme le 3 août l'a appris.** Aucune relecture de code : un
vrai Chromium, le vrai `dist/` servi en local, et un navigateur volontairement
sabordé (`ready` suspendu, `getRegistration` vide, `register` suspendu).
L'écran est resté sur « Vérification… » — rouge, sur exactement la panne
signalée.

**Et le banc a rattrapé mon premier correctif.** Il bornait `ready`… mais pas
`register()`, que le banc suspendait aussi. Deuxième passage : **toujours
rouge**. Sans ce banc, le Patron aurait reçu un correctif qui ne corrigeait
rien, et aurait revu « Vérification… » — la pire des livraisons, celle qui use
la confiance sans rien réparer. La version finale pose **une seule échéance
partagée** par les trois attentes : quoi qu'il arrive, l'écran répond avant six
secondes.

**Le vrai correctif n'est pas le délai, c'est la parole.** Un nouvel état
`sw-absent` nomme la cause, donne la marche à suivre (⋮ → « Ouvrir dans
Chrome »), rappelle qu'un premier passage demande parfois un rechargement, et
offre un bouton « Revérifier ». La prochaine fois, l'écran dira lui-même où ça
coince au lieu de tourner.

**À retenir pour tout le dépôt** : toute promesse du navigateur qui peut rester
suspendue doit être bornée, et tout écran de diagnostic doit avoir un état
« je n'ai pas pu savoir ». Un `.then()` sans `.catch()` sur une promesse qui ne
se règle pas est un écran muet, pas une erreur.

Le banc d'écran vit dans le bac à sable (`pushe2e/banc-ecran.mjs`) : il demande
un serveur PHP local, une base SQLite et Playwright. Il n'entre pas au dépôt —
un banc qui ne peut pas tourner tout seul finit par mentir.

### 2026-08-08 — La fête est rangée

**Le Patron, à 12 h 25 : « la fête est finie aujourd'hui, l'animation doit
disparaître ».** Elle était réglée jusqu'au 10 août — trois jours de confettis
APRÈS l'indépendance, sur un site de petites annonces. Il a raison : une
décoration qui traîne cesse d'être une fête et devient un oubli, et c'est ce que
voit le visiteur.

La fenêtre s'arrête maintenant au petit matin du 8. La nuit du 7 au 8 va
jusqu'à 6 h — un feu d'artifice ne s'éteint pas à minuit pile — puis plus rien.
`isFeteDay()` couvre cette même nuit, sinon le bandeau aurait affiché « J-0 » en
plein feu d'artifice.

**Une bande blanche corrigée au passage, et elle durait depuis toujours.** Le
bandeau vivait dans un conteneur de l'accueil qui portait `safe-top`. Ce
conteneur restait affiché **même quand le bandeau ne rendait rien** — donc onze
mois par an, et aussi après un « Masquer ». Sur un iPhone à encoche, il gardait
sa marge de zone sûre : une bande blanche au-dessus de l'en-tête orange, toute
l'année, pour un élément invisible. `safe-top` est désormais portée par le
bandeau lui-même : elle part avec lui.

La règle générale, écrite dans le commentaire de `Home.tsx` pour la suite :
**la classe qui réserve l'encoche doit suivre le premier élément VISIBLE**, donc
disparaître avec lui. Posée sur un conteneur permanent, elle réserve de la place
pour du vide.

**Vérifié dans un vrai navigateur, pas en relisant :** aucun bandeau, aucune
toile de dessin, en-tête à 0 pixel du haut ; `?fete=b` rallume tout (l'an
prochain fonctionnera) ; horloge avancée au 8 août 3 h → la fête est encore là,
au 8 août 9 h → plus rien.

**La ronde du Gardien de 10 h 55 est verte** — trois empreintes identiques au
dépôt à `105f169c`, zéro incident en 24 h, treize tâches planifiées cohérentes,
cloisonnement des secrets re-testé dans les deux sens. Il reste un seul dossier
ouvert, le terrain de Treichville : signal isolé, laissé visible. Le Patron a
désormais le modèle « Prix qui paraît faux » dans « Écrire à ce membre » — c'est
exactement le cas d'usage pour lequel il a été écrit.

### 2026-08-08 (16 h) — La file de modération se souvient

**Le Gardien a signalé un point d'outillage, et il avait raison sur les faits
mais pas sur la conclusion.** `POST /api/mod/seen` répondait `{"marked":0}` sur
le terrain de Treichville, et le signalement revenait chaque jour bien que la
décision — laisser visible, signal isolé — soit prise depuis deux rondes.

**Ce n'était pas une panne, et le retour quotidien n'est pas un défaut.** Un
signalement ouvert revient tant qu'il n'est pas classé, et c'est la file qui
refuse correctement d'oublier une décision humaine non prise. `mod/seen` ne
classe pas, et ne doit pas classer : clore le signalement d'un humain sur
l'annonce d'un autre appartient au Patron. Le bouton existe depuis le 07/08 —
admin → Signalements → Classer.

**Deux vrais défauts d'outillage, corrigés :**

1. La file ne disait pas au bureau qu'il avait déjà examiné l'annonce. Chaque
   signalement porte désormais `dejaVu`, la date du dernier « examinée-OK ».
2. `{"marked":0}` se lisait comme un échec. La réponse distingue maintenant
   `marked` / `deja` / `total` — rien n'échouait, il n'y avait rien de neuf.

Le `guide` de la file et la routine du Gardien portent la consigne : si `dejaVu`
est renseigné et que rien n'a changé, une ligne — « déjà examiné le JJ/MM,
inchangé » — et on passe.

**La garantie qui compte a été éprouvée, pas supposée.** Le banc tente de
classer le signalement avec le jeton de modération : refusé, et le signalement
reste ouvert après la tentative. Il aurait été facile d'« aider » le bureau en
lui ouvrant cette route ; c'est précisément ce qu'il ne faut pas faire.

Le banc vit dans le bac à sable (`pushe2e/banc-moderation.mjs`) : serveur PHP
local, base SQLite, jeton de service réel. Onze vérifications, vertes.

### 2026-08-08 (21 h) — L'angle mort que mon aide venait de fabriquer

**Livré à 16 h, cassé à 20 h 47, corrigé à 21 h 30 — et c'est la donnée du
Gardien qui l'a montré, pas une relecture.**

À 16 h, j'ai ajouté `dejaVu` à la file de modération pour qu'il cesse de
réanalyser chaque jour le même signalement. Sa ronde de 20 h 47 rapporte :
« terrain de Treichville, `dejaVu` 28/07 — déjà vu, inchangé, aucune nouvelle
analyse refaite ».

**Le signalement date du 07/08. L'examen date du 28/07.** L'examen est antérieur
de dix jours : il ne pouvait pas porter sur le motif du signalement, puisqu'il a
eu lieu avant que quiconque signale. Le bureau venait de sauter une analyse
qu'il n'avait jamais faite — et il l'a fait *correctement*, en suivant la
consigne que je venais d'écrire.

`dejaVu` ne porte désormais une date que si l'examen est **postérieur** au
signalement. Sinon : null. Le guide de la file et la routine du Gardien disent
maintenant en toutes lettres — **null veut dire : analyse, même si l'annonce te
dit quelque chose**.

**La règle générale, et elle dépasse ce champ :** une aide qui fait sauter une
vérification doit PROUVER qu'elle couvre ce qu'on saute. Sinon elle ne fait pas
gagner du temps, elle fabrique un angle mort — et un angle mort vaut moins que
pas d'aide du tout, parce qu'il porte l'autorité d'une vérification.

C'est la sœur de la consigne déjà au dossier : « une vérification doit pouvoir
échouer ». Celle-ci dit : **une dispense de vérification doit pouvoir être
refusée.**

Le banc porte maintenant le cas — examen daté d'avant un signalement — et passe
au rouge si la règle saute. Quatorze vérifications, vertes.

**Ce que le Gardien a bien fait**, et qui vaut d'être noté : il a rendu la date
brute dans son rapport (« `dejaVu` 28/07 ») au lieu d'écrire seulement « déjà
vu ». Sans ce chiffre, le défaut était invisible. Un rapport qui montre ses
données permet de corriger l'outil qui l'a produit ; un rapport qui ne montre
que ses conclusions, jamais.
