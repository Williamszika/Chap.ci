/**
 * Logos des marques citées par le site — SOURCE UNIQUE.
 *
 * ── Pourquoi ce fichier existe ───────────────────────────────────────────────
 * Les marques étaient dessinées à trois endroits différents, et deux d'entre
 * elles ne l'étaient pas du tout :
 *
 *   • WhatsApp était un rond vert contenant l'émoji « 🟢 » (page Contact et
 *     feuille de partage) ;
 *   • Facebook était la lettre « f » écrite en gras dans un rond bleu ;
 *   • Orange Money était un CERCLE orange traversé de deux flèches — or la
 *     marque Orange est un CARRÉ orange portant son nom en blanc. Le cercle
 *     n'appartient à personne, et surtout pas à Orange.
 *
 * Ce n'est pas un détail d'esthétique. Ces logos apparaissent sur les écrans de
 * PAIEMENT et de PARTAGE : ce sont exactement les moments où l'utilisateur
 * cherche un repère familier pour décider s'il peut faire confiance. Un logo
 * approximatif à cet endroit ressemble à une contrefaçon, et se lit comme
 * telle.
 *
 * ── Choix techniques ─────────────────────────────────────────────────────────
 * Tout est en SVG dessiné ici, jamais chargé depuis un service extérieur : une
 * requête de moins sur un forfait data ivoirien, aucune dépendance qui peut
 * disparaître, et aucun domaine supplémentaire à autoriser dans la CSP.
 *
 * Les marques verbales (Orange, MTN, Moov) sont rendues avec du texte SVG :
 * leur identité EST leur nom écrit dans une couleur précise. Aux petites
 * tailles, seul le carré coloré se lit — et c'est déjà juste, puisque c'est
 * ainsi qu'on les reconnaît sur un panneau de rue à Abidjan.
 *
 * ⚠️ Ces logos appartiennent à leurs propriétaires. Ils ne sont utilisés que
 * pour DÉSIGNER le moyen de paiement ou le réseau concerné — jamais pour
 * suggérer un partenariat, une affiliation ou une caution.
 */

export type BrandId = 'whatsapp' | 'facebook' | 'tiktok' | 'orange' | 'wave' | 'mtn' | 'moov'

/** Couleur officielle de chaque marque (fond des pastilles, accents). */
export const BRAND_COLOR: Record<BrandId, string> = {
  whatsapp: '#25D366',
  facebook: '#1877F2',
  tiktok: '#000000',
  orange: '#FF7900',
  wave: '#1DC3EC',
  mtn: '#FFCB05',
  moov: '#004E9E',
}

export const BRAND_LABEL: Record<BrandId, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  orange: 'Orange Money',
  wave: 'Wave',
  mtn: 'MTN MoMo',
  moov: 'Moov Money',
}

/**
 * Le logo seul, sans pastille.
 *
 * `mono` : le dessin prend la couleur du texte environnant (currentColor) au
 * lieu de ses couleurs de marque. Indispensable sur le pied de page sombre,
 * où un logo bleu Facebook sur fond noir devient illisible.
 */
export function BrandLogo({
  id, className = 'h-6 w-6', mono = false,
}: { id: BrandId; className?: string; mono?: boolean }) {
  const c = (couleur: string) => (mono ? 'currentColor' : couleur)
  const commun = { className, role: 'img' as const, 'aria-label': BRAND_LABEL[id] }

  if (id === 'whatsapp') {
    // Combiné téléphonique dans une bulle de conversation — le glyphe officiel.
    return (
      <svg viewBox="0 0 24 24" fill={c('#25D366')} {...commun}>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Z" />
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.19 5.07 4.47.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    )
  }

  if (id === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" fill={c('#1877F2')} {...commun}>
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.5-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.93 8.44-9.94Z" />
      </svg>
    )
  }

  if (id === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" fill={c('#000000')} {...commun}>
        <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06V9.68a5.66 5.66 0 0 0-.77-.05A5.7 5.7 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.28 1.38V7.3a4.28 4.28 0 0 1-3.22-1.48Z" />
      </svg>
    )
  }

  if (id === 'orange') {
    // La marque Orange est un CARRÉ orange portant son nom en blanc, en
    // minuscules. Ni cercle, ni flèches : c'est ce carré, et lui seul, qu'on
    // reconnaît sur les devantures et les cabines à Abidjan.
    return (
      <svg viewBox="0 0 48 48" {...commun}>
        <rect width="48" height="48" rx="6" fill={mono ? 'currentColor' : '#FF7900'} />
        <text
          x="24" y="30" textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif" fontSize="11.5" fontWeight="700"
          fill={mono ? '#fff' : '#FFFFFF'} letterSpacing="-0.3"
        >
          orange
        </text>
      </svg>
    )
  }

  if (id === 'wave') {
    // Le pingouin bleu de Wave — mascotte reconnue dans toute l'Afrique de
    // l'Ouest, sur fond bleu ciel.
    return (
      <svg viewBox="0 0 48 48" {...commun}>
        <rect width="48" height="48" rx="11" fill={mono ? 'currentColor' : '#1DC3EC'} />
        <path d="M24 9.5c-6.4 0-10.7 5.1-10.7 13.3 0 8.2 4.5 15 10.7 15s10.7-6.8 10.7-15c0-8.2-4.3-13.3-10.7-13.3Z" fill="#12232E" />
        <ellipse cx="24" cy="26.4" rx="6.4" ry="9.1" fill="#FFFFFF" />
        <circle cx="20.9" cy="19.2" r="1.7" fill="#FFFFFF" />
        <circle cx="27.1" cy="19.2" r="1.7" fill="#FFFFFF" />
        <circle cx="21" cy="19.4" r=".8" fill="#12232E" />
        <circle cx="27" cy="19.4" r=".8" fill="#12232E" />
        <path d="M22.3 21.6h3.4L24 24.8Z" fill="#F6A21E" />
        <path d="M20.2 37.2l2.5-1.8.8 2.5Z" fill="#F6A21E" />
        <path d="M27.8 37.2l-2.5-1.8-.8 2.5Z" fill="#F6A21E" />
      </svg>
    )
  }

  if (id === 'mtn') {
    return (
      <svg viewBox="0 0 48 48" {...commun}>
        <rect width="48" height="48" rx="24" fill={mono ? 'currentColor' : '#FFCB05'} />
        <text
          x="24" y="29" textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif" fontSize="14" fontWeight="800"
          fill={mono ? '#fff' : '#00457C'}
        >
          MTN
        </text>
      </svg>
    )
  }

  // moov
  return (
    <svg viewBox="0 0 48 48" {...commun}>
      <rect width="48" height="48" rx="6" fill={mono ? 'currentColor' : '#004E9E'} />
      <text
        x="24" y="30" textAnchor="middle"
        fontFamily="Helvetica, Arial, sans-serif" fontSize="13" fontWeight="700"
        fill="#FFFFFF"
      >
        moov
      </text>
    </svg>
  )
}

/**
 * Le logo dans sa pastille ronde aux couleurs de la marque — pour les grilles
 * de partage et les cartes de contact, où le logo doit se voir de loin.
 */
export function BrandBadge({
  id, size = 'h-14 w-14', className = '',
}: { id: BrandId; size?: string; className?: string }) {
  return (
    <span
      style={{ backgroundColor: BRAND_COLOR[id] }}
      className={`grid ${size} place-items-center rounded-full text-white ${className}`}
    >
      <BrandLogo id={id} mono className="h-1/2 w-1/2" />
    </span>
  )
}
