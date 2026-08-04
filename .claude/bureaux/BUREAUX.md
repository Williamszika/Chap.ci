# Chap.ci — Les Bureaux (organisation des agents)

Chap.ci est géré comme une petite entreprise : plusieurs **bureaux** (équipes
d'agents planifiés), chacun avec un **chef**. Les chefs **communiquent** via un
journal de bord commun. Les bureaux **proposent** ; **le Patron ordonne** ; le
**Bureau Développement exécute**.

## Les fichiers de ce dossier

| Fichier | Ce qu'il porte |
|---|---|
| [`COMMUN.md`](COMMUN.md) | **le socle commun** — ce que tout bureau doit savoir : chiffres à mesurer plutôt qu'à recopier, état Play, clé cron, routes interdites, remise du rapport. **Source unique** : chacun de ces points ne s'écrit qu'ici. |
| `routine-*.md` | un prompt de référence par bureau. Chacun ouvre sur un renvoi vers `COMMUN.md`. |
| [`JOURNAL.md`](JOURNAL.md) | le registre chronologique des rondes et des décisions. C'est lui qui porte les séries de chiffres, jamais les routines. |
| [`ROUTINES-WEB.md`](ROUTINES-WEB.md) | comment créer les routines dans claude.ai. |

**Un chiffre recopié dans une routine ne se met jamais à jour tout seul.** Six routines
ont porté « 3 annonces actives, 1 vendeur » du 25 juillet au 4 août 2026, alors que le
catalogue en comptait plus du double. Ce qui bouge se mesure ; ce qui se mesure va au
JOURNAL ; les routines disent **comment** mesurer.

---

## La règle d'or (protocole de décision)

1. **Les bureaux PROPOSENT.** Chaque bureau produit des rapports et des
   propositions concrètes. Il ne modifie **jamais** le code, la config ou le
   serveur de lui-même.
2. **Le Patron ORDONNE.** L'administrateur (vous) reçoit les propositions et
   choisit ce qui est fait.
3. **Le Bureau Développement EXÉCUTE.** Uniquement les propositions validées, en
   session interactive, avec build + tests, et ne pousse/déploie que sur ordre.

> Aucun agent planifié ne commite de code applicatif ni ne déploie tout seul.
> Seule exception encadrée : la **Modération** peut masquer une annonce via l'outil
> admin prévu (action réversible et tracée) — mais jamais bannir seule ni toucher au code.

---

## Direction générale

**Le Secrétariat** — la session interactive (Claude Code + le Patron). Rôle :
consolider le journal de bord, présenter les propositions des chefs au Patron
pour validation, puis transmettre les ordres au Bureau Développement.

En plus, une **routine hebdomadaire « Secrétariat — synthèse »**
(`routine-secretariat.md`) rassemble le travail de tous les bureaux et **l'envoie
par e-mail** au Patron **et** à contact@chap.ci (via `POST /api/cron/report-email`,
qui vise par défaut le propriétaire + contact@chap.ci). C'est le rapport « état de la
maison » chaque lundi soir.

---

## Les bureaux et leurs chefs

Après réorganisation : **9 bureaux**. Deux fusions (Santé→Sécurité ; Modération→Sécurité)
et trois créations (Performance, Support, **Sécurité du code**). La Croissance passe
**tous les 2 jours**. La revue de code profonde, autrefois « mensuelle » chez le Gardien,
devient **hebdomadaire** et revient au 🔒 Serrurier.

| Bureau | Chef | Mission | Cadence |
|---|---|---|---|
| **Confiance & Sécurité** | 🛡️ *Le Gardien* | Surveillance **vivante** : sécurité + bugs + santé serveur **+ modération des annonces** (interdits, arnaques, doublons) · scan de code léger | scan **toutes les 5 h** · modération **quotidienne** |
| **Sécurité du code** | 🔒 *Le Serrurier* | Relecture **profonde** du code (diff de la semaine + un sous-système par rotation), avec l'œil d'un attaquant. **Sans secret** ; lit le dépôt, ne touche jamais la production | hebdo (lundi 5 h, **web**) |
| **Développement** | 🔨 *Le Bâtisseur* | Implémente les propositions validées : build, tests, déploiement | à la demande (sessions interactives) |
| **Design & Typographie** | 🎨 *L'Atelier* | Scan design (propositions, lecture seule), système visuel, polices, accessibilité, note ivoirienne | scan **tous les 3 j** · audit profond trimestriel |
| **Croissance** | 📣 *Le Crieur* | **SEO + Google + poussée des mots-clés des annonces sur tout le net** (site **et** app), veille concurrence | **tous les 2 jours** ⭐ |
| **Données & Rapports** | 📊 *Le Comptable* | **Rapport d'activité + sourcing/import réunis** en une seule routine | hebdo |
| **Performance & Fiabilité** | ⚡ *Le Mécanicien* | Vitesse et poids mobile (3G, Android faible, data chère), Core Web Vitals, uptime, sauvegardes | hebdo (+ vérif uptime quotidienne) |
| **Support & Expérience** | 🤝 *Le Concierge* | Écoute utilisateurs, FAQ, parcours, points de friction, satisfaction | hebdo |
| **Juridique** | ⚖️ *Le Juriste* | Veille juridique CI, conformité ARTCI, RGPD | mensuel |

---

## Compétences (skills) par bureau

Chaque bureau **charge en lecture seule** les skills du dépôt (`.claude/skills/`)
qui outillent sa mission. ⭐ = skill créé pour cette réorganisation.

| Bureau | Skills mobilisés |
|---|---|
| 🛡️ Confiance & Sécurité | `moderation-ci` ⭐ · `security-review` · `deep-research` |
| 🔒 Sécurité du code | `security-review` |
| 🔨 Développement | *tous, selon la tâche validée* (exécute build + tests) |
| 🎨 Design & Typographie | `design-ivoirien` · `marketplace-design` · `typographie` · `apple-design` · `affiche-design` · `review-animations` · `find-animation-opportunities` · `improve-animations` · `a11y-contraste` ⭐ |
| 📣 Croissance | `seo-ivoirien` ⭐ · `deep-research` · `dataviz` · `affiche-design` · `typographie` |
| 📊 Données & Rapports | `dataviz` · `deep-research` · `pdf` / `docx` / `pptx` |
| ⚡ Performance & Fiabilité | `perf-mobile-ci` ⭐ · `security-review` |
| 🤝 Support & Expérience | `moderation-ci` ⭐ · `a11y-contraste` ⭐ · `dataviz` |
| ⚖️ Juridique | `deep-research` · `pdf` / `docx` |

> Skills à créer par le Patron dans **claude.ai → Skills** : `seo-ivoirien`,
> `moderation-ci`, `perf-mobile-ci`, `a11y-contraste` (leurs `SKILL.md` sont déjà
> dans `.claude/skills/`). Les autres existent déjà.

**Bibliothèque de polices gratuites (Design 🎨 + Croissance 📣).** Ces deux bureaux
peuvent puiser dans toutes les sources gratuites — Google Fonts, Fontshare, Font
Squirrel, The League of Moveable Type, Open Foundry, 1001 Fonts, FontSpace, DaFont —
en **vérifiant systématiquement la licence** (Chap.ci est commercial : OFL/Apache/MIT
ou « free for commercial use » exigé ; DaFont/FontSpace/1001Fonts = cas par cas).
Détails, priorités et procédure d'intégration (auto-hébergement woff2, RGPD, 2 familles
max) dans le skill **`typographie`** → section « Où récupérer des polices gratuites ».
Comme tout le reste : l'Atelier/le Crieur **proposent** (avec preuve de licence), le
**Dev intègre** après validation, jamais de police en prod sans build + tests.

