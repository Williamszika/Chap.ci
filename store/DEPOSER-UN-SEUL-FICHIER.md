# Déposer un seul fichier, sans passer par un zip

Écrite le 10/09/2026, parce que le navigateur du Patron refusait de télécharger
le zip — trois tentatives, « Ein Problem ist aufgetreten », et un chantier bloqué
pour une raison qui n'avait rien à voir avec le site.

**Le zip n'est pas la seule voie.** `CLAUDE.md` le dit déjà en une ligne :
*« Extraire écrase les fichiers présents ; téléverser un fichier seul n'écrase
que lui. »* Voici la procédure, pour que ce soit une manœuvre normale et non un
bricolage d'urgence.

---

## Quand s'en servir

| Situation | La bonne voie |
|---|---|
| L'API seule change (`server/index.php`) | **cette fiche** — 1 fichier, 30 secondes |
| `seo.php` seul change | **cette fiche** |
| Le site change (`index.html` + `assets/`) | le zip — les noms des fichiers changent à chaque build, il en faut des dizaines |
| Le zip ne se télécharge pas | cette fiche pour l'API, et on cherche la panne du navigateur à côté |

---

## Ce qui rend l'opération sûre

**Vous n'écrasez QUE le fichier que vous déposez.** Rien d'autre n'est touché :
ni `api/.htaccess`, ni `api/config.php`, ni `api/data/` (vos clés, dont
`fcm.json`), ni `uploads/` (vos photos). C'est précisément l'inverse d'une
extraction, qui écrase tout ce qu'elle contient — et c'est ce qui a coupé l'API
le 2 août 2026.

---

## La procédure

### 1. Prendre le fichier — il est DÉJÀ sur votre Mac

Vous avez le dépôt cloné. Pas besoin de télécharger quoi que ce soit.

```bash
cd ~/chapci-app
git pull origin claude/ci-marketplace-mobile-app-bnllro
cp server/index.php ~/Downloads/index.php
open ~/Downloads
```

⚠️ **Le nom change en route.** Dans le dépôt il s'appelle `server/index.php` ;
sur le serveur il s'appelle `api/index.php`. Le `cp` ci-dessus fait déjà le
renommage — ne le refaites pas à la main.

Pour `seo.php`, c'est `cp web/seo.php ~/Downloads/seo.php`, et il va à la
**racine** de `public_html`, pas dans `api/`.

### 2. Vérifier que c'est le bon fichier

```bash
md5 ~/Downloads/index.php
```

Les **12 premiers caractères** doivent correspondre à l'empreinte que je vous
ai annoncée. S'ils diffèrent, le `git pull` n'a pas abouti : refaites-le.

### 3. Le déposer

1. cPanel → **Gestionnaire de fichiers**
2. Ouvrez `public_html` → puis `api`
3. Bouton **Téléverser** (en haut)
4. Glissez `index.php` depuis le Finder
5. cPanel demande de confirmer l'écrasement → **oui**

### 4. Vérifier — UNE seule requête

Ouvrez `https://chap.ci/api/health` **une fois**.

Le champ `empreinte` doit porter les 12 caractères de l'étape 2.

⚠️ Une seule requête, pas d'enchaînement. Au-delà d'une quinzaine en trente
secondes, le serveur sert une page « Bot Verification » à la place de tout, et
vos visiteurs voient des 403.

---

## Si ça tourne mal

L'ancien fichier n'est pas perdu : il est dans le dépôt, à la version d'avant.

```bash
cd ~/chapci-app
git log --oneline -5 -- server/index.php
git show <l’empreinte du commit d’avant>:server/index.php > ~/Downloads/index.php
```

Puis on redépose. Le retour arrière prend le même temps que l'aller.
