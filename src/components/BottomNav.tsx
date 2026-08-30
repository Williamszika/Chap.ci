import { NavLink, useLocation } from 'react-router-dom'
import { Home, Search, PlusCircle, Heart, User, Plus } from 'lucide-react'
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
    location.pathname.startsWith('/modifier/') ||
    location.pathname === '/don' ||
    location.pathname === '/connexion' ||
    location.pathname === '/inscription' ||
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/') ||
    location.pathname.startsWith('/messages/') ||
    location.pathname.startsWith('/vendeur/')
  if (hidden) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app border-t border-gray-100 bg-white shadow-nav safe-bottom md:hidden">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, center, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
                center ? 'text-action-700' : isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  {/* LE BOUTON CENTRAL — le « + » se voyait-il ? Non.
                      `PlusCircle` dessine un cercle ET une croix, tous deux en
                      `currentColor` ; le remplir de cette même couleur peignait
                      donc la croix sur elle-même. Le rond était plein, le signe
                      « + » invisible. Le défaut existait déjà en orange — il
                      s'est simplement vu au moment de repeindre en vert.
                      On dessine donc le disque à part, et la croix EN BLANC. */}
                  {center ? (
                    <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-action-500 text-white">
                      <Plus size={19} strokeWidth={3} />
                    </span>
                  ) : (
                    <Icon
                      size={23}
                      strokeWidth={isActive ? 2.4 : 2}
                      fill="none"
                    />
                  )}
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
