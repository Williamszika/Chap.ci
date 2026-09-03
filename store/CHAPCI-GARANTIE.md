# Chap.ci Garantie — ce qui doit exister avant la première ligne de code

**Pour le Patron.** Ce dossier ne contient pas de code, et c'est voulu. La
nouveauté n° 7 — l'acheteur paie Chap.ci par Mobile Money, l'argent est bloqué,
le vendeur livre, l'argent part quand l'acheteur confirme — est **le**
différenciateur de confiance. Mais c'est aussi la seule des sept nouveautés qui
ne dépend pas d'abord du développement : elle dépend de trois choses qui
n'existent pas encore, et qui ne peuvent venir que de vous.

Le jour où ces trois choses existent, le code suit en quelques semaines. Avant,
tout code écrit serait écrit dans le vide.

---

## 1. Un partenaire de paiement agréé — vous avez déjà Geniyus Pay

**Chap.ci ne doit JAMAIS détenir l'argent.** Garder les fonds d'un acheteur sur
un compte Chap.ci en attendant la livraison, c'est de la monnaie électronique
au sens de la réglementation BCEAO : une activité réservée aux établissements
agréés. Ce n'est pas un détail technique, c'est ce qui sépare une place de
marché d'une banque sans licence.

La seule forme possible : **un établissement agréé encaisse et retient**, sur
instruction de Chap.ci, et **libère** sur instruction de Chap.ci. Chap.ci donne
des ordres ; il ne touche pas l'argent.

Les questions à poser à Geniyus Pay, par écrit, avant toute autre chose :

| Question | Pourquoi elle décide de tout |
|---|---|
| Proposez-vous un **encaissement avec rétention** (séquestre, « escrow », « paiement différé ») — l'argent encaissé chez vous, libéré au vendeur sur notre ordre ? | Sans cette brique, la Garantie n'existe pas. Un simple « paiement marchand » qui verse tout de suite au vendeur ne sert à rien. |
| Le **remboursement** à l'acheteur est-il possible depuis la rétention, sans passer par le vendeur ? | C'est le cas du litige perdu par le vendeur. |
| Quels sont vos **frais** : à l'encaissement, à la libération, au remboursement ? Fixes ou en pourcentage ? | Ils décident du prix minimum où la Garantie a un sens. Sur un objet à 5 000 FCFA, 3 % + 100 FCFA de frais, c'est trop. |
| Quels **réseaux** : Orange Money, MTN MoMo, Wave, Moov Money ? | À Abidjan, sans Wave et Orange Money, c'est mort. |
| Quelles **obligations d'identification** (KYC) pour le vendeur qui reçoit l'argent ? Un numéro Mobile Money suffit-il, ou faut-il une pièce ? | Ça décide si la Garantie est ouverte à tous les vendeurs, ou seulement aux vérifiés. |
| Avez-vous une **API** documentée, un environnement de test, et des **notifications** (webhook) quand un paiement arrive ? | Sans environnement de test, le banc de Chap.ci ne peut pas exister — et rien ne se livre sans banc. |
| Quel **délai maximal de rétention** acceptez-vous ? | Une livraison à Bouaké prend des jours ; un litige, des semaines. |

Si la réponse à la première question est non, il faut un autre partenaire —
CinetPay, PayDunya, ou un contact direct avec Wave — avant de continuer.

**Une règle, la même que pour le keystore : la clé d'API du partenaire ne
transite jamais par moi, ni par un bureau, ni par le dépôt.** Elle ira dans
`api/config.php`, chez vous, le jour venu. Quiconque vous la demande vous
demande votre caisse.

---

## 2. Les conditions écrites — le contrat que l'acheteur et le vendeur acceptent

Ce sont elles qui feront de la Garantie une chose sérieuse, pas le code. Il
faut les écrire **avant**, parce que chaque ligne devient un état, un bouton,
un délai dans le programme. Et il faut qu'un juriste ivoirien les relise : la
loi n° 2016-412 sur la consommation et les textes BCEAO sur les services de
paiement s'appliquent, et je ne suis pas en mesure de vous garantir leur
lecture.

Les décisions à prendre, une par ligne :

1. **Ce que la Garantie couvre.** L'objet n'arrive pas ; l'objet arrive mais
   n'est pas celui de l'annonce ; l'objet est abîmé. Et ce qu'elle ne couvre
   pas : l'acheteur qui change d'avis, l'usure normale, ce qui a été vu et
   accepté à la remise.
