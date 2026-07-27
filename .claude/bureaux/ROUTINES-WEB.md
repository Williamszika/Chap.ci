# Chap.ci — Les routines « avec code » (Claude Code sur le web)

Variante des routines des bureaux, à créer sur **https://claude.ai/code/routines**
(« Claude Code sur le web »). Contrairement aux routines de **chat** claude.ai, celles-ci
**clonent le dépôt chap.ci à chaque exécution** → les bureaux voient le code, lisent le
journal, exécutent `curl` / `php` / `git`.

> ⚠️ **Ce fichier ne contient plus les prompts.** Les prompts canoniques — un par bureau —
> vivent dans `.claude/bureaux/routine-*.md`. Les recopier ici a produit deux versions
> divergentes : la copie condensée est restée sur l'ancienne méthode `?key=` pendant des
> semaines, avec un appel à `cron/backup` qui **détruisait les sauvegardes**. Une seule
> source de vérité désormais : **prenez le prompt du fichier du bureau, puis appliquez
> les trois différences ci-dessous.**

---

## 0) Réglage à faire UNE FOIS (sinon les `curl` vers chap.ci échouent)

À la création de la 1ʳᵉ routine :
1. **Repositories / Dépôts** → ajoutez **williamszika/chap.ci**.
2. **Environnement** (icône nuage) → **réglages** → **Network access** → **Custom** :
   ```
   chap.ci
   *.chap.ci
   ```
   Cochez **« Also include default list »** (garde GitHub, npm…), puis **Save**.

Les routines suivantes réutilisent le même environnement (réseau déjà autorisé).

## 1) Les 9 prompts et leur cadence

| Bureau | Prompt canonique | Cadence exacte (`/schedule`) |
|---|---|---|
| 🛡️ Confiance & Sécurité | `routine-securite.md` | `0 */5 * * *` (toutes les 5 h) |
| 📣 Croissance | `routine-croissance.md` | `0 8 */2 * *` (tous les 2 jours) |
| 🎨 Design & Typographie | `routine-design.md` | `0 9 */3 * *` (tous les 3 jours) |
| 📊 Données & Rapports | `routine-donnees.md` | `0 8 * * 1` (lundi 8 h) |
| ⚡ Performance & Fiabilité | `routine-performance.md` | `0 7 * * 1` (lundi 7 h) |
| 🤝 Support & Expérience | `routine-support.md` | `0 10 * * 1` (lundi 10 h) |
| ⚖️ Juridique | `routine-juridique.md` | `0 9 1 * *` (1ᵉʳ du mois) |
| 🗂️ Secrétariat | `routine-secretariat.md` | `0 20 * * 1` (lundi 20 h) |
| 🔨 Livraison de l'app (Play + App Store) | `routine-build.md` | `0 6 * * 1` (lundi 6 h) — **web obligatoire** |

⚠️ Le **Monteur** est le seul bureau qui ne peut PAS tourner en routine de chat : il ne lit
que le dépôt (`git log`, `store/APP-VERSIONS.md`, `package.json`). Son prompt est déjà livré
en version web complète — **collez-le tel quel**, ne lui appliquez pas les adaptations du §2.

Deux secrets seulement, tous deux dans **Admin → Tâches auto** : la **clé cron**
(`CLE_CRON_ICI`, tous les bureaux sauf Design et Juridique) et le **jeton de modération**
(`JETON_MODERATION_ICI`, réservé au Gardien). **Ne les écrivez jamais dans le dépôt.**

---

## 2) Les trois différences par rapport aux routines de chat

Collez le prompt du fichier du bureau, puis modifiez **uniquement** ceci :

### a) Le dépôt est cloné — dites-le au bureau

Ajoutez en tête du prompt :

```
Le dépôt chap.ci est cloné dans ta session : lis le code directement (src/,
server/index.php, web/seo.php, .claude/bureaux/JOURNAL.md) au lieu de te
contenter de ce qui est servi en ligne. Tu peux lancer :
  php -l server/index.php web/seo.php
Tu ne modifies AUCUN fichier applicatif et tu ne touches JAMAIS à la branche
principale.
```

### b) Le bureau peut écrire le journal — sur `bureaux/journal` uniquement

Les prompts canoniques se terminent par *« Tu n'as pas l'accès écriture au dépôt :
remets ce rapport au Secrétariat. »* En version web, **remplacez cette phrase par** :

```
Écris ton compte-rendu dans .claude/bureaux/JOURNAL.md (ajout à la fin, jamais
de réécriture des entrées existantes) et pousse-le sur la branche bureaux/journal,
et sur elle seule :
  git checkout bureaux/journal 2>/dev/null || git checkout -b bureaux/journal
  git add .claude/bureaux/JOURNAL.md
  git commit -m 'journal: <ton bureau>'
  git push -u origin bureaux/journal
NE modifie AUCUN autre fichier. NE pousse JAMAIS sur main ni sur une branche de
travail. Si le push échoue, laisse le rapport dans ta réponse — n'insiste pas.
```

C'est le seul intérêt réel de la version web : le journal cesse de dépendre d'une
recopie manuelle. Le Dev fusionne ensuite `bureaux/journal` quand il le juge bon.

### c) Le Secrétariat lit le journal poussé par les autres

Dans `routine-secretariat.md`, §1, ajoutez avant la lecture du journal :

```
git fetch origin bureaux/journal 2>/dev/null &&
git show origin/bureaux/journal:.claude/bureaux/JOURNAL.md
```

Si la branche n'existe pas encore, lisez le fichier du dépôt principal.

---

## 3) Ce qui ne change PAS (et qui n'est pas négociable)

Ces règles sont écrites dans chaque prompt canonique — ne les allégez pas en les
recopiant :

- **Clé dans l'en-tête `X-Cron-Key`, jamais en `?key=`**, et **toujours entre
  apostrophes simples** :
  ```
  curl -sS -H 'X-Cron-Key: CLE_CRON_ICI' 'https://chap.ci/api/cron/stats?days=30'
  ```
- **⛔ Routes interdites aux bureaux** : `backup`, `cleanup`, `digest`, `report-email`,
  `activation-relance`, `review-invites`, `alerts`, `suggestions`. Elles écrivent ou
  envoient des e-mails. `cron/backup` crée une sauvegarde à chaque appel et le serveur
  n'en garde que 7 — trois appels « pour vérifier » effacent trois jours d'historique.
  Seules exceptions : le **Gardien** pour `cleanup` et la modération, le **Secrétariat**
  pour `report-email` (une fois par semaine).
- **Un UUID d'annonce fait 36 caractères.** Une annonce inexistante redirige en 302 vers
  l'accueil : c'est voulu, ce n'est pas un bug.
- **Les bureaux proposent, le Patron ordonne, le Dev exécute** (build + tests avant tout
  déploiement). Aucun bureau ne modifie le code applicatif, ne bannit un compte, ni ne
  déploie.

## 4) À la fin : éviter les doublons

Un bureau ne doit tourner qu'**une seule fois** : soit en routine de chat, soit en
routine « avec code ». Si vous basculez un bureau ici, **supprimez sa routine de chat**
— sinon le journal reçoit deux rapports par ronde et le Secrétariat les compte deux fois.
