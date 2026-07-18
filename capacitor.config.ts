import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Configuration Capacitor.
 *
 * Capacitor empaquette EXACTEMENT le même code web dans de vraies applications
 * natives iOS (iPhone) et Android, publiables sur l'App Store et Google Play.
 *
 * Générer les apps natives (voir GUIDE-STORES.md) :
 *   npm run build
 *   npx cap add android
 *   npx cap add ios          # macOS requis
 *   npm run assets           # génère icônes + splash depuis assets/
 *   npm run cap:android      # ouvre Android Studio
 *   npm run cap:ios          # ouvre Xcode (macOS)
 */
const config: CapacitorConfig = {
  appId: 'ci.chap.app',
  appName: 'Chap.ci',
  webDir: 'dist',
  backgroundColor: '#FFFDF9',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    // Requêtes réseau via la couche native : l'app (capacitor://localhost) peut
    // ainsi appeler https://chap.ci/api sans être bloquée par le CORS du navigateur,
    // et les cookies de session sont gérés nativement.
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#FFFDF9',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
  },
}

export default config
