// =============================================================================
//  Bouton « Continuer avec Facebook ».
//  Charge le SDK Facebook (une seule fois), ouvre la fenêtre de connexion et
//  remonte le jeton d'accès. Le serveur le vérifie ensuite (/auth/facebook).
//  Ne s'affiche que si un App ID Facebook est configuré (/api/config).
// =============================================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePublicConfig } from '../lib/publicConfig'

const FB_SDK = 'https://connect.facebook.net/fr_FR/sdk.js'

interface FBLoginResponse {
  authResponse?: { accessToken?: string } | null
  status?: string
}
interface FBApi {
  init: (o: Record<string, unknown>) => void
  login: (cb: (r: FBLoginResponse) => void, o?: Record<string, unknown>) => void
}
declare global {
  interface Window {
    FB?: FBApi
    __fbLoading?: Promise<void>
  }
}

function loadFb(appId: string): Promise<void> {
  if (window.FB) return Promise.resolve()
  if (window.__fbLoading) return window.__fbLoading
  window.__fbLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = FB_SDK
    s.async = true
    s.defer = true
    s.crossOrigin = 'anonymous'
    s.onload = () => {
      try {
        window.FB!.init({ appId, cookie: true, xfbml: false, version: 'v19.0' })
        resolve()
      } catch (e) {
        reject(e as Error)
      }
    }
    s.onerror = () => reject(new Error('Échec du chargement de Facebook'))
    document.head.appendChild(s)
  })
  return window.__fbLoading
}

export function FacebookSignInButton({
  onToken,
  label = 'Continuer avec Facebook',
}: {
  onToken: (accessToken: string) => void
  label?: string
}) {
  const appId = usePublicConfig()?.facebookAppId || ''
  const [busy, setBusy] = useState(false)
  const cb = useRef(onToken)
  cb.current = onToken

  // Précharge le SDK dès que l'App ID est connu (clic instantané ensuite).
  useEffect(() => {
    if (appId) loadFb(appId).catch(() => {})
  }, [appId])

  const login = useCallback(async () => {
    if (!appId) return
    setBusy(true)
    try {
      await loadFb(appId)
      window.FB!.login(
        (resp) => {
          setBusy(false)
          const tok = resp?.authResponse?.accessToken
          if (tok) cb.current(tok)
        },
        { scope: 'public_profile,email' },
      )
    } catch {
      setBusy(false)
    }
  }, [appId])

  // Rien à afficher si Facebook n'est pas configuré côté serveur.
  if (!appId) return null

  return (
    <button
      type="button"
      onClick={login}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition active:scale-[0.99] disabled:opacity-60"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
      </svg>
      {busy ? 'Connexion…' : label}
    </button>
  )
}
