# Mettre Chap.ci en ligne — la procédure

Tout tient dans un seul fichier : `chapci-complet.zip`. Il se décompresse dans
`public_html` et remplace le site. Comptez cinq minutes.

---

## Avant de commencer : ce qu'il ne faut JAMAIS supprimer

Ces trois-là **ne sont pas dans le zip**. Si vous les perdez, vous perdez le site.

| | |
|---|---|
| `api/config.php` | vos identifiants de base de données et le secret des sessions |
| `api/uploads/` | **toutes les photos des annonces** |
| `api/data/` | la base et les sauvegardes |

Le zip ne les touche pas. Il suffit de ne jamais « vider le dossier » avant
d'extraire.

`api/.htaccess` non plus n'est pas dans le zip — c'est lui qui protège les trois
précédents. Ne le remplacez jamais par celui de la racine.

---

## Les six étapes

### 1. Ouvrir le gestionnaire de fichiers

**cPanel** → **Gestionnaire de fichiers** → dossier **`public_html`**.

### 2. Afficher les fichiers cachés — une seule fois

En haut à droite : **Paramètres** → cocher **« Afficher les fichiers cachés
(dotfiles) »** → **Enregistrer**.

Sans cela, vous ne verrez jamais le `.htaccess`, et vous ne pourrez pas vérifier
qu'il a bien été remplacé.

### 3. Téléverser

Bouton **Téléverser** → choisir `chapci-complet.zip` → attendre la fin (≈ 17 Mo)
→ **« Retour à … public_html »**.

### 4. Extraire

Clic droit sur `chapci-complet.zip` → **Extraire** → confirmer `/public_html` →
**Extract Files**.

Quand cPanel demande d'écraser les fichiers existants : **acceptez**.

> **La distinction qui compte.** L'**extraction** écrase les fichiers existants.
> Le **téléversement direct** d'un fichier, lui, ne les écrase pas : cPanel crée
> une copie nommée `index (2).php`. C'est pourquoi on passe toujours par le zip —
> et pourquoi, si vous déposez un fichier seul, il faut ensuite supprimer
> l'ancien et renommer le nouveau à la main.

### 5. Supprimer le zip

Clic droit sur `chapci-complet.zip` → **Supprimer**. Il ne sert plus et pèse
17 Mo sur votre quota.

### 6. Vérifier — trois adresses

| Adresse | Attendu |
|---|---|
| `https://chap.ci` | le site s'affiche |
| `https://chap.ci/api/health` | `{"ok":true}` |
| `https://chap.ci/suppression-compte` | la page s'ouvre — **c'est celle que Google Play teste** |

Si le site montre encore l'ancienne version, faites **Ctrl + Maj + R** : c'est
votre navigateur qui garde la page en cache, pas le serveur.

---

## Le cas particulier du `.htaccess` de la racine

Quand **seul** le `.htaccess` change, inutile de déployer 17 Mo. Ne le téléversez
pas non plus — il serait renommé. Passez par l'éditeur :

`public_html` → clic droit sur **`.htaccess`** → **Éditer** → tout sélectionner →
coller le nouveau contenu → **Enregistrer**.

Vérifiez que la première ligne dit bien *« .htaccess de la RACINE du site »*.
Si elle ne le dit pas, vous êtes dans celui de `api/` : fermez sans enregistrer.

---

## En cas de problème

**Erreur 500 sur tout le site** → le `.htaccess` est incomplet. Rouvrez-le et
recollez-le en entier.

**Le site s'affiche mais l'API répond 500** → `api/index.php` est à moitié
écrasé, ou un `index (2).php` traîne à côté. Vérifiez le dossier `api/`.

**Vos identifiants deviennent lisibles en ligne** (`/api/config.php` répond 200
au lieu de 403) → `api/.htaccess` a été écrasé. Prévenez immédiatement le
Développement.
