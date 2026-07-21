/**
 * Logos des moyens de paiement Mobile Money (SVG, nets à toute taille).
 * Reproductions simples et reconnaissables — Wave (pingouin cyan) et
 * Orange Money (cercle orange, flèches de transfert).
 */
export function PayLogo({ id, className = 'h-6 w-6' }: { id: string; className?: string }) {
  if (id === 'wave') {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Wave">
        <rect width="48" height="48" rx="13" fill="#1BC5EC" />
        {/* Pingouin */}
        <path d="M24 9c-6.6 0-11 5.2-11 13.6C13 31 17.6 38 24 38s11-7 11-15.4C35 14.2 30.6 9 24 9Z" fill="#0C0C0C" />
        <ellipse cx="24" cy="26.6" rx="6.6" ry="9.4" fill="#fff" />
        <circle cx="20.8" cy="19" r="1.8" fill="#fff" />
        <circle cx="27.2" cy="19" r="1.8" fill="#fff" />
        <circle cx="20.9" cy="19.2" r=".85" fill="#0C0C0C" />
        <circle cx="27.1" cy="19.2" r=".85" fill="#0C0C0C" />
        <path d="M22.2 21.4h3.6L24 24.8Z" fill="#F6A21E" />
        <path d="M20 37.4l2.6-1.9.8 2.6Z" fill="#F6A21E" />
        <path d="M28 37.4l-2.6-1.9-.8 2.6Z" fill="#F6A21E" />
        {/* Aile levée (« wave ») */}
        <path d="M33.4 14.6c2.9-1.7 5.1.1 4.3 3-.7 2.6-3.7 3-5.7 1.1Z" fill="#0C0C0C" />
      </svg>
    )
  }
  // Orange Money — cercle orange + deux flèches de transfert (échange).
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Orange Money">
      <circle cx="24" cy="24" r="23" fill="#F47C20" />
      <g stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* flèche ↗ (en haut à gauche) */}
        <path d="M14 24 24 14" />
        <path d="M18.5 14H24v5.5" />
        {/* flèche ↙ (en bas à droite) */}
        <path d="M34 24 24 34" />
        <path d="M29.5 34H24v-5.5" />
      </g>
    </svg>
  )
}
