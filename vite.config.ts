import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Chemin de base : '/' en local, '/Chap.ci/' pour GitHub Pages.
// Défini via la variable d'environnement VITE_BASE au moment du build.
const base = process.env.VITE_BASE ?? '/'

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [
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
          '**/nsfw*.js', // brique IA d'analyse des photos (TensorFlow + modèle) — à la demande
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
    rollupOptions: {
      output: {
        // Isole l'IA d'analyse des photos (TensorFlow.js + modèle NSFW ~4 Mo)
        // dans un chunk nommé « nsfw » : chargé à la demande (à la publication
        // d'une photo) et EXCLU du précache PWA (cf. globIgnores) — aucun
        // surcoût de données pour les visiteurs qui ne publient pas.
        manualChunks(id) {
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
