import { useEffect, useRef } from 'react'
import { usePublicConfig } from '../lib/publicConfig'

// L'ID client OAuth « Web » (Google Cloud Console) est fourni au runtime par le
// backend (/api/config → googleClientId), ce qui permet de l'activer via
// config.php sans reconstruire le site.
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any
    __gisLoading?: Promise<void>
  }
}

/** Charge (une seule fois) le script Google Identity Services. */
function loadGis(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (window.__gisLoading) return window.__gisLoading
  window.__gisLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Chargement de Google impossible.')))
      return
    }
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Chargement de Google impossible.'))
    document.head.appendChild(s)
  })
  return window.__gisLoading
}

/**
 * Bouton « Se connecter avec Google » rendu par Google Identity Services.
 * À la sélection d'un compte, appelle `onCredential` avec le jeton d'identité
 * (credential) à transmettre au backend. Ne rend rien si aucun client Google
 * n'est configuré.
 */
export function GoogleSignInButton({
  onCredential,
  text = 'continue_with',
}: {
  onCredential: (credential: string) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
}) {
  const cfg = usePublicConfig()
  const clientId = cfg?.googleClientId || ''
  const ref = useRef<HTMLDivElement>(null)
  const cb = useRef(onCredential)
  cb.current = onCredential

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled || !ref.current || !window.google?.accounts?.id) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp: { credential?: string }) => {
            if (resp?.credential) cb.current(resp.credential)
          },
        })
        const w = Math.min(400, Math.max(240, ref.current.offsetWidth || 320))
        window.google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          logo_alignment: 'center',
          locale: 'fr',
          width: w,
        })
      })
      // Échec de chargement (réseau, Google injoignable) : on n'affiche pas
      // d'erreur bloquante — l'email et le téléphone restent disponibles.
      .catch((e) => console.warn('Google Sign-In indisponible :', (e as Error).message))
    return () => {
      cancelled = true
    }
  }, [text, clientId])

  if (!clientId) return null
  return <div ref={ref} className="flex justify-center" />
}
