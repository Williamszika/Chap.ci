# Skills d'ingénierie — attribution

Repris du dépôt open-source **mattpocock/skills** (auteur : Matt Pocock), sous licence
**MIT** (voir `LICENSE-mattpocock-skills`). Source : https://github.com/mattpocock/skills

| Skill | État | Invocation |
|---|---|---|
| **writing-great-skills** | repris **tel quel** (+ `GLOSSARY.md`) | à la main uniquement — aucun coût de contexte |
| **handoff** | repris **tel quel** | à la main uniquement — aucun coût de contexte |
| **diagnostic-panne** | **adaptation** de `diagnosing-bugs` | automatique — le seul des trois qui pèse sur le contexte |

**Ce qui a été adapté dans `diagnostic-panne`.** La structure en six phases et le principe
directeur — construire une boucle rouge/vert avant toute hypothèse — sont de Matt Pocock.
Le reste a été réécrit pour Chap.ci : en français, sans suite de tests côté serveur, avec
les boucles qui marchent réellement ici (curl contre Cloudflare, fichier témoin, script de
diagnostic à jeton sur le serveur, serveur PHP local, Playwright sur `dist/`), les
hypothèses qui se sont déjà réalisées (zip mal extrait, quarantaine cPGuard, cache
Cloudflare, réglage sans défaut sous `strict_types`, clé cron périmée), et le Patron comme
boucle de dernier recours. Le coût de ne pas l'avoir appliquée y est écrit : onze heures,
le 3 août 2026.

Les deux autres sont **volontairement laissés en anglais et non modifiés** : ce sont des
références de méthode, pas des skills de terrain. Les mettre à jour depuis l'amont
redevient une simple copie.

**Trois skills seulement, sur les 41 du dépôt.** Le reste suppose un gestionnaire de
tickets et une suite de tests que Chap.ci n'a pas, ou vise TypeScript exclusivement.
Installer le paquet complet aurait chargé la fenêtre de contexte d'une vingtaine de
descriptions à chaque tour, pour des skills qui tourneraient à vide.

---

# Skills design/animation — attribution

Les skills suivants proviennent du dépôt open-source **emilkowalski/skills**
(auteur : Emil Kowalski), sous licence **MIT** (voir `LICENSE-emilkowalski-skills`) :

- animation-vocabulary
- apple-design
- emil-design-eng
- find-animation-opportunities
- improve-animations
- review-animations

Source : https://github.com/emilkowalski/skills

Ils servent de « conseiller design » pour peaufiner l'interface de Chap.ci
(React + Tailwind). Ils n'ajoutent aucune fonctionnalité et ne modifient pas
le code par eux-mêmes.

---

# Skills maison Chap.ci (originaux)

Créés spécifiquement pour Chap.ci — le « bureau des designers » ivoirien :

- **design-ivoirien** — identité visuelle Côte d'Ivoire (palette, motifs, ton, Nouchi)
- **typographie** — qualités des polices + règles de typographie française + FCFA
- **marketplace-design** — grilles d'annonces, cartes, confiance, conversion
- **affiche-design** — affiches & visuels promo (WhatsApp/Facebook, formats)

Un **audit design trimestriel automatique** (tous les 3 mois) survole tout le code,
se met à jour depuis les sources officielles de design, et livre une proposition
de design + polices sur un artifact.
