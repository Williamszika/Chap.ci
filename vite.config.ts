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
          'Achetez et vendez partout en Côte d’Ivoire : Abidjan, Bouaké, Yamoussoukro… par district, région, ville et commune.',
        theme_color: '#F77F00',
        background_color: '#ffffff',
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
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${base}index.html`,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
})
