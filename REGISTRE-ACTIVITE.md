# Registre d’activité — Chap.ci

Quand chaque chose a été faite. **Ce document se génère** : `npm run registre`.

| | |
|---|---|
| Période couverte | du Samedi 11 juillet 2026 au Samedi 12 septembre 2026 |
| Livraisons | 856 |
| Jours travaillés | 63 |
| Dernière mise à jour | Samedi 12 septembre 2026, 16:15 (Abidjan) |

**Les heures sont celles d’Abidjan** (UTC+0, sans heure d’été) — c’est le
calendrier du site. L’heure du Patron est donnée à côté, calculée pour
`Europe/Berlin` : elle suit l’heure d’été toute seule.

⚠️ **« Amplitude » n’est pas « temps passé. »** C’est l’écart entre la première
et la dernière livraison du jour. Elle ne dit ni les pauses, ni le travail qui
n’a rien produit, ni les heures passées à chercher une panne qui n’existait
pas. Ce registre dit **quand quelque chose a été livré**, et rien d’autre :
c’est la seule chose qu’il puisse prouver.

---

## Ce que le Patron a fait lui-même

Un zip extrait, une clé changée dans cPanel, un fichier téléversé, une
application construite : **rien de tout cela ne laisse de trace dans git**, et
le générateur ne peut pas l’inventer. Ces lignes-là s’ajoutent à la main,
ici même — `npm run registre` ne touche jamais cette section.

| Jour | Ce qui a été fait |
|---|---|
| 10/09/2026 | Demande d’accès en production déposée à la Play Console (01 h 04) |
| 10/09/2026 | Clé Firebase `fcm.json` déposée, puis zips n° 21, 22 et 23 extraits |
| 11/09/2026 | Clé cron et jeton de modération changés ; clés reportées dans les tâches cPanel |

---

## Les livraisons, lues dans git

<!-- DÉBUT REGISTRE AUTOMATIQUE — ne rien écrire entre ces deux marques -->

### Samedi 12 septembre 2026

**17 livraison(s)** · Abidjan 04:02 → 15:51 · chez le Patron 06:02 → 17:51 · amplitude 11 h 49

- `04:02` · La clé cron cesse de s’afficher treize fois sur notre propre écran d’admin  <sub>`80f6fa7`</sub>
- `13:23` · Un correctif commité n’est pas un correctif livré — le Gardien nous l’a rappelé  <sub>`979b2b0`</sub>
- `13:25` · Les 65 caractères, c’était le Gardien lui-même — ma rectification  <sub>`d289d1e`</sub>
- `14:38` · Google refuse l’accès en production : quatorze jours de plus, à partir d’aujourd’hui  <sub>`6ecf4d2`</sub>
- `14:44` · Google nomme la cause du refus : l’engagement des testeurs, pas la fraîcheur du build  <sub>`adfdcdb`</sub>
- `14:46` · Les huit questions du formulaire Google, en clair, quatorze jours avant l’échéance  <sub>`21d4413`</sub>
- `15:04` · Le commit à construire était périmé — et sa vérification aurait bloqué le Patron  <sub>`6b20009`</sub>
- `15:09` · L’étape qui se taisait quand tout allait bien dit maintenant qu’elle n’a rien à faire  <sub>`b165368`</sub>
- `15:19` · Le code Android de la v1.25 compile — l’échec ne tient qu’au fichier de signature  <sub>`d0c2228`</sub>
- `15:23` · Le chemin du keystore s’écrit par une commande, et les mots de passe se comptent  <sub>`9954fdd`</sub>
- `15:25` · `keytool` n’existe pas sur un Mac, et cette vérification-là se saute  <sub>`6ad1806`</sub>
- `15:29` · « No such file or directory » : le fichier était là, le Terminal regardait ailleurs  <sub>`36e05e4`</sub>
- `15:34` · « keystore password was incorrect » ne dit pas lequel des deux mots de passe  <sub>`23c02a0`</sub>
- `15:37` · L’invite qui n’affiche rien quand on tape a fait écrire un mot de passe en clair  <sub>`d6846f2`</sub>
- `15:40` · Le keystore est un PKCS12 : ses deux mots de passe n’en font qu’un seul  <sub>`c77df1c`</sub>
- `15:45` · L’AAB de la v1.25 existe — 69,3 Mo, et la première mise à jour des testeurs depuis le 15 août  <sub>`f5e9a5b`</sub>
- `15:51` · La Play Console dément notre minSdk : 24 s’applique, nous déclarons 23  <sub>`866a03b`</sub>

### Vendredi 11 septembre 2026

**8 livraison(s)** · Abidjan 02:59 → 21:37 · chez le Patron 04:59 → 23:37 · amplitude 18 h 38

- `02:59` · 65 caractères, ce n’était pas une clé de trop : c’était l’autre secret  <sub>`302269f`</sub>
- `03:13` · Une vraie clé cron dormait dans le journal des bureaux — retirée  <sub>`f1dd8da`</sub>
- `03:27` · Cinq minutes d’anti-robot est un plancher — vingt-cinq n’ont pas suffi  <sub>`e49e542`</sub>
- `03:52` · Un registre d’activité qui se génère, parce qu’un registre tenu à la main ment  <sub>`748ff11`</sub>
- `07:04` · Le certificat n’a pas été renouvelé — deux lectures fausses, en sens inverse  <sub>`0930faa`</sub>
- `18:39` · Quatre jours sans une annonce nouvelle — et le dépôt ignore l’heure des crons  <sub>`c443699`</sub>
- `18:45` · La clé cron sort des écrans, et les treize horaires entrent dans le dépôt  <sub>`4dcdd91`</sub>
- `21:37` · Le certificat est renouvelé — la quatrième ligne est apparue, comme prévu  <sub>`cf15038`</sub>

### Jeudi 10 septembre 2026

**10 livraison(s)** · Abidjan 06:00 → 21:11 · chez le Patron 08:00 → 23:11 · amplitude 15 h 10

- `06:00` · Le Crieur ne pourra plus signaler un 404 que son propre prompt a écrit  <sub>`469106d`</sub>
- `07:20` · Le bandeau cookies ne peut plus être recouvert par la pop-up newsletter  <sub>`2f91687`</sub>
- `07:29` · Le zip de livraison passe de 11 Mo à 2,9 Mo, sans rien retirer d’utile  <sub>`b917076`</sub>
- `07:31` · Déposer un seul fichier — la voie qui ne dépend d’aucun téléchargement  <sub>`876f19b`</sub>
- `07:37` · Le zip allégé demandait 30 Mo à la production pour lire deux nombres  <sub>`fd25525`</sub>
- `08:06` · La fiche de build demande d’abord de la place sur le disque  <sub>`26a749c`</sub>
- `09:00` · `fcm: true` — la clé Firebase est lue, et le témoin a servi dès son premier jour  <sub>`3130a35`</sub>
- `18:58` · Les boutons d’action redeviennent orange, et six cessent de redire le thème  <sub>`0a8440f`</sub>
- `20:58` · Le bandeau cookies devient une barre à trois choix, et le refus se retire  <sub>`7aa2cac`</sub>
- `21:11` · Le certificat expire le 10 octobre, pas le 12 — la source était morte, pas lente  <sub>`18b04b2`</sub>

### Mercredi 9 septembre 2026

**2 livraison(s)** · Abidjan 22:38 → 23:05 · chez le Patron 00:38 → 01:05 · amplitude 27 min

- `22:38` · Les 14 jours sont faits — la fiche de la demande d’accès en production  <sub>`511c66b`</sub>
- `23:05` · Demande d’accès en production envoyée — les quatre règles de l’attente  <sub>`87e5b4d`</sub>

### Mardi 8 septembre 2026

**9 livraison(s)** · Abidjan 05:29 → 16:39 · chez le Patron 07:29 → 18:39 · amplitude 11 h 10

- `05:29` · La fiche de build est celle de la v1.25, pas celle d’une version jamais construite  <sub>`67fda2f`</sub>
- `14:17` · Le téléphone peut sonner, et le catalogue n’a plus de plafond  <sub>`8f6ba17`</sub>
- `14:17` · Les deux nouveaux bancs sont dans la liste des commandes  <sub>`38700ad`</sub>
- `14:27` · La barre du haut se touche aussi — le banc sait enfin regarder un ordinateur  <sub>`55e1b0a`</sub>
- `14:48` · Le catalogue part avant React, et les vignettes cessent d’être deux fois trop grandes  <sub>`acd05ef`</sub>
- `15:51` · Le Patron peut vérifier lui-même que sa clé Firebase est lue  <sub>`fd74e61`</sub>
- `16:13` · L’application demande son jeton à Firebase — le téléphone peut enfin sonner  <sub>`5accb8d`</sub>
- `16:21` · `.metadata` n’est plus suivi : un `git pull` ne se bloque plus dessus  <sub>`7b931b4`</sub>
- `16:39` · La fiche de build dit enfin qu’il faut Firebase — et quel commit construire  <sub>`1a2ad3a`</sub>

### Lundi 7 septembre 2026

**15 livraison(s)** · Abidjan 03:33 → 15:12 · chez le Patron 05:33 → 17:12 · amplitude 11 h 39

- `03:33` · Deux mots qui se lisaient mal sur un téléphone (offres d’emploi)  <sub>`988947e`</sub>
- `04:15` · Quinze types de structure au lieu de dix pour « Devenir professionnel »  <sub>`1d0a363`</sub>
- `04:34` · L’anti-robot du serveur tient cinq minutes, pas une  <sub>`1267d44`</sub>
- `05:02` · Les mots de la vitrine suivent le type : une association remet des dons  <sub>`26f1e1c`</sub>
- `08:13` · Les gens d’autres pays créent leur compte, et l’admin voit d’où ils viennent  <sub>`e4f8590`</sub>
- `08:37` · Les comptes Pro tiennent leur stock, et sont prévenus sous le minimum  <sub>`b0a2a67`</sub>
- `08:51` · Chaque notification mène à ce dont elle parle, et propose de s’activer  <sub>`1f33652`</sub>
- `14:11` · Le prix affiché à Google et à WhatsApp respecte la fin des promotions  <sub>`4b1ec4e`</sub>
- `14:11` · La fiche v1.25 dit enfin quel commit construire  <sub>`ee0c7ce`</sub>
- `14:19` · Le guide iPhone dit ce que la mise à jour apporte vraiment  <sub>`9cfc56f`</sub>
- `14:35` · Soutenir Chap.ci dans l’application, et le doigt qui ouvre le compte  <sub>`25405d9`</sub>
- `14:35` · La fiche v1.25 pointe le commit qui porte le don et la biométrie  <sub>`e88565b`</sub>
- `15:09` · La vidéo ne se lance plus seule, et rien ne se rate plus du pouce  <sub>`19bbd6e`</sub>
- `15:09` · La fiche v1.25 pointe le commit qui porte la vidéo à la demande  <sub>`35577c3`</sub>
- `15:12` · Une clé de cron qui traîne un saut de ligne ne coupe plus la sauvegarde  <sub>`8d23100`</sub>

### Dimanche 6 septembre 2026

**5 livraison(s)** · Abidjan 04:47 → 21:37 · chez le Patron 06:47 → 23:37 · amplitude 16 h 50

- `04:47` · Le site ne saute plus, ne bloque plus, et pèse moins : la revue du 6 septembre  <sub>`a960416`</sub>
- `19:37` · La vidéo d'annonce passe de quinze secondes à une minute, et de 15 à 60 Mo  <sub>`5e5897d`</sub>
- `21:06` · Les structures se suivent et publient des offres d’emploi (serveur)  <sub>`ee34365`</sub>
- `21:19` · Le site suit les structures et affiche leurs offres d’emploi  <sub>`07701c3`</sub>
- `21:37` · L’application suit les structures et porte leurs offres d’emploi  <sub>`6d9beba`</sub>

### Samedi 5 septembre 2026

**3 livraison(s)** · Abidjan 21:09 → 21:51 · chez le Patron 23:09 → 23:51 · amplitude 42 min

- `21:09` · Les réseaux sociaux du professionnel : Facebook, Instagram, TikTok… cliquables sur la page vendeur, aux couleurs des marques  <sub>`78f2c2b`</sub>
- `21:38` · L'anti-robot du serveur se déclenche sur nos propres rondes : la règle des cinq requêtes  <sub>`43d28b7`</sub>
- `21:51` · WhatsApp rejoint les réseaux du professionnel, en premier : un numéro tapé devient un lien wa.me  <sub>`db40f2c`</sub>

### Vendredi 4 septembre 2026

**15 livraison(s)** · Abidjan 03:08 → 22:22 · chez le Patron 05:08 → 00:22 · amplitude 19 h 14

- `03:08` · L'application prend les quatre nouveautés du 3 septembre : affiche WhatsApp, « Ça vaut combien ? », offres, annonce écrite depuis la photo  <sub>`4b7a22c`</sub>
- `03:08` · Journal des versions : la v1.25 (code 26) inscrite, avec ce qui est prouvé et ce qui ne l'est pas  <sub>`97e8815`</sub>
- `03:18` · Guide iPhone : quand le dossier chapci-app n'est plus sur le Mac, le bloc qui le récupère  <sub>`7209e85`</sub>
- `03:32` · L'affiche WhatsApp part seule, sans texte : WhatsApp jetait l'image dès qu'un lien l'accompagnait  <sub>`94772e0`</sub>
- `03:47` · Affiche WhatsApp : un titre long passe en trois lignes plutôt que d'être coupé  <sub>`796e89e`</sub>
- `04:02` · Affiche WhatsApp : le lien part en légende, seul endroit cliquable d'un statut  <sub>`c95afed`</sub>
- `04:07` · Les liens chap.ci/annonce/… savent ouvrir l'application — prêts, en attente de deux identifiants  <sub>`23a6261`</sub>
- `04:33` · Affiche WhatsApp sur iPhone : le lien est copié, la personne le colle en légende  <sub>`f3242f3`</sub>
- `13:16` · Ronde de l'Atelier du 04/09 : une insécable oubliée sur Publier, quatre gris illisibles dans l'admin  <sub>`92435ea`</sub>
- `21:33` · Tableau de bord : l'entonnoir semaine par semaine — visiteurs, fiches vues, contacts, annonces  <sub>`5db1550`</sub>
- `21:38` · L'application à égalité avec le site : modifier son annonce, et les réponses  <sub>`bdcf8c4`</sub>
- `21:52` · La recherche qui comprend : synonymes ivoiriens, débuts de mots, fautes de frappe — site, application et serveur  <sub>`9e1bfa1`</sub>
- `21:57` · Les favoris qui préviennent : le prix baisse, l'annonce se termine — l'acheteur revient sans qu'on le paie  <sub>`f0ee9a9`</sub>
- `22:03` · Le poids sur 3G : les photos se contrôlent sur le serveur, le modèle de 5,4 Mo n'est plus téléchargé  <sub>`3132af6`</sub>
- `22:22` · La vidéo de quinze secondes par annonce : l'objet qui tourne, qui s'allume, qui roule — site, application et serveur  <sub>`7caf99f`</sub>

### Jeudi 3 septembre 2026

**7 livraison(s)** · Abidjan 07:43 → 21:28 · chez le Patron 09:43 → 23:28 · amplitude 13 h 45

