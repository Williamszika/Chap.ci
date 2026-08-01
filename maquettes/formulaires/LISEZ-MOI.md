# Formulaires d'annonce — sources des aperçus

Les **schémas de champs** de chaque catégorie, tels que validés en aperçu avec
le Patron avant toute mise sur le site. Rien ici n'est branché à l'application :
ce sont les sources qui servent à fabriquer les aperçus manipulables.

## Ce qu'il y a dedans

| Fichier | Catégorie | Sous-catégories |
|---|---|---|
| `tel2-data.js` | Téléphones *(fusionné dans Électronique)* | 5 |
| `veh-data.js` | Véhicules | 7 |
| `mode-data.js` | Mode & Beauté | 6 |
| `elec-data.js` | Électronique *(téléphones compris)* | 11 |
| `mai-data.js` | Maison & Meubles | 6 |
| `emp-data.js` | Emploi | 5 |
| `srv-data.js` | Services | 6 |
| `ali-data.js` | Alimentation & Agriculture *(fusionnées)* | 10 |
| `ani-data.js` | Animaux | 6 |
| `pro-data.js` | Matériel Pro | 7 |
| `loi-data.js` | Loisirs & Sport | 6 |
| `beb-data.js` | Bébé & Enfant | 6 |
| `san-data.js` | Santé & Bien-être | 6 |
| `_moteur.js` | le moteur commun (rendu, aperçu acheteur, blocages) | — |

## Le contrat de données

Chaque fichier expose trois variables globales :

- `SOUS` — la liste des sous-catégories, dans l'ordre d'affichage.
- `TOUTES_COULEURS` / `PALETTE_BASE` — les pastilles. **Une liste vide** quand
  la catégorie n'a pas de couleur (Emploi, Services, Alimentation).
- `SCHEMAS` — un objet, une clé par sous-catégorie.

Un schéma porte :

```
couleurs   true | false | function(S)   le bloc couleur s'affiche-t-il ?
palette    tableau | function(S)        quelle liste de pastilles
etat       true | false | function(S)   neuf / occasion
livraison  true | false
prixLabel  'Salaire mensuel', 'Tarif à partir de'…
titre      function(S) → le titre composé automatiquement
champs     [ … ]
```

Un champ porte :

```
k        clé            l   libellé          req    obligatoire
o        options        t   'text'|'num'|'toggle'   multi  choix multiple
when     function(S)    → le champ n'apparaît que si vrai
dependDe + table        → les options viennent d'un autre champ
varOK    + lVar         → la valeur peut changer d'une couleur à l'autre
h        texte | function(S) → l'aide. Un « ! » en tête la passe en ROUGE.
alerte   { bon, ok[], texteBon, texteMauvais, textes{} }  → le bandeau de la fiche
bloque   [valeurs] + motifBloc  → ces réponses REFUSENT la publication
```

**Un seul champ `alerte` par sous-catégorie** : c'est lui qui devient le bandeau.
Le moteur ignore les champs `multi` pour ce rôle (on comparerait un tableau à
une chaîne).

## Refabriquer un aperçu

```
node build.mjs <prefixe> "<Titre>" apercu-x.html   # assemble données + moteur + polices
node verif.mjs apercu-x.html                        # parcourt chaque sous-catégorie
```

`build.mjs` a besoin, dans le même dossier : `mode-head.html` (le gabarit),
`fonts.css` (les polices en base64) et `<prefixe>-plan.js` (la page « Ce qui
change »). Ces trois fichiers vivent dans le dossier de travail de la session,
pas dans le dépôt — ils pèsent lourd et ne servent qu'à la fabrication.

## Les vingt-et-un refus

Répartis sur onze catégories, chacun fondé sur une règle réelle — et chacun
accompagné de la marche à suivre, parce qu'un refus sans issue pousse à
contourner. Voir le tableau récapitulatif remis au Patron.
