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
