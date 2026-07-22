import { Link, useLocation } from 'react-router-dom'
import { Mark, Wordmark } from './Logo'

const cols: { title: string; links: { to: string; label: string; state?: unknown }[] }[] = [
  {
    title: 'Explorer',
    links: [
      { to: '/explorer', label: 'Toutes les annonces' },
      { to: '/?voir=categories', label: 'Catégories' },
      { to: '/explorer?tri=distance', label: 'Près de moi' },
      { to: '/explorer?promo=1', label: 'Bons plans' },
    ],
  },
  {
    title: 'Vendre',
    links: [
      // Libellés alignés sur le CONTENU réel des destinations.
      { to: '/publier', label: 'Publier une annonce' },
      { to: '/publicite', label: 'Faire de la publicité' },
      { to: '/aide?rubrique=vendre', label: 'Conseils vendeur' },
      { to: '/compte', label: 'Tableau de bord pro', state: { tab: 'ventes' } },
      { to: '/compte', label: 'Mes annonces', state: { tab: 'annonces' } },
    ],
  },
  {
    title: 'Aide',
    links: [
      { to: '/aide', label: 'Questions fréquentes' },
      { to: '/aide?rubrique=securite', label: 'Conseils de sécurité' },
      { to: '/contact?sujet=signaler', label: 'Signaler un problème' },
      { to: '/contact', label: 'Nous contacter' },
    ],
  },
  {
    title: 'Chap.ci',
    links: [
      { to: '/a-propos', label: 'À propos' },
      { to: '/confidentialite', label: 'RGPD' },
      { to: '/conditions', label: 'CGU' },
      { to: '/contact?sujet=partenariat', label: 'Partenariat & presse' },
    ],
  },
]

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
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          {/* Marque */}
          <div className="lg:pr-8">
            <Link to="/" className="flex items-center gap-2">
              <Mark size={30} />
              <Wordmark className="text-lg text-white" />
            </Link>
            <p className="mt-3 max-w-xs leading-relaxed text-white/60">
              La marketplace 100 % ivoirienne. Achetez et vendez chap-chap, partout en Côte d’Ivoire — en toute
              sécurité.
            </p>
            <p className="mt-4 text-xs text-white/55">Paiement : Orange Money · Wave</p>
          </div>

          {cols.map((c) => (
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
