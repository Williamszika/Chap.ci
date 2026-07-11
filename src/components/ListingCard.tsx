import { Link } from 'react-router-dom'
import { Heart, MapPin, BadgeCheck, Truck, Navigation } from 'lucide-react'
import type { Listing } from '../types'
import { priceLabel } from '../lib/format'
import { locationLabel } from '../data/locations'
import { useApp } from '../store/AppContext'
import { useGeo } from '../store/GeoContext'
import { haversineKm, formatDistance } from '../lib/geo'

export function ListingCard({ listing }: { listing: Listing }) {
  const { isFavorite, toggleFavorite } = useApp()
  const { position } = useGeo()
  const fav = isFavorite(listing.id)

  const distance =
    position && listing.lat != null && listing.lng != null
      ? haversineKm(position, { lat: listing.lat, lng: listing.lng })
      : null

  return (
    <Link
      to={`/annonce/${listing.id}`}
      className="card group block overflow-hidden transition active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="h-full w-full object-cover"
        />
        {listing.featured && (
          <span className="absolute left-2 top-2 rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
            À la une
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(listing.id)
          }}
          className="absolute right-2 top-2 rounded-full bg-white p-1.5 shadow-sm transition active:scale-90"
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            size={18}
            className={fav ? 'fill-red-500 text-red-500' : 'text-gray-600'}
          />
        </button>
      </div>

      <div className="p-2.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-gray-800">
          {listing.title}
        </p>
        <p className="mt-1 text-[15px] font-extrabold text-primary-600">
          {priceLabel(listing.price, listing.negotiable)}
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">
            {listing.commune ?? locationLabel(listing.regionId, listing.cityId, listing.commune)}
          </span>
        </div>
        {distance != null && (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700">
            <Navigation size={10} /> {formatDistance(distance)}
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          {listing.condition === 'neuf' && (
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              <BadgeCheck size={11} /> Neuf
            </span>
          )}
          {listing.delivery && (
            <span className="inline-flex items-center gap-0.5 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
              <Truck size={11} /> Livraison
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
