# Les huit questions du formulaire — la liste exacte, écrite par Google

Le **12/09/2026**, le Patron a envoyé l'article d'aide complet, **les trois parties
dépliées**. Nous avons donc la liste exacte des questions **quatorze jours avant**
d'avoir à y répondre. C'est exactement ce qui manquait dans la nuit du 10 septembre.

> ⚠️ **DEUX PIÈGES DU FORMULAIRE, ÉCRITS PAR GOOGLE LUI-MÊME**, et répétés à chaque
> partie :
>
> - *« If you click **Discard** or **leave the page** without clicking Next, your
>   changes are not saved. »*
> - À la partie 3, c'est **Apply** qu'il faut cliquer, pas Next.
>
> **Traduction : si vous fermez l'onglet, tout est perdu.** N'ouvrez le formulaire
> que le jour où les réponses sont prêtes à être collées, et allez jusqu'au bout
> d'une traite.

---

## Qui répond à quoi

| | Question | Qui |
|---|---|---|
| **1.1** | Facilité à recruter les testeurs | **Vous seul** |
| **1.2** | Engagement des testeurs | **Vous seul** — *et impossible aujourd'hui* |
| **1.3** | Résumé des retours + comment ils ont été recueillis | **Vous seul** — *et impossible aujourd'hui* |
| **2.1** | Public visé | Je prépare, vous corrigez |
| **2.2** | Ce que l'application apporte | Je prépare, vous corrigez |
| **2.3** | Fourchette d'installations la 1ʳᵉ année | Je conseille, **vous tranchez** |
| **3.1** | Ce que le test fermé vous a fait changer | **Vous seul** — *et impossible aujourd'hui* |
| **3.2** | Comment vous savez qu'elle est prête | Je prépare, vous corrigez |

**Trois questions sur huit sont aujourd'hui sans réponse honnête possible.** Ce sont
les 1.2, 1.3 et 3.1 — toutes les trois portent sur ce que les testeurs ont fait et
dit. **C'est très probablement là que la demande du 10 septembre est tombée**, et
c'est exactement le travail des quatorze jours.

---

# PARTIE 1 — « À propos de votre test fermé »

Google explique pourquoi il la pose : *« vérifier que les applications ont été
testées en profondeur avant publication. Cela protège les utilisateurs des
applications de mauvaise qualité, empêche la diffusion de logiciels malveillants et
réduit la fraude. »*

### 1.1 — « Indiquez à quel point il a été facile de recruter des testeurs. »

*(une liste de choix, pas du texte libre)*

**Répondez ce qui est vrai.** Vous avez mis du 26 juillet au 26 août pour réunir
douze personnes, soit un mois : ce n'est pas « très facile ». Une réponse qui
minimise la difficulté n'apporte rien et se contredit avec le reste du dossier.

### 1.2 — « Détaillez l'engagement des testeurs pendant votre test fermé. »

Google précise les deux points attendus :

- *« si les testeurs ont utilisé **toutes** les fonctionnalités disponibles »* ;
- *« si leur usage correspondait au comportement attendu d'un utilisateur en
  production, **en détaillant les écarts observés** ».*

> ⛔ **C'EST LA QUESTION DU REFUS.** C'est le mot *engagement* — le même que dans la
> phrase qui explique les refus. Aujourd'hui, la réponse vraie serait : « les douze
> testeurs ont la version du 15 août et ne l'ont pas ouverte depuis ». Elle ne peut
> pas passer, et elle ne doit pas être maquillée.
>
> **Ce qu'il faut, ce n'est pas une meilleure réponse : ce sont de meilleurs faits.**
> Les quatorze jours servent à ça, et `store/ENGAGEMENT-TESTEURS.md` dit comment.

Notez que Google demande les **écarts** — il ne s'attend pas à la perfection. Un
testeur qui n'a jamais publié d'annonce, un autre qui n'a pas trouvé la messagerie :
ces observations-là sont des bonnes réponses, pas des aveux.

### 1.3 — « Résumez les retours reçus des testeurs et décrivez comment ils ont été recueillis. »

Deux choses en une :

- **le résumé** : ce qu'ils ont dit, les thèmes qui reviennent ;
- **le canal** : WhatsApp, appel, e-mail, et — celui que Google voit de son côté —
  les avis privés laissés dans le Play Store.

👉 **Ouvrez dès aujourd'hui : Play Console → Suivre et améliorer → Notes et avis →
Commentaires sur les tests.** C'est la page où Google lit ce que vos testeurs ont
écrit. Dites-moi ce qu'elle contient.

