import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Chemin de base : '/' en local, '/Chap.ci/' pour GitHub Pages.
// Défini via la variable d'environnement VITE_BASE au moment du build.
const base = process.env.VITE_BASE ?? '/'

// ── LES ICÔNES PORTENT LEUR EMPREINTE DANS LEUR ADRESSE ─────────────────────
//
// ⚠️ POURQUOI. Le 3 septembre 2026, le Patron a tapé chap.ci sur son iPad :
// le site montrait la couronne, l'onglet montrait l'ancienne épingle. Google
// aussi — son service d'icônes servait encore le « C » sur l'épingle, alors
// que le serveur servait la couronne depuis deux jours, vérifié octet par
// octet. Safari, Google, Cloudflare gardent une icône TANT QUE SON ADRESSE NE
// CHANGE PAS : `/favicon.ico` reste `/favicon.ico`, le cache n'a aucune raison
// de redemander.
//
// C'est la même leçon que le logo des e-mails, que Gmail avait figé sur ses
// propres serveurs : la solution est dans l'adresse, pas dans le fichier.
// L'adresse porte les 8 premiers caractères du md5 du fichier — elle change
// donc EXACTEMENT quand le fichier change, et jamais autrement. Personne n'a de
// numéro à incrémenter, donc personne ne peut l'oublier.
//
// index.html reste propre dans le dépôt : le suffixe est posé au build, par le
// plugin ci-dessous. seo.php, servi par PHP, calcule le même md5 à la volée.
const empreinte = (fichier: string): string =>
  createHash('md5').update(readFileSync(`public/${fichier}`)).digest('hex').slice(0, 8)
const versionnee = (fichier: string): string => `${fichier}?v=${empreinte(fichier)}`

const iconesPlugin = {
  name: 'chapci-icones-versionnees',
  apply: 'build' as const,
  transformIndexHtml(html: string) {
    let n = 0
    const sortie = html.replace(
      /href="\/(favicon\.svg|favicon\.ico|apple-touch-icon\.png)"/g,
      (_, f: string) => { n++; return `href="/${versionnee(f)}"` },
    )
    // Trois balises dans index.html. Si l'une disparaît ou change de forme, le
    // build s'arrête ici plutôt que de livrer une icône que les caches
    // garderont pour toujours.
    if (n !== 3) throw new Error(`icônes versionnées : ${n} balise(s) trouvée(s) dans index.html, 3 attendues`)
    return sortie
  },
}

// P3 · Content-Security-Policy : limite fortement l'impact d'une éventuelle
// injection (XSS). script-src SANS 'unsafe-inline' (le point clé). Origines
// autorisées : l'app elle-même, Google Sign-In et les services de
// géolocalisation. Le modèle IA de détourage est désormais hébergé sur chap.ci
// (dossier /imgly/), donc 'self' suffit — plus aucun CDN étranger. WebAssembly
// requis par l'IA photo → 'wasm-unsafe-eval' ; workers onnx/tfjs → worker-src blob:.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval' blob: https://accounts.google.com https://www.gstatic.com https://connect.facebook.net https://analytics.tiktok.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' blob: data: https://accounts.google.com https://www.googleapis.com https://graph.facebook.com https://www.facebook.com https://api.bigdatacloud.net https://nominatim.openstreetmap.org https://ipwho.is https://ipapi.co https://analytics.tiktok.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.google.com https://tfhub.dev https://storage.googleapis.com https://www.kaggle.com",
  "worker-src 'self' blob:",
  "frame-src 'self' https://accounts.google.com https://www.facebook.com https://staticxx.facebook.com",
  "manifest-src 'self'",
].join('; ')

