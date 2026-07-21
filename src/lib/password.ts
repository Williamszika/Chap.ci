// =============================================================================
//  Robustesse des mots de passe
// =============================================================================
//  Politique « robuste » exigée : au moins 8 caractères, avec une minuscule,
//  une majuscule et un chiffre. Un caractère spécial renforce encore le score.
// =============================================================================

export interface PasswordCheck {
  /** true si le mot de passe respecte la politique minimale robuste */
  ok: boolean
  /** score de 0 (très faible) à 4 (excellent) */
  score: number
  /** libellé lisible du score */
  label: string
  /** exigences encore manquantes (à afficher à l'utilisateur) */
  missing: string[]
}

const LABELS = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent']

export function checkPassword(pw: string): PasswordCheck {
  const hasLower = /[a-z]/.test(pw)
  const hasUpper = /[A-Z]/.test(pw)
  const hasDigit = /\d/.test(pw)
  const hasSpecial = /[^A-Za-z0-9]/.test(pw)
  const longEnough = pw.length >= 8

  const missing: string[] = []
  if (!longEnough) missing.push('8 caractères minimum')
  if (!hasLower) missing.push('une minuscule')
  if (!hasUpper) missing.push('une majuscule')
  if (!hasDigit) missing.push('un chiffre')

  // Score indicatif (0 à 4)
  let score = 0
  if (longEnough) score++
  if (hasLower && hasUpper) score++
  if (hasDigit) score++
  if (hasSpecial) score++
  if (pw.length >= 12 && score < 4) score++
  score = Math.min(4, score)

  return {
    ok: missing.length === 0,
    score,
    label: LABELS[score],
    missing,
  }
}

/** Couleur Tailwind associée au score (pour la jauge). */
export function passwordColor(score: number): string {
  return ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-ivoire-green'][score]
}