- `07:43` · L'icône du site porte son empreinte dans son adresse — Google et Safari la redemanderont  <sub>`ecb8390`</sub>
- `20:44` · L'affiche pour le statut WhatsApp — chaque annonce se poste en une image  <sub>`d402537`</sub>
- `20:52` · « Ça vaut combien ? » — la fourchette du marché, au vendeur qui tape et à l'acheteur qui lit  <sub>`9e831bd`</sub>
- `21:02` · « Faire une offre » — la négociation a un montant, un état, et trois boutons  <sub>`3ed1bc8`</sub>
- `21:12` · « Chap.ci écrit l'annonce » — la photo remplit le formulaire, le vendeur relit et publie  <sub>`3905f31`</sub>
- `21:15` · Chap.ci Garantie — le dossier de ce qui doit exister avant tout code  <sub>`4e1ac61`</sub>
- `21:28` · Quatre notifications prêtes à coller pour annoncer les nouveautés de septembre  <sub>`f79e08a`</sub>

### Mercredi 2 septembre 2026

**1 livraison(s)** · Abidjan 03:14 → 03:14 · chez le Patron 05:14 → 05:14 · amplitude —

- `03:14` · Le Gardien peut enfin voir ce qui traîne dans api/ — un compteur dans /api/health  <sub>`db2c143`</sub>

### Mardi 1 septembre 2026

**11 livraison(s)** · Abidjan 05:42 → 16:17 · chez le Patron 07:42 → 18:17 · amplitude 10 h 35

- `05:42` · La loupe lance la recherche — sur téléphone, il n’y avait aucun bouton du tout  <sub>`b99b4c6`</sub>
- `07:21` · Les e-mails passent au pagne, et le logo ne peut plus rester coincé dans le cache de Gmail  <sub>`70fac3c`</sub>
- `07:26` · La newsletter aussi : cartes d’annonces au pagne, et deux gris trop pâles corrigés  <sub>`cb2abdf`</sub>
- `08:10` · Les annonces de la newsletter passent en grille à deux colonnes, et un prix ne se coupe plus en deux  <sub>`d7d5012`</sub>
- `14:56` · Une photo publiée sans filtre arrive maintenant devant un relecteur, et le serveur regarde enfin les images  <sub>`9882ee5`</sub>
- `15:08` · L’application sait enfin réinitialiser un mot de passe oublié — v1.24  <sub>`6e9c17d`</sub>
- `15:21` · L'analyse Flutter ne rapporte plus sur du code fabriqué  <sub>`29aa047`</sub>
- `15:27` · La fiche de construction de la v1.24, écrite pour le Terminal  <sub>`f06e8e6`</sub>
- `15:31` · Le dossier iOS ne peut plus rester sous une version d'iOS que les plugins refusent  <sub>`1ddee70`</sub>
- `15:33` · Le guide iPhone dit enfin comment METTRE À JOUR, pas seulement comment installer  <sub>`021980c`</sub>
- `16:17` · Modifier une annonce ne contourne plus le contrôle des photos  <sub>`7b7c9e3`</sub>

### Lundi 31 août 2026

**5 livraison(s)** · Abidjan 14:31 → 18:11 · chez le Patron 16:31 → 20:11 · amplitude 3 h 40

- `14:31` · Sur tablette, le contenu ne s’étire plus sur toute la largeur  <sub>`8e92b91`</sub>
- `15:05` · Un lien de notification ne peut plus quitter chap.ci, et six finitions  <sub>`e8e831b`</sub>
- `17:44` · Toutes les images de Chap.ci portent enfin la couronne, y compris le filigrane des photos  <sub>`5ab5ff6`</sub>
- `18:08` · Les 19 captures d’écran des boutiques refaites, et une pub ne se fait plus couper sur les téléphones  <sub>`991ba02`</sub>
- `18:11` · Le fabricant de zip entre dans le dépôt, et le zip emporte enfin le filigrane  <sub>`541d4c1`</sub>

### Dimanche 30 août 2026

**16 livraison(s)** · Abidjan 01:14 → 19:00 · chez le Patron 03:14 → 21:00 · amplitude 17 h 46

- `01:14` · Journal : le mur de publication, et l'inventaire CSP avant activation  <sub>`93155c8`</sub>
- `07:13` · La fiche dit où l'on est, et la barre du bas dit de quoi elle parle  <sub>`5a7e5ff`</sub>
- `09:45` · Play : le seuil des 12 testeurs est franchi, le compteur des 14 jours tourne  <sub>`42bd9ff`</sub>
- `10:34` · Annoncer une nouveauté : la cloche, l'application, le téléphone — et le guide  <sub>`6bdb9b9`</sub>
- `10:45` · L'application ouvre enfin le guide du compte professionnel  <sub>`dda04ed`</sub>
- `10:58` · Journal : le faux secret TOTP et la vraie garantie sur uploads/  <sub>`cd6cb6a`</sub>
- `12:25` · Le site passe au vert ivoirien, et le signe se trace d'un seul trait  <sub>`c589403`</sub>
- `12:28` · Le favicon .ico et l'icône Apple suivent aussi le vert  <sub>`650658f`</sub>
- `12:39` · Le feuillage devient le signe de Chap.ci  <sub>`ff33072`</sub>
- `13:17` · La couronne de feuillage et le vert ivoirien arrivent dans l’application  <sub>`bf96a2b`</sub>
- `13:19` · Journal des bureaux : les trois leçons du passage au vert  <sub>`80ad8dd`</sub>
- `13:53` · Le drapeau entre dans le logo, et le site se lit orange, blanc, vert  <sub>`eeea343`</sub>
- `14:15` · L’écran de démarrage devient une jauge de chargement  <sub>`4cc7b42`</sub>
- `14:25` · Le liseré du pied de page redevient orange, blanc, vert  <sub>`ef1b294`</sub>
- `14:37` · Un seul cadre autour de la barre de recherche, plus deux  <sub>`957757c`</sub>
- `19:00` · La note d’un vendeur ne peut plus être falsifiée, ni salie par lui-même  <sub>`c1abc28`</sub>

### Samedi 29 août 2026

**5 livraison(s)** · Abidjan 05:47 → 13:26 · chez le Patron 07:47 → 15:26 · amplitude 7 h 39

- `05:47` · Journal : un bureau qui audite une copie périmée redemande ce qui est fait  <sub>`e06a35e`</sub>
- `05:58` · L'application rattrape le site : le nom de boutique et la vitrine  <sub>`22b1dd4`</sub>
- `06:34` · Le nom de boutique verrouillé, la langue choisie, l'annonce traduite  <sub>`167d7c9`</sub>
- `06:57` · Le mot de passe oublié existe enfin, et il ne contourne pas la 2FA  <sub>`bb600b0`</sub>
- `13:26` · Le formulaire de publication s'affiche à tout le monde, le compte vient à la fin  <sub>`0bac5a1`</sub>

### Vendredi 28 août 2026

**12 livraison(s)** · Abidjan 03:08 → 18:25 · chez le Patron 05:08 → 20:25 · amplitude 15 h 17

- `03:08` · Journal : le tableau de bord administrateur CRM est en ligne  <sub>`0888952`</sub>
- `03:30` · Les réponses automatiques ont leur écran, et une tuile pour le trouver  <sub>`10a030c`</sub>
- `03:31` · Journal : la redemande d'une fonctionnalité est un rapport de bogue sur l'emplacement  <sub>`4e82a9b`</sub>
- `04:46` · Un administrateur peut voir le tableau de bord d'un professionnel  <sub>`67363e6`</sub>
- `04:47` · Journal : une fonctionnalité réservée à un rôle doit être vérifiable par qui la valide  <sub>`c05c9df`</sub>
- `14:28` · Cibles tactiles de la vitrine, tokens des grilles, insécable de la réponse auto  <sub>`f02c2b6`</sub>
- `14:59` · L'application passe en v1.23 (code 24), et le volet iOS est débloqué sur le papier  <sub>`8e72e9e`</sub>
- `15:00` · Le guide d'installation de l'application sur l'iPhone du Patron  <sub>`b8c5998`</sub>
- `17:32` · Tout le personnel est prévenu d'une demande Pro, et l'onglet passe à l'orange  <sub>`154ce02`</sub>
- `18:05` · La vitrine du professionnel — ce que l'acheteur voit d'une boutique  <sub>`5d98158`</sub>
- `18:15` · L'aperçu de la boutique, avant la grille d'annonces  <sub>`a30f784`</sub>
- `18:25` · Le nom de la boutique apparaît sur les cartes d'annonces  <sub>`81d6ac1`</sub>

### Jeudi 27 août 2026

**33 livraison(s)** · Abidjan 00:43 → 21:43 · chez le Patron 02:43 → 23:43 · amplitude 21 h 00

- `00:43` · Le tableau de bord professionnel passe en vrai outil de travail (site + app)  <sub>`e4def5c`</sub>
- `00:51` · Journal : tableau Pro CRM livré, maquette admin en attente de confirmation  <sub>`a3ad0b8`</sub>
- `00:52` · La courbe des vues se centre dans sa carte quand la colonne d'à côté est haute  <sub>`28db01e`</sub>
- `00:55` · La v1.22 part aux tests fermés — registre et journal à jour  <sub>`dbb8884`</sub>
- `00:57` · Le build Android repart : deux opérateurs % avaient perdu leur espace normale  <sub>`48c5045`</sub>
- `01:00` · v1.22 construite : 60,3 Mo — registre et journal au réel  <sub>`1cd8650`</sub>
- `01:01` · La v1.22 s'essaie d'abord sur le téléphone du Patron — rien n'est téléversé  <sub>`e6e6e9b`</sub>
- `01:06` · Trois finitions vues sur les captures du Patron (tableau Pro sur téléphone)  <sub>`2773d24`</sub>
- `01:09` · L'onglet Compte des comptes Pro se conforme aux maquettes validées  <sub>`b5dd922`</sub>
- `04:52` · Le tableau de bord admin passe en vrai poste de pilotage (maquette validée)  <sub>`8411506`</sub>
- `04:52` · Journal : les deux tableaux de bord livrés dans chapcitableaux.zip  <sub>`527a3ed`</sub>
- `13:18` · Le compte d'un professionnel tient entier dans son tableau de bord  <sub>`d9a58ee`</sub>
- `13:19` · Journal : la console professionnelle livrée, et ce que l'app ne peut pas encore  <sub>`e0104d3`</sub>
- `13:44` · Un professionnel habille sa vitrine : bannière et logo, posés depuis son tableau  <sub>`ed0a13f`</sub>
- `13:46` · Journal : la vitrine du professionnel, et où passent ses images  <sub>`c78a697`</sub>
- `13:52` · La page vendeur d'un professionnel porte enfin son enseigne  <sub>`9281ffc`</sub>
- `13:59` · La bannière passe derrière tout le bandeau, sans bloc plein qui la masque  <sub>`afabd48`</sub>
- `14:02` · Journal : la bannière derrière les écritures, validée et livrée  <sub>`adfbb6b`</sub>
- `14:05` · La vitrine professionnelle est en ligne — empreintes vérifiées  <sub>`410355d`</sub>
- `14:26` · Mes annonces devient la table de travail du vendeur (planche 1, écran 1)  <sub>`d1043ed`</sub>
- `14:41` · Messages : les acheteurs qui attendent remontent en tête (planche 1, écran 2)  <sub>`1defd52`</sub>
- `14:53` · Mes commandes : une vente se conclut d'un bouton (planche 1, écran 3)  <sub>`0e2f5c1`</sub>
- `15:26` · Les onze écrans qui restaient de la console professionnelle  <sub>`0cb93a7`</sub>
- `15:33` · La fiche professionnelle suit la maquette, et ses horaires tiennent dans l'écran  <sub>`b67324c`</sub>
- `15:38` · Journal : les quatorze écrans de la console pro sont en ligne  <sub>`98b3135`</sub>
- `15:53` · Le lieu se détecte tout seul ; le dossier vérifié ne se modifie plus qu'à l'équipe  <sub>`cd3a862`</sub>
- `18:37` · Une flèche de retour sur les écrans qui n'en avaient pas  <sub>`4775fc6`</sub>
- `18:41` · Journal : position, dossier verrouillé et flèches de retour sont en ligne  <sub>`a72f310`</sub>
- `18:57` · Le professionnel sait QUI suit ses annonces, et accueille tout seul  <sub>`1d64775`</sub>
- `21:01` · Journal : qui suit une annonce et la réponse automatique sont en ligne  <sub>`3c3cd62`</sub>
- `21:03` · La tâche « Rappels du professionnel » apparaît dans Tâches auto  <sub>`e3a709f`</sub>
- `21:34` · Le tableau de bord passe au vocabulaire CRM — Commandes, Conversations, Avis, Abonnés  <sub>`a0aed8e`</sub>
- `21:43` · Le tableau de bord au complet — Annonces, Utilisateurs, Demandes Pro, Signalements, Contact, Publicités  <sub>`73d91b1`</sub>

### Mercredi 26 août 2026

**17 livraison(s)** · Abidjan 12:06 → 19:04 · chez le Patron 14:06 → 21:04 · amplitude 6 h 58

- `12:06` · Registre des versions : la fiche v1.21 dit tout ce que le build embarque  <sub>`c705b3d`</sub>
- `12:19` · Le build Android de la v1.21 repart : montée de flutter_web_auth_2 en 5.x  <sub>`b435eab`</sub>
- `12:43` · v1.21 envoyée à l'examen : registre et journal à jour  <sub>`823b315`</sub>
- `13:47` · Journal : proposition de nouveau logo reçue, en attente de la décision du Patron  <sub>`7cee47d`</sub>
- `14:05` · Chap.ci change de signe : le losange fendu « chap-chap » remplace l'épingle  <sub>`3e1b091`</sub>
- `14:26` · Journal : la refonte d'accueil explorée en aperçu n'est pas retenue  <sub>`8104a69`</sub>
- `14:31` · L'écran de démarrage tient un instant une fois le signe posé  <sub>`2ec13ad`</sub>
- `14:32` · Le signe « chap-chap » entre dans l'app : en-tête de l'accueil  <sub>`e4453ec`</sub>
- `14:43` · L'écran de démarrage bat « chap-chap » — l'entrée validée sur aperçu  <sub>`cdba2b3`</sub>
- `14:56` · L'écran de démarrage joue « la croisée », choisie par le Patron  <sub>`c61ec9e`</sub>
- `14:59` · Contrastes des écrans Foncier et Comptabilité, fiche v1.22 à jour  <sub>`9ee8103`</sub>
- `17:34` · Demandes Pro : l'onglet arrive sur le site, l'équipe et le demandeur sont notifiés  <sub>`40b52e5`</sub>
- `18:00` · L'espace professionnel au complet : Devenir Pro sur le site, fiches détaillées, liens directs, tableau de bord  <sub>`28964a5`</sub>
- `18:16` · L'onglet Compte d'un professionnel s'ouvre sur son espace pro  <sub>`2dad38d`</sub>
- `18:18` · La page Compte du site s'ouvre aussi sur l'espace pro pour les approuvés  <sub>`3dcdc9e`</sub>
- `18:20` · Journal : les trois livraisons du soir sont en production, empreintes vérifiées  <sub>`1fe2f26`</sub>
- `19:04` · Veille : le courriel Google Play sur les nouvelles exigences de qualité  <sub>`4008cac`</sub>

### Mardi 25 août 2026

**23 livraison(s)** · Abidjan 03:12 → 20:53 · chez le Patron 05:12 → 22:53 · amplitude 17 h 41

