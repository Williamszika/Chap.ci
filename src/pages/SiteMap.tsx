import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Mark, Wordmark } from '../components/Logo'
import { SocialLinks } from '../components/SocialLinks'
import { FOOTER_COLS, FOOTER_TAGLINE, FOOTER_PAIEMENT } from '../data/footerLinks'

/**
 * « Plan du site » — tous les liens du pied de page, sur une page à eux.
 *
 * Pourquoi cette page existe : sur un téléphone, le pied de page complet
 * mesurait 1 099 pixels, soit plus d'un écran et demi de défilement pour dix-huit
 * liens empilés en une colonne. Personne ne lit ça. Sur téléphone et tablette, le
 * pied de page se réduit donc à un seul lien — celui-ci — et l'utilisateur qui
 * cherche vraiment quelque chose arrive sur une page faite pour être parcourue.
 *
 * Les cibles tactiles font ici toute la largeur, contre un simple mot souligné
 * dans l'ancien pied de page.
 */
export function SiteMap() {
  return (
    <div className="pb-10">
      <section className="bg-[linear-gradient(160deg,#FFF6EC,#FFFDF9)] px-5 py-9 text-center md:-mx-6 md:py-12">
        <Link to="/" className="inline-flex items-center gap-2" aria-label="Accueil Chap.ci">
          <Mark size={32} />
          <Wordmark className="text-xl text-ink" />
        </Link>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-[26px] font-extrabold leading-[1.1] tracking-tight text-ink md:text-[32px]">
          Plan du site
        </h1>
        <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-[#57534E]">
          {FOOTER_TAGLINE}
        </p>
      </section>

      <div className="mx-auto max-w-3xl px-5">
        {FOOTER_COLS.map((c) => (
          <section key={c.title} className="mt-8">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{c.title}</h2>
            <ul className="overflow-hidden rounded-2xl border border-line bg-white">
              {c.links.map((l, i) => (
                <li key={c.title + i} className={i > 0 ? 'border-t border-line' : ''}>
                  <Link
                    to={l.to}
                    state={l.state}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 text-[15px] font-medium text-ink transition active:bg-cream-100"
                  >
                    {l.label}
                    <ChevronRight size={18} className="shrink-0 text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Comptes officiels — sur téléphone, ce plan tient lieu de pied de page :
            s'ils n'apparaissent pas ici, ils n'apparaissent nulle part dans
            l'application. */}
        <section className="mt-8">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Suivez Chap.ci</h2>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5">
            <SocialLinks tone="clair" />
            <p className="text-[13px] leading-snug text-gray-500">
              Nos bons plans et les nouvelles annonces, chaque semaine.
            </p>
          </div>
        </section>

        <p className="mt-8 rounded-2xl bg-cream-100 px-4 py-3 text-center text-xs leading-relaxed text-gray-600">
          {FOOTER_PAIEMENT}
        </p>
      </div>
    </div>
  )
}
