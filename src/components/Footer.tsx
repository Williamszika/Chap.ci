import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Mark, Wordmark } from './Logo'
import { isNative } from '../lib/native'
import { SocialLinks } from './SocialLinks'
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

  const bandeau = (
    /* Liseré drapeau ivoirien : orange · blanc · vert.
     *
     * ⚠️ LA PREMIÈRE BANDE NE DOIT JAMAIS REVENIR À `primary`. Elle valait
     * `bg-primary-500`, qui était l'orange — et qui est devenu le VERT le
     * 30/08. Le liseré rendait alors « vert · blanc · vert », et c'est le
     * Patron qui l'a vu, sur son téléphone, en plein soleil. Le drapeau se
     * peint avec les rôles (`action` = orange, `ivoire-green` = vert), jamais
     * avec un jeton d'interface qui peut changer de teinte.
     */
    <div className="flex h-1 w-full">
      <div className="flex-1 bg-action-400" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-ivoire-green" />
    </div>
  )

  const copyright = (
    <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row">
      <p>© {year} Chap.ci — Fait avec ❤️ à Abidjan 🇨🇮</p>
      <p>Tous droits réservés</p>
    </div>
  )

  // ---------------------------------------------------------------------------
  //  APPLICATION NATIVE UNIQUEMENT : un seul lien vers le plan du site.
  //
  //  Dans l'application, le pied de page complet mesurait 1 099 pixels — plus
  //  d'un écran et demi de défilement pour dix-huit liens empilés en une colonne,
  //  au-dessus d'une barre d'onglets qui rend déjà l'essentiel accessible. On le
  //  réduit donc à un renvoi vers /plan-du-site.
  //
  //  Le SITE, lui, garde son pied de page complet — y compris consulté depuis un
  //  téléphone. Deux raisons : c'est là que les robots d'indexation passent (et
  //  Google explore en mode téléphone), et un pied de page riche est un repère
  //  attendu sur le web, où l'on n'a pas de barre d'onglets pour naviguer.
  // ---------------------------------------------------------------------------
  if (isNative) {
    return (
      <footer className="mt-8 bg-ink text-sm text-white/70">
        {bandeau}
        <div className="mx-auto max-w-[1280px] px-5 pb-24 pt-10">
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

          <SocialLinks className="mt-5" />
          <p className="mt-4 text-xs leading-relaxed text-white/55">{FOOTER_PAIEMENT}</p>
          {copyright}
        </div>
      </footer>
    )
  }

  // --- SITE WEB : pied de page complet, sur toutes les tailles d'écran --------
  return (
    <footer className="mt-8 bg-ink text-sm text-white/70">
      {bandeau}

      <div className="mx-auto max-w-[1280px] px-5 pb-24 pt-10 md:pb-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          {/* Marque */}
          <div className="lg:pr-8">
            <Link to="/" className="flex items-center gap-2">
              <Mark size={30} />
              <Wordmark className="text-lg text-white" />
            </Link>
            <p className="mt-3 max-w-xs leading-relaxed text-white/60">{FOOTER_TAGLINE}</p>
            <SocialLinks className="mt-4" />
            <p className="mt-4 text-xs text-white/55">{FOOTER_PAIEMENT}</p>
          </div>

          {FOOTER_COLS.map((c) => (
            <div key={c.title}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/50">{c.title}</p>
              <ul className="space-y-0">
                {c.links.map((l, i) => (
                  <li key={c.title + i}>
                    {/* 44 px de haut : une ligne de 17 px se rate du pouce (banc du front, 06/09/2026). */}
                    <Link to={l.to} state={l.state} className="inline-flex min-h-11 items-center text-white/70 transition hover:text-primary-400">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {copyright}
      </div>
    </footer>
  )
}
