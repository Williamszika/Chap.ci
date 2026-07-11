import { NavLink, useLocation } from 'react-router-dom'
import { Home, Search, PlusCircle, Heart, User } from 'lucide-react'
import { useApp } from '../store/AppContext'

const items = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/explorer', label: 'Explorer', icon: Search, end: false },
  { to: '/publier', label: 'Publier', icon: PlusCircle, center: true, end: false },
  { to: '/favoris', label: 'Favoris', icon: Heart, end: false },
  { to: '/compte', label: 'Compte', icon: User, end: false },
]

export function BottomNav() {
  const { favorites } = useApp()
  const location = useLocation()

  // Masquée sur les pages plein écran
  const hidden =
    location.pathname.startsWith('/annonce/') ||
    location.pathname === '/publier' ||
    location.pathname === '/don' ||
    location.pathname === '/connexion' ||
    location.pathname.startsWith('/messages/')
  if (hidden) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app border-t border-gray-100 bg-white/95 shadow-nav backdrop-blur safe-bottom">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, center, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
                center ? 'text-primary-600' : isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon
                    size={center ? 30 : 23}
                    className={center ? 'text-primary-500' : ''}
                    strokeWidth={isActive || center ? 2.4 : 2}
                    fill={center ? 'currentColor' : 'none'}
                  />
                  {to === '/favoris' && favorites.length > 0 && (
                    <span className="absolute -right-2 -top-1 min-w-[16px] rounded-full bg-red-500 px-1 text-center text-[9px] font-bold text-white">
                      {favorites.length}
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