// Injecte la CSP dans index.html UNIQUEMENT au build de production. En dev, Vite
// a besoin de scripts inline + eval + websocket (HMR) : on ne l'applique donc pas.
const cspPlugin = {
  name: 'chapci-csp',
  apply: 'build' as const,
  transformIndexHtml(html: string) {
    return html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
    )
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [
    cspPlugin,
    iconesPlugin,
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Chap.ci — Petites annonces Côte d’Ivoire',
        short_name: 'Chap.ci',
        description:
          'Achetez et vendez partout en Côte d’Ivoire, chap-chap : Abidjan, Bouaké, Yamoussoukro… par district, région, ville et commune.',
        theme_color: '#F77F00',
        background_color: '#FFFDF9',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'fr',
        // start_url et scope sont dérivés automatiquement du `base` de Vite.
        categories: ['shopping', 'business', 'lifestyle'],
        // Même empreinte dans l'adresse que pour le favicon (voir `versionnee`
        // en tête de fichier) : une application déjà installée sur un écran
        // d'accueil garde son icône tant que l'adresse du manifeste ne change
        // pas. Avec l'ancienne épingle, donc, jusqu'à ce que ça change.
        icons: [
          {
            src: versionnee('icons/icon-192.png'),
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: versionnee('icons/icon-512.png'),
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: versionnee('icons/icon-maskable-192.png'),
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: versionnee('icons/icon-maskable-512.png'),
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Les notifications push. Workbox régénère `sw.js` à chaque build et
        // écraserait tout écouteur écrit à la main ; `importScripts` ajoute le
        // nôtre par-dessus, sans qu'il ait à connaître Workbox ni l'inverse.
        // Le fichier est dans `public/` : il arrive tel quel à la racine de dist.
        importScripts: ['push-sw.js'],
        // LA COQUILLE SEULEMENT. Le précache prenait tout le site — 108
        // fichiers, 790 Ko sur le réseau, téléchargés en arrière-plan par
        // CHAQUE nouveau visiteur après sa première page (mesuré le 06/09/2026),
        // dont les cent formulaires de sous-catégories et les pages qu'il
        // n'ouvrira peut-être jamais. Sur un forfait d'Abidjan, c'est le prix
        // d'une visite entière, pour un « hors-ligne » que personne n'a demandé.
        // Ne partent d'avance que l'entrée, ses styles, les polices et les
        // icônes ; le reste se met en cache À L'USAGE (runtimeCaching), et
        // reste servi hors-ligne une fois vu.
        // Les icônes d'installation (icons/*.png, 73 Ko) ne sont PAS
        // précachées : le téléphone ne les demande qu'au moment d'installer
        // l'application sur l'écran d'accueil, et les trouve alors en ligne.
        globPatterns: ['index.html', 'manifest.webmanifest', 'favicon.svg',
          'assets/index-*.{js,css}', 'assets/helpers-*.js', 'assets/*.woff2'],
        runtimeCaching: [{
          // Les fichiers portent leur empreinte dans leur nom : un contenu
          // donné ne change jamais d'adresse, le cache peut le garder d'abord.
          urlPattern: /\/assets\/.+\.(?:js|css|woff2)$/,
          handler: 'CacheFirst',
          options: { cacheName: 'chapci-assets', expiration: { maxEntries: 160, maxAgeSeconds: 30 * 86400 } },
        }],
        // Inutile de précharger les alphabets non-latins (cyrillique, grec,
        // vietnamien) : l'app est en français. Économise ~75 Ko de données.
        // On EXCLUT aussi les bundles IA de détourage (onnxruntime, ~800 Ko) :
        // ils ne doivent se télécharger QUE si l'utilisateur touche « Enlever le
        // décor », pas pour tout le monde au 1er chargement (données mobiles).
        globIgnores: [
          '**/*cyrillic*', '**/*greek*', '**/*vietnamese*',
          '**/ort*.js', '**/ort*.mjs', '**/ort*.wasm',
          // Brique IA d'analyse des photos (TensorFlow + modèle) — chargée à la demande.
          '**/nsfw*.js', '**/*tensorflow*', '**/*tfjs*', '**/*mobilenet*',
          // Bannières d'aperçu social (og/*.png, ~3,8 Mo) : servies aux robots
          // WhatsApp/Facebook uniquement, jamais affichées dans l'app → hors précache.
          'og/**',
          // Le service worker s'importe lui-même ce fichier : le précacher en
          // plus lui ferait servir une version figée de son propre code.
          'push-sw.js',
        ],
        // Le gros bundle IA dépasse la limite par défaut : on garde une marge
        // sans forcer sa mise en cache (il est ignoré ci-dessus de toute façon).
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    // Ne JAMAIS précharger les gros chunks IA (TensorFlow/nsfw, détourage ort) :
    // ils ne servent qu'à la publication d'une photo, pas à la navigation.
    modulePreload: {
      resolveDependencies: (_url, deps) =>
        deps.filter((d) => !/nsfw|tensorflow|tfjs|mobilenet/.test(d)),
    },
    rollupOptions: {
      output: {
        // Empêche Rollup de « hisser » les imports transitifs dans le bundle
        // d'entrée : sans ça, l'entrée importe statiquement le chunk nsfw (via une
        // dépendance transitive) et l'accueil retélécharge tout le modèle IA.
        hoistTransitiveImports: false,
        manualChunks(id) {
          // Les helpers partagés générés par Rollup/Vite (préchargement +
          // interop CommonJS) doivent rester HORS du chunk nsfw : sinon le bundle
          // principal les importe DEPUIS nsfw et l'accueil retélécharge tout le
          // modèle IA (~2,8 Mo). On les isole dans un petit chunk « helpers ».
          if (id.includes('preload-helper') || id.includes('commonjsHelpers')) return 'helpers'
          if (id.includes('nsfwjs') || id.includes('@tensorflow') || id.includes('model_imports')) {
            return 'nsfw'
          }
          return undefined
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
