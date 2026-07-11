import { Link, useNavigate } from 'react-router-dom'
import {
  PlusCircle,
  Package,
  Heart,
  Trash2,
  Smartphone,
  ShieldCheck,
  Info,
  ChevronRight,
  MapPin,
  Gift,
  LogIn,
  LogOut,
  UserCircle,
  MessageSquare,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { priceLabel } from '../lib/format'
import { locationLabel } from '../data/locations'
import { useLocalStorage } from '../lib/useLocalStorage'

export function Profile() {
  const navigate = useNavigate()
  const { listings, favorites, deleteListing, resetDemo, isMine } = useApp()
  const { user, enabled, signOut } = useAuth()
  const [seller] = useLocalStorage('chapci.seller.v1', { name: '', phone: '' })

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    seller.name ||
    user?.email?.split('@')[0] ||
    ''

  const myListings = listings.filter((l) => isMine(l.id))

  return (
    <div className="min-h-screen">
      {/* En-tête profil */}
      <header className="safe-top bg-gradient-to-b from-primary-500 to-primary-600 px-4 pb-6 pt-5 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-2xl font-black">
            {(displayName || 'C').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black">{displayName || 'Bienvenue 👋'}</p>
            <p className="truncate text-sm text-white/85">
              {user?.email || seller.phone || 'Publiez votre première annonce'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/20 p-3 text-center">
            <p className="text-2xl font-black">{myListings.length}</p>
            <p className="text-xs text-white/85">Mes annonces</p>
          </div>
          <div className="rounded-2xl bg-white/20 p-3 text-center">
            <p className="text-2xl font-black">{favorites.length}</p>
            <p className="text-xs text-white/85">Favoris</p>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-4 py-5">
        <button onClick={() => navigate('/publier')} className="btn-primary w-full py-3.5 text-base">
          <PlusCircle size={20} /> Publier une annonce
        </button>

        {/* Compte utilisateur */}
        {enabled &&
          (user ? (
            <section className="card flex items-center gap-3 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <UserCircle size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">Connecté</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 active:scale-95"
              >
                <LogOut size={15} /> Déconnexion
              </button>
            </section>
          ) : (
            <button
              onClick={() => navigate('/connexion')}
              className="btn-outline w-full py-3.5 text-base"
            >
              <LogIn size={20} /> Se connecter / Créer un compte
            </button>
          ))}

        {/* Mes annonces */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-gray-900">
            <Package size={18} /> Mes annonces
          </h2>
          {myListings.length === 0 ? (
            <div className="card p-5 text-center text-sm text-gray-500">
              Vous n’avez pas encore d’annonce. Appuyez sur « Publier » pour commencer à vendre !
            </div>
          ) : (
            <div className="space-y-2">
              {myListings.map((l) => (
                <div key={l.id} className="card flex items-center gap-3 p-2.5">
                  <Link to={`/annonce/${l.id}`} className="flex flex-1 items-center gap-3">
                    <img
                      src={l.images[0]}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{l.title}</p>
                      <p className="text-sm font-bold text-primary-600">
                        {priceLabel(l.price, l.negotiable)}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-gray-400">
                        <MapPin size={11} />
                        {locationLabel(l.regionId, l.cityId, l.commune)}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={async () => {
                      if (!confirm('Supprimer cette annonce ?')) return
                      try {
                        await deleteListing(l.id)
                      } catch {
                        alert('Suppression impossible : vous devez être le propriétaire connecté.')
                      }
                    }}
                    className="grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Liens rapides */}
        <section className="card divide-y divide-gray-100 overflow-hidden">
          <Row to="/messages" icon={<MessageSquare size={18} className="text-sky-500" />} label="Mes messages" />
          <Row to="/favoris" icon={<Heart size={18} className="text-red-500" />} label="Mes favoris" />
          <Row to="/explorer" icon={<Package size={18} className="text-primary-500" />} label="Parcourir les annonces" />
          <Row to="/don" icon={<Gift size={18} className="text-ivoire-green" />} label="Soutenir Chap.ci (faire un don)" />
        </section>

        {/* Installer l'app */}
        <section className="rounded-2xl bg-primary-50 p-4">
          <p className="mb-1 flex items-center gap-2 text-sm font-bold text-primary-800">
            <Smartphone size={18} /> Installer l’application
          </p>
          <p className="text-xs leading-relaxed text-primary-700">
            <strong>iPhone :</strong> ouvrez ce site dans Safari, appuyez sur « Partager » puis
            « Sur l’écran d’accueil ».<br />
            <strong>Android :</strong> ouvrez dans Chrome, menu ⋮ puis « Installer l’application ».
          </p>
        </section>

        {/* À propos */}
        <section className="card divide-y divide-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <ShieldCheck size={18} className="text-emerald-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Achetez en toute sécurité</p>
              <p className="text-xs text-gray-500">Rencontres publiques, paiement à la livraison.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Info size={18} className="text-sky-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Chap.ci</p>
              <p className="text-xs text-gray-500">
                La marketplace 100% ivoirienne · v1.0
              </p>
            </div>
          </div>
        </section>

        {/* Réinitialiser la démo */}
        <button
          onClick={() => {
            if (confirm('Réinitialiser toutes vos données locales (annonces, favoris) ?')) resetDemo()
          }}
          className="w-full text-center text-sm text-gray-400"
        >
          Réinitialiser les données de démonstration
        </button>
      </div>
    </div>
  )
}

function Row({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50">
      {icon}
      <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
      <ChevronRight size={18} className="text-gray-300" />
    </Link>
  )
}
