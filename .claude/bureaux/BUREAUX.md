# Chap.ci — Les Bureaux (organisation des agents)

Chap.ci est géré comme une petite entreprise : plusieurs **bureaux** (équipes
d'agents planifiés), chacun avec un **chef**. Les chefs **communiquent** via un
journal de bord commun. Les bureaux **proposent** ; **le Patron ordonne** ; le
**Bureau Développement exécute**.

---

## La règle d'or (protocole de décision)

1. **Les bureaux PROPOSENT.** Chaque bureau produit des rapports et des
   propositions concrètes. Il ne modifie **jamais** le code, la config ou le
   serveur de lui-même.
2. **Le Patron ORDONNE.** L'administrateur (toi) reçoit les propositions et
   choisit ce qui est fait.
3. **Le Bureau Développement EXÉCUTE.** Uniquement les propositions validées, en
   session interactive, avec build + tests, et ne pousse/déploie que sur ordre.

> Aucun agent planifié ne commite de code applicatif ni ne déploie tout seul.

---

## Direction générale

**Le Secrétariat** — la session interactive (Claude Code + le Patron). Rôle :
consolider le journal de bord, présenter les propositions des chefs au Patron
pour validation, puis transmettre les ordres au Bureau Développement.

---

## Les bureaux et leurs chefs

| Bureau | Chef | Mission | Cadence |
|---|---|---|---|
| **Sécurité** | 🛡️ *Le Gardien* | Scan sécurité + recherche de bugs + surveillance | **toutes les 5 h** (scan) · quotidien (santé) · mensuel (audit profond) |
| **Développement** | 🔨 *Le Bâtisseur* | Implémente les propositions validées, build, tests, déploiement | à la demande (sessions interactives) |
| **Design & Typographie** | 🎨 *L'Atelier* | Audit design + polices, système visuel, note ivoirienne | trimestriel |
| **Qualité & Modération** | 🧭 *Le Modérateur* | Modération des annonces (interdits, arnaques, doublons) | quotidien |
| **Croissance** | 📣 *Le Crieur* | SEO, contenu marketing, veille concurrentielle | mensuel / hebdo |
| **Données & Rapports** | 📊 *Le Comptable* | Rapport d'activité, sourcing import | hebdo / 3×semaine |
| **Juridique** | ⚖️ *Le Juriste* | Veille juridique CI, conformité ARTCI | mensuel |

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
| **Toutes les 5 h** | 🛡️ Sécurité — scan & bugs |
| Quotidien | Santé & sécurité serveur · Modération |
| Hebdo | Rapport d'activité · Marketing · Veille concurrence |
| 3×/semaine | Sourcing import |
| Mensuel | Audit sécurité profond · SEO · Veille juridique |
| Trimestriel | Audit design + polices |

> Le scan sécurité/bugs des 5 h est **léger et ciblé** (code récent, `npm audit`,
> secrets, endpoints). L'audit **profond** reste mensuel pour ne pas gaspiller.