---

## Ce qui a changé (journal de la réorganisation)

- **Santé serveur** n'est plus un bureau à part → **fusionnée dans la Sécurité**
  (le Gardien vérifie la santé pendant son scan des 5 h).
- **Modération** fusionnée dans la Sécurité → bureau **« Confiance & Sécurité »**
  (même chef, le Gardien ; la modération garde sa cadence quotidienne).
- **Rapport d'activité + Sourcing/import** réunis en **une seule routine** au sein
  du bureau **Données & Rapports** (fini les deux passages séparés).
- **Croissance** passe de « mensuel/hebdo » à **tous les 2 jours** — priorité
  visibilité — avec une mission SEO élargie (voir ci-dessous).
- **+ Performance & Fiabilité (⚡ Le Mécanicien)** : nouveau bureau.
- **+ Support & Expérience (🤝 Le Concierge)** : nouveau bureau.

### La mission élargie de la Croissance (📣 Le Crieur)

Le Crieur doit **faire voir le site ET l'application par tout le net**, tous les
2 jours :
- **Travailler avec Google** : sitemap + Search Console, données structurées
  (schema.org `Product`/`Offer`, prix FCFA/XOF, dispo) pour les *rich results*.
- **Pousser les mots-clés créés par les annonces** : extraire les vrais termes
  (catégorie + commune, marque + modèle, français ivoirien) et les porter sur
  Google **et partout** (IndexNow → Bing/Yandex, réseaux, aperçus WhatsApp/FB).
