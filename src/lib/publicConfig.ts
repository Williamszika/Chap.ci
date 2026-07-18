// =============================================================================
//  Réglages publics récupérés au démarrage depuis le backend (/api/config).
//  Permet d'activer la connexion Google / téléphone en éditant config.php,
//  SANS reconstruire le site. L'ID client Google est une information publique.
// =============================================================================
import { useEffect, useState } from 'react'
import { isPhp } from './backend'
import { apiBase } from './native'

export interface PublicConfig {
  googleClientId: string
  facebookAppId: string
  phoneAuth: boolean
}

const API = apiBase() // absolue dans l'app native, relative sur le web
// Valeur éventuelle fixée au build (utile hors PHP / pour forcer un ID).
const BUILD_GOOGLE = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || ''
const BUILD_FACEBOOK = (import.meta.env.VITE_FACEBOOK_APP_ID as string) || ''

let cache: PublicConfig | null = null
let inflight: Promise<PublicConfig> | null = null

export async function loadPublicConfig(): Promise<PublicConfig> {
  if (cache) return cache
  if (inflight) return inflight
  const fallback: PublicConfig = { googleClientId: BUILD_GOOGLE, facebookAppId: BUILD_FACEBOOK, phoneAuth: false }
  if (!isPhp) {
    cache = fallback
    return cache
  }
  inflight = fetch(API + '/config')
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: Partial<PublicConfig>) => {
      cache = {
        googleClientId: (d && d.googleClientId) || BUILD_GOOGLE,
        facebookAppId: (d && d.facebookAppId) || BUILD_FACEBOOK,
        phoneAuth: !!(d && d.phoneAuth),
      }
      inflight = null
      return cache
    })
    .catch(() => {
      // Échec réseau : on NE met PAS le fallback en cache (sinon il resterait figé
      // toute la session — les boutons Google/téléphone pourraient disparaître même
      // après reconnexion). On libère inflight pour ré-essayer au prochain appel.
      inflight = null
      return fallback
    })
  return inflight
}

export function getPublicConfig(): PublicConfig | null {
  return cache
}

/** Hook : renvoie les réglages publics (null tant qu'ils ne sont pas chargés). */
export function usePublicConfig(): PublicConfig | null {
  const [cfg, setCfg] = useState<PublicConfig | null>(getPublicConfig())
  useEffect(() => {
    let alive = true
    if (!cfg) loadPublicConfig().then((c) => { if (alive) setCfg(c) })
    return () => { alive = false }
  }, [cfg])
  return cfg
}
