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
npm run banc:front # le site sur un téléphone 3G simulé : poids, décalages (CLS), erreurs, cibles tactiles
npm run banc:coherence # site ↔ application ↔ serveur : catégories, types pro, lieux, pays, réglages, permissions
npm run banc:pays  # comptes hors Côte d'Ivoire et onglet admin « Pays », sur un serveur SQLite local
npm run banc:stock # le stock des comptes Pro : décrément à la vente, alertes « stock bas » et « rupture »
npm run banc:catalogue # le plafond des 500 annonces : 520 en base, l'ancien appel en perd 20
npm run banc:push-natif # le téléphone que l'application enregistre (FCM) — inerte sans api/data/fcm.json
npm run banc:vignettes # la vignette de grille : 360 px à l'envoi, les anciennes refaites par le cron
npm run apercu:cookies # le bandeau cookies en image : barre + panneau, téléphone et ordinateur
npm run banc:confidentialite # la politique de confidentialité contre le code : ce qu'elle promet des photos
npm run registre   # REGISTRE-ACTIVITE.md : quand chaque chose a été livrée, lu dans git
php8.5 -l server/index.php   # le back se vérifie avec le linter PHP, il n'a pas de tests
```

`BANC_FRONT_ECRAN=bureau npm run banc:front` rejoue les neuf pages sur un écran
d'ordinateur (1440 px). Le 08/09/2026, ce passage-là a trouvé huit cibles tactiles
sous 44 px sur chaque page — toutes dans la barre du haut, qui n'existe QUE sur
grand écran : personne ne l'avait jamais mesurée.

`banc:front` demande Chromium (`CHROMIUM_PATH=/opt/pw-browsers/chromium`) et
`playwright-core` (`npm i --no-save playwright-core`).

⚠️ **ET `npm ci` L'EFFACE.** `playwright-core` s'installe en `--no-save` : il
n'est donc PAS dans `package.json`, et `npm ci` — que les rondes lancent pour
reconstruire les empreintes — nettoie tout ce qui n'y figure pas. Le 19/09/2026,
🎨 L'Atelier a rendu un audit entier en déclarant « pas de `playwright-core`
installé, coût de mise en place trop lourd » et n'a donc **rien vérifié à
l'écran** — le bureau qui en a le plus besoin, aveugle pour une commande de
cinq secondes. Chromium, lui, est toujours là : il vit dans `/opt`, hors du
dépôt. **Si le rendu manque, réinstallez, n'y renoncez pas :**

```bash
npm i --no-save playwright-core   # cinq secondes, à refaire après chaque npm ci
```
 Il ne touche pas la production :
il rejoue le site construit sur un serveur PHP local, comme `banc:affiche`. Avant
toute promesse sur « la vitesse » ou « les bugs », c'est lui qu'on lance.

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

⚠️ **CONSÉQUENCE QU'ON OUBLIE : `web/htaccess-root` N'EST QU'UNE RÉFÉRENCE.** Y ajouter
une règle ne change **rien** en production — le seul exemplaire qui compte est celui du
serveur, que le Patron édite à la main dans cPanel. **Toute modification de ce fichier se
termine donc par une fiche d'instructions pour lui**, sinon elle n'existe que dans git.

Le 19/09/2026, la règle qui sert `/a-propos` aux robots a été écrite ici, le banc est
passé au vert, le zip a été extrait — et la page restait introuvable : rien n'était
arrivé sur le serveur. Deux lignes des liens universels manquaient d'ailleurs **depuis
le 02/08** pour la même raison. L'en-tête du fichier y était pour beaucoup : il
affirmait encore « CE FICHIER EST DÉPLOYÉ PAR LE ZIP […] ajoutez-la ICI, pas là-bas »,
vrai jusqu'au 02/08 et faux ensuite. Corrigé le 19/09.

**Et un banc qui joue `php -S … seo.php` ne voit pas ce problème** : dans ce mode, TOUTES
les adresses arrivent dans `seo.php`, alors que le `.htaccess` n'en laisse passer qu'une
poignée. Un banc qui ne lit pas `web/htaccess-root` croit une porte ouverte parce qu'il
est entré par la fenêtre — `banc:fondateurs` le lit désormais.

⚠️⚠️ **NE DEMANDEZ JAMAIS AU PATRON DE MODIFIER LE `.htaccess` LIGNE À LIGNE.
DONNEZ-LUI LE FICHIER ENTIER À REMPLACER.**

Le 19/09/2026, une fiche lui a demandé trois modifications au clavier dans ce fichier,
en lui disant de faire une copie de sauvegarde d'abord. **Il n'a pas fait la copie** — et
une faute de frappe a mis **le site entier en erreur 500**. Le plan de secours reposait
entièrement sur une sauvegarde qui n'existait pas.

Ce qui rend l'incident instructif n'est pas la faute de frappe, c'est la consigne : **une
instruction dont la sûreté dépend d'une étape que la personne peut sauter n'est pas une
instruction sûre.** Taper dans un fichier où une virgule coupe le site n'est pas un geste
qu'on demande à quelqu'un qui n'est pas développeur.

La bonne façon, désormais :

1. préparer le fichier COMPLET (`cp web/htaccess-root livraison/htaccess-A-RENOMMER.txt`) ;
2. le lui envoyer, et lui demander de le téléverser puis de le **renommer** en `.htaccess` ;
3. aucune frappe dans le fichier, donc aucune faute de frappe possible.

Ce fichier de livraison est un DOUBLON : il se régénère d'une commande et **ne se commite
pas**. Deux copies du même `.htaccess` dans le dépôt finiraient par diverger — la panne
même qu'on vient de payer.

**Signature de cette panne, pour la reconnaître tout de suite :** `/` répond **500 au corps
vide** pendant que `/assets/…` répond 200. Sans `.htaccess`, `DirectoryIndex index.html`
disparaît, le serveur sert l'`index.php` qui traîne à la racine depuis le 20/07, et PHP
rend une erreur vide. Ce couple-là — statique vert, racine 500 — ne ressemble à aucune
autre panne connue ici, et surtout pas à l'anti-robot (qui donne 403 sur le dynamique et
200 sur `/`).

**Après chaque déploiement, vérifiez les trois empreintes** contre le dépôt
(`md5sum server/index.php web/seo.php dist/index.html`, 12 premiers caractères), et
rappelez-vous que chacune ne prouve que son propre fichier.

⚠️ **ET RECHARGEZ DEUX FOIS. Le site est une PWA : le premier rechargement installe
la nouvelle version, le second la sert.** Le 13/09/2026, le Patron ne voyait pas un
onglet d'administration pourtant déployé — empreintes vertes, fichier servi en
HTTP 200, et son navigateur affichait l'ancien. `registerType: 'autoUpdate'` fait
bien son travail, mais il lui faut **un cycle de chargement pour prendre la main**.
La preuve en trente secondes, avant de chercher ailleurs : **ouvrez le site dans une
fenêtre de navigation privée** — elle n'a pas de service worker. Si la nouveauté y
est, le déploiement est bon et il ne reste qu'un cache à vider.

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

## Les textes publiés sont des promesses

La politique de confidentialité, les CGU et les pages d'aide **décrivent le code**. Quand le
code change, elles deviennent fausses **en silence** : rien ne casse, aucun banc ne rougit,
et la page continue d'affirmer le contraire de ce que fait le programme.

C'est arrivé. Le 01/08/2026, la politique annonçait que l'analyse anti-nudité des photos avait
lieu « entièrement sur votre appareil » et que la photo « n'est transmise à aucun service
extérieur ». **C'était vrai ce jour-là.** Le 04/09/2026, le chantier « le poids sur 3G » a
déplacé ce contrôle sur le serveur — qui envoie la photo à un prestataire — et l'a ajouté à
l'application, qui n'en avait aucun. Le texte, lui, n'a pas bougé : **quinze jours**, sur une
page publique que Google Play exige exacte, et que la loi n° 2013-450 oppose à Chap.ci.

⚠️ **Un écart pareil se signale mal.** ⚖️ Le Juriste l'a bien rapporté — daté du 01/09, trois
jours AVANT que l'écart n'existe, et pour la mauvaise raison : il croyait l'application
dépourvue de tout filtre, quand le filtre est là et qu'il est **distant**. Un signalement juste
par accident ne protège de rien : vérifiez le fait avant d'agir sur le remède.

**Règle : tout chantier qui change où vont les données de quelqu'un — photo, position, message,
numéro — se termine dans `src/pages/Privacy.tsx`, pas seulement dans le code.**
`npm run banc:confidentialite` confronte les deux et refuse l'écart.

**Écrivez ces textes pour l'état ALLUMÉ, pas pour celui du jour.** Le moteur de vision est
éteint aujourd'hui (`vision_cle` absente) : la photo ne part nulle part. Il s'allume d'un
réglage dans `api/config.php`, sans qu'une ligne de code bouge — et un texte qui ne décrirait
que l'état éteint redeviendrait faux ce jour-là, sans que personne ne l'ait touché.

**Un texte de loi se fait relire par un juriste humain avant publication.** Ce dépôt corrige
ce qui est factuellement faux ; il ne rend pas d'avis juridique.

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
(page anti-robot sur `/api/health`, 520 chez le Patron). Ça se relâche tout seul, mais
pas en une minute : le 7 septembre 2026, deux sondes à une minute et demie d'écart ont
encore reçu la page, la troisième est passée après **cinq minutes** de silence.

⚠️ **CINQ MINUTES EST UN PLANCHER, PAS UNE DURÉE.** Le 11 septembre 2026, après une
journée chargée sur ce serveur (dont deux téléchargements de 24 et 5,6 Mo par un outil
de livraison mal écrit), `/api/health` renvoyait ENCORE la page 403 après **vingt-cinq
minutes de silence total**. Plus on a tapé, plus la punition dure.

**Ce qui distingue cette punition d'une vraie panne, et qu'il faut vérifier avant de
crier :** l'anti-robot ne remplace que les réponses **dynamiques**. Une requête sur `/`
(un fichier statique) répond 200 dans la même seconde où `/api/health` répond 403. Ce
couple-là — statique vert, dynamique 403 — est la signature de l'anti-robot, PAS celle
d'un site cassé. Un `config.php` fautif donnerait une erreur 500 de PHP, pas la page de
LiteSpeed. Vérifiez `/` avant de conclure quoi que ce soit, et souvenez-vous que le
Patron, lui, continue de travailler normalement depuis SON adresse.

⚠️ **ET IL NE PUNIT PAS QUE LA VITESSE : IL REFUSE LES ROBOTS QU'IL NE CONNAÎT
PAS.** Découvert le 16/09/2026, en cherchant pourquoi ChatGPT ne voyait pas le
site. Depuis une même machine, à quelques secondes d'intervalle, sur `/` :

| se présente comme | réponse |
|---|---|
| un navigateur | **200** |
| `Googlebot` | **200** |
| `OAI-SearchBot` (ChatGPT) | **520** |
| un robot inventé | **403**, page LiteSpeed |

Seul le **nom** change. LiteSpeed tient une liste de robots connus — Googlebot y
est, celui d'OpenAI non — et refuse les autres d'emblée, sans rapport avec la
cadence. L'en-tête `x-turbo-charged-by: LiteSpeed` sur le 403 désigne l'origine,
pas Cloudflare ; `web/htaccess-root` ne contient aucune règle sur les
User-Agent. **Le réglage est donc chez l'hébergeur, et AUCUN ZIP NE PEUT LE
CORRIGER.**

**Conséquence à retenir avant d'écrire une ligne de SEO :** `robots.txt` peut
autoriser un robot que le serveur refuse avant qu'il ait pu le lire. Une
autorisation dans `robots.txt` ne prouve donc RIEN sur l'accès réel. La seule
preuve est une requête avec le User-Agent en question — un `curl -A` suffit.

Règle :
**cinq requêtes au plus d'affilée, trois secondes entre deux, et jamais de boucle de
« re-essais » rapprochés** ; après un refus, cinq minutes sans rien envoyer, puis une
seule requête — un bureau qui mesure le site ne doit pas le faire tomber.

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

**Le titre du commit finit dans le registre d'activité**, lu par le Patron, sans le corps
pour l'expliquer. Un titre qui ne se comprend pas seul ne sera compris nulle part.

---

## Le registre d'activité

`REGISTRE-ACTIVITE.md` dit **quand** chaque chose a été livrée : le jour, l'heure, et le
titre du commit. Demandé par le Patron le 11/09/2026.

**Il se génère — on ne l'écrit pas à la main** : `npm run registre`. Un registre tenu à la
main ment au bout d'une semaine (une journée oubliée, une heure arrondie) et devient un
document qu'on ne peut plus opposer à personne. Les dates des commits, elles, ne se
réécrivent pas sans laisser de trace.

**Régénérez-le en fin de séance**, et commitez-le avec le reste.

⚠️ **Un clone superficiel le faisait mentir en silence.** Une session lancée sur un
clone `--depth` ne voit qu'une tranche récente de l'histoire ; `git log` ne s'en plaint
pas, il s'arrête à la limite. Le 12/09/2026, le registre a été régénéré **huit fois**
en annonçant « 141 livraisons depuis le 27 août » au lieu de « 856 depuis le
11 juillet » — six semaines effacées, sans un signe. Trouvé par 🛡️ Le Gardien.
`npm run registre` **refuse désormais d'écrire** sur un dépôt superficiel et donne la
commande : `git fetch --unshallow`. Si vous voyez ce refus, c'est qu'il vous a évité
un faux document, pas qu'il est cassé.

Deux choses à ne pas confondre, écrites dans le fichier lui-même :

- **« Amplitude » n'est pas « temps passé »** — c'est l'écart entre la première et la
  dernière livraison du jour. Elle ignore les pauses, le travail qui n'a rien produit, et
  les heures passées à chercher une panne qui n'existait pas. Le registre prouve qu'on a
  livré à telle heure, rien de plus.
- **Heures d'Abidjan** (UTC+0), parce que c'est le calendrier du site. L'heure du Patron
  est calculée à côté par `Intl`, donc elle suit l'heure d'été toute seule.

  ⚠️ **Le Patron vit à Aix-la-Chapelle (Aachen, Allemagne)** — `Europe/Berlin`, donc
  **UTC+2 l'été et UTC+1 l'hiver**. Il est DEVANT le calendrier du site, jamais
  derrière. Le 16/09/2026, une horloge serveur à 21:59 UTC a été annoncée comme
  « bientôt 22 h chez vous » : il était minuit moins une. Une heure lue dans
  `/api/health`, dans un journal ou dans le registre est une heure d'ABIDJAN ;
  la convertir avant de la lui dire, ou ne pas la lui dire du tout.

**La section « Ce que le Patron a fait lui-même » est hors du bloc automatique** et le
générateur ne la touche jamais : un zip extrait, une clé changée dans cPanel, une
application construite ne laissent aucune trace dans git. Complétez-la avec ce que vous
avez vu se produire — jamais avec ce que vous supposez.

**Aucune pull request sans demande explicite du Patron.**
