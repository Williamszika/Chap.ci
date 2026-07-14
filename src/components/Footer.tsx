import { Link, useLocation } from 'react-router-dom'
import { Mark, Wordmark } from './Logo'

const cols: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: 'Chap.ci',
    links: [
      { to: '/a-propos', label: 'Présentation' },
      { to: '/contact', label: 'Nous contacter' },
      { to: '/don', label: 'Nous soutenir' },
    ],
  },
  {
    title: 'Explorer',
    links: [
      { to: '/explorer', label: 'Toutes les annonces' },
      { to: '/publier', label: 'Publier une annonce' },
      { to: '/favoris', label: 'Mes favoris' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { to: '/conditions', label: 'Conditions d’utilisation' },
      { to: '/confidentialite', label: 'Confidentialité (RGPD)' },
    ],
  },
]

/** Pied de page — masqué sur les écrans « plein écran » (formulaires, chat…). */
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
    <footer className="mt-6 border-t border-gray-100 bg-white px-5 pb-24 pt-8 text-sm lg:pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marque */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Mark size={30} />
              <Wordmark className="text-lg text-ink" />
            </Link>
            <p className="mt-2 max-w-xs text-gray-500">
              Le site de petites annonces 100 % ivoirien. Achetez et vendez chap-chap partout en Côte d’Ivoire 🇨🇮
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <p className="mb-2 font-bold text-gray-800">{c.title}</p>
              <ul className="space-y-1.5">
                {c.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-gray-500 transition hover:text-primary-600">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-gray-100 pt-5 text-xs text-gray-400 sm:flex-row">
          <p>© {year} Chap.ci — Tous droits réservés</p>
          <p>Fait avec ❤️ en Côte d’Ivoire 🇨🇮</p>
        </div>
      </div>
    </footer>
  )
}