- **Indexation instantanée** : chaque nouvelle annonce est signalée au net (IndexNow),
  pas seulement au prochain crawl.
- Outillé par le skill **`seo-ivoirien`**. Détails techniques dans
  **`routine-croissance.md`**.

---

## La communication entre chefs — le Journal de bord

Fichier partagé : **`.claude/bureaux/JOURNAL.md`** (branche `bureaux/journal`).

À **chaque passage**, un chef :
1. **LIT** les dernières entrées du journal → prend connaissance des *updates* et
   des *problèmes ouverts* des autres bureaux, et en tient compte.
2. Fait son travail.
3. **AJOUTE** son entrée au journal (best effort : `git` sur la branche
   `bureaux/journal`), au format :

```
### AAAA-MM-JJ HH:MM — [Bureau] Chef
- **Fait** : …
- **Problèmes ouverts** : … (ou « aucun »)
- **Propositions au Patron** : … (ou « aucune »)
- **Pour les autres bureaux** : … (dépendances, alertes)
```

Le **Secrétariat** consolide le journal et présente au Patron les propositions à
valider. Les problèmes signalés par un bureau qui concernent un autre bureau
sont relayés.

---

## Cadences (récapitulatif)

| Quand | Bureau / routine |
|---|---|
| **Toutes les 5 h** | 🛡️ Confiance & Sécurité — scan sécurité, bugs & santé serveur |
| Quotidien | 🛡️ Modération des annonces · ⚡ vérif uptime |
| **Tous les 2 jours** ⭐ | 📣 Croissance — SEO, Google, poussée des mots-clés (site + app) |
| **Tous les 3 jours** | 🎨 Design — scan (propositions, lecture seule) |
| Hebdo | 📊 Données (rapport + sourcing) · ⚡ Performance · 🤝 Support · 🔒 Sécurité du code (revue profonde, lundi 5 h) |
| Mensuel | ⚖️ Veille juridique |
| Trimestriel | 🎨 Audit design profond |

> Le scan des 5 h est **léger et ciblé** (code récent, `npm audit`, secrets,
> endpoints, santé serveur). L'audit **profond** reste mensuel pour ne pas gaspiller.

---

## Protocole v2 — communiquer avec le serveur & résoudre en profondeur

