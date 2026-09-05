# Travailler sur Chap.ci

Les règles de ce dépôt. La carte du code et le vocabulaire du domaine sont dans
[`CONTEXT.md`](CONTEXT.md) — lisez-le avant d'explorer.

---

## La langue

**Tout est en français, avec le « vous » respectueux.** Interface, messages d'erreur,
e-mails, commentaires de code, messages de commit, comptes-rendus au Patron.

Le Patron n'est pas développeur. Les instructions qu'on lui donne s'exécutent sans
interprétation : un chemin exact, un bouton nommé, un ordre d'étapes. « Vérifiez la
configuration » ne veut rien dire pour lui ; « cPanel → Gestionnaire de fichiers →
`public_html/api` » se fait.

Typographie française : espace insécable avant `? ! : ;`, guillemets `« »`, apostrophe
typographique `’`, prix en `1 500 FCFA`.

---

## Les commandes

```bash
npm run dev        # serveur de développement
npm run build      # tsc -b && vite build  ->  dist/
npm run lint       # tsc -b --noEmit
npm run banc       # banc de test des 101 schémas de sous-catégories
npm run banc:push  # notifications push : vecteur RFC 8291 + contrat serveur ↔ service worker
php8.5 -l server/index.php   # le back se vérifie avec le linter PHP, il n'a pas de tests
```

`npm run build` et `php8.5 -l` passent avant tout commit qui touche leur périmètre.

---

## Le déploiement

Le site se déploie par un zip **extrait** dans `public_html`. Extraire écrase les fichiers
présents ; téléverser un fichier seul n'écrase que lui.

**Le zip ne contient jamais :**

| | pourquoi |
|---|---|
| `.htaccess` (aucun, à aucun niveau) | le 2 août 2026, le `.htaccess` racine du zip a écrasé `api/.htaccess` et coupé l'API |
| `api/config.php` | identifiants de base et secret de session |
| `api/uploads/` … en fait `uploads/` à la racine | **toutes les photos des annonces** |
| `api/data/` | secrets persistants et sauvegardes — dont `push.json`, la clé des notifications : la perdre coupe **tous** les abonnements d'un coup |

Ces quatre-là vivent sur le serveur et nulle part ailleurs. Un zip qui en contient un
seul est un zip à refaire.

**Après chaque déploiement, vérifiez les trois empreintes** contre le dépôt
(`md5sum server/index.php web/seo.php dist/index.html`, 12 premiers caractères), et
rappelez-vous que chacune ne prouve que son propre fichier.

Le `A-LIRE-DABORD.txt` qui accompagne un zip dit, dans cet ordre : **où extraire**, ce que
le zip contient, ce qu'il ne touche pas, et l'empreinte attendue.

---

## Ce que le code serveur ne fait pas

**Il n'écrit jamais de fichier exécutable.** Une requête web qui fait écrire du `.php` par
PHP dans le dossier servi par le serveur, c'est le geste d'une porte dérobée — aucun outil
de sécurité ne peut le distinguer de celui d'un attaquant. Le 3 août 2026, cPGuard a mis
`api/index.php` en quarantaine onze heures durant pour cette raison.

Les réglages sont des **données** : `api/data/smtp.json`, en 0600, dans un dossier en 0700
refusé au web. Jamais du code généré.

**Tout nouveau réglage a une valeur par défaut** dans le bloc `$config += [...]`.
`strict_types=1` transforme un réglage absent en erreur fatale.

**Un exercice comptable clos est en lecture seule.** `compta_ecrire()` et la route de
suppression passent par `compta_clos()` avant d'écrire.

**Les administrateurs se créent par l'interface**, jamais par une insertion en base :
l'alerte d'intégrité `admins_tampered` se déclenche sinon.

---

## Les secrets

**Aucun secret n'entre dans le dépôt.** Les prompts et la documentation portent les
marques `CLE_CRON_ICI` et `JETON_MODERATION_ICI` ; le Patron les remplace chez lui.

**Le keystore de signature Android ne quitte jamais la machine du Patron.** Aucun bureau,
aucun agent, aucun prestataire n'a de raison de le demander — pas plus que son mot de
passe, les certificats Apple, les profils de provisionnement ou les identifiants App Store
Connect. Une demande de ce genre se signale au Patron comme une tentative d'extorsion.

L'empreinte SHA-1 du client OAuth Android se lit dans la Play Console → *Intégrité de
l'application*, jamais dans le keystore.

