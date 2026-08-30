import {
  NOYAU, FEUILLES, MOT, MOT_X, MOT_Y, LIGNE, LIGNE_X, LIGNE_Y, SEUIL_LIGNE,
} from './signeChapci'

/**
 * LE SIGNE CHAP.CI — la couronne de feuillage, retenue par le Patron le 30/08.
 *
 * Le dessin lui-même vit dans `signeChapci.ts` (voir l'avertissement qui s'y
 * trouve : il est REDESSINÉ d'après une photo d'écran, à remplacer par le
 * fichier vectoriel du prestataire dès qu'il arrive).
 *
 * ⚠️ LE 30/08 AU SOIR, LE DRAPEAU EST ENTRÉ DANS LA COURONNE. Le Patron :
 * « et le logo peux avoir toutes les couleurs de la Côte d'Ivoire ». Il a
 * retenu la proposition B, « le cœur blanc » :
 *
 *   · les feuilles de GAUCHE en ORANGE, celles de DROITE en VERT ;
 *   · le CŒUR en BLANC — c'est la bande blanche du drapeau, et c'est elle
 *     qui porte le nom ;
 *   · le nom et le cerne du cœur en vert foncé.
 *
 * Le cerne n'est pas un ornement : sans lui, un cœur blanc posé sur le crème
 * du site (#FFFDF9) n'aurait aucune limite et la couronne flotterait autour
 * d'un trou.
 *
 * ⚠️ POURQUOI UN `<symbol>` ET UN `<use>`, ET PAS LE SVG EN CLAIR.
 * La couronne compte SOIXANTE-HUIT feuilles. Dessinée en clair dans `Mark`,
 * chaque apparition du logo — l'en-tête, le pied de page, une carte — poserait
 * soixante-huit éléments de plus dans la page. Sur les téléphones d'entrée de
 * gamme qui font l'essentiel du trafic ici, cela se paie en défilement saccadé.
 * Le dessin est donc posé UNE FOIS par `SigneDefs`, et chaque logo n'en est
 * qu'une référence de trois lignes.
 *
 * Les quatre couleurs passent par des variables CSS, ce qui évite de redessiner
 * le signe une fois par fond : `--signe-orange`, `--signe-vert`, `--signe-coeur`
 * et `--signe-nom`.
 */

/**
 * Les feuilles, réparties en deux moitiés — c'est ce qui fait le drapeau.
 *
 * Le côté se lit dans la ROTATION de chaque feuille, qui contient son propre
 * centre : « angle cx cy ». Trente-quatre à gauche, trente-quatre à droite —
 * le partage tombe juste, on n'a rien à rééquilibrer à la main.
 *
 * Calculé UNE fois au chargement du module, pas à chaque rendu.
 */
const MOITIES = (() => {
  const gauche: [string, string][] = []
  const droite: [string, string][] = []
  for (const [d, rot] of FEUILLES) {
    const cx = Number(rot.split(' ')[1])
    ;(cx < 100 ? gauche : droite).push([d, rot])
  }
  return { gauche, droite }
})()

function Couronne() {
  return (
    <>
      <g fill="var(--signe-orange, #F77F00)">
        {MOITIES.gauche.map(([d, rot], i) => (
          <path key={i} d={d} transform={`rotate(${rot})`} />
        ))}
      </g>
      <g fill="var(--signe-vert, #009E60)">
        {MOITIES.droite.map(([d, rot], i) => (
          <path key={i} d={d} transform={`rotate(${rot})`} />
        ))}
      </g>
      <polygon points={NOYAU} fill="var(--signe-coeur, #FFFFFF)" />
      <polygon
        points={NOYAU}
        fill="none"
        stroke="var(--signe-nom, #00734A)"
        strokeWidth="3"
      />
    </>
  )
}

export function SigneDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false"
      style={{ position: 'absolute', pointerEvents: 'none' }}>
      <defs>
        {/* Deux symboles : avec la ligne, et sans. Un seul, dont on masquerait
            la ligne par du CSS, ne marcherait pas — `<use>` ne laisse pas
            atteindre l'intérieur d'un symbole pour en cacher une partie. */}
        <symbol id="signe-chapci" viewBox="0 0 200 200">
          <Couronne />
          <path
            d={MOT}
            transform={`translate(${MOT_X} ${MOT_Y})`}
            fill="var(--signe-nom, #00734A)"
          />
          <path
            d={LIGNE}
            transform={`translate(${LIGNE_X} ${LIGNE_Y})`}
            fill="var(--signe-nom, #00734A)"
            fillOpacity="0.82"
          />
        </symbol>
        {/* Le même signe SANS la ligne, pour les petites tailles. */}
        <symbol id="signe-chapci-compact" viewBox="0 0 200 200">
          <Couronne />
          <path
            d={MOT}
            transform={`translate(${MOT_X} 110)`}
            fill="var(--signe-nom, #00734A)"
          />
        </symbol>
      </defs>
    </svg>
  )
}

type MarkVariant = 'orange' | 'white'

/**
 * Symbole Chap.ci : la couronne de feuillage aux couleurs du drapeau.
 *
 * `orange` (défaut) = pour les fonds CLAIRS (le crème du site, une carte
 * blanche). Le drapeau au complet : feuilles orange et vertes, cœur blanc.
 *
 * `white` = pour les fonds COLORÉS — aujourd'hui le bandeau orange de
 * l'accueil. Les feuilles y passent toutes au vert PROFOND, et ce n'est pas
 * un caprice : mesuré sur le bandeau (#F77F00), le vert de marque ne donne
 * que 1,32:1 et le blanc 2,63:1 — la couronne s'effacerait. #005C3B donne
 * 3,08:1, le seuil des objets graphiques. L'orange du drapeau n'est pas perdu
 * pour autant : c'est le bandeau lui-même qui le porte.
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
  const surFondColore = variant === 'white'
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Chap.ci"
      style={{
        ['--signe-orange' as string]: surFondColore ? '#005C3B' : '#F77F00',
        ['--signe-vert' as string]: surFondColore ? '#005C3B' : '#009E60',
        ['--signe-coeur' as string]: '#FFFFFF',
        ['--signe-nom' as string]: surFondColore ? '#005C3B' : '#00734A',
      }}
    >
      {/* Sous 40 px, la ligne « Achat, Vente, Emplois, Chap » ne se lit plus :
          ses vingt-sept caractères tiendraient dans huit pixels. On sert alors
          la version compacte — même dessin, sans la salissure. */}
      <use href={size >= SEUIL_LIGNE ? '#signe-chapci' : '#signe-chapci-compact'} />
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
