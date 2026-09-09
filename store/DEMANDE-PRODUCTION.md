# Demander l'accès en production — la fiche de la demande

Le **10/09/2026 à 00 h 35**, la Play Console a barré les trois conditions :

| Condition | État |
|---|---|
| Publier une version de test fermé | ✅ v1.20, code 21, le 15/08/2026 |
| Avoir au moins 12 testeurs inscrits | ✅ 12 |
| Faire tourner le test 14 jours d'affilée avec ces 12 testeurs | ✅ |

Le bouton bleu **« Demander à publier en production »** est actif. C'est le
verrou qui séparait Chap.ci du grand public depuis le 15 août.

---

## D'abord : ce que ce bouton fait, et ce qu'il ne fait pas

**Il ne publie rien.** Personne ne verra l'application sur Google Play parce
que vous avez cliqué. Il ouvre une **demande d'autorisation** : Google examine
votre compte et votre test fermé, puis vous accorde — ou non — le *droit* de
publier un jour en production.

**Il ne change rien pour vos 12 testeurs.** Ils gardent la v1.20 du 15 août.

**Il ne choisit pas la version qui sortira.** Cela viendra après, et ce sera la
v1.25 — pas la v1.20 vieille de trois semaines et demie.

Autrement dit : la demande et le build de la v1.25 sont **deux chantiers
parallèles**. Aucun n'attend l'autre.

---

## L'ordre, et pourquoi cet ordre

### 1. Ce soir : ouvrir le formulaire, LE LIRE, ne rien envoyer

Cliquez sur **Demander à publier en production**. Un formulaire s'ouvre avec des
questions sur votre test fermé.

**Ne répondez pas tout de suite. Recopiez-moi les questions.** Je ne connais pas
leur formulation exacte, et elle change avec le temps — je ne vais pas vous faire
écrire des réponses à des questions que je devine.

Si à un moment l'écran vous demande de confirmer un envoi : **arrêtez-vous**.

### 2. Pourquoi ne pas attendre la v1.25 pour faire la demande

Parce que les 14 jours sont **fragiles**. Déposer une nouvelle version ne remet
pas le compteur à zéro, mais **un seul testeur qui désinstalle le casse**, et il
faut alors tout recommencer — quatorze jours perdus, dont vous n'auriez la
nouvelle qu'en revenant sur cette page.

Aujourd'hui la condition est remplie. Chaque jour d'attente est un jour où elle
peut se défaire toute seule, sans prévenir. On dépose la demande pendant qu'elle
tient.

### 3. Pourquoi ne pas envoyer les réponses cette nuit non plus

Parce qu'une demande refusée coûte plus cher qu'une nuit de sommeil. Je ne sais
pas dans quelles conditions Google autorise une seconde tentative, et ce n'est
pas le genre de chose qu'on découvre en essayant.

Une demande bien remplie demande une heure et se fait une fois.

---

## La règle qui vaut plus que toutes les autres : n'écrivez que du vrai

Le 27/07/2026, il a fallu réécrire toute la fiche du store : elle annonçait
« des milliers d'annonces » et « des milliers d'acheteurs » pour un catalogue de
**3 annonces** et **84 visiteurs par mois**. C'était un risque au regard du
Règlement sur les métadonnées de Google, et surtout une promesse qui aurait fait
désinstaller dès le premier écran.

La même règle vaut ici, en plus sévère : ce formulaire est **une déclaration à
Google**.

**Je ne vous écrirai jamais de réponse à la place de vos testeurs.** Ce qu'ils
vous ont dit, comment vous les avez trouvés, ce que vous en avez tiré — vous
seul le savez, et c'est précisément ce que Google veut lire. Une réponse
inventée qui sonne bien est le seul vrai danger de cette démarche.

Ce que je peux faire, et que je ferai : mettre en forme ce que vous me direz,
dans un français propre, et y ajouter les faits vérifiables du projet que vous
n'avez pas en tête.

---

## Les faits du projet, si le formulaire les demande

Prenez-les ici plutôt que de les chercher.

