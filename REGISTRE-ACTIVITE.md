# Registre d’activité — Chap.ci

Quand chaque chose a été faite. **Ce document se génère** : `npm run registre`.

| | |
|---|---|
| Période couverte | du Jeudi 27 août 2026 au Samedi 12 septembre 2026 |
| Livraisons | 136 |
| Jours travaillés | 17 |
| Dernière mise à jour | Samedi 12 septembre 2026, 15:29 (Abidjan) |

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

**11 livraison(s)** · Abidjan 04:02 → 15:25 · chez le Patron 06:02 → 17:25 · amplitude 11 h 23

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

**1 livraison(s)** · Abidjan 21:43 → 21:43 · chez le Patron 23:43 → 23:43 · amplitude —

- `21:43` · Le tableau de bord au complet — Annonces, Utilisateurs, Demandes Pro, Signalements, Contact, Publicités  <sub>`73d91b1`</sub>
<!-- FIN REGISTRE AUTOMATIQUE -->
