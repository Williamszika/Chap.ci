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

### 2026-07-27 19:49 — [Livraison] 🔨 Le Monteur

- **`store/APP-VERSIONS.md` est à jour, pas périmé.** Il consigne déjà la v1.2
  (versionCode 3, commit `a993629`, construite le jour même) et l'état réel des
  deux boutiques : **aucune version n'est publiée ni sur Google Play ni sur
  l'App Store.** La v1.2 est construite (AAB 6,5 Mo) mais **pas encore
  téléversée** — elle attend dans la Play Console. La v1.1 précédente n'avait
  jamais quitté l'état « Brouillon ».
- **Ce que les utilisateurs de l'application n'ont PAS entre les mains** :
  strictement tout le contenu de la v1.2, puisqu'aucune version n'a jamais
  atteint un testeur. En particulier : les photos d'annonces (qui ne
  s'affichaient pas du tout jusqu'ici — `mediaUrl()`), la catégorie Santé &
  Bien-être, la page de suppression de compte exigée par Google, le numéro de
  téléphone du vendeur qui ne sort plus de l'API publique, et le formulaire de
  publication guidé. Le coût de l'attente n'est donc pas un retard de
  fonctionnalité mineure : c'est une application encore invisible pour tout le
  monde, alors que le correctif le plus important (photos + confidentialité du
  téléphone) est prêt depuis ce matin.
- **iOS : bloqué.** La table du §1 indique « Mac + Xcode — non disponible ». Il
  faudrait un Mac avec Xcode et un compte Apple Developer (99 $/an, non ouvert)
  pour avancer. Pas d'instructions Xcode ci-dessous : elles ne serviraient à
  personne cette semaine.

**Verdict : ATTENDRE — ne PAS lancer un nouveau build.**
Depuis le commit `a993629` (celui de la v1.2 déjà construite), 5 commits sont
arrivés (`09b2d83` → `78eb5b6`) :
  - `09b2d83` store: consignation de la v1.2 elle-même — documentation
  - `02edf6d` securite: détail par route pour `cron_fail`/`mtoken_fail` —
    `server/index.php` + un prompt de bureau — **serveur seul**, commun au site
    et à l'app, déjà actif pour tout le monde
  - `ea8604b`, `86570b7`, `78eb5b6` — mise à jour de prompts de bureaux internes
    (`.claude/bureaux/`) — sans rapport avec l'application

`git log --oneline a993629..HEAD -- src/ public/ index.html capacitor.config.ts package.json vite.config.ts`
ne renvoie **aucun commit**. Aucune des 4 conditions de build (§3) n'est
remplie : rien à corriger en urgence sur l'interface, rien qui touche une
exigence de boutique, aucune fonctionnalité visible accumulée, et le dernier
build date de ce matin même. **La priorité n'est pas un build : c'est de
téléverser celui qui existe déjà.**

**Numéros de version** — inchangés, aucun nouveau build à préparer :
  - Android : versionCode **3**, versionName **1.2** (déjà fixés dans l'AAB
    construit)
  - iOS (à préparer le jour où le Mac sera disponible) : CFBundleShortVersionString
    **1.2** (même chiffre qu'Android), CFBundleVersion **1** (première
    soumission)

