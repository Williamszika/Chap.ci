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

// =============================================================================
//  REVENIR SUR SON CHOIX (10/09/2026)
//
//  Un consentement qu'on ne peut pas retirer n'est pas un consentement. Jusqu'à
//  aujourd'hui, le bandeau ne réapparaissait JAMAIS une fois répondu : quelqu'un
//  qui avait accepté par réflexe n'avait plus aucun moyen de changer d'avis
//  depuis le site. La politique de confidentialité lui disait d'aller « bloquer
//  les cookies dans son navigateur » — c'est-à-dire de se débrouiller.
//
//  `ouvrirReglages()` rouvre le panneau depuis n'importe où. Le bouton vit dans
//  la politique de confidentialité (§ 11), là où la personne va chercher.
// =============================================================================
const EVENT_OUVRIR = 'chapci-consent-ouvrir'

/** Rouvre le panneau de réglages des cookies (bouton de la page Confidentialité). */
export function ouvrirReglages(): void {
  try { window.dispatchEvent(new CustomEvent(EVENT_OUVRIR)) } catch { /* ignore */ }
}

/** Le bandeau écoute cette demande. Rend une fonction de désabonnement. */
export function onOuvrirReglages(cb: () => void): () => void {
  const handler = () => cb()
  window.addEventListener(EVENT_OUVRIR, handler)
  return () => window.removeEventListener(EVENT_OUVRIR, handler)
}

// =============================================================================
//  « PLUS TARD » — la croix du bandeau
//
//  Fermer sans choisir n'est PAS un accord : aucun pixel ne se charge, et le
//  bandeau revient à la prochaine visite. Mais il ne doit pas harceler pendant
//  la visite en cours — d'où `sessionStorage`, qui s'efface à la fermeture de
//  l'onglet. C'est le seul état volontairement éphémère de ce module.
// =============================================================================
const KEY_PLUS_TARD = 'chapci.consent.plusTard'

export function reporter(): void {
  try { sessionStorage.setItem(KEY_PLUS_TARD, '1') } catch { /* mode privé */ }
}

export function reporte(): boolean {
  try { return sessionStorage.getItem(KEY_PLUS_TARD) === '1' } catch { return false }
}
