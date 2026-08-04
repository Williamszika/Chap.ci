---
name: diagnostic-panne
description: Méthode de diagnostic pour les pannes et les lenteurs de Chap.ci — construire d'abord une boucle rouge/vert, puis reproduire, réduire, formuler des hypothèses falsifiables, instrumenter, corriger. À utiliser dès que quelque chose est cassé, tombe, renvoie une erreur, ne s'installe pas, ou est devenu lent — et dès que le Patron dit « ça ne marche plus », « c'est lent », « vérifie voir ».
---

# Diagnostiquer une panne sur Chap.ci

Adaptation française de la skill `diagnosing-bugs` de **mattpocock/skills** (MIT, Matt
Pocock) au terrain de Chap.ci : un monolithe PHP sans suite de tests, un front React, un
hébergement mutualisé qu'on n'administre pas, et un Patron non développeur qui est
souvent la seule paire de mains sur le serveur.

Lis [`CONTEXT.md`](../../../CONTEXT.md) avant d'explorer le code, et
[`CLAUDE.md`](../../../CLAUDE.md) pour les règles du dépôt.

Ne saute une phase qu'en disant pourquoi.

---

## Phase 1 — Construire une boucle rouge/vert

**C'est ÇA, la compétence.** Tout le reste est mécanique. Avec un signal serré qui passe
au **rouge** sur *cette* panne précise, vous trouverez la cause : la bissection, le test
d'hypothèses et l'instrumentation ne font que le consommer. Sans lui, relire du code ne
vous sauvera pas.

**Dépensez un effort disproportionné ici.** Soyez agressif, inventif, et refusez
d'abandonner.

### Ce que ça coûte de ne pas le faire

Le 3 août 2026, l'API de chap.ci est restée à terre **onze heures**. La matinée est
partie à deviner : l'endroit d'extraction, les droits du dossier, le nom du fichier, sa
taille, le quota disque. Chaque hypothèse était plausible, aucune n'était testée par un
signal. La panne n'a cédé qu'une fois construite une boucle serrée — un fichier témoin de
5 octets déposé à côté du fichier suspect, puis un script qui écrivait 462 004 octets de
commentaires et regardait six secondes plus tard s'ils tenaient. La cause est apparue en
vingt minutes.

### Les boucles qui marchent sur ce projet

Dans cet ordre, à peu près.

