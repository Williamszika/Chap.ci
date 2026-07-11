import { useId } from 'react'

/** Chemins du symbole « épingle-C » (viewBox 0 0 100 100). */
const PIN =
  'M50 4 C28 4 11 21 11 43 C11 69 41 90 50 97 C59 90 89 69 89 43 C89 21 72 4 50 4 Z'
const SHEEN =
  'M50 4 C28 4 11 21 11 43 C11 51 13 58 17 65 C15 57 16 49 20 42 C29 26 48 21 62 27 C54 20 43 19 35 23 C42 12 57 8 69 14 C64 8 57 4 50 4 Z'
const C_ARC = 'M63.5 30.4 A 18.6 18.6 0 1 0 63.5 53.6'

type MarkVariant = 'orange' | 'white'

/**
 * Symbole Chap.ci : une épingle de localisation dont le vide dessine un « C ».
 * `orange` (défaut) = pastille orange dégradée sur fond clair.
 * `white` = épingle blanche pour fonds orange / sombres.
 */
export function Mark({
  size = 40,
  variant = 'orange',
  className,
}: {
  size?: number
  variant?: MarkVariant
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const og = `og-${uid}`
  const sh = `sh-${uid}`
  const ds = `ds-${uid}`

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Chap.ci"
    >
      <defs>
        <linearGradient id={og} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFA243" />
          <stop offset="0.5" stopColor="#F77F00" />
          <stop offset="1" stopColor="#D95F00" />
        </linearGradient>
        <linearGradient id={sh} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={ds} x="-40%" y="-40%" width="190%" height="190%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.2" floodColor="#6E3400" floodOpacity="0.28" />
        </filter>
      </defs>
      <g filter={`url(#${ds})`}>
        <path d={PIN} fill={variant === 'white' ? '#FFFFFF' : `url(#${og})`} />
        <path d={SHEEN} fill={`url(#${sh})`} />
      </g>
      <path
        d={C_ARC}
        fill="none"
        stroke={variant === 'white' ? '#F77F00' : '#FFFFFF'}
        strokeWidth={10}
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Nom de la marque : « Chap » en encre, « .ci » en vert. */
export function Wordmark({
  className = '',
  ci = 'text-ivoire-green',
}: {
  className?: string
  ci?: string
}) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      Chap<span className={ci}>.ci</span>
    </span>
  )
}

/** Verrouillage horizontal : symbole + nom. */
export function Logo({
  size = 34,
  variant = 'orange',
  text = 'text-ink',
  ci,
  className = '',
}: {
  size?: number
  variant?: MarkVariant
  text?: string
  ci?: string
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Mark size={size} variant={variant} />
      <Wordmark className={`text-2xl ${text}`} ci={ci} />
    </span>
  )
}
