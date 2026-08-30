/**
 * LE SIGNE CHAP.CI — deux moitiés qui s'écartent, tracées d'un seul trait.
 *
 * L'IDÉE NE CHANGE PAS. Le vide au centre dit toujours la même chose : la
 * plateforme ne s'interpose pas entre l'acheteur et le vendeur. Ce qui change,
 * c'est la FABRICATION — et elle vient d'une méthode que le Patron a repérée
 * chez Kleinanzeigen le 30/08 :
 *
 *   · un trait unique et épais, aucun détail fin ;
 *   · des bouts arrondis, jamais coupés au couteau ;
 *   · une seule couleur, sans dégradé ni seconde teinte.
 *
 * Ces trois règles ont un seul but : tenir à 16 px. L'ancien signe était en
 * aplats pleins (deux losanges fendus) ; à la taille d'un onglet de navigateur,
 * la fente disparaissait et il ne restait qu'une tache. Au trait, le vide
 * central survit jusqu'en bas de l'échelle.
 *
 * ⚠️ CE TRACÉ NE VIENT PLUS DE `marque/1-logo-nouveau/`. Cette construction
 * paramétrée dessinait les aplats de l'ancien signe ; elle ne sait pas produire
 * un monoline. Le tracé ci-dessous est la source de vérité tant que la
 * construction n'a pas été refaite — ne recopiez pas l'ancienne par-dessus.
 *
 * Grille de 96, comme avant, pour que rien de ce qui l'appelle ne bouge.
 * Encombrement réel : x de 15,75 à 80,25, y de 16,75 à 79,25 — centré sur 48.
 */
const TRACE = 'M 40 22 L 21 48 L 40 74 M 56 22 L 75 48 L 56 74'
/** Épaisseur du trait sur la grille de 96. Ne se change pas sans refaire l'échelle. */
const EPAISSEUR = 10.5

/* Le nom `orange` est conservé : il désigne « la couleur de marque », et le
   renommer obligerait à toucher les cinquante endroits qui l'appellent pour
   un gain nul. Sa VALEUR, elle, est passée au vert. */
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
  // #009E60 : le vert du drapeau ivoirien, couleur de marque depuis le 30/08.
  const trait = variant === 'white' ? '#FFFFFF' : '#009E60'
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Chap.ci"
    >
      <path
        d={TRACE}
        fill="none"
        stroke={trait}
        strokeWidth={EPAISSEUR}
        strokeLinecap="round"
        strokeLinejoin="round"
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
