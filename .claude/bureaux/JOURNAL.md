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
