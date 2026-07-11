import { Link } from 'react-router-dom'
import { Heart, MapPin, BadgeCheck, Truck } from 'lucide-react'
import type { Listing } from '../types'
import { formatPrice } from '../lib/format'
import { locationLabel } from '../data/locations'
import { useApp } from '../store/AppContext'
import { useGeo } from '../store/GeoContext'
import { haversineKm, formatDistance } from '../lib/geo'
import { activePromo } from '../lib/promo'
import { PromoTag } from './PromoTag'

export function ListingCard({ listing }: { listing: Listing }) {
  const { isFavorite, toggleFavorite } = useApp()
  const { position } = useGeo()
  const fav = isFavorite(listing.id)

  const distance =
    position && listing.lat != null && listing.lng != null
      ? haversineKm(position, { lat: listing.lat, lng: listing.lng })
      : null
  // On n'affiche la distance que si elle est pertinente (proche). Sinon rien.
  const near = distance != null && distance < 500
  const isFree = listing.price === 0
  const promo = activePromo(listing)

  return (
    <Link
      to={`/annonce/${listing.id}`}
      className="card group block overflow-hidden transition active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {promo && <PromoTag percent={promo.percent} height={20} />}
          {listing.featured && (
            <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              À la une
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(listing.id)
          }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm transition active:scale-90"
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            size={17}
            className={fav ? 'fill-red-500 text-red-500' : 'text-gray-600'}
          />
        </button>
        {/* Badges état / livraison, en surimpression bas de l'image */}
        <div className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-1">
          {listing.condition === 'neuf' && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm">
              <BadgeCheck size={11} /> Neuf
            </span>
          )}
          {listing.delivery && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 shadow-sm">
              <Truck size={11} /> Livraison
            </span>
          )}
        </div>
      </div>

      <div className="p-2.5">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          {promo ? (
            <>
              <span className="whitespace-nowrap text-[16px] font-black text-red-600">
                {formatPrice(promo.price)} FCFA
              </span>
              <span className="text-[11px] text-gray-400 line-through">
                {formatPrice(promo.original)} FCFA
              </span>
            </>
          ) : (
            <>
              <span className="whitespace-nowrap text-[16px] font-black text-primary-600">
                {isFree ? 'Gratuit' : `${formatPrice(listing.price)} FCFA`}
              </span>
              {listing.negotiable && !isFree && (
                <span className="text-[10px] font-medium text-gray-400">négociable</span>
              )}
            </>
          )}
        </div>
        <p className="mt-1 line-clamp-2 min-h-[2.25rem] text-[13px] font-medium leading-snug text-gray-700">
          {listing.title}
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">
            {listing.commune ?? locationLabel(listing.regionId, listing.cityId, listing.commune)}
          </span>
          {near && (
            <span className="shrink-0 font-semibold text-primary-600">· {formatDistance(distance!)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
