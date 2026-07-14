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
      <header className="safe-top bg-white px-4 pb-3 pt-4 shadow-sm">
        <h1 className="text-xl font-black text-gray-900">Mes favoris</h1>
        <p className="text-sm text-gray-500">
          {favListings.length} annonce{favListings.length > 1 ? 's' : ''} enregistrée
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
        <div className="grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {favListings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  )
}
