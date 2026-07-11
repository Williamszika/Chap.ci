import { useId } from 'react'

/**
 * Étiquette de promotion : une étiquette de prix (comme la piste « Étiquette »
 * de la charte Chap.ci) affichant le pourcentage de réduction, ex. « -20% ».
 */
export function PromoTag({ percent, height = 22 }: { percent: number; height?: number }) {
  const uid = useId().replace(/:/g, '')
  const g = `promo-${uid}`
  const width = height * 2.35

  return (
    <svg
      viewBox="0 0 94 40"
      height={height}
      width={width}
      role="img"
      aria-label={`Réduction de ${percent} pour cent`}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF5A5A" />
          <stop offset="1" stopColor="#D6002E" />
        </linearGradient>
      </defs>
      {/* Corps de l'étiquette avec la pointe à gauche */}
      <path
        d="M22 2 H86 A6 6 0 0 1 92 8 V32 A6 6 0 0 1 86 38 H22 L3 21.4 A2 2 0 0 1 3 18.6 Z"
        fill={`url(#${g})`}
      />
      {/* Œillet de l'étiquette */}
      <circle cx="17" cy="20" r="3.4" fill="#FFFFFF" opacity="0.95" />
      {/* Texte de réduction */}
      <text
        x="56"
        y="27"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="19"
        fontWeight="800"
        fontFamily="'Plus Jakarta Sans Variable','Plus Jakarta Sans',system-ui,sans-serif"
        letterSpacing="-0.5"
      >
        -{percent}%
      </text>
    </svg>
  )
}