Les bureaux restent des **routines Claude** (l'intelligence). Mais ils ne doivent
pas travailler « à l'aveugle » : ils **s'appuient sur les données réelles du
serveur** et **remontent à la cause racine** au lieu de décrire des symptômes.

### 1. Communiquer avec le serveur (données réelles)
Chaque bureau ancre son analyse sur les endpoints serveur (clé cron requise) :

```
curl -sS -H 'X-Cron-Key: <CLE_CRON>' 'https://chap.ci/api/cron/stats?days=30'     # activité
curl -sS -H 'X-Cron-Key: <CLE_CRON>' 'https://chap.ci/api/cron/security?days=7'   # sécurité
```

- `<CLE_CRON>` = la clé cron réelle, à récupérer sur **Admin → Tâches auto**
  (le bouton « Commande cPanel » la copie déjà correctement écrite).
- **La clé passe par l'en-tête `X-Cron-Key`, jamais en `?key=`** : dans l'URL, elle
  finirait dans les journaux du serveur. Le paramètre `?key=` reste accepté, mais
  uniquement comme repli pour les tâches cron cPanel.
- **Toujours entre apostrophes simples.** Entre guillemets doubles, le shell avale
  silencieusement tout ce qui ressemble à `$VARIABLE` — c'est la cause des « 403 Clé
  invalide » incompréhensibles de juillet.
- Ces endpoints sont en **lecture seule** (aucun effet de bord). Les routes qui
  **écrivent ou envoient** (`backup`, `cleanup`, `digest`, `report-email`,
  `activation-relance`, `review-invites`, `alerts`, `suggestions`) sont **interdites**
  aux bureaux — `cron/backup` en particulier crée une sauvegarde à chaque appel et le
  serveur n'en garde que 7.
- Un bureau qui parle de « baisse de trafic » ou « pic d'échecs » **cite les
  chiffres réels** tirés de là — jamais d'affirmation non sourcée.

### 2. Résoudre en profondeur (cause racine, pas symptôme)
Face à un problème, le bureau **ne s'arrête pas au symptôme** :
1. Reproduit / confirme avec les données (serveur, logs, code).
2. Remonte à la **cause racine** (dans le code, les données ou la config).
3. Propose un **correctif concret et vérifiable** :
   - Code → `fichier:ligne` + **Avant/Après**.
   - Config/serveur → **étapes exactes** (cPanel, config.php…).
   - Toujours dire **comment vérifier** que le correctif marche.

### 3. La règle d'or reste absolue
Le bureau **PROPOSE** (diagnostic profond + correctif prêt). **Le Patron ORDONNE.**
Le **Bureau Développement EXÉCUTE** (en session interactive, avec test). Aucun
bureau n'applique/commite/déploie de lui-même — même pour un « problème profond ».

> Résumé : **données réelles → cause racine → correctif prêt → validation du
> Patron → exécution par le Dev.**

---

## Les prompts de routine (à créer dans claude.ai → Routines)

| Routine | Fichier | Cadence conseillée |
|---|---|---|
| 🛡️ Confiance & Sécurité (+ santé + modération) | `routine-securite.md` | `0 */5 * * *` |
| 🎨 Design — scan | `routine-design.md` | `0 9 */3 * *` |
| 📣 Croissance — SEO | `routine-croissance.md` | `0 8 */2 * *` |
| 📊 Données & Rapports (rapport + sourcing) | `routine-donnees.md` | `0 8 * * 1` |
| ⚡ Performance & Fiabilité | `routine-performance.md` | `0 7 * * 1` |
| 🤝 Support & Expérience | `routine-support.md` | `0 10 * * 1` |
| ⚖️ Juridique | `routine-juridique.md` | `0 9 1 * *` |
| 🗂️ Secrétariat — synthèse (e-mail au Patron + contact@chap.ci) | `routine-secretariat.md` | `0 20 * * 1` |
| 🔒 Sécurité du code (revue profonde, **web**, sans secret) | `routine-serrurier.md` | `0 5 * * 1` |

> Chaque routine est **lecture seule / proposition** (sauf la modération, action
> admin réversible). La clé cron réelle ne figure **jamais** dans ces fichiers ni
> dans le dépôt : vous la collez au moment de créer la routine.
