import { BrandLogo } from './BrandLogo'
import { SOCIALS } from '../data/footerLinks'

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
          {/* mono : le logo prend la couleur du texte — lisible sur le pied
              de page sombre comme sur le plan du site, qui est clair. */}
          <BrandLogo id={s.id} mono className="h-[18px] w-[18px]" />
        </a>
      ))}
    </div>
  )
}
