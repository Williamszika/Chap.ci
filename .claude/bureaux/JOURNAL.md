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
