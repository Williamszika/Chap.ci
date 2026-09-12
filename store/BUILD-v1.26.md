# v1.26 — versionCode 27 · construire

**Cette fiche est courte exprès : elle ne dit QUE ce qui change depuis la v1.25.**
Tout le reste — la place sur le disque, le fichier Firebase, la signature, la
lecture des erreurs, le téléversement, la dernière porte — est dans
**`store/BUILD-v1.25.md`**, corrigée six fois le 12/09 et à jour.

| | |
|---|---|
| versionCode · versionName | **27** · **1.26.0** (déjà dans `pubspec.yaml`) |
| Pourquoi 27 | **le code 26 est BRÛLÉ** — reçu par Google le 12/09 à 23:36 et déployé sur le canal fermé. Un dépôt en 26 sera refusé. |
| Ce que les testeurs ont | **v1.25 (code 26)**, depuis le 12/09 à 23:36 |
| Ce qu'elle ajoute | **l'avis sur l'application** — carte d'accueil qui renvoie sur le Play Store, nos étoiles en second, admin « Avis appli » |

---

## Les commandes communes aux deux chantiers

Que vous vouliez l'iPhone ou l'AAB, on commence pareil :

```bash
cd ~/chapci-app/flutter_app
git pull
flutter pub get
dart run tool/preparer_plateformes.dart
```

⚠️ **Si `git pull` répond quoi que ce soit d'inattendu**, remontez d'un cran
(`cd ~/chapci-app && git pull`) : `git pull` se lance depuis la racine du dépôt.

**Une ligne nouvelle apparaît dans la sortie**, et c'est normal :

```
• Version de l’application : 1.26.0+27 (lib/version_generee.dart)…
```

C'est ce fichier qui fait partir le numéro de version avec chaque avis reçu.

---

## A. L'iPhone (5 à 10 minutes)

Branchez l'iPhone, déverrouillez-le, puis :

```bash
flutter run --release
```

Reparti pour 7 jours.

> **Ce que vous pourrez essayer, et ce que vous ne pourrez pas.** La carte d'avis
> apparaît **au 2ᵉ lancement** : fermez l'application et rouvrez-la. Sur iPhone,
> **le bouton « Noter sur le Play Store » n'existe pas** — il n'y a pas de fiche
> App Store, et l'afficher enverrait les gens sur une page inutilisable. Vous y
> verrez donc « Donner mon avis → », le chemin de nos étoiles. **Pour essayer le
> bouton du Play Store, il faut un téléphone Android.**

---

## B. L'AAB pour le Play Store

```bash
flutter build appbundle --release
```

**Votre signature est déjà en place** — `android/key.properties` survit d'un build
à l'autre. Deux vérifications à dix secondes si vous voulez en être sûr :

```bash
ls -l "$(grep '^storeFile=' android/key.properties | cut -d= -f2-)"
grep -c VOTRE_MOT_DE_PASSE android/key.properties
```

Le premier doit afficher votre `.jks`, le second **`0`**.

Vous cherchez :

```
✓ Built build/app/outputs/bundle/release/app-release.aab (…)
```

**Relevez le poids** — la v1.25 faisait 69,3 Mo, et l'écart dira si l'avis a
alourdi quoi que ce soit (il ne devrait pas : aucun greffon natif n'a été ajouté).

---

## ⚠️ TÉLÉVERSER MAINTENANT ? C'est une décision, pas une étape.

**Construire ne coûte rien. Déposer, si.** Trois choses à peser :

| Pour | Contre |
|---|---|
| Une nouvelle version **rappelle l'application** à vos douze testeurs, et la carte les envoie noter sur le Play Store — exactement ce que Google mesure. | **Ils ont reçu la v1.25 il y a quelques heures.** Deux mises à jour en un jour, ça ressemble à une application qui tremble. |
| La carte d'avis est **la seule chose du dépôt** qui puisse faire monter le compteur avant le 26/09. | **Le rappel à chaque lancement n'a jamais tourné chez personne.** S'il agace, ce sont vos douze testeurs qu'il agace — et un désabonnement remet les quatorze jours à zéro. |

**Ce que je ferais :** construire les deux aujourd'hui, **essayer la carte
vous-même** (iPhone pour le formulaire, un Android pour le bouton du magasin), et
**déposer l'AAB dans deux ou trois jours** — le temps que la v1.25 ait vécu, et
que vous ayez vu la carte se comporter normalement.

Mais c'est votre décision, et l'urgence du 26 septembre est réelle.

---

## Quand vous déposerez

Tout est dans `store/BUILD-v1.25.md` → « Téléverser », y compris **la dernière
porte** (*Publication → Vue d'ensemble → Envoyer les modifications pour examen*)
qui a laissé deux versions en brouillon par le passé.

Les notes de version : `store/notes-version-v1.25.md` sert de modèle. Pour la
v1.26, une ligne suffit — c'est une petite version :

```
<fr-FR>
Vous pouvez maintenant noter Chap.ci et nous dire ce qui va ou ne va pas.
Votre avis va droit au développeur. 🧡
</fr-FR>
```
