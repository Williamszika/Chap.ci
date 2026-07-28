import { SOCIALS, type Social } from '../data/footerLinks'

/**
 * Logos officiels, dessinés en SVG plutôt que chargés depuis un service
 * extérieur : une icône hébergée ailleurs, c'est une requête de plus sur un
 * forfait data ivoirien, une dépendance qui peut disparaître, et un domaine de
 * plus à autoriser dans la politique de sécurité du contenu (CSP).
 *
 * `currentColor` : les logos prennent la couleur du texte autour d'eux. Ils
 * restent donc lisibles sur le pied de page sombre comme sur le plan du site,
 * qui est clair — sans deux jeux d'images.
 */
function Logo({ id, className = '' }: { id: Social['id']; className?: string }) {
  if (id === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.5-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.93 8.44-9.94Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06V9.68a5.66 5.66 0 0 0-.77-.05A5.7 5.7 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.28 1.38V7.3a4.28 4.28 0 0 1-3.22-1.48Z" />
    </svg>
  )
}

/**
 * Rangée des comptes officiels.
 *
 * `rel="me"` n'est pas décoratif : c'est la déclaration lisible par une machine
 * que ce compte est bien le nôtre. Avec le `sameAs` des données structurées,
 * elle forme l'aller-retour qui permet à un moteur de relier le site à son
 * identité sociale au lieu de la deviner.
 */
export function SocialLinks({ className = '', tone = 'sombre' }: { className?: string; tone?: 'sombre' | 'clair' }) {
  const sombre = tone === 'sombre'
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {SOCIALS.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="me noopener noreferrer"
          aria-label={`Chap.ci sur ${s.label}`}
          title={`Chap.ci sur ${s.label}`}
          className={`grid h-11 w-11 place-items-center rounded-full transition active:scale-95 ${
            sombre
              ? 'bg-white/10 text-white/75 hover:bg-white/20 hover:text-white'
              : 'border border-line2 bg-white text-gray-600 hover:bg-cream-100 hover:text-ink'
          }`}
        >
          <Logo id={s.id} className="h-[18px] w-[18px]" />
        </a>
      ))}
    </div>
  )
}
