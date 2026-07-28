import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Mark, Wordmark } from './Logo'
import { FOOTER_COLS, FOOTER_TAGLINE, FOOTER_PAIEMENT } from '../data/footerLinks'

/** Pied de page sombre (design artifact) — masqué sur les écrans « plein écran ». */
export function Footer() {
  const { pathname } = useLocation()
  const hidden =
    pathname === '/publier' ||
    pathname.startsWith('/modifier/') ||
    pathname === '/connexion' ||
    pathname === '/inscription' ||
    pathname === '/nouveau-mot-de-passe' ||
    pathname === '/mot-de-passe-oublie' ||
    pathname.startsWith('/messages/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  if (hidden) return null

  const year = new Date().getFullYear()

  return (
    <footer className="mt-8 bg-ink text-sm text-white/70">
      {/* Liseré drapeau ivoirien : orange · blanc · vert */}
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-primary-500" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-ivoire-green" />
      </div>

      <div className="mx-auto max-w-[1280px] px-5 pb-24 pt-10 md:pb-10">
        {/* ------------------------------------------------------------------
            TÉLÉPHONE ET TABLETTE : un seul lien vers le plan du site.

            Le pied de page complet mesurait 1 099 pixels sur un écran de 412 —
            plus d'un écran et demi de défilement pour dix-huit liens en une
            colonne. Il renvoie donc vers /plan-du-site, où les mêmes liens sont
            présentés avec des cibles tactiles pleine largeur.

            Le seuil est xl (1280 px) et non lg : une tablette 10 pouces en
            paysage fait 1024 px et doit, elle aussi, recevoir la version courte.
        ------------------------------------------------------------------- */}
        <div className="xl:hidden">
          <Link to="/" className="flex items-center gap-2">
            <Mark size={30} />
            <Wordmark className="text-lg text-white" />
          </Link>
          <p className="mt-3 leading-relaxed text-white/60">{FOOTER_TAGLINE}</p>

          {/* Pas de lien vers la page où l'on se trouve déjà. */}
          {pathname !== '/plan-du-site' && (
            <Link
              to="/plan-du-site"
              className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 font-semibold text-white transition active:bg-white/10"
            >
              Plan du site — tous les liens
              <ChevronRight size={18} className="shrink-0 text-white/50" />
            </Link>
          )}

          <p className="mt-4 text-xs leading-relaxed text-white/55">{FOOTER_PAIEMENT}</p>
        </div>

        {/* ------------------------------------------------------------------
            GRAND ÉCRAN : le pied de page complet, en cinq colonnes.

            ⚠️ Il reste dans le DOM sur TOUS les formats, simplement masqué en
            CSS en dessous de xl. C'est délibéré : le lien « Supprimer mon
            compte » doit rester découvrable par un robot d'indexation, y compris
            lorsqu'il explore le site en mode téléphone — Google Play exige que ce
            chemin soit trouvable depuis le web. Le retirer du DOM sur mobile
            reviendrait à le cacher au robot le plus important.
        ------------------------------------------------------------------- */}
        <div className="hidden gap-8 xl:grid xl:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          {/* Marque */}
          <div className="xl:pr-8">
            <Link to="/" className="flex items-center gap-2">
              <Mark size={30} />
              <Wordmark className="text-lg text-white" />
            </Link>
            <p className="mt-3 max-w-xs leading-relaxed text-white/60">{FOOTER_TAGLINE}</p>
            <p className="mt-4 text-xs text-white/55">{FOOTER_PAIEMENT}</p>
          </div>

          {FOOTER_COLS.map((c) => (
            <div key={c.title}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/50">{c.title}</p>
              <ul className="space-y-2">
                {c.links.map((l, i) => (
                  <li key={c.title + i}>
                    <Link to={l.to} state={l.state} className="text-white/70 transition hover:text-primary-400">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row">
          <p>© {year} Chap.ci — Fait avec ❤️ à Abidjan 🇨🇮</p>
          <p>Tous droits réservés</p>
        </div>
      </div>
    </footer>
  )
}
