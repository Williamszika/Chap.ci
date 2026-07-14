import { NavLink, Link, useLocation } from 'react-router-dom'
import { Home, Search, Heart, MessageSquare, User, PlusCircle } from 'lucide-react'
import { Logo } from './Logo'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'

const links = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/explorer', label: 'Explorer', icon: Search, end: false },
  { to: '/favoris', label: 'Favoris', icon: Heart, end: false },
  { to: '/messages', label: 'Messages', icon: MessageSquare, end: false },
]

/**
 * Barre de navigation supérieure — affichée uniquement sur grand écran (desktop).
 * Sur mobile, c'est la BottomNav qui s'affiche.
 */
export function TopNav() {
  const { favorites } = useApp()
  const { user } = useAuth()
  const location = useLocation()
  // Masquée sur les pages « plein écran » (formulaire, détail, conversation…).
  const hidden =
    location.pathname === '/publier' ||
    location.pathname.startsWith('/modifier/') ||
    location.pathname === '/connexion' ||
    location.pathname === '/inscription' ||
    location.pathname.startsWith('/messages/') ||
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/')
  if (hidden) return null

  return (
    <header className="sticky top-0 z-40 hidden border-b border-gray-100 bg-white/95 backdrop-blur md:block">
      <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-3 lg:gap-6 lg:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Accueil Chap.ci">
          <Logo size={30} />
        </Link>

        <nav className="flex flex-1 items-center gap-0.5 lg:gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold transition lg:px-3.5 ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
              {to === '/favoris' && favorites.length > 0 && (
                <span className="ml-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {favorites.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <Link to="/publier" className="btn-primary shrink-0 px-3 py-2 text-sm lg:px-4">
          <PlusCircle size={18} /> Publier<span className="hidden lg:inline">&nbsp;une annonce</span>
        </Link>
        <Link
          to="/compte"
          className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-1.5 pr-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 lg:pr-3.5"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-100 text-primary-600">
            <User size={16} />
          </span>
          <span className="hidden lg:inline">{user ? 'Mon compte' : 'Connexion'}</span>
        </Link>
      </div>
    </header>
  )
}
