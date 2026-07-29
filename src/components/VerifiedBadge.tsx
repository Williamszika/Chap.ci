/**
 * Badge d'un compte — deux couleurs, deux significations.
 *
 *   BLEU  « Équipe Chap.ci » · réservé aux administrateurs du site. Il ne se
 *         gagne pas : il dit d'où vient un message. C'est lui qui permet à un
 *         vendeur de distinguer un vrai message du site d'une tentative
 *         d'hameçonnage qui se ferait passer pour Chap.ci — d'où le choix de ne
 *         JAMAIS l'accorder à un utilisateur, si méritant soit-il.
 *
 *   VERT  « Membre depuis 6 mois » · adresse confirmée et six mois de présence.
 *         Il ne se demande pas, il apparaît le jour dû. Le vert est celui du
 *         drapeau ivoirien, et il ne peut pas être confondu avec le bleu des
 *         coches d'autres réseaux — ce qui est exactement le but.
 *
 * Un compte simplement vérifié par e-mail n'a AUCUN badge : confirmer son
 * adresse est la condition pour publier, pas une distinction. Un badge que tout
 * le monde porte ne distingue plus personne.
 */
export type BadgeKind = 'admin' | 'anciennete'

const COULEUR: Record<BadgeKind, string> = {
  admin: '#1D9BF0',
  anciennete: '#009E60',
}

const TITRE: Record<BadgeKind, string> = {
  admin: 'Équipe Chap.ci',
  anciennete: 'Membre vérifié depuis plus de 6 mois',
}

export function VerifiedBadge({
  kind = 'anciennete', size = 16, className = '', title,
}: { kind?: BadgeKind; size?: number; className?: string; title?: string }) {
  const libelle = title ?? TITRE[kind]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      role="img"
      aria-label={libelle}
    >
      <title>{libelle}</title>
      <path
        fill={COULEUR[kind]}
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
