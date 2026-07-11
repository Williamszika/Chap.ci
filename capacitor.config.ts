import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Configuration Capacitor.
 *
 * Capacitor permet d'empaqueter EXACTEMENT le même code web dans de vraies
 * applications natives iOS (iPhone) et Android, publiables sur l'App Store et
 * le Google Play Store.
 *
 * Étapes pour générer les apps natives (voir README.md, section « Applications
 * mobiles ») :
 *   npx cap add android
 *   npx cap add ios
 *   npm run cap:android   # ouvre Android Studio
 *   npm run cap:ios       # ouvre Xcode (macOS requis pour iOS)
 */
const config: CapacitorConfig = {
  appId: 'ci.chap.app',
  appName: 'Chap.ci',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
  },
}

export default config