- `03:12` · Journal : synthèse hebdo du Secrétariat (17-24 août)  <sub>`2fc6a0d`</sub>
- `03:34` · APP-VERSIONS : v1.20 verdict reçu (dispo testeurs), testeurs 11/12, gate v1.21 levé  <sub>`e5022e2`</sub>
- `03:36` · Journal : ronde Gardien du soir — verte, RAS  <sub>`41bd93f`</sub>
- `06:54` · Compte : un écran Paramètres, et la confirmation d'e-mail soignée  <sub>`702de59`</sub>
- `07:06` · Paramètres : Mes favoris, Partager l'application, Noter sur le Play Store  <sub>`3eb1b07`</sub>
- `07:21` · Langue de l'app : choisir parmi six langues, tout bascule en direct  <sub>`bb282b7`</sub>
- `07:44` · Traduire l'écran d'accueil dans les six langues  <sub>`28b603b`</sub>
- `07:51` · Traduire l'écran de détail d'une annonce  <sub>`220d35c`</sub>
- `07:59` · Traduire la connexion et le tableau de bord Mon compte  <sub>`9def8df`</sub>
- `08:03` · Traduire Explorer et la messagerie  <sub>`f4a8ad8`</sub>
- `08:09` · Traduire les 16 catégories et les 101 sous-catégories (affichage)  <sub>`662ad03`</sub>
- `08:11` · Traduire la carte d'annonce, les dates relatives et les distances  <sub>`91df5a2`</sub>
- `08:14` · Traduire la publication et le fil de conversation  <sub>`cb1d612`</sub>
- `08:24` · Traduire tout le reste du parcours grand public  <sub>`6aec219`</sub>
- `08:29` · Corriger deux const invalides qui cassaient le build iOS  <sub>`4ccccbe`</sub>
- `08:38` · Traduire les annonces elles-mêmes : bouton « Traduire » + moteur branchable  <sub>`d818703`</sub>
- `08:47` · Traduction des annonces dans l'app, sans VPS : deux moteurs gratuits en relais  <sub>`454e9f1`</sub>
- `10:56` · Comptes professionnels : dossier, validation admin, badge PRO — cinq types d'organisation  <sub>`0315bb2`</sub>
- `11:00` · Dix types de comptes Pro, calqués sur les seize catégories du site  <sub>`0d31a07`</sub>
- `11:09` · Chaque type de compte Pro a ses propres secteurs  <sub>`2c2cd91`</sub>
- `14:36` · Trois correctifs d'accessibilité de l'Atelier, appliqués le jour même  <sub>`4b78ae7`</sub>
- `15:19` · Les pages d'information du site suivent la langue choisie dans l'app  <sub>`04711d2`</sub>
- `20:53` · Journal des bureaux : livraison des pages traduites et ronde du Gardien du 25/08 au soir  <sub>`70fbdef`</sub>

### Lundi 24 août 2026

**9 livraison(s)** · Abidjan 04:21 → 17:17 · chez le Patron 06:21 → 19:17 · amplitude 12 h 56

- `04:21` · Journal : ronde Gardien — verte, pagination + défilement infini relus OK  <sub>`d9cadbd`</sub>
- `06:28` · App v1.21 (code 22) : targetSdk 36 (échéance Google du 30/08) + montée de version  <sub>`936dcc1`</sub>
- `06:29` · Journal + APP-VERSIONS : v1.21 (code 22) préparée, targetSdk 36  <sub>`54881d6`</sub>
- `12:44` · Journal : rondes Comptable/Mécanicien/Concierge — entonnoir vérifié (pas un bug)  <sub>`a7982d3`</sub>
- `12:55` · Vignettes de grille : ~233 Ko → ~25 Ko par carte (proposition Mécanicien)  <sub>`c162676`</sub>
- `12:56` · Journal : vignettes de grille livrées (−90 % par carte)  <sub>`2e64814`</sub>
- `13:19` · Vignettes : backfill automatique des anciennes photos via le cron cleanup  <sub>`e961d70`</sub>
- `13:21` · Journal : backfill vignettes via cleanup (empreinte 6ea5197a7a2a)  <sub>`8c6f64f`</sub>
- `17:17` · Journal : ronde Gardien — backfill 101 vignettes OK, feature complète (−81%)  <sub>`20412c1`</sub>

### Dimanche 23 août 2026

**13 livraison(s)** · Abidjan 05:31 → 22:54 · chez le Patron 07:31 → 00:54 · amplitude 17 h 23

- `05:31` · Journal : ronde Gardien 23/08 00:46 — tout vert, dépôt = production  <sub>`0e559be`</sub>
- `07:03` · Journal : ronde Gardien 23/08 05:47 — verte, RAS  <sub>`8e478c4`</sub>
- `09:29` · Journal : ronde Crieur 23/08 — catalogue 29/6/6/6, +19 d'un seul vendeur  <sub>`a5a9dfa`</sub>
- `21:02` · Journal : ronde Gardien 23/08 15:46 — verte + 2 points d'entretien Dev  <sub>`36c7b14`</sub>
- `21:11` · Ménage des dépendances : retrait de l'outillage Capacitor (poids mort)  <sub>`8f105c2`</sub>
- `21:13` · Journal : zip front livré (contraste) + ménage Capacitor, ronde Gardien versée  <sub>`d0c45f3`</sub>
- `21:16` · Journal : front déployé, empreinteSite 92f59efa6e60 — dépôt = production  <sub>`494508e`</sub>
- `21:44` · Accueil de l'app : afficher toutes les annonces, pas seulement 8  <sub>`46d3a73`</sub>
- `21:54` · Accueil : défilement infini des annonces (fini le plafond de 500)  <sub>`3f7a518`</sub>
- `21:55` · Journal : accueil app en défilement infini (pagination serveur + app)  <sub>`f57e3ac`</sub>
- `21:58` · Journal : pagination déployée (c73c5bfc40cf) et vérifiée au curl  <sub>`8ace2b7`</sub>
- `22:08` · Accueil : déclencher le chargement de la page suivante à la construction  <sub>`d08e095`</sub>
- `22:54` · Journal : app relancée sur iPhone — tout marche (leçon iOS 26 / flutter upgrade)  <sub>`bb47c3b`</sub>

### Samedi 22 août 2026

**3 livraison(s)** · Abidjan 05:19 → 19:27 · chez le Patron 07:19 → 21:27 · amplitude 14 h 08

- `05:19` · Annonces : lire une annonce par son id (GET /listings/{id})  <sub>`de960b2`</sub>
- `19:00` · Contraste lisible et formulaires bornés sur tablette (rondes Atelier)  <sub>`f5a2ba8`</sub>
- `19:27` · Journal : back déployé (aad460a3b6b3), fiche d'annonce répond 200  <sub>`1806fb7`</sub>

### Vendredi 21 août 2026

**2 livraison(s)** · Abidjan 09:51 → 12:58 · chez le Patron 11:51 → 14:58 · amplitude 3 h 07

- `09:51` · Journal : rondes Gardien + Crieur ; écart entonnoir /publier diagnostiqué (pas un bug)  <sub>`f218cdf`</sub>
- `12:58` · Journal : statuts SAS rédigés pour le Patron (document hors dépôt)  <sub>`d1b1906`</sub>

### Jeudi 20 août 2026

**18 livraison(s)** · Abidjan 03:53 → 22:30 · chez le Patron 05:53 → 00:30 · amplitude 18 h 36

- `03:53` · Journal : panne e-mail résolue — le relais sortant de l'hébergeur était tombé  <sub>`c3917e4`</sub>
- `03:56` · Journal : ronde de nuit du Gardien (tout vert) + source probable de la clé 65 car.  <sub>`5122e17`</sub>
- `14:27` · App : les pages d'info et légales s'ouvrent dans l'app, plus dans un navigateur  <sub>`7053557`</sub>
- `15:02` · App : distance des annonces + tri « Près de moi » (proximité, phase 1)  <sub>`74a2fc0`</sub>
- `15:22` · Messagerie : suppression, archivage, blocage, signalement (serveur — phase A)  <sub>`3b75870`</sub>
- `15:32` · App : appui long sur un message → supprimer, archiver, bloquer, signaler (phase B)  <sub>`56e73a2`</sub>
- `16:05` · Site : gestes de messagerie (supprimer, archiver, bloquer, signaler) — phase C  <sub>`1aedc23`</sub>
- `16:09` · Journal : zip de déploiement de la messagerie construit (API + site)  <sub>`47e08f2`</sub>
- `17:27` · Modération : signalements de conversation identifiables dans mod/queue (+ durcissement vue web app)  <sub>`2c3c7f0`</sub>
- `21:06` · Journal : ronde du soir du Gardien — verte, confirme l'écart de déploiement  <sub>`1ef5a9c`</sub>
- `21:14` · App : bouton « ⋮ » dans l'en-tête de conversation (actions sans viser un message)  <sub>`043f7d1`</sub>
- `21:19` · App : en-tête de conversation avec avatar + nom (façon vraie messagerie)  <sub>`2014068`</sub>
- `21:33` · App : en-tête de conversation cliquable → profil public de la personne  <sub>`675fc3e`</sub>
- `21:47` · Messagerie : glisser une conversation, épingler, et changer d'onglet au doigt  <sub>`0c09f9e`</sub>
- `21:48` · Journal : messagerie glissable + onglets au doigt  <sub>`351518c`</sub>
- `22:08` · Épingler : maximum 5 conversations, et la ligne épinglée s'assombrit  <sub>`9178479`</sub>
- `22:09` · Journal : épinglage débloqué (déploiement manquant) + max 5 + ligne foncée  <sub>`23aa0ab`</sub>
- `22:30` · Journal : back déployé (455e), la leçon du renommage vs écrasement  <sub>`bc8c166`</sub>

### Mercredi 19 août 2026

**1 livraison(s)** · Abidjan 10:37 → 10:37 · chez le Patron 12:37 → 12:37 · amplitude —

- `10:37` · Cibles tactiles de la carte de transaction — le flux d'argent redevient tapable au pouce  <sub>`bcbbb03`</sub>

### Mardi 18 août 2026

**11 livraison(s)** · Abidjan 03:43 → 21:53 · chez le Patron 05:43 → 23:53 · amplitude 18 h 10

- `03:43` · Journal : la ronde du Concierge manquait — versée, et l'erreur consignée  <sub>`b3f6cfc`</sub>
- `08:59` · Journal : ronde du Gardien du matin, une anomalie mineure à surveiller  <sub>`fca7360`</sub>
- `09:27` · Journal : la clé de 65 caractères est une copie fautive, pas une attaque  <sub>`05934c6`</sub>
- `12:07` · Journal : ronde du Gardien de la matinée, tout vert  <sub>`fddb123`</sub>
- `12:23` · Journal : ronde de 10:50 rapatriée, et une pull request ouverte par un bureau  <sub>`082b62e`</sub>
- `20:30` · Journal : ronde de 15:47 versée, panne crt.sh confirmée, quatre rondes retrouvées  <sub>`6f711e6`</sub>
- `20:58` · Journal : Monteur et Serrurier retrouvés sur bureaux/journal — ils n'ont jamais été muets  <sub>`feff6ea`</sub>
- `21:03` · Journal : ronde du soir versée, ménage des branches préparé — la suppression revient au Patron  <sub>`e12d0fa`</sub>
- `21:31` · Journal : bureaux/journal supprimée par erreur pendant le ménage, restaurée à l'identique  <sub>`4c75084`</sub>
- `21:37` · Journal : ménage des branches terminé — deux branches vivantes, zéro perte  <sub>`880f21d`</sub>
- `21:53` · Sécurité : deux consignes tirées d'un dépôt de skills, adaptées à notre pile  <sub>`65c951c`</sub>

### Lundi 17 août 2026

**13 livraison(s)** · Abidjan 05:51 → 12:58 · chez le Patron 07:51 → 14:58 · amplitude 7 h 07

- `05:51` · Partage : une vraie bannière 1200×630 pour l'accueil (WhatsApp)  <sub>`d4179f3`</sub>
- `05:58` · Journal : bannière de partage déployée, et verdict sur l'analyse extérieure  <sub>`a487e78`</sub>
- `06:00` · Journal : l'alerte du débogueur Facebook est un cache du 28 juillet  <sub>`62e74e8`</sub>
- `06:04` · Journal : aperçu de partage confirmé à l'écran par le Patron  <sub>`bc68d98`</sub>
- `07:55` · Bureaux : le certificat TLS se vérifie sans déranger le Patron  <sub>`2d35efd`</sub>
- `08:37` · Journal : rondes du Crieur et du Comptable versées, signalements élucidés  <sub>`768e828`</sub>
- `08:44` · Journal : audit du formulaire de publication  <sub>`aaf473c`</sub>
- `09:15` · Publier : mesurer où les vendeurs décrochent, et pré-remplir leur téléphone  <sub>`a717439`</sub>
- `09:27` · Journal : entonnoir de publication déployé, avec ce qui reste invérifiable  <sub>`d507e27`</sub>
- `10:29` · Publier : tenir la promesse affichée, et dire pourquoi un compte (Concierge)  <sub>`114b97b`</sub>
- `11:39` · Journal : deux comptes de test existent, pour les audits connectés  <sub>`de2c804`</sub>
- `12:50` · Gardien : la périodicité de cron/report entre dans sa routine  <sub>`e3ce50f`</sub>
- `12:58` · Journal : prompt du Gardien recollé, trois consignes deviennent actives  <sub>`cacb5cc`</sub>

### Dimanche 16 août 2026

**10 livraison(s)** · Abidjan 03:26 → 19:05 · chez le Patron 05:26 → 21:05 · amplitude 15 h 39

- `03:26` · Gardien : déduire ses propres tests des compteurs cron_fail / mtoken_fail  <sub>`b603188`</sub>
- `04:01` · Journal : l'attaque « clé en clair dans le front » ne marche pas sur Chap.ci  <sub>`d797ffa`</sub>
- `05:40` · Journal : corriger l'hypothèse « pays » sur le blocage des testeurs  <sub>`e5e80d8`</sub>
- `05:41` · Journal : la capture « pas disponible » vient d'un testeur, pas du Patron  <sub>`64549bc`</sub>
- `05:50` · Journal : le lien du test fermé a fait basculer le testeur de canal  <sub>`4a5db21`</sub>
- `05:52` · Journal : pays du test fermé confirmés corrects, ma piste écartée  <sub>`c2bacf6`</sub>
- `18:23` · Journal : ronde du Gardien (16/08 15:47) versée, tout vert  <sub>`ee5c2a6`</sub>
- `18:41` · Site : cibles tactiles et lisibilité des premiers écrans (Atelier)  <sub>`b14c78c`</sub>
- `18:41` · Journal : ronde de l'Atelier versée, et une entrée récupérée d'une autre branche  <sub>`221365d`</sub>
- `19:05` · Journal : correctifs de l'Atelier déployés, empreinte vérifiée en production  <sub>`5662103`</sub>

### Samedi 15 août 2026

**10 livraison(s)** · Abidjan 08:17 → 22:15 · chez le Patron 10:17 → 00:15 · amplitude 13 h 58

