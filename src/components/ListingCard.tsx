import { useState } from 'react'
import { mediaUrl, thumbUrl } from '../lib/native'
import { Link } from 'react-router-dom'
import { Heart, MapPin, BadgeCheck, Truck, Store } from 'lucide-react'
import { VerifiedBadge } from './VerifiedBadge'
import type { Listing } from '../types'
import { formatFCFA } from '../lib/format'
import { placeholderImage, emojiFor } from '../lib/placeholder'
import { locationLabel } from '../data/locations'
import { useApp } from '../store/AppContext'
import { useGeo } from '../store/GeoContext'
import { haversineKm, formatDistance } from '../lib/geo'
import { activePromo } from '../lib/promo'
import { PromoTag } from './PromoTag'

/**
 * Une carte d'annonce.
 *
 * `rang` = sa position dans la grille. Il ne sert qu'à une chose, mais elle
 * compte : décider si la vignette part TOUT DE SUITE ou attend le défilement.
 * Voir plus bas, sur l'attribut `loading`.
 */
export function ListingCard({ listing, rang = 99, dansBoutique = false }: {
  listing: Listing
  rang?: number
  /**
   * On est DÉJÀ sur la page de cette boutique : répéter son nom sur chacune
   * des dix cartes ne renseigne personne, ça encombre. Le nom sert à
   * reconnaître un vendeur AILLEURS — dans l'accueil, dans la recherche.
   */
  dansBoutique?: boolean
}) {
  const { isFavorite, toggleFavorite } = useApp()
  const { position } = useGeo()
  const fav = isFavorite(listing.id)
  const [pop, setPop] = useState(false)

  const distance =
    position && listing.lat != null && listing.lng != null
      ? haversineKm(position, { lat: listing.lat, lng: listing.lng })
      : null
  // On n'affiche la distance que si elle est pertinente (proche). Sinon rien.
  const near = distance != null && distance < 500
  const isFree = listing.price === 0
  const promo = activePromo(listing)
  // Image de secours si l'annonce n'a pas de photo (données importées/seed) ou si
  // l'URL est cassée : évite l'icône « image brisée » du navigateur.
  const fallbackImg = placeholderImage(listing.id, emojiFor(listing.categoryId, listing.subcategory), listing.subcategory)

  return (
    <Link
      to={`/annonce/${listing.id}`}
      className="card group block overflow-hidden transition duration-200 active:scale-[0.98] md:hover:-translate-y-0.5 md:hover:shadow-card-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {/* Les premières vignettes ne se chargent PAS en différé.
​
            « loading=lazy » sur une image déjà visible ne fait économiser aucun
            octet : le navigateur la télécharge de toute façon dès qu'il calcule
            la mise en page. Le seul effet est de la RETARDER d'une passe.

            Mesuré au navigateur sur /explorer avec les vraies annonces :
              mobile 390 px  — LCP 92 ms, sur un texte : les vignettes ne sont
                               pas en cause, le différé ne coûte rien.
              tablette 820   — LCP 880 ms, et l'élément LCP est justement une
                               vignette en « lazy ».
              bureau 1280    — LCP 696 ms, même cause.

            Les SIX premières partent donc sans différé, et la toute première en
            priorité haute. Six, parce que c'est le nombre de cartes qui tiennent
            dans un premier écran : six sur un mobile 390 px (deux colonnes,
            trois rangées), et la grille entière sur tablette et bureau. Au-delà,
            le différé reprend et fait, lui, une vraie économie — c'est ce qui
            compte sur un forfait à Abidjan.

            À quatre, le LCP tombait encore sur une vignette différée en
            tablette : les sept cartes y tenaient dans l'écran.

            `rang` vient de la grille. Sa valeur par défaut (99) garde le
            comportement différé partout où l'appelant ne le passe pas. */}
        <img
          src={mediaUrl(thumbUrl(listing.images[0])) || fallbackImg}
          alt={listing.title}
          loading={rang < 6 ? 'eager' : 'lazy'}
          fetchPriority={rang === 0 ? 'high' : undefined}
          className="h-full w-full object-cover"
          onError={(e) => {
            const img = e.currentTarget
            // Vignette absente (ancienne photo) → image pleine ; puis remplacement.
            if (img.src.includes('_min.jpg')) {
              img.src = mediaUrl(listing.images[0]) || fallbackImg
            } else if (img.src !== fallbackImg) {
              img.src = fallbackImg
            }
          }}
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {promo && <PromoTag percent={promo.percent} height={20} />}
          {listing.featured && !listing.sold && (
            <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              À la une
            </span>
          )}
        </div>
        {listing.sold && (
          <div className="absolute inset-0 grid place-items-center bg-black/45">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-gray-800 shadow">
              Vendu
            </span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(listing.id)
            setPop(true)
            window.setTimeout(() => setPop(false), 320)
          }}
          className="absolute right-0.5 top-0.5 grid h-11 w-11 place-items-center transition active:scale-90"
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <span className={`grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm ${pop ? 'animate-[heartpop_320ms_ease-out]' : ''}`}>
            <Heart
              size={17}
              className={fav ? 'fill-red-500 text-red-500' : 'text-gray-600'}
            />
          </span>
        </button>
        {/* Badges confiance / état / livraison, en surimpression bas de l'image */}
        <div className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-1">
          {/* Vert : le vendeur est là depuis au moins six mois. C'est le seul
              badge qu'un vendeur puisse porter — le bleu est réservé à l'équipe
              du site, précisément pour qu'on ne puisse pas l'usurper. */}
          {listing.sellerVerified && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-ivoire-green-dark shadow-sm">
              <VerifiedBadge kind="anciennete" size={11} /> Vérifié
            </span>
          )}
          {listing.condition === 'neuf' && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-ivoire-green-dark shadow-sm">
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
              <span className="tnum whitespace-nowrap text-[16px] font-black text-red-600">
                {formatFCFA(promo.price)}
              </span>
              <span className="tnum text-[11px] text-gray-500 line-through">
                {formatFCFA(promo.original)}
              </span>
            </>
          ) : (
            <>
              <span className={`tnum whitespace-nowrap font-display text-[16px] font-extrabold ${isFree ? 'text-ivoire-green' : 'text-primary-700'}`}>
                {isFree ? 'Gratuit' : formatFCFA(listing.price)}
              </span>
              {listing.negotiable && !isFree && (
                <span className="text-[10px] font-medium text-gray-500">négociable</span>
              )}
            </>
          )}
        </div>
        <p className="mt-1 line-clamp-2 min-h-[2.25rem] text-[13px] font-medium leading-snug text-gray-700">
          {listing.title}
        </p>
        {/* LE NOM DE LA BOUTIQUE (choix du Patron, 28/08 — option 3).
            On nomme le vendeur au lieu de l'étiqueter « PRO » : un nom se
            reconnaît d'une annonce à l'autre, une étiquette non. Et le
            particulier ne perd rien — il n'a pas d'enseigne, il a simplement
            une ligne de moins, pas une marque en moins. */}
        {listing.sellerEnseigne && !dansBoutique && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-primary-700">
            <Store size={11} className="shrink-0" />
            <span className="truncate">{listing.sellerEnseigne}</span>
          </p>
        )}
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