| | |
|---|---|
| Nom sur le store | Chap.ci — Petites annonces CI |
| Identifiant | `ci.chap.app` |
| Pays visé | Côte d'Ivoire (et, depuis le 06/09, les comptes hors CI dans 117 pays) |
| Version des testeurs | **v1.20, code 21** — déposée le 15/08/2026 |
| Version prête, non déposée | **v1.25, code 26** — commit `7b931b4` |
| Ce que fait l'application | Publier une annonce avec photos et vidéo, chercher par catégorie et par commune, écrire au vendeur, mettre en favori. Comptes professionnels : boutique, stock, offres d'emploi, abonnés. |
| Modèle économique | Gratuit, **sans commission**. Un écran « Soutenir Chap.ci » propose un don par Mobile Money, jamais imposé. |
| Ce qui a changé depuis la v1.20 | **37 chantiers** entre le 15 août et le 8 septembre, tous listés dans `store/APP-VERSIONS.md` et résumés dans `store/BUILD-v1.25.md`. |

---

## Après l'accord (et seulement après)

1. Construire l'AAB v1.25 — `store/BUILD-v1.25.md`, l'encadré Firebase compris.
2. Le déposer d'abord sur le **canal de test fermé**, pas en production. Vos 12
   testeurs sont votre dernier filet : c'est là qu'on voit si les notifications
   sonnent vraiment.
3. Les notes de version en français — modèle dans `store/notes-version-v1.20.md`.
4. Puis seulement, la production.

---

## ✅ DEMANDE ENVOYÉE — 10/09/2026 à 01 h 04

Le Patron a rempli et envoyé le formulaire dans la nuit, sans passer par l'étape
de relecture prévue plus haut. C'est fait, et on ne revient pas dessus.

La Play Console affiche :

> **Nous avons reçu votre demande d'accès en production.** Votre formulaire de
> demande est en cours d'examen. Nous enverrons un e-mail au titulaire du compte
> pour le tenir informé. Cela prend généralement sept jours ou moins, mais ce
> délai peut parfois être plus long.

Réponse attendue vers le **17/09/2026**, sans garantie.

---

## Pendant l'examen — les quatre règles

### 1. NE PERDEZ AUCUN TESTEUR. C'est la seule qui peut tout casser.

Les quatorze jours d'affilée ne sont pas un trophée définitif : ils décrivent un
état, et cet état continue d'exister pendant l'examen. Un testeur qui désinstalle
ou se désinscrit maintenant peut le défaire.

**Ne retirez personne de la liste. Ne demandez à personne de désinstaller.** Si
quelqu'un part quand même, dites-le-moi le jour même.

### 2. Surveillez la boîte mail du titulaire du compte — et les indésirables

C'est le seul canal par lequel Google répond. Les messages de la Play Console
tombent régulièrement dans les indésirables. Regardez-y au moins une fois.

### 3. N'envoyez pas de seconde demande

Une seule est en cours. En redéposer une par impatience ne l'accélère pas.

### 4. La v1.25 continue, mais sur le canal de test — jamais en production

Construire l'AAB et le déposer chez vos 12 testeurs pendant l'examen est normal :
un test fermé vivant est plutôt bon signe. Deux précautions quand même :

- **Faites-le réveillé**, pas à une heure du matin. Un mauvais dépôt pendant
  l'examen est le pire moment pour en faire un.
- **Le canal de test fermé, pas la production** — de toute façon la production
  vous est encore fermée, mais l'habitude se prend maintenant.

---

## ⚠️ À écrire pendant que c'est frais : ce que vous avez répondu

**Aujourd'hui vous vous en souvenez. Dans sept jours, non.**

Si la demande est refusée, l'e-mail de Google dira *pourquoi* — et pour corriger,
il faudra savoir *ce qui a été écrit*. Sans ça, on repart de zéro à l'aveugle sur
une démarche qui a coûté quatorze jours.

Recopiez ci-dessous, de mémoire, question par question, aussi fidèlement que
possible. Pas besoin d'être joli : il faut être exact.

```
Question 1 :
Ma réponse :

Question 2 :
Ma réponse :

Question 3 :
Ma réponse :
```

*(Envoyez-les-moi, je les mets en forme ici.)*