- `08:17` · Journal : ronde du Crieur (15/08) versée + un chiffre figé défigé (Données)  <sub>`fa188c4`</sub>
- `08:23` · Play Store : testeurs inscrits corrigés à 10/12 (capture Patron du 15/08)  <sub>`8c87d2a`</sub>
- `08:30` · v1.20 : fiche de téléversement Play Console prête à suivre  <sub>`e0dabee`</sub>
- `08:34` · Fiche v1.20 : la reconstruction de l'AAB, cas réel du Patron  <sub>`bed3a08`</sub>
- `09:49` · v1.20 envoyée à l'examen Google — la refonte Flutter est partie  <sub>`9c7d5f9`</sub>
- `18:18` · Bureaux : trois routes cron qui envoient manquaient à la liste interdite  <sub>`a0dfc0e`</sub>
- `21:11` · Gardien : clore la CSP bigdatacloud, ré-instruite trois fois dans la journée  <sub>`f9dce86`</sub>
- `21:25` · Journal : prompt du Gardien recollé, la consigne CSP est active  <sub>`08e1ad8`</sub>
- `21:33` · Journal : le canal de test limité à 1 pays, piste sur le blocage des testeurs  <sub>`d25662e`</sub>
- `22:15` · Journal : le recollage du prompt du Gardien est vérifié au réel  <sub>`0c4823f`</sub>

### Vendredi 14 août 2026

**1 livraison(s)** · Abidjan 01:43 → 01:43 · chez le Patron 03:43 → 03:43 · amplitude —

- `01:43` · Connexion Facebook web : jeton anti-CSRF « state » (faille signalée par le Gardien)  <sub>`617edc8`</sub>

### Jeudi 13 août 2026

**3 livraison(s)** · Abidjan 13:13 → 13:16 · chez le Patron 15:13 → 15:16 · amplitude 3 min

- `13:13` · App : finitions signalées par l'Atelier (barre d'état, tablette, cibles)  <sub>`418796b`</sub>
- `13:14` · Site : lisibilité des textes porteurs de sens (Atelier)  <sub>`a0681de`</sub>
- `13:16` · Annonces : plafonner le nombre de photos (durcissement, Gardien)  <sub>`c66912f`</sub>

### Mercredi 12 août 2026

**27 livraison(s)** · Abidjan 02:58 → 20:49 · chez le Patron 04:58 → 22:49 · amplitude 17 h 50

- `02:58` · Démo vidéo de l'écran de pub : rotation forcée en aperçu  <sub>`00daed5`</sub>
- `03:21` · Préparer le chantier Android : un script génère et configure android/  <sub>`c6d70c1`</sub>
- `03:46` · Ajouter iOS au script de préparation des plateformes  <sub>`6c0ed7b`</sub>
- `13:21` · Notes de version v1.20, prêtes à coller dans les stores  <sub>`6d9d27b`</sub>
- `13:52` · Corriger le nettoyage de MainActivity dans le script de préparation  <sub>`fec5789`</sub>
- `13:59` · Guide pas-à-pas pour construire l'AAB sur un Mac  <sub>`a14e10f`</sub>
- `14:05` · Guide Mac : préciser l'installation du SDK Android  <sub>`b9786a1`</sub>
- `15:44` · Journal des versions : consigner la v1.20 (code 21), la refonte Flutter  <sub>`b8f42e8`</sub>
- `16:19` · Fiche d'annonce : vendeur cliquable et vrai partage  <sub>`031a466`</sub>
- `16:26` · Explorer : le filtre Neuf/Occasion suit la catégorie  <sub>`19f2e57`</sub>
- `16:39` · Fiche d'annonce : afficher tout le détail, comme le site  <sub>`2782f8f`</sub>
- `17:10` · Connexion Google dans l'app, comme sur le site  <sub>`d3a8696`</sub>
- `17:32` · Connexion Facebook dans l'app, comme sur le site  <sub>`7ee2756`</sub>
- `18:25` · Revert "Connexion Facebook dans l'app, comme sur le site"  <sub>`02ecc78`</sub>
- `18:33` · Page vendeur complète, comme sur le site  <sub>`1aebc5e`</sub>
- `18:45` · Connexion Facebook « web », sans SDK lourd  <sub>`7a20cb6`</sub>
- `19:17` · Bouton Facebook en « bientôt » jusqu'à la vérification d'entreprise  <sub>`df43ad0`</sub>
- `19:30` · Parité stores : suppression de compte, pages légales, aide  <sub>`d97ea88`</sub>
- `19:53` · Bureaux : réalignés sur l'app Flutter (fini Capacitor)  <sub>`b96f85a`</sub>
- `20:19` · Le Serrurier : auditer aussi le code de l'app Flutter  <sub>`6a587f9`</sub>
- `20:27` · Le Juriste : Flutter + conformité App Store (pas seulement Play)  <sub>`7ff20f3`</sub>
- `20:28` · Le Juriste : cohérence App Store (intro, méthode, notification)  <sub>`ff8f565`</sub>
- `20:30` · COMMUN.md : l'app est en Flutter, sur Google Play ET App Store  <sub>`8b9bde1`</sub>
- `20:32` · Bureaux croissance/données/secrétariat/support : Android + iOS  <sub>`22c1c1a`</sub>
- `20:36` · Le Comptable : §4 C sans le concept Capacitor « app alignée sur le site »  <sub>`16f3280`</sub>
- `20:42` · Le Concierge : §6 « expérience app » réécrit pour Flutter (fini Capacitor)  <sub>`c7d4d05`</sub>
- `20:49` · Le Secrétariat : chemin critique et section app couvrent aussi l'App Store  <sub>`db6620f`</sub>

### Mardi 11 août 2026

**68 livraison(s)** · Abidjan 00:39 → 23:04 · chez le Patron 02:39 → 01:04 · amplitude 22 h 26

- `00:39` · Application Flutter : le premier socle (accueil, explorer, connexion)  <sub>`6d41a3b`</sub>
- `00:48` · App Flutter : la fiche d'une annonce  <sub>`95b820d`</sub>
- `01:00` · App Flutter : recherche et filtres dans Explorer  <sub>`fad1e4b`</sub>
- `01:08` · App Flutter : l'inscription (créer un compte)  <sub>`2438062`</sub>
- `01:14` · App Flutter : boutons Google et Facebook (moitié serveur câblée)  <sub>`d29fe8a`</sub>
- `01:22` · App Flutter : Mon compte — mes annonces et leur gestion  <sub>`7f0d48f`</sub>
- `05:18` · App Flutter : la messagerie acheteur ↔ vendeur  <sub>`813f05f`</sub>
- `05:31` · App Flutter : Publier une annonce (version 1)  <sub>`54a373c`</sub>
- `05:39` · App Flutter : la confirmation d'e-mail débloque la publication  <sub>`2de9ef2`</sub>
- `05:52` · App Flutter : Flutter installé, code vérifié — flutter analyze passe à zéro  <sub>`347ab90`</sub>
- `05:56` · App Flutter : les favoris (le petit cœur) — vérifié par flutter analyze  <sub>`a609876`</sub>
- `06:09` · App Flutter : modifier son profil (nom, bio, photo) — vérifié  <sub>`6b23897`</sub>
- `06:45` · App Flutter : outil de captures + photos de profil data-URI corrigées  <sub>`8bb8d07`</sub>
- `07:02` · App Flutter : Publier v2 — le formulaire s'adapte à la sous-catégorie  <sub>`4c385c3`</sub>
- `07:02` · App Flutter : README — Publier v2 et le moteur de formulaires au tableau  <sub>`a1843e6`</sub>
- `07:15` · App Flutter : Publier v2 — la catégorie « Électronique » au complet  <sub>`1a592ed`</sub>
- `10:08` · App Flutter : Publier v2 — la catégorie « Véhicules » au complet  <sub>`32ffcaf`</sub>
- `10:16` · App Flutter : Publier v2 — la catégorie « Maison & Meubles » au complet  <sub>`d000b05`</sub>
- `10:19` · App Flutter : outil de captures — écrans Maison (meuble, déco)  <sub>`b4a12c7`</sub>
- `11:08` · App Flutter : Publier v2 — la catégorie « Alimentation & Agriculture »  <sub>`645a27d`</sub>
- `11:10` · App Flutter : outil de captures — écrans Alimentation (vivriers, poisson)  <sub>`2c83e21`</sub>
- `11:17` · App Flutter : Publier v2 — la catégorie « Animaux »  <sub>`3ef3767`</sub>
- `11:19` · App Flutter : outil de captures — écrans Animaux (oiseaux, bétail)  <sub>`e98a231`</sub>
- `11:23` · App Flutter : Publier v2 — la catégorie « Services »  <sub>`cc75303`</sub>
- `11:25` · App Flutter : outil de captures — écrans Services (formation, BTP)  <sub>`1305f45`</sub>
- `11:30` · App Flutter : Publier v2 — la catégorie « Emploi »  <sub>`5399250`</sub>
- `11:32` · App Flutter : outil de captures — écran Emploi (offre)  <sub>`8cf6680`</sub>
- `12:04` · App Flutter : Publier v2 — la catégorie « Santé & Bien-être »  <sub>`94a2d14`</sub>
- `12:05` · App Flutter : outil de captures — écran Santé (compléments)  <sub>`923071e`</sub>
- `12:09` · App Flutter : Publier v2 — la catégorie « Bébé & Enfant »  <sub>`eb2a43e`</sub>
- `12:11` · App Flutter : outil de captures — écran Bébé (jouets)  <sub>`f6a9b15`</sub>
- `12:17` · App Flutter : Publier v2 — la catégorie « Voyage »  <sub>`5192e64`</sub>
- `12:19` · App Flutter : outil de captures — écran Voyage (visas)  <sub>`6614da0`</sub>
- `12:23` · App Flutter : Publier v2 — la catégorie « Loisirs & Sport »  <sub>`4fbd3a0`</sub>
- `12:25` · App Flutter : outil de captures — écran Loisirs (vélos)  <sub>`e214ff7`</sub>
- `12:29` · App Flutter : Publier v2 — la catégorie « Scolaire »  <sub>`a36fb00`</sub>
- `12:31` · App Flutter : outil de captures — écran Scolaire (fournitures)  <sub>`711f51c`</sub>
- `12:35` · App Flutter : Publier v2 — la catégorie « Matériel Pro »  <sub>`2d24252`</sub>
- `12:36` · App Flutter : outil de captures — écran Matériel Pro (maquis)  <sub>`25e70ec`</sub>
- `12:43` · App Flutter : Publier v2 — « À donner », et le portage des 15 catégories est complet  <sub>`ad3b4d5`</sub>
- `12:44` · App Flutter : outil de captures — écran « À donner »  <sub>`5d27d5f`</sub>
- `12:58` · App Flutter : la localisation couvre tout le pays, avec le GPS  <sub>`aa37463`</sub>
- `13:12` · App Flutter : le bloc couleurs / variantes, câblé sur Mode & Beauté  <sub>`1ba36b1`</sub>
- `13:25` · App Flutter : valeurs initiales du moteur + aperçu du bloc couleurs  <sub>`d3d7b58`</sub>
- `13:31` · App Flutter : le bloc couleurs activé sur l’Électronique  <sub>`b8c117c`</sub>
- `13:35` · App Flutter : aperçu des variantes d’un téléphone (outil de captures)  <sub>`dadeccd`</sub>
- `14:40` · App Flutter : les couleurs sur la Maison + la palette du métier partout  <sub>`da3fbd6`</sub>
- `14:44` · App Flutter : aperçu des essences de bois (outil de captures)  <sub>`3912990`</sub>
- `15:02` · App Flutter : les couleurs sur Bébé & Enfant, avec sa palette pastel  <sub>`64a4814`</sub>
- `15:14` · App Flutter : le bloc couleurs sur les 11 dernières catégories — chantier bouclé  <sub>`c3962c3`</sub>
- `15:29` · App Flutter : la cloche de notifications (in-app)  <sub>`68bf028`</sub>
- `18:54` · App Flutter : le push natif (FCM) — moitié app câblée + guide d'activation  <sub>`295abc6`</sub>
- `19:17` · App Flutter : la double authentification (2FA), connexion et gestion  <sub>`d31b083`</sub>
- `19:34` · App Flutter : le tableau de bord (réservé au Patron)  <sub>`48a24a2`</sub>
- `19:42` · App Flutter : la modération dans le tableau de bord  <sub>`deddc22`</sub>
- `19:52` · App Flutter : la section Utilisateurs du tableau de bord  <sub>`aba4364`</sub>
- `20:31` · App Flutter : la section Annonces de l'admin  <sub>`d49829d`</sub>
- `20:41` · App Flutter : les sauvegardes dans le tableau de bord  <sub>`d2f85f2`</sub>
- `20:49` · App Flutter : la carte Sécurité de l'aperçu (propriétaire)  <sub>`2e499a2`</sub>
- `21:04` · La liste des abonnés newsletter, avec export CSV, dans l'app  <sub>`264be3f`</sub>
- `21:31` · Régler l'envoi des e-mails du site depuis l'app, avec test  <sub>`fcf9c10`</sub>
- `21:50` · Écrire une campagne et l'envoyer à tous les abonnés, par lots  <sub>`b62d331`</sub>
- `22:03` · Confier le tableau de bord : gérer les modérateurs depuis l'app  <sub>`c9d8482`</sub>
- `22:13` · Lire et répondre aux messages de contact depuis l'app  <sub>`96ae30d`</sub>
- `22:22` · Modérer les avis des vendeurs depuis l'app  <sub>`e895039`</sub>
- `22:30` · Suivre les ventes : les commandes dans l'app  <sub>`66707b8`</sub>
- `22:43` · Superviser les conversations : le dernier écran du tableau de bord  <sub>`4bf5f93`</sub>
- `23:04` · L'écran publicitaire animé sur l'accueil de l'app  <sub>`68b4049`</sub>

### Lundi 10 août 2026

**4 livraison(s)** · Abidjan 01:52 → 22:58 · chez le Patron 03:52 → 00:58 · amplitude 21 h 06

- `01:52` · « Pages vues » et « Visiteurs uniques » : le vrai public, pas l'équipe  <sub>`ba63c57`</sub>
- `01:54` · Journal : « Pages vues » ne compte plus que le public  <sub>`1a4429f`</sub>
- `01:56` · Routine build : retirer le hash d'exemple qui se fait suivre au lieu d'alerter  <sub>`fea69d9`</sub>
- `22:58` · Journal des versions : v1.18 en test fermé, confirmée par la Play Console  <sub>`899ccc7`</sub>

### Dimanche 9 août 2026

**5 livraison(s)** · Abidjan 18:17 → 20:12 · chez le Patron 20:17 → 22:12 · amplitude 1 h 55

- `18:17` · Ajouter le modèle « Titre et description à reprendre »  <sub>`9cfbe7d`</sub>
- `18:18` · Journal : modèle titre à reprendre (rentrée)  <sub>`55b20e6`</sub>
- `19:27` · Savoir d’où viennent les visiteurs, et un vrai consentement cookies  <sub>`7bf7b58`</sub>
- `20:10` · Les visites et les inscrits : de vrais chiffres, pas ceux de l'équipe  <sub>`8e7938a`</sub>
- `20:12` · Journal : le correctif des vrais chiffres de fréquentation  <sub>`867f3df`</sub>

### Samedi 8 août 2026

**3 livraison(s)** · Abidjan 12:32 → 21:16 · chez le Patron 14:32 → 23:16 · amplitude 8 h 44

