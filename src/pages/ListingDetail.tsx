import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  MessageSquare,
  BadgeCheck,
  Truck,
  ShieldCheck,
  Tag,
  Clock,
  User,
  Navigation,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { useGeo } from '../store/GeoContext'
import { haversineKm, formatDistance } from '../lib/geo'
import { getOrCreateConversation } from '../lib/messages'
import { placeOrderForSeller } from '../lib/checkout'
import { fetchReviewsForListing, createReview, averageRating } from '../lib/reviews'
import { fetchPurchasedListingIds } from '../lib/orders'
import { priceLabel, timeAgo } from '../lib/format'
import { locationLabel } from '../data/locations'
import { categoryById } from '../data/categories'
import { ListingCard } from '../components/ListingCard'
import { Stars } from '../components/Stars'
import type { Review } from '../types'

export function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getListing, isFavorite, toggleFavorite, listings } = useApp()
  const { user } = useAuth()
  const { position } = useGeo()
  const listing = id ? getListing(id) : undefined

  const [imgIndex, setImgIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [purchased, setPurchased] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const listingId = listing?.id
  const sellerId = listing?.sellerId

  useEffect(() => {
    if (!listingId) return
    let active = true
    fetchReviewsForListing(listingId)
      .then((r) => active && setReviews(r))
      .catch(() => {})
    if (user) {
      fetchPurchasedListingIds(user.id)
        .then((s) => active && setPurchased(s.has(listingId)))
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [listingId, user])

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">🤔</div>
        <p className="font-semibold text-gray-700">Annonce introuvable</p>
        <p className="text-sm text-gray-500">Cette annonce a peut-être été retirée ou n’existe plus.</p>
        <Link to="/" className="btn-primary">
          Retour à l’accueil
        </Link>
      </div>
    )
  }

  const fav = isFavorite(listing.id)
  const cat = categoryById(listing.categoryId)
  const { avg, count } = averageRating(reviews)
  const isMine = user && sellerId && user.id === sellerId
  const isDemo = !sellerId // annonce de démonstration (sans compte vendeur)

  const similar = listings
    .filter((l) => l.categoryId === listing.categoryId && l.id !== listing.id)
    .slice(0, 6)

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: listing!.title, url })
      } catch {
        /* annulé */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        alert('Lien copié !')
      } catch {
        /* ignore */
      }
    }
  }

  function requireAuth(): boolean {
    if (!user) {
      navigate('/connexion')
      return false
    }
    return true
  }

  function demoNotice() {
    alert(
      'Ceci est une annonce de démonstration (exemple). Publiez votre propre annonce, ou attendez de vraies annonces pour discuter avec un vendeur.',
    )
  }

  async function buyNow() {
    if (isDemo) return demoNotice()
    if (!requireAuth() || !listing || !sellerId || !user) return
    setBusy(true)
    try {
      const convId = await placeOrderForSeller(user.id, {
        sellerId,
        sellerName: listing.sellerName,
        items: [
          {
            listingId: listing.id,
            title: listing.title,
            price: listing.price,
            image: listing.images[0],
            sellerId,
            sellerName: listing.sellerName,
          },
        ],
        total: listing.price,
      })
      navigate(`/messages/${convId}`)
    } catch {
      alert('Échec de l’envoi de la demande. Réessayez.')
      setBusy(false)
    }
  }

  async function askQuestion() {
    if (isDemo) return demoNotice()
    if (!requireAuth() || !listing || !user) return
    setBusy(true)
    try {
      const convId = await getOrCreateConversation(listing, user.id)
      navigate(`/messages/${convId}`)
    } catch {
      alert('Impossible d’ouvrir la conversation.')
      setBusy(false)
    }
  }

  async function submitReview() {
    if (!user || !listing || !sellerId) return
    setBusy(true)
    try {
      await createReview({ listingId: listing.id, sellerId, reviewerId: user.id, rating, comment: comment.trim() })
      const r = await fetchReviewsForListing(listing.id)
      setReviews(r)
      setShowReview(false)
      setComment('')
    } catch {
      alert('Vous devez avoir commandé cet article pour laisser un avis.')
    } finally {
      setBusy(false)
    }
  }

  const alreadyReviewed = user ? reviews.some((r) => r.reviewerId === user.id) : false

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Galerie */}
      <div className="relative">
        <div
          className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto bg-gray-100"
          onScroll={(e) => {
            const el = e.currentTarget
            setImgIndex(Math.round(el.scrollLeft / el.clientWidth))
          }}
        >
          {listing.images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${listing.title} — photo ${i + 1}`}
              className="h-full w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>

        <div className="safe-top absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <button
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white shadow"
            aria-label="Retour"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={share}
              className="grid h-10 w-10 place-items-center rounded-full bg-white shadow"
              aria-label="Partager"
            >
              <Share2 size={19} />
            </button>
            <button
              onClick={() => toggleFavorite(listing.id)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white shadow"
              aria-label="Favori"
            >
              <Heart size={19} className={fav ? 'fill-red-500 text-red-500' : 'text-gray-700'} />
            </button>
          </div>
        </div>

        {listing.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {listing.images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="px-4 py-4">
        <p className="text-2xl font-black text-primary-600">{priceLabel(listing.price, listing.negotiable)}</p>
        <h1 className="mt-1 text-lg font-bold leading-snug text-gray-900">{listing.title}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {listing.condition === 'neuf' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <BadgeCheck size={13} /> Neuf
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
              <Tag size={13} /> Occasion
            </span>
          )}
          {listing.delivery && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
              <Truck size={13} /> Livraison possible
            </span>
          )}
          {cat && (
            <Link
              to={`/explorer?cat=${cat.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700"
            >
              {cat.name}
              {listing.subcategory ? ` · ${listing.subcategory}` : ''}
            </Link>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={15} />
            {locationLabel(listing.regionId, listing.cityId, listing.commune)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={15} />
            {timeAgo(listing.createdAt)}
          </span>
          {position && listing.lat != null && listing.lng != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
              <Navigation size={13} />
              {formatDistance(haversineKm(position, { lat: listing.lat, lng: listing.lng }))} de vous
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mt-5">
          <h2 className="mb-1.5 text-sm font-bold text-gray-900">Description</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
            {listing.description}
          </p>
        </div>

        {/* Vendeur */}
        <Link
          to={sellerId ? `/vendeur/${sellerId}` : '#'}
          onClick={(e) => {
            if (!sellerId) e.preventDefault()
          }}
          className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card"
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-600">
            <User size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-gray-900">{listing.sellerName}</p>
            {count > 0 ? (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Stars value={avg} size={13} /> {avg.toFixed(1)} · {count} avis
              </span>
            ) : (
              <p className="text-xs text-gray-400">Vendeur sur Chap.ci</p>
            )}
          </div>
          {sellerId && <ChevronRight size={20} className="text-gray-300" />}
        </Link>

        {/* Avis */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Avis {count > 0 ? `(${count})` : ''}</h2>
            {user && purchased && !alreadyReviewed && !isMine && (
              <button onClick={() => setShowReview((s) => !s)} className="text-sm font-semibold text-primary-600">
                {showReview ? 'Annuler' : 'Laisser un avis'}
              </button>
            )}
          </div>

          {showReview && (
            <div className="mb-3 rounded-2xl border border-gray-200 p-3">
              <Stars value={rating} size={26} editable onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Décrivez votre expérience avec ce vendeur…"
                rows={3}
                className="input mt-2 resize-none text-sm"
              />
              <button onClick={submitReview} disabled={busy} className="btn-primary mt-2 w-full py-2.5 text-sm">
                Publier mon avis
              </button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun avis pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 4).map((r) => (
                <div key={r.id} className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">{r.reviewerName}</span>
                    <Stars value={r.rating} size={13} />
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                  <p className="mt-1 text-[11px] text-gray-400">{timeAgo(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sécurité */}
        <div className="mt-5 rounded-2xl bg-amber-50 p-4">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-amber-800">
            <ShieldCheck size={16} /> Achetez en toute sécurité
          </p>
          <ul className="ml-1 list-disc space-y-0.5 pl-4 text-xs text-amber-700">
            <li>Échangez uniquement via la messagerie de Chap.ci.</li>
            <li>Rencontrez le vendeur dans un lieu public, ou privilégiez le paiement à la livraison.</li>
            <li>Vérifiez le produit avant de payer.</li>
          </ul>
        </div>

        {/* Similaires */}
        {similar.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-base font-bold text-gray-900">Annonces similaires</h2>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
              {similar.map((l) => (
                <div key={l.id} className="w-40 shrink-0">
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barre d'action fixe */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app border-t border-gray-100 bg-white px-4 py-3 shadow-nav safe-bottom">
        {isMine ? (
          <Link to="/compte" className="btn-outline w-full py-3">
            Gérer mon annonce
          </Link>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button onClick={buyNow} disabled={busy} className="btn-outline flex-1">
                <ShoppingBag size={18} /> {busy ? '…' : 'Acheter'}
              </button>
              <button onClick={askQuestion} disabled={busy} className="btn-primary flex-[1.7]">
                <MessageSquare size={18} /> Contacter le vendeur
              </button>
            </div>
            {isDemo && (
              <p className="mt-1.5 text-center text-[11px] text-gray-400">
                Exemple de démonstration — publiez votre annonce pour recevoir de vrais messages.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
