import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './store/AppContext'
import { AuthProvider } from './store/AuthContext'
import { GeoProvider } from './store/GeoContext'
import { NotificationsProvider } from './store/NotificationsContext'
import { ToastProvider } from './store/ToastContext'
// Capte au plus tôt l'événement d'installation PWA (beforeinstallprompt),
// souvent émis avant le montage de React (voir components/InstallAppBanner).
import './lib/pwaInstall'
// Pixels marketing (Meta, TikTok, Google) — actifs seulement sur le web en prod.
import { initMarketing } from './lib/marketing'
// Polices de la marque (auto-hébergées → fonctionnent hors-ligne dans la PWA)
import '@fontsource-variable/inter'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'

// HashRouter : fonctionne partout sans configuration serveur — idéal pour
// l'hébergement statique (GitHub Pages) et les applications natives Capacitor.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <NotificationsProvider>
          <GeoProvider>
            <AppProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </AppProvider>
          </GeoProvider>
        </NotificationsProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)

// Active les pixels marketing (no-op en dev / app native).
initMarketing()

/**
 * Retire l'écran de démarrage — mais pas avant qu'on l'ait vu.
 *
 * Il porte une animation : la goutte se pose, le nom monte, la baseline suit.
 * Cela dure environ 840 ms. Or l'application se monte souvent plus vite que
 * ça, surtout au deuxième lancement quand tout est en cache — l'écran
 * disparaissait alors au milieu du geste, ce qui donne un clignotement plutôt
 * qu'une entrée.
 *
 * On garde donc un plancher : l'écran reste au moins le temps de son
 * animation, puis s'efface. Ce n'est pas une attente ajoutée — pendant ces
 * 900 ms, l'application finit de se monter derrière.
 *
 * C'est ce qui rend le lancement IDENTIQUE sur le site et dans l'application
 * Android : celle-ci masque son image fixe presque tout de suite
 * (capacitor.config.ts) et laisse cet écran-ci faire l'entrée.
 */
const DUREE_MINIMALE = 900
const departSplash = performance.now()

requestAnimationFrame(() => {
  const splash = document.getElementById('app-splash')
  if (!splash) return
  const reste = Math.max(0, DUREE_MINIMALE - (performance.now() - departSplash))
  window.setTimeout(() => {
    splash.classList.add('hide')
    window.setTimeout(() => splash.remove(), 400)
  }, reste)
})
