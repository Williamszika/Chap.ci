/**
 * Badge de vérification BLEU (compte fidèle et actif). Coche blanche sur pastille
 * bleue à bord festonné, façon « vérifié ». Décoratif : title au survol.
 */
export function VerifiedBadge({ size = 16, className = '', title = 'Compte vérifié' }: { size?: number; className?: string; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path
        fill="#1D9BF0"
        d="M12 1.6l2.3 1.7 2.8-.3 1.2 2.6 2.6 1.2-.3 2.8L22 12l-1.7 2.3.3 2.8-2.6 1.2-1.2 2.6-2.8-.3L12 22.4l-2.3-1.7-2.8.3-1.2-2.6-2.6-1.2.3-2.8L1.6 12l1.7-2.3-.3-2.8 2.6-1.2 1.2-2.6 2.8.3L12 1.6z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12.3l2.6 2.6L16 9.2"
      />
    </svg>
  )
}