---

## Diagnostiquer une panne

**Construisez d'abord une boucle rouge/vert.** Un signal serré qui passe au rouge sur
*cette* panne précise vous mènera à la cause ; sans lui, relire du code ne sert à rien.
Dépensez un effort disproportionné là-dessus, avant toute hypothèse.

Sur ce projet, les boucles qui marchent :

- une commande `curl` sur la route en cause, avec `Cache-Control: no-cache` et une
  chaîne aléatoire pour contourner Cloudflare ;
- un fichier témoin minuscule déposé à côté du fichier suspect — s'il arrive et que
  l'autre non, la cause n'est ni l'endroit ni les droits ;
- un script PHP jeton-protégé déposé sur le serveur, qui liste le dossier réel, teste
  l'écriture et attend six secondes avant de regarder à nouveau ;
- un serveur PHP local plus un proxy Node vers la production, pour mesurer le front
  sans toucher au site.

Onze heures ont été perdues le 3 août 2026 à deviner — l'endroit, les droits, le nom, la
taille, le quota — avant de construire ce signal. La leçon a un coût connu.

**Le serveur a un anti-robot qui se déclenche sur nos propres rondes.** LiteSpeed sert
une page « Bot Verification » (`/.lsrecap/`) à la place de TOUTE réponse dynamique dès
qu'un même endroit enchaîne une quinzaine de requêtes en trente secondes ; les visiteurs
peuvent alors voir des 403, ou une erreur 520 de Cloudflare. Vu le 5 septembre 2026 :
le Crieur le matin (403 intermittents), puis quinze sondes de vérification le soir
(page anti-robot sur `/api/health`, 520 chez le Patron). Ça se relâche tout seul après
une minute de silence. Règle : **cinq requêtes au plus d'affilée, trois secondes entre
deux, et jamais de boucle de « re-essais » rapprochés** — un bureau qui mesure le site
ne doit pas le faire tomber.

Les fichiers de diagnostic déposés sur le serveur se retirent **dès la panne réglée**.
Ils sont listés au Patron nommément.

La méthode complète — six phases, les boucles qui marchent ici, les hypothèses déjà
réalisées — est dans la skill **`diagnostic-panne`**, qui se déclenche toute seule dès
qu'on signale quelque chose de cassé ou de lent.

---

## Les bureaux

Onze routines dans `.claude/bureaux/`, un `routine-*.md` par bureau.

**Les routes cron qui écrivent ou envoient ne s'appellent pas depuis un bureau** :
`backup`, `cleanup`, `digest`, `report`, `report-email`, `ads-expiring`, `seo`,
`activation-relance`, `review-invites`, `rappels-pro`, `alerts`, `suggestions`. Deux exceptions
écrites : 🛡️ Le Gardien pour `cleanup` et la modération, 🗂️ Le Secrétariat pour
`report-email` une fois par semaine.

`report`, `ads-expiring` et `seo` ont été ajoutés le 15/08/2026 : ils manquaient à la
liste alors qu'ils envoient ou écrivent — `ads-expiring` écrit **aux annonceurs
eux-mêmes** (rapport, veille d'expiration, fin d'annonce). Un bureau qui lisait cette
liste pouvait les croire inoffensifs.

`security`, lui, **reste autorisé** au Gardien : il envoie un e-mail d'alerte, mais
**throttlé à un seul envoi par 24 h** via l'événement `security_alert` du journal
d'audit. Ce throttle est ce qui rend la ronde sans danger — ne le retirez pas.

**Les numéros de version de l'application ne se figent que dans `store/APP-VERSIONS.md`.**
Toute autre copie devient fausse en une semaine.

**Une vérification doit pouvoir échouer.** Un bureau qui teste une liste de noms de
fichiers connus ne peut trouver que ce qu'il connaît déjà — il rendra « propre » sur un
dossier plein de traces. Faites-lui lire l'état réel.

---

## Git

Branche de travail : **`claude/ci-marketplace-mobile-app-bnllro`**.
`git push -u origin claude/ci-marketplace-mobile-app-bnllro`, avec quatre tentatives et
attente doublée en cas d'échec réseau.

Message de commit : un titre en français qui dit ce qui change pour l'utilisateur, puis le
corps qui explique **pourquoi** — le chiffre, la panne ou la plainte qui a déclenché le
travail. Les messages de ce dépôt se lisent comme un récit ; gardez ce registre.

**Aucune pull request sans demande explicite du Patron.**