Google conseille aussi, et c'est du bon sens : *« tenez un registre des retours
reçus »*. Envoyez-les-moi au fur et à mesure, je les tiens dans le dépôt — vous
n'aurez pas à vous souvenir de tout le 26 septembre.

---

# PARTIE 2 — « À propos de votre application »

Google précise : *« vos réponses ne sont pas affichées publiquement sur Google Play
et n'affectent ni la visibilité de l'application, ni l'accès aux fonctionnalités de
la Play Console, ni l'éligibilité aux programmes développeurs. »* Autrement dit :
**répondez franchement, cette partie ne vous engage pas commercialement.**

### 2.1 — « Précisez le public visé. Soyez le plus précis possible. »

**Brouillon, à corriger par vous :**

> Chap.ci s'adresse aux particuliers et aux petites structures de **Côte d'Ivoire**,
> d'abord à **Abidjan** et ses communes (Yopougon, Cocody, Abobo, Treichville,
> Bingerville…), puis aux villes de l'intérieur.
>
> Trois publics :
> 1. **Les particuliers qui vendent ou achètent d'occasion** — téléphones, meubles,
>    voitures, appareils ménagers — et qui passent aujourd'hui par les groupes
>    WhatsApp et Facebook, sans structure ni recherche.
> 2. **Les petits professionnels** : boutiques, coiffures, auto-écoles, centres de
>    formation, restaurants, pharmacies. L'application leur donne une vitrine, un
>    stock et des offres d'emploi — 15 types de structures sont prévus.
> 3. **Les associations et ONG**, avec leur vocabulaire propre (dons, récépissé) et
>    non celui du commerce.
>
> Le public est majoritairement **francophone**, sur des **téléphones Android
> d'entrée de gamme**, en **3G**, avec un forfait de données compté. L'application
> est traduite en six langues pour les communautés non francophones du pays.

### 2.2 — « Décrivez ce que votre application apporte à ses utilisateurs. »

**Brouillon, à corriger par vous :**

> En Côte d'Ivoire, les petites annonces se font dans des groupes WhatsApp : rien
> n'est cherchable, tout se perd en deux jours, et personne ne sait à qui il parle.
>
> Chap.ci apporte quatre choses que ces groupes n'ont pas :
>
> 1. **Une recherche qui comprend le pays** — les communes d'Abidjan, les mots
>    locaux (« gbaka », « télé », « djossi »), les fautes de frappe.
> 2. **Une place de marché gratuite et sans commission.** Publier ne coûte rien,
>    vendre ne coûte rien. Aucune commission n'est prélevée. Un écran « Soutenir
>    Chap.ci » propose un don par Mobile Money, jamais imposé.
> 3. **Un poids pensé pour la 3G et les petits forfaits** : photos redimensionnées
>    avant l'envoi, vidéo qui ne se lance jamais toute seule et dont le poids est
>    écrit avant qu'on appuie.
> 4. **Le respect des usages** : chaque annonce peut devenir une **affiche pour le
>    statut WhatsApp**, parce que c'est ainsi qu'on vend ici. Le contact se fait par
>    WhatsApp ou par la messagerie de l'application.
>
> Pour les professionnels : vitrine, horaires, réseaux sociaux, gestion de stock avec
> alerte de rupture, offres d'emploi avec formulaire de candidature, abonnés.
>
> Côté sécurité : vérification de l'e-mail, double authentification, contrôle
> automatique des photos, modération.

### 2.3 — « Estimez la fourchette d'installations la première année. »

*(une liste de choix)*

**Prenez la fourchette la plus basse qui vous est proposée.**

Pourquoi, et ce n'est pas de la modestie : le **27/07/2026**, la fiche du store
annonçait « des milliers d'annonces » pour un catalogue qui en comptait **trois**. Il
a fallu tout réécrire — c'était un risque au regard du règlement de Google sur les
métadonnées. La même règle vaut ici.

Les chiffres réels au 12/09/2026 : **45 annonces actives**, **7 vendeurs**,
**12 testeurs**. Un chiffre ambitieux dans cette case ne fait pas de bien et peut
faire du mal.

---

# PARTIE 3 — « À propos de votre préparation à la production »

### 3.1 — « Décrivez les changements apportés à votre application à partir de ce que vous a appris le test fermé. »