- `12:32` · Ranger la fête de l’Indépendance, et la bande blanche qu’elle laissait  <sub>`78fa1de`</sub>
- `16:01` · Faire en sorte que la file de modération se souvienne de ce qu’elle a déjà vu  <sub>`39e81cb`</sub>
- `21:16` · Refuser une dispense d’analyse qui ne couvre pas ce qu’elle dispense  <sub>`37171aa`</sub>

### Vendredi 7 août 2026

**8 livraison(s)** · Abidjan 02:08 → 19:59 · chez le Patron 04:08 → 21:59 · amplitude 17 h 51

- `02:08` · Journal des versions : le commit de la v1.19  <sub>`47849c1`</sub>
- `02:08` · Application v1.19 (code 20) — API 36, l’échéance du 31 août est tenue  <sub>`5ae60ed`</sub>
- `02:31` · Journal : la v1.18 est publiée, et la validation développeur était déjà réglée  <sub>`b840f5a`</sub>
- `02:46` · Le Gardien ne redemandera plus trois fois la même chose  <sub>`30e1209`</sub>
- `13:19` · Le bandeau de la fête ne passe plus sous la barre d’état  <sub>`8617aa4`</sub>
- `13:51` · Qui est en ligne, vu quand — et pouvoir lui écrire sans passer par une annonce  <sub>`7f99b94`</sub>
- `18:18` · Prévenir les gens même quand Chap.ci est fermé  <sub>`094dd4d`</sub>
- `19:59` · Corriger le « Vérification… » sans fin de l'écran des notifications  <sub>`105f169`</sub>

### Jeudi 6 août 2026

**10 livraison(s)** · Abidjan 05:12 → 18:59 · chez le Patron 07:12 → 20:59 · amplitude 13 h 46

- `05:12` · La barre de recherche perd ses contours, et son gris devient lisible  <sub>`3e6e12b`</sub>
- `05:26` · Foncier : le numéro des documents et l’IDUFCI deviennent facultatifs  <sub>`946a196`</sub>
- `05:37` · Deux rubriques neuves : « Voyage » et « À donner »  <sub>`00f105b`</sub>
- `05:48` · Application v1.18 (versionCode 19) — l’AAB de toutes les mises à jour  <sub>`f1b59c2`</sub>
- `05:48` · Journal des versions : le commit de la v1.18  <sub>`419218c`</sub>
- `06:11` · Une messagerie d’équipe, et la publicité mène désormais à son annonceur  <sub>`f448487`</sub>
- `06:21` · Les écrans de modération : contrôle complet, et la décision en un geste  <sub>`8b78f78`</sub>
- `06:36` · Inviter les testeurs du Play Store depuis le tableau de bord  <sub>`0e8836f`</sub>
- `18:34` · Assistance : l’e-mail d’un membre ne sort plus sans la case « Utilisateurs »  <sub>`bb1ee81`</sub>
- `18:59` · Une rubrique « École & Fournitures », cinq semaines avant la rentrée  <sub>`2b68503`</sub>

### Mercredi 5 août 2026

**8 livraison(s)** · Abidjan 05:17 → 16:55 · chez le Patron 07:17 → 18:55 · amplitude 11 h 38

- `05:17` · Journal : six jours et 43 commits qui manquaient  <sub>`21b18de`</sub>
- `05:40` · Visiteurs : la courbe montre enfin les inscriptions, jour par jour, avec la tendance  <sub>`87b1be2`</sub>
- `06:04` · La courbe était minuscule : elle ne remplissait jamais sa carte  <sub>`678923f`</sub>
- `06:26` · Les mots du bandeau visaient tout le monde ; ils visent trois personnes  <sub>`eb7d2ae`</sub>
- `12:08` · topPages comptait des vues ; une vue ne décide de rien  <sub>`cff0a95`</sub>
- `15:58` · Le Gardien a deviné la fenêtre du diff, et inventé une date  <sub>`29d4d5c`</sub>
- `16:37` · Les feux d'artifice ne se déclenchaient jamais le soir  <sub>`cee61e1`</sub>
- `16:55` · Le 7 août : un décompte en J-… , des mots pour la journée, et douze messages  <sub>`2cd642d`</sub>

### Mardi 4 août 2026

**6 livraison(s)** · Abidjan 02:43 → 22:52 · chez le Patron 04:43 → 00:52 · amplitude 20 h 10

- `02:43` · Deux fichiers de contexte, et onze routines qui cessent de mentir sur les chiffres  <sub>`e400155`</sub>
- `02:50` · Le README décrivait un site qui n'existe plus depuis juillet  <sub>`9b1946c`</sub>
- `02:59` · Trois skills reprises de mattpocock/skills, sur les 41 du dépôt  <sub>`3ed67ba`</sub>
- `09:58` · Six textes lisibles en plein soleil, et un montant qui ne se coupe plus en deux  <sub>`87fe6bb`</sub>
- `10:06` · AdTextControls : les trois derniers orange en dur passent par le jeton  <sub>`57f2bf2`</sub>
- `22:52` · Le Gardien déclarait vert un déploiement manquant : dist/ n'existe pas chez lui  <sub>`9135ef2`</sub>

### Lundi 3 août 2026

**9 livraison(s)** · Abidjan 04:50 → 20:11 · chez le Patron 06:50 → 22:11 · amplitude 15 h 21

- `04:50` · Sécurité : donner au Gardien la moitié du tableau qui lui manquait  <sub>`7c80c25`</sub>
- `05:07` · Journal des versions : sept commits manquants, et l'exemple figé qui a induit  <sub>`7811da1`</sub>
- `06:07` · Santé : trois empreintes, parce qu'une seule mentait  <sub>`eb6fdb8`</sub>
- `07:22` · Journal des versions : « État Play » n'est pas une observation  <sub>`8d42f55`</sub>
- `08:04` · Vignettes : ne plus différer celles qu'on voit déjà  <sub>`99e9792`</sub>
- `08:19` · Bureaux : six routines raisonnaient sur une app vieille de quinze builds  <sub>`5d9b169`</sub>
- `08:34` · État Play : la réponse, enfin — et elle est pire que ce qu'on croyait  <sub>`d39cddd`</sub>
- `10:24` · Publier : ne plus perdre une saisie, et dire ce qui est obligatoire  <sub>`d034aa7`</sub>
- `20:11` · Réglages SMTP : des données, plus un fichier PHP généré dans le dossier web  <sub>`16df821`</sub>

### Dimanche 2 août 2026

**15 livraison(s)** · Abidjan 03:42 → 23:19 · chez le Patron 05:42 → 01:19 · amplitude 19 h 37

- `03:42` · v1.11 : Android ajoutait « GPS obligatoire » tout seul, 7 appareils exclus  <sub>`a753aad`</sub>
- `03:55` · Demarrage : 221 -> 133 Ko compresses, les 82 formulaires ne partent plus avec  <sub>`9ac4d76`</sub>
- `04:06` · Les annonces d'avant les formulaires avaient perdu tous leurs details  <sub>`6d6835c`</sub>
- `04:20` · R8 active (-83 % de code), et l'ecran de demarrage s'anime aussi dans l'app  <sub>`0911311`</sub>
- `04:36` · Page blanche sur un lien d'annonce ouvert a froid — erreur React #310  <sub>`ccb4191`</sub>
- `05:23` · Comptabilité : un grand livre complet, réservé au propriétaire  <sub>`b7709d1`</sub>
- `05:36` · Journal des versions : la v1.16 est téléversée, pas envoyée  <sub>`06bad6c`</sub>
- `10:27` · Photos obligatoires : effacer les annonces qui n'en ont aucune  <sub>`b93aa7a`</sub>
- `20:06` · Cron : dire POURQUOI la clé est refusée, des deux côtés  <sub>`8432b01`</sub>
- `21:56` · PHP 8.5 en production : classer le chantier, corriger deux notes fausses  <sub>`8a8cb81`</sub>
- `22:26` · Audit PHP 8.5 : deux obsolescences réelles, et dix-sept colonnes fantômes  <sub>`4781b96`</sub>
- `22:56` · cron_fail : dire d'où vient l'appel, pour ne plus accuser à tort  <sub>`6c4d011`</sub>
- `23:02` · cron_fail : « externe » mentait derrière Cloudflare — retiré  <sub>`7740b31`</sub>
- `23:15` · Vitesse : rendre à l'utilisateur la seconde que je lui prenais  <sub>`0d3e3ce`</sub>
- `23:19` · v1.17 : l'application s'ouvre une seconde plus tôt  <sub>`057db9d`</sub>

### Samedi 1 août 2026

**11 livraison(s)** · Abidjan 18:42 → 22:20 · chez le Patron 20:42 → 00:20 · amplitude 3 h 38

- `18:42` · Securite: ferme le 2e sink JSON-LD et allege le declencheur CI  <sub>`fdd3251`</sub>
- `19:32` · Formulaires d'annonce : les schemas des quinze categories  <sub>`15a0fe1`</sub>
- `20:09` · Corrections des bureaux : contraste, CSP, IA photo dans la confidentialite  <sub>`96077ed`</sub>
- `20:32` · Les 82 formulaires entrent dans l'application, et 15 categories deviennent 13  <sub>`54f3a9e`</sub>
- `20:36` · v1.9 : version 10 construite et signee, journal des versions a jour  <sub>`7a575f2`</sub>
- `20:58` · Sitemap : retire les 46 URL des deux categories fusionnees, et fiche v1.9  <sub>`691a375`</sub>
- `21:34` · v1.9 DEPLOYEE en test ferme — la premiere a atteindre des testeurs  <sub>`ff56661`</sub>
- `21:58` · Confidentialite : nommer les quatre services qui recoivent une position  <sub>`f973616`</sub>
- `22:10` · Trois blocages trouves AVANT les testeurs, dont un qui aurait fige le compteur  <sub>`08643ee`</sub>
- `22:19` · Trois photos au minimum pour publier — dans l'ecran ET dans la route  <sub>`e1a07b7`</sub>
- `22:20` · APP-VERSIONS : commit de la v1.10 et correction du numero remplace  <sub>`7594b48`</sub>

### Jeudi 30 juillet 2026

**3 livraison(s)** · Abidjan 02:52 → 17:18 · chez le Patron 04:52 → 19:18 · amplitude 14 h 26

- `02:52` · couleurs: une annonce, plusieurs couleurs — chacune avec sa photo, son prix, ses details  <sub>`d75467e`</sub>
- `16:43` · Corrige une XSS stockée dans le JSON-LD SEO  <sub>`efb4760`</sub>
- `17:18` · Ajoute le bureau Sécurité du code (Le Serrurier)  <sub>`500ea70`</sub>

### Mercredi 29 juillet 2026

**14 livraison(s)** · Abidjan 03:44 → 20:50 · chez le Patron 05:44 → 22:50 · amplitude 17 h 06

- `03:44` · securite: un compteur cumule servi sans fenetre a trompe un deuxieme bureau  <sub>`683213a`</sub>
- `13:43` · design: sept correctifs de l'Atelier — cibles tactiles et contraste  <sub>`c1f21ea`</sub>
- `13:48` · journal: le Gardien a raison sur l'ecart, mais l'ecart le plus couteux etait ailleurs  <sub>`932b6a1`</sub>
- `13:55` · app: passer d'un onglet a l'autre d'un glissement du pouce  <sub>`928585a`</sub>
- `14:03` · store: v1.5 — versionCode 6, pour le canal de test ferme  <sub>`cc808cf`</sub>
- `14:29` · comptes: verification par code e-mail avant publication, et badges a deux couleurs  <sub>`aa023ef`</sub>
- `15:11` · foncier: recherche sur les documents de vente de terrain en Cote d'Ivoire, et maquette du formulaire enrichi  <sub>`441f865`</sub>
- `15:57` · foncier: cocher plusieurs documents, IDUFCI obligatoire, engagements bloquants, guide deplie sous l'annonce  <sub>`ba10cec`</sub>
- `16:48` · foncier: le dossier devient obligatoire pour vendre, et les anciennes annonces sont rappelees  <sub>`58daa97`</sub>
- `17:06` · foncier: la campagne n'ecrase plus un retrait de moderation  <sub>`1cae6d6`</sub>
- `17:15` · sante: /api/health porte l'empreinte du index.php reellement servi  <sub>`b13e3e9`</sub>
- `17:24` · publier: l'exemple de titre suit la categorie, et la sous-categorie decide du type d'offre  <sub>`5b9df6f`</sub>
- `17:27` · store: v1.6 (versionCode 7) — l'application rattrape la regle du serveur  <sub>`89628cc`</sub>
- `20:50` · telephones: le formulaire suit la sous-categorie, et pose la question qui evite l'arnaque n1  <sub>`6badb5d`</sub>

### Mardi 28 juillet 2026

**17 livraison(s)** · Abidjan 07:52 → 18:05 · chez le Patron 09:52 → 20:05 · amplitude 10 h 13

- `07:52` · csp: GA4 et le bouton Google manquaient a la politique  <sub>`25d4a35`</sub>
- `09:02` · web: pied de page reduit a un lien sur telephone et tablette  <sub>`8c599d1`</sub>
- `09:08` · docs: la procedure de mise en ligne, ecrite une fois pour toutes  <sub>`08dd4c6`</sub>
- `10:47` · web: le pied de page court est reserve a l'application native  <sub>`2b44c1f`</sub>
- `11:26` · pub: le visuel d'un annonceur n'est plus ampute sur les grands ecrans  <sub>`e2f693a`</sub>
- `12:24` · pub: le cycle de vie complet d'une publicite, du paiement au bilan  <sub>`3f74e8e`</sub>
- `12:35` · admin: les recettes du site, et ce qu'on peut honnetement en dire  <sub>`de97d30`</sub>
- `12:51` · app: la grande photo d'une annonce ne s'affichait pas, et on peut la balayer  <sub>`f5e15a7`</sub>
- `13:03` · store: v1.3 — versionCode 4, AAB construit et signe  <sub>`5a81f78`</sub>
- `13:25` · bureaux: trois corrections apres la ronde du Crieur, et la capture explorer  <sub>`bdada82`</sub>
- `14:23` · seo: la page d'accueil ne disait rien aux robots — 114 caracteres  <sub>`8bad02f`</sub>
- `14:38` · seo: ce qu'il faut pour qu'une IA sache DIRE ce qu'est Chap.ci  <sub>`caf7a9d`</sub>
- `14:46` · reseaux: Facebook et TikTok, visibles par les visiteurs ET par les moteurs  <sub>`366d854`</sub>
- `14:57` · marques: les vrais logos, la ou il y avait des emojis et un dessin invente  <sub>`5878041`</sub>
- `15:33` · store: v1.4 — versionCode 5, construite pour le test ferme  <sub>`cb9b5b9`</sub>
- `15:40` · journal: le canal de test ferme existe — le compteur des 14 jours peut demarrer  <sub>`f7db1ec`</sub>
- `18:05` · correction: publier EXIGE un compte — j'avais ecrit le contraire  <sub>`9a65ff5`</sub>

### Lundi 27 juillet 2026

**35 livraison(s)** · Abidjan 04:13 → 23:04 · chez le Patron 06:13 → 01:04 · amplitude 18 h 51

