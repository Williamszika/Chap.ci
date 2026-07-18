# 🎨 Kit marketing Chap.ci

Générateur de visuels prêts à poster (Facebook 1080×1080, Story/WhatsApp 1080×1920),
à la **note ivoirienne** (orange / vert / crème, « chap-chap », FCFA, drapeau 🇨🇮).

> **Comment l'utiliser au quotidien :** dis simplement à Claude, dans une session,
> *« fais-moi un visuel promo -30 % sur l'iPhone »* ou *« un visuel Noël »* — il
> lance la bonne commande ci-dessous et te renvoie le PNG + le texte à poster.

## Lancer (session Claude Code web — Chromium est pré-installé)

```bash
node marketing/kit.mjs <type> clé=valeur clé="valeur avec espaces"
# le PNG sort dans le dossier courant (ou OUT_DIR=…)
```

## Les 6 types

| Type | À quoi ça sert | Exemple |
|------|----------------|---------|
| `vendeurs` | Attirer les **vendeurs** (post FB) | `node marketing/kit.mjs vendeurs` |
| `acheteurs` | Attirer les **acheteurs** (post FB) | `node marketing/kit.mjs acheteurs` |
| `promo` | **Éclat de prix** / soldes | `node marketing/kit.mjs promo title="iPhone 13 Pro" old=320000 new=250000` |
| `category` | Mettre en avant une **catégorie** | `node marketing/kit.mjs category cat=vehicules` |
| `event` | **Saisonnier** (fête, Noël…) | `node marketing/kit.mjs event event=noel` |
| `listing` | Une **vraie annonce** (photo + prix) | voir §« Vraies photos » |

### Paramètres

- **promo** : `title`, `old` (ancien prix), `new` (nouveau prix → le `-XX %` est
  calculé automatiquement), `percent` (si pas de prix), `image` (photo locale).
- **category** : `cat` = `vehicules` · `immobilier` · `telephones` · `electronique`
  · `mode` · `maison` · `alimentation` · `emploi`. (Ou libre : `emoji=… label=… color=#… tagline=…`)
- **event** : `event` = `independance` · `rentree` · `noel` · `nouvelan` · `ramadan`.
  (Ou libre : `title=… sub=… emoji=… c1=#… c2=#…`)
- **listing** : `title`, `price`, `location`, `image` (photo locale), `badge` (ex. « À la une »).
- Commun : `name=` pour forcer le nom du fichier de sortie.

## 📸 Vraies photos d'annonces

Chromium lit les images en **local** (pas de réseau). On télécharge donc la photo
d'abord avec `curl`, puis on la passe via `image=` :

```bash
# 1) trouver une annonce + sa photo
curl -sS https://chap.ci/api/listings | python3 -c "import sys,json;a=json.load(sys.stdin)[0];print(a['title'],'|',a['price'],'|',a.get('commune'),'|',a['images'][0])"

# 2) télécharger la photo (préfixer par https://chap.ci si le chemin commence par /uploads)
curl -sS "https://chap.ci/uploads/XXXX.jpg" -o /tmp/photo.jpg

# 3) générer le visuel
node marketing/kit.mjs listing title="Toyota Corolla 2018" price=6500000 \
     location=Cocody image=/tmp/photo.jpg badge="À la une"
```

## ✍️ Bibliothèque de textes (légendes + hashtags)

### Vendeurs
> 💸 Tes affaires qui dorment ? Transforme-les en **cash, chap-chap !** Publie ton
> annonce en 2 min, **100 % GRATUIT**, acheteurs près de toi. 🇨🇮 👉 chap.ci
> `#ChapCi #CôtedIvoire #Abidjan #PetitesAnnonces #VendreEnLigne #Business225`

### Acheteurs
> 🛍️ Les **meilleures affaires** sont près de chez toi ! Voitures, tel, immobilier,
> mode… **dès 1 000 FCFA**, sans intermédiaire. 👉 chap.ci
> `#ChapCi #BonnesAffaires #Abidjan #Occasion225 #AchatEnLigne #CôtedIvoire`

### Promo
> 🔥 **-{X} %** sur {produit} ! Seulement **{prix} FCFA** sur Chap.ci. Offre à
> saisir vite, près de chez toi. 👉 chap.ci
> `#ChapCi #Promo #Soldes225 #BonPlan #Abidjan #CôtedIvoire`

### Catégorie
> {emoji} **{Catégorie}** : des centaines d'annonces près de toi, à petit prix,
> sur Chap.ci. 👉 chap.ci
> `#ChapCi #{Catégorie} #Abidjan #CôtedIvoire #PetitesAnnonces`

### Événement
> {emoji} {message de fête} — retrouve tout ce qu'il te faut sur Chap.ci, la
> marketplace 100 % ivoirienne. 👉 chap.ci
> `#ChapCi #CôtedIvoire #Abidjan #{Événement}`

### Annonce réelle
> 🆕 {titre} — **{prix} FCFA** 📍 {commune}. Dispo maintenant sur Chap.ci, contacte
> le vendeur direct ! 👉 chap.ci
> `#ChapCi #{Catégorie} #{Commune} #BonnesAffaires #CôtedIvoire`

## 💡 Diffusion
- **Formats** : `promo/category/event/listing` = 1080×1080 (feed Facebook/Instagram).
  Pour un **statut vertical** (WhatsApp / Stories), demande la variante 1080×1920.
- **Créneaux CI** : 12h–13h et 19h–21h (forte connexion).
- Alterne **vendeurs** et **acheteurs** pour parler aux deux publics.