2. **Le prix de la Garantie**, et qui le paie. Un pourcentage sur l'acheteur ?
   Sur le vendeur ? Partagé ? Gratuit au lancement pour amorcer ? Ce
   pourcentage doit couvrir les frais du partenaire (§ 1) ET le temps de la
   personne qui tranche (§ 3).
3. **Le délai de confirmation.** Une fois l'objet reçu, l'acheteur a *N* jours
   pour dire « c'est bon » ou « il y a un problème ». Passé le délai sans un
   mot : libération automatique au vendeur. Sans cette règle, un acheteur qui
   ne répond pas bloque l'argent d'un vendeur pour toujours. Deux ou trois
   jours est l'usage.
4. **La preuve de livraison.** Remise en main propre : l'acheteur confirme dans
   l'application, devant le vendeur. Livraison par coursier : quelle preuve ?
   Un numéro de suivi ? Une photo ? C'est le point le plus flou et le plus
   disputé de tous les systèmes de ce genre.
5. **Le litige.** Qui l'ouvre, dans quel délai, quelles preuves (photos,
   messages de la conversation — que Chap.ci a déjà), en combien de jours il
   est tranché, et si la décision est contestable.
6. **Le remboursement.** Total, partiel, et sur quel compte — le même Mobile
   Money que celui du paiement, toujours.
7. **Les plafonds.** Un montant maximal par transaction au début (par exemple
   200 000 FCFA), le temps de voir comment les gens s'en servent — et
   comment les fraudeurs s'en servent.

---

## 3. Quelqu'un pour trancher les litiges

C'est le point qu'on oublie, et celui qui coûte le plus. Un litige, c'est deux
personnes qui disent le contraire l'une de l'autre, avec de l'argent au
milieu. Une machine ne tranche pas ça, et ne doit pas : la décision engage
Chap.ci.

Il faut donc :

- **une personne nommée** (vous, au début), avec un **délai** (48 h ?) pour
  répondre à un litige ouvert ;
- **un écran** pour elle — les preuves des deux côtés, la conversation, un
  bouton « rembourser » et un bouton « libérer » — c'est la seule partie de
  la Garantie que le tableau de bord admin devra porter ;
- **une trace** : chaque décision écrite, avec sa raison, dans le journal
  d'audit (qui existe déjà).

Compter, au début, une heure par litige. Si la Garantie prend, ce sera un
temps plein.

---

## 4. Ce que le code fera, le jour venu — pour que vous voyiez l'ampleur

Écrit ici pour fixer les idées, pas pour être construit maintenant.

```
Acheteur : « Payer avec Chap.ci Garantie »
   → Chap.ci demande au partenaire d'encaisser et de retenir
   → le partenaire notifie « payé » (webhook)
   → l'annonce passe « vendue, en attente de livraison »
   → le vendeur livre
   → l'acheteur confirme (ou le délai passe)      → libération au vendeur
   → ou l'acheteur ouvre un litige                → la personne du § 3 tranche
                                                  → libération OU remboursement
```

Ce que ça demande côté programme : une table des transactions avec leurs
états, trois routes vers le partenaire (encaisser-retenir, libérer,
rembourser), la réception de ses notifications, les écrans acheteur, vendeur
et arbitre, les notifications à chaque état, et un banc qui joue le partenaire
en faux — comme le banc du moteur de vision joue Claude en faux. Quelques
semaines de travail, une fois les trois points ci-dessus réglés.

Ce que ça réutilise : la conversation (les preuves y sont), les offres
(le prix accepté devient le montant à payer — c'est pour ça que « accepter
n'est pas payer » a été écrit sous le bouton), les notifications, le journal
d'audit, le module comptable (la commission est une recette).

---

## 5. Ce qu'il ne faut pas faire

- **Ne pas encaisser sur un compte Chap.ci « en attendant ».** C'est de la
  monnaie électronique sans agrément. Même pour un essai.
- **Ne pas lancer sans plafond.** Le premier mois, une seule affaire à
  2 000 000 FCFA qui tourne mal suffit à couler la confiance.
- **Ne pas promettre « remboursé ou satisfait ».** Promettre ce que les
  conditions du § 2 disent, pas plus.
- **Ne pas m'envoyer la clé du partenaire.** Ni à personne.

---

## Par où commencer, cette semaine

1. Écrire à Geniyus Pay les sept questions du § 1. Leur réponse décide de la
   suite ; sans elle, rien d'autre n'avance.
2. Répondre pour vous-même aux sept décisions du § 2, sur une page.
3. Trouver le juriste qui relira cette page.

Quand ces trois choses seront faites, dites-le-moi : le code viendra, avec son
banc, et pas avant.
