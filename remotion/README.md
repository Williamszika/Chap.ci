# Studio Remotion — vidéos promo Chap.ci

Ce dossier est un projet **Remotion** autonome qui produit des **vidéos MP4**
promotionnelles animées (format 16:5, comme la bannière du site).

## ⚠️ Important — pourquoi c'est séparé du site

Remotion rend des vidéos avec un **pipeline Node.js + Chromium + ffmpeg**. Ce
pipeline **ne tourne pas sur l'hébergement cPanel** (PHP mutualisé) de chap.ci.

- L'**écran publicitaire du site** affiche donc des **textes animés en direct
  dans le navigateur** (moteur CSS `ad-anim-*` / `ad-style-*`, voir
  `src/index.css`). C'est automatique, léger, responsive et déployable tel quel
  sur cPanel — y compris les diffusions quotidiennes du **Bureau de Croissance
  SEO** (`/api/cron/seo`).
- Ce projet Remotion est **optionnel** : utilisez-le si vous voulez de vraies
  **vidéos MP4** (pour les réseaux sociaux, ou à téléverser comme visuel de pub).
  Il n'est **ni installé ni construit** par l'application Vite du site.

## Utilisation (sur votre machine, pas sur cPanel)

```bash
cd remotion
npm install

# Aperçu interactif dans le navigateur
npm run studio

# Rendre une vidéo (out/promo.mp4)
npm run render -- --props='{"title":"3 500 voitures à Abidjan","subtitle":"Trouvez la vôtre sur Chap.ci","style":"impact"}'
```

`style` : `classique` · `impact` · `neon` · `script` · `ivoire` (drapeau 🇨🇮).

## Automatiser la production vidéo (facultatif)

Le rendu vidéo peut être automatisé **hors cPanel** — par exemple via une
**GitHub Action** planifiée (`npx remotion render`), qui publie le MP4 quelque
part, puis l'ajoute comme visuel de publicité. Le site lui-même n'a pas besoin
de Node : il continue d'afficher les textes animés en direct.
