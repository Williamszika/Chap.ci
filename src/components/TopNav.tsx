import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Search, Heart, MessageSquare, User, PlusCircle, ChevronDown,
  Package, ShoppingBag, Store, Bell, ShieldCheck, HelpCircle, Settings,
  LogOut, LogIn, UserPlus,
} from 'lucide-react'
import { Logo } from './Logo'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { useIsAdmin } from '../lib/useIsAdmin'

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
  const location = useLocation()
  // Masquée sur les pages « plein écran » (formulaire, détail…). NB : la barre
  // n'apparaît de toute façon qu'à partir de md (`hidden md:block`) ; on la garde
  // donc sur la conversation `/messages/:id` pour l'affichage 2 volets ordinateur
  // (elle reste invisible sur mobile, où le chat est en plein écran).
  const hidden =
    location.pathname === '/publier' ||
    location.pathname.startsWith('/modifier/') ||
    location.pathname === '/connexion' ||
    location.pathname === '/inscription' ||
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/')
  if (hidden) return null

  return (
    <header className="sticky top-0 z-40 hidden border-b border-[#EFE6D7] bg-[#FFF6EA]/85 backdrop-blur-md md:block">
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

        <AccountMenu />
      </div>
    </header>
  )
}

/** Menu déroulant du compte : options de navigation + déconnexion. */
function AccountMenu() {
  const { user, signOut } = useAuth()
  const { favorites } = useApp()
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fermer au clic extérieur et avec la touche Échap.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Fermer quand on change de page.
  useEffect(() => { setOpen(false) }, [location.pathname, location.state])

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) || user?.email?.split('@')[0] || 'Mon compte'
  const initial = displayName.charAt(0).toUpperCase()
  const close = () => setOpen(false)

  async function logout() {
    close()
    try { await signOut() } catch { /* ignore */ }
    navigate('/')
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full border py-1.5 pl-1.5 pr-1.5 text-sm font-semibold transition lg:pr-3 ${
          open ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-[#E6DAC6] text-gray-700 hover:bg-cream-100'
        }`}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
          {user ? initial : <User size={16} />}
        </span>
        <span className="hidden max-w-[7rem] truncate lg:inline">{user ? 'Mon compte' : 'Connexion'}</span>
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 max-h-[75vh] w-72 overflow-y-auto overscroll-contain rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl"
        >
          {user ? (
            <>
              <Link to="/compte" onClick={close} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-100 font-bold text-primary-600">
                  {initial}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-gray-900">{displayName}</span>
                  <span className="block truncate text-xs text-gray-500">{user.email}</span>
                </span>
              </Link>
              <Divider />
              <Item to="/compte" state={{ tab: 'annonces' }} icon={<Package size={17} />} label="Mes annonces" onClick={close} />
              <Item to="/compte" state={{ tab: 'achats' }} icon={<ShoppingBag size={17} />} label="Mes achats" onClick={close} />
              <Item to="/compte" state={{ tab: 'ventes' }} icon={<Store size={17} />} label="Mes ventes" onClick={close} />
              <Item to="/compte" state={{ tab: 'params' }} icon={<Bell size={17} />} label="Mes alertes" onClick={close} />
              <Divider />
              <Item to="/favoris" icon={<Heart size={17} />} label="Favoris" badge={favorites.length} onClick={close} />
              <Item to="/messages" icon={<MessageSquare size={17} />} label="Messages" onClick={close} />
              <Item to="/publier" icon={<PlusCircle size={17} />} label="Publier une annonce" onClick={close} />
              {isAdmin && (
                <>
                  <Divider />
                  <Item to="/admin" icon={<ShieldCheck size={17} />} label="Tableau de bord admin" accent onClick={close} />
                </>
              )}
              <Divider />
              <Item to="/aide" icon={<HelpCircle size={17} />} label="Aide & FAQ" onClick={close} />
              <Item to="/compte" state={{ tab: 'params' }} icon={<Settings size={17} />} label="Paramètres" onClick={close} />
              <Divider />
              <button
                onClick={logout}
                role="menuitem"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={17} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <div className="px-4 py-2.5">
                <p className="text-sm font-bold text-gray-900">Bienvenue sur Chap.ci 👋</p>
                <p className="text-xs text-gray-500">Connectez-vous pour vendre, acheter et discuter.</p>
              </div>
              <Divider />
              <Item to="/connexion" icon={<LogIn size={17} />} label="Se connecter" onClick={close} />
              <Item to="/inscription" icon={<UserPlus size={17} />} label="Créer un compte" accent onClick={close} />
              <Divider />
              <Item to="/favoris" icon={<Heart size={17} />} label="Favoris" badge={favorites.length} onClick={close} />
              <Item to="/publier" icon={<PlusCircle size={17} />} label="Publier une annonce" onClick={close} />
              <Item to="/aide" icon={<HelpCircle size={17} />} label="Aide & FAQ" onClick={close} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Divider() {
  return <div className="my-1 border-t border-gray-100" />
}

function Item({
  to, state, icon, label, badge, accent, onClick,
}: {
  to: string
  state?: unknown
  icon: React.ReactNode
  label: string
  badge?: number
  accent?: boolean
  onClick?: () => void
}) {
  return (
    <Link
      to={to}
      state={state}
      onClick={onClick}
      role="menuitem"
      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50 ${
        accent ? 'text-primary-700' : 'text-gray-700'
      }`}
    >
      <span className={accent ? 'text-primary-600' : 'text-gray-400'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}