- `04:13` · Suppression de compte : decrire aussi la suppression partielle  <sub>`f4ed545`</sub>
- `05:35` · Fiche Play Store : textes honnetes et captures regenerees  <sub>`b79ac5b`</sub>
- `05:51` · Icone Play Store : carre plein au lieu d'un arrondi deja applique  <sub>`fd721dd`</sub>
- `06:24` · journal: ronde Comptable, point zero de la serie et deduction sur /publier  <sub>`34af3a3`</sub>
- `06:40` · htaccess complet + tableau de bord admin en chargement differe  <sub>`ce82a62`</sub>
- `07:06` · journal: ronde Mecanicien — deux P1 appliques et verifies en production  <sub>`b317853`</sub>
- `07:09` · Taches auto : ne plus accuser une tache dont l'heure n'est pas venue  <sub>`68ce7a8`</sub>
- `07:14` · journal: ronde mensuelle du Juriste  <sub>`06acf14`</sub>
- `07:14` · Confidentialite : durees de conservation reelles au lieu d'un chiffre invente  <sub>`41b9e60`</sub>
- `07:18` · bureaux: consigner l'arbitrage sur le bandeau de consentement  <sub>`bc353bc`</sub>
- `08:57` · App : photos des annonces reparees, contour de recherche, categorie Sante  <sub>`3721813`</sub>
- `09:15` · Centres d'interet : jamais enregistres depuis le passage aux cookies  <sub>`c2585ac`</sub>
- `10:05` · bureaux: creer le 9e bureau — Livraison de l'application  <sub>`a31dec3`</sub>
- `11:02` · bureaux: le Monteur couvre Play ET App Store (telephone, tablette, iPad)  <sub>`ca8e3d5`</sub>
- `11:33` · bureaux: le Monteur est une routine « avec code », pas une routine de chat  <sub>`914ae7e`</sub>
- `11:35` · bureaux: retirer les chevrons de la commande git log du Monteur  <sub>`7d47355`</sub>
- `14:27` · web: les URL sans diese ne renvoient plus 404 (bloquant pour Play)  <sub>`9a70f48`</sub>
- `14:36` · app: masquer Google et Facebook dans l'application native  <sub>`3c1b7ce`</sub>
- `14:46` · store: fiche de build v1.2 (versionCode 3), prete a executer  <sub>`015aefc`</sub>
- `14:54` · site: ne plus promettre « des milliers » + 12 captures regenerees  <sub>`796d65d`</sub>
- `15:00` · store: la v1.1 n'a jamais ete deployee (release restee en brouillon)  <sub>`a993629`</sub>
- `15:09` · store: v1.2 construite (versionCode 3, 6,5 Mo, commit a993629)  <sub>`09b2d83`</sub>
- `16:14` · securite: exposer QUELLE route echoue dans cron_fail et mtoken_fail  <sub>`02edf6d`</sub>
- `16:33` · bureaux: le Gardien n'envoie plus six digests par jour pour une file vide  <sub>`ea8604b`</sub>
- `16:46` · bureaux: mise a jour des faits dans les neuf prompts (27/07)  <sub>`86570b7`</sub>
- `16:47` · bureaux: le Gardien verifie qu'aucun fichier .sql/.md/.txt n'est servi depuis /api/  <sub>`78eb5b6`</sub>
- `20:02` · bureaux: sept correctifs issus des rondes du 27/07 au soir  <sub>`c99518f`</sub>
- `20:03` · journal: ronde des neuf bureaux du 27/07 au soir  <sub>`54c425d`</sub>
- `20:27` · journal: synthese du Secretariat, avec trois corrections de fait  <sub>`f7185a4`</sub>
- `20:40` · securite: CSP en mode rapport, sur signalement d'un audit externe  <sub>`6a2d17c`</sub>
- `21:44` · securite: la connexion plantait sur les comptes Google/Facebook  <sub>`c2a847d`</sub>
- `22:45` · config: plus d'email administrateur par defaut dans un depot public  <sub>`7a66325`</sub>
- `22:51` · securite: faire remonter les violations CSP au lieu de deviner  <sub>`bb85afa`</sub>
- `22:59` · csp: autoriser le domaine reel du pixel TikTok, decouvert par les rapports  <sub>`11f14fa`</sub>
- `23:04` · web: /index.php a la racine renvoyait un 500 muet  <sub>`6bcc9a2`</sub>

### Dimanche 26 juillet 2026

**20 livraison(s)** · Abidjan 03:37 → 22:36 · chez le Patron 05:37 → 00:36 · amplitude 19 h 00

- `03:37` · Cron : clé sûre par construction + commandes prêtes à coller  <sub>`00d4c1d`</sub>
- `19:09` · Cron : toutes les routes acceptent l'en-tête X-Cron-Key  <sub>`143ab44`</sub>
- `19:41` · Journal des bureaux : consignation des rondes du 21 au 26 juillet  <sub>`cef7b7d`</sub>
- `20:02` · docs(bureaux): reecrire les 8 prompts de routine avec la methode a jour  <sub>`bfca258`</sub>
- `20:20` · bureaux: ronde du Gardien + 4 correctifs au prompt securite  <sub>`3671f37`</sub>
- `20:26` · bureaux: regle anti-chevrons + hygiene de cle dans les 6 prompts a secret  <sub>`3d91f54`</sub>
- `20:30` · bureaux: synchroniser routine-design avec la version en production  <sub>`4639aeb`</sub>
- `20:39` · bureaux: orienter le Concierge sur la marche compte cree -> annonce publiee  <sub>`75870af`</sub>
- `20:43` · bureaux: interdire au Comptable de fabriquer une tendance qu'il n'a pas mesuree  <sub>`f2cc25c`</sub>
- `20:48` · bureaux: corriger le chemin des sauvegardes et enrichir le prompt Mecanicien  <sub>`ea74354`</sub>
- `20:53` · bureaux: Juriste — distinction loi/plateforme, references verifiees, P1 suppression  <sub>`1de988b`</sub>
- `20:58` · journal: 2e ronde du Gardien, correction des prompts validee en production  <sub>`576f4e0`</sub>
- `21:06` · journal: ronde Crieur — /publier mesure, mais pas encore interpretable  <sub>`08058b9`</sub>
- `21:30` · Page publique de suppression de compte + suivi connecte/visiteur  <sub>`7262483`</sub>
- `21:42` · Design : 7 correctifs du 3e scan de l'Atelier  <sub>`19b3ddb`</sub>
- `21:43` · journal: 3e scan de l'Atelier, 7 correctifs appliques et verifies  <sub>`200e4b6`</sub>
- `21:52` · Tableau de bord : etat reel de chaque tache automatique  <sub>`008781c`</sub>
- `22:25` · Securite : le telephone du vendeur ne sort plus de l'API publique  <sub>`07fb425`</sub>
- `22:26` · journal: ronde Concierge — fuite du telephone vendeur trouvee et corrigee  <sub>`d5f080a`</sub>
- `22:36` · Publier : libelles lies, defilement vers le champ fautif, reassurance telephone  <sub>`42a1200`</sub>

### Samedi 25 juillet 2026

**3 livraison(s)** · Abidjan 15:58 → 20:40 · chez le Patron 17:58 → 22:40 · amplitude 4 h 42