1. **`curl` sur la route en cause.** La plus rapide. Toujours avec
   `-H 'Cache-Control: no-cache'` et une chaîne aléatoire en paramètre : **Cloudflare est
   devant chap.ci** et sert volontiers une réponse gardée en cache.
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -H 'Cache-Control: no-cache' \
     "https://chap.ci/api/health?cb=$RANDOM$RANDOM"
   ```
2. **Le fichier témoin.** Pour toute panne où un fichier « n'arrive pas » : déposez à côté
   de lui un fichier minuscule et inoffensif. S'il arrive et que l'autre non, ce n'est ni
   l'endroit, ni les droits, ni l'archive — c'est le fichier lui-même.
3. **Le script de diagnostic sur le serveur**, protégé par un jeton dans l'URL (404 sans
   le jeton). Il liste le dossier réel, ses droits, son propriétaire, teste l'écriture, et
   **attend six secondes avant de regarder à nouveau** — c'est la fenêtre dans laquelle un
   antivirus d'hébergeur frappe. Il n'affiche que des noms de fichiers, jamais leur
   contenu, et **il se supprime dès la panne réglée**.
4. **Le serveur PHP local.** `php -S` sur `server/`, avec un `config.php` de test
   (`'cookie_secure' => false`, sinon aucune session ne s'établit en http). Reproduit tout
   ce qui ne dépend pas de l'hébergement.
5. **Playwright sur le `dist/` local**, avec un proxy Node vers la production pour `/api/`
   et **`/uploads/`**. Deux pièges déjà payés : oublier `/uploads/` fait mesurer une
   image de repli au lieu des vraies photos ; laisser tomber `Set-Cookie` empêche toute
   session.
6. **La bissection sur `git`.** Quand la panne est apparue entre deux états connus,
   automatisez « se placer à l'état X, vérifier » et laissez tourner `git bisect run`.
7. **Le différentiel.** Le même appel contre deux versions ou deux configurations, et on
   compare les sorties.
8. **Le Patron comme boucle, en dernier recours.** Quand seule une main humaine peut
   cliquer dans cPanel, structurez quand même la boucle :
   [`scripts/hitl-loop.template.sh`](scripts/hitl-loop.template.sh). Donnez-lui **une
   seule adresse à ouvrir** ou **un seul bouton à cliquer**, et demandez la réponse
   brute — pas son interprétation.

### Resserrer la boucle

Traitez la boucle comme un produit. Une fois qu'elle existe :

- **plus rapide** — moins d'initialisation, périmètre réduit ;
- **plus tranchante** — elle affirme le symptôme exact, pas « ça n'a pas planté » ;
- **plus déterministe** — cache contourné, aléa fixé, réseau maîtrisé.

Une boucle de trente secondes qui vacille ne vaut guère mieux que rien ; une boucle de
deux secondes qui tranche est une arme.

### Les pannes intermittentes

Le but n'est pas une reproduction propre mais un **taux de reproduction plus élevé**.
Bouclez cent fois, parallélisez, forcez le rythme. Une panne qui tombe une fois sur deux
se débogue ; une fois sur cent, non.

### Quand la boucle est vraiment impossible

**Dites-le, explicitement.** Listez ce que vous avez essayé. Demandez au Patron l'accès,
une capture, ou l'autorisation d'un diagnostic temporaire en production. **Ne passez pas
aux hypothèses sans boucle** — c'est exactement l'échec que cette skill existe pour
empêcher.

### Critère de fin — une boucle serrée, capable de passer au rouge

La phase 1 s'achève quand vous pouvez nommer **une commande** — un `curl`, un script, une
adresse — que vous avez **déjà lancée au moins une fois** (collez l'appel et sa sortie),
et qui est :

- [ ] **capable de rouge** — elle traverse le vrai chemin de code et affirme le symptôme
      exact décrit par le Patron ;
- [ ] **déterministe** — même verdict à chaque passage ;
- [ ] **rapide** — des secondes ;
- [ ] **exécutable sans le Patron**, sauf via le script prévu pour lui.

Si vous vous surprenez à lire du code pour bâtir une théorie avant que cette commande
existe : **arrêtez.**

---

## Phase 2 — Reproduire, puis réduire

Lancez la boucle. Regardez-la passer au rouge.

- [ ] Elle produit **la panne que le Patron a décrite**, pas une panne voisine. Mauvaise
      panne = mauvais correctif.
- [ ] Elle est reproductible sur plusieurs passages.
- [ ] Le symptôme exact est capturé — message, sortie fausse, durée.

Puis **réduisez** au plus petit scénario qui reste rouge. Retirez un élément à la fois,
relancez après chaque retrait. Terminé quand **chaque élément restant est porteur** :
en enlever un fait passer au vert.

---

## Phase 3 — Hypothèses

Écrivez **trois à cinq hypothèses classées** avant d'en tester une seule. En formuler une
seule, c'est s'ancrer sur la première idée plausible — et c'est ce qui a coûté onze heures
le 3 août.

Chacune doit être **réfutable**, avec sa prédiction :

> « Si c'est X, alors changer Y fera disparaître la panne. »

Sans prédiction, c'est une impression : jetez-la ou affûtez-la.

**Montrez la liste au Patron avant de tester.** Il connaît son serveur et reclasse parfois
en une phrase. Ne bloquez pas dessus s'il n'est pas là.

Sur Chap.ci, gardez toujours ces candidates en tête, elles se sont déjà réalisées :

- le zip extrait au mauvais endroit, ou contenant un `.htaccess` qui en écrase un autre ;
- **cPGuard**, l'antivirus de l'hébergeur, qui met un fichier en quarantaine ;
- Cloudflare qui sert une réponse en cache ;
- un réglage sans valeur par défaut, fatal sous `strict_types` ;
- une clé cron régénérée, restée ancienne dans un prompt.

---

## Phase 4 — Instrumenter

Chaque sonde répond à **une** prédiction. **Une variable à la fois.**

Préférez, dans l'ordre : l'inspection directe (un point d'arrêt vaut dix journaux), puis
des journaux **ciblés aux frontières** qui séparent deux hypothèses. Jamais « tout
journaliser et grepper ».

**Marquez chaque trace** d'un préfixe unique, par exemple `[DEBUG-a4f2]` : le ménage
devient un seul `grep`. Ce qui n'est pas marqué survit.

**Pour une lenteur**, les journaux mentent. Mesurez d'abord — une base de référence, un
banc, un profil — puis bissectez. Mesurer avant de corriger.

---

## Phase 5 — Corriger

Ce dépôt **n'a pas de suite de tests** côté serveur, et son back-end est un fichier de
464 Ko. Le test de non-régression classique n'a souvent pas de couture où se poser.

Alors :

- s'il existe une couture honnête — `npm run banc` pour les formulaires, un test qui passe
  par l'API — écrivez le test **avant** le correctif, regardez-le échouer, corrigez,
  regardez-le passer ;
- **s'il n'y en a pas, dites-le : c'est en soi un constat.** L'architecture empêche de
  verrouiller la panne. Notez-le pour la phase 6 plutôt que d'écrire un test qui donne une
  fausse assurance.

Dans les deux cas, **relancez la boucle de la phase 1** sur le scénario d'origine, non
réduit. Et lancez `php8.5 -l server/index.php` et `npm run lint`.

---

## Phase 6 — Ménage et leçon

Avant de déclarer terminé :

- [ ] la boucle de la phase 1 ne reproduit plus rien ;
- [ ] le test de non-régression passe, ou son absence est documentée ;
- [ ] toutes les traces `[DEBUG-…]` sont retirées (`grep` le préfixe) ;
- [ ] **les fichiers de diagnostic déposés sur le serveur sont retirés**, et la liste
      exacte a été donnée au Patron ;
- [ ] l'hypothèse qui s'est révélée juste est écrite dans le message de commit — le
      prochain qui débogue l'apprendra.

**Puis demandez : qu'est-ce qui aurait empêché cette panne ?**

Répondez après la correction, pas avant : vous en savez plus maintenant. Si la réponse
touche à l'architecture ou aux routines des bureaux, portez-la dans le fichier qui
convient — `CLAUDE.md`, `CONTEXT.md`, ou `.claude/bureaux/COMMUN.md`. Une leçon qui reste
dans une conversation est une leçon perdue.
