/**
 * Remplissage d'image adaptatif pour l'écran publicitaire.
 *
 * Quelle que soit la forme de l'image téléchargée (paysage, portrait, carrée),
 * elle s'affiche ENTIÈRE (jamais rognée) grâce à `object-contain`, et une
 * version floutée d'elle-même remplit l'espace autour — plus de bande noire ni
 * de photo coupée. C'est la technique « fond flou » des lecteurs vidéo.
 */
export function AdImageFill({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* Fond : la même image, floutée et agrandie, comble tout le cadre */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
      />
      {/* Image nette et complète, centrée — adaptée à n'importe quel format */}
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-contain" />
    </div>
  )
}