- `15:58` · Avis (Le Gardien) : portée stricte — la vente confirmée doit concerner l'annonce évaluée  <sub>`975055a`</sub>
- `16:05` · Design (L'Atelier, scan 25/07) : contrastes, cibles 44px, tokens de bordure  <sub>`57aa685`</sub>
- `20:40` · Android : allège l'app de 28 Mo (assets web jamais utilisés en natif)  <sub>`b7868ec`</sub>

### Vendredi 24 juillet 2026

**2 livraison(s)** · Abidjan 09:01 → 17:00 · chez le Patron 11:01 → 19:00 · amplitude 7 h 59

- `09:01` · Sécurité (Le Gardien) : POST /orders relit le prix depuis l'annonce  <sub>`3fa0027`</sub>
- `17:00` · Sécurité (Le Gardien) : clé cron en en-tête X-Cron-Key + conversationId validé  <sub>`a889e35`</sub>

### Jeudi 23 juillet 2026

**5 livraison(s)** · Abidjan 14:12 → 18:12 · chez le Patron 16:12 → 20:12 · amplitude 4 h 00

- `14:12` · Marketing : pixels Meta, TikTok et Google (GA4) + conversions  <sub>`ff7818a`</sub>
- `14:22` · Sécurité (Le Gardien) : corrige un commentaire obsolète sur le jeton de service  <sub>`f7b5f23`</sub>
- `14:25` · SEO (Le Crieur) : ajoute Bingerville aux communes des pages /vendre  <sub>`2088edb`</sub>
- `17:58` · Confidentialité : section cookies/pixels · Publier : pré-remplit le nom (conversion)  <sub>`1df95d4`</sub>
- `18:12` · Publier : auto-remplissage intelligent (titre→catégorie + photo→description IA)  <sub>`cd41b75`</sub>

### Mercredi 22 juillet 2026

**2 livraison(s)** · Abidjan 17:27 → 21:39 · chez le Patron 19:27 → 23:39 · amplitude 4 h 12

- `17:27` · Accueil : masquer la section « Vendez près de chez vous »  <sub>`657be87`</sub>
- `21:39` · Design (L'Atelier) : 9 correctifs accessibilité, typo & palette  <sub>`867a23e`</sub>

### Mardi 21 juillet 2026

**28 livraison(s)** · Abidjan 02:49 → 22:29 · chez le Patron 04:49 → 00:29 · amplitude 19 h 40

- `02:49` · Bannière pub pleine largeur (sans blancs) + Mobile Money Orange/Wave  <sub>`55b9e52`</sub>
- `03:08` · Écran pub façon panneau LED géant + image nette avec texte coloré  <sub>`f040dcc`</sub>
- `03:21` · Écran pub : retirer l'effet écran LED, garder une bannière simple  <sub>`0d1255f`</sub>
- `03:46` · Publicités : paiement Orange/Wave, vérif admin/modo, notifications e-mail  <sub>`c2bcd68`</sub>
- `04:05` · Paiement : logos Orange Money et Wave (SVG) au lieu des pastilles  <sub>`d9ee316`</sub>
- `04:14` · Page publique pub : mêmes options que l'admin (style, animations, couleur)  <sub>`dd16038`</sub>
- `04:19` · Page pub : afficher les tailles d'image supportées + rappel image/texte  <sub>`f25031d`</sub>
- `09:20` · Badge bleu de vérification (membres fidèles et actifs)  <sub>`778274b`</sub>
- `13:45` · Modération auto : jeton de service cloisonné (Le Gardien)  <sub>`35c32b3`</sub>
- `14:21` · Modération auto : durcissement suite à la revue de sécurité  <sub>`f160ffe`</sub>
- `14:50` · Admin/Tâches auto : encoder la clé cron dans les URLs à copier  <sub>`fbf75a4`</sub>
- `15:01` · Design P1 : anti-zoom iOS + cibles tactiles 44px  <sub>`cd726bb`</sub>
- `15:10` · Design P2 : badge Vérifié sur la carte + nav mobile + tokens/lisibilité  <sub>`4788937`</sub>
- `16:57` · Publication : plus de pop-ups newsletter/géoloc sur /publier  <sub>`81f1de8`</sub>
- `17:07` · Activation : bandeau « Publiez votre 1ʳᵉ annonce gratuitement »  <sub>`a068afe`</sub>
- `17:20` · Design #3 : un seul vert de marque (ivoire-green)  <sub>`45e8cc7`</sub>
- `17:23` · Activation #2 : relance e-mail des inscrits sans annonce  <sub>`d81ac19`</sub>
- `18:10` · Publication réservée aux comptes connectés  <sub>`e0db546`</sub>
- `18:26` · Activation : états vides « Soyez le premier à vendre »  <sub>`9bf96dd`</sub>
- `18:27` · Retirer preview-empty.png (aperçu commité par erreur)  <sub>`ecf7620`</sub>
- `18:43` · Activation : écran de bienvenue après l'inscription  <sub>`af6e2b5`</sub>
- `18:53` · SEO : pages d'atterrissage « Vendez votre {catégorie} à {ville} »  <sub>`78a4779`</sub>
- `19:03` · Connexion/Inscription : lien retour à l'accueil  <sub>`ccdcfe2`</sub>
- `21:04` · SEO : bannières d'aperçu social par catégorie sur les pages /vendre  <sub>`49d3d98`</sub>
- `21:39` · Accueil : section « Vendez près de chez vous » (maillage interne SEO)  <sub>`c298ea5`</sub>
- `21:59` · App native : couche coquille Android (bouton retour, barre de statut, splash)  <sub>`c676cdd`</sub>
- `22:13` · Play Store : guide de publication (compte perso) + assets fiche  <sub>`5d22ced`</sub>
- `22:29` · PWA : bannière « Installer l'application » sur l'accueil  <sub>`fdb629a`</sub>

### Lundi 20 juillet 2026

**30 livraison(s)** · Abidjan 00:14 → 20:12 · chez le Patron 02:14 → 22:12 · amplitude 19 h 58

- `00:14` · Messagerie : discussion pleine largeur façon artifact (ordi/tablette/mobile)  <sub>`51bf001`</sub>
- `02:07` · Notifications : passer la page en pleine largeur (comme l'artifact)  <sub>`ff90530`</sub>
- `02:19` · Connexion : carte centrée sur fond crème (comme l'artifact)  <sub>`675fddb`</sub>
- `03:10` · Inscription : carte épurée (artifact) + confirmation + captcha  <sub>`2c02b37`</sub>
- `03:26` · À propos : version épurée fidèle à l'artifact  <sub>`c533cc3`</sub>
- `03:36` · FAQ : héro et cartes au style de l'artifact (4 formats)  <sub>`5ce8ed8`</sub>
- `13:29` · Contact : mise en page pleine largeur fidèle à l'artifact  <sub>`0ae1720`</sub>
- `13:40` · Contact : envoi réel du formulaire vers contact@chap.ci  <sub>`c9cabf9`</sub>
- `14:06` · Admin : écran « Messages de contact » (consultation + traitement)  <sub>`8335f16`</sub>
- `14:35` · Admin Contact : messages ouvrables + réponse directe via contact@chap.ci + IA  <sub>`03994d1`</sub>
- `14:44` · Admin Contact : IA du site autonome (sans clé) + adaptation tous écrans  <sub>`a543d52`</sub>
- `14:59` · Confidentialité : mise en page « legal » de l'artifact (4 formats)  <sub>`4e2e4ff`</sub>
- `15:03` · Renommer la page Confidentialité en « RGPD »  <sub>`7e97707`</sub>
- `15:14` · Don : page au gabarit de l'artifact (4 formats) + séparateur de milliers  <sub>`e4ecd90`</sub>
- `15:22` · Serrure admin : écran de déverrouillage fidèle à l'artifact (4 formats)  <sub>`8adff35`</sub>
- `15:29` · Serrure admin : masquer la note « Envoyé à votre email + contact@chap.ci »  <sub>`8b2894e`</sub>
- `15:40` · Admin · Aperçu : tableau de bord fidèle à l'artifact (4 formats)  <sub>`10550fb`</sub>
- `15:48` · Aperçu admin : carte « Vues de pages » avec graphique intelligent  <sub>`a783736`</sub>
- `17:16` · Admin · Modérateurs : onglet fidèle à l'artifact (4 formats)  <sub>`b3246aa`</sub>
- `17:26` · Vue modérateur : aperçu limité fidèle à l'artifact (4 formats)  <sub>`3bb5323`</sub>
- `17:35` · Footer : liens renommés selon leur contenu réel + liens profonds  <sub>`f8f76a0`</sub>
- `17:45` · CGU au gabarit légal de l'artifact + fin des doublons du pied de page  <sub>`3b7499b`</sub>
- `18:14` · Écran publicitaire : bannière noire rotative + page « Faire de la publicité »  <sub>`f5152bb`</sub>
- `18:27` · Bureau de Croissance SEO : diffusion animée automatique 1×/jour + Remotion  <sub>`31e8290`</sub>
- `18:48` · Écran publicitaire : toute image s'adapte (entière + fond flou)  <sub>`dc2d2c7`</sub>
- `19:05` · Pubs image seule (titre facultatif) + affichage net des visuels  <sub>`8f9b21a`</sub>
- `19:07` · Ignorer les archives .zip de déploiement (artefacts générés)  <sub>`80e3740`</sub>
- `19:34` · Écran pub : conversion auto des visuels selon leur format  <sub>`ee3c403`</sub>
- `19:50` · Écran pub : retirer le badge « Chap.ci annonce » + option boucle d'animation  <sub>`68de230`</sub>
- `20:12` · Écran pub : 50 animations, sélection multiple + pause réglable, rotation 45 s  <sub>`7d23d74`</sub>

### Dimanche 19 juillet 2026

**46 livraison(s)** · Abidjan 03:30 → 22:17 · chez le Patron 05:30 → 00:17 · amplitude 18 h 47

- `03:30` · Sécurité (scan bureau) : avis seulement après vente confirmée + en-têtes racine  <sub>`5126710`</sub>
- `03:53` · Journal bureaux : rapport du Développement au bureau Sécurité (2 findings réglés)  <sub>`819e357`</sub>
- `06:07` · Admin: onglet « Tâches auto » (clé cron + URLs prêtes à copier)  <sub>`467e6e0`</sub>
- `06:33` · 2FA admin : double authentification TOTP (Google Authenticator / Authy)  <sub>`90e9b45`</sub>
- `06:58` · Serrure du tableau de bord admin : code d'accès stocké sur le serveur  <sub>`26f1eb3`</sub>
- `07:20` · Rôles & permissions des modérateurs (créés par l'admin)  <sub>`35ad5ae`</sub>
- `08:43` · Sécurité : alerte d'intégrité de la table admins (ligne injectée)  <sub>`f1e0352`</sub>
- `08:53` · Sécurité : alertes email du scan (seuils connexions/déverrouillages/2FA/IP)  <sub>`a76a3eb`</sub>
- `09:24` · Sécurité : code d'accès + alertes envoyés aussi à contact@chap.ci  <sub>`9a256b2`</sub>
- `09:44` · Accès admin : code propriétaire à usage unique expirant + blocage modérateur  <sub>`d93c7a9`</sub>
- `11:03` · Sécurité : fail-closed sur route admin inconnue + rate-limit cron (scan Gardien)  <sub>`fa3a374`</sub>
- `11:05` · Bureaux : routine Design (scan tous les 3 jours, lecture seule) + charte  <sub>`464ce76`</sub>
- `11:30` · Réorganisation des bureaux + skills + SEO structuré  <sub>`9a27d83`</sub>
- `11:40` · SEO : indexation instantanée IndexNow + fichier de vérification  <sub>`8a28965`</sub>
- `12:47` · Bureaux : ajout du prompt de routine Données (rapport + sourcing fusionnés)  <sub>`d145da9`</sub>
- `12:51` · Bureaux : ajout du prompt de routine Juridique (mensuel)  <sub>`6c630a8`</sub>
- `13:04` · Bureau Secrétariat : synthèse hebdo e-mailée au Patron + contact@chap.ci  <sub>`d39ac48`</sub>
- `14:28` · Bureaux : guide des routines « avec code » (Claude Code sur le web)  <sub>`df73ce2`</sub>
- `15:26` · Juridique (propositions validées) : modération cosmétiques + précisions CGU  <sub>`95e1ae3`</sub>
- `16:01` · Performance (rapport du Mécanicien) : accueil allégé de ~2,8 Mo + cache assets  <sub>`b475d89`</sub>
- `16:22` · UX & accessibilité (rapport du Concierge) : zoom, FAQ, anti-arnaque, toasts  <sub>`994f9cd`</sub>
- `16:37` · Design (artifact) — Phase 1 : socle chaud (fond crème, ombres, palette)  <sub>`5f33b23`</sub>
- `16:42` · Design (artifact) — Phase 2 : composants (boutons, cartes, inputs, prix)  <sub>`8c36ec8`</sub>
- `16:58` · Design (artifact) — Phase 3 (début) : en-tête + footer chauds  <sub>`96d9d8b`</sub>
- `17:03` · Design (artifact) — footer sombre à l'identique  <sub>`9e8afb3`</sub>
- `17:07` · Design (artifact) — ordre des catégories aligné sur la maquette  <sub>`fb32528`</sub>
- `17:33` · Accueil : bannière publicitaire / mise en avant (entre héros et catégories)  <sub>`5d0c0fa`</sub>
- `17:40` · Accueil : héro compact + bannière publicité agrandie  <sub>`414f095`</sub>
- `17:48` · Accueil : héros et bannière pub de taille et d'épaisseur identiques  <sub>`4b5a3c8`</sub>
- `18:04` · Design : aligner toutes les pages sur la palette chaude de l'artifact  <sub>`3e8a93a`</sub>
- `18:13` · Design : reproduire Connexion, Inscription et Favoris d'après l'artifact  <sub>`378a94a`</sub>
- `18:15` · Design : reproduire la page FAQ/Aide d'après l'artifact  <sub>`d0d65b5`</sub>
- `18:18` · Design : reproduire À propos, Contact et Don d'après l'artifact  <sub>`2173035`</sub>
- `18:29` · Design : reproduire Profil vendeur et Notifications d'après l'artifact  <sub>`bf2178d`</sub>
- `18:32` · Design : reproduire Publier et Fiche annonce d'après l'artifact  <sub>`e73051e`</sub>
- `18:41` · Design : reproduire la Messagerie d'après l'artifact  <sub>`71965ea`</sub>
- `20:27` · Design : aligner Mon compte et Admin sur l'artifact  <sub>`375d0ae`</sub>
- `20:31` · Design : restaurer les blocs Don + carter l'écran d'accès Admin  <sub>`d65f955`</sub>
- `20:47` · Nav : barre du haut (artifact) + liens de footer logiques  <sub>`829b4d4`</sub>
- `20:56` · Mon compte : accueil en menu (façon artifact)  <sub>`b10460c`</sub>
- `21:11` · Mon compte : vue pleine largeur fidèle à l'artifact (mobile + ordinateur)  <sub>`5f3dee1`</sub>
- `21:35` · Compte : sous-pages pleine largeur + Tableau de bord façon artifact  <sub>`952d0af`</sub>
- `21:50` · Tableau de bord : suivi analytique réel (vues/jour, tendances, période)  <sub>`6b420a1`</sub>
- `22:03` · Favoris : grille 2/3/4 façon artifact + « Gratuit » en vert  <sub>`d29e57d`</sub>
- `22:11` · Publier : catégorie en menu déroulant (façon artifact)  <sub>`b499dca`</sub>
- `22:17` · Publier : formulaire pleine largeur sur ordinateur et tablette  <sub>`ce63f05`</sub>

### Samedi 18 juillet 2026

**25 livraison(s)** · Abidjan 03:53 → 23:16 · chez le Patron 05:53 → 01:16 · amplitude 19 h 23

- `03:53` · SMS : connecteur Orange (API Côte d'Ivoire) — voie recommandée pour la CI  <sub>`3e1ce02`</sub>
- `05:01` · Connexion Facebook + masquage temporaire de l'option Téléphone  <sub>`9d3dc0d`</sub>
- `09:27` · App native (stores) : connectivité serveur depuis Capacitor  <sub>`af4ae6b`</sub>
- `11:58` · Facebook : connexion publique sans exiger l'email (pas d'App Review)  <sub>`708acec`</sub>
- `13:55` · Ajout des skills design/animation (emilkowalski/skills, MIT)  <sub>`a933661`</sub>
- `14:07` · Bureau des designers : 4 skills maison + audit trimestriel  <sub>`5e75572`</sub>
- `14:23` · Design P1 : animations de sortie Sheet/Toast, easing fort, interrupteurs en transform  <sub>`7d7134b`</sub>
- `14:31` · Typographie : format FCFA à la française, chiffres alignés, polish texte  <sub>`2e3f52f`</sub>
- `14:41` · Organisation en bureaux : charte + journal de bord partagé  <sub>`2826822`</sub>
- `15:08` · Doc : CRON-TPE.md — tâches cron cPanel (TPE) prêtes à coller  <sub>`5d7123d`</sub>
- `16:01` · Serveur : endpoint cron/report — rapport périodique par email  <sub>`52cec52`</sub>
- `16:26` · Bureaux : protocole v2 — communiquer avec le serveur + résoudre en profondeur  <sub>`bfa390b`</sub>
- `17:05` · Sécurité : exclure les IP de monitoring des stats suspectes  <sub>`04079d4`</sub>
- `18:03` · Sourcing : retirer l'ancienne clé cron morte de deliver-report.mjs  <sub>`e4cf078`</sub>
- `19:25` · Design P2+P3 : pop du cœur favori, spinner véloce, barres de progression fluides, cascade des annonces récentes  <sub>`187d6b6`</sub>
- `19:34` · Design accueil (passe profonde) : héro mobile, typographie sections, squelettes, tactilité  <sub>`9e4482a`</sub>
- `20:01` · Ops : hook SessionStart (prépare les sessions web/routines) + guide de rotation des secrets  <sub>`c5290c5`</sub>
- `20:08` · Config : pré-autoriser les outils de gestion des routines (permissions.allow)  <sub>`9852424`</sub>
- `21:05` · Sécurité + robustesse (Lot 1) : anti-faux-avis, anti-pré-détournement, connexion résiliente  <sub>`b395b1b`</sub>
- `22:00` · Sécurité + robustesse (Lot 2)  <sub>`35f86a7`</sub>
- `22:18` · Supprimer Supabase : le site est 100 % sur la base TPE Cloud (PHP)  <sub>`c7f5fac`</sub>
- `22:38` · Hygiène (Lot 3) : RGPD, droits admin, intégrité, robustesse  <sub>`8b737b8`</sub>
- `22:52` · Kit marketing : générateur de visuels réutilisable (note ivoirienne)  <sub>`be0ee3b`</sub>
- `23:01` · B10 : lotir les envois d'emails des crons (anti-timeout à l'échelle)  <sub>`9dcaf7a`</sub>
- `23:16` · Play Store : guide pas-à-pas + visuels de fiche prêts (Android)  <sub>`0097f6b`</sub>

### Vendredi 17 juillet 2026

**18 livraison(s)** · Abidjan 10:17 → 21:51 · chez le Patron 12:17 → 23:51 · amplitude 11 h 34

- `10:17` · feat(mail): rapports automatiques envoyés à contact@chap.ci  <sub>`ef9a5d2`</sub>
- `14:07` · fix(security): P1 — secrets forts auto-générés (JWT + clé cron)  <sub>`9538470`</sub>
- `14:19` · fix(annonces): P4 — édition d'annonce fiable + affichage à jour  <sub>`856c471`</sub>
- `14:29` · fix(ux,a11y): P5 cloche accueil fonctionnelle + P7 focus clavier visible  <sub>`13e9ef4`</sub>
- `14:37` · fix(annonces): État agriculture + détourage plus rapide  <sub>`8d1cb63`</sub>
- `14:55` · fix(security): P2 — bloque les fausses commandes et faux avis  <sub>`70f5061`</sub>
- `14:55` · fix(a11y): P6 — meilleure lisibilité des textes sur le fond orange  <sub>`fcf4e1f`</sub>
- `15:11` · fix(security): P8 uploads sûrs · P10 anti-force-brute · P13 erreurs discrètes  <sub>`a0ff2f8`</sub>
- `15:24` · fix(security): P11 code SMS jamais exposé · P12 mot de passe & sessions  <sub>`cf70ce2`</sub>
- `18:11` · fix(ux,a11y): finitions Bureau (P15,P16,P18,P19,P20,P25,P26,P27)  <sub>`ab03c0a`</sub>
- `18:47` · ci(security): allowlister 2 faux positifs gitleaks  <sub>`4132165`</sub>
- `19:23` · Bureau des développeurs — lot de 6 correctifs (P14, P17, P21, P22, P23, P24)  <sub>`7bffd13`</sub>
- `19:32` · P21 (finalisation) — .htaccess ne force plus Access-Control-Allow-Origin: *  <sub>`a2334d3`</sub>
- `19:52` · P3 — Session en cookie HttpOnly (involable par XSS) + CSP stricte  <sub>`dab1bc9`</sub>
- `21:15` · Détourage : modèle IA auto-hébergé sur chap.ci (fin de la dépendance CDN)  <sub>`22304a5`</sub>
- `21:24` · Publication : notification de statut (cloche + toast)  <sub>`c5fa449`</sub>
- `21:48` · Inscription (voir/confirmer mot de passe) + recherche à suggestions + catégories reliées  <sub>`d57fdfb`</sub>
- `21:51` · SMS Twilio : support Messaging Service + journalisation des échecs  <sub>`1eac13f`</sub>

### Jeudi 16 juillet 2026

**21 livraison(s)** · Abidjan 12:11 → 20:29 · chez le Patron 14:11 → 22:29 · amplitude 8 h 18

- `12:11` · feat(responsive): page « Mon compte » en 2 volets sur ordinateur & tablette  <sub>`7280f6d`</sub>
- `12:28` · feat(responsive): messagerie 2 volets sur ordinateur & tablette (façon WhatsApp Web)  <sub>`3a143aa`</sub>
- `12:33` · feat(responsive): page Aide & FAQ sur 2 colonnes (ordinateur / iPad / tablette)  <sub>`aebce54`</sub>
- `12:42` · feat(responsive): CGU avec sommaire latéral fixe sur ordinateur & tablette  <sub>`099bb5a`</sub>
- `12:51` · feat(responsive): page À propos adaptée ordinateur / iPad / tablette  <sub>`a5085ba`</sub>
- `12:55` · feat(responsive): page Contact adaptée ordinateur / iPad / tablette  <sub>`ccfb9c0`</sub>
- `13:06` · feat(responsive): page Don adaptée ordinateur / iPad / tablette  <sub>`9ee4255`</sub>
- `13:31` · feat(responsive): page Confidentialité adaptée ordinateur / iPad / tablette  <sub>`0c8339f`</sub>
- `13:32` · feat(auth): connexion Google + téléphone (code SMS) en backend PHP  <sub>`7ce3676`</sub>
- `13:33` · docs: guide d'activation connexion Google + téléphone (SMS)  <sub>`346656d`</sub>
- `14:00` · feat(auth): ID client Google du projet par défaut (activation sans config.php)  <sub>`1a12abc`</sub>
- `16:12` · feat(medias): filigrane « Chap.ci » au centre des photos d'annonce  <sub>`f4244fa`</sub>
- `16:14` · style(medias): filigrane texte seul « Chap.ci », plus discret  <sub>`fa89fe6`</sub>
- `16:36` · feat(annonces): éditeur photo pro à la publication  <sub>`ed0b4df`</sub>
- `16:44` · feat(annonces): fonds studio colorés dans l'éditeur photo  <sub>`fd6af84`</sub>
- `17:06` · feat(annonces): détourage IA optionnel (fond studio) dans l'éditeur  <sub>`2b054d8`</sub>
- `18:01` · feat(moderation): Gardien de publication (anti-arnaque + contenu interdit)  <sub>`df15521`</sub>
- `18:13` · feat(moderation): analyse anti-nudité des photos (NSFW.js, local)  <sub>`021f5b3`</sub>
- `18:21` · feat(stats): vues et statut des annonces dans « Mes annonces »  <sub>`585670c`</sub>
- `20:22` · feat(notifications): centre de notifications + cloche déroulante  <sub>`ed6e6d5`</sub>
- `20:29` · fix(notifications): menu déroulant aligné à droite (mobile) / gauche (ordi)  <sub>`59423b4`</sub>

### Mercredi 15 juillet 2026

**2 livraison(s)** · Abidjan 02:25 → 02:54 · chez le Patron 04:25 → 04:54 · amplitude 29 min

- `02:25` · feat(ops): veille concurrentielle hebdo + audit sécurité mensuel (workflows)  <sub>`5298b55`</sub>
- `02:54` · feat(securite): rate-limit, journal d'audit, consentement horodaté, ménage + CI gitleaks  <sub>`db86399`</sub>

### Mardi 14 juillet 2026

**32 livraison(s)** · Abidjan 02:28 → 23:16 · chez le Patron 04:28 → 01:16 · amplitude 20 h 48

- `02:28` · Statistiques vendeur cliquables : chaque tuile filtre sa vue  <sub>`4a732e6`</sub>
- `02:39` · Cartes cliquables : profil vendeur public + chiffre d'affaires  <sub>`f0cf9c3`</sub>
- `02:47` · Admin : statistiques d'inscriptions par période (jour/semaine/mois/année)  <sub>`3857e81`</sub>
- `02:55` · Admin : vues Conversations & Avis + graphique évolutif 14 jours  <sub>`e415a0b`</sub>
- `03:12` · Recherche : filtres avancés par critères de catégorie  <sub>`5337427`</sub>
- `03:18` · Croissance : partage WhatsApp/Facebook + SEO (aperçus & Google) + auto-masquage  <sub>`f64ced4`</sub>
- `03:44` · SEO : page d'accueil enrichie (Open Graph, données structurées) + robots.txt  <sub>`29913fd`</sub>
- `03:58` · SEO : balise de validation Google Search Console  <sub>`05f6a1f`</sub>
- `09:36` · SEO : sitemap nettoyé (retrait des URL avec fragment #)  <sub>`032aa17`</sub>
- `10:10` · Version desktop responsive : vrai site sur ordinateur, mobile intact  <sub>`1667c25`</sub>
- `10:21` · Desktop : bannière d'accueil (héro), admin pleine largeur, finitions  <sub>`71ebd6d`</sub>
- `10:31` · Admin : suivi des visiteurs (courbe) + temps de réponse aux messages  <sub>`cf67f8d`</sub>
- `10:41` · Admin : le graphique « Évolution (14 jours) » de l'Aperçu devient une courbe  <sub>`faa32f6`</sub>
- `10:57` · Footer sur tout le site + page de présentation « À propos »  <sub>`0fa110a`</sub>
- `11:24` · feat: alertes email (recherches sauvegardées) + sauvegarde auto de la base + affichage plein écran desktop  <sub>`86a7868`</sub>
- `12:38` · fix(responsive): adapter tout le site aux tablettes/iPad (mode ordinateur dès 768px)  <sub>`eee4633`</sub>
- `13:01` · feat: page Aide & FAQ + densité desktop raisonnable (largeur 1280px)  <sub>`82ad5d1`</sub>
- `13:35` · feat: suivi de transaction + avis à double sens (achat déclaré, réception, relances)  <sub>`f4723f8`</sub>
- `14:07` · feat: retirer les annonces de démonstration + outil admin « repartir à zéro »  <sub>`b4717c0`</sub>
- `16:34` · feat: menu déroulant « Mon compte » (desktop) avec options + déconnexion  <sub>`278a62e`</sub>
- `16:42` · feat(responsive): page « Publier » sur 2 colonnes (ordinateur / iPad paysage)  <sub>`cb01e38`</sub>
- `17:12` · feat(responsive): page « Mon compte » adaptée ordinateur / iPad  <sub>`e3344c8`</sub>
- `18:09` · feat: habillage festif « Fête de l'Indépendance » 🇨🇮 (hybride jour/nuit)  <sub>`a86c703`</sub>
- `18:22` · feat: ambiance festive « Indépendance » sur TOUT le site (confettis / feux)  <sub>`ef7098d`</sub>
- `18:56` · feat: moteur d'agents sourcing/arbitrage Europe→Abidjan (workflow + modèle économique)  <sub>`e74a080`</sub>
- `19:14` · fix(sourcing): entrées réalistes (achat bas atteignable, revente marché réel), vrais tarifs de fret câblés, restricted only si vraiment interdit, args robustes  <sub>`1f4f066`</sub>
- `19:31` · feat(sourcing): liens de recherche cliquables par article (Kleinanzeigen, eBay, Leboncoin, Marktplaats, Wallapop, Vinted)  <sub>`63962b5`</sub>
- `20:20` · feat(sourcing): email du rapport avec PDF joint  <sub>`35fef8e`</sub>
- `21:03` · chore(sourcing): recalibrage — budget 500 €, seuils marge ≥40 % et ≥30 000 FCFA  <sub>`d03d9cd`</sub>
- `21:19` · feat(legal): conformité droit ivoirien + veille juridique mensuelle à 5 agents  <sub>`5a9f93f`</sub>
- `21:32` · fix(legal): corrections issues de la 1re veille juridique (6 agents)  <sub>`8d52438`</sub>
- `23:16` · feat(ops): surveillance santé, test post-déploiement, modération des annonces, stats hebdo  <sub>`53aa10a`</sub>

### Lundi 13 juillet 2026

**33 livraison(s)** · Abidjan 03:07 → 22:35 · chez le Patron 05:07 → 00:35 · amplitude 19 h 28

- `03:07` · Backend PHP/MySQL auto-hébergeable (mutualisé cPanel / TPE Cloud)  <sub>`9d2c4a3`</sub>
- `03:24` · Frontend commutable Supabase / PHP (auto-hébergement TPE Cloud)  <sub>`b3b0b90`</sub>
- `09:46` · Backend PHP : message clair si la connexion MySQL échoue  <sub>`4d08888`</sub>
- `10:00` · Backend PHP : support PostgreSQL en plus de MySQL/SQLite  <sub>`3e9c0df`</sub>
- `10:19` · Backend PHP : compatible PHP 7.4/8.0 + erreurs fatales en JSON lisible  <sub>`a0ae431`</sub>
- `11:55` · Ajout : page Contact + newsletter (inscription + export admin CSV)  <sub>`88f536b`</sub>
- `12:10` · Tableau de bord administrateur complet  <sub>`e93e459`</sub>
- `12:20` · Gestion des modérateurs (mêmes droits que l'administrateur)  <sub>`f0996bd`</sub>
- `12:29` · Admin : lien du tableau de bord visible et fiable (décidé par le serveur)  <sub>`52c793f`</sub>
- `12:37` · Email : notifier un nouveau modérateur par email  <sub>`d4cbe10`</sub>
- `12:59` · Mentions légales (CGU + RGPD) à accepter à l'inscription + email enrichi  <sub>`0ff3227`</sub>
- `13:06` · Emails no-reply : gabarit peaufiné + email de bienvenue à l'inscription  <sub>`a153764`</sub>
- `13:17` · Emails : envoi fiable via SMTP + bouton de test (diagnostic)  <sub>`98acde4`</sub>
- `13:26` · Emails : lien du site cliquable (logo/nom en-tête + adresse en pied de page)  <sub>`765ffd0`</sub>
- `13:32` · Modérateurs : (re)envoi de l'email à chaque ajout + bouton « Renvoyer »  <sub>`2953721`</sub>
- `13:43` · SMTP configurable depuis le tableau de bord (onglet Emails)  <sub>`6a05b09`</sub>
- `13:52` · Emails : en-têtes Date + Message-ID (délivrabilité ProtonMail/serveurs stricts)  <sub>`3116b92`</sub>
- `14:44` · Emails : corps encodé en base64 (corrige « lines too long for transport »)  <sub>`2f72aa8`</sub>
- `14:55` · Emails : texte plus court et style plus soigné (bienvenue + modérateur)  <sub>`7509388`</sub>
- `15:04` · Emails automatiques : newsletter, demande d'achat (vendeur + acheteur)  <sub>`6875f4c`</sub>
- `15:14` · Newsletter : envoyée depuis hello@chap.ci (réponse possible)  <sub>`ec5e946`</sub>
- `16:19` · Newsletter : opt-in à l'inscription + popup pour les non-abonnés  <sub>`98174d6`</sub>
- `18:38` · Campagnes publicitaires : envoi promo aux abonnés (100% TPE)  <sub>`80afa97`</sub>
- `18:54` · Offres automatiques programmées (type OLX/eBay) via cron  <sub>`349e68a`</sub>
- `19:24` · Agents intelligents : suggestions personnalisées par email  <sub>`88373a6`</sub>
- `19:54` · API: exposer PHP_VERSION sur la route racine (diagnostic)  <sub>`68d345e`</sub>
- `20:17` · Fix : réglages manquants dans un config.php ancien (clé cron vide)  <sub>`8f73909`</sub>
- `20:47` · Fix : les annonces avec photos ne partaient pas en base (upload trop lourd)  <sub>`bf0efab`</sub>
- `21:24` · Agents : « Tester sur mon compte » devient un vrai aperçu  <sub>`07323a9`</sub>
- `21:50` · Catégories complètes + suggestions plus précises (même sous-catégorie)  <sub>`514892b`</sub>
- `22:02` · Formulaire d'annonce adaptatif par catégorie (champs experts)  <sub>`020c134`</sub>
- `22:20` · Backend modération & gestion : visibilité, statuts, signalements, édition  <sub>`268e506`</sub>
- `22:35` · Modération & gestion (UI) : signalement, mes annonces, admin complet  <sub>`8815ac3`</sub>

### Dimanche 12 juillet 2026

**4 livraison(s)** · Abidjan 04:46 → 06:01 · chez le Patron 06:46 → 08:01 · amplitude 1 h 15

- `04:46` · Corriger un doublon de message possible à l'envoi (race temps réel)  <sub>`233399d`</sub>
- `04:51` · Robustesse : 3 correctifs de cas limites (revue de code)  <sub>`cc14494`</sub>
- `05:24` · Préparer la publication sur Google Play et l'App Store  <sub>`8a929dc`</sub>
- `06:01` · Ajouter le filtre « Bons plans » dans le panneau Filtrer les annonces  <sub>`b939b2b`</sub>

### Samedi 11 juillet 2026

**34 livraison(s)** · Abidjan 09:51 → 23:59 · chez le Patron 11:51 → 01:59 · amplitude 14 h 08

- `09:51` · Créer Chap.ci — marketplace de petites annonces pour la Côte d'Ivoire (web + app iPhone/Android)  <sub>`b1badb2`</sub>
- `10:11` · Ajouter l'option de don Mobile Money + déploiement GitHub Pages  <sub>`bf62cfd`</sub>
- `10:22` · Intégrer Supabase : backend, comptes utilisateurs et annonces partagées  <sub>`65a4e28`</sub>
- `10:24` · Corriger le déploiement Pages + documenter (Supabase, comptes, dons, mise en ligne)  <sub>`ee60e4c`</sub>
- `10:43` · Ajouter la messagerie acheteur ↔ vendeur (temps réel via Supabase)  <sub>`50858b1`</sub>
- `10:57` · Ajouter le paiement Mobile Money (acheteur -> vendeur)  <sub>`32b941c`</sub>
- `11:00` · Préciser le modèle : Chap.ci met en relation, transactions hors application  <sub>`b4a9b2e`</sub>
- `11:16` · Ajouter la géolocalisation : distance des annonces + tri « Près de moi »  <sub>`ea9a7bd`</sub>
- `13:30` · Corriger l'affichage cassé des cartes sur navigateurs intégrés iOS  <sub>`0228cd7`</sub>
- `13:48` · Corriger le défilement horizontal des catégories (Explorer)  <sub>`c480c12`</sub>
- `14:00` · Recentrer automatiquement la catégorie/sous-catégorie active dans sa rangée  <sub>`4eef2cd`</sub>
- `18:04` · Marketplace transactionnelle : panier, achats, avis, profils vendeurs, tableau de bord  <sub>`2d5010e`</sub>
- `19:49` · Retirer le panier ; ajouter suppression de compte, photo de profil, Google/Apple, téléphone (OTP) et 2FA  <sub>`b87106d`</sub>
- `20:09` · Formulaire d'inscription complet (identité, sexe, date de naissance, localisation GPS avancée)  <sub>`b64f366`</sub>
- `20:23` · Ajouter supabase/setup.sql : installation complète en un seul fichier (idempotent)  <sub>`f8f9d5c`</sub>
- `20:33` · Inscription : demander le GPS à l'ouverture, sinon repli automatique sur l'IP  <sub>`e3d67be`</sub>
- `20:50` · Localisation globale à l'ouverture du site (pop-up), réutilisée partout  <sub>`48ae6e3`</sub>
- `21:02` · Géolocalisation plus précise : GPS affiné + BigDataCloud  <sub>`db05db6`</sub>
- `21:24` · Identité de marque Chap.ci : logo « épingle-C », couleurs, polices  <sub>`2b1ebe7`</sub>
- `21:28` · Guide pas à pas : activer la connexion Google et Apple  <sub>`6a7f7e2`</sub>
- `22:08` · Masquer la ligne technique « … · position GPS » du profil  <sub>`d5c62ce`</sub>
- `22:18` · Mot de passe robuste + changement, et bouton « Contacter le vendeur » visible  <sub>`2d4e600`</sub>
- `22:28` · Améliorer le panneau de filtres (Browse)  <sub>`46f1fae`</sub>
- `22:37` · Ajouter la récupération de mot de passe oublié  <sub>`948abb8`</sub>
- `22:40` · Améliorer la publication d'annonce (catégories visuelles + géoloc pré-remplie)  <sub>`401c2a2`</sub>
- `22:45` · Retirer la mention « Position détectée automatiquement » (publication)  <sub>`dc2cb19`</sub>
- `22:56` · Verrouiller la localisation de l'annonce sur la position GPS  <sub>`3789bc9`</sub>
- `23:02` · Verrouiller la localisation à l'inscription sur la position GPS  <sub>`9a9f2dd`</sub>
- `23:10` · Nettoyer l'affichage de la distance sur les annonces  <sub>`b2b8fc2`</sub>
- `23:19` · Redesign des cartes d'annonces  <sub>`f1e0a5d`</sub>
- `23:31` · Promotions : prix réduit à durée limitée avec étiquette de réduction  <sub>`fe42ac1`</sub>
- `23:40` · Section « Bons plans » (promotions) sur l'accueil + filtre Explorer  <sub>`ff80d50`</sub>
- `23:58` · Notifications de messages non lus  <sub>`3822540`</sub>
- `23:59` · Statistiques vendeur dans le tableau de bord  <sub>`8a04da7`</sub>
<!-- FIN REGISTRE AUTOMATIQUE -->
