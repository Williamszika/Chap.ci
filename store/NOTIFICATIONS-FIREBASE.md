# Faire sonner le téléphone — les trois étapes du Patron

**Pour le Patron, sur son ordinateur.** Comptez vingt minutes, une seule fois.
Aucune ligne de code à écrire.

---

## Ce que ça change

Aujourd'hui, quand un acheteur écrit à un vendeur, **le téléphone du vendeur ne
sonne pas**. Il ne l'apprend qu'en ouvrant l'application de lui-même. L'acheteur
attend, ne reçoit rien, et va voir ailleurs — souvent chez quelqu'un qui a
répondu en dix minutes.

C'est la première fuite de Chap.ci, et elle n'apparaît dans aucune mesure de
vitesse.

Après ces trois étapes : le téléphone sonne, **même application fermée**, et la
notification ouvre l'écran dont elle parle.

---

## Ce qui est déjà fait, et ce qui manque

| | état |
|---|---|
| Le serveur sait garder les téléphones (`push_natifs`) | ✅ fait le 08/09/2026 |
| Les routes que l'application appelle (`/push/native`) | ✅ fait — **elles n'existaient pas, l'application appelait dans le vide depuis le 04/09** |
| Le serveur sait envoyer vers Google (FCM HTTP v1) | ✅ fait |
| Le banc qui le prouve (`npm run banc:push-natif`) | ✅ 14 vérifications |
| **Le projet Firebase et sa clé** | ❌ **vous, ci-dessous** |
| L'application demande son jeton au téléphone | ❌ après votre étape 2 — voir la fin |

Tant que la clé n'est pas déposée, **rien ne change et rien ne casse** : le
serveur voit qu'il ne peut pas envoyer, et s'abstient. Les notifications du
navigateur et le repli par e-mail continuent exactement comme aujourd'hui.

---

## Étape 1 — Créer le projet Firebase

1. Allez sur **console.firebase.google.com**, avec le compte Google qui détient
   déjà Chap.ci sur le Play Store.
2. **Créer un projet** → nom : `Chap.ci` → Continuer.
3. Google Analytics : **désactivez-le**. Il n'apporte rien ici et ajoute des
   écrans de configuration.
4. Attendez la création, puis **Continuer**.

---

## Étape 2 — Déclarer l'application Android

1. Sur la page d'accueil du projet, cliquez sur l'icône **Android**.
2. **Nom du package** : tapez exactement `ci.chap.app` — c'est l'identifiant de
   votre application, celui du Play Store. Une faute ici et rien ne sonnera.
3. Surnom : `Chap.ci` (sans importance).
4. **Certificat SHA-1** : celui de la Play Console → **Configuration →
   Intégrité de l'application**. Copiez-collez-le.
   > ⚠️ **Il se lit là, jamais dans votre fichier `.jks`.** Personne ne doit
   > vous demander votre keystore ni son mot de passe — ni moi, ni aucun
   > prestataire. Une telle demande est une tentative d'extorsion.
5. **Enregistrer l'application**.
6. Google fait télécharger **`google-services.json`**. **Gardez ce fichier**,
   il servira au prochain build de l'application.
7. Les écrans suivants (« Ajoutez le SDK Firebase », « Suivant ») : cliquez
   **Suivant**, puis **Passer à la console**. Rien à faire, c'est mon travail.

---

## Étape 3 — La clé du serveur, et où la déposer

1. Dans la console Firebase : la **roue dentée** en haut à gauche →
   **Paramètres du projet**.
2. Onglet **Comptes de service**.
3. Bouton **Générer une nouvelle clé privée** → **Générer la clé**.
4. Un fichier `.json` se télécharge. **C'est un secret** : il donne le droit
   d'envoyer des notifications en votre nom. Ne l'envoyez à personne, ne le
   mettez jamais dans le dépôt.
5. **Renommez-le `fcm.json`** (exactement ce nom, en minuscules).
6. Déposez-le sur le serveur :

   **cPanel → Gestionnaire de fichiers → `public_html/api/data/`**
   → bouton **Téléverser** → choisissez `fcm.json`.

   > C'est le même dossier que `push.json` et `smtp.json`. Il est refusé au web :
   > personne ne peut le télécharger depuis Internet.

7. Clic droit sur `fcm.json` → **Permissions** (ou « Change Permissions ») →
   mettez **0600** (lecture et écriture pour le propriétaire seulement, rien
   pour les autres).

C'est tout. Le serveur le lit au premier appel suivant.

---

## Vérifier que c'est pris

Ouvrez **une seule fois** :

```
https://chap.ci/api/health
```

Rien de nouveau n'apparaît là — la clé Firebase n'est jamais exposée. La vraie
vérification vient du téléphone, après le prochain build de l'application.

⚠️ **Une seule requête**, et pas d'enchaînement : au-delà d'une quinzaine en
trente secondes, le serveur sert une page « Bot Verification » à la place de
tout, et vos visiteurs voient des 403.

---

## Ce qu'il reste à faire après vos trois étapes — et qui me revient

Prévenez-moi dès que `fcm.json` est en place. Il me restera, dans
l'application :

1. ajouter le paquet `firebase_messaging` à `pubspec.yaml` ;
2. poser votre `google-services.json` dans `android/app/` (vous me direz
   comment vous préférez me le transmettre — **ce fichier-là n'est pas un
   secret**, il est de toute façon embarqué dans l'APK que tout le monde
   télécharge) ;
3. passer `PushNatif.disponible` à `true` et brancher la demande de jeton ;
4. reconstruire l'application.

**Pourquoi je ne l'ai pas déjà fait :** ajouter `firebase_messaging` sans le
`google-services.json` **casse la compilation Android**. Votre build de ce soir
ne passerait plus. Le code attend donc, prêt, derrière un interrupteur qui ne
demande qu'à être tourné.

---

## Le jour où quelque chose ne sonne pas

Le serveur écrit la raison dans son journal d'erreurs, sans jamais y mettre un
morceau de la clé :

| Ce que le journal dit | Ce que c'est |
|---|---|
| `fcm.json présent mais incomplet` | Le fichier n'est pas celui du compte de service. Refaites l'étape 3. |
| `jeton refusé (400) : invalid_grant` | L'horloge du serveur a dérivé de plus de cinq minutes. C'est l'hébergeur qui la remet à l'heure. |
| `jeton refusé (403)` | La clé a été révoquée dans la console Firebase. Générez-en une nouvelle. |

Un appareil qui répond 404 ou 403 est effacé tout seul de la base : c'est une
application désinstallée. Sans cela, la table se remplit de fantômes et chaque
notification paie leur silence.
