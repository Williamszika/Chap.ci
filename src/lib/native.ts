// =============================================================================
//  Détection « app native » (Capacitor) et URLs absolues.
//
//  Dans l'app native (iOS/Android empaquetée par Capacitor), le contenu web tourne
//  depuis « capacitor://localhost » — les URLs relatives comme « /api » ou
//  « /imgly/ » ne pointent donc PAS vers chap.ci. On force alors le domaine de
//  production. Sur le web, on garde les URLs relatives (même origine).
// =============================================================================
import { Capacitor } from '@capacitor/core'

/** true dans l'app native empaquetée, false sur le site web. */
export const isNative = Capacitor.isNativePlatform()

/** Domaine de production (utilisé uniquement par l'app native). */
export const SITE_ORIGIN = 'https://chap.ci'

/** Base de l'API : absolue dans l'app native, relative (même origine) sur le web. */
export function apiBase(): string {
  if (isNative) return SITE_ORIGIN + '/api'
  return ((import.meta.env.VITE_API_URL as string) || '/api').replace(/\/$/, '')
}

/** Origine des ressources hébergées (ex. modèle /imgly/) : domaine de prod dans
 *  l'app native, origine courante sur le web. */
export function assetOrigin(): string {
  return isNative ? SITE_ORIGIN : window.location.origin
}

/**
 * Adresse d'une image stockée sur le serveur (`/uploads/...`).
 *
 * Le serveur renvoie des chemins RELATIFS. Sur le web ils se résolvent contre
 * chap.ci et tout va bien. Dans l'app native, la page est servie depuis
 * `https://localhost` : `/uploads/photo.jpg` y devient
 * `https://localhost/uploads/photo.jpg`, qui n'existe pas — l'image échoue et
 * l'écran retombe sur une vignette de remplacement. C'est ce qui privait
 * l'application de TOUTES les photos d'annonces.
 *
 * Laisse intactes les adresses déjà absolues (http, https) et les images
 * embarquées en data:.
 */
export function mediaUrl(src: string | null | undefined): string {
  const s = (src ?? '').trim()
  if (!s) return ''
  if (/^(https?:|data:|blob:)/i.test(s)) return s
  return isNative ? SITE_ORIGIN + (s.startsWith('/') ? s : '/' + s) : s
}
