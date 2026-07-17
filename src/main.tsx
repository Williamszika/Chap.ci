import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './store/AppContext'
import { AuthProvider } from './store/AuthContext'
import { GeoProvider } from './store/GeoContext'
import { NotificationsProvider } from './store/NotificationsContext'
import { ToastProvider } from './store/ToastContext'
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

// Retire l'écran de démarrage une fois l'application montée.
requestAnimationFrame(() => {
  const splash = document.getElementById('app-splash')
  if (splash) {
    splash.classList.add('hide')
    setTimeout(() => splash.remove(), 400)
  }
})
