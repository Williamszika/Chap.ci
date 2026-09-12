# Les quatorze jours des douze testeurs — ce qu'il faut faire, jour par jour

Écrite le **12/09/2026**, après le refus de la demande de production, et **à partir
de la documentation officielle de Google** que le Patron a retrouvée le jour même.

---

## Google nomme lui-même les deux seules causes d'un refus

C'est la phrase la plus importante de toute cette affaire, et elle est dans l'article
d'aide de la Play Console :

> *« Reasons for required continued testing include having fewer than 12 opted-in
> testers or **insufficient tester engagement** during the testing period. »*
>
> « Les raisons pour lesquelles un test doit se poursuivre comprennent : **moins de
> 12 testeurs inscrits**, ou **un engagement insuffisant des testeurs** pendant la
> période de test. »

Deux causes. Une seule peut être la nôtre :

| Cause possible | Notre cas |
|---|---|
| Moins de 12 testeurs inscrits | ❌ **Écartée.** Le critère « Avoir au moins 12 testeurs inscrits » est **barré** dans la console, avant comme après le refus. |
| **Engagement insuffisant des testeurs** | ✅ **C'est celle-là.** Par élimination, et il n'y en a pas de troisième. |

**Ce n'est donc plus une hypothèse.** Le 12/09 au matin, j'écrivais « hypothèse la
plus probable, sans certitude » au sujet de l'application figée depuis le 15 août.
La documentation la remplace par une cause nommée — et elle est plus précise que ce
que j'avais dit.

---

## « Engagement », ce n'est pas « installé ». C'est « utilisé, et qui répond ».

Voilà la nuance qui change tout le travail des quatorze jours.

Douze personnes qui ont l'application sur leur téléphone et n'y touchent jamais
remplissent le critère « 12 testeurs inscrits » — celui-là est barré depuis le
26 août — **et échouent sur l'engagement**. C'est exactement notre situation :

- l'application de vos testeurs est la **v1.20 du 15 août** ;
- **37 chantiers** ont été livrés depuis, aucun n'est arrivé chez eux ;
- ils n'ont donc eu, pendant quatre semaines, **aucune raison d'ouvrir l'application**.

Google ne mesure pas la fraîcheur du build. Il mesure ce que font les testeurs.
Déposer la v1.25 n'est donc pas le but : **c'est le moyen**. Le but est que douze
personnes ouvrent l'application, s'en servent, et laissent un commentaire que Google
peut voir.

---

## Ce que Google demande explicitement dans le formulaire

Toujours dans le même article :

> *« You must summarize your testing feedback when applying for production access. »*
>
> « Vous devez **résumer les retours de vos tests** lors de la demande d'accès en
> production. »

Autrement dit : **le formulaire vous demandera de raconter ce que vos testeurs vous
ont dit.** Si personne n'a rien dit, il n'y a rien à écrire — et c'est probablement
ce qui s'est passé le 10 septembre.

Google va plus loin, et le dit comme un avantage, pas comme une menace :

> *« Act on user feedback […] to increase the likelihood of a successful production
> access application. »*
>
> « **Agissez** sur les retours des utilisateurs […] pour augmenter les chances
> d'une demande d'accès en production réussie. »

Donc : recueillir des retours, **et corriger ce qu'ils signalent**. C'est précisément
ce que nous savons faire.

---

## Où se lisent les retours des testeurs

**Play Console → Monitor and improve → Ratings and reviews → Testing feedback**
(en français : *Suivre et améliorer → Notes et avis → Commentaires sur les tests*).

**Allez-y aujourd'hui, avant toute chose, et dites-moi ce que vous y voyez.**

- **Si la page est vide** : la cause du refus est confirmée par la console elle-même,
  et le travail des quatorze jours est entièrement décrit ci-dessous.
- **S'il y a des commentaires** : recopiez-les-moi. Ce sont eux qu'il faudra résumer
  dans le formulaire — et corriger avant, si ce sont des bugs.

---

## Le plan des quatorze jours

### Jour 0 — aujourd'hui (12/09)

1. **Ouvrir la page « Commentaires sur les tests »** (ci-dessus) et me dire ce qu'elle
   contient.
2. **Ouvrir « Prévisualiser les questions »** sur le tableau de bord et me recopier
   les trois parties (voir la liste plus bas).
3. **Vérifier les identifiants de démonstration** — voir l'encadré en fin de fiche.
   Chap.ci demande un compte pour publier ou écrire à un vendeur ; sans identifiants,
   un examinateur de Google ne voit que la moitié de l'application.

### Jours 1 à 3 — donner quelque chose à tester

4. **Construire l'AAB v1.25** — `store/BUILD-v1.25.md`, vérification n° 0 : **20 Go
   libres** sur le disque.
5. **Le déposer sur le canal de TEST FERMÉ** (jamais la production, qui vous est de
   toute façon fermée).
6. **Prévenir les douze**, avec le message prêt à copier ci-dessous.

### Jours 3 à 12 — la seule chose qui compte

7. **Relancer une fois, à mi-parcours** (vers le 19/09), gentiment, ceux qui n'ont
   rien dit.
