# Sortir la clé cron des écrans — et la changer en deux endroits, pas quatorze

Écrite le 11/09/2026, après la **troisième** exposition de secret en deux jours.

---

## Le problème n'est pas la capture d'écran

L'écran **cPanel → Tâches Cron** affiche la clé en clair, **dans chacune des treize
lignes**. Il n'y a aucun moyen de le regarder, de le photographier ou de le montrer à
quelqu'un sans la donner.

Ce n'est donc pas une maladresse à éviter : c'est une fuite **par construction**, et elle
se reproduira à chaque fois qu'on aura besoin de regarder cet écran — c'est-à-dire à
chaque vérification de tâche cron.

Le second problème vient avec : **changer la clé demande aujourd'hui quatorze
modifications** — `api/config.php` plus les treize commandes. Une seule oubliée, et la
tâche s'arrête sans se plaindre. C'est ainsi qu'on a perdu douze jours de sauvegardes.

**Les deux problèmes ont la même solution.**

---

## La solution : la clé vit dans un fichier, les commandes la lisent

Au lieu d'écrire la clé dans chaque commande :

```bash
curl -sS -H 'X-Cron-Key: LA_CLE_EN_CLAIR' 'https://chap.ci/api/cron/backup' >/dev/null 2>&1
```

on la fait lire dans un fichier :

```bash
curl -sS -H "X-Cron-Key: $(cat ~/.chapci-cron-key)" 'https://chap.ci/api/cron/backup' >/dev/null 2>&1
```

L'écran des tâches cron n'affiche alors plus que `$(cat ~/.chapci-cron-key)`. La clé
n'y est plus. Et le jour où on la change, **on modifie deux fichiers au lieu de
quatorze** : `api/config.php` et celui-là.

⚠️ **Les guillemets changent de forme, et ce n'est pas un détail.**
`"X-Cron-Key: $(cat …)"` prend des guillemets **doubles** — ce sont eux qui permettent au
shell d'exécuter le `$(cat …)`. Avec des apostrophes simples, le serveur recevrait
littéralement les caractères `$(cat ~/.chapci-cron-key)` et répondrait « Clé invalide ».
**L'URL, elle, garde ses apostrophes simples.**

---

## L'ordre des opérations — à respecter, sinon tout casse

**Ne changez pas la clé d'abord.** On installe le mécanisme avec la clé ACTUELLE, on
vérifie qu'il fonctionne, et on change la clé seulement après. Ainsi, à aucun moment le
site ne se retrouve avec des tâches qui ne peuvent plus passer.

### Étape 1 — Déposer la clé actuelle dans un fichier

cPanel → **Gestionnaire de fichiers** → bouton **Paramètres** (en haut à droite) →
cochez **Afficher les fichiers cachés** → OK.

Placez-vous dans votre **dossier de départ** — celui qui CONTIENT `public_html`, pas
`public_html` lui-même. C'est essentiel : un fichier posé dans `public_html` serait
téléchargeable par n'importe qui sur Internet.

Créez un fichier nommé exactement :

```
.chapci-cron-key
```

Modifiez-le, collez **la clé actuelle** dedans, **sans rien d'autre** — pas d'espace,
pas de ligne vide après. Enregistrez.

Puis clic droit dessus → **Modifier les autorisations** → cochez uniquement les deux
cases de **Lecture** et **Écriture** du propriétaire (soit **0600**). Rien pour le groupe,
rien pour le public.

### Étape 2 — Modifier les treize commandes

cPanel → **Tâches Cron**. Pour chaque ligne, **Éditer**, et remplacez uniquement le
morceau de l'en-tête. Le reste de la commande — l'URL, le `>/dev/null 2>&1` — ne bouge
pas.

| Avant | Après |
|---|---|
| `-H 'X-Cron-Key: <la longue clé en clair>'` | `-H "X-Cron-Key: $(cat ~/.chapci-cron-key)"` |

Treize fois. C'est la partie fastidieuse, et c'est la dernière : après ça, plus jamais.

### Étape 3 — Attendre `alerts`, qui passe toutes les deux heures

`alerts` est la tâche la plus fréquente : c'est elle qui confirme le plus vite.

Après son prochain passage, allez sur **chap.ci → Admin → Tâches auto** et regardez sa
dernière réussite. **Si elle a avancé, le mécanisme fonctionne.**

Si elle n'a pas avancé : remettez la clé en clair dans la commande d'`alerts`
uniquement, et dites-le-moi. On cherchera à deux, sans que rien d'autre ne soit cassé.

### Étape 4 — Seulement maintenant, changer la clé

Une fois l'étape 3 confirmée :

1. Sur votre Mac : `openssl rand -hex 32` → 64 caractères.
2. `api/config.php`, ligne `'cron_key'` → la nouvelle valeur.
3. `~/.chapci-cron-key` → **la même** nouvelle valeur.
4. **Aucune tâche cron à modifier.**
5. Admin → Tâches auto : le bandeau rouge doit rester absent.

---

## Les horaires de vos treize tâches

Relevés le 11/09/2026. ⚠️ **cPanel planifie avec une heure d'avance sur ce qu'enregistre
le journal du site** (`backup` à 3 h dans cPanel s'inscrit à 02:00 ; `digest` à 18 h
s'inscrit à 17:00). La colonne « journal » est celle à comparer dans Admin → Tâches auto.

| Tâche | cPanel | journal | quand |
|---|---|---|---|
| `backup` | 3 h | 02:00 | tous les jours |
| `cleanup` | 4 h | 03:00 | tous les jours |
| `rappels-pro` | 6 h | 05:00 | tous les jours |
| `stats` | 7 h | 06:00 | **lundi seulement** |
| `report` | 7 h | 06:00 | **le 1ᵉʳ du mois seulement** |
| `security` | 8 h | 07:00 | tous les jours |
| `seo` | 9 h | 08:00 | tous les jours |
| `suggestions` | 9 h | 08:00 | **lundi et jeudi seulement** |
| `review-invites` | 10 h | 09:00 | tous les jours |
| `ads-expiring` | 11 h | 10:00 | tous les jours |
| `activation-relance` | 12 h | 11:00 | tous les jours |
| `digest` | 18 h | 17:00 | tous les jours |
| `alerts` | toutes les 2 h | — | toutes les 2 heures |

**Ne vous inquiétez pas** si `stats` n'a pas tourné depuis six jours un dimanche, ni si
`report` est silencieux vingt-huit jours : c'est leur cadence, pas une panne.

---

## Et si un jour vous devez montrer cet écran

Après l'étape 2, il n'affichera plus que `$(cat ~/.chapci-cron-key)`. Vous pourrez le
photographier, l'envoyer à votre hébergeur ou me le montrer sans rien exposer.

C'est tout l'objet de cette fiche.
