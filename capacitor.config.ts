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
      // 1200 ms d'image FIXE, puis le contenu d'un coup : l'application ne
      // montrait jamais l'écran de marque animé du site (#app-splash dans
      // index.html), qui était retiré pendant que l'image le recouvrait
      // encore. Deux lancements différents pour le même produit.
      //
      // On raccourcit donc l'image native au strict nécessaire — le temps que
      // la WebView peigne index.html, qui est un fichier local — et c'est
      // l'écran animé qui prend le relais. Le fond est le même des deux côtés,
      // le passage de l'un à l'autre ne se voit pas.
      //
      // Ne pas descendre à 0 : sur un téléphone d'entrée de gamme, la WebView
      // n'a alors rien peint et l'on voit un éclair blanc.
      launchShowDuration: 350,
      launchAutoHide: true,
      backgroundColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
  },
}

export default config
