import { NOYAU, FEUILLES, MOT, MOT_X, MOT_Y } from './signeChapci'

/**
 * LE SIGNE CHAP.CI — la couronne de feuillage, retenue par le Patron le 30/08.
 *
 * Le dessin lui-même vit dans `signeChapci.ts` (voir l'avertissement qui s'y
 * trouve : il est REDESSINÉ d'après une photo d'écran, à remplacer par le
 * fichier vectoriel du prestataire dès qu'il arrive).
 *
 * ⚠️ POURQUOI UN `<symbol>` ET UN `<use>`, ET PAS LE SVG EN CLAIR.
 * La couronne compte SOIXANTE-HUIT feuilles. Dessinée en clair dans `Mark`,
 * chaque apparition du logo — l'en-tête, le pied de page, une carte — poserait
 * soixante-huit éléments de plus dans la page. Sur les téléphones d'entrée de
 * gamme qui font l'essentiel du trafic ici, cela se paie en défilement saccadé.
 * Le dessin est donc posé UNE FOIS par `SigneDefs`, et chaque logo n'en est
 * qu'une référence de trois lignes.
 *
 * Les deux couleurs passent par l'héritage CSS, ce qui évite un second dessin :
 * la couronne prend `currentColor`, le nom prend `--signe-mot`. Sur fond clair,
 * couronne verte et nom blanc ; sur fond vert, l'inverse.
 */
export function SigneDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false"
      style={{ position: 'absolute', pointerEvents: 'none' }}>
      <defs>
        <symbol id="signe-chapci" viewBox="0 0 200 200">
          <g fill="currentColor">
            <polygon points={NOYAU} />
            {FEUILLES.map(([d, rot], i) => (
              <path key={i} d={d} transform={`rotate(${rot})`} />
            ))}
          </g>
          <path
            d={MOT}
            transform={`translate(${MOT_X} ${MOT_Y})`}
            fill="var(--signe-mot, #FFFFFF)"
          />
        </symbol>
      </defs>
    </svg>
  )
}

type MarkVariant = 'orange' | 'white'

/**
 * Symbole Chap.ci : le signe « chap-chap ».
 * `orange` (défaut) = signe en couleur de marque, pour les fonds clairs.
 * `white` = signe blanc, pour les fonds verts / sombres.
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
  // Sur fond clair : couronne verte, nom blanc. Sur fond vert (variant
  // `white`) : couronne blanche, nom vert — le nom se lit alors « en creux ».
  const blanc = variant === 'white'
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Chap.ci"
      style={{
        color: blanc ? '#FFFFFF' : '#009E60',
        ['--signe-mot' as string]: blanc ? '#009E60' : '#FFFFFF',
      }}
    >
      <use href="#signe-chapci" />
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
