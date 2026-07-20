/**
 * Image de l'écran publicitaire — NETTE et pleine largeur.
 *
 * L'image remplit tout le cadre en `object-cover` : elle reste **nette** et
 * bien visible, sans flou ni bande noire, quelle que soit la taille du visuel.
 * (Un format paysage 16:5 s'affiche sans rognage ; un format très différent
 * est recadré au centre pour rester net plutôt que réduit et entouré de flou.)
 */
export function AdImageFill({ src, className = '' }: { src: string; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={`absolute inset-0 h-full w-full object-cover object-center ${className}`}
    />
  )
}
