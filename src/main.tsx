import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './store/AppContext'
import './index.css'

// HashRouter : fonctionne partout sans configuration serveur — idéal pour
// l'hébergement statique (GitHub Pages) et les applications natives Capacitor.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </HashRouter>
  </StrictMode>,
)
