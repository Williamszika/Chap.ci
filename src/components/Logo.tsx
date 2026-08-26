/**
 * Chemins du signe « chap-chap » (viewBox 0 0 96 96) : un losange fendu en
 * deux moitiés qui glissent. Le mot est doublé (« chap-chap »), le signe
 * aussi ; le vide au centre dit que la plateforme ne s'interpose pas entre
 * l'acheteur et le vendeur. Source de vérité : `marque/1-logo-nouveau/`
 * (fichiers SVG + construction paramétrée) — ne retouchez pas ces chemins à
 * la main, régénérez-les depuis la construction.
 */
const MOITIE_GAUCHE =
  'M 41 18 L 16 43 L 41 68 L 48.78 60.22 L 31.56 43 L 48.78 25.78 Z'
const MOITIE_DROITE =
  'M 55 28 L 80 53 L 55 78 L 47.22 70.22 L 64.44 53 L 47.22 35.78 Z'

type MarkVariant = 'orange' | 'white'

/**
 * Symbole Chap.ci : le signe « chap-chap ».
 * `orange` (défaut) = signe orange, pour les fonds clairs.
 * `white` = signe blanc, pour les fonds orange / sombres.
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
  const fill = variant === 'white' ? '#FFFFFF' : '#F77F00'
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Chap.ci"
    >
      <path d={MOITIE_GAUCHE} fill={fill} />
      <path d={MOITIE_DROITE} fill={fill} />
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
