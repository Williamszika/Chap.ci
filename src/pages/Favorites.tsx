import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { ListingCard } from '../components/ListingCard'

export function Favorites() {
  const { listings, favorites } = useApp()
  const favListings = favorites
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l))

  return (
    <div className="min-h-screen">
      <header className="safe-top px-4 pb-2 pt-5 md:px-6 md:pt-7">
        <h1 className="font-display text-2xl font-extrabold text-gray-900 md:text-[28px]">Mes favoris</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {favListings.length} annonce{favListings.length > 1 ? 's' : ''} sauvegardée
          {favListings.length > 1 ? 's' : ''}
        </p>
      </header>

      {favListings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-red-50">
            <Heart size={36} className="text-red-400" />
          </div>
          <p className="text-lg font-bold text-gray-800">Aucun favori pour l’instant</p>
          <p className="max-w-xs text-sm text-gray-500">
            Appuyez sur le ❤️ des annonces qui vous intéressent pour les retrouver ici.
          </p>
          <Link to="/explorer" className="btn-primary mt-2">
            Explorer les annonces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-3 md:gap-4 md:px-6 lg:grid-cols-4 lg:gap-5">
          {favListings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  )
}
