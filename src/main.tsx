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
// Polices de la marque (auto-hébergées → fonctionnent hors-ligne dans la PWA).
// Sous-ensemble LATIN seulement : voir polices.css. Importer les paquets entiers
// embarquait sept alphabets et faisait télécharger 83 Ko de « latin-ext » —
// polonais, tchèque, turc — à chaque première visite.
import './polices.css'
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
 * Retire l'écran de démarrage dès que la page est prête.
 *
 * CE CODE A DÉJÀ COÛTÉ UNE SECONDE À CHAQUE VISITEUR. La version précédente
 * imposait un plancher de 900 ms « pour laisser l'animation se dérouler », plus
 * 400 ms de fondu. Mesuré au navigateur : le contenu réel était affiché à
 * 320 ms, et l'écran d'accueil ne partait qu'à 1 400 ms. Plus d'une seconde à
 * regarder un logo devant un site déjà prêt — à chaque actualisation.
 *
 * Une animation d'entrée sert à couvrir une attente, pas à en créer une. Quand
 * il n'y a rien à couvrir, elle doit s'effacer.
 *
 * Le plancher tombe donc à 120 ms — juste assez pour éviter un clignotement
 * quand tout est déjà en cache — et le fondu à 180 ms. Sur un premier
 * chargement lent, l'application met de toute façon plus longtemps à se monter
 * et l'animation a le temps de se jouer entièrement : on ne perd l'entrée que
 * dans le seul cas où personne ne l'attendait.
 *
 * Le comportement reste identique sur le site et dans l'application Android,
 * qui masque son image fixe tout de suite (capacitor.config.ts) et laisse cet
 * écran-ci faire la liaison.
 */
const PLANCHER_SPLASH = 120
const FONDU_SPLASH = 180
const departSplash = performance.now()

function retirerSplash(): void {
  const splash = document.getElementById('app-splash')
  if (!splash) return
  const reste = Math.max(0, PLANCHER_SPLASH - (performance.now() - departSplash))
  window.setTimeout(() => {
    splash.classList.add('hide')
    window.setTimeout(() => splash.remove(), FONDU_SPLASH)
  }, reste)
}

// Deux images après le montage : la première déclenche le rendu, la seconde
// s'exécute une fois qu'il est réellement peint. On retire l'écran à cet
// instant-là, et pas avant — sinon on découvre un fond vide.
requestAnimationFrame(() => requestAnimationFrame(retirerSplash))
