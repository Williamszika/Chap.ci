# Chap.ci — Tâches Cron sur TPE Cloud (cPanel)

Récap prêt à coller pour lancer les **tâches serveur** de Chap.ci depuis les
**Tâches Cron de cPanel** (hébergeur TPE Cloud). C'est l'endroit **natif et
recommandé** pour ces tâches — indépendant des routines Claude.

> ⚠️ **Sécurité** : ne mets **JAMAIS** ta vraie clé cron dans ce fichier ni dans
> le dépôt. Ici, `TA_CLE` est un **remplaçant** — tu le remplaces uniquement dans
> l'interface cPanel. Le fichier `config.php` (qui contient la vraie clé) reste
> **hors dépôt**, sur le serveur.

---

## Pourquoi (le « 403 – clé invalide »)

Les endpoints cron sont protégés par une clé : le serveur compare
`hash_equals(cron_key, ?key)`. L'ancienne clé `chapci-cron-2026-a7f3e9` est
désormais **sur liste noire** dans `server/index.php` (durcissement des secrets
exposés) → toute requête avec cette clé renvoie **403**. Il faut donc une
**clé valide**.

---

## Étape 1 — Obtenir une clé cron **valide** (une seule fois)

**Option A — recommandée : ta propre clé forte.**
Dans `config.php` sur le serveur :
```php
'cron_key' => 'REMPLACE-par-une-longue-chaine-aleatoire-unique-32car',
```
Contraintes : **≥ 24 caractères**, unique, et **pas** une valeur faible/connue.
Le serveur l'accepte telle quelle. (Génère-la avec un générateur de mot de passe.)

**Option B — lire la clé auto-générée.**
Si tu ne mets rien, le serveur en génère une automatiquement, stockée dans :
```
server/data/.secret_cron
```
Ouvre ce fichier (File Manager cPanel) et récupère sa valeur.

→ Dans les deux cas, tu obtiens la clé à utiliser ci-dessous (notée `TA_CLE`).

---

## Étape 2 — Créer les Tâches Cron (cPanel → « Tâches Cron »)

Pour chaque tâche : règle la fréquence (champs minute/heure/… ou « Réglages
courants »), puis colle la **Commande**. Remplace `TA_CLE` par ta clé réelle.

| Tâche | Fréquence | Cron | Commande |
|---|---|---|---|
| 🧹 Ménage (purge + expire annonces > 90 j) | 1×/jour | `0 3 * * *` | `curl -s "https://chap.ci/api/cron/cleanup?key=TA_CLE" >/dev/null 2>&1` |
| 📨 Offres du jour | 1×/jour | `0 7 * * *` | `curl -s "https://chap.ci/api/cron/digest?type=daily&key=TA_CLE" >/dev/null 2>&1` |
| 📰 Digest hebdo | lundi | `0 7 * * 1` | `curl -s "https://chap.ci/api/cron/digest?type=weekly&key=TA_CLE" >/dev/null 2>&1` |
| 🔔 Alertes recherches sauvegardées | 2×/jour | `0 */12 * * *` | `curl -s "https://chap.ci/api/cron/alerts?key=TA_CLE" >/dev/null 2>&1` |
| 💡 Suggestions personnalisées | 2×/sem | `0 8 * * 1,4` | `curl -s "https://chap.ci/api/cron/suggestions?key=TA_CLE" >/dev/null 2>&1` |
| ⭐ Invitations à laisser un avis | 1×/jour | `0 9 * * *` | `curl -s "https://chap.ci/api/cron/review-invites?key=TA_CLE" >/dev/null 2>&1` |
| 💾 Sauvegarde | 1×/jour | `0 2 * * *` | `curl -s "https://chap.ci/api/cron/backup?key=TA_CLE" >/dev/null 2>&1` |

> Commence par **Ménage** + **Offres du jour**, puis ajoute le reste selon tes
> besoins. Toutes ces tâches sont **idempotentes** et sûres à relancer.

---

## Vérifier que ça marche (200 au lieu de 403)

Depuis un terminal (ou l'outil « Terminal » de cPanel) :
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://chap.ci/api/cron/cleanup?key=TA_CLE"
```
- **200** → clé valide, la tâche s'exécute. ✅
- **403** → clé invalide (revois l'étape 1).

---

## Référence — les endpoints cron

| Endpoint | Méthode | Rôle |
|---|---|---|
| `cron/cleanup` | GET | Purge visites > 120 j, événements sécurité > 180 j ; masque (expire) les annonces actives > 90 j |
| `cron/digest` | GET | Envoie les « offres du jour » (`type=daily`) ou hebdo (`type=weekly`) par email |
| `cron/suggestions` | GET | Suggestions personnalisées par email (selon centres d'intérêt) |
| `cron/alerts` | GET | Alertes « recherches sauvegardées » : prévient des nouvelles annonces |
| `cron/review-invites` | GET | Invite les acheteurs à laisser un avis |
| `cron/backup` | GET | Sauvegarde |
| `cron/stats` | GET | Statistiques agrégées anonymes (lu par la routine « Rapport d'activité ») |
| `cron/security` | GET | Synthèse sécurité : compteurs d'événements, IP suspectes (lu par la routine « Santé & sécurité ») |
| `cron/report-email` | POST | Envoi d'un rapport par email avec PDF (routine sourcing) |

---

## À noter

- **3 routines Claude** lisent `cron/stats` et `cron/security` : *Santé & sécurité*,
  *Contenu marketing*, *Rapport d'activité*. Pour qu'elles cessent le 403, remets
  **la même `TA_CLE`** dans leur prompt (interface **Routines** de claude.ai).
  Une fois le ménage assuré par cPanel, la routine « Santé » ne sert plus qu'à
  **lire/surveiller**.
- Le **scan sécurité/bugs IA toutes les 5 h** n'est **pas** une tâche cron cPanel
  (il faut une intelligence, pas un simple `curl`) : c'est une **routine Claude**
  à créer dans l'interface Routines.
- La clé apparaît dans la commande cron (stockée dans ta crontab cPanel, privée)
  et potentiellement dans les logs d'accès du serveur — c'est le fonctionnement
  standard d'un cron cPanel, considéré comme acceptable.
