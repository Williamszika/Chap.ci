import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Chemin de base : '/' en local, '/Chap.ci/' pour GitHub Pages.
// Défini via la variable d'environnement VITE_BASE au moment du build.
const base = process.env.VITE_BASE ?? '/'

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
  "script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval' blob: https://accounts.google.com https://www.gstatic.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' blob: data: https://accounts.google.com https://www.googleapis.com https://graph.facebook.com https://www.facebook.com https://api.bigdatacloud.net https://nominatim.openstreetmap.org https://ipwho.is https://ipapi.co",
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
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
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
