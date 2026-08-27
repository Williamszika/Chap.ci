import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * La flèche de retour vers le compte, pour les écrans qui vivent à leur propre
 * adresse — Favoris, Messages, Notifications, Aide, Contacter l'équipe.
 *
 * Les écrans qui sont des onglets du compte ont déjà leur flèche dans leur
 * en-tête. Ceux-ci n'en avaient pas : on y entrait depuis le tableau de bord
 * et l'on se retrouvait sans chemin de retour, sinon le bouton du navigateur —
 * que personne n'utilise sur un téléphone.
 *
 * Elle ne s'affiche QUE si l'on est arrivé depuis le compte (l'appelant pose
 * `state: { retour: '/compte' }`). Quelqu'un qui ouvre ses favoris depuis la
 * barre du bas ne verra rien : il n'y a rien à quitter.
 */
export function RetourCompte({ libelle = 'Retour au tableau de bord', className = '' }: {
  libelle?: string
  className?: string
}) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const retour = (state as { retour?: string } | null)?.retour
  if (!retour) return null
  return (
    <button
      onClick={() => navigate(retour)}
      className={`flex items-center gap-1.5 text-[13px] font-bold text-primary-700 transition active:scale-[0.98] ${className}`}
    >
      <ArrowLeft size={17} /> {libelle}
    </button>
  )
}

/** L'état à poser en naviguant depuis le compte, pour faire apparaître la flèche. */
export const DEPUIS_COMPTE = { state: { retour: '/compte' } }