8. **Corriger ce qu'ils signalent**, et le leur dire. C'est ce que Google appelle
   « agir sur les retours » — et c'est aussi ce qui fait revenir un testeur.

### Jour 14 — ~26/09

9. Le bouton se rallume. **On relit les réponses ensemble avant d'envoyer.** Cette
   fois, il y aura quelque chose de vrai à écrire dans « résumez vos retours ».

---

## Le message à envoyer à vos douze testeurs

À copier tel quel dans WhatsApp. Il est court exprès : un message long ne se lit pas.

> Bonjour 👋
>
> Merci de tester Chap.ci — vous êtes douze, et sans vous l'application ne peut pas
> sortir sur Google Play.
>
> **Une nouvelle version vient d'arriver.** Ouvrez le Play Store → Chap.ci → *Mettre
> à jour*. Il y a beaucoup de nouveautés depuis août : vidéo sur les annonces,
> affiche pour le statut WhatsApp, faire une offre au vendeur, offres d'emploi,
> empreinte digitale.
>
> **Trois choses à faire, cinq minutes en tout :**
> 1. Ouvrez l'application et cherchez quelque chose.
> 2. Publiez une annonce, même pour essayer — vous pourrez la supprimer.
> 3. Écrivez-moi ce qui ne va pas : ce qui est lent, ce qu'on ne comprend pas, ce qui
>    plante.
>
> **Et le plus important :** Google regarde si vous donnez votre avis *dans le Play
> Store*. Dans le Play Store, sur la page de Chap.ci, descendez jusqu'à la section du
> programme de test : il y a **« Envoyer des commentaires »**. Deux phrases suffisent,
> même « ça marche bien chez moi ». Personne d'autre que moi ne les voit.
>
> ⚠️ **Surtout, ne désinstallez pas l'application et ne quittez pas le test** avant
> le 26 septembre. Un seul départ et nous repartons pour quatorze jours.
>
> Merci 🙏

**Ce message ne promet rien de faux** — relisez-le avant de l'envoyer, c'est la règle
de ce projet. Si un des points ne correspond pas à ce que fait vraiment la v1.25,
retirez-le plutôt que de l'arrondir.

---

## Les trois parties du formulaire, à préparer

L'article officiel donne leurs titres. Ce sont les trois sections du formulaire que
vous avez rempli dans la nuit du 10 :

| Partie | Titre | Ce qu'on sait qu'elle demande |
|---|---|---|
| 1 | *About your closed test* — votre test fermé | Comment vous avez recruté les testeurs, comment vous les avez guidés, **et un résumé de leurs retours**. |
| 2 | *About your app/game* — votre application | Ce qu'elle fait, pour qui. |
| 3 | *About your production readiness* — votre préparation | Si elle est prête pour le grand public. |

Le contenu détaillé de chaque partie est **replié** dans l'article que vous m'avez
envoyé (les titres « Part 1 / Part 2 / Part 3 » sans texte dessous).

👉 **Rouvrez l'article, cliquez sur ces trois titres pour les déplier, et
copiez-les-moi.** Nous aurons alors la liste exacte des questions, écrite par Google,
quatorze jours avant d'avoir à y répondre. C'est tout ce qui a manqué la première fois.

---

## Le rapport de pré-lancement — un outil gratuit qu'on n'a jamais utilisé

L'article le signale :

> *« Set up and run a pre-launch report to proactively identify issues before reaching
> users. »*

Google installe votre application sur de **vrais appareils** dans ses laboratoires,
la parcourt tout seul, et rend un rapport : plantages, problèmes de performance,
d'accessibilité, de sécurité.

**Play Console → Test and release → Pre-launch report.** Il se déclenche tout seul
après un dépôt sur un canal de test — donc **il tournera sur la v1.25 sans que vous
demandiez rien**. Regardez-le deux jours après le dépôt et envoyez-le-moi : c'est le
seul avis sur Chap.ci qui ne vienne ni de nous ni de nos proches.

---

## ⚠️ Les identifiants de démonstration — à vérifier avant tout le reste

L'article est explicite :

> *« If your app requires user authentication, provide valid, working login
> credentials in Play Console so reviewers can fully test your app's features. »*

Chap.ci demande un compte pour **publier une annonce**, **écrire à un vendeur**,
**mettre en favori** — c'est-à-dire pour à peu près tout ce qui fait l'application.
Un examinateur sans compte ne voit que le catalogue.

**Play Console → Règles et programmes → Contenu de l'application → Accès à
l'application.** Deux cas :

- si vous avez déclaré « **Toutes les fonctionnalités sont accessibles sans
  restriction** » → **c'est inexact**, et il faut le corriger ;
- si vous avez fourni un identifiant et un mot de passe → **essayez-les vous-même**,
  sur le site, aujourd'hui. Un compte de démonstration dont le mot de passe a changé
  est pire que pas de compte du tout.

Je ne peux pas voir cet écran. **Dites-moi ce qu'il contient** et je vous dirai quoi
y écrire — un compte de démonstration se crée en deux minutes, et il sert ensuite à
chaque version.