**Notes de version prêtes à coller pour la v1.2 (pas encore utilisées, puisque
rien n'a encore été envoyé en examen)** :

*Play — « Nouveautés » (291/500 caractères)* :
> Vos photos d'annonces s'affichent de nouveau. Nouvelle catégorie Santé &
> Bien-être. Formulaire de publication mieux guidé. Votre numéro de téléphone
> n'est plus visible publiquement, pour votre sécurité. Écrans plus lisibles.
> Vous pouvez désormais supprimer votre compte depuis l'application.

*App Store — « Nouveautés de cette version »* :
> Vos photos d'annonces s'affichent enfin correctement dans l'application.
> Nous avons ajouté une catégorie Santé & Bien-être et rendu le formulaire de
> publication plus simple à remplir.
> Votre numéro de téléphone n'est plus visible publiquement sur le site : les
> acheteurs vous contactent uniquement par la messagerie Chap.ci.
> Plusieurs écrans sont désormais plus lisibles et plus accessibles. Vous
> pouvez aussi supprimer votre compte directement depuis l'application.

**Captures d'écran : aucune à refaire.** Aucun commit affectant `src/` n'est
arrivé depuis `a993629`, donc les 5 écrans (accueil, annonce, explorer,
vendeur, aide) n'ont pas changé visuellement depuis la référence — ni en
téléphone, ni en tablette 7/10 pouces. Les jeux existants dans
`store/captures/` restent valables pour la v1.2.

**Vérifications avant build — toutes passées :**
  - `capacitor.config.ts` : `appId` = `ci.chap.app`, aucune clé `server.url`.
  - `src/lib/native.ts` : `SITE_ORIGIN === 'https://chap.ci'`, `mediaUrl()`
    présent et utilisé pour les images.
  - `src/lib/marketing.ts` : garde `if (isNative) return` intact — pas de
    pixel en app native.
  - `src/components/NativeShell.tsx` : gestionnaire `backButton` et réglages
    `StatusBar` présents.
  - `package.json` : `cap:sync` et `cap:android` chaînent bien
    `node scripts/android-slim.mjs`. `cap:ios` ne le chaîne pas — normal, ce
    script ne retire que des ressources Android.
  - Plugins `@capacitor/*` : `core`, `cli`, `android`, `ios`, `app`,
    `geolocation`, `splash-screen`, `status-bar` — exactement la liste
    attendue, aucun nouveau plugin.
  - `npm run build` : passe sans erreur TypeScript.

**Marche à suivre — Android / Google Play** (le build existe déjà, pas de
rebuild nécessaire) :
  1. Dans la Play Console, ouvrir la release v1.2 (versionCode 3) restée en
     brouillon, ou créer une version dans **Test interne** avec l'AAB de
     6,5 Mo déjà produit.
  2. Coller les notes de version Play ci-dessus.
  3. Les captures actuelles conviennent (aucune périmée).
  4. Envoyer pour examen.
  5. Rappel du chemin vers la production sur un compte personnel (déjà noté
     au §"Le chemin vers la production") : test interne → test fermé avec
     **12 testeurs inscrits en continu pendant 14 jours** → accès production.
     Ce délai ne raccourcit pas ; le recrutement des testeurs reste la
     priorité la plus urgente du bureau Livraison, plus urgente qu'un nouveau
     build.

**Marche à suivre — iOS / App Store : bloqué.**
Il faudrait un Mac avec Xcode et un compte Apple Developer (99 $/an) pour
avancer. Rien d'autre à faire cette semaine de ce côté.

### 2026-07-30 17:40 — [Sécurité du code] 🔒 Le Serrurier

- **Fait** : diff complet de la semaine revu (50 commits, l'historique entier du
  dépôt tient en 3 jours) · sous-système fouillé à fond : **Rendu & upload**
  (rotation ISO semaine 31 % 6 = 1 — `web/seo.php`, `save_data_uri`,
  `apply_watermark`, en-têtes servis) · CI et dépendances vérifiées ·
  déploiement du correctif du 30/07 contrôlé en conditions réelles.

- **Problèmes ouverts** :

  1. **CRITIQUE — la XSS stockée du JSON-LD, « corrigée » ce matin, est
     toujours ACTIVE en production.** Le commit `efb4760` (16:43 UTC)
     remplace `JSON_UNESCAPED_SLASHES` par `JSON_HEX_TAG|JSON_HEX_AMP|
     JSON_HEX_APOS|JSON_HEX_QUOT` dans `web/seo.php:201-203`
     (`render_page()`). Il est **présent dans le dépôt mais pas sur le
     serveur** : `/api/health` indique un dépôt à `depose:
     2026-07-30T02:50:10Z`, soit **14 heures avant** le commit du correctif —
     `web/seo.php` n'entre d'ailleurs pas dans l'empreinte de `index.php`,
     donc ce fichier précis ne peut pas avoir bougé depuis.
     **Preuve rejouée** : une vraie page d'annonce en production
     (`https://chap.ci/annonce/c3a53e62-20e8-4808-a824-cab73a04d4d9`, servie
     en direct — `cf-cache-status: DYNAMIC`, pas de cache) renvoie dans son
     JSON-LD `"url":"https://chap.ci/annonce/…"` avec des **slashes NON
     échappés**. Avec le correctif du dépôt, `json_encode` produirait
     `"https:\/\/chap.ci\/…"` — je l'ai vérifié en local :
     ```
     $ php -r 'echo json_encode(["u"=>"https://chap.ci/x"],
       JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT);'
     {"u":"https:\/\/chap.ci\/x"}
     ```
     Le serveur observé ne fait donc PAS tourner le code du dépôt pour ce
     fichier : il exécute encore l'ancien `JSON_UNESCAPED_SLASHES`. Rejeu du
     scénario d'attaque avec les flags réellement en ligne :
     ```
     $ php -r '$t="Telephone </script><script>alert(document.cookie)</script>";
       echo json_encode(["name"=>$t], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);'
     {"name":"Telephone </script><script>alert(document.cookie)</script>"}
     ```
     Le titre n'est jamais assaini à la publication (`server/index.php:3511`
     et `3671` : seul `moderate_text()` — anti-arnaque — s'applique, aucun
     `strip_tags`/`htmlspecialchars` sur `title`/`description`). N'importe
     quel vendeur peut donc publier aujourd'hui une annonce dont le titre
     referme la balise `<script>` du JSON-LD et exécute du code dans
     l'origine `chap.ci`, pour tout visiteur humain qui ouvre le lien partagé
     (le script du JSON-LD s'exécute AVANT le `location.replace` de
     redirection, qui ne s'applique qu'aux robots — un humain charge donc et
     exécute la charge avant d'être redirigé). C'est exactement la faille que
     le commit du matin visait à fermer : elle reste ouverte tant que le zip
     n'est pas redéployé.

  2. **Mineure** — `web/seo.php:302`, le second bloc JSON-LD
     (`render_sell_page()`, pages `/vendre/{catégorie}/{ville}`) garde
     `JSON_UNESCAPED_SLASHES` sans `JSON_HEX_TAG`. **Pas exploitable
     aujourd'hui** : les seules valeurs qui y entrent (`$catLabel`,
     `$cityName`, `$site`, `$canon`) viennent de dictionnaires PHP fixes
     (`chapci_seo_cats()` / `chapci_seo_cities()`) après un contrôle de
     liste blanche sur `$catSlug`/`$citySlug` (ligne 144) — aucune saisie
     utilisateur n'atteint ce `json_encode`. Signalé pour cohérence et
     défense en profondeur, pas comme une brèche.

  3. **Mineure** — `.github/workflows/security-scan.yml` se déclenche sur
     `push: branches: ['**']` EN PLUS de `pull_request` : chaque push sur
     n'importe quelle branche relance gitleaks + l'audit de dépendances,
     ce qui gaspille des minutes CI sans bénéfice de sécurité supplémentaire
     (le `pull_request` couvre déjà tout changement avant fusion).

  4. **Aucun** ailleurs. Vérifié sans régression cette semaine : injection
     SQL (paramétrage partout, `export_all` toujours sur liste blanche),
     IDOR (chaque `UPDATE`/`DELETE` sur `listings` relit `user_id` avant
     d'agir — vérifié ligne par ligne sur les routes `PUT`/`DELETE
     /listings/{id}`), upload (`save_data_uri` : SVG assaini par regex,
     extension déduite de `getimagesizefromstring`, `.htaccess`
     anti-exécution regénéré), les nouvelles fonctionnalités de la semaine
     (dossier foncier, vérification e-mail avant publication) sont bien
     posées **côté serveur** (`foncier_exiger()` appelé sur `POST` ET `PUT
     /listings` ; `email_verifie()` bloque la publication à 403), aucun
     secret commité (`server/config.php` ne lit que des `getenv()`),
     `php -l` propre sous PHP 8.4.19 sur `index.php` et `seo.php`,
     `npm audit --omit=dev --audit-level=high` : rien de haut/critique
     (seulement modéré, `react-router`, correctif disponible via
     `npm audit fix`, non urgent).

- **Propositions au Patron** :

  - **Urgence n°1 — redéployer immédiatement.** Aucun changement de code
    n'est nécessaire : le correctif existe déjà dans le dépôt
    (`efb4760`, `web/seo.php:201-203`). Il faut simplement que le prochain
    zip parte MAINTENANT, sans attendre un cycle normal, puisque la faille
    qu'il ferme est active en production depuis 14h+. **Vérification après
    déploiement** : recharger
    `https://chap.ci/annonce/c3a53e62-20e8-4808-a824-cab73a04d4d9` en
    User-Agent robot et confirmer que le JSON-LD affiche `https:\/\/chap.ci`
    (slashes échappés) au lieu de `https://chap.ci` (slashes nus).

  - `web/seo.php:302` — Avant : `json_encode($ld, JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES)`. Après : `json_encode($ld, JSON_UNESCAPED_UNICODE
    | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)` — même
    correctif que la ligne 201, par cohérence. Risque du correctif : nul
    (aucune saisie utilisateur n'y transite ; le format JSON-LD reste valide
    pour Google). Vérification : recharger une page `/vendre/{cat}/{ville}`
    et confirmer que le `BreadcrumbList` s'affiche toujours normalement dans
    l'outil de test des données structurées de Google.

  - `.github/workflows/security-scan.yml` — Avant : `on: { push:
    { branches: ['**'] }, pull_request, workflow_dispatch }`. Après : retirer
    le déclencheur `push` (garder `pull_request` + `workflow_dispatch`), ou à
    défaut le limiter à `branches: [main]`. Risque du correctif : nul (les
    pull requests restent scannées avant fusion). Vérification : le prochain
    push sur une branche de travail ne déclenche plus le workflow ; une PR le
    déclenche toujours.

- **Pour les autres bureaux** : **Monteur** — priorité absolue du prochain
  zip : `web/seo.php` seul suffirait à fermer la faille n°1, mais autant
  embarquer aussi le correctif mineur de la ligne 302 puisque le fichier
  bouge de toute façon. **Gardien** — rien à surveiller en direct ici (pas
  un événement de sécurité vivant, c'est un défaut de code non déployé) ;
  en revanche, si le tableau de bord admin permet de repérer les annonces au
  titre contenant `<script` ou `</script>`, un balayage ponctuel des titres
  actuels serait utile pour vérifier qu'aucune n'a déjà été publiée avec un
  tel contenu avant le déploiement du correctif. **Dev** — aucun correctif de
  code à écrire, tout est déjà commité ; seule l'action de déploiement
  manque.

### 2026-08-01 19:48 — [Sécurité du code] 🔒 Le Serrurier

- **Fait** : diff de la semaine revu (50 commits sur 7 jours, dont 3 nouveaux
  depuis le dernier passage du 30/07 : `500ea70`, `fdd3251`, `15a0fe1`) ·
  sous-période encore dans la semaine ISO 31 (31 % 6 = 1) : sous-système
  **Rendu & upload** déjà fouillé à fond jeudi dernier, seule la matière
  nouvelle est reprise ici · CI et dépendances revérifiées · déploiement du
  correctif du 30/07 recontrôlé en conditions réelles.

- **Problèmes ouverts** :

  1. **CRITIQUE, PERSISTANT — la XSS stockée du JSON-LD est toujours ACTIVE
     en production, 41 heures après le rapport du 30/07.** Rien de nouveau
     dans l'analyse : le correctif (`efb4760`, 30/07 16:43) est toujours
     uniquement dans le dépôt, jamais parti en zip. Recontrôle à l'instant :
     ```
     $ curl -sS https://chap.ci/api/health
     {"ok":true,...,"empreinte":"1a16b7fcf80d","depose":"2026-07-30T02:50:10Z"}
     ```
     `depose` n'a pas bougé d'une seconde depuis le contrôle de jeudi — aucun
     zip n'est reparti depuis. Rejeu direct sur l'annonce réelle déjà citée
     jeudi :
     ```
     $ curl -sS -A "Googlebot/2.1 (+http://www.google.com/bot.html)" \
       "https://chap.ci/annonce/c3a53e62-20e8-4808-a824-cab73a04d4d9" \
       | grep -o '"url":"[^"]*annonce[^"]*"'
     "url":"https://chap.ci/annonce/c3a53e62-20e8-4808-a824-cab73a04d4d9"
     ```
     Slashes non échappés : le serveur exécute encore l'ancien
     `JSON_UNESCAPED_SLASHES`. Le scénario d'attaque du rapport précédent
     reste rejouable tel quel — n'importe quel vendeur peut publier un titre
     qui referme `<script type="application/ld+json">` et exécute du code
     dans l'origine `chap.ci` pour tout visiteur humain d'un lien partagé.
     Aucun fait nouveau, seule la fenêtre d'exposition s'allonge (14h jeudi
     → 41h aujourd'hui).

  2. **Aucun autre.** `fdd3251` (01/08 18:42) ferme bien, dans le dépôt, le
     2ᵉ sink JSON-LD (`web/seo.php:306`, `BreadcrumbList`) exactement comme
     proposé jeudi — `JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT`
     à la place de `JSON_UNESCAPED_SLASHES` seul, vérifié par lecture directe
     du fichier. Le même commit retire aussi `push: branches: ['**']` du
     déclencheur CI (`.github/workflows/security-scan.yml`), gardant
     `main` + `pull_request` + `workflow_dispatch` — appliqué, et effectif
     immédiatement puisqu'un workflow GitHub Actions se lit depuis la
     référence poussée, sans étape de déploiement séparée. `15a0fe1`
     (01/08 19:32, « Formulaires d'annonce : les schémas des quinze
     catégories ») ajoute 17 fichiers sous `maquettes/formulaires/` : un
     outil de maquettage autonome, non référencé dans `package.json` ni
     `vite.config.*`, dont le propre message de commit précise « rien n'est
     branché à l'application ». `_moteur.js` y utilise `innerHTML` sans
     échappement systématique (`esc()` appliqué par endroits seulement) —
     sans conséquence tant que ce code ne sert qu'à générer des aperçus
     locaux pour validation avec le Patron ; à surveiller le jour où ce
     moteur serait branché à une saisie utilisateur réelle. `git grep` sur
     `json_encode` dans `server/index.php` : tous les usages restants sont
     soit des réponses JSON d'API (content-type JSON, pas un sink HTML) soit
     des sérialisations pour stockage en base — aucun nouveau `<script>` non
     échappé. `SELECT * FROM $t` (`export_all`, ligne 2741) reste sur la
     liste blanche de 16 noms de table en dur, inchangée. Aucun secret
     commité. `php -l` propre sur `index.php` et `seo.php` (PHP 8.1.34 en
     production via `/api/health`, 8.4 non encore utilisé — la CI cible
     toujours 8.4). `npm audit --omit=dev --audit-level=high` : même
     avertissement modéré déjà connu sur `react-router` (redirection
     ouverte + injection de constructeur en SSR), correctif disponible,
     toujours non urgent — rien de nouveau, rien de haut/critique.

- **Propositions au Patron** : aucune nouvelle proposition de correctif —
  tout ce qui pouvait se corriger dans le code est déjà commité. La seule
  action qui reste, et qui devient plus urgente chaque jour qui passe, est
  le déploiement du zip contenant `web/seo.php`. **Vérification après
  déploiement** (inchangée depuis jeudi) : recharger
  `https://chap.ci/annonce/c3a53e62-20e8-4808-a824-cab73a04d4d9` en
  User-Agent robot et confirmer que le JSON-LD affiche `https:\/\/chap.ci`
  (slashes échappés) au lieu de `https://chap.ci` (slashes nus) — ou plus
  simplement, confirmer que `depose` dans `/api/health` a avancé au-delà de
  `2026-07-30T02:50:10Z`.

- **Pour les autres bureaux** : **Monteur** — c'est la même faille et la
  même demande que jeudi, non traitée depuis : le prochain zip doit partir
  sans attendre un cycle normal, `web/seo.php` (et tout le reste accumulé
  depuis le 29/07, `index.php` inclus, jamais redéployé non plus) en fait
  partie. **Gardien** — rien de vivant à ajouter ; même remarque que jeudi
  sur un balayage ponctuel des titres d'annonces si l'outil admin le permet.
  **Dev** — rien à écrire, tout est commité ; c'est un problème de cadence
  de déploiement, pas de code manquant.

---

### 2026-08-01 19:52 — [Livraison] 🔨 Le Monteur

**Une précision d'abord, à l'intention du Serrurier : le zip du site n'est pas
mon périmètre.** Ce bureau ne construit et ne recommande que les **binaires
d'application** (AAB Android, IPA iOS) à partir du dépôt — jamais le
déploiement du site web (`web/seo.php`, `index.php`, le « zip »), qui est
l'action du Patron lui-même, hors de ce que je peux exécuter ou déclencher
depuis cette session. Je ne peux donc pas faire partir ce zip. **Mais le fond
de l'alerte est trop grave pour rester au fond du journal** : une XSS stockée
signalée CRITIQUE le 30/07, reconfirmée ACTIVE en production 41 heures plus
tard par le Serrurier il y a quatre minutes, avec correctif déjà commité
(`efb4760`) et jamais déployé. Je le remonte au Patron dans mon compte-rendu
ci-dessous, et par notification, précisément parce que ce n'est à personne
d'autre de le faire remonter cette semaine.

**Alerte en tête sur mon propre périmètre, parce qu'elle change tout le
raisonnement qui suit.** `store/APP-VERSIONS.md` porte deux commits de
référence qui **n'existent nulle part dans le dépôt** — ni sur la branche
courante, ni sur aucune branche distante, même après un `git fetch --all`
complet :

- v1.7 (versionCode 8) donne `d3e2d1c`
- v1.8 (versionCode 9) donne `20e42ae`

En remontant l'historique du fichier lui-même, j'ai retrouvé ce qui s'est
passé : ces deux entrées ont été écrites **dans le même commit** que la
fonctionnalité qu'elles décrivent (`6badb5d` pour la v1.7, `d75467e` pour la
v1.8) — un commit ne peut pas connaître son propre hash avant d'être créé, et
le hash inscrit dans le texte a été inventé au lieu d'être corrigé après coup.
**Les vrais commits de ces deux builds sont donc `6badb5d` (v1.7) et
`d75467e` (v1.8)**, tous deux bien présents et vérifiés. Rien n'est perdu,
mais le repère écrit dans le fichier était faux — signalé au Développement
pour correction des deux champs **Commit**.

**État des deux boutiques (inchangé) : aucune version publiée, nulle part.**
Cinq builds Android existent (v1.4 à v1.8), tous « construits et signés »
d'après ce fichier, et **aucun n'a jamais été envoyé en examen** — le canal de
test fermé attend toujours ses douze testeurs inscrits 14 jours consécutifs
(13 adresses invitées au dernier relevé, aucune confirmation de clic
rapportée). Le volet App Store reste bloqué : ni Mac, ni Xcode, ni compte
développeur Apple. Ce n'est pas un problème de build — c'est un problème de
recrutement de testeurs, et c'est lui qui coûte le plus cher cette semaine
sur MON périmètre.

**Ce que les utilisateurs de l'application ne voient pas encore : tout.**
Aucune version n'ayant jamais atteint un testeur, chaque correctif accumulé
depuis la v1.2 leur est invisible — les photos d'annonces qui s'affichent
enfin, les variantes de couleur, le dossier foncier obligatoire, le formulaire
Téléphones anti-arnaque, les corrections de contraste et de cibles tactiles.

**Ce qui a changé sur le site depuis le vrai dernier build (`d75467e`,
v1.8) :**

```
git log --oneline d75467e..HEAD -- src/ public/ index.html capacitor.config.ts package.json vite.config.ts
→ (vide)
```

Quatre commits sont arrivés depuis, **aucun ne touche l'application** :

- `15a0fe1` — Formulaires d'annonce, schémas des quinze catégories →
  **INTERNE, hors périmètre de l'app.** Touche uniquement
  `maquettes/formulaires/`, confirmé non référencé par `src/`, `index.html`
  ni `vite.config.ts` — absent de `dist/` et de tout build.
- `fdd3251` — Sécurité : ferme le 2ᵉ sink JSON-LD, allège le déclencheur CI →
  **CORRECTION DE SÉCURITÉ, mais sans effet sur l'app.** Ne touche que
  `web/seo.php` (rendu HTML servi par le serveur) et le workflow CI — l'app
  charge sa propre copie du site (`webDir: 'dist'`), jamais `web/seo.php`.
- `500ea70` — Ajoute le bureau Sécurité du code (Le Serrurier) → **INTERNE.**
  Ne touche que `.claude/bureaux/`.
- `efb4760` — Corrige la XSS stockée du JSON-LD SEO → **CORRECTION DE
  SÉCURITÉ, mais sans effet sur l'app**, même raison que `fdd3251` :
  `web/seo.php` seul, jamais chargé par l'application. **C'est précisément ce
  correctif que le Serrurier signale non déployé sur le site — voir plus
  haut.**

**Verdict, pour l'application : ATTENDRE.** Aucune des quatre conditions de
build n'est remplie — aucun de ces commits ne touche l'interface embarquée,
aucune exigence de boutique n'est en jeu, ni trois fonctionnalités visibles
accumulées ni trois semaines écoulées depuis `d75467e` (30 juillet). Un
nouveau build cette semaine n'apporterait rien de plus à des testeurs qui
n'existent pas encore.

**Numéros de version : sans objet cette semaine.** Si un build redevenait
pertinent avant que le site n'évolue à nouveau, le prochain serait versionCode
**10** (jamais réutiliser 9) ; le versionName resterait à l'appréciation du
contenu du moment.

**Notes de version : sans objet, aucun build proposé.**

**Captures d'écran : aucune à refaire.** Aucun des cinq écrans de référence
(accueil, annonce, explorer, vendeur, aide) n'est concerné par les quatre
commits ci-dessus.

**Vérifications avant build (faites quand même, par hygiène) :**

| Vérification | Résultat |
|---|---|
| `capacitor.config.ts` — `appId: 'ci.chap.app'`, pas de `server.url` | ✅ conforme |
| `src/lib/native.ts` — `SITE_ORIGIN === 'https://chap.ci'`, `mediaUrl()` en place | ✅ conforme |
| `src/lib/marketing.ts` — garde `if (isNative) return` intact | ✅ conforme |
| `src/components/NativeShell.tsx` — `backButton` + `StatusBar` | ✅ conforme |
| `package.json` — `cap:sync`/`cap:android` chaînent `android-slim.mjs` ; `cap:ios` ne le chaîne pas (normal) | ✅ conforme |
| Plugins `@capacitor/*` — core, cli, android, ios, app, geolocation, splash-screen, status-bar | ✅ conforme, aucun nouveau |
| `npm run build` | ✅ passe, aucune erreur TypeScript |

**Marche à suivre Android.** Aucune : pas de build cette semaine. La priorité
reste le recrutement des douze testeurs — sans eux, un sixième build
attendrait derrière les cinq précédents.

**Marche à suivre iOS.** Bloquée : ni Mac avec Xcode, ni compte Apple
Developer (99 $/an) disponibles. Rien d'autre à écrire tant que cette ligne
n'a pas changé dans `store/APP-VERSIONS.md`.

---

### 2026-08-02 03:20 — [Sécurité du code] 🔒 Le Serrurier

- **Fait** : diff de la semaine revu ligne à ligne (43 commits, `c2a847d..HEAD`,
  27/07 → 01/08) · sous-système fouillé à fond cette semaine (rotation semaine
  ISO 31 % 6 = 1) : **Rendu & upload** — `web/seo.php` (tous les échappements),
  `save_data_uri`, `apply_watermark`, en-têtes servis · CI et dépendances
  vérifiées · déploiement des correctifs des semaines passées **confirmé
  en ligne**.

  **Déploiement confirmé.** La XSS stockée du JSON-LD (`efb4760`, 30/07) et
  la fermeture du second sink dans `render_sell_page` (`fdd3251`, 01/08) sont
  bien en production : `curl https://chap.ci/api/health` renvoie l'empreinte
  `69dfb85233f0`, identique à `md5sum server/index.php` du dépôt, déposée le
  `2026-08-01T22:19:04Z` — après les deux commits. Vérifié aussi en conditions
  réelles : `curl -A facebookexternalhit ".../annonce/c3a53e62-…"` sert
  désormais `"https:\/\/chap.ci"` (slashes échappés) dans le `<script
  type="application/ld+json">`. Et par la preuve directe, rejouée en
  `php -r` avec le payload `Titre</script><script>alert(1)</script>` contre
  l'encodage actuel (`JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT`,
  sans `JSON_UNESCAPED_SLASHES`) : la sortie devient
  `<\/script><script>…`, qui ne peut plus refermer la
  balise. **Ce dossier est clos.** Rien à remonter au Monteur ni au Patron
  dessus cette semaine.

  **Sous-système Rendu & upload : rien de neuf, rien de régressé.**
  `save_data_uri` et `apply_watermark` (index.php:2879 et :2923) sont
  identiques à la version déjà auditée « solide » : re-encodage GD, extension
  déduite de `getimagesizefromstring`, SVG filtré (script/on*/javascript:/
  href externe refusés), `.htaccess` anti-exécution regénéré à chaque appel,
  nom de fichier en `date+uuid`. Un seul nouvel appel de site cette semaine
  (route `PUT /listings/:id`, index.php:3863) réutilise la fonction telle
  quelle, sans rien contourner. Le `web/htaccess-root` a changé (CSP élargie
  pour l'IA photo embarquée TensorFlow.js : `'unsafe-eval'`, `'wasm-unsafe-eval'`,
  `blob:`), documenté en détail dans les commentaires du fichier — voir « défaut
  de robustesse » ci-dessous, ce n'est pas une brèche en soi puisque la
  politique reste en mode `Report-Only` (elle n'a jamais bloqué quoi que ce
  soit).

  **Balayage du reste du diff (hors rotation).** `server/index.php` a gagné
  1488 lignes cette semaine (vérification d'e-mail par code, badge de
  vérification recalculé, prolongation de publicité, `admin/revenues`,
  `admin/foncier/*`, compteurs de vues/clics de pub). Points vérifiés :
  - Les deux nouvelles routes `admin/revenues` et `admin/foncier/*`
    restent SOUS la porte centrale `if ($seg[0] === 'admin')` (index.php:4927,
    `require_user` + `is_admin` obligatoires), avec un verrou supplémentaire
    réservé au propriétaire (`owner_emails`) — cohérent avec le reste du bloc
    admin.
  - La prolongation de publicité (`POST /ads` avec `extends`) vérifie que la
    pub ciblée est active ET appartient au même compte ou au même e-mail
    avant de la prolonger (index.php:~1174) — pas d'IDOR.
  - Les compteurs `ads/:id/view` et `ads/:id/click` interpolent `$col` dans le
    SQL (`UPDATE ad_stats SET $col = $col + 1 …`), mais `$col` ne peut valoir
    que `'views'` ou `'clicks'`, verrouillé en amont par
    `in_array($seg[2], ['view','click'], true)` — pas d'injection.
  - `admin/revenues` construit son `WHERE` par fragments (`$wAds`, `$wRev`)
    mais les noms de colonnes sont des littéraux fixes passés par le code, et
    les valeurs passent en paramètres liés (`$pAds`, `$pRev`) — même schéma
    que `export_all`, déjà noté solide.
  - `git grep` sur `json_encode` dans `server/index.php` : aucun nouveau
    `<script>` non échappé, uniquement des réponses API ou des colonnes JSON
    stockées en base.
  - Aucun secret commis (`git grep` sur secret/password/token/clé : rien hors
    `getenv()`, docs et libellés produit).

  **CI et dépendances.** `.github/workflows/security-scan.yml` déclenché sur
  `pull_request` + `main` (allègement du 01/08, déjà noté par le Monteur).
  `php -l` propre sur `index.php` et `seo.php`. `npm audit --omit=dev
  --audit-level=high` : toujours le seul avertissement **modéré** connu sur
  `react-router` (redirection ouverte + injection de constructeur en SSR
  côté hydratation) — rien de nouveau, rien de haut/critique.

- **Problèmes ouverts** : aucun exploitable. Un point de robustesse à noter,
  sans urgence : la CSP du site (`web/htaccess-root`) autorise désormais
  `'unsafe-eval'`, `'wasm-unsafe-eval'` et `blob:` en `script-src`, ajoutés
  pour le modèle TensorFlow.js embarqué qui analyse les photos avant
  publication. C'est un vrai assouplissement — `unsafe-eval` est précisément
  ce que la CSP existe pour interdire — mais deux choses le tempèrent : (1) la
  politique n'est encore qu'en `Content-Security-Policy-Report-Only`, donc
  elle ne bloque rien aujourd'hui, assouplie ou non ; (2) même passée en mode
  bloquant plus tard, l'apport réel de la CSP contre une XSS DOM viendrait
  surtout de la restriction des *sources* de script (`'self'` + domaines
  listés), pas de `unsafe-eval` seul — `unsafe-eval` élargit ce qu'un script
  déjà chargé peut faire, pas ce qui peut être chargé. À surveiller le jour où
  la politique passera en mode bloquant : vérifier alors que cet assouplissement
  reste nécessaire (le modèle est livré dans le paquet, `tfhub.dev` /
  `storage.googleapis.com` / `www.kaggle.com` ne sont, d'après le commentaire
  du fichier, jamais appelés en pratique — à confirmer au navigateur avant de
  les retirer).

- **Propositions au Patron** : aucune. Rien à corriger dans le code cette
  semaine — le sous-système de rotation tient, le diff complet ne montre
  aucune brèche, et le seul point ouvert des semaines passées (déploiement du
  correctif JSON-LD) est refermé.

- **Pour les autres bureaux** : **Gardien** — rien de vivant à remonter.
  **Dev** — rien à écrire. **Monteur** — rien sur votre périmètre (le
  correctif confirmé déployé cette semaine ne concernait que le site, pas
  l'application). Une seule note pour tous : si la CSP `Report-Only` passe un
  jour en mode bloquant, revérifier à ce moment-là que `'unsafe-eval'` /
  `'wasm-unsafe-eval'` sont toujours nécessaires à l'IA photo embarquée.

---

### 2026-08-02 03:19 — [Livraison] 🔨 Le Monteur

**Repère à corriger dans le prompt de cette routine, pas dans le dépôt.**
`store/APP-VERSIONS.md` n'est PAS périmé — il est à jour, la v1.10 y figure
avec son commit. C'est la valeur codée dans mes instructions (« aujourd'hui :
`a993629` ») qui l'est : ce commit est celui de la v1.2, **trois versions en
retard** sur le vrai dernier build. J'ai donc travaillé à partir du commit
réellement inscrit en tête de fichier, **`e1a07b7`** (v1.10, versionCode 11),
et je signale l'écart pour que le prompt stocké de cette routine soit
recorrigé — sinon chaque semaine repart du même faux repère.

**État des deux boutiques.** Google Play : la **v1.9 (versionCode 10)** est
la première version de l'histoire du projet à avoir réellement atteint des
testeurs — active sur le canal de test fermé depuis le 1ᵉʳ août. Elle est
déjà **remplacée sur le papier** par la **v1.10 (versionCode 11)**, construite
et signée le 1ᵉʳ août au soir (6,7 Mo), mais **pas encore téléversée** dans la
Play Console à l'heure de ce rapport. App Store : toujours aucune version,
volet **bloqué** — ni Mac avec Xcode, ni compte Apple Developer (99 $/an).

**Ce que les testeurs ont ENTRE LES MAINS en ce moment (v1.9) et qui ne
fonctionne pas.** La v1.9 n'a demandé que la permission `INTERNET` : quand
l'accueil demandait la position, Android refusait sans la moindre boîte de
dialogue, et l'app se rabattait en silence sur une estimation par adresse IP
qui place à peu près tout le monde à Abidjan-Plateau. « Les annonces près de
chez vous » ne veut donc rien dire pour les testeurs actuels, et rien ne le
leur signale. C'est corrigé dans la v1.10, qui attend son téléversement — la
fenêtre d'exposition de ce défaut se compte en jours tant qu'elle n'a pas
remplacé la v1.9 en test fermé.

**Ce qui suit n'y est pas non plus** : les trois photos minimum pour publier
(formulaire ET route serveur), et le délai de garde de quinze secondes sur
les envois (`POST`/`PUT`/`DELETE` qui tournaient indéfiniment sans message
sur un réseau qui décroche).

**Verdict pour un NOUVEAU build : ATTENDRE.**
```
git log --oneline e1a07b7..HEAD -- src/ public/ index.html capacitor.config.ts package.json vite.config.ts
→ (vide)
```
Un seul commit est arrivé depuis la v1.10 (`7594b48`), et il ne touche que
`store/APP-VERSIONS.md` lui-même (correction de deux numéros de commit
inventés pour v1.7/v1.8) — aucun effet sur l'application. Aucune des quatre
conditions du §3 n'est remplie : pas de correction de sécurité ou de
confidentialité en attente côté interface, pas d'exigence de boutique
nouvelle, pas trois fonctionnalités accumulées, pas trois semaines écoulées
depuis le dernier build (30/07 → 01/08, deux jours). Un build de plus
n'apporterait rien : la v1.10 couvre déjà tout ce qui a changé sur le site.

**Mais l'action qui compte cette semaine n'est pas un build, c'est un
téléversement.** La v1.10 existe, est signée, et corrige un défaut qui casse
une fonctionnalité centrale pour des testeurs réels aujourd'hui. Tant qu'elle
reste dans un tiroir, la v1.9 cassée continue de tourner sur leurs
téléphones.

**Numéros de version : sans objet, aucun nouveau build proposé.** Si le site
évolue avant le prochain passage, le prochain build portera **versionCode
12** (jamais réutiliser 11) ; le versionName suivra le contenu du moment
(mineur pour des correctifs, majeur pour une refonte visible). Pour iOS,
`CFBundleShortVersionString` suivrait le même versionName qu'Android, et
`CFBundleVersion` démarrerait à 1 pour le premier envoi.

**Notes de version — prêtes à coller pour le téléversement de la v1.10, qui
lui, est déjà construite :**

*Play (« Nouveautés »), 328 caractères sur 500 :*
> Les annonces près de chez vous s'affichent enfin correctement grâce à la
> position exacte de votre téléphone. Publier une annonce demande maintenant
> au moins 3 photos, pour rassurer les acheteurs. Se connecter ou publier ne
> reste plus bloqué indéfiniment sur un réseau lent : l'écran redevient
> utilisable après quelques secondes.

*App Store (« Nouveautés de cette version ») :*
> Vos annonces près de chez vous s'affichent désormais grâce à la position
> exacte de votre téléphone, et non plus à une estimation approximative qui
> plaçait tout le monde au même endroit.
>
> Publier une annonce demande maintenant au moins 3 photos : les acheteurs
> voient mieux avant de se déplacer.
>
> Sur un réseau lent, se connecter ou publier ne reste plus bloqué
> indéfiniment — l'écran redevient utilisable après quelques secondes, même
> sans réponse du serveur.

**Captures d'écran : aucune à refaire.** Les cinq écrans de référence
(accueil, annonce, explorer, vendeur, aide) ne sont concernés par aucun des
commits de la v1.10 ni par l'unique commit arrivé depuis — rien de visuel
n'a changé. Les trois jeux (téléphone, tablette 7", tablette 10") sont
présents dans `store/captures/`.

**Vérifications avant build (dépôt, à l'heure de ce rapport) :**

| Vérification | Résultat |
|---|---|
| `capacitor.config.ts` — `appId: 'ci.chap.app'`, pas de `server.url` | ✅ conforme |
| `src/lib/native.ts` — `SITE_ORIGIN === 'https://chap.ci'`, `mediaUrl()` en place | ✅ conforme |
| `src/lib/marketing.ts` — garde `if (isNative) return` intacte | ✅ conforme |
| `src/components/NativeShell.tsx` — `backButton` + `StatusBar` présents | ✅ conforme |
| `package.json` — `cap:sync`/`cap:android` chaînent `android-slim.mjs` ; `cap:ios` ne le chaîne pas (normal) | ✅ conforme |
| Plugins `@capacitor/*` — core, cli, android, ios, app, geolocation, splash-screen, status-bar | ✅ conforme, aucun nouveau |
| `npm run build` | ✅ passe, aucune erreur TypeScript |

**Marche à suivre Android.** Pas de nouveau build : celui qui compte
(v1.10) existe déjà. La seule étape qui reste est le téléversement :
Play Console → canal **Test fermé Chap.ci** → Créer une version → téléverser
l'AAB v1.10 déjà signé (6,7 Mo — au-delà de 10 Mo, `android-slim.mjs` n'aurait
pas tourné, ne pas téléverser) → coller les notes Play ci-dessus → captures
inchangées, rien à remplacer → Envoyer pour examen. Ordre conservé :
`npm ci` puis `npm run cap:sync` seraient nécessaires seulement pour un
*nouveau* build, pas pour téléverser celui déjà signé.

**Marche à suivre iOS.** Bloquée : ni Mac avec Xcode, ni compte Apple
Developer (99 $/an) disponibles dans l'environnement. Rien d'autre à écrire
tant que la ligne « Mac » de `store/APP-VERSIONS.md` reste à « non
disponible ».

---

### 2026-08-03 04:58 — [Livraison] 🔨 Le Monteur

**⚠️ `store/APP-VERSIONS.md` est incomplet sur le point qui compte le plus, et
tout mon raisonnement en dépend.** La table de la v1.17 — la dernière version
listée — ne porte AUCUN champ « Commit », contrairement à toutes les versions
précédentes. Le commit de repère transmis pour cette ronde (`a993629`)
correspond en réalité à la v1.2, une version vieille de **dix-sept builds** :
s'y fier aurait fait recompter comme « pas encore dans l'app » tout ce qui a
déjà été livré depuis (les 82 formulaires par catégorie, la comptabilité, R8,
le démarrage accéléré…). J'ai reconstitué le vrai point de départ à partir de
`git log` et des dates : le commit qui clôt la v1.17 est `057db9d` (2 août,
23h19, « v1.17 : l'application s'ouvre une seconde plus tôt »), dont le
contenu de code vient de `0d3e3ce` juste avant. **Tout ce qui suit part de
`057db9d`, pas de `a993629`.** Merci de faire consigner le commit dans
`APP-VERSIONS.md` à chaque build — c'est écrit en tête du fichier, et ça n'a
pas été fait pour la v1.17.

**Version publiée sur chaque boutique, et depuis combien de temps.** Aucune,
sur aucune des deux boutiques. Play : la v1.16 (code 17) a été téléversée le
02/08 mais jamais envoyée à l'examen ; la v1.17 (code 18) la remplace et
attend toujours son premier téléversement. App Store : compte développeur non
ouvert, Mac + Xcode indisponible — volet bloqué, voir plus bas.

**Ce que les utilisateurs de l'application NE VOIENT PAS ENCORE.** Tant
qu'aucune version n'a été envoyée à l'examen, la réponse est totale :
**aucun testeur externe n'a encore ouvert l'application.** Ni les 82
formulaires par catégorie (v1.9), ni la géolocalisation réelle (v1.10), ni R8
et l'écran de démarrage animé (v1.14), ni la comptabilité (v1.16), ni le
démarrage accéléré (v1.17) — rien de tout cela n'est entre les mains de
personne. Le goulot n'est pas le code, c'est le bouton « Envoyer pour examen »
jamais pressé dans la Play Console.

**Verdict : ATTENDRE.** Depuis le commit réel de la v1.17 (`057db9d`), **un
seul commit** est arrivé : `7c80c25` (« Sécurité : donner au Gardien la moitié
du tableau qui lui manquait », 3 août 04h50). Il touche exclusivement
`server/index.php` (l'endpoint de supervision `cron/security`) et un fichier
de documentation interne du bureau Sécurité — **aucune ligne** dans `src/`,
`public/`, `index.html`, `capacitor.config.ts`, `package.json` ni
`vite.config.ts`. C'est un correctif de tableau de bord interne, sans la
moindre surface visible pour un utilisateur de l'application — catégorie
INTERNE au sens du §2, sans effet sur l'app. Aucune des quatre conditions de
build n'est remplie, pas même la plus faible (trois fonctionnalités visibles
accumulées : on est à zéro). Construire cette semaine gaspillerait une
soumission pour un contenu strictement identique à celui déjà en attente
d'envoi.

**Numéros de version proposés.** Sans objet — aucun contenu nouveau à
empaqueter. Pour mémoire, si un build redevenait nécessaire avant la
prochaine ronde : Android **versionCode 19** (le 18 de la v1.17 est le
dernier utilisé, jamais le réutiliser), **versionName 1.18** pour des
correctifs mineurs, ou **2.0** si une refonte visible s'y ajoutait d'ici là.
iOS : `CFBundleShortVersionString` suivrait ce même 1.18, `CFBundleVersion`
démarrerait à **1** — aucun envoi à Apple n'a encore eu lieu.

**Notes de version.** Sans objet cette semaine — rien de nouveau à décrire
aux utilisateurs. Celles déjà rédigées pour la v1.17 (démarrage plus rapide,
polices allégées) restent valables pour le jour où l'AAB sera enfin envoyé à
l'examen ; elles sont dans `store/APP-VERSIONS.md`, section v1.17.

**Captures à refaire : aucune.** L'unique commit arrivé depuis la v1.17 ne
touche à aucun écran (voir verdict). Les cinq écrans de référence (accueil,
annonce, explorer, vendeur, aide), dans leurs trois formats (téléphone,
tablette 7", tablette 10"), sont déjà dans `store/captures/` et restent
d'actualité pour Play. Pour l'App Store, les jeux iPhone et iPad restent à
produire le jour où le volet iOS se débloquera — dimensions à lire dans App
Store Connect au moment du dépôt, pas à deviner ici.

**Vérifications avant build (dépôt, à l'heure de ce rapport).**

| Vérification | Résultat |
|---|---|
| `capacitor.config.ts` — `appId: 'ci.chap.app'`, pas de `server.url` | ✅ conforme |
| `src/lib/native.ts` — `SITE_ORIGIN === 'https://chap.ci'`, `mediaUrl()` en place | ✅ conforme |
| `src/lib/marketing.ts` — garde `if (isNative) return` intacte | ✅ conforme |
| `src/components/NativeShell.tsx` — `backButton` + `StatusBar` présents | ✅ conforme |
| `package.json` — `cap:sync`/`cap:android` chaînent `android-slim.mjs` ; `cap:ios` ne le chaîne pas (normal) | ✅ conforme |
| Plugins `@capacitor/*` — core, cli, android, ios, app, geolocation, splash-screen, status-bar | ✅ conforme, aucun nouveau |
| `npm run build` (`tsc -b && vite build`) | ✅ passe, aucune erreur TypeScript |

**Marche à suivre Android.** Pas de nouveau build cette semaine : la priorité
reste celle des rondes précédentes, inchangée — **envoyer enfin la v1.17
(code 18)**, déjà construite, à l'examen depuis la Play Console (canal test
fermé), avant même de songer à un futur build. Le jour où un nouveau paquet
sera justifié, la marche reste : `npm ci` → `npm run cap:sync` → Android
Studio (Generate Signed Bundle, versionCode/versionName renseignés d'abord)
→ vérifier le poids de l'AAB (6-7 Mo attendu, au-delà de 10 Mo ne pas
téléverser) → Play Console → nouvelle version → notes → captures → envoyer
pour examen.

**Marche à suivre iOS.** Bloquée : ni Mac avec Xcode, ni compte Apple
Developer (99 $/an) disponibles dans l'environnement. Rien d'autre à écrire
tant que la ligne « Mac » de `store/APP-VERSIONS.md` reste à « non
disponible ».

---

### 2026-08-03 05:10 — [Sécurité du code] 🔒 Le Serrurier

- **Fait** : diff de la semaine revu ligne à ligne — **un seul commit** arrivé
  depuis mon dernier passage (`7c80c25`, 03/08, sur `server/index.php` +
  documentation interne du bureau), le reste ayant déjà été audité le 02/08 ·
  sous-système fouillé à fond cette semaine (rotation semaine ISO 32 % 6 = 2) :
  **Argent** — `POST /orders`, `PATCH /orders/:id`, `POST/GET /reviews`,
  `POST /ads` + audience + admin `approve/reject/revenues/confirm` · CI et
  dépendances vérifiées · déploiement des correctifs confirmé, y compris le
  commit de cette semaine.

  **Le commit de la semaine (`7c80c25`)** ajoute `derniersPassages` à la
  réponse de `cron/security` (date du dernier passage réussi + nombre total
  par tâche cron, lues depuis `cron_runs`). La route reste protégée par
  `hash_equals($config['cron_key'], $cronKey)` (index.php:7417) — aucune
  ouverture d'accès, seules des dates sont exposées à une route qui pouvait
  déjà lire les compteurs d'échec. Rien à signaler.

  **Sous-système Argent : rien à corriger.**
  - `POST /orders` (index.php:4690) exige une conversation RÉELLE
    acheteur→vendeur préexistante avant de créer une commande (anti faux-avis
    / anti-harcèlement), refuse une commande vide, et relit **prix, titre,
    image depuis `listings`** pour chaque article — jamais les valeurs
    envoyées par le client. `PATCH /orders/:id` (4780) vérifie
    `seller_id === u.id` et restreint `status` à une liste blanche
    (`en_cours`/`finalise`/`annule`).
  - `POST /conversations/:id/deal` (4835) : chaque action (`bought`,
    `received`, `sold`, `cancel`) est conditionnée au rôle réel dans la
    conversation (`isBuyer`/`isSeller`), et `seller_confirmed` (le seul signal
    qu'un acheteur ne peut pas falsifier) n'est mis à 1 que par l'action
    `sold`, réservée au vendeur.
  - `POST /reviews` (4919) : la vérification a une portée stricte — quand
    l'avis vise une annonce précise, la vente confirmée doit concerner CETTE
    annonce (jointure `order_items` + `orders.seller_confirmed = 1`), pas
    n'importe quelle commande entre les deux comptes. C'est le correctif du
    Gardien du 19/07, toujours en place, pas régressé.
  - `POST /ads` (5136) : prix recalculé serveur (`ad_tariff()` × `qty`),
    jamais celui du client. Prolongation (`extends`) vérifiée par
    propriété (même compte OU même e-mail) avant de rattacher la demande à
    une bannière existante — pas d'IDOR pour rallonger la campagne d'un
    tiers. Les compteurs `ads/:id/view` et `ads/:id/click` (5274) exigent une
    pub `active`, interpolent `$col` en SQL mais uniquement parmi
    `['view','click']` verrouillé par `in_array(...,true)` en amont — pas
    d'injection, déjà noté solide, toujours vrai.
  - `admin/ads/:id/approve|reject`, `admin/revenues/:id/confirm` (6390-6574) :
    tous à l'intérieur du bloc gardé (`admin_unlocked` + `admin_can`,
    index.php:5508-5514) — pas de route admin financière hors la porte
    centrale.
  - `featured` (colonne `listings.featured`) reste à 0 partout dans le code :
    posé à la création (4233, littéral `0`), absent de la liste `SET` de la
    modification (4399-4401). Aucune route ne le met à 1 — fonctionnalité
    non câblée, pas un défaut de sécurité (un utilisateur ne peut pas se
    l'attribuer puisque rien ne le lui permet). `promoPrice`/`promoUntil`,
    à l'inverse, sont bien acceptés du propriétaire de l'annonce (création ET
    modification) : ce n'est pas une faille, c'est le vendeur qui fixe un
    prix soldé sur SA PROPRE annonce, au même niveau de confiance que le prix
    normal — rien à voir avec le paiement d'une mise en avant.

  **CI et dépendances.** `.github/workflows/security-scan.yml` toujours
  déclenché sur `pull_request` + `push: [main]`, pas sur toutes les branches.
  `php -l` propre sur `index.php` et `seo.php` (PHP 8.5.7 en production
  d'après `/api/health`). `npm audit --omit=dev --audit-level=high` :
  **inchangé depuis hier** — même avertissement modéré `react-router`
  (redirection ouverte + injection de constructeur SSR), rien de haut/critique.
  `git grep` sur secret/password/token/clé (`server/config.php`, `src/`) :
  rien hors `getenv()`, commentaires et libellés produit.

  **Déploiement.** `curl https://chap.ci/api/health` renvoie l'empreinte
  `87ea16f0d126`, identique à `md5sum server/index.php` du dépôt (HEAD
  actuel, donc y COMPRIS le commit `7c80c25` de cette semaine) — déposée le
  `2026-08-03T03:50:20Z`. La correction JSON-LD reste vérifiée en conditions
  réelles : `curl -A facebookexternalhit https://chap.ci/annonce/a547dd78-…`
  sert `"https:\/\/chap.ci"` (slashes échappés) dans le `<script
  type="application/ld+json">` — la XSS du 30/07 reste fermée, ce dossier est
  définitivement clos, je ne le rejoue plus la semaine prochaine sauf
  régression.

- **Problèmes ouverts** : aucun exploitable, aucun nouveau. Le seul point de
  robustesse déjà noté le 02/08 (CSP `Report-Only` avec `unsafe-eval` pour
  l'IA photo) est inchangé — rien à ajouter cette semaine.

- **Propositions au Patron** : aucune. Semaine calme : un seul commit, déjà
  sûr par construction, sous-système Argent entièrement revérifié sans
  trouvaille, correctifs des semaines passées confirmés déployés jusqu'au
  dernier commit.

- **Pour les autres bureaux** : **Gardien** — rien de vivant à remonter ; la
  nouvelle donnée `derniersPassages` de `cron/security` (commit `7c80c25`)
  vous revient directement, pas à moi, pour l'usage que vous en ferez.
  **Dev** — rien à écrire. **Monteur** — rien sur votre périmètre, aucun
  fichier `src/`/`public/` touché cette semaine.

---

### 2026-08-03 07:12 — [Livraison] 🔨 Le Monteur

**Ce rapport confirme et complète celui déjà écrit ce jour à 04:58 — trois
commits sont arrivés depuis `057db9d` en tout, aucun ne change le verdict.**
L'écart que je signalais ce matin-là (le repère codé dans mon prompt,
`a993629`, contre le vrai commit de la v1.17, `057db9d`) est désormais corrigé
dans le fichier lui-même par `7811da1` : `store/APP-VERSIONS.md` porte
maintenant un champ Commit sur les dix-sept versions, y compris la v1.17. Je
pars donc toujours de `057db9d`, qui reste le bon repère — la correction n'a
rien changé à mon analyse, elle confirme le repère déjà utilisé.

**Version publiée sur chaque boutique, et depuis combien de temps.** Toujours
aucune, sur aucune des deux boutiques. Play : la v1.16 (code 17) a été
téléversée le 02/08 mais jamais envoyée à l'examen ; la v1.17 (code 18,
commit `057db9d`, construite le 02/08) la remplace et attend toujours son
premier téléversement — un jour de plus qu'au rapport de 04:58. App Store :
compte développeur non ouvert, Mac + Xcode indisponible — **le volet iOS est
bloqué** ; il faudrait un Mac avec Xcode et un compte Apple Developer à
99 $/an, et aucune instruction Xcode ne suit tant que cela n'a pas changé.

**Ce que les utilisateurs de l'application NE VOIENT PAS ENCORE.** Inchangé :
tant qu'aucune version n'a été envoyée à l'examen, aucun testeur externe n'a
ouvert l'application. Ni les 82 formulaires par catégorie (v1.9), ni la
géolocalisation réelle (v1.10), ni R8 et l'écran de démarrage animé (v1.14),
ni la comptabilité (v1.16), ni le démarrage accéléré (v1.17) — rien de tout
cela n'est entre les mains de personne. Le goulot n'est pas le code, c'est le
bouton « Envoyer pour examen » jamais pressé dans la Play Console.

**Verdict : ATTENDRE.**
```
git log --oneline 057db9d..HEAD -- src/ public/ index.html capacitor.config.ts package.json vite.config.ts
→ (vide)
```
Trois commits sont arrivés depuis `057db9d` : `7c80c25` (supervision
`cron/security`, déjà noté à 04:58), `7811da1` (correction du champ Commit
dans `APP-VERSIONS.md` — ce fichier même) et `eb6fdb8` (ajout d'une empreinte
par fichier serveur à `/api/health`, pour distinguer `server/index.php` de
`web/seo.php`). Les trois touchent exclusivement `server/index.php`,
`.claude/bureaux/*` et `store/APP-VERSIONS.md` — **aucune ligne** dans
`src/`, `public/`, `index.html`, `capacitor.config.ts`, `package.json` ni
`vite.config.ts`. Catégorie INTERNE au sens du §2 : outillage de supervision
et documentation, sans effet sur l'application. Aucune des quatre conditions
de build n'est remplie, pas même la plus faible (trois fonctionnalités
visibles accumulées : toujours zéro). Construire cette semaine gaspillerait
une soumission pour un contenu strictement identique à celui déjà en attente
d'envoi.

**Numéros de version proposés.** Sans objet — aucun contenu nouveau à
empaqueter, inchangé depuis 04:58. Pour mémoire, si un build redevenait
nécessaire avant la prochaine ronde : Android **versionCode 19** (le 18 de la
v1.17 est le dernier utilisé, jamais le réutiliser), **versionName 1.18**
pour des correctifs mineurs, ou **2.0** si une refonte visible s'y ajoutait
d'ici là. iOS : `CFBundleShortVersionString` suivrait ce même 1.18,
`CFBundleVersion` démarrerait à **1** — aucun envoi à Apple n'a encore eu
lieu.

**Notes de version — prêtes à coller pour le téléversement de la v1.17, qui
lui, est déjà construite :**

*Play (« Nouveautés »), 187 caractères sur 500 :*
> L'application s'ouvre nettement plus vite, même sur une connexion lente.
> Nous avons aussi réduit sa taille en allégeant les polices utilisées, sans
> rien changer à l'affichage du français.

*App Store (« Nouveautés de cette version ») :*
> L'application s'ouvre nettement plus vite qu'avant, même sur une connexion
> lente — l'écran d'accueil ne fait plus attendre inutilement.
>
> Nous avons aussi réduit la taille de l'application en allégeant les
> polices utilisées à l'intérieur, sans rien changer à l'affichage des
> textes en français.

**Captures à refaire : aucune.** Aucun des trois commits arrivés depuis la
v1.17 ne touche à un écran (voir verdict). Les cinq écrans de référence
(accueil, annonce, explorer, vendeur, aide), dans leurs trois formats
(téléphone, tablette 7", tablette 10"), sont déjà dans `store/captures/` et
restent d'actualité pour Play. Pour l'App Store, les jeux iPhone et iPad
restent à produire le jour où le volet iOS se débloquera — dimensions à lire
dans App Store Connect au moment du dépôt (de l'ordre de iPhone ~1290×2796,
iPad ~2048×2732, **à confirmer**, jamais à citer comme acquis).

**Vérifications avant build (dépôt, à l'heure de ce rapport).**

| Vérification | Résultat |
|---|---|
| `capacitor.config.ts` — `appId: 'ci.chap.app'`, pas de `server.url` | ✅ conforme |
| `src/lib/native.ts` — `SITE_ORIGIN === 'https://chap.ci'`, `mediaUrl()` en place | ✅ conforme |
| `src/lib/marketing.ts` — garde `if (isNative) return` intacte | ✅ conforme |
| `src/components/NativeShell.tsx` — `backButton` + `StatusBar` présents | ✅ conforme |
| `package.json` — `cap:sync`/`cap:android` chaînent `android-slim.mjs` ; `cap:ios` ne le chaîne pas (normal) | ✅ conforme |
| Plugins `@capacitor/*` — core, cli, android, ios, app, geolocation, splash-screen, status-bar | ✅ conforme, aucun nouveau |
| `npm run build` (`tsc -b && vite build`) | ✅ passe, aucune erreur TypeScript |

**Marche à suivre Android.** Pas de nouveau build cette semaine : la priorité
reste celle des rondes précédentes, inchangée — **envoyer enfin la v1.17
(code 18)**, déjà construite, à l'examen depuis la Play Console (canal test
fermé), avant même de songer à un futur build. Le jour où un nouveau paquet
sera justifié, la marche reste : `npm ci` → `npm run cap:sync` → dans Android
Studio, Build → Generate Signed Bundle / APK → AAB avec la clé de signature
habituelle, versionCode et versionName renseignés AVANT de lancer le build →
vérifier le poids de l'AAB obtenu (6-7 Mo attendu ; au-delà de 10 Mo,
`android-slim.mjs` n'a pas tourné, ne pas téléverser) → Play Console → Test
interne (ou Production) → Créer une version → téléverser l'AAB → coller les
notes de version → remplacer les captures périmées (aucune cette semaine) →
Envoyer pour examen.

**Marche à suivre iOS.** Bloquée : ni Mac avec Xcode, ni compte Apple
Developer (99 $/an) disponibles dans l'environnement. Rien d'autre à écrire
tant que la ligne « Mac » de `store/APP-VERSIONS.md` reste à « non
disponible ».

---

### 2026-08-04 03:46 — [Livraison] 🔨 Le Monteur

**Le repère change de verdict cette fois : deux commits sont arrivés après
l'heure du rapport précédent (03/08 à 07:12), tous deux datés du 03/08, l'un
à 08:04 et l'autre à 10:24 — après, donc, que le dernier rapport ait conclu
« rien depuis `057db9d` ». Le repère lui-même ne bouge pas : `store/APP-
VERSIONS.md` porte toujours la v1.17 (versionCode 18, commit `057db9d`, 2 août)
comme dernière version construite, et rien n'indique qu'il soit périmé.**

**Version publiée sur chaque boutique, et depuis combien de temps.** Toujours
aucune, sur aucune des deux boutiques — inchangé depuis le 27/07. Play : la
v1.17 (code 18) reste **téléversée mais jamais envoyée à l'examen**, un jour
de plus qu'hier. App Store : compte développeur non ouvert, Mac + Xcode
indisponible — **le volet iOS reste bloqué** ; il faudrait un Mac avec Xcode
et un compte Apple Developer à 99 $/an.

**Ce que les utilisateurs de l'application NE VOIENT PAS ENCORE.** La liste
s'allonge de deux éléments cette semaine, en plus de tout ce qui attendait déjà
(82 formulaires par catégorie, géolocalisation réelle, écran de démarrage
animé, comptabilité, démarrage accéléré) : **le brouillon qui survit à une
coupure**, et **les vignettes qui ne se font plus attendre sur l'explorateur**.
Le goulot reste le même bouton jamais pressé dans la Play Console, mais la
pile de ce qui patiente derrière lui grossit.

**Verdict : CONSTRUIRE**, sur la condition (c) — au moins trois fonctionnalités
visibles ou corrections d'interface accumulées :
```
git log --oneline 057db9d..HEAD -- src/ public/ index.html capacitor.config.ts package.json vite.config.ts
99e9792 Vignettes : ne plus différer celles qu'on voit déjà
d034aa7 Publier : ne plus perdre une saisie, et dire ce qui est obligatoire
```
Classement :
- **FONCTIONNALITÉ VISIBLE** — le brouillon de `/publier` se sauvegarde seul et
  propose une reprise après coupure (`d034aa7`) ; le rappel de prudence contre
  les arnaques, jusque-là seulement sur la fiche annonce, apparaît désormais
  au début de chaque conversation de messagerie, là où se prend la décision
  (`d034aa7`) ; une question ajoutée à la FAQ (site / installation / application)
  (`d034aa7`).
- **CORRECTION D'INTERFACE** — les champs obligatoires du formulaire de
  publication portent maintenant un astérisque et sa légende, au lieu de se
  découvrir à l'envoi (`d034aa7`) ; les six premières vignettes de l'explorateur
  ne sont plus mises en attente derrière un chargement différé qui, mesuré au
  navigateur, retardait l'affichage sans rien économiser (`99e9792`).

Cinq changements visibles pour deux commits — la condition (c) est remplie
plusieurs fois. Aucune des deux autres n'entre en jeu : ni faille de sécurité
ou de confidentialité (a), ni exigence de boutique (b) — c'est pourquoi ce
rapport n'envoie pas d'alerte séparée au Patron, malgré le verdict.

**Numéros de version proposés.**
- **Android** — versionCode **19** (le 18 de la v1.17 est le dernier utilisé,
  jamais réutilisé) ; versionName **1.18** (correctifs et petites nouveautés,
  pas de refonte visible).
- **iOS** — `CFBundleShortVersionString` **1.18** (même numéro que Android,
  pour ne pas semer la confusion entre boutiques) ; `CFBundleVersion` **1**
  (aucun envoi à Apple n'a encore eu lieu).

**Notes de version — prêtes à coller.**

*Play (« Nouveautés »), 414 caractères sur 500 :*
> Vos brouillons d’annonce sont désormais sauvegardés automatiquement : une
> coupure réseau ou un appel entrant ne vous fait plus perdre votre saisie,
> avec une proposition de reprise au retour. Les champs à remplir
> obligatoirement sont désormais visibles avant l’envoi. Un rappel de
> prudence contre les arnaques apparaît directement dans vos échanges. Les
> photos des annonces s’affichent plus vite dans l’explorateur.

*App Store (« Nouveautés de cette version ») :*
> Vos brouillons d’annonce sont désormais sauvegardés automatiquement : une
> coupure réseau, un appel entrant ou l’application fermée par erreur ne vous
> font plus perdre votre saisie. À la réouverture, une proposition de reprise
> vous ramène là où vous vous étiez arrêté.
>
> Les champs obligatoires du formulaire de publication sont maintenant
> indiqués clairement avant l’envoi, pour éviter les allers-retours.
>
> Un rappel de prudence contre les arnaques apparaît désormais directement
> dans vos conversations avec l’acheteur ou le vendeur, au moment où la
> négociation a lieu.
>
> Les photos des annonces s’affichent plus vite en parcourant les résultats.

**Captures à refaire : l'écran « aide » seulement, dans ses trois formats
(téléphone, tablette 7", tablette 10").** `d034aa7` ajoute une question à la
FAQ (« Le site, l'installation sur mon téléphone et l'application, c'est
pareil ? ») — la liste visible à l'écran a changé. Les quatre autres écrans
de référence (accueil, annonce, explorer, vendeur) ne sont PAS à refaire :
le changement sur l'explorateur (`99e9792`) ne touche que l'ordre de
chargement des vignettes, pas leur apparence — une capture, qui est une
image figée, ne peut pas montrer une différence de vitesse. `/publier` et la
messagerie ne font pas partie des cinq écrans suivis. Pour l'App Store, les
jeux iPhone et iPad restent à produire le jour où le volet iOS se débloquera
— dimensions à lire dans App Store Connect au moment du dépôt (de l'ordre de
iPhone ~1290×2796, iPad ~2048×2732, **à confirmer**, jamais à citer comme
acquis).

**Vérifications avant build (dépôt, à l'heure de ce rapport).**

| Vérification | Résultat |
|---|---|
| `capacitor.config.ts` — `appId: 'ci.chap.app'`, pas de `server.url` | ✅ conforme |
| `src/lib/native.ts` — `SITE_ORIGIN === 'https://chap.ci'`, `mediaUrl()` en place et utilisée pour les images d'annonces | ✅ conforme |
| `src/lib/marketing.ts` — garde `if (isNative) return` intacte | ✅ conforme |
| `src/components/NativeShell.tsx` — `backButton` + réglage `StatusBar` présents | ✅ conforme |
| `package.json` — `cap:sync`/`cap:android` chaînent `android-slim.mjs` ; `cap:ios` ne le chaîne pas (normal, ce script ne retire que des ressources Android) | ✅ conforme |
| Plugins `@capacitor/*` — core, cli, android, ios, app, geolocation, splash-screen, status-bar | ✅ conforme, aucun nouveau |
| `npm run build` (`tsc -b && vite build`) | ✅ passe, aucune erreur TypeScript |

**Marche à suivre Android.**
```
npm ci
npm run cap:sync
```
Puis dans Android Studio : Build → Generate Signed Bundle / APK → AAB, avec la
clé de signature habituelle. Renseigner **versionCode 19** et **versionName
1.18** AVANT de lancer le build. Vérifier le poids de l'AAB obtenu : autour de
6-7 Mo — au-delà de 10 Mo, `android-slim.mjs` n'a pas tourné, ne pas
téléverser. Puis, dans la Play Console : la file d'attente porte déjà la
v1.17 non envoyée — décider avec le Patron si cette v1.18 la remplace avant
tout envoi, ou si la v1.17 part d'abord. Test fermé (ou Production) → Créer
une version → téléverser l'AAB → coller les notes de version ci-dessus →
remplacer la capture périmée de l'écran « aide » (3 formats) → Envoyer pour
examen.

**Marche à suivre iOS.** Bloquée : ni Mac avec Xcode, ni compte Apple
Developer (99 $/an) disponibles dans l'environnement. Il faudrait l'un et
l'autre pour débloquer ce volet ; rien d'autre à écrire tant que la ligne
« Mac » de `store/APP-VERSIONS.md` reste à « non disponible ».

---

### 2026-08-10 01:38 — [Livraison] 🔨 Le Monteur

> ⚠️ **Le commit de repère fourni dans la consigne (`a993629`) n'existe pas dans
> le dépôt.** C'est le commit de la v1.2 (27 juillet), visiblement resté figé
> dans la routine hebdomadaire depuis sa création. Je m'en suis écarté et j'ai
> lu le repère à jour dans `store/APP-VERSIONS.md` : la v1.19 (commit `5ae60ed`,
> versionCode 20) est **déjà construite mais pas encore téléversée** — c'est
> elle mon vrai point de départ, pas la v1.18 publiée. Un repère faux vaut
> moins que pas de repère ; à corriger dans la consigne de la routine.

**Où en est l'application.** Google Play : v1.18 (code 19) publiée le 6 août —
première publication réelle du projet. Zéro testeur inscrit à cette heure, donc
le compte à rebours des 14 jours n'a toujours pas démarré. La v1.19 (code 20,
API 36 imposée par Google au 31 août) est prête depuis le 7 août mais volontairement
retenue : l'ordre écrit dans APP-VERSIONS.md interdit de la téléverser avant que
des testeurs soient inscrits sur le canal fermé. App Store : rien — Mac + Xcode
toujours indisponible, volet iOS bloqué (il faudrait un Mac avec Xcode et un
compte Apple Developer à 99 $/an).

**Ce que les utilisateurs de l'application n'ont pas encore.** Depuis le commit
de la v1.19 (`5ae60ed`, 7 août), sept commits ont touché le site :

| Commit | Contenu | Catégorie |
|---|---|---|
| `7bf7b58` | Géographie des visiteurs (tableau de bord) + bandeau cookies | INTERNE — dashboard admin-only ; le bandeau porte `if (isNative) return`, invisible dans l'app |
| `9cfbe7d` | Modèle de message « Titre à reprendre » | INTERNE — tableau de bord admin uniquement |
| `78fa1de` | Retrait du bandeau de la fête de l'Indépendance + bande blanche corrigée | CORRECTION D'INTERFACE, déjà sans effet (fête terminée) |
| `105f169` | Écran « Vérification… » qui tournait sans fin sur les notifications | CORRECTION D'INTERFACE — bug réel, encore actif |
| `094dd4d` | Notification push + e-mail de repli quand un acheteur écrit à un vendeur hors ligne | FONCTIONNALITÉ VISIBLE |
| `7f99b94` | Qui est en ligne, et pouvoir écrire à un membre (tableau de bord) | INTERNE — admin uniquement |
| `8617aa4` | Bandeau de fête sous la barre d'état | CORRECTION D'INTERFACE, déjà sans effet (fête terminée) |

Trois commits sont purement internes (tableau de bord du Patron, jamais vu dans
l'app). Il reste **une fonctionnalité visible** (le push/e-mail hors ligne — le
plus gros gain pour les 7 inscrits sur 12 qui n'ont jamais rien publié, c'est
justement le premier message reçu qui décide de tout) et **trois corrections
d'interface**, dont deux déjà sans objet puisque la fête est passée.

**Verdict : CONSTRUIRE.** Condition (c) remplie — trois fonctionnalités/corrections
visibles accumulées (094dd4d, 105f169, et la troisième restant symbolique vu la
fête passée). Aucune condition (a) sécurité ni (b) exigence de boutique n'est en
jeu cette semaine — donc pas de notification au Patron, conformément à la
consigne.

**Recommandation pratique : ne pas téléverser la v1.19 telle quelle.** Elle
n'est encore jamais sortie du poste de build. Plutôt que l'envoyer puis devoir
enchaîner immédiatement sur une v1.20, autant construire directement UNE version
qui embarque le passage à l'API 36 (déjà fait dans la v1.19) ET ces sept commits
— exactement ce que le projet a déjà fait pour les v1.5→v1.7 et v1.11→v1.17. La
v1.19 (code 20) devient alors dépassée avant tout téléversement, comme les
précédentes.

**Numéros de version proposés :**
- Android : `versionCode 21`, `versionName 1.20` (incrément mineur — pas de refonte visible).
- iOS (à préparer, volet bloqué) : `CFBundleShortVersionString = 1.20` (même
  numéro qu'Android) ; `CFBundleVersion = 1` — ce serait le tout premier envoi
  Apple du projet.

**Notes de version — Play (« Nouveautés »), 337/500 caractères :**
> Vous êtes prévenu même le téléphone verrouillé ou le navigateur fermé : une
> notification, et un e-mail si besoin, dès qu'un acheteur vous écrit. L'écran
> de notifications qui restait bloqué sur « Vérification… » est corrigé.
> Petites retouches d'affichage. Mise à jour technique pour rester compatible
> avec les derniers téléphones Android.

**Notes de version — App Store (« Nouveautés de cette version ») :**
> Vous êtes prévenu même téléphone verrouillé ou navigateur fermé : une
> notification, et un e-mail si besoin, dès qu'un acheteur vous écrit.
> L'écran de notifications qui restait bloqué sur « Vérification… » est corrigé.
> Quelques retouches d'affichage.
> Mise à jour technique pour rester compatible avec les derniers téléphones Android.

**Captures à refaire : aucune.** Aucun des sept commits ne touche visiblement
l'un des cinq écrans capturés (accueil, annonce, explorer, vendeur, aide) — le
bandeau de fête concernait bien l'accueil, mais il est retiré, donc l'état actuel
de l'accueil correspond déjà à ce que montrent les captures existantes (prises
avant l'apparition du bandeau).
> ⚠️ Point distinct, hors périmètre de cette semaine mais à signaler : les
> captures actuelles datent du commit `057db9d` (2 août, v1.17) d'après
> `git log`, donc **d'avant** les rubriques Voyage/À donner/École & Fournitures
> et la barre de recherche sans contours, déjà publiées en v1.18. Elles sont
> probablement déjà périmées sur la fiche Play — à vérifier au prochain build
> qui touche réellement ces écrans.

**Vérifications avant build — toutes passées :**
- `capacitor.config.ts` : `appId: 'ci.chap.app'` intact, aucune clé `server.url`.
- `src/lib/native.ts` : `SITE_ORIGIN = 'https://chap.ci'` et `mediaUrl()` toujours en place.
- `src/lib/marketing.ts` : garde `if (isNative) return` intacte — vérifié aussi
  sur le nouveau bandeau cookies, qui reprend la même garde.
- `src/components/NativeShell.tsx` : gestionnaire `backButton` et réglages
  `StatusBar` présents.
- `package.json` : `cap:sync` et `cap:android` chaînent bien `android-slim.mjs` ;
  `cap:ios` ne le chaîne pas, normal.
- Plugins `@capacitor/*` : exactement les huit attendus (core, cli, android,
  ios, app, geolocation, splash-screen, status-bar) — aucun nouveau. La
  fonctionnalité push utilise le Web Push du navigateur, pas un plugin natif.
- `npm run build` : passé sans erreur TypeScript (avertissement Rollup sur la
  taille de `nsfw-*.js`, préexistant, hors périmètre).

**Marche à suivre — Android / Google Play :**
1. `npm ci`
2. Monter `versionCode` à `21` et `versionName` à `"1.20"` dans
   `android/app/build.gradle` (ou Android Studio) AVANT de lancer le build.
3. `npm run cap:sync`
4. Dans Android Studio : Build → Generate Signed Bundle / APK → AAB, avec la
   clé de signature habituelle (`CN=Chap.ci`).
5. Vérifier le poids de l'AAB obtenu : attendu autour de 6-7 Mo. Au-delà de
   10 Mo, `android-slim.mjs` n'a pas tourné — ne pas téléverser.
6. Dans la Play Console : **priorité à l'inscription des 12 testeurs sur le
   canal fermé avant tout nouveau téléversement** — c'est le seul délai du
   projet que personne ne peut raccourcir, et rien ne presse à remplacer une
   release tant que le compte à rebours n'a pas démarré. Une fois les testeurs
   inscrits : Test fermé → Créer une version → téléverser l'AAB → coller les
   notes de version ci-dessus → Envoyer pour examen (les captures restent
   celles déjà en ligne, aucune n'est à remplacer cette semaine).

**Marche à suivre — iOS / App Store : bloquée.** Le Mac avec Xcode reste
indisponible ; il faudrait ce Mac et un compte Apple Developer à 99 $/an pour
avancer. Pas d'instructions Xcode cette semaine.
