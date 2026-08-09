// =============================================================================
//  Consentement aux cookies / traceurs.
//
//  Ce que le consentement GOUVERNE : les pixels TIERS (Meta, TikTok, Google
//  Analytics) — ceux qui posent de vrais cookies et parlent à des serveurs
//  étrangers. Ils ne se chargent QUE si la personne a accepté.
//
//  Ce que le consentement NE bloque PAS : le comptage de visites de première
//  partie (un identifiant aléatoire dans le navigateur, aucun nom, aucun cookie
//  tiers). C'est la mesure d'audience du site lui-même, déclarée dans la
//  politique de confidentialité — pas du pistage publicitaire.
//
//  Le choix est mémorisé. Tant qu'il n'est pas fait, aucun pixel ne se charge.
// =============================================================================

const KEY = 'chapci.consent'          // 'yes' | 'no'
const EVENT = 'chapci-consent'

export type Consent = 'yes' | 'no' | null

/** Le choix de la personne, ou null si elle n'a pas encore répondu. */
export function consentState(): Consent {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'yes' || v === 'no' ? v : null
  } catch {
    return null
  }
}

/** Vrai si les traceurs tiers sont autorisés. */
export function consentAccepted(): boolean {
  return consentState() === 'yes'
}

/** Vrai si la personne a déjà répondu (dans un sens ou l'autre). */
export function consentDecided(): boolean {
  return consentState() !== null
}

/** Enregistre le choix et prévient qui écoute (le bandeau, `initMarketing`…). */
export function setConsent(accepted: boolean): void {
  try { localStorage.setItem(KEY, accepted ? 'yes' : 'no') } catch { /* mode privé */ }
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: accepted })) } catch { /* ignore */ }
}

/** Réagit à un changement de consentement. Rend une fonction de désabonnement. */
export function onConsentChange(cb: (accepted: boolean) => void): () => void {
  const handler = (e: Event) => cb(Boolean((e as CustomEvent).detail))
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