> ⛔ **LA DEUXIÈME QUESTION QUI NE PEUT PAS ÊTRE RÉPONDUE AUJOURD'HUI.**
>
> Nous avons livré **37 chantiers** depuis la v1.20 — mais **aucun ne vient d'un
> retour de testeur**. Ils viennent du Patron, des bureaux, des bancs de test. C'est
> du bon travail, et ce n'est **pas** ce que Google demande ici.
>
> Google demande : *qu'est-ce que vos douze testeurs vous ont fait changer ?*
>
> **Répondre « 37 améliorations » à cette question, c'est répondre à côté** — et un
> examinateur qui lit une liste de fonctionnalités là où il attend une boucle de
> retour voit exactement ce qu'il cherchait à détecter : un test qui n'a pas eu lieu.

**C'est la raison la plus forte de déposer la v1.25 tout de suite** : il faut qu'au
moins **un** changement, entre aujourd'hui et le 26 septembre, vienne d'un testeur.
Un seul vrai suffit à rendre cette réponse honnête. Deux ou trois valent mieux.

### 3.2 — « Décrivez comment vous avez déterminé que votre application était prête pour la production. »

**Brouillon, à corriger par vous** — et celui-ci, nous pouvons le documenter
solidement, parce que c'est notre façon de travailler depuis le début :

> L'application et son serveur sont vérifiés par une série de bancs de test
> automatiques, rejoués à chaque livraison :
>
> - les **101 schémas de sous-catégories** du catalogue ;
> - un banc qui rejoue les **neuf pages principales sur un téléphone 3G simulé** et
>   mesure le poids, les décalages d'affichage, les erreurs et la taille des cibles
>   tactiles ;
> - un banc de **cohérence** qui compare, une par une, les catégories, les types de
>   professionnels, les lieux, les pays, les réglages et les permissions entre le
>   site, l'application et le serveur ;
> - des bancs dédiés au stock, à la pagination du catalogue, aux notifications et
>   aux vignettes d'images ;
> - côté application : `flutter analyze` (zéro erreur) et **260 tests unitaires**.
>
> La disponibilité du serveur est surveillée quotidiennement : empreintes des
> fichiers servis, certificat, journal d'audit, tâches planifiées.
>
> L'application a été installée et utilisée sur des appareils réels — iPhone et
> Android — avant chaque dépôt.

⚠️ **Ce brouillon est vrai aujourd'hui. Il le restera si vous le complétez** avec
les deux choses qui manquent et qui viendront des quatorze jours :

- le **rapport de pré-lancement** de Google (il tournera tout seul après le dépôt de
  la v1.25 — Test and release → Pre-launch report) ;
- ce que les testeurs auront signalé **et** que nous aurons corrigé.

---

## Ce que Google vérifie en plus, et qui ne passe pas par le formulaire

L'article donne quatre points de conformité examinés séparément. Trois ne posent
aucun problème chez nous. **Le quatrième, si.**

| Point | Chez nous |
|---|---|
| Contenu, fonctionnalités, monétisation conformes | ✅ gratuit, sans commission, dons volontaires |
| Âge visé et classification cohérents | ✅ à revérifier, rien de signalé |
| Fiabilité : pas de plantage, pas d'écran manquant | ✅ c'est ce que mesurent nos bancs — et ce que dira le rapport de pré-lancement |
| **Identifiants de test** : *« si votre application demande une authentification, fournissez des identifiants valides et fonctionnels dans la Play Console pour que les examinateurs puissent tester toutes les fonctionnalités »* | ⚠️ **À VÉRIFIER AUJOURD'HUI** |

Chap.ci demande un compte pour **publier**, **écrire à un vendeur**, **mettre en
favori** — presque tout. Sans identifiants, un examinateur ne voit que le catalogue.

**Play Console → Règles et programmes → Contenu de l'application → Accès à
l'application.** Dites-moi ce qui y est déclaré ; je vous dirai quoi corriger. Un
compte de démonstration se crée en deux minutes et sert ensuite à chaque version.

---

## Le calendrier

| Quand | Quoi |
|---|---|
| **Aujourd'hui** | *Commentaires sur les tests* · *Accès à l'application* · construire la v1.25 |
| **Dès le dépôt** | Le message aux douze (`ENGAGEMENT-TESTEURS.md`) |
| **J+2** | Le rapport de pré-lancement |
| **Chaque retour** | Vous me l'envoyez, je le consigne, on corrige ce qui doit l'être |
| **~26/09** | On écrit les huit réponses **ensemble**, puis vous ouvrez le formulaire une seule fois et vous allez jusqu'à **Apply** |
